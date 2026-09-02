import {
  z,
} from 'zod'

import {
  apiRequest,
} from './client'

import {
  workspaceRoleSchema,
  type WorkspaceRole,
} from './team'


const workspaceDiscoverySchema =
  z.object({
    existing_workspace:
      z.boolean(),

    can_request_access:
      z.boolean(),
  })


const accessRequestStatusSchema =
  z.enum([
    'pending',
    'approved',
    'rejected',
  ])


const publicAccessRequestSchema =
  z.object({
    id:
      z.number(),

    email:
      z.string(),

    status:
      accessRequestStatusSchema,

    created_at:
      z.string(),
  })


const accessRequestSchema =
  z.object({
    id:
      z.number(),

    organization_id:
      z.number(),

    email:
      z.string(),

    full_name:
      z.string()
        .nullable()
        .optional(),

    status:
      accessRequestStatusSchema,

    reviewed_by_user_id:
      z.number()
        .nullable()
        .optional(),

    reviewed_at:
      z.string()
        .nullable()
        .optional(),

    approved_role:
      workspaceRoleSchema
        .nullable()
        .optional(),

    invite_id:
      z.number()
        .nullable()
        .optional(),

    created_at:
      z.string(),
  })


const accessRequestListSchema =
  z.object({
    requests:
      z.array(
        accessRequestSchema,
      ),
  })


const approvalResponseSchema =
  z.object({
    request:
      accessRequestSchema,

    invite_token:
      z.string(),

    invite_url:
      z.string(),
  })


export type WorkspaceDiscovery =
  z.infer<
    typeof workspaceDiscoverySchema
  >


export type PublicAccessRequest =
  z.infer<
    typeof publicAccessRequestSchema
  >


export type WorkspaceAccessRequest =
  z.infer<
    typeof accessRequestSchema
  >


export type WorkspaceAccessRequestStatus =
  z.infer<
    typeof accessRequestStatusSchema
  >


export type AccessRequestApprovalResponse =
  z.infer<
    typeof approvalResponseSchema
  >


export type CreateAccessRequestPayload = {
  email: string
  full_name?: string
}


export async function discoverWorkspaceByEmail(
  email: string,
): Promise<WorkspaceDiscovery> {
  const raw =
    await apiRequest<unknown>(
      `/api/access-requests/discover?email=${encodeURIComponent(
        email.trim(),
      )}`,
      {
        skipAuthRefresh:
          true,
      },
    )

  return workspaceDiscoverySchema.parse(
    raw,
  )
}


export async function requestWorkspaceAccess(
  payload:
    CreateAccessRequestPayload,
): Promise<PublicAccessRequest> {
  const raw =
    await apiRequest<unknown>(
      '/api/access-requests',
      {
        method:
          'POST',

        body:
          payload,

        skipAuthRefresh:
          true,
      },
    )

  return publicAccessRequestSchema.parse(
    raw,
  )
}


export async function getWorkspaceAccessRequests():
  Promise<WorkspaceAccessRequest[]> {
  const raw =
    await apiRequest<unknown>(
      '/api/access-requests',
    )

  return accessRequestListSchema
    .parse(
      raw,
    )
    .requests
}


export async function approveWorkspaceAccessRequest(
  requestId: number,
  role: WorkspaceRole,
): Promise<AccessRequestApprovalResponse> {
  const raw =
    await apiRequest<unknown>(
      `/api/access-requests/${requestId}/approve`,
      {
        method:
          'PATCH',

        body: {
          role,
        },
      },
    )

  return approvalResponseSchema.parse(
    raw,
  )
}


export async function rejectWorkspaceAccessRequest(
  requestId: number,
): Promise<WorkspaceAccessRequest> {
  const raw =
    await apiRequest<unknown>(
      `/api/access-requests/${requestId}/reject`,
      {
        method:
          'PATCH',
      },
    )

  return accessRequestSchema.parse(
    raw,
  )
}
