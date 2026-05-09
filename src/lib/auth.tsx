// Auth provider, hook, and Firebase wrappers all live in this file by design.
// react-refresh wants component-only exports; that conflicts with the chosen
// API surface here, so the rule is disabled file-wide.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'
import { NGO_ADMIN_EMAIL_TO_NGO_ID } from '@/constants'
import type { User, UserRole } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function loadOrCreateUserDoc(fbUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', fbUser.uid)
  const snap = await getDoc(userRef)
  const email = fbUser.email ?? ''
  const displayName = fbUser.displayName ?? ''
  const photoURL = fbUser.photoURL ?? undefined

  if (snap.exists()) {
    const data = snap.data() as Partial<User>
    const role: UserRole = data.role === 'ngo_admin' ? 'ngo_admin' : 'citizen'
    const createdAt =
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now()
    const hydrated: User = {
      uid: fbUser.uid,
      email: data.email ?? email,
      displayName: data.displayName ?? displayName,
      role,
      createdAt,
    }
    if (data.photoURL ?? photoURL) {
      hydrated.photoURL = data.photoURL ?? photoURL
    }
    if (data.ngoId) {
      hydrated.ngoId = data.ngoId
    }
    if (typeof data.pingCount === 'number') {
      hydrated.pingCount = data.pingCount
    }
    if (typeof data.trustScore === 'number') {
      hydrated.trustScore = data.trustScore
    }
    return hydrated
  }

  const mappedNgoId = NGO_ADMIN_EMAIL_TO_NGO_ID[email]
  const role: UserRole = mappedNgoId ? 'ngo_admin' : 'citizen'

  const writePayload: Record<string, unknown> = {
    uid: fbUser.uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
  }
  if (photoURL) {
    writePayload.photoURL = photoURL
  }
  if (mappedNgoId) {
    writePayload.ngoId = mappedNgoId
  }
  await setDoc(userRef, writePayload)

  // serverTimestamp() resolves on the server; for the in-memory User we hand
  // back a client-side Timestamp so consumers always get a real Timestamp.
  const created: User = {
    uid: fbUser.uid,
    email,
    displayName,
    role,
    createdAt: Timestamp.now(),
  }
  if (photoURL) created.photoURL = photoURL
  if (mappedNgoId) created.ngoId = mappedNgoId
  return created
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }
      void loadOrCreateUserDoc(fbUser)
        .then((resolved) => {
          setUser(resolved)
        })
        .catch((err: unknown) => {
          console.error('[auth] failed to hydrate user doc:', err)
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth)
}
