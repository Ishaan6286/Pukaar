import type {
  HelpLocationType,
  LatLng,
  ReportCategory,
  Urgency,
} from '@/types'

export const REPORT_CATEGORIES: ReportCategory[] = [
  'animal_welfare',
  'person_welfare',
  'community_need',
]

export const URGENCY_LEVELS: Urgency[] = ['high', 'medium', 'low']

export const HELP_LOCATION_TYPES: HelpLocationType[] = [
  'food_bank',
  'shelter',
  'animal_rescue',
  'community_kitchen',
]

export const DEFAULT_SEARCH_RADIUS_M = 10000
export const MAX_SEARCH_RADIUS_M = 50000
export const RADIUS_EXPANSION_STEPS_M = [10000, 25000, 50000]

// We don't use Firebase Storage. Photos are inlined as base64 in the
// Firestore report doc. Firestore docs cap at 1 MB total; budget 750 KB
// for the photo to leave headroom for AI output and other fields.
export const MAX_PHOTO_BASE64_BYTES = 750 * 1024

// Audio is consumed by Gemini and discarded. We still cap input size to
// avoid sending massive blobs over the wire to the AI.
export const MAX_AUDIO_BYTES_INLINE = 4 * 1024 * 1024

export const DEFAULT_DEMO_LOCATION: LatLng = { lat: 12.9716, lng: 77.5946 }

// Pre-seeded NGO admin mapping. Edit values before demo.
// Seed script will create matching /ngos/{ngoId} docs.
export const NGO_ADMIN_EMAIL_TO_NGO_ID: Record<string, string> = {
  // 'admin1@example.com': 'ngo_animal_rescue_blr',
  // 'admin2@example.com': 'ngo_homeless_shelter_blr',
}
export const NGO_ADMIN_EMAILS = Object.keys(NGO_ADMIN_EMAIL_TO_NGO_ID)
