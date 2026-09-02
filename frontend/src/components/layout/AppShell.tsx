import {
  type ReactNode,
  useState,
} from 'react'

import { cn } from '../../lib/cn'
import type {
  UserRole,
} from '../../types/auth'

import {
  Sidebar,
} from './Sidebar'

import {
  TopBar,
} from './TopBar'


type AppShellProps = {
  role:
    UserRole

  userName:
    string

  userEmail:
    string

  avatarUrl?:
    string |
    null

  globalSearch?:
    ReactNode

  notificationBell?:
    ReactNode

  unreadNotifications?:
    number

  demoReadOnly?:
    boolean

  onSignOut:
    () =>
      void |
      Promise<void>

  children:
    ReactNode
}


export function AppShell({
  role,
  userName,
  userEmail,
  avatarUrl,
  globalSearch,
  notificationBell,
  unreadNotifications = 0,
  demoReadOnly = false,
  onSignOut,
  children,
}: AppShellProps) {
  const [
    sidebarExpanded,
    setSidebarExpanded,
  ] =
    useState(
      () =>
        typeof window !== 'undefined' &&
        window.matchMedia(
          '(min-width: 768px)',
        ).matches,
    )


  function toggleSidebar() {
    setSidebarExpanded(
      (current) =>
        !current,
    )
  }


  function closeSidebarOnPhone() {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia(
        '(max-width: 767px)',
      ).matches
    ) {
      setSidebarExpanded(
        false,
      )
    }
  }


  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-clip bg-slate-50">
      {sidebarExpanded && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => {
            setSidebarExpanded(
              false,
            )
          }}
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px] md:hidden"
        />
      )}


      <div
        className={cn(
          'relative z-50 h-screen shrink-0 transition-[width] duration-200 ease-out',
          sidebarExpanded
            ? 'w-[4.25rem] md:w-[13rem]'
            : 'w-[4.25rem]',
        )}
      >
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-[width] duration-200 ease-out',
            sidebarExpanded
              ? 'w-[13rem]'
              : 'w-[4.25rem]',
          )}
        >
          <Sidebar
            role={
              role
            }
            expanded={
              sidebarExpanded
            }
            onToggle={
              toggleSidebar
            }
            onNavigate={
              closeSidebarOnPhone
            }
          />
        </div>
      </div>


      <div className="min-w-0 flex-1 overflow-x-clip">
        <div className="sticky top-0 z-30">
          <TopBar
            userName={
              userName
            }
            userEmail={
              userEmail
            }
            avatarUrl={
              avatarUrl
            }
            globalSearch={
              globalSearch
            }
            notificationBell={
              notificationBell
            }
            unreadNotifications={
              unreadNotifications
            }
            sidebarExpanded={
              sidebarExpanded
            }
            onToggleNavigation={
              toggleSidebar
            }
            onSignOut={
              onSignOut
            }
          />


          {demoReadOnly && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900 sm:px-6 xl:px-8">
              <span className="font-semibold">Read-only demo workspace.</span>{' '}
              Explore the seeded data freely; changes are blocked to keep the demo
              consistent for everyone.
            </div>
          )}


        </div>

        <main className="min-h-[calc(100vh-4.25rem)] min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
