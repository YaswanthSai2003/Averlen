import {
  Navigate,
  Outlet,
} from 'react-router'

import {
  useAuth,
} from './auth-context'


export function RequirePlatformAdmin() {
  const {
    user,
    status,
  } = useAuth()

  if (
    status !== 'authenticated' ||
    !user
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (!user.is_platform_admin) {
    return (
      <Navigate
        to="/app/overview"
        replace
      />
    )
  }

  return <Outlet />
}
