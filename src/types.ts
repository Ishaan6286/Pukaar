import { Timestamp, GeoPoint } from 'firebase/firestore'

export type Role = 'citizen' | 'ngo' | 'admin'

export type UserProfile = {
  id?: string // set by converter
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: Role
  ngoId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type NgoProfile = {
  id?: string
  organizationName: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  address: string
  location?: GeoLocation
  serviceAreas: string[]
  contactPhone: string
  contactEmail: string
  website?: string
  description?: string
  stats: {
    totalResolved: number
    activeReports: number
    avgResponseTimeMs: number
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ReportStatus = 'submitted' | 'under_review' | 'dispatched' | 'resolved' | 'rejected'

export type ReportUrgency = 'low' | 'medium' | 'high'

export type GeoLocation = {
  lat: number
  lng: number
  geohash: string
  address: string
}

export type AIClassification = {
  category: string
  urgency: ReportUrgency
  confidence: number
  summary?: string
  suggestedAction?: string
  suggestedSupplies?: string[]
}

export type Report = {
  id?: string
  userId: string
  category: string
  urgency: ReportUrgency
  status: ReportStatus
  description: string
  location: GeoLocation
  mediaUrls: string[]
  
  // Assignment details
  assignedNgoId: string | null
  responderTeamId?: string
  etaMinutes?: number
  
  // AI fields
  aiClassification?: AIClassification
  
  createdAt: Timestamp
  updatedAt: Timestamp
  resolvedAt: Timestamp | null
}

export type HelpLocationType = 'hospital' | 'shelter' | 'food_bank' | 'police' | 'fire_station' | 'relief_camp'

export type HelpLocation = {
  id?: string
  name: string
  type: HelpLocationType
  location: GeoLocation
  capacity?: number
  currentOccupancy?: number
  contactPhone: string
  isOpen: boolean
  verifiedByNgoId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type PostType = 'event' | 'success' | 'urgent' | 'volunteer'

export type CommunityPost = {
  id?: string
  ngoId: string
  type: PostType
  title: string
  body: string
  mediaUrls: string[]
  metrics?: string
  fundedPercentage?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type RsvpStatus = 'attending' | 'interested' | 'declined'

export type Rsvp = {
  id?: string
  postId: string
  userId: string
  status: RsvpStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type TimelineEvent = {
  id?: string
  reportId: string
  status: ReportStatus
  description: string
  actorId: string // who triggered this
  createdAt: Timestamp
}
