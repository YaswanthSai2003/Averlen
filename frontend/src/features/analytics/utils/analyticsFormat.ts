import {
  formatDecimal,
} from '../../../lib/format'


export function getChangeTone(
  value:
    number |
    null |
    undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined
  }

  if (value > 0) {
    return 'positive' as const
  }

  if (value < 0) {
    return 'negative' as const
  }

  return 'neutral' as const
}


export function formatChange(
  value:
    number |
    null |
    undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined
  }

  return `${
    value > 0
      ? '+'
      : ''
  }${formatDecimal(
    value,
    1,
  )}%`
}


export function parseDateOnly(
  value: string,
) {
  const parts =
    value
      .split('-')
      .map(Number)

  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        Number.isNaN(part),
    )
  ) {
    return null
  }

  const [
    year,
    month,
    day,
  ] = parts

  return new Date(
    year,
    month - 1,
    day,
  )
}


export function toDateInputValue(
  date: Date,
) {
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


export function getTodayDateValue() {
  return toDateInputValue(
    new Date(),
  )
}


export function shiftDateValue(
  value: string,
  days: number,
) {
  const date =
    parseDateOnly(
      value,
    )

  if (!date) {
    return value
  }

  date.setDate(
    date.getDate() +
    days,
  )

  return toDateInputValue(
    date,
  )
}


export function formatFullDate(
  value: string,
) {
  const date =
    parseDateOnly(
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


export function formatChartDate(
  value: string,
  includeYear = false,
) {
  const date =
    parseDateOnly(
      value,
    )

  if (!date) {
    return value
  }

  const dayMonth =
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
    return dayMonth
  }

  return (
    `${dayMonth} ’${String(
      date.getFullYear(),
    ).slice(-2)}`
  )
}


export type DatePreset =
  | 'all'
  | 'ytd'
  | '90d'
  | '30d'


export function getPresetRange(
  preset: DatePreset,
  today: string,
) {
  if (preset === 'all') {
    return {
      startDate: '',
      endDate: '',
    }
  }

  if (preset === 'ytd') {
    return {
      startDate:
        `${today.slice(0, 4)}-01-01`,
      endDate: today,
    }
  }

  return {
    startDate:
      shiftDateValue(
        today,
        preset === '90d'
          ? -89
          : -29,
      ),
    endDate: today,
  }
}


export function getActivePreset(
  startDate: string,
  endDate: string,
  today: string,
): DatePreset | null {
  const presets:
    DatePreset[] = [
      'all',
      'ytd',
      '90d',
      '30d',
    ]

  for (const preset of presets) {
    const range =
      getPresetRange(
        preset,
        today,
      )

    if (
      range.startDate ===
        startDate &&
      range.endDate ===
        endDate
    ) {
      return preset
    }
  }

  return null
}


export function getPeriodLabel(
  startDate: string,
  endDate: string,
) {
  if (
    !startDate &&
    !endDate
  ) {
    return 'All available history'
  }

  if (
    startDate &&
    endDate
  ) {
    return (
      `${formatFullDate(
        startDate,
      )} – ${formatFullDate(
        endDate,
      )}`
    )
  }

  if (startDate) {
    return 'Choose an end date'
  }

  if (endDate) {
    return 'Choose a start date'
  }

  return 'All available history'
}
