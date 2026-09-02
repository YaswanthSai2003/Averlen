import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Bell,
  CheckCheck,
  Inbox,
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


function getPriorityDotClass(
  priority: string,
) {
  switch (
    priority.toUpperCase()
  ) {
    case 'SUCCESS':
      return 'bg-emerald-500'

    case 'WARNING':
      return 'bg-amber-500'

    case 'ERROR':
      return 'bg-red-500'

    default:
      return 'bg-brand-500'
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
        align="end"
        className="w-[380px] max-w-[calc(100vw-24px)] p-0"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Notifications
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'You are all caught up'}
            </p>
          </div>


          {demoReadOnly ? (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-700">
              Demo preview
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


        <DropdownMenuSeparator />


        {demoReadOnly && (
          <div className="border-b border-amber-100 bg-amber-50/70 px-4 py-2.5">
            <p className="text-xs leading-5 text-amber-800">
              Read status is intentionally fixed so every visitor sees the same sample notification feed.
            </p>
          </div>
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
                  <div className="h-3 w-32 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-1 h-3 w-2/3 rounded bg-slate-100" />
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
              Important Averlen
              activity will appear here.
            </p>
          </div>
        ) : (
          <div className="scrollbar-hidden max-h-[400px] overflow-y-auto py-1">
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
                    className="
                      cursor-pointer
                      items-start
                      gap-3
                      rounded-none
                      px-4
                      py-3
                      focus:bg-slate-50
                    "
                    onSelect={() => {
                      void openNotification(
                        notification,
                      )
                    }}
                  >
                    <span
                      className={`
                        mt-1.5
                        size-2
                        shrink-0
                        rounded-full
                        ${
                          notification.is_read
                            ? 'bg-slate-300'
                            : getPriorityDotClass(
                                notification.priority,
                              )
                        }
                      `}
                    />


                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={
                            notification.is_read
                              ? 'truncate text-sm font-medium text-slate-700'
                              : 'truncate text-sm font-semibold text-slate-950'
                          }
                        >
                          {notification.title}
                        </p>

                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelativeNotificationTime(
                            notification.created_at,
                          )}
                        </span>
                      </div>


                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
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


        <DropdownMenuSeparator />


        <DropdownMenuItem
          className="
            cursor-pointer
            justify-center
            rounded-none
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
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
