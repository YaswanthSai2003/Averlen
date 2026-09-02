import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router'

import { Spinner } from '../../components/ui'

import { useAuth } from './auth-context'

export function RequireAuth() {
  const {
    status,
  } = useAuth()

  const location =
    useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner
          size="lg"
          label="Restoring your Averlen session"
        />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    )
  }

  return <Outlet />
}