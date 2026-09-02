import {
  z,
} from 'zod'

import {
  apiRequest,
} from './client'


export const workspaceRoleSchema =
  z.enum([
    'ORG_ADMIN',
    'REVENUE_MANAGER',
    'ANALYST',
    'VIEWER',
  ])


const workspaceSchema =
  z.object({
    id:
      z.number(),

    name:
      z.string(),

    email_domain:
      z.string()
        .nullable()
        .optional(),

    created_at:
      z.string(),
  })


const workspaceMemberSchema =
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

    avatar_url:
      z.string()
        .nullable()
        .optional(),

    role:
      workspaceRoleSchema,

    is_active:
      z.boolean(),

    created_at:
      z.string(),
  })


const workspaceMemberListSchema =
  z.object({
    members:
      z.array(
        workspaceMemberSchema,
      ),
  })


const inviteSchema =
  z.object({
    id:
      z.number(),

    organization_id:
      z.number(),

    invited_by_user_id:
      z.number(),

    email:
      z.string(),

    role:
      workspaceRoleSchema,

    status:
      z.string(),

    expires_at:
      z.string(),

    accepted_at:
      z.string()
        .nullable()
        .optional(),

    accepted_by_user_id:
      z.number()
        .nullable()
        .optional(),

    created_at:
      z.string(),
  })


const inviteListSchema =
  z.array(
    inviteSchema,
  )


const inviteCreateResponseSchema =
  z.object({
    invite:
      inviteSchema,

    invite_token:
      z.string(),

    invite_url:
      z.string(),
  })


export type WorkspaceRole =
  z.infer<
    typeof workspaceRoleSchema
  >


export type Workspace =
  z.infer<
    typeof workspaceSchema
  >


export type WorkspaceMember =
  z.infer<
    typeof workspaceMemberSchema
  >


export type WorkspaceMemberList =
  z.infer<
    typeof workspaceMemberListSchema
  >


export type OrganizationInvite =
  z.infer<
    typeof inviteSchema
  >


export type InviteCreateResponse =
  z.infer<
    typeof inviteCreateResponseSchema
  >


export type InviteCreatePayload = {
  email: string
  role: WorkspaceRole
}


export async function getWorkspace():
  Promise<Workspace> {
  const raw =
    await apiRequest<unknown>(
      '/api/workspace',
    )

  return workspaceSchema.parse(
    raw,
  )
}


export async function getWorkspaceMembers():
  Promise<WorkspaceMemberList> {
  const raw =
    await apiRequest<unknown>(
      '/api/workspace/members',
    )

  return workspaceMemberListSchema.parse(
    raw,
  )
}


export async function updateWorkspaceMemberRole(
  userId: number,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  const raw =
    await apiRequest<unknown>(
      `/api/workspace/members/${userId}/role`,
      {
        method:
          'PATCH',

        body: {
          role,
        },
      },
    )

  return workspaceMemberSchema.parse(
    raw,
  )
}


export async function deactivateWorkspaceMember(
  userId: number,
): Promise<WorkspaceMember> {
  const raw =
    await apiRequest<unknown>(
      `/api/workspace/members/${userId}/deactivate`,
      {
        method:
          'PATCH',
      },
    )

  return workspaceMemberSchema.parse(
    raw,
  )
}


export async function getWorkspaceInvites():
  Promise<OrganizationInvite[]> {
  const raw =
    await apiRequest<unknown>(
      '/api/invites',
    )

  return inviteListSchema.parse(
    raw,
  )
}


export async function createWorkspaceInvite(
  payload:
    InviteCreatePayload,
): Promise<InviteCreateResponse> {
  const raw =
    await apiRequest<unknown>(
      '/api/invites',
      {
        method:
          'POST',

        body:
          payload,
      },
    )

  return inviteCreateResponseSchema.parse(
    raw,
  )
}


export async function cancelWorkspaceInvite(
  inviteId: number,
): Promise<OrganizationInvite> {
  const raw =
    await apiRequest<unknown>(
      `/api/invites/${inviteId}/cancel`,
      {
        method:
          'PATCH',
      },
    )

  return inviteSchema.parse(
    raw,
  )
}