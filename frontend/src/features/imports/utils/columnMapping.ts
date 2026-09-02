import type {
  ColumnMappingRequest,
  CsvPreviewResponse,
} from '../../../api/imports'


export type MappingKey =
  | 'property_id'
  | 'check_in'
  | 'check_out'
  | 'price'
  | 'booked_on'


export type MappingDefinition = {
  key: MappingKey
  label: string
  description: string
  aliases: string[]
}


export const MAPPING_FIELDS:
  MappingDefinition[] = [
    {
      key: 'property_id',

      label: 'Property ID',

      description:
        'The column containing the Averlen property ID.',

      aliases: [
        'property_id',
        'property id',
        'property',
        'property_code',
        'property code',
        'hotel_id',
        'hotel id',
        'hotel_code',
        'hotel code',
        'listing_id',
        'listing id',
        'listing_code',
        'listing code',
        'accommodation_id',
        'accommodation id',
      ],
    },

    {
      key: 'check_in',

      label: 'Check-in date',

      description:
        'The guest arrival date.',

      aliases: [
        'check_in',
        'check in',
        'checkin',
        'check_in_date',
        'check in date',
        'checkin_date',
        'arrival',
        'arrival_date',
        'arrival date',
        'arrival_time',
        'guest_arrival',
        'start_date',
        'start date',
        'from_date',
        'from date',
      ],
    },

    {
      key: 'check_out',

      label: 'Check-out date',

      description:
        'The guest departure date.',

      aliases: [
        'check_out',
        'check out',
        'checkout',
        'check_out_date',
        'check out date',
        'checkout_date',
        'departure',
        'departure_date',
        'departure date',
        'departure_time',
        'guest_departure',
        'end_date',
        'end date',
        'to_date',
        'to date',
      ],
    },

    {
      key: 'price',

      label: 'Booking revenue',

      description:
        'The total booking price or revenue.',

      aliases: [
        'price',
        'booking_price',
        'booking price',
        'booking_value',
        'booking value',
        'booking_amount',
        'booking amount',
        'amount',
        'revenue',
        'total',
        'total_price',
        'total price',
        'total_amount',
        'total amount',
        'gross_amount',
        'gross amount',
        'gross_revenue',
        'gross revenue',
      ],
    },

    {
      key: 'booked_on',

      label: 'Booked on',

      description:
        'The date the reservation was created.',

      aliases: [
        'booked_on',
        'booked on',
        'booking_date',
        'booking date',
        'reservation_date',
        'reservation date',
        'reservation_created',
        'reservation created',
        'reserved_on',
        'reserved on',
        'created_at',
        'created at',
        'created_date',
        'created date',
      ],
    },
  ]


export function normalizeColumn(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '_',
    )
    .replace(
      /^_+|_+$/g,
      '',
    )
}


function getTokens(
  value: string,
) {
  return normalizeColumn(
    value,
  )
    .split('_')
    .filter(Boolean)
}


export function scoreColumn(
  column: string,
  aliases: string[],
) {
  const normalizedColumn =
    normalizeColumn(
      column,
    )

  let bestScore = 0

  for (
    const alias
    of aliases
  ) {
    const normalizedAlias =
      normalizeColumn(
        alias,
      )

    if (
      normalizedColumn ===
      normalizedAlias
    ) {
      return 100
    }

    const compactColumn =
      normalizedColumn
        .replaceAll(
          '_',
          '',
        )

    const compactAlias =
      normalizedAlias
        .replaceAll(
          '_',
          '',
        )

    if (
      compactColumn ===
      compactAlias
    ) {
      bestScore =
        Math.max(
          bestScore,
          95,
        )
    }

    if (
      normalizedColumn.includes(
        normalizedAlias,
      ) ||
      normalizedAlias.includes(
        normalizedColumn,
      )
    ) {
      bestScore =
        Math.max(
          bestScore,
          80,
        )
    }

    const columnTokens =
      getTokens(
        normalizedColumn,
      )

    const aliasTokens =
      getTokens(
        normalizedAlias,
      )

    const sharedTokens =
      columnTokens.filter(
        (token) =>
          aliasTokens.includes(
            token,
          ),
      )

    if (
      sharedTokens.length ===
      0
    ) {
      continue
    }

    const denominator =
      Math.max(
        columnTokens.length,
        aliasTokens.length,
      )

    const ratio =
      sharedTokens.length /
      denominator

    bestScore =
      Math.max(
        bestScore,
        Math.round(
          ratio * 70,
        ),
      )
  }

  return bestScore
}


export function createInitialMapping(
  preview:
    CsvPreviewResponse,
): ColumnMappingRequest {
  const mapping:
    ColumnMappingRequest = {
      upload_id:
        preview.upload_id,

      property_id: '',
      check_in: '',
      check_out: '',
      price: '',
      booked_on: '',
    }

  const usedColumns =
    new Set<string>()

  for (
    const field
    of MAPPING_FIELDS
  ) {
    const candidates =
      preview.columns
        .filter(
          (column) =>
            !usedColumns.has(
              column,
            ),
        )
        .map(
          (column) => ({
            column,

            score:
              scoreColumn(
                column,
                field.aliases,
              ),
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            second.score -
            first.score,
        )

    const bestCandidate =
      candidates[0]

    if (
      !bestCandidate ||
      bestCandidate.score < 70
    ) {
      continue
    }

    mapping[
      field.key
    ] =
      bestCandidate.column

    usedColumns.add(
      bestCandidate.column,
    )
  }

  return mapping
}


export function getSelectedColumns(
  mapping:
    ColumnMappingRequest,
) {
  return MAPPING_FIELDS
    .map(
      (field) =>
        mapping[
          field.key
        ],
    )
    .filter(Boolean)
}


export function isMappingComplete(
  mapping:
    ColumnMappingRequest,
) {
  const selected =
    getSelectedColumns(
      mapping,
    )

  return (
    selected.length ===
    MAPPING_FIELDS.length
  )
}


export function hasUniqueMappings(
  mapping:
    ColumnMappingRequest,
) {
  const selected =
    getSelectedColumns(
      mapping,
    )

  return (
    new Set(
      selected,
    ).size ===
    selected.length
  )
}


export function getUnavailableColumns(
  mapping:
    ColumnMappingRequest,
  currentKey:
    MappingKey,
) {
  const unavailable =
    new Set<string>()

  for (
    const field
    of MAPPING_FIELDS
  ) {
    if (
      field.key ===
      currentKey
    ) {
      continue
    }

    const selected =
      mapping[
        field.key
      ]

    if (selected) {
      unavailable.add(
        selected,
      )
    }
  }

  return unavailable
}