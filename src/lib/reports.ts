import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { classifyReport } from '@/lib/gemini'
import { findMatchingNgo, locationToGeohash } from '@/lib/geo'
import type { LatLng, Report } from '@/types'

export interface CreateReportInput {
  reporterUid: string
  description?: string
  photoDataUrl?: string
  audioBase64?: string
  audioMimeType?: 'audio/webm' | 'audio/mp4' | 'audio/wav' | 'audio/mpeg'
  location: LatLng
}

const PHOTO_DATA_URL_PREFIX = 'data:image/jpeg;base64,'

// I/O/0/1 collide visually in display fonts — swap them for clearer chars.
const HANDLE_CHAR_FIXUPS: Record<string, string> = {
  I: 'J',
  O: 'K',
  '0': '2',
  '1': '3',
}

export function generateAnonHandle(uid: string): string {
  const raw = uid.slice(0, 4).toUpperCase()
  let cleaned = ''
  for (const ch of raw) {
    cleaned += HANDLE_CHAR_FIXUPS[ch] ?? ch
  }
  return `Citizen-${cleaned}`
}

export async function createReport(input: CreateReportInput): Promise<string> {
  const reportId = doc(collection(db, 'reports')).id
  const geohash = locationToGeohash(input.location)
  const anonHandle = generateAnonHandle(input.reporterUid)
  const trimmedDescription = input.description?.trim() || null

  await setDoc(doc(db, 'reports', reportId), {
    id: reportId,
    reporterUid: input.reporterUid,
    reporterAnonHandle: anonHandle,
    description: trimmedDescription,
    photoDataUrl: input.photoDataUrl ?? null,
    location: input.location,
    geohash,
    status: 'pending',
    createdAt: serverTimestamp(),
  })

  let photoBase64: string | undefined
  let photoMimeType: 'image/jpeg' | undefined
  if (input.photoDataUrl) {
    photoBase64 = input.photoDataUrl.startsWith(PHOTO_DATA_URL_PREFIX)
      ? input.photoDataUrl.slice(PHOTO_DATA_URL_PREFIX.length)
      : input.photoDataUrl.split(',')[1] ?? input.photoDataUrl
    photoMimeType = 'image/jpeg'
  }

  const ai = await classifyReport({
    text: trimmedDescription ?? undefined,
    photoBase64,
    photoMimeType,
    audioBase64: input.audioBase64,
    audioMimeType: input.audioMimeType ?? 'audio/webm',
  })

  const ngo = await findMatchingNgo({
    location: input.location,
    category: ai.category,
  })

  const batch = writeBatch(db)
  batch.update(doc(db, 'reports', reportId), {
    ai,
    status: 'submitted',
    ngoId: ngo?.id ?? null,
    ngoName: ngo?.name ?? null,
  })

  if (ngo) {
    batch.set(doc(db, 'ngos', ngo.id, 'incoming_reports', reportId), {
      id: reportId,
      reporterUid: input.reporterUid,
      reporterAnonHandle: anonHandle,
      description: trimmedDescription,
      photoDataUrl: input.photoDataUrl ?? null,
      location: input.location,
      geohash,
      status: 'submitted',
      ai,
      ngoId: ngo.id,
      ngoName: ngo.name,
      createdAt: serverTimestamp(),
      centralReportId: reportId,
    })
  }

  await batch.commit()
  return reportId
}

export async function acceptReport(
  reportId: string,
  ngoId: string,
  ngoName: string,
): Promise<void> {
  const batch = writeBatch(db)
  const update = {
    status: 'accepted',
    ngoId,
    ngoName,
    acceptedAt: serverTimestamp(),
  }
  batch.update(doc(db, 'reports', reportId), update)
  batch.update(doc(db, 'ngos', ngoId, 'incoming_reports', reportId), update)
  await batch.commit()
}

export async function resolveReport(
  reportId: string,
  ngoId: string,
): Promise<void> {
  const batch = writeBatch(db)
  const update = {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
  }
  batch.update(doc(db, 'reports', reportId), update)
  batch.update(doc(db, 'ngos', ngoId, 'incoming_reports', reportId), update)
  await batch.commit()
}

export async function getReport(reportId: string): Promise<Report | null> {
  const snap = await getDoc(doc(db, 'reports', reportId))
  if (!snap.exists()) return null
  return snap.data() as Report
}
