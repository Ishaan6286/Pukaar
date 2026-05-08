import { useAuthStore } from '@/store/useAuthStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)
  
  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  }
}

export function useRole() {
  const profile = useAuthStore((state) => state.profile)
  return profile?.role || null
}
