const currencyFormatter =
  new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  )

const numberFormatter =
  new Intl.NumberFormat(
    'en-IN',
  )

export function formatCurrency(
  value: number,
) {
  return currencyFormatter.format(
    value,
  )
}

export function formatNumber(
  value: number,
) {
  return numberFormatter.format(
    value,
  )
}

export function formatDecimal(
  value: number,
  digits = 1,
) {
  return value.toLocaleString(
    'en-IN',
    {
      minimumFractionDigits:
        digits,

      maximumFractionDigits:
        digits,
    },
  )
}