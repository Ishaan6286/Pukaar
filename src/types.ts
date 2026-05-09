import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'citizen' | 'ngo_admin'

export type ReportCategory = 'animal_welfare' | 'person_welfare' | 'community_need'

export type Urgency = 'high' | 'medium' | 'low'

export type ReportStatus = 'pending' | 'submitted' | 'accepted' | 'resolved'

export type HelpLocationType =
  | 'food_bank'
  | 'shelter'
  | 'animal_rescue'
  | 'community_kitchen'

export type PostType = 'drive' | 'donation' | 'update'

export interface LatLng {
  lat: number
  lng: number
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  ngoId?: string
  createdAt: Timestamp
  pingCount?: number
  trustScore?: number
}

export interface Ngo {
  id: string
  name: string
  description: string
  categories: ReportCategory[]
  location: LatLng
  geohash: string
  contactPhone: string
  contactEmail: string
  logoUrl: string
  verified: boolean
  adminUids: string[]
  hours?: string
  establishedYear?: number
  volunteerCount?: number
  website?: string
}

export interface ReportAI {
  category: ReportCategory
  subcategory: string
  summary: string
  urgency: Urgency
  suggestedAction: string
  suppliesNeeded: string[]
  needsHumanReview: boolean
}

export interface Report {
  id: string
  reporterUid: string
  reporterAnonHandle: string
  description?: string
  // Base64 data URL of the resized JPEG. Stored inline because we don't use Firebase Storage.
  photoDataUrl?: string
  audioUrl?: string
  location: LatLng
  geohash: string
  status: ReportStatus
  ai?: ReportAI
  ngoId?: string
  ngoName?: string
  createdAt: Timestamp
  acceptedAt?: Timestamp
  resolvedAt?: Timestamp
}

export interface IncomingReport extends Report {
  centralReportId: string
}

export interface HelpLocation {
  id: string
  type: HelpLocationType
  name: string
  address: string
  location: LatLng
  geohash: string
  hours: string
  phone: string
}

export interface Post {
  id: string
  ngoId: string
  ngoName: string
  ngoLogoUrl: string
  type: PostType
  title: string
  body: string
  photoUrl?: string
  eventDate?: Timestamp
  location?: LatLng
  rsvpCount: number
  createdAt: Timestamp
}

export interface Rsvp {
  uid: string
  displayName: string
  status: 'going'
  createdAt: Timestamp
}
