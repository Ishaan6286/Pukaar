import { collections, addTypedDoc, updateTypedDoc } from './db'
import { PostType, RsvpStatus, Rsvp } from '@/types'
import { query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Creates a new community post by an NGO
 */
export async function createCommunityPost(
  ngoId: string, 
  type: PostType, 
  title: string, 
  body: string, 
  mediaUrls: string[] = [],
  metrics?: string,
  fundedPercentage?: number
) {
  return await addTypedDoc(collections.posts, {
    ngoId,
    type,
    title,
    body,
    mediaUrls,
    metrics,
    fundedPercentage
  })
}

/**
 * Toggles an RSVP status for a user on a post.
 * If they click the same status again, it removes their RSVP.
 */
export async function togglePostRsvp(postId: string, userId: string, status: RsvpStatus) {
  const q = query(
    collections.rsvps, 
    where('postId', '==', postId),
    where('userId', '==', userId)
  )
  
  const snap = await getDocs(q)
  
  if (!snap.empty) {
    const existingDoc = snap.docs[0]
    const currentStatus = existingDoc.data().status
    
    if (currentStatus === status) {
      // Remove RSVP if clicking the active state
      await deleteDoc(doc(db, 'rsvps', existingDoc.id))
      return null
    } else {
      // Update to new status
      await updateTypedDoc(collections.rsvps, existingDoc.id, { status })
      return status
    }
  } else {
    // Create new RSVP
    await addTypedDoc(collections.rsvps, {
      postId,
      userId,
      status
    })
    return status
  }
}
