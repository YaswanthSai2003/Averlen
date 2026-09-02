import type { ReactNode } from 'react'

import type { UserRole } from '../../types/auth'

import { AccessDeniedPage } from '../foundation/AccessDeniedPage'
import { useAuth } from './auth-context'

type RequireRoleProps = {
  allowedRoles: readonly UserRole[]
  children: ReactNode
}

export function RequireRole({
  allowedRoles,
  children,
}: RequireRoleProps) {
  const {
    user,
  } = useAuth()

  if (!user) {
    return null
  }

  if (
    !allowedRoles.includes(
      user.role,
    )
  ) {
    return <AccessDeniedPage />
  }

  return children
}