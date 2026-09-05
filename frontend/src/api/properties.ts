import { z } from 'zod'

import {
  apiRequest,
} from './client'

const propertyReadSchema =
  z.object({
    id: z.number(),

    organization_id:
      z.number(),

    property_code:
      z.string(),

    name: z.string(),

    city: z.string(),

    property_type:
      z.string(),

    base_price:
      z.number(),

    bedrooms:
      z.number(),

    accommodates:
      z.number(),

    photo_url:
      z.string()
        .nullable()
        .optional(),

    is_archived:
      z.boolean()
        .optional()
        .default(false),

    archived_at:
      z.string()
        .nullable()
        .optional(),
  })

const propertySummarySchema =
  z.object({
    property_id:
      z.number(),

    property_code:
      z.string(),

    name:
      z.string(),

    city:
      z.string(),

    property_type:
      z.string(),

    base_price:
      z.number(),

    bedrooms:
      z.number(),

    accommodates:
      z.number(),

    photo_url:
      z.string()
        .nullable()
        .optional(),

    is_archived:
      z.boolean()
        .optional()
        .default(false),

    archived_at:
      z.string()
        .nullable()
        .optional(),

    total_revenue:
      z.number(),

    total_bookings:
      z.number(),

    total_booked_nights:
      z.number(),

    adr:
      z.number(),

    revenue_per_booked_night:
      z.number(),

    average_length_of_stay:
      z.number(),
  })

const propertySummaryPageSchema =
  z.object({
    items:
      z.array(
        propertySummarySchema,
      ),

    total:
      z.number(),

    limit:
      z.number(),

    offset:
      z.number(),
  })

export type PropertyRead =
  z.infer<
    typeof propertyReadSchema
  >

export type PropertySummary =
  z.infer<
    typeof propertySummarySchema
  >

export type PropertySummaryPage =
  z.infer<
    typeof propertySummaryPageSchema
  >

export type PropertySortField =
  | 'property_code'
  | 'name'
  | 'city'
  | 'base_price'
  | 'revenue'
  | 'bookings'
  | 'adr'

export type SortOrder =
  | 'asc'
  | 'desc'

export type CreatePropertyPayload = {
  name: string
  city: string
  property_type: string
  base_price: number
  bedrooms: number
  accommodates: number
}

export type UpdatePropertyPayload =
  Partial<CreatePropertyPayload>

type PropertySummaryOptions = {
  city?: string
  propertyType?: string
  archived?: boolean
  sortBy?: PropertySortField
  sortOrder?: SortOrder
}

export async function getPropertySummaryPage(
  limit = 20,
  offset = 0,
  options:
    PropertySummaryOptions = {},
): Promise<PropertySummaryPage> {
  const params =
    new URLSearchParams({
      limit:
        String(limit),

      offset:
        String(offset),

      sort_by:
        options.sortBy ??
        'name',

      sort_order:
        options.sortOrder ??
        'asc',
    })

  if (options.city) {
    params.set(
      'city',
      options.city,
    )
  }

  params.set(
    'archived',
    String(
      options.archived ??
      false,
    ),
  )

  if (
    options.propertyType
  ) {
    params.set(
      'property_type',
      options.propertyType,
    )
  }

  const raw =
    await apiRequest<unknown>(
      `/api/properties/summary/page?${params.toString()}`,
    )

  return (
    propertySummaryPageSchema.parse(
      raw,
    )
  )
}

export async function getPropertySummary(
  propertyId: number,
): Promise<PropertySummary> {
  const raw =
    await apiRequest<unknown>(
      `/api/properties/summary/${propertyId}`,
    )

  return propertySummarySchema.parse(
    raw,
  )
}

export async function createProperty(
  payload:
    CreatePropertyPayload,
): Promise<PropertyRead> {
  const raw =
    await apiRequest<unknown>(
      '/api/properties',
      {
        method: 'POST',
        body: payload,
      },
    )

  return propertyReadSchema.parse(
    raw,
  )
}

export async function updateProperty(
  propertyId: number,
  payload:
    UpdatePropertyPayload,
): Promise<PropertyRead> {
  const raw =
    await apiRequest<unknown>(
      `/api/properties/${propertyId}`,
      {
        method: 'PUT',
        body: payload,
      },
    )

  return propertyReadSchema.parse(
    raw,
  )
}

export async function uploadPropertyPhoto(
  propertyId: number,
  file: File,
): Promise<PropertyRead> {
  const formData =
    new FormData()

  formData.append(
    'file',
    file,
  )

  const raw =
    await apiRequest<unknown>(
      `/api/properties/${propertyId}/photo`,
      {
        method: 'POST',
        body: formData,
      },
    )

  return propertyReadSchema.parse(
    raw,
  )
}

export async function archiveProperty(
  propertyId: number,
): Promise<PropertyRead> {
  const raw =
    await apiRequest<unknown>(
      `/api/properties/${propertyId}/archive`,
      {
        method: 'PATCH',
      },
    )

  return propertyReadSchema.parse(raw)
}

export async function restoreProperty(
  propertyId: number,
): Promise<PropertyRead> {
  const raw =
    await apiRequest<unknown>(
      `/api/properties/${propertyId}/restore`,
      {
        method: 'PATCH',
      },
    )

  return propertyReadSchema.parse(raw)
}

export async function deleteProperty(
  propertyId: number,
): Promise<void> {
  await apiRequest(
    `/api/properties/${propertyId}/permanent?confirm=DELETE`,
    {
      method: 'DELETE',
    },
  )
}
