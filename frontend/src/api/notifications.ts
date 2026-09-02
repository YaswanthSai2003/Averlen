import { z } from 'zod'

import {
  apiRequest,
} from './client'


const notificationSchema =
  z.object({
    id:
      z.number(),

    organization_id:
      z.number(),

    user_id:
      z.number()
        .nullable(),

    actor_user_id:
      z.number()
        .nullable(),

    type:
      z.string()
        .min(1),

    priority:
      z.string()
        .min(1),

    title:
      z.string(),

    message:
      z.string(),

    entity_type:
      z.string()
        .nullable(),

    entity_id:
      z.number()
        .nullable(),

    is_read:
      z.boolean(),

    read_at:
      z.string()
        .nullable(),

    created_at:
      z.string(),
  })


const notificationListResponseSchema =
  z.object({
    items:
      z.array(
        notificationSchema,
      ),

    total:
      z.number(),

    unread_count:
      z.number(),

    limit:
      z.number(),

    offset:
      z.number(),
  })


const notificationUnreadCountSchema =
  z.object({
    unread_count:
      z.number(),
  })


const notificationActionResponseSchema =
  z.object({
    message:
      z.string(),
  })


const notificationPreferencesSchema =
  z.object({
    upload_enabled:
      z.boolean(),

    data_quality_enabled:
      z.boolean(),

    pricing_enabled:
      z.boolean(),

    workspace_enabled:
      z.boolean(),

    ai_insight_enabled:
      z.boolean(),

    system_enabled:
      z.boolean(),

    security_enabled:
      z.boolean(),
  })


export type NotificationItemData =
  z.infer<
    typeof notificationSchema
  >


export type NotificationListResponse =
  z.infer<
    typeof notificationListResponseSchema
  >


export type NotificationPreferences =
  z.infer<
    typeof notificationPreferencesSchema
  >


export type NotificationPreferenceUpdate = {
  upload_enabled?: boolean
  data_quality_enabled?: boolean
  pricing_enabled?: boolean
  workspace_enabled?: boolean
  ai_insight_enabled?: boolean
  system_enabled?: boolean
}


export type NotificationPreferenceKey =
  keyof NotificationPreferenceUpdate


export type NotificationListQuery = {
  includeRead?: boolean
  notificationType?: string
  limit?: number
  offset?: number
}


export async function getNotifications(
  query: NotificationListQuery = {},
): Promise<NotificationListResponse> {
  const params =
    new URLSearchParams()

  params.set(
    'include_read',
    String(
      query.includeRead ??
      true,
    ),
  )

  if (
    query.notificationType
  ) {
    params.set(
      'notification_type',
      query.notificationType,
    )
  }

  params.set(
    'limit',
    String(
      query.limit ??
      20,
    ),
  )

  params.set(
    'offset',
    String(
      query.offset ??
      0,
    ),
  )

  const raw =
    await apiRequest<unknown>(
      `/api/notifications?${params.toString()}`,
    )

  return notificationListResponseSchema
    .parse(
      raw,
    )
}


export async function getNotificationUnreadCount():
  Promise<number> {
  const raw =
    await apiRequest<unknown>(
      '/api/notifications/unread-count',
    )

  return notificationUnreadCountSchema
    .parse(
      raw,
    )
    .unread_count
}


export async function getNotificationPreferences():
  Promise<NotificationPreferences> {
  const raw =
    await apiRequest<unknown>(
      '/api/notifications/preferences',
    )

  return notificationPreferencesSchema
    .parse(
      raw,
    )
}


export async function updateNotificationPreferences(
  payload:
    NotificationPreferenceUpdate,
): Promise<NotificationPreferences> {
  const raw =
    await apiRequest<unknown>(
      '/api/notifications/preferences',
      {
        method:
          'PATCH',

        body:
          payload,
      },
    )

  return notificationPreferencesSchema
    .parse(
      raw,
    )
}


export async function markAllNotificationsRead():
  Promise<string> {
  const raw =
    await apiRequest<unknown>(
      '/api/notifications/read-all',
      {
        method:
          'PATCH',
      },
    )

  return notificationActionResponseSchema
    .parse(
      raw,
    )
    .message
}


export async function markNotificationRead(
  notificationId: number,
): Promise<NotificationItemData> {
  const raw =
    await apiRequest<unknown>(
      `/api/notifications/${notificationId}/read`,
      {
        method:
          'PATCH',
      },
    )

  return notificationSchema.parse(
    raw,
  )
}


export async function deleteNotification(
  notificationId: number,
): Promise<string> {
  const raw =
    await apiRequest<unknown>(
      `/api/notifications/${notificationId}`,
      {
        method:
          'DELETE',
      },
    )

  return notificationActionResponseSchema
    .parse(
      raw,
    )
    .message
}