import { z } from 'zod'

import {
  apiRequest,
} from './client'


const auditLogSchema =
  z.object({
    id:
      z.number(),

    user_id:
      z.number().nullable(),

    organization_id:
      z.number().nullable(),

    email:
      z.string().nullable(),

    action:
      z.string(),

    method:
      z.string(),

    path:
      z.string(),

    status_code:
      z.number(),

    duration_ms:
      z.number(),

    ip_address:
      z.string().nullable(),

    user_agent:
      z.string().nullable(),

    created_at:
      z.string(),
  })


const auditLogPageSchema =
  z.object({
    items:
      z.array(
        auditLogSchema,
      ),

    total:
      z.number(),

    limit:
      z.number(),

    offset:
      z.number(),
  })


export type AuditLogItem =
  z.infer<
    typeof auditLogSchema
  >


export type AuditLogPage =
  z.infer<
    typeof auditLogPageSchema
  >


export type AuditLogPageParams = {
  limit?: number
  offset?: number
}


async function getAuditPage(
  path: string,
  {
    limit = 50,
    offset = 0,
  }: AuditLogPageParams = {},
): Promise<AuditLogPage> {
  const params =
    new URLSearchParams()

  params.set(
    'limit',
    String(limit),
  )

  params.set(
    'offset',
    String(offset),
  )

  const raw =
    await apiRequest<unknown>(
      `${path}?${params.toString()}`,
    )

  return auditLogPageSchema.parse(
    raw,
  )
}


export async function getAuditLogsPage(
  params: AuditLogPageParams = {},
): Promise<AuditLogPage> {
  return getAuditPage(
    '/api/internal/audit-logs/page',
    params,
  )
}


export async function getAuditErrorsPage(
  params: AuditLogPageParams = {},
): Promise<AuditLogPage> {
  return getAuditPage(
    '/api/internal/audit-logs/errors/page',
    params,
  )
}
