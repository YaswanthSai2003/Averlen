import {
  formatDecimal,
} from '../../../lib/format'


export function getDashboardChangeTone(
  change:
    number |
    null |
    undefined,
) {
  if (
    change === null ||
    change === undefined
  ) {
    return undefined
  }

  if (change > 0) {
    return 'positive' as const
  }

  if (change < 0) {
    return 'negative' as const
  }

  return 'neutral' as const
}


export function formatDashboardChange(
  change:
    number |
    null |
    undefined,
) {
  if (
    change === null ||
    change === undefined
  ) {
    return undefined
  }

  const prefix =
    change > 0
      ? '+'
      : ''

  return (
    `${prefix}${formatDecimal(
      change,
      1,
    )}%`
  )
}


export function getTodayDateValue() {
  const date =
    new Date()

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() +
      1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}


function parseDashboardDate(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }

  return new Date(
    year,
    month - 1,
    day,
  )
}


export function formatDashboardDate(
  value: string,
) {
  const date =
    parseDashboardDate(
      value,
    )

  if (!date) {
    return value
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    date,
  )
}


export function formatDashboardFullDate(
  value: string,
) {
  return formatDashboardDate(
    value,
  )
}


export function formatDashboardChartDate(
  value: string,
  includeYear = false,
) {
  const date =
    parseDashboardDate(
      value,
    )

  if (!date) {
    return value
  }

  const label =
    new Intl.DateTimeFormat(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
      },
    ).format(
      date,
    )

  if (!includeYear) {
    return label
  }

  return (
    `${label} ’${String(
      date.getFullYear(),
    ).slice(-2)}`
  )
}
