// Populates Firestore with the demo NGO Connect dataset (8 NGOs, 15 help
// locations, 10 posts, 3 historical reports). Geohashes are computed at seed
// time from each item's lat/lng — never hand-author them.
//
// One-time setup:
//   1. Firebase Console → Project Settings → Service Accounts → Generate key.
//   2. Save the downloaded JSON as scripts/serviceAccount.json (gitignored).
//   3. npm run seed
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env.local' })

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { geohashForLocation } from 'geofire-common'

const SERVICE_ACCOUNT_PATH = resolve(import.meta.dirname, 'serviceAccount.json')
const SEED_DATA_PATH = resolve(import.meta.dirname, 'seed-data.json')

interface LatLng {
  lat: number
  lng: number
}

interface SeedNgo {
  id: string
  name: string
  description: string
  categories: string[]
  location: LatLng
  contactPhone: string
  contactEmail: string
  logoUrl: string
  verified: boolean
  adminUids: string[]
}

interface SeedHelpLocation {
  id: string
  type: string
  name: string
  address: string
  location: LatLng
  hours: string
  phone: string
}

interface SeedPost {
  id: string
  ngoId: string
  type: 'drive' | 'donation' | 'update'
  title: string
  body: string
  photoUrl?: string
  eventDate?: string | null
  location?: LatLng
  rsvpCount: number
}

interface SeedReportAi {
  category: string
  subcategory: string
  summary: string
  urgency: string
  suggestedAction: string
  suppliesNeeded: string[]
  needsHumanReview: boolean
}

interface SeedReport {
  id: string
  reporterUid: string
  reporterAnonHandle: string
  description?: string | null
  photoDataUrl?: string | null
  audioUrl?: string | null
  location: LatLng
  ai?: SeedReportAi
  ngoId?: string | null
  ngoName?: string | null
  status: 'pending' | 'submitted' | 'accepted' | 'resolved'
  createdAt: string
  acceptedAt?: string | null
  resolvedAt?: string | null
}

interface SeedData {
  ngos: SeedNgo[]
  help_locations: SeedHelpLocation[]
  posts: SeedPost[]
  reports: SeedReport[]
}

function init(): void {
  let raw: string
  try {
    raw = readFileSync(SERVICE_ACCOUNT_PATH, 'utf8')
  } catch {
    console.error(
      [
        '',
        `Could not load ${SERVICE_ACCOUNT_PATH}.`,
        '',
        'Steps to fix:',
        '  1. Firebase Console → Project Settings → Service Accounts → Generate new private key.',
        '  2. Save the downloaded JSON as scripts/serviceAccount.json (it is gitignored).',
        '  3. Re-run npm run seed.',
        '',
      ].join('\n'),
    )
    process.exit(1)
  }
  // rationale: service account JSON is untyped third-party config; Firebase
  // Admin's cert() accepts it as ServiceAccount at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sa = JSON.parse(raw) as any
  initializeApp({ credential: cert(sa) })
}

function isoToTimestamp(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso))
}

function geohashFor(loc: LatLng): string {
  return geohashForLocation([loc.lat, loc.lng])
}

async function main(): Promise<void> {
  init()
  const db = getFirestore()
  const data = JSON.parse(readFileSync(SEED_DATA_PATH, 'utf8')) as SeedData

  const ngosById = new Map<string, SeedNgo>()
  for (const n of data.ngos) ngosById.set(n.id, n)

  console.log(`Seeding ${data.ngos.length} NGOs…`)
  for (const n of data.ngos) {
    await db
      .collection('ngos')
      .doc(n.id)
      .set({ ...n, geohash: geohashFor(n.location) })
  }

  console.log(`Seeding ${data.help_locations.length} help_locations…`)
  for (const h of data.help_locations) {
    await db
      .collection('help_locations')
      .doc(h.id)
      .set({ ...h, geohash: geohashFor(h.location) })
  }

  console.log(`Seeding ${data.posts.length} posts…`)
  for (const p of data.posts) {
    const ngo = ngosById.get(p.ngoId)
    const payload: Record<string, unknown> = {
      id: p.id,
      ngoId: p.ngoId,
      ngoName: ngo?.name ?? '',
      ngoLogoUrl: ngo?.logoUrl ?? '',
      type: p.type,
      title: p.title,
      body: p.body,
      photoUrl: p.photoUrl ?? null,
      eventDate: p.eventDate ? isoToTimestamp(p.eventDate) : null,
      location: p.location ?? null,
      rsvpCount: p.rsvpCount,
      createdAt: Timestamp.now(),
    }
    await db.collection('posts').doc(p.id).set(payload)
  }

  console.log(`Seeding ${data.reports.length} historical reports…`)
  for (const r of data.reports) {
    const payload: Record<string, unknown> = {
      id: r.id,
      reporterUid: r.reporterUid,
      reporterAnonHandle: r.reporterAnonHandle,
      description: r.description ?? null,
      photoDataUrl: r.photoDataUrl ?? null,
      audioUrl: r.audioUrl ?? null,
      location: r.location,
      geohash: geohashFor(r.location),
      status: r.status,
      ai: r.ai ?? null,
      ngoId: r.ngoId ?? null,
      ngoName: r.ngoName ?? null,
      createdAt: isoToTimestamp(r.createdAt),
      acceptedAt: r.acceptedAt ? isoToTimestamp(r.acceptedAt) : null,
      resolvedAt: r.resolvedAt ? isoToTimestamp(r.resolvedAt) : null,
    }
    await db.collection('reports').doc(r.id).set(payload)
    if (r.ngoId) {
      await db
        .collection('ngos')
        .doc(r.ngoId)
        .collection('incoming_reports')
        .doc(r.id)
        .set({ ...payload, centralReportId: r.id })
    }
  }

  console.log('Done.')
  process.exit(0)
}

void main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
