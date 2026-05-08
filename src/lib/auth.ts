import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { UserProfile, Role } from '@/types'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(role: Role = 'citizen') {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Check if user profile exists in Firestore
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Create new user profile
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      
      await setDoc(userRef, newProfile)
      useAuthStore.getState().setProfile(newProfile)
    } else {
      useAuthStore.getState().setProfile(userSnap.data() as UserProfile)
    }

    useAuthStore.getState().setUser(user)
    return user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    useAuthStore.getState().clearAuth()
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Initialize Auth Listener
export function initAuthListener() {
  return onAuthStateChanged(auth, async (user) => {
    const store = useAuthStore.getState()
    
    if (user) {
      store.setUser(user)
      try {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          store.setProfile(userSnap.data() as UserProfile)
        } else {
          // Fallback if profile doesn't exist yet but user is authenticated
          store.setProfile(null)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        store.setProfile(null)
      }
    } else {
      store.clearAuth()
    }
    
    store.setLoading(false)
  })
}
