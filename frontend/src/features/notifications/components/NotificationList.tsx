import {
  Inbox,
} from 'lucide-react'

import {
  type NotificationItemData,
} from '../../../api/notifications'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../../components/ui'

import {
  getNotificationDateGroup,
} from '../utils/notificationFormat'

import {
  NotificationItem,
} from './NotificationItem'


export const NOTIFICATION_PAGE_SIZE =
  10


type NotificationListProps = {
  readOnly?: boolean

  items:
    NotificationItemData[]

  total: number
  unreadCount: number
  page: number

  showingUnreadOnly:
    boolean

  isLoading: boolean
  isError: boolean

  errorMessage:
    string |
    null

  markingReadId:
    number |
    null

  deletingId:
    number |
    null

  actionError:
    string |
    null

  onMarkRead:
    (id: number) => void

  onDelete:
    (id: number) => void

  onOpenEntity:
    (
      notification:
        NotificationItemData,
    ) => void

  onPrevious: () => void
  onNext: () => void
  onRetry: () => void
}


function groupNotifications(
  items:
    NotificationItemData[],
) {
  const groups =
    new Map<
      string,
      NotificationItemData[]
    >()

  items.forEach(
    (notification) => {
      const group =
        getNotificationDateGroup(
          notification.created_at,
        )

      const existing =
        groups.get(group) ??
        []

      existing.push(
        notification,
      )

      groups.set(
        group,
        existing,
      )
    },
  )

  return Array.from(
    groups.entries(),
  )
}


export function NotificationList({
  readOnly = false,
  items,
  total,
  unreadCount,
  page,
  showingUnreadOnly,
  isLoading,
  isError,
  errorMessage,
  markingReadId,
  deletingId,
  actionError,
  onMarkRead,
  onDelete,
  onOpenEntity,
  onPrevious,
  onNext,
  onRetry,
}: NotificationListProps) {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
          NOTIFICATION_PAGE_SIZE,
      ),
    )

  const groups =
    groupNotifications(
      items,
    )


  return (
    <Card className="mt-5 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Inbox
              size={17}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Notification activity
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {readOnly
                ? 'Sample activity with read and delete actions locked for the shared demo.'
                : 'Important workspace events in one place.'}
            </p>
          </div>
        </div>


        <div className="flex flex-wrap gap-2">
          <Badge>
            {total} total
          </Badge>

          <Badge
            variant={
              unreadCount > 0
                ? 'brand'
                : undefined
            }
          >
            {unreadCount} unread
          </Badge>
        </div>
      </div>


      {actionError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 sm:px-6">
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {actionError}
          </p>
        </div>
      )}


      {isLoading ? (
        <div className="space-y-3 p-5 sm:p-6">
          {Array.from({
            length: 5,
          }).map(
            (
              _,
              index,
            ) => (
              <Skeleton
                key={index}
                className="h-28 rounded-xl"
              />
            ),
          )}
        </div>
      ) : isError ? (
        <div className="p-5 sm:p-6">
          <ErrorState
            title="Unable to load notifications"
            description={
              errorMessage ??
              "Averlen couldn't load notifications."
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={
                  onRetry
                }
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            showingUnreadOnly
              ? "You're all caught up"
              : 'No notifications yet'
          }
          description={
            showingUnreadOnly
              ? 'You have no unread notifications.'
              : 'Important Averlen activity will appear here.'
          }
        />
      ) : (
        <>
          {groups.map(
            ([
              group,
              notifications,
            ]) => (
              <section
                key={group}
              >
                <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-2.5 sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {group}
                  </p>
                </div>


                <div className="divide-y divide-slate-200">
                  {notifications.map(
                    (
                      notification,
                    ) => (
                      <NotificationItem
                        readOnly={
                          readOnly
                        }
                        key={
                          notification.id
                        }
                        notification={
                          notification
                        }
                        isMarkingRead={
                          markingReadId ===
                          notification.id
                        }
                        isDeleting={
                          deletingId ===
                          notification.id
                        }
                        onMarkRead={
                          onMarkRead
                        }
                        onDelete={
                          onDelete
                        }
                        onOpenEntity={
                          onOpenEntity
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            ),
          )}


          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Page {page} of{' '}
              {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={
                  page <= 1
                }
                onClick={
                  onPrevious
                }
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={
                  page >=
                  totalPages
                }
                onClick={
                  onNext
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
