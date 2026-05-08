// TODO(person 1): Firestore writes for the report lifecycle (create, accept,
// resolve) plus the central + per-NGO inbox fan-out. Filled in next prompt.
import type { LatLng, Report } from '@/types'

export async function createReport(_input: {
  reporterUid: string
  description?: string
  photoUrl?: string
  audioUrl?: string
  location: LatLng
}): Promise<string> {
  throw new Error('not implemented')
}

export async function acceptReport(_reportId: string, _ngoId: string): Promise<void> {
  throw new Error('not implemented')
}

export async function resolveReport(_reportId: string): Promise<void> {
  throw new Error('not implemented')
}

export async function getReport(_reportId: string): Promise<Report | null> {
  throw new Error('not implemented')
}
