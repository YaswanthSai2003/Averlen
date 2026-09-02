import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  demoLogin,
  getCurrentUser,
  login,
  logout,
  restoreAuthSession,
  type AuthUser,
} from '../../api/auth'

import {
  setAuthFailureHandler,
} from '../../api/client'

import {
  AuthContext,
  type AuthStatus,
} from './auth-context'

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [user, setUser] =
    useState<AuthUser | null>(null)

  const [status, setStatus] =
    useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true

    setAuthFailureHandler(() => {
      if (!active) {
        return
      }

      setUser(null)
      setStatus('unauthenticated')
    })

    void restoreAuthSession()
      .then((restoredUser) => {
        if (!active) {
          return
        }

        setUser(restoredUser)

        setStatus(
          restoredUser
            ? 'authenticated'
            : 'unauthenticated',
        )
      })

    return () => {
      active = false
      setAuthFailureHandler(null)
    }
  }, [])

  const refreshUser =
    useCallback(async () => {
      try {
        const currentUser =
          await getCurrentUser()

        setUser(currentUser)
        setStatus('authenticated')

        return currentUser
      } catch {
        setUser(null)
        setStatus('unauthenticated')

        return null
      }
    }, [])

  const signIn =
    useCallback(
      async (
        email: string,
        password: string,
      ) => {
        await login(
          email,
          password,
        )

        const currentUser =
          await getCurrentUser()

        setUser(currentUser)
        setStatus('authenticated')

        return currentUser
      },
      [],
    )

  const signInDemo =
    useCallback(async () => {
      await demoLogin()

      const currentUser =
        await getCurrentUser()

      setUser(currentUser)
      setStatus('authenticated')

      return currentUser
    }, [])

  const signOut =
    useCallback(async () => {
      await logout()

      setUser(null)
      setStatus('unauthenticated')
    }, [])

  const demoReadOnly =
    user?.email
      .trim()
      .toLowerCase() ===
    'demo@averlen.app'


  const value =
    useMemo(
      () => ({
        user,
        status,
        demoReadOnly,
        signIn,
        signInDemo,
        signOut,
        refreshUser,
      }),
      [
        user,
        status,
        demoReadOnly,
        signIn,
        signInDemo,
        signOut,
        refreshUser,
      ],
    )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
