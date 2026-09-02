import {
  useState,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  CheckCheck,
  Settings2,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  ApiError,
} from '../../api/client'

import {
  deleteNotification,
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type NotificationItemData,
  type NotificationPreferenceKey,
} from '../../api/notifications'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
  Button,
} from '../../components/ui'

import {
  toast,
} from '../../lib/toast'

import {
  useAuth,
} from '../auth/auth-context'

import {
  NotificationFilters,
} from './components/NotificationFilters'

import {
  NotificationList,
  NOTIFICATION_PAGE_SIZE,
} from './components/NotificationList'

import {
  NotificationPreferences,
} from './components/NotificationPreferences'

import {
  getNotificationDestination,
  NOTIFICATION_REFRESH_INTERVAL_MS,
} from './utils/notificationFormat'


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  if (
    error instanceof Error
  ) {
    return error.message
  }

  return fallback
}


export function NotificationsPage() {
  const {
    user,
    demoReadOnly,
  } =
    useAuth()

  const navigate =
    useNavigate()

  const queryClient =
    useQueryClient()


  const [
    notificationType,
    setNotificationType,
  ] =
    useState('ALL')

  const [
    includeRead,
    setIncludeRead,
  ] =
    useState(true)

  const [
    page,
    setPage,
  ] =
    useState(1)

  const [
    showPreferences,
    setShowPreferences,
  ] =
    useState(false)

  const [
    preferenceError,
    setPreferenceError,
  ] =
    useState<
      string |
      null
    >(null)


  const canManageTeam =
    user?.role ===
    'ORG_ADMIN'


  const offset =
    (
      page -
      1
    ) *
    NOTIFICATION_PAGE_SIZE


  const notificationsQuery =
    useQuery({
      queryKey: [
        'notifications',
        'list',
        {
          notificationType,
          includeRead,
          page,
        },
      ],

      queryFn: () =>
        getNotifications({
          includeRead,

          notificationType:
            notificationType ===
            'ALL'
              ? undefined
              : notificationType,

          limit:
            NOTIFICATION_PAGE_SIZE,

          offset,
        }),

      placeholderData:
        (previousData) =>
          previousData,

      staleTime: 5_000,

      refetchInterval:
        NOTIFICATION_REFRESH_INTERVAL_MS,

      refetchOnWindowFocus:
        true,
    })


  const preferencesQuery =
    useQuery({
      queryKey: [
        'notifications',
        'preferences',
      ],

      queryFn:
        getNotificationPreferences,

      enabled:
        showPreferences,
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

      onError:
        (error) => {
          toast.error(
            'Unable to mark notification as read',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't mark the notification as read.",
                ),
            },
          )
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

          toast.success(
            'All notifications marked as read',
          )
        },

      onError:
        (error) => {
          toast.error(
            'Unable to mark all notifications as read',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't mark all notifications as read.",
                ),
            },
          )
        },
    })


  const deleteMutation =
    useMutation({
      mutationFn:
        deleteNotification,

      onSuccess:
        async () => {
          const deletingLastItem =
            (
              notificationsQuery
                .data
                ?.items
                .length ??
              0
            ) === 1

          if (
            deletingLastItem &&
            page > 1
          ) {
            setPage(
              (
                current,
              ) =>
                Math.max(
                  1,
                  current - 1,
                ),
            )
          }

          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
              ],
            })

          toast.success(
            'Notification deleted',
          )
        },

      onError:
        (error) => {
          toast.error(
            'Unable to delete notification',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't delete the notification.",
                ),
            },
          )
        },
    })


  const preferenceMutation =
    useMutation({
      mutationFn:
        ({
          key,
          value,
        }: {
          key:
            NotificationPreferenceKey

          value:
            boolean
        }) =>
          updateNotificationPreferences({
            [key]:
              value,
          }),

      onMutate: () => {
        setPreferenceError(
          null,
        )
      },

      onSuccess:
        async () => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
                'preferences',
              ],
            })
        },

      onError:
        (error) => {
          setPreferenceError(
            getErrorMessage(
              error,
              "Averlen couldn't update notification preferences.",
            ),
          )
        },
    })


  const notifications =
    notificationsQuery.data

  const unreadCount =
    notifications
      ?.unread_count ??
    0


  function handleOpenEntity(
    notification:
      NotificationItemData,
  ) {
    const destination =
      getNotificationDestination(
        notification,
        {
          canManageTeam,
        },
      )

    if (!destination) {
      return
    }

    if (
      !demoReadOnly &&
      !notification.is_read
    ) {
      void markReadMutation
        .mutateAsync(
          notification.id,
        )
        .catch(() => {
        })
        .finally(() => {
          navigate(
            destination,
          )
        })

      return
    }

    navigate(
      destination,
    )
  }


  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Stay on top of imports, pricing opportunities, workspace activity and security events."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {notificationsQuery
              .isPlaceholderData && (
              <Badge variant="brand">
                Updating
              </Badge>
            )}

            <Badge
              variant={
                unreadCount > 0
                  ? 'brand'
                  : undefined
              }
            >
              {unreadCount}{' '}
              unread
            </Badge>


            {demoReadOnly ? (
              <Badge variant="warning">
                Demo preview · read state fixed
              </Badge>
            ) : (
              <Button
                variant="secondary"
                disabled={
                  unreadCount === 0 ||
                  markAllMutation.isPending
                }
                onClick={() => {
                  markAllMutation.mutate()
                }}
              >
                <CheckCheck
                  size={16}
                  aria-hidden="true"
                />

                {markAllMutation.isPending
                  ? 'Marking...'
                  : 'Mark all read'}
              </Button>
            )}


            <Button
              variant="secondary"
              onClick={() => {
                setShowPreferences(
                  (
                    current,
                  ) =>
                    !current,
                )
              }}
            >
              <Settings2
                size={16}
                aria-hidden="true"
              />

              {showPreferences
                ? 'Hide preferences'
                : 'Preferences'}
            </Button>
          </div>
        }
      />


      <NotificationFilters
        notificationType={
          notificationType
        }
        includeRead={
          includeRead
        }
        onTypeChange={(
          value,
        ) => {
          setNotificationType(
            value,
          )

          setPage(1)

        }}
        onIncludeReadChange={(
          value,
        ) => {
          setIncludeRead(
            value,
          )

          setPage(1)

        }}
      />


      <NotificationList
        readOnly={
          demoReadOnly
        }
        items={
          notifications
            ?.items ??
          []
        }
        total={
          notifications
            ?.total ??
          0
        }
        unreadCount={
          unreadCount
        }
        page={
          page
        }
        showingUnreadOnly={
          !includeRead
        }
        isLoading={
          notificationsQuery.isLoading
        }
        isError={
          notificationsQuery.isError
        }
        errorMessage={
          notificationsQuery.isError
            ? getErrorMessage(
                notificationsQuery.error,
                "Averlen couldn't load notifications.",
              )
            : null
        }
        actionError={
          null
        }
        markingReadId={
          markReadMutation.isPending
            ? markReadMutation.variables ??
              null
            : null
        }
        deletingId={
          deleteMutation.isPending
            ? deleteMutation.variables ??
              null
            : null
        }
        onMarkRead={(
          id,
        ) => {
          markReadMutation.mutate(
            id,
          )
        }}
        onDelete={(
          id,
        ) => {
          deleteMutation.mutate(
            id,
          )
        }}
        onOpenEntity={
          handleOpenEntity
        }
        onPrevious={() => {
          setPage(
            (
              current,
            ) =>
              Math.max(
                1,
                current - 1,
              ),
          )
        }}
        onNext={() => {
          setPage(
            (
              current,
            ) =>
              current + 1,
          )
        }}
        onRetry={() => {
          void notificationsQuery.refetch()
        }}
      />


      {showPreferences && (
        <NotificationPreferences
          readOnly={
            demoReadOnly
          }
          preferences={
            preferencesQuery.data
          }
          isLoading={
            preferencesQuery.isLoading
          }
          isError={
            preferencesQuery.isError
          }
          errorMessage={
            preferencesQuery.isError
              ? getErrorMessage(
                  preferencesQuery.error,
                  "Averlen couldn't load notification preferences.",
                )
              : null
          }
          updatingKey={
            preferenceMutation.isPending
              ? preferenceMutation
                  .variables
                  ?.key ??
                null
              : null
          }
          updateError={
            preferenceError
          }
          onToggle={(
            key,
            value,
          ) => {
            preferenceMutation.mutate({
              key,
              value,
            })
          }}
          onRetry={() => {
            void preferencesQuery.refetch()
          }}
        />
      )}
    </div>
  )
}
