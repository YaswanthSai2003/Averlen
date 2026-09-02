import {
  createContext,
  useContext,
} from 'react'

import type {
  AuthUser,
} from '../../api/auth'

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  demoReadOnly: boolean

  signIn: (
    email: string,
    password: string,
  ) => Promise<AuthUser>

  signInDemo: () => Promise<AuthUser>

  signOut: () => Promise<void>

  refreshUser: () => Promise<AuthUser | null>
}

export const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  )

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}
