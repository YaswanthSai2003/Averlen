const DEMO_PROPERTY_PHOTOS: Record<
  string,
  string
> = {
  'P-001':
    '/demo-properties/p-001-sea-view-apartment.webp',
  'P-002':
    '/demo-properties/p-002-beach-villa.webp',
  'P-003':
    '/demo-properties/p-003-city-studio.webp',
  'P-004':
    '/demo-properties/p-004-hill-view-cottage.webp',
  'P-005':
    '/demo-properties/p-005-business-bay-suites.webp',
}

export function getDemoPropertyPhotoUrl(
  propertyCode: string,
): string | null {
  return (
    DEMO_PROPERTY_PHOTOS[
      propertyCode
    ] ?? null
  )
}