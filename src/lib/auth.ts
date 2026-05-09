import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import { useAuthStore } from '@/store/useAuthStore'
import type { AnyProfile } from '@/store/useAuthStore'
import type { UserProfile } from '@/types'

const googleProvider = new GoogleAuthProvider()

let profileUnsubscribe: (() => void) | null = null

function stopProfileListener() {
  if (profileUnsubscribe) {
    profileUnsubscribe()
    profileUnsubscribe = null
  }
}

/**
 * Discovers which collection a user belongs to and starts a realtime listener.
 */
async function discoverAndStartListener(uid: string, fallbackAuthData: any) {
  stopProfileListener()

  // First, check users collection
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    profileUnsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) useAuthStore.getState().setProfile(snap.data() as AnyProfile)
    })
    return
  }

  // Second, check NGOs
  const ngoRef = doc(db, 'ngos', uid)
  const ngoSnap = await getDoc(ngoRef)
  
  if (ngoSnap.exists()) {
    profileUnsubscribe = onSnapshot(ngoRef, (snap) => {
      if (snap.exists()) useAuthStore.getState().setProfile(snap.data() as AnyProfile)
    })
    return
  }

  // Third, check Admins
  const adminRef = doc(db, 'admins', uid)
  const adminSnap = await getDoc(adminRef)

  if (adminSnap.exists()) {
    profileUnsubscribe = onSnapshot(adminRef, (snap) => {
      if (snap.exists()) useAuthStore.getState().setProfile(snap.data() as AnyProfile)
    })
    return
  }

  // If no profile exists across all collections, it's a new citizen logging in via Google for the first time
  // They are guaranteed to be a 'user' because NGOs/Admins are created manually and their docs already exist
  const newProfile: UserProfile = {
    uid,
    email: fallbackAuthData.email,
    displayName: fallbackAuthData.displayName || null,
    photoURL: fallbackAuthData.photoURL || null,
    role: 'user',
    status: 'active',
    trustScore: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  await setDoc(userRef, newProfile)
  
  profileUnsubscribe = onSnapshot(userRef, (snap) => {
    if (snap.exists()) useAuthStore.getState().setProfile(snap.data() as AnyProfile)
  })
}

/**
 * Users authenticate ONLY using Google Sign-In.
 */
export async function signInCitizen(): Promise<void> {
  await signInWithPopup(auth, googleProvider)
}

/**
 * NGOs authenticate using Email/Password.
 */
export async function signInNgo(email: string, password: string): Promise<void> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  
  // Verify they are actually an NGO before allowing session to persist normally
  const ngoSnap = await getDoc(doc(db, 'ngos', result.user.uid))
  if (!ngoSnap.exists()) {
    await firebaseSignOut(auth)
    throw new Error('Unauthorized: This account is not an NGO.')
  }
}

/**
 * Admins authenticate using Email/Password.
 */
export async function signInAdmin(email: string, password: string): Promise<void> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  
  const adminSnap = await getDoc(doc(db, 'admins', result.user.uid))
  if (!adminSnap.exists()) {
    await firebaseSignOut(auth)
    throw new Error('Unauthorized: This account is not an Admin.')
  }
}

export async function signOut(): Promise<void> {
  stopProfileListener()
  await firebaseSignOut(auth)
  useAuthStore.getState().clearAuth()
}

/**
 * Initializes the Firebase auth state listener.
 */
export function initAuthListener(): () => void {
  return onAuthStateChanged(auth, async (user) => {
    const store = useAuthStore.getState()

    if (user) {
      store.setUser(user)
      await discoverAndStartListener(user.uid, user)
    } else {
      stopProfileListener()
      store.clearAuth()
    }

    store.setLoading(false)
  })
}
