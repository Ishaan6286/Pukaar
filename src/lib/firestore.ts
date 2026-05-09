import { 
  collection, 
  doc, 
  QueryDocumentSnapshot, 
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
import type {
  SnapshotOptions,
  FirestoreDataConverter,
  DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { 
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
 */
const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    const { id, ...rest } = data
    return rest
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      ...data,
    } as unknown as T
  }
})

/**
 * Typed Collection References
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
 * Typed Document Helpers (CRUD)
 */

export async function getDocument<T>(collectionRef: any, docId: string): Promise<T | null> {
  const docSnap = await getDoc(doc(collectionRef, docId))
  return docSnap.exists() ? (docSnap.data() as T) : null
}

export async function addDocument<T extends DocumentData>(
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

export async function updateDocument<T extends DocumentData>(
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

export async function deleteDocument(collectionRef: any, docId: string): Promise<void> {
  await deleteDoc(doc(collectionRef, docId))
}

export async function queryDocuments<T>(
  collectionRef: any, 
  constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collectionRef, ...constraints)
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => doc.data() as T)
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
 * Common Queries
 */
export const queries = {
  getActiveReportsForNgo: async (ngoId: string) => {
    return queryDocuments<Report>(collections.reports, [
      where('assignedNgoId', '==', ngoId),
      where('status', 'in', ['submitted', 'under_review', 'dispatched']),
      orderBy('createdAt', 'desc')
    ])
  },

  getReportsByUser: async (userId: string) => {
    return queryDocuments<Report>(collections.reports, [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ])
  },

  getPostsByNgo: async (ngoId: string) => {
    return queryDocuments<CommunityPost>(collections.posts, [
      where('ngoId', '==', ngoId),
      orderBy('createdAt', 'desc')
    ])
  },
  
  getHelpLocationsByType: async (type: string) => {
    return queryDocuments<HelpLocation>(collections.helpLocations, [
      where('type', '==', type),
      where('isOpen', '==', true)
    ])
  },
  
  getTimelineEventsForReport: async (reportId: string) => {
    return queryDocuments<TimelineEvent>(collections.timelineEvents, [
      where('reportId', '==', reportId),
      orderBy('createdAt', 'asc')
    ])
  }
}
