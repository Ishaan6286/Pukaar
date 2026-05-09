import { collections, addDocument } from './firestore'
import type { PostType, RsvpStatus, CommunityPost } from '@/types'
import { query, where, getDocs, doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Creates a new community post by an NGO
 */
export async function createCommunityPost(
  ngoId: string, 
  type: PostType, 
  title: string, 
  body: string, 
  photoDataUrl?: string,
  metrics?: string,
  fundedPercentage?: number
) {
  return await addDocument<CommunityPost>(collections.posts, {
    ngoId,
    type,
    title,
    body,
    photoDataUrl,
    metrics,
    fundedPercentage,
    engagementCount: 0
  })
}

/**
 * Toggles an RSVP status for a user on a post.
 * - Uses a transaction to update the engagement count on the post atomically.
 * - If they click the same status again, it removes their RSVP and decrements count.
 */
export async function togglePostRsvp(postId: string, userId: string, status: RsvpStatus) {
  const q = query(
    collections.rsvps, 
    where('postId', '==', postId),
    where('userId', '==', userId)
  )
  
  const snap = await getDocs(q)
  const existingDoc = snap.empty ? null : snap.docs[0]

  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId)
    const postSnap = await transaction.get(postRef)
    
    if (!postSnap.exists()) {
      throw new Error("Post does not exist!")
    }

    const currentCount = postSnap.data().engagementCount || 0

    if (existingDoc) {
      const currentStatus = existingDoc.data().status
      
      if (currentStatus === status) {
        // Remove RSVP
        transaction.delete(existingDoc.ref)
        transaction.update(postRef, { engagementCount: Math.max(0, currentCount - 1) })
      } else {
        // Change status (engagement count stays the same since they were already engaged)
        transaction.update(existingDoc.ref, { status, updatedAt: Date.now() })
      }
    } else {
      // Create new RSVP
      const newRsvpRef = doc(collections.rsvps)
      transaction.set(newRsvpRef, {
        postId,
        userId,
        status,
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
      transaction.update(postRef, { engagementCount: currentCount + 1 })
    }
  })

  // Return whether it's active or removed based on what happened
  if (existingDoc && existingDoc.data().status === status) {
    return null
  }
  return status
}
