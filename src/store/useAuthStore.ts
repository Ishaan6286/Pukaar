import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { UserProfile, NgoProfile, AdminProfile } from '@/types'

export type AnyProfile = UserProfile | NgoProfile | AdminProfile

type AuthState = {
  user: User | null
  profile: AnyProfile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: AnyProfile | null) => void
  setLoading: (isLoading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null, isLoading: false }),
}))
