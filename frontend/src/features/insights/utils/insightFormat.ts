import {
  type InsightConfidence,
  type InsightSource,
} from '../../../api/insights'


export type SupportingFact = {
  label: string
  value: string
}


export function formatInsightDateTime(
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


export function getConfidenceVariant(
  confidence:
    InsightConfidence,
) {
  switch (confidence) {
    case 'high':
      return 'success' as const

    case 'medium':
      return 'warning' as const

    case 'low':
      return 'danger' as const
  }
}


export function getSourceVariant(
  source:
    InsightSource,
) {
  switch (
    source.toLowerCase()
  ) {
    case 'llm':
      return 'brand' as const

    case 'fallback':
      return 'warning' as const

    case 'blocked':
      return 'danger' as const

    default:
      return undefined
  }
}


export function getSourceLabel(
  source:
    InsightSource,
) {
  switch (
    source.toLowerCase()
  ) {
    case 'llm':
      return 'AI response'

    case 'fallback':
      return 'Fallback response'

    case 'blocked':
      return 'Guardrail response'

    default:
      return 'Legacy response'
  }
}


export function formatConfidence(
  confidence:
    InsightConfidence,
) {
  return (
    confidence
      .charAt(0)
      .toUpperCase() +
    confidence.slice(1)
  )
}


function formatIndianCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style:
        'currency',

      currency:
        'INR',

      maximumFractionDigits:
        Number.isInteger(
          value,
        )
          ? 0
          : 2,
    },
  ).format(value)
}


function formatIndianNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-IN',
    {
      maximumFractionDigits:
        Number.isInteger(
          value,
        )
          ? 0
          : 2,
    },
  ).format(value)
}


function parseNumericValue(
  value: string,
) {
  const cleaned =
    value
      .replace(
        /,/g,
        '',
      )
      .replace(
        /₹/g,
        '',
      )
      .trim()

  const number =
    Number(
      cleaned,
    )

  return Number.isFinite(
    number,
  )
    ? number
    : null
}


function isCurrencyFact(
  label: string,
) {
  const normalized =
    label.toLowerCase()

  return (
    normalized.includes(
      'revenue',
    ) ||
    normalized.includes(
      'booking value',
    ) ||
    normalized.includes(
      'price',
    )
  )
}


function isCountFact(
  label: string,
) {
  const normalized =
    label.toLowerCase()

  return (
    normalized.includes(
      'bookings',
    ) ||
    normalized.includes(
      'nights',
    )
  )
}


export function parseSupportingFact(
  fact: string,
): SupportingFact {
  const separatorIndex =
    fact.indexOf(':')


  if (
    separatorIndex === -1
  ) {
    return {
      label:
        'Workspace fact',

      value:
        fact,
    }
  }


  const label =
    fact
      .slice(
        0,
        separatorIndex,
      )
      .trim()


  const rawValue =
    fact
      .slice(
        separatorIndex + 1,
      )
      .trim()


  const numericValue =
    parseNumericValue(
      rawValue,
    )


  if (
    numericValue !== null &&
    isCurrencyFact(
      label,
    )
  ) {
    return {
      label,

      value:
        formatIndianCurrency(
          numericValue,
        ),
    }
  }


  if (
    numericValue !== null &&
    isCountFact(
      label,
    )
  ) {
    return {
      label,

      value:
        formatIndianNumber(
          numericValue,
        ),
    }
  }


  return {
    label,
    value:
      rawValue,
  }
}


export function formatSupportingFact(
  fact: string,
) {
  const parsed =
    parseSupportingFact(
      fact,
    )

  return `${parsed.label}: ${parsed.value}`
}