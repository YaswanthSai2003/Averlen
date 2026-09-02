import { z } from 'zod'

import {
  apiRequest,
} from './client'


const internalOverviewSchema =
  z.object({
    organizations: z.number(),
    users: z.number(),
    active_users: z.number(),
    properties: z.number(),
    bookings: z.number(),
    import_jobs: z.number(),
    audit_events: z.number(),
    error_events: z.number(),
  })


const internalOrganizationSchema =
  z.object({
    id: z.number(),
    name: z.string(),
    email_domain: z.string().nullable(),
    user_count: z.number(),
    active_user_count: z.number(),
    property_count: z.number(),
    booking_count: z.number(),
    created_at: z.string(),
  })


const internalOrganizationPageSchema =
  z.object({
    items: z.array(internalOrganizationSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })


const internalUserSchema =
  z.object({
    id: z.number(),
    organization_id: z.number(),
    organization_name: z.string(),
    email: z.string(),
    full_name: z.string().nullable(),
    role: z.string(),
    is_active: z.boolean(),
    is_platform_admin: z.boolean(),
    created_at: z.string(),
  })


const internalUserPageSchema =
  z.object({
    items: z.array(internalUserSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })


const internalUsageSchema =
  z.object({
    organizations: z.number(),
    users: z.number(),
    active_users: z.number(),
    properties: z.number(),
    bookings: z.number(),
    import_jobs: z.number(),
    completed_import_jobs: z.number(),
    failed_import_jobs: z.number(),
    pricing_recommendations: z.number(),
    ai_insights: z.number(),
    notifications: z.number(),
  })


export type InternalOverview =
  z.infer<typeof internalOverviewSchema>

export type InternalOrganization =
  z.infer<typeof internalOrganizationSchema>

export type InternalOrganizationPage =
  z.infer<typeof internalOrganizationPageSchema>

export type InternalUser =
  z.infer<typeof internalUserSchema>

export type InternalUserPage =
  z.infer<typeof internalUserPageSchema>

export type InternalUsage =
  z.infer<typeof internalUsageSchema>


export async function getInternalOverview():
  Promise<InternalOverview> {
  const raw =
    await apiRequest<unknown>(
      '/api/internal/overview',
    )

  return internalOverviewSchema.parse(
    raw,
  )
}


export async function getInternalOrganizations({
  q = '',
  limit = 25,
  offset = 0,
}: {
  q?: string
  limit?: number
  offset?: number
} = {}): Promise<InternalOrganizationPage> {
  const params =
    new URLSearchParams()

  if (q.trim()) {
    params.set('q', q.trim())
  }

  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const raw =
    await apiRequest<unknown>(
      `/api/internal/organizations/page?${params.toString()}`,
    )

  return internalOrganizationPageSchema.parse(
    raw,
  )
}


export async function getInternalUsers({
  q = '',
  organizationId,
  limit = 25,
  offset = 0,
}: {
  q?: string
  organizationId?: number
  limit?: number
  offset?: number
} = {}): Promise<InternalUserPage> {
  const params =
    new URLSearchParams()

  if (q.trim()) {
    params.set('q', q.trim())
  }

  if (organizationId) {
    params.set(
      'organization_id',
      String(organizationId),
    )
  }

  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const raw =
    await apiRequest<unknown>(
      `/api/internal/users/page?${params.toString()}`,
    )

  return internalUserPageSchema.parse(
    raw,
  )
}


export async function getInternalUsage():
  Promise<InternalUsage> {
  const raw =
    await apiRequest<unknown>(
      '/api/internal/usage',
    )

  return internalUsageSchema.parse(
    raw,
  )
}
