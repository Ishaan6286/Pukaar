import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint,
  DocumentData,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Generic helper to fetch a single document by ID
 */
export async function getDocument<T = DocumentData>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

/**
 * Generic helper to fetch documents based on query constraints
 */
export async function queryDocuments<T = DocumentData>(
  collectionName: string, 
  constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints)
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[]
}

/**
 * Generic helper to fetch all documents in a collection
 */
export async function getAllDocuments<T = DocumentData>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName))
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[]
}

/**
 * Generic helper to create a new document
 * Automatically adds createdAt and updatedAt timestamps
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string, 
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

/**
 * Generic helper to update a document
 * Automatically updates the updatedAt timestamp
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

/**
 * Generic helper to delete a document
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)
}
