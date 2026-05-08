// TODO(person 4): Firebase Auth wrappers — Google sign-in, anonymous citizen
// session, role lookup, sign out. Plus a useAuth() hook for components.
import type { User } from '@/types'

export async function signInWithGoogle(): Promise<User> {
  throw new Error('not implemented')
}

export async function signInAnonymouslyAsCitizen(): Promise<User> {
  throw new Error('not implemented')
}

export async function signOutCurrentUser(): Promise<void> {
  throw new Error('not implemented')
}

export function useAuth(): { user: User | null; loading: boolean } {
  throw new Error('not implemented')
}
