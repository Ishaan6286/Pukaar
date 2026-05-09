import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/lib/auth'
import type { UserRole } from '@/types'

export interface RoleGateProps {
  allow: UserRole[]
  children: ReactNode
}

export default function RoleGate({ allow, children }: RoleGateProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === 'ngo_admin' ? '/ngo/dashboard' : '/'} replace />
  }

  return <>{children}</>
}
