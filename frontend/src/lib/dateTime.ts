const AVERLEN_TIME_ZONE =
  'Asia/Kolkata'


function hasTimezoneInformation(
  value: string,
) {
  return (
    /Z$/i.test(value) ||
    /[+-]\d{2}:\d{2}$/.test(
      value,
    )
  )
}


export function parseApiDate(
  value:
    string |
    null |
    undefined,
): Date | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    hasTimezoneInformation(
      value,
    )
      ? value
      : `${value}Z`

  const date =
    new Date(
      normalizedValue,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date
}


export function formatDateIST(
  value:
    string |
    null |
    undefined,
) {
  const date =
    parseApiDate(
      value,
    )

  if (!date) {
    return value ?? '—'
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',

      timeZone:
        AVERLEN_TIME_ZONE,
    },
  ).format(
    date,
  )
}


export function formatDateTimeIST(
  value:
    string |
    null |
    undefined,
) {
  const date =
    parseApiDate(
      value,
    )

  if (!date) {
    return value ?? '—'
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',

      hour12:
        true,

      timeZone:
        AVERLEN_TIME_ZONE,
    },
  ).format(
    date,
  )
}


export function formatRelativeTime(
  value:
    string |
    null |
    undefined,
) {
  const date =
    parseApiDate(
      value,
    )

  if (!date) {
    return value ?? '—'
  }

  const difference =
    Date.now() -
    date.getTime()


  if (
    difference <=
    30_000
  ) {
    return 'Just now'
  }


  const minutes =
    Math.floor(
      difference /
      60_000,
    )


  if (minutes < 1) {
    return 'Just now'
  }


  if (minutes < 60) {
    return (
      `${minutes}m ago`
    )
  }


  const hours =
    Math.floor(
      minutes /
      60,
    )


  if (hours < 24) {
    return (
      `${hours}h ago`
    )
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
    return (
      `${days}d ago`
    )
  }


  return formatDateIST(
    value,
  )
}


export function isApiDateExpired(
  value:
    string |
    null |
    undefined,
) {
  const date =
    parseApiDate(
      value,
    )

  if (!date) {
    return false
  }

  return (
    date.getTime() <
    Date.now()
  )
}