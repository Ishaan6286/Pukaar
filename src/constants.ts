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

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024

export const DEFAULT_DEMO_LOCATION: LatLng = { lat: 12.9716, lng: 77.5946 }
