import { writeBatch, doc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db, collections } from './firebase'
import { classifyReport } from './gemini'
import { findNearestNgo, getGeohash } from './geo'
import type { Report, ReportStatus, NgoProfile } from '@/types'

export interface SubmitReportInput {
  userId: string
  description: string
  location: { lat: number; lng: number; address: string }
  base64Image?: string
  base64Audio?: string
  mediaUrls: string[] // Storage URLs returned from previous upload steps
  onProgress?: (status: string) => void
}

export interface SubmitReportResult {
  reportId: string
  assignedNgo: NgoProfile | null
  aiSummary: string
  urgency: string
}

/**
 * Orchestrates the complete citizen report submission pipeline.
 * 1. Generates Geohash
 * 2. Runs Gemini Classification
 * 3. Finds nearest NGO
 * 4. Executes atomic Firestore batch write
 */
export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const { userId, description, location, base64Image, base64Audio, mediaUrls, onProgress } = input
  
  try {
    // 1. AI Classification with Retry Logic
    if (onProgress) onProgress('Analyzing situation with AI...')
    let aiClassification
    let retries = 3
    while (retries > 0) {
      try {
        aiClassification = await classifyReport({
          description,
          base64Image,
          base64Audio
        })
        break
      } catch (err) {
        retries--
        if (retries === 0) throw err
        if (onProgress) onProgress('Network glitch. Retrying AI analysis...')
        await new Promise(res => setTimeout(res, 1000))
      }
    }
    if (!aiClassification) throw new Error('AI Classification failed.')

    // 2. Geohash & NGO Matching
    if (onProgress) onProgress('Locating nearest available NGO...')
    const geohash = getGeohash(location.lat, location.lng)
    const nearestNgo = await findNearestNgo(location.lat, location.lng, aiClassification.category)

    // 3. Prepare Batch Write
    if (onProgress) onProgress('Securing report in database...')
    const batch = writeBatch(db)

    // A. Create Report Document
    const reportRef = doc(collections.reports)
    const reportId = reportRef.id

    const newReport: Omit<Report, 'id'> = {
      userId,
      category: aiClassification.category,
      urgency: aiClassification.urgency,
      status: 'submitted' as ReportStatus, // Initial state
      description,
      location: {
        ...location,
        geohash
      },
      mediaUrls,
      assignedNgoId: nearestNgo?.id || null,
      aiClassification: {
        category: aiClassification.category,
        urgency: aiClassification.urgency,
        confidence: 0.95, // Gemini doesn't return raw confidence yet, using static placeholder
        suggestedSupplies: aiClassification.suppliesNeeded
      },
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      resolvedAt: null
    }

    // Notice we use set() on the un-typed ref since converters don't mix perfectly with batch.set typing sometimes,
    // but using the raw `db` doc reference is safest.
    const rawReportRef = doc(db, 'reports', reportId)
    batch.set(rawReportRef, newReport)

    // B. Create Timeline Events
    const createTimelineEvent = (status: ReportStatus, desc: string, actor: string) => {
      const tlRef = doc(db, 'timeline_events', doc(collections.timelineEvents).id)
      batch.set(tlRef, {
        reportId,
        status,
        description: desc,
        actorId: actor,
        createdAt: serverTimestamp()
      })
    }

    createTimelineEvent('submitted', 'Report received via Pukaar citizen portal.', userId)
    createTimelineEvent('under_review', `AI Triage Complete. Classified as ${aiClassification.urgency} urgency.`, 'system')

    if (nearestNgo) {
      createTimelineEvent(
        'under_review', 
        `Matched with ${nearestNgo.organizationName} based on category and location.`, 
        'system'
      )
    }

    // 4. Commit Transaction
    await batch.commit()
    if (onProgress) onProgress('Report submitted successfully!')

    return {
      reportId,
      assignedNgo: nearestNgo,
      aiSummary: aiClassification.summary,
      urgency: aiClassification.urgency
    }

  } catch (error) {
    console.error('Submit Report Pipeline Error:', error)
    throw new Error('Failed to submit report. Please try again.')
  }
}

/**
 * NGO actions
 */
export async function acceptReport(reportId: string, ngoId: string): Promise<void> {
  const batch = writeBatch(db)
  const reportRef = doc(db, 'reports', reportId)
  
  batch.update(reportRef, { 
    status: 'dispatched',
    updatedAt: serverTimestamp()
  })

  const tlRef = doc(db, 'timeline_events', doc(collections.timelineEvents).id)
  batch.set(tlRef, {
    reportId,
    status: 'dispatched',
    description: 'Field team dispatched to location.',
    actorId: ngoId,
    createdAt: serverTimestamp()
  })

  await batch.commit()
}

export async function resolveReport(reportId: string, ngoId: string): Promise<void> {
  const batch = writeBatch(db)
  const reportRef = doc(db, 'reports', reportId)
  
  batch.update(reportRef, { 
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  const tlRef = doc(db, 'timeline_events', doc(collections.timelineEvents).id)
  batch.set(tlRef, {
    reportId,
    status: 'resolved',
    description: 'Situation resolved and confirmed by field team.',
    actorId: ngoId,
    createdAt: serverTimestamp()
  })

  await batch.commit()
}

export async function getReport(reportId: string): Promise<Report | null> {
  const snap = await getDoc(doc(collections.reports, reportId))
  return snap.exists() ? snap.data() : null
}
