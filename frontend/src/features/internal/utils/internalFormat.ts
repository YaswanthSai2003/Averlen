import {
  formatDateTimeIST,
} from '../../../lib/dateTime'


export function formatInternalDate(
  value: string,
) {
  return formatDateTimeIST(
    value,
  )
}


export function formatInternalNumber(
  value: number,
) {
  return new Intl.NumberFormat('en-IN').format(
    value,
  )
}


export function formatInternalRole(
  value: string,
) {
  return value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ')
}