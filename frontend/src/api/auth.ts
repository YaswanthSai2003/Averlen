import {
  z,
} from 'zod'

import {
  apiRequest,
  clearAccessToken,
  refreshAccessToken,
  setAccessToken,
} from './client'

import type {
  UserRole,
} from '../types/auth'


const userRoleSchema =
  z.enum([
    'ORG_ADMIN',
    'REVENUE_MANAGER',
    'ANALYST',
    'VIEWER',
  ])


const userSchema =
  z.object({
    id:
      z.number(),

    organization_id:
      z.number(),

    email:
      z.string(),

    full_name:
      z.string()
        .nullable(),

    avatar_url:
      z.string()
        .nullable(),

    role:
      userRoleSchema,

    is_active:
      z.boolean(),

    is_platform_admin:
      z.boolean(),

    terms_accepted_at:
      z.string()
        .nullable(),

    privacy_accepted_at:
      z.string()
        .nullable(),

    terms_version:
      z.string()
        .nullable(),

    privacy_version:
      z.string()
        .nullable(),
  })


const tokenSchema =
  z.object({
    access_token:
      z.string(),

    token_type:
      z.string(),

    expires_in:
      z.number(),
  })


const inviteValidationSchema =
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
      userRoleSchema,

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


const sessionSchema =
  z.object({
    id:
      z.number(),

    user_agent:
      z.string()
        .nullable(),

    ip_address:
      z.string()
        .nullable(),

    is_revoked:
      z.boolean(),

    is_current:
      z.boolean(),

    expires_at:
      z.string(),

    created_at:
      z.string(),
  })


const sessionListSchema =
  z.object({
    sessions:
      z.array(
        sessionSchema,
      ),
  })


const messageSchema =
  z.object({
    message:
      z.string(),
  })


export type AuthUser =
  Omit<
    z.infer<
      typeof userSchema
    >,
    'role'
  > & {
    role:
      UserRole
  }


export type InviteValidation =
  z.infer<
    typeof inviteValidationSchema
  >


export type AuthSession =
  z.infer<
    typeof sessionSchema
  >


export type RegisterPayload = {
  email: string
  password: string
  full_name?: string

  organization_name?:
    string

  accepted_terms:
    boolean

  accepted_privacy_policy:
    boolean

  invite_token?:
    string
}


export type UpdateProfilePayload = {
  full_name:
    string |
    null
}


export type ChangePasswordPayload = {
  current_password:
    string

  new_password:
    string
}


let initialSessionPromise:
  Promise<AuthUser | null> |
  null = null


async function storeTokenResponse(
  promise:
    Promise<unknown>,
) {
  const raw =
    await promise

  const token =
    tokenSchema.parse(
      raw,
    )

  setAccessToken(
    token.access_token,
  )

  return token
}


export async function login(
  email: string,
  password: string,
) {
  const form =
    new URLSearchParams()

  form.set(
    'username',
    email.trim(),
  )

  form.set(
    'password',
    password,
  )

  return storeTokenResponse(
    apiRequest<unknown>(
      '/api/auth/login',
      {
        method:
          'POST',

        body:
          form,

        skipAuthRefresh:
          true,
      },
    ),
  )
}


export async function demoLogin() {
  return storeTokenResponse(
    apiRequest<unknown>(
      '/api/auth/demo-login',
      {
        method:
          'POST',

        skipAuthRefresh:
          true,
      },
    ),
  )
}


export async function register(
  payload:
    RegisterPayload,
) {
  const raw =
    await apiRequest<unknown>(
      '/api/auth/register',
      {
        method:
          'POST',

        body:
          payload,

        skipAuthRefresh:
          true,
      },
    )

  return userSchema.parse(
    raw,
  )
}


export async function validateInviteToken(
  inviteToken: string,
): Promise<InviteValidation> {
  const raw =
    await apiRequest<unknown>(
      `/api/invites/validate?invite_token=${encodeURIComponent(
        inviteToken,
      )}`,
      {
        skipAuthRefresh:
          true,
      },
    )

  return inviteValidationSchema.parse(
    raw,
  )
}


export async function getCurrentUser():
  Promise<AuthUser> {
  const raw =
    await apiRequest<unknown>(
      '/api/auth/me',
    )

  return userSchema.parse(
    raw,
  ) as AuthUser
}


export async function updateCurrentUser(
  payload:
    UpdateProfilePayload,
): Promise<AuthUser> {
  const raw =
    await apiRequest<unknown>(
      '/api/auth/me',
      {
        method:
          'PATCH',

        body:
          payload,
      },
    )

  return userSchema.parse(
    raw,
  ) as AuthUser
}


export async function uploadCurrentUserAvatar(
  file: File,
): Promise<AuthUser> {
  const formData =
    new FormData()

  formData.append(
    'file',
    file,
  )

  const raw =
    await apiRequest<unknown>(
      '/api/auth/me/avatar',
      {
        method:
          'POST',

        body:
          formData,
      },
    )

  return userSchema.parse(
    raw,
  ) as AuthUser
}


export async function deleteCurrentUserAvatar():
  Promise<AuthUser> {
  const raw =
    await apiRequest<unknown>(
      '/api/auth/me/avatar',
      {
        method:
          'DELETE',
      },
    )

  return userSchema.parse(
    raw,
  ) as AuthUser
}


export async function getActiveSessions():
  Promise<AuthSession[]> {
  const raw =
    await apiRequest<unknown>(
      '/api/auth/sessions',
    )

  return sessionListSchema
    .parse(
      raw,
    )
    .sessions
}


export async function revokeActiveSession(
  sessionId: number,
) {
  const raw =
    await apiRequest<unknown>(
      `/api/auth/sessions/${sessionId}`,
      {
        method:
          'DELETE',
      },
    )

  return messageSchema.parse(
    raw,
  )
}


export async function changePassword(
  payload:
    ChangePasswordPayload,
) {
  const raw =
    await apiRequest<unknown>(
      '/api/auth/change-password',
      {
        method:
          'PATCH',

        body:
          payload,
      },
    )

  return messageSchema.parse(
    raw,
  )
}


async function restoreSessionInternal():
  Promise<AuthUser | null> {
  const token =
    await refreshAccessToken()

  if (!token) {
    return null
  }

  try {
    return await getCurrentUser()
  } catch {
    clearAccessToken()

    return null
  }
}


export function restoreAuthSession():
  Promise<AuthUser | null> {
  if (!initialSessionPromise) {
    initialSessionPromise =
      restoreSessionInternal()
  }

  return initialSessionPromise
}


export async function logout() {
  try {
    await apiRequest(
      '/api/auth/logout',
      {
        method:
          'POST',

        skipAuthRefresh:
          true,
      },
    )
  } finally {
    clearAccessToken()
  }
}