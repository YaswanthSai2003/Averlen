import {
  type ReactNode,
} from 'react'

import {
  useNavigate,
} from 'react-router'

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from 'lucide-react'

import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui'


type TopBarProps = {
  userName: string

  userEmail: string

  avatarUrl?: string | null

  globalSearch?: ReactNode

  notificationBell?: ReactNode

  unreadNotifications?: number

  sidebarExpanded: boolean

  onToggleNavigation: () => void

  onSignOut:
    () => void | Promise<void>
}


export function TopBar({
  userName,
  userEmail,
  avatarUrl,
  globalSearch,
  notificationBell,
  unreadNotifications = 0,
  sidebarExpanded,
  onToggleNavigation,
  onSignOut,
}: TopBarProps) {
  const navigate =
    useNavigate()

  const visibleUnreadCount =
    unreadNotifications > 99
      ? '99+'
      : unreadNotifications
          .toString()


  return (
    <header className="bg-white/90 backdrop-blur-md">
      <div className="flex h-[4.25rem] min-w-0 items-center gap-2.5 px-3 sm:px-5 xl:px-7">
        <button
          type="button"
          aria-label={
            sidebarExpanded
              ? 'Collapse navigation'
              : 'Expand navigation'
          }
          aria-expanded={
            sidebarExpanded
          }
          aria-controls="app-navigation"
          title={
            sidebarExpanded
              ? 'Collapse navigation'
              : 'Expand navigation'
          }
          onClick={
            onToggleNavigation
          }
          className="
            flex
            size-9
            items-center
            justify-center
            rounded-md
            text-slate-600
            transition-colors
            hover:bg-slate-100
            hover:text-slate-950
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-500
          "
        >
          <Menu
            size={20}
            aria-hidden="true"
          />
        </button>


        {globalSearch}


        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {notificationBell ?? (
            <button
              type="button"
              aria-label={
                unreadNotifications >
                0
                  ? `${unreadNotifications} unread notifications`
                  : 'Notifications'
              }
              className="
                relative
                flex
                size-9
                items-center
                justify-center
                rounded-md
                text-slate-500
                transition-colors
                hover:bg-slate-100
                hover:text-slate-900
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-brand-500
              "
            >
              <Bell
                size={19}
                strokeWidth={1.9}
                aria-hidden="true"
              />


              {unreadNotifications >
                0 && (
                <span
                  className="
                    absolute
                    right-0.5
                    top-0.5
                    flex
                    min-w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-danger-600
                    px-1
                    text-[10px]
                    font-semibold
                    leading-4
                    text-white
                  "
                >
                  {
                    visibleUnreadCount
                  }
                </span>
              )}
            </button>
          )}


          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
              <button
                type="button"
                className="
                  flex
                  items-center
                  gap-2.5
                  rounded-md
                  px-1.5
                  py-1.5
                  text-left
                  transition-colors
                  hover:bg-slate-100
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-brand-500
                  sm:px-2
                "
              >
                <Avatar
                  name={
                    userName
                  }
                  src={
                    avatarUrl
                  }
                  size="sm"
                />


                <div className="hidden min-w-0 xl:block">
                  <p className="max-w-40 truncate text-[13px] font-semibold text-slate-900">
                    {userName}
                  </p>

                  <p className="max-w-40 truncate text-[11px] text-slate-500">
                    {userEmail}
                  </p>
                </div>


                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="hidden text-slate-400 xl:block"
                />
              </button>
            </DropdownMenuTrigger>


            <DropdownMenuContent
              align="end"
              className="w-60"
            >
              <div className="px-2 py-2">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {userName}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {userEmail}
                </p>
              </div>


              <DropdownMenuSeparator />


              <DropdownMenuLabel>
                Account
              </DropdownMenuLabel>


              <DropdownMenuItem
                onSelect={() => {
                  navigate(
                    '/app/settings#profile',
                  )
                }}
              >
                <UserRound
                  size={16}
                  aria-hidden="true"
                />

                Profile
              </DropdownMenuItem>


              <DropdownMenuSeparator />


              <DropdownMenuItem
                destructive
                onSelect={() => {
                  void onSignOut()
                }}
              >
                <LogOut
                  size={16}
                  aria-hidden="true"
                />

                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
