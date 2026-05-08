// TODO(person 4): wraps route subtrees so only users with a given UserRole can
// access them. Reads the current user from useAuth() in @/lib/auth.
import type { ReactNode } from 'react'
import type { UserRole } from '@/types'

export interface RoleGateProps {
  allow: UserRole[]
  children: ReactNode
}

export default function RoleGate({ children }: RoleGateProps) {
  // Placeholder: passes through until real auth is wired up.
  return <>{children}</>
}
