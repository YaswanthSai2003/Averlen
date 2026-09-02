import {
  Outlet,
  useNavigate,
} from 'react-router'

import {
  buildApiUrl,
} from '../../api/client'

import {
  AppShell,
} from '../../components/layout'

import {
  NotificationBellMenu,
} from '../notifications/components/NotificationBellMenu'

import {
  GlobalSearch,
} from '../search/GlobalSearch'

import {
  useAuth,
} from './auth-context'


export function AuthenticatedLayout() {
  const {
    user,
    demoReadOnly,
    signOut,
  } =
    useAuth()

  const navigate =
    useNavigate()


  if (!user) {
    return null
  }


  const displayName =
    user.full_name
      ?.trim() ||
    user.email


  const avatarUrl =
    user.avatar_url
      ? buildApiUrl(
          user.avatar_url,
        )
      : null


  async function handleSignOut() {
    await signOut()

    navigate(
      '/login',
      {
        replace:
          true,
      },
    )
  }


  return (
    <AppShell
      role={
        user.role
      }
      userName={
        displayName
      }
      userEmail={
        user.email
      }
      avatarUrl={
        avatarUrl
      }
      globalSearch={
        <GlobalSearch
          role={
            user.role
          }
        />
      }
      notificationBell={
        <NotificationBellMenu />
      }
      demoReadOnly={
        demoReadOnly
      }
      onSignOut={
        handleSignOut
      }
    >
      <Outlet />
    </AppShell>
  )
}
