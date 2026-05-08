import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, useRole } from '@/hooks/useAuth'
import { Role } from '@/types'

export interface RoleGateProps {
  allow: Role[]
  children: ReactNode
}

export default function RoleGate({ allow, children }: RoleGateProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const role = useRole()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(role)) {
    // Redirect based on role if unauthorized
    if (role === 'ngo') return <Navigate to="/ngo/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
