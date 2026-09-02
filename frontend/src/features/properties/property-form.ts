import { z } from 'zod'

import type {
  CreatePropertyPayload,
  PropertySummary,
} from '../../api/properties'

export const MAX_PROPERTY_PHOTO_SIZE = 5 * 1024 * 1024

export const PROPERTY_TYPES = [
  'Apartment',
  'Hotel',
  'Villa',
  'Cottage',
  'Studio',
  'Cabin',
  'Private Room',
  'Serviced Apartment',
] as const

const ALLOWED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const propertyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Property name is required.'),

  city: z
    .string()
    .trim()
    .min(1, 'City is required.'),

  propertyType: z
    .string()
    .trim()
    .min(1, 'Property type is required.'),

  basePrice: z
    .number()
    .positive('Base price must be greater than 0.'),

  bedrooms: z
    .number()
    .int()
    .min(0, 'Bedrooms cannot be negative.')
    .max(20, 'Bedrooms cannot exceed 20.'),

  accommodates: z
    .number()
    .int()
    .min(1, 'At least one guest must be accommodated.')
    .max(100, 'Maximum guests cannot exceed 100.'),
})

export type PropertyFormValues = z.infer<
  typeof propertyFormSchema
>

export const CREATE_PROPERTY_DEFAULTS: PropertyFormValues = {
  name: '',
  city: '',
  propertyType: 'Apartment',
  basePrice: 1000,
  bedrooms: 1,
  accommodates: 2,
}

export function getPropertyFormDefaults(
  property: PropertySummary,
): PropertyFormValues {
  return {
    name: property.name,
    city: property.city,
    propertyType: property.property_type,
    basePrice: property.base_price,
    bedrooms: property.bedrooms,
    accommodates: property.accommodates,
  }
}

export function toPropertyPayload(
  values: PropertyFormValues,
): CreatePropertyPayload {
  return {
    name: values.name.trim(),
    city: values.city.trim(),
    property_type: values.propertyType.trim(),
    base_price: values.basePrice,
    bedrooms: values.bedrooms,
    accommodates: values.accommodates,
  }
}

export function validatePropertyPhoto(
  file: File,
): string | null {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return 'Only JPG, PNG and WEBP images are supported.'
  }

  if (file.size > MAX_PROPERTY_PHOTO_SIZE) {
    return 'Property photo must be 5 MB or smaller.'
  }

  return null
}