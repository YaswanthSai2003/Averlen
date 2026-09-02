export function formatPricingLabel(
  value: string,
) {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}


export function formatSignedPercent(
  value: number,
  formatter: (
    value: number,
    digits: number,
  ) => string,
) {
  const prefix =
    value > 0
      ? '+'
      : ''

  return `${prefix}${formatter(
    value,
    1,
  )}%`
}


export function formatPricingDateTime(
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


export function getRiskVariant(
  risk: string,
) {
  switch (
    risk.toLowerCase()
  ) {
    case 'low':
      return 'success' as const

    case 'medium':
      return 'warning' as const

    case 'high':
      return 'danger' as const

    default:
      return undefined
  }
}


export function getQualityVariant(
  quality: string,
) {
  switch (
    quality.toLowerCase()
  ) {
    case 'strong':
      return 'success' as const

    case 'moderate':
      return 'brand' as const

    case 'limited':
      return 'warning' as const

    case 'no_data':
      return 'danger' as const

    default:
      return undefined
  }
}


export function getStatusVariant(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case 'accepted':
      return 'success' as const

    case 'rejected':
      return 'danger' as const

    case 'applied':
      return 'brand' as const

    case 'generated':
      return 'warning' as const

    default:
      return undefined
  }
}


export function getImpactVariant(
  impact: string,
) {
  switch (
    impact.toLowerCase()
  ) {
    case 'positive':
      return 'success' as const

    case 'negative':
      return 'danger' as const

    default:
      return undefined
  }
}


export function getAdjustmentVariant(
  adjustmentType: string,
) {
  switch (
    adjustmentType.toLowerCase()
  ) {
    case 'increase':
      return 'success' as const

    case 'decrease':
      return 'warning' as const

    case 'keep':
      return 'brand' as const

    default:
      return undefined
  }
}


export function getChangeTone(
  value: number,
) {
  if (value > 0) {
    return 'positive' as const
  }

  if (value < 0) {
    return 'negative' as const
  }

  return 'neutral' as const
}