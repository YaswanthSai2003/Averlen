import {
  type ReactNode,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  ArrowRight,
  Bell,
  CheckCheck,
  Database,
  Inbox,
  IndianRupee,
  Info,
  Settings,
  Shield,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItemData,
} from '../../../api/notifications'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui'

import {
  useAuth,
} from '../../auth/auth-context'

import {
  formatNotificationMessage,
  formatRelativeNotificationTime,
  getNotificationDestination,
  NOTIFICATION_REFRESH_INTERVAL_MS,
} from '../utils/notificationFormat'


const RECENT_NOTIFICATION_LIMIT =
  5


function getNotificationIcon(
  type: string,
): ReactNode {
  switch (
    type.toUpperCase()
  ) {
    case 'UPLOAD':
      return (
        <Upload
          size={16}
          aria-hidden="true"
        />
      )

    case 'DATA_QUALITY':
      return (
        <Database
          size={16}
          aria-hidden="true"
        />
      )

    case 'PRICING':
      return (
        <IndianRupee
          size={16}
          aria-hidden="true"
        />
      )

    case 'SECURITY':
      return (
        <Shield
          size={16}
          aria-hidden="true"
        />
      )

    case 'WORKSPACE':
      return (
        <Users
          size={16}
          aria-hidden="true"
        />
      )

    case 'AI_INSIGHT':
      return (
        <Sparkles
          size={16}
          aria-hidden="true"
        />
      )

    case 'SYSTEM':
      return (
        <Settings
          size={16}
          aria-hidden="true"
        />
      )

    default:
      return (
        <Bell
          size={16}
          aria-hidden="true"
        />
      )
  }
}


function getNotificationIconClass(
  priority: string,
) {
  switch (
    priority.toUpperCase()
  ) {
    case 'SUCCESS':
      return (
        'bg-emerald-50 text-emerald-700'
      )

    case 'WARNING':
      return (
        'bg-amber-50 text-amber-700'
      )

    case 'ERROR':
      return (
        'bg-red-50 text-red-700'
      )

    default:
      return (
        'bg-brand-50 text-brand-700'
      )
  }
}


export function NotificationBellMenu() {
  const {
    user,
    demoReadOnly,
  } =
    useAuth()

  const navigate =
    useNavigate()

  const queryClient =
    useQueryClient()

  const canManageTeam =
    user?.role ===
    'ORG_ADMIN'


  const recentQuery =
    useQuery({
      queryKey: [
        'notifications',
        'topbar',
      ],

      queryFn: () =>
        getNotifications({
          includeRead: true,
          limit:
            RECENT_NOTIFICATION_LIMIT,
          offset: 0,
        }),

      staleTime: 5_000,

      refetchInterval:
        NOTIFICATION_REFRESH_INTERVAL_MS,

      refetchOnWindowFocus:
        true,
    })


  const markReadMutation =
    useMutation({
      mutationFn:
        markNotificationRead,

      onSuccess:
        async () => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
              ],
            })
        },
    })


  const markAllMutation =
    useMutation({
      mutationFn:
        markAllNotificationsRead,

      onSuccess:
        async () => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
              ],
            })
        },
    })


  const unreadCount =
    recentQuery
      .data
      ?.unread_count ??
    0

  const visibleUnreadCount =
    unreadCount > 99
      ? '99+'
      : String(
          unreadCount,
        )


  async function openNotification(
    notification:
      NotificationItemData,
  ) {
    if (
      !notification.is_read &&
      !demoReadOnly
    ) {
      await markReadMutation
        .mutateAsync(
          notification.id,
        )
        .catch(
          () => undefined,
        )
    }

    const destination =
      getNotificationDestination(
        notification,
        {
          canManageTeam,
        },
      )

    navigate(
      destination ??
        '/app/notifications',
    )
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
      >
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'
          }
          className="
            relative
            flex
            size-10
            items-center
            justify-center
            rounded-lg
            text-slate-500
            transition-colors
            hover:bg-slate-100
            hover:text-slate-900
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-500
          "
          onClick={() => {
            void recentQuery.refetch()
          }}
        >
          <Bell
            size={19}
            strokeWidth={1.9}
            aria-hidden="true"
          />


          {unreadCount > 0 && (
            <span
              className="
                absolute
                right-0
                top-0
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
                shadow-sm
              "
            >
              {visibleUnreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>


      <DropdownMenuContent
        align="end" sideOffset={8} collisionPadding={16}
        className="w-[calc(100vw-32px)] max-w-[360px] overflow-hidden rounded-xl p-0 sm:w-[360px]"
        >
        <div className="flex items-start justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">
                Notifications
              </p>

              {unreadCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-50 px-1.5 text-[10px] font-semibold leading-5 text-brand-700">
                  {visibleUnreadCount}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              {unreadCount > 0
                ? 'Recent workspace activity'
                : 'You are all caught up'}
            </p>
          </div>


          {demoReadOnly ? (
            <span className="inline-flex shrink-0 items-center rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700">
              Demo
            </span>
          ) : (
            unreadCount > 0 && (
              <button
                type="button"
                disabled={
                  markAllMutation.isPending
                }
                className="
                  flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-md
                  px-2
                  py-1.5
                  text-xs
                  font-medium
                  text-brand-700
                  transition
                  hover:bg-brand-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
                onClick={() => {
                  markAllMutation.mutate()
                }}
              >
                <CheckCheck
                  size={14}
                  aria-hidden="true"
                />

                {markAllMutation.isPending
                  ? 'Marking...'
                  : 'Mark all read'}
              </button>
            )
          )}
        </div>


        {demoReadOnly && (
          <div className="flex items-start gap-2 border-y border-amber-100 bg-amber-50/60 px-4 py-2">
            <Info
              size={14}
              className="mt-0.5 shrink-0 text-amber-700"
              aria-hidden="true"
            />

            <p className="text-[11px] leading-4 text-amber-800">
              Demo feed — read status stays fixed for every visitor.
            </p>
          </div>
        )}


        {!demoReadOnly && (
          <DropdownMenuSeparator className="my-0" />
        )}


        {recentQuery.isLoading ? (
          <div className="space-y-4 px-4 py-5">
            {Array.from({
              length: 3,
            }).map(
              (
                _,
                index,
              ) => (
                <div
                  key={index}
                  className="animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="size-9 shrink-0 rounded-lg bg-slate-100" />

                    <div className="min-w-0 flex-1">
                      <div className="h-3 w-2/3 rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                      <div className="mt-1 h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : recentQuery.isError ? (
          <div className="px-4 py-7 text-center">
            <p className="text-sm font-medium text-slate-700">
              Unable to load notifications
            </p>

            <button
              type="button"
              className="mt-2 text-xs font-medium text-brand-700"
              onClick={() => {
                void recentQuery.refetch()
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          recentQuery
            .data
            ?.items
            .length ??
          0
        ) === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Inbox
                size={18}
                aria-hidden="true"
              />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-800">
              No notifications yet
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Important Averlen activity will appear here.
            </p>
          </div>
        ) : (
          <div className="scrollbar-hidden max-h-[390px] overflow-y-auto py-1.5">
            {recentQuery
              .data
              ?.items
              .map(
                (
                  notification,
                ) => (
                  <DropdownMenuItem
                    key={
                      notification.id
                    }
                    className={`
                      cursor-pointer
                      items-start
                      gap-3
                      rounded-none
                      px-3.5
                      py-3
                      focus:bg-slate-50
                      ${
                        notification.is_read
                          ? ''
                          : 'bg-brand-50/25'
                      }
                    `}
                    onSelect={() => {
                      void openNotification(
                        notification,
                      )
                    }}
                  >
                    <span
                      className={`
                        flex
                        size-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        ${getNotificationIconClass(
                          notification.priority,
                        )}
                      `}
                    >
                      {getNotificationIcon(
                        notification.type,
                      )}
                    </span>


                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={
                            notification.is_read
                              ? 'line-clamp-1 text-sm font-medium leading-5 text-slate-700'
                              : 'line-clamp-1 text-sm font-semibold leading-5 text-slate-950'
                          }
                        >
                          {notification.title}
                        </p>

                        <span className="shrink-0 pt-0.5 text-[10px] font-medium text-slate-400">
                          {formatRelativeNotificationTime(
                            notification.created_at,
                          )}
                        </span>
                      </div>


                      <p className="mt-1 line-clamp-2 text-xs leading-[1.15rem] text-slate-500">
                        {formatNotificationMessage(
                          notification.type,
                          notification.message,
                        )}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ),
              )}
          </div>
        )}


        <DropdownMenuSeparator className="my-0" />


        <DropdownMenuItem
          className="
            cursor-pointer
            justify-between
            rounded-none
            px-4
            py-3
            text-sm
            font-medium
            text-brand-700
            focus:bg-brand-50
            focus:text-brand-700
          "
          onSelect={() => {
            navigate(
              '/app/notifications',
            )
          }}
        >
          <span>
            View all notifications
          </span>

          <ArrowRight
            size={15}
            aria-hidden="true"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
