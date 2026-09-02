import type {
  NotificationItemData,
} from '../../../api/notifications'


export const NOTIFICATION_REFRESH_INTERVAL_MS =
  10_000


export const NOTIFICATION_TYPES = [
  {
    value: 'ALL',
    label: 'All types',
  },
  {
    value: 'UPLOAD',
    label: 'Uploads',
  },
  {
    value: 'DATA_QUALITY',
    label: 'Data quality',
  },
  {
    value: 'PRICING',
    label: 'Pricing',
  },
  {
    value: 'SECURITY',
    label: 'Security',
  },
  {
    value: 'WORKSPACE',
    label: 'Workspace',
  },
  {
    value: 'AI_INSIGHT',
    label: 'AI insights',
  },
  {
    value: 'SYSTEM',
    label: 'System',
  },
]


export type NotificationDateGroup =
  | 'Today'
  | 'Yesterday'
  | 'This week'
  | 'Earlier'


type NotificationNavigationOptions = {
  canManageTeam?: boolean
}


export function formatNotificationDateTime(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}


export function formatRelativeNotificationTime(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  const difference =
    Date.now() -
    date.getTime()

  if (difference <= 0) {
    return 'Just now'
  }

  const seconds =
    Math.floor(
      difference /
      1000,
    )

  if (seconds < 60) {
    return 'Just now'
  }

  const minutes =
    Math.floor(
      seconds /
      60,
    )

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours =
    Math.floor(
      minutes /
      60,
    )

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days =
    Math.floor(
      hours /
      24,
    )

  if (days === 1) {
    return 'Yesterday'
  }

  if (days < 7) {
    return `${days}d ago`
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
    },
  ).format(date)
}


export function getNotificationDateGroup(
  value: string,
): NotificationDateGroup {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Earlier'
  }

  const now =
    new Date()

  const todayStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )

  const dateStart =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )

  const differenceDays =
    Math.round(
      (
        todayStart.getTime() -
        dateStart.getTime()
      ) /
        86_400_000,
    )

  if (differenceDays <= 0) {
    return 'Today'
  }

  if (differenceDays === 1) {
    return 'Yesterday'
  }

  if (differenceDays < 7) {
    return 'This week'
  }

  return 'Earlier'
}


export function formatNotificationType(
  type: string,
) {
  switch (
    type.toUpperCase()
  ) {
    case 'UPLOAD':
      return 'Upload'

    case 'DATA_QUALITY':
      return 'Data quality'

    case 'PRICING':
      return 'Pricing'

    case 'SECURITY':
      return 'Security'

    case 'WORKSPACE':
      return 'Workspace'

    case 'AI_INSIGHT':
      return 'AI insight'

    case 'SYSTEM':
      return 'System'

    default:
      return type
        .replace(
          /_/g,
          ' ',
        )
        .toLowerCase()
        .replace(
          /\b\w/g,
          (
            character,
          ) =>
            character.toUpperCase(),
        )
  }
}


export function getNotificationTypeVariant(
  type: string,
) {
  switch (
    type.toUpperCase()
  ) {
    case 'PRICING':
    case 'AI_INSIGHT':
      return 'brand' as const

    case 'UPLOAD':
      return 'success' as const

    case 'DATA_QUALITY':
      return 'warning' as const

    case 'SECURITY':
      return 'danger' as const

    default:
      return undefined
  }
}


export function formatNotificationPriority(
  priority: string,
) {
  switch (
    priority.toUpperCase()
  ) {
    case 'INFO':
      return 'Info'

    case 'SUCCESS':
      return 'Success'

    case 'WARNING':
      return 'Warning'

    case 'ERROR':
      return 'Error'

    default:
      return priority
  }
}


export function getNotificationPriorityVariant(
  priority: string,
) {
  switch (
    priority.toUpperCase()
  ) {
    case 'SUCCESS':
      return 'success' as const

    case 'WARNING':
      return 'warning' as const

    case 'ERROR':
      return 'danger' as const

    case 'INFO':
      return 'brand' as const

    default:
      return undefined
  }
}


export function getNotificationDestination(
  notification:
    NotificationItemData,

  options:
    NotificationNavigationOptions = {},
): string | null {
  const {
    canManageTeam = false,
  } = options


  switch (
    notification
      .type
      .toUpperCase()
  ) {
    case 'SECURITY':
      return '/app/settings'

    case 'PRICING':
      return '/app/pricing'

    case 'AI_INSIGHT':
      return '/app/insights'
  }


  if (
    notification.entity_type ===
      'property' &&
    notification.entity_id !==
      null
  ) {
    return (
      `/app/properties/${notification.entity_id}`
    )
  }


  if (
    notification.entity_type ===
    'upload_job'
  ) {
    return '/app/imports'
  }


  if (
    (
      notification.entity_type ===
        'user' ||
      notification.entity_type ===
        'invite'
    ) &&
    canManageTeam
  ) {
    return '/app/team'
  }


  if (
    notification
      .type
      .toUpperCase() ===
      'WORKSPACE' &&
    canManageTeam
  ) {
    return '/app/team'
  }


  return null
}


export function getNotificationActionLabel(
  notification:
    NotificationItemData,

  options:
    NotificationNavigationOptions = {},
): string | null {
  const destination =
    getNotificationDestination(
      notification,
      options,
    )


  if (!destination) {
    return null
  }


  switch (
    notification
      .type
      .toUpperCase()
  ) {
    case 'SECURITY':
      return 'Open settings'

    case 'PRICING':
      return 'Open pricing'

    case 'AI_INSIGHT':
      return 'Open insights'
  }


  switch (
    notification.entity_type
  ) {
    case 'property':
      return 'View property'

    case 'upload_job':
      return 'Open import'

    case 'user':
    case 'invite':
      return 'View team'
  }


  if (
    notification
      .type
      .toUpperCase() ===
    'WORKSPACE'
  ) {
    return 'View team'
  }


  return null
}


function formatCurrency(
  rawValue: string,
) {
  const numericValue =
    Number(
      rawValue.replace(
        /,/g,
        '',
      ),
    )


  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return rawValue
  }


  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  ).format(
    numericValue,
  )
}


function formatPercent(
  rawValue: string,
) {
  const numericValue =
    Number(
      rawValue,
    )


  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return rawValue
  }


  return new Intl.NumberFormat(
    'en-IN',
    {
      maximumFractionDigits: 1,
    },
  ).format(
    Math.abs(
      numericValue,
    ),
  )
}


export function formatNotificationMessage(
  type: string,
  message: string,
) {
  const normalizedType =
    type.toUpperCase()


  if (
    normalizedType ===
    'PRICING'
  ) {
    const match =
      message.match(
        /^(.*?) has a ([+-]?\d+(?:\.\d+)?)% (increase|decrease) recommendation\. Current base price: ([\d,.]+), recommended price: ([\d,.]+)\.?$/i,
      )


    if (match) {
      const [
        ,
        propertyName,
        percentage,
        direction,
        currentPrice,
        recommendedPrice,
      ] = match


      const arrow =
        direction
          .toLowerCase() ===
        'increase'
          ? '↑'
          : '↓'


      return (
        `${propertyName} · ` +
        `${formatCurrency(
          currentPrice,
        )} → ` +
        `${formatCurrency(
          recommendedPrice,
        )} · ` +
        `${arrow} ${formatPercent(
          percentage,
        )}%`
      )
    }
  }


  if (
    normalizedType ===
      'DATA_QUALITY' ||
    normalizedType ===
      'UPLOAD'
  ) {
    const issueMatch =
      message.match(
        /^(.*?) processed (\d+) row\(s\), with (\d+) failed row\(s\), (\d+) duplicate row\(s\), and (\d+) skipped row\(s\)\.?$/i,
      )


    if (issueMatch) {
      const [
        ,
        fileName,
        imported,
        failed,
        duplicates,
        skipped,
      ] = issueMatch


      return (
        `${fileName} · ` +
        `${imported} imported · ` +
        `${failed} failed · ` +
        `${duplicates} duplicate · ` +
        `${skipped} skipped`
      )
    }


    const successMatch =
      message.match(
        /^(.*?) processed successfully with (\d+) row\(s\)\.?$/i,
      )


    if (successMatch) {
      const [
        ,
        fileName,
        rows,
      ] = successMatch


      return (
        `${fileName} · ` +
        `${rows} rows imported successfully`
      )
    }
  }


  return message
}