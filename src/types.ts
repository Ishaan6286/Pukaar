import { Timestamp } from 'firebase/firestore'

// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role = 'user' | 'ngo' | 'admin'

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id?: string
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: 'user'
  status: 'active' | 'suspended'
  trustScore: number
  createdAt: Timestamp | number
  updatedAt: Timestamp | number
}

// ─── NGO ──────────────────────────────────────────────────────────────────────

export type NgoVerificationStatus = 'pending' | 'verified' | 'rejected'

export type NgoProfile = {
  id?: string
  ngoId: string
  ngoName: string
  email: string
  passwordHash: string
  role: 'ngo'
  categories: string[]
  location?: GeoLocation
  verified: boolean
  createdByAdmin: string
  createdAt: Timestamp | number
  status: 'active' | 'suspended'
  adminNotes: string

  // Keep these for UI compatibility without redesigning:
  address?: string
  contactPhone?: string
  website?: string
  logoUrl?: string
  stats?: {
    totalResolved: number
    activeReports: number
    avgResponseTimeMs: number
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminProfile = {
  id?: string
  adminId: string
  email: string
  passwordHash: string
  role: 'admin'
  permissions: string[]
  createdAt: Timestamp | number
  lastLogin: Timestamp | number
}

// ─── Geolocation ─────────────────────────────────────────────────────────────

export type GeoLocation = {
  lat: number
  lng: number
  /** geofire-common geohash for efficient radial queries */
  geohash: string
  address: string
}

/** Shorthand alias for coordinates without geohash/address */
export type LatLng = { lat: number; lng: number }

/** Alias matching the AI classification categories */
export type ReportCategory = 'animal_welfare' | 'person_welfare' | 'community_need'

/** Alias for urgency levels */
export type Urgency = 'high' | 'medium' | 'low'

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'dispatched'
  | 'resolved'
  | 'rejected'

export type ReportUrgency = 'low' | 'medium' | 'high'

export type AIClassification = {
  /** e.g. 'medical_aid', 'water_supply', 'shelter' */
  category: string
  urgency: ReportUrgency
  /** 0–1 confidence score returned by Gemini */
  confidence: number
  /** Human-readable AI-generated summary of the situation */
  summary?: string
  /** Recommended first-response action */
  suggestedAction?: string
  /** List of supplies or resources recommended */
  suggestedSupplies?: string[]
}

export type Report = {
  id?: string
  userId: string
  /** AI or manual category */
  category: string
  urgency: ReportUrgency
  status: ReportStatus
  description: string
  location: GeoLocation
  /** Base64 data URL of the resized JPEG. Stored inline because we don't use Firebase Storage. */
  photoDataUrl?: string
  // audio: not persisted; reserved — we discard audio after the AI call, so this field is unused in production.

  // Assignment
  assignedNgoId: string | null
  responderTeamId?: string
  /** Estimated time of arrival in minutes (set by NGO on dispatch) */
  etaMinutes?: number

  // AI enrichment
  aiClassification?: AIClassification

  createdAt: Timestamp | number
  updatedAt: Timestamp | number
  resolvedAt: Timestamp | number | null
}

// ─── Timeline Events ──────────────────────────────────────────────────────────

export type TimelineEvent = {
  id?: string
  reportId: string
  status: ReportStatus
  /** Human-readable description of what happened */
  description: string
  /** UID of the actor (user, NGO ID, or 'system') */
  actorId: string
  createdAt: Timestamp | number
}

// ─── Help Locations ───────────────────────────────────────────────────────────

export type HelpLocationType =
  | 'hospital'
  | 'shelter'
  | 'food_bank'
  | 'police'
  | 'fire_station'
  | 'relief_camp'
  | 'community_kitchen'
  | 'animal_rescue'

export type HelpLocation = {
  id?: string
  name: string
  type: HelpLocationType
  location: GeoLocation
  capacity?: number
  currentOccupancy?: number
  contactPhone: string
  isOpen: boolean
  operatingHours?: string
  verifiedByNgoId?: string
  createdAt: Timestamp | number
  updatedAt: Timestamp | number
}

// ─── Community Feed ───────────────────────────────────────────────────────────

export type PostType = 'event' | 'success' | 'urgent' | 'volunteer' | 'announcement'

export type CommunityPost = {
  id?: string
  ngoId: string
  type: PostType
  title: string
  body: string
  /** Base64 data URL of an optional post image. Stored inline because we don't use Firebase Storage. */
  photoDataUrl?: string
  /** Key metric or impact stat to highlight e.g. "150 meals served" */
  metrics?: string
  /** 0–100 funding progress for donation drives */
  fundedPercentage?: number
  /** Total RSVP/support count (denormalized for feed performance) */
  engagementCount?: number
  createdAt: Timestamp | number
  updatedAt: Timestamp | number
}

// ─── RSVPs ───────────────────────────────────────────────────────────────────

export type RsvpStatus = 'attending' | 'interested' | 'declined'

export type Rsvp = {
  id?: string
  postId: string
  userId: string
  status: RsvpStatus
  createdAt: Timestamp | number
  updatedAt: Timestamp | number
}
