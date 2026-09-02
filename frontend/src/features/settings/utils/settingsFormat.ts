import {
  ApiError,
} from '../../../api/client'

import type {
  UserRole,
} from '../../../types/auth'

import {
  formatDateTimeIST,
  formatRelativeTime,
} from '../../../lib/dateTime'


export function getSettingsErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    ApiError
  ) {
    return error.message
  }

  if (
    error instanceof
    Error
  ) {
    return error.message
  }

  return fallback
}


export function formatSettingsRole(
  role: UserRole,
) {
  switch (role) {
    case 'ORG_ADMIN':
      return 'Organization admin'

    case 'REVENUE_MANAGER':
      return 'Revenue manager'

    case 'ANALYST':
      return 'Analyst'

    case 'VIEWER':
      return 'Viewer'
  }
}


export function getSettingsRoleVariant(
  role: UserRole,
) {
  switch (role) {
    case 'ORG_ADMIN':
      return 'brand' as const

    case 'REVENUE_MANAGER':
      return 'success' as const

    case 'ANALYST':
      return 'warning' as const

    default:
      return undefined
  }
}


export function getUserInitials(
  fullName:
    string |
    null,

  email:
    string,
) {
  if (
    fullName?.trim()
  ) {
    const parts =
      fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)

    return parts
      .map(
        (
          part,
        ) =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join('')
  }

  return email
    .charAt(0)
    .toUpperCase()
}


export function formatSessionStarted(
  value: string,
) {
  return formatRelativeTime(
    value,
  )
}


export function formatSessionStartedExact(
  value: string,
) {
  return formatDateTimeIST(
    value,
  )
}


export function formatSessionExpiry(
  value: string,
) {
  return formatDateTimeIST(
    value,
  )
}


export type DeviceInfo = {
  browser: string
  platform: string
  mobile: boolean
}


export function parseUserAgent(
  userAgent:
    string |
    null,
): DeviceInfo {
  if (!userAgent) {
    return {
      browser:
        'Unknown browser',

      platform:
        'Unknown device',

      mobile:
        false,
    }
  }


  let browser =
    'Browser'

  if (
    userAgent.includes(
      'Edg/',
    )
  ) {
    browser =
      'Microsoft Edge'
  } else if (
    userAgent.includes(
      'Chrome/',
    )
  ) {
    browser =
      'Google Chrome'
  } else if (
    userAgent.includes(
      'Firefox/',
    )
  ) {
    browser =
      'Firefox'
  } else if (
    userAgent.includes(
      'Safari/',
    )
  ) {
    browser =
      'Safari'
  }


  let platform =
    'Unknown device'

  if (
    userAgent.includes(
      'Windows',
    )
  ) {
    platform =
      'Windows'
  } else if (
    userAgent.includes(
      'Android',
    )
  ) {
    platform =
      'Android'
  } else if (
    userAgent.includes(
      'iPhone',
    )
  ) {
    platform =
      'iPhone'
  } else if (
    userAgent.includes(
      'iPad',
    )
  ) {
    platform =
      'iPad'
  } else if (
    userAgent.includes(
      'Mac OS',
    )
  ) {
    platform =
      'macOS'
  } else if (
    userAgent.includes(
      'Linux',
    )
  ) {
    platform =
      'Linux'
  }


  const mobile =
    /Android|iPhone|iPad|Mobile/i
      .test(
        userAgent,
      )


  return {
    browser,
    platform,
    mobile,
  }
}


export function getPasswordStrength(
  password: string,
) {
  if (!password) {
    return {
      score: 0,
      label:
        'Enter a new password',
    }
  }


  let score = 0

  if (
    password.length >= 8
  ) {
    score += 1
  }

  if (
    password.length >= 12
  ) {
    score += 1
  }

  if (
    /[a-z]/.test(
      password,
    ) &&
    /[A-Z]/.test(
      password,
    )
  ) {
    score += 1
  }

  if (
    /\d/.test(
      password,
    )
  ) {
    score += 1
  }

  if (
    /[^A-Za-z0-9]/.test(
      password,
    )
  ) {
    score += 1
  }


  if (score <= 1) {
    return {
      score,
      label: 'Weak',
    }
  }

  if (score <= 3) {
    return {
      score,
      label: 'Good',
    }
  }

  return {
    score,
    label: 'Strong',
  }
}