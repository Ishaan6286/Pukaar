import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, useRole } from '@/hooks/useAuth'
import type { Role } from '@/types'

export interface RoleGateProps {
  /** Roles that are permitted to view this subtree */
  allow: Role[]
  children: ReactNode
  /** Optional custom redirect override. Defaults to role-based redirect. */
  fallbackPath?: string
}

/**
 * Route guard that checks the authenticated user's role.
 * - Shows a skeleton spinner while auth is resolving
 * - Redirects unauthenticated users to /login
 * - Redirects users with wrong role to their home route
 * - Treats 'ngo_admin' and 'ngo' as equivalent for NGO route access
 */
export default function RoleGate({ allow, children, fallbackPath }: RoleGateProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const role = useRole()

  // --- Loading: skeleton spinner, no flicker ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary text-2xl">favorite</span>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
        <div className="space-y-2 w-48">
          <div className="h-2 bg-accent rounded-full animate-pulse" />
          <div className="h-2 bg-accent/60 rounded-full animate-pulse w-3/4 mx-auto" />
        </div>
      </div>
    )
  }

  // --- Not logged in ---
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  // --- Normalize ngo_admin → ngo for access checks ---
  const effectiveRole: Role = (role as string) === 'ngo_admin' ? 'ngo' : role

  // Build the expanded allow list: if 'ngo' is allowed, also allow 'ngo_admin'
  const expandedAllow = allow.includes('ngo')
    ? [...allow, 'ngo_admin' as Role]
    : allow

  // --- Role check ---
  if (!expandedAllow.includes(role)) {
    if (fallbackPath) return <Navigate to={fallbackPath} replace />

    // Smart redirect by role
    if (effectiveRole === 'ngo') return <Navigate to="/ngo/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
