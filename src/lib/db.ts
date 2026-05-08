import { 
  collection, 
  doc, 
  QueryDocumentSnapshot, 
  SnapshotOptions,
  FirestoreDataConverter,
  DocumentData,
  serverTimestamp,
  onSnapshot,
  QueryConstraint,
  query,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  UserProfile, 
  NgoProfile, 
  Report, 
  HelpLocation, 
  CommunityPost, 
  Rsvp,
  TimelineEvent
} from '@/types'

/**
 * Generic Firestore Data Converter
 * Adds 'id' to the data when reading from Firestore, and strips it when writing.
 * Automatically handles standardizing timestamps.
 */
const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    const { id, ...rest } = data
    // When creating new records, ensure createdAt and updatedAt are set by the helper
    return rest
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      ...data,
    } as T
  }
})

/**
 * Reusable Collection References
 */
export const collections = {
  users: collection(db, 'users').withConverter(createConverter<UserProfile>()),
  ngos: collection(db, 'ngos').withConverter(createConverter<NgoProfile>()),
  reports: collection(db, 'reports').withConverter(createConverter<Report>()),
  helpLocations: collection(db, 'help_locations').withConverter(createConverter<HelpLocation>()),
  posts: collection(db, 'posts').withConverter(createConverter<CommunityPost>()),
  rsvps: collection(db, 'rsvps').withConverter(createConverter<Rsvp>()),
  timelineEvents: collection(db, 'timeline_events').withConverter(createConverter<TimelineEvent>()),
}

/**
 * Validation Utilities
 */
export const dbValidators = {
  isValidGeoLocation: (loc: any) => {
    return loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !!loc.geohash
  },
  isReportValid: (report: Partial<Report>) => {
    return !!(report.userId && report.category && report.description && report.location)
  }
}

/**
 * Typed Document Helpers (CRUD)
 */
export async function getTypedDoc<T>(collectionRef: any, docId: string): Promise<T | null> {
  const docSnap = await getDoc(doc(collectionRef, docId))
  return docSnap.exists() ? (docSnap.data() as T) : null
}

export async function addTypedDoc<T extends DocumentData>(
  collectionRef: any, 
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function updateTypedDoc<T extends DocumentData>(
  collectionRef: any, 
  docId: string, 
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const ref = doc(collectionRef, docId)
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteTypedDoc(collectionRef: any, docId: string): Promise<void> {
  await deleteDoc(doc(collectionRef, docId))
}

/**
 * Realtime Listener Support
 */
export function subscribeToQuery<T>(
  collectionRef: any,
  constraints: QueryConstraint[],
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collectionRef, ...constraints)
  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map(doc => doc.data() as T)
      onData(results)
    },
    (error) => {
      console.error('Realtime subscription error:', error)
      if (onError) onError(error)
    }
  )
}

export function subscribeToDoc<T>(
  collectionRef: any,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (error: Error) => void
) {
  const ref = doc(collectionRef, docId)
  return onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as T)
      } else {
        onData(null)
      }
    },
    (error) => {
      console.error('Realtime doc subscription error:', error)
      if (onError) onError(error)
    }
  )
}

/**
 * Query Helpers (Common queries used across the app)
 */
export const queries = {
  // Get active reports for an NGO
  getActiveReportsForNgo: async (ngoId: string) => {
    const q = query(
      collections.reports, 
      where('assignedNgoId', '==', ngoId),
      where('status', 'in', ['submitted', 'under_review', 'dispatched']),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
  },

  // Get reports by User
  getReportsByUser: async (userId: string) => {
    const q = query(
      collections.reports,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
  },

  // Get posts by NGO
  getPostsByNgo: async (ngoId: string) => {
    const q = query(
      collections.posts,
      where('ngoId', '==', ngoId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
  }
}
