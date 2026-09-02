import {
  formatDateTimeIST,
  formatRelativeTime,
} from '../../../lib/dateTime'


const ACTION_LABELS:
  Record<string, string> = {
    LOGIN_ATTEMPT:
      'Login attempt',

    REGISTER_ATTEMPT:
      'Registration attempt',

    DEMO_LOGIN:
      'Demo login',

    PROPERTY_ACCESS:
      'Property access',

    UPLOAD_ACCESS:
      'Data import access',

    ANALYTICS_VIEWED:
      'Analytics viewed',

    PRICING_VIEWED:
      'Pricing accessed',

    AI_INSIGHT_ACCESSED:
      'AI insight accessed',

    AUDIT_LOGS_VIEWED:
      'Audit logs viewed',

    DOCS_VIEWED:
      'API docs viewed',

    API_ACCESS:
      'API access',
  }


export function formatAuditAction(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toUpperCase()

  if (
    ACTION_LABELS[
      normalized
    ]
  ) {
    return ACTION_LABELS[
      normalized
    ]
  }

  return value
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
        character
          .toUpperCase(),
    )
}


export function formatAuditTimestamp(
  value: string,
) {
  return formatDateTimeIST(
    value,
  )
}


export function formatAuditRelativeTime(
  value: string,
) {
  return formatRelativeTime(
    value,
  )
}


export function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-IN',
  ).format(
    value,
  )
}


export function formatDuration(
  value: number,
) {
  if (
    value < 1
  ) {
    return (
      `${value.toFixed(2)} ms`
    )
  }

  if (
    value < 100
  ) {
    return (
      `${value.toFixed(1)} ms`
    )
  }

  return (
    `${Math.round(
      value,
    )} ms`
  )
}


export function getMethodClasses(
  method: string,
) {
  switch (
    method.toUpperCase()
  ) {
    case 'POST':
      return (
        'border-brand-200 ' +
        'bg-brand-50 ' +
        'text-brand-700'
      )

    case 'PUT':
    case 'PATCH':
      return (
        'border-amber-200 ' +
        'bg-amber-50 ' +
        'text-amber-700'
      )

    case 'DELETE':
      return (
        'border-red-200 ' +
        'bg-red-50 ' +
        'text-red-700'
      )

    default:
      return (
        'border-slate-200 ' +
        'bg-slate-50 ' +
        'text-slate-600'
      )
  }
}


export function getStatusClasses(
  statusCode: number,
) {
  if (
    statusCode >= 500
  ) {
    return (
      'bg-red-50 ' +
      'text-red-700'
    )
  }

  if (
    statusCode >= 400
  ) {
    return (
      'bg-amber-50 ' +
      'text-amber-700'
    )
  }

  if (
    statusCode >= 200 &&
    statusCode < 300
  ) {
    return (
      'bg-emerald-50 ' +
      'text-emerald-700'
    )
  }

  return (
    'bg-slate-100 ' +
    'text-slate-600'
  )
}


export function getDurationClasses(
  durationMs: number,
) {
  if (
    durationMs < 100
  ) {
    return 'text-emerald-700'
  }

  if (
    durationMs <= 500
  ) {
    return 'text-amber-700'
  }

  return 'text-red-700'
}


export function getUserInitial(
  email:
    string |
    null,
) {
  if (!email) {
    return '?'
  }

  return email
    .trim()
    .charAt(0)
    .toUpperCase()
}


export function formatUserAgent(
  userAgent:
    string |
    null,
) {
  if (!userAgent) {
    return 'Unknown device'
  }

  let browser =
    'Browser'

  let platform =
    'Unknown OS'


  if (
    userAgent.includes(
      'Edg/',
    )
  ) {
    browser = 'Microsoft Edge'
  } else if (
    userAgent.includes(
      'Chrome/',
    )
  ) {
    browser = 'Google Chrome'
  } else if (
    userAgent.includes(
      'Firefox/',
    )
  ) {
    browser = 'Firefox'
  } else if (
    userAgent.includes(
      'Safari/',
    )
  ) {
    browser = 'Safari'
  }


  if (
    userAgent.includes(
      'Windows',
    )
  ) {
    platform = 'Windows'
  } else if (
    userAgent.includes(
      'Mac OS',
    )
  ) {
    platform = 'macOS'
  } else if (
    userAgent.includes(
      'Android',
    )
  ) {
    platform = 'Android'
  } else if (
    userAgent.includes(
      'iPhone',
    ) ||
    userAgent.includes(
      'iPad',
    )
  ) {
    platform = 'iOS'
  } else if (
    userAgent.includes(
      'Linux',
    )
  ) {
    platform = 'Linux'
  }


  return (
    `${browser} · ${platform}`
  )
}


export function formatAuditPath(
  path: string,
) {
  return path || '/'
}