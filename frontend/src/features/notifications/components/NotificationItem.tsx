import {
  Bell,
  Check,
  Database,
  IndianRupee,
  MoreHorizontal,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import {
  type NotificationItemData,
} from '../../../api/notifications'

import {
  Badge,
  Button,
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
  formatNotificationDateTime,
  formatNotificationMessage,
  formatNotificationPriority,
  formatNotificationType,
  formatRelativeNotificationTime,
  getNotificationActionLabel,
  getNotificationPriorityVariant,
  getNotificationTypeVariant,
} from '../utils/notificationFormat'


type NotificationItemProps = {
  readOnly?: boolean

  notification:
    NotificationItemData

  isMarkingRead: boolean
  isDeleting: boolean

  onMarkRead:
    (id: number) => void

  onDelete:
    (id: number) => void

  onOpenEntity:
    (
      notification:
        NotificationItemData,
    ) => void
}


function getNotificationIcon(
  type: string,
): ReactNode {
  switch (
    type.toUpperCase()
  ) {
    case 'UPLOAD':
      return (
        <Upload
          size={18}
          aria-hidden="true"
        />
      )

    case 'DATA_QUALITY':
      return (
        <Database
          size={18}
          aria-hidden="true"
        />
      )

    case 'PRICING':
      return (
        <IndianRupee
          size={18}
          aria-hidden="true"
        />
      )

    case 'SECURITY':
      return (
        <Shield
          size={18}
          aria-hidden="true"
        />
      )

    case 'WORKSPACE':
      return (
        <Users
          size={18}
          aria-hidden="true"
        />
      )

    case 'AI_INSIGHT':
      return (
        <Sparkles
          size={18}
          aria-hidden="true"
        />
      )

    case 'SYSTEM':
      return (
        <Settings
          size={18}
          aria-hidden="true"
        />
      )

    default:
      return (
        <Bell
          size={18}
          aria-hidden="true"
        />
      )
  }
}


function getIconClass(
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


export function NotificationItem({
  readOnly = false,
  notification,
  isMarkingRead,
  isDeleting,
  onMarkRead,
  onDelete,
  onOpenEntity,
}: NotificationItemProps) {
  const {
    user,
  } =
    useAuth()

  const canManageTeam =
    user?.role ===
    'ORG_ADMIN'

  const actionLabel =
    getNotificationActionLabel(
      notification,
      {
        canManageTeam,
      },
    )

  const canOpen =
    actionLabel !== null

  const formattedMessage =
    formatNotificationMessage(
      notification.type,
      notification.message,
    )

  const showPriority =
    notification
      .priority
      .toUpperCase() !==
    'INFO'


  function handleRowClick(
    event:
      MouseEvent<HTMLElement>,
  ) {
    if (!canOpen) {
      return
    }

    const target =
      event.target

    if (
      target instanceof
        HTMLElement &&
      target.closest(
        'button, a, input, select, textarea, [role="menuitem"]',
      )
    ) {
      return
    }

    onOpenEntity(
      notification,
    )
  }


  function handleRowKeyDown(
    event:
      KeyboardEvent<HTMLElement>,
  ) {
    if (
      !canOpen ||
      event.target !==
        event.currentTarget
    ) {
      return
    }

    if (
      event.key ===
        'Enter' ||
      event.key ===
        ' '
    ) {
      event.preventDefault()

      onOpenEntity(
        notification,
      )
    }
  }


  return (
    <article
      role={
        canOpen
          ? 'link'
          : undefined
      }
      tabIndex={
        canOpen
          ? 0
          : undefined
      }
      onClick={
        handleRowClick
      }
      onKeyDown={
        handleRowKeyDown
      }
      className={`
        relative
        px-5
        py-5
        transition-colors
        sm:px-6
        ${
          notification.is_read
            ? 'bg-white'
            : 'bg-brand-50/20'
        }
        ${
          canOpen
            ? 'cursor-pointer hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500'
            : ''
        }
      `}
    >
      {!notification.is_read && (
        <div className="absolute inset-y-0 left-0 w-0.5 bg-brand-500" />
      )}


      <div className="flex items-start gap-4">
        <div
          className={`
            flex
            size-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${getIconClass(
              notification.priority,
            )}
          `}
        >
          {getNotificationIcon(
            notification.type,
          )}
        </div>


        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {!notification.is_read && (
                  <span
                    className="size-2 rounded-full bg-brand-500"
                    aria-label="Unread"
                  />
                )}

                <Badge
                  variant={
                    getNotificationTypeVariant(
                      notification.type,
                    )
                  }
                >
                  {formatNotificationType(
                    notification.type,
                  )}
                </Badge>

                {showPriority && (
                  <Badge
                    variant={
                      getNotificationPriorityVariant(
                        notification.priority,
                      )
                    }
                  >
                    {formatNotificationPriority(
                      notification.priority,
                    )}
                  </Badge>
                )}

                <time
                  dateTime={
                    notification.created_at
                  }
                  title={
                    formatNotificationDateTime(
                      notification.created_at,
                    )
                  }
                  className="text-xs text-slate-400"
                >
                  {formatRelativeNotificationTime(
                    notification.created_at,
                  )}
                </time>
              </div>


              <h3 className="mt-2 text-[15px] font-semibold leading-6 text-slate-950">
                {notification.title}
              </h3>

              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                {formattedMessage}
              </p>
            </div>


            <div className="flex shrink-0 items-center gap-2">
              {actionLabel && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(
                    event,
                  ) => {
                    event.stopPropagation()

                    onOpenEntity(
                      notification,
                    )
                  }}
                >
                  {actionLabel}
                </Button>
              )}


              {!readOnly && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                  asChild
                >
                  <button
                    type="button"
                    aria-label="Notification actions"
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation()
                    }}
                    className="
                      flex
                      size-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-slate-500
                      transition
                      hover:bg-slate-50
                      hover:text-slate-900
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-brand-500
                    "
                  >
                    <MoreHorizontal
                      size={17}
                      aria-hidden="true"
                    />
                  </button>
                </DropdownMenuTrigger>


                <DropdownMenuContent
                  align="end"
                  className="w-44"
                >
                  {!notification.is_read && (
                    <>
                      <DropdownMenuItem
                        disabled={
                          isMarkingRead
                        }
                        onSelect={() => {
                          onMarkRead(
                            notification.id,
                          )
                        }}
                      >
                        <Check
                          size={15}
                          aria-hidden="true"
                        />

                        {isMarkingRead
                          ? 'Marking...'
                          : 'Mark as read'}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                    </>
                  )}


                  <DropdownMenuItem
                    destructive
                    disabled={
                      isDeleting
                    }
                    onSelect={() => {
                      onDelete(
                        notification.id,
                      )
                    }}
                  >
                    <Trash2
                      size={15}
                      aria-hidden="true"
                    />

                    {isDeleting
                      ? 'Deleting...'
                      : 'Delete'}
                  </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
