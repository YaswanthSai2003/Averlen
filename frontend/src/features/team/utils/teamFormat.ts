import type {
  OrganizationInvite,
  WorkspaceMember,
  WorkspaceRole,
} from '../../../api/team'

import {
  formatDateIST,
  formatRelativeTime,
  isApiDateExpired,
} from '../../../lib/dateTime'


export const TEAM_ROLE_OPTIONS:
  {
    value:
      WorkspaceRole

    label:
      string

    description:
      string
  }[] = [
    {
      value:
        'ORG_ADMIN',

      label:
        'Organization admin',

      description:
        'Full workspace and team management access.',
    },
    {
      value:
        'REVENUE_MANAGER',

      label:
        'Revenue manager',

      description:
        'Manage revenue workflows, properties and imports.',
    },
    {
      value:
        'ANALYST',

      label:
        'Analyst',

      description:
        'Analyze performance and use AI-assisted insights.',
    },
    {
      value:
        'VIEWER',

      label:
        'Viewer',

      description:
        'Read-only access to permitted workspace data.',
    },
  ]


export type InviteDisplayStatus =
  | 'pending'
  | 'accepted'
  | 'cancelled'
  | 'expired'
  | string


export function formatTeamRole(
  role: string,
) {
  switch (
    role.toUpperCase()
  ) {
    case 'ORG_ADMIN':
      return 'Org admin'

    case 'REVENUE_MANAGER':
      return 'Revenue manager'

    case 'ANALYST':
      return 'Analyst'

    case 'VIEWER':
      return 'Viewer'

    default:
      return role
        .replace(
          /_/g,
          ' ',
        )
        .toLowerCase()
        .replace(
          /\b\w/g,
          (
            character,
          ) =>
            character
              .toUpperCase(),
        )
  }
}


export function getRoleBadgeVariant(
  role: string,
) {
  switch (
    role.toUpperCase()
  ) {
    case 'ORG_ADMIN':
      return 'brand' as const

    case 'REVENUE_MANAGER':
      return 'success' as const

    case 'ANALYST':
      return 'warning' as const

    default:
      return undefined
  }
}


export function getMemberDisplayName(
  member:
    WorkspaceMember,
) {
  return (
    member.full_name
      ?.trim() ||
    member.email
  )
}


export function formatTeamDate(
  value:
    string |
    null |
    undefined,
) {
  return formatDateIST(
    value,
  )
}


export function formatRelativeTeamDate(
  value:
    string |
    null |
    undefined,
) {
  return formatRelativeTime(
    value,
  )
}


export function getInviteDisplayStatus(
  invite:
    OrganizationInvite,
): InviteDisplayStatus {
  const status =
    invite.status
      .toLowerCase()

  if (
    status !==
    'pending'
  ) {
    return status
  }

  if (
    isApiDateExpired(
      invite.expires_at,
    )
  ) {
    return 'expired'
  }

  return 'pending'
}


export function formatInviteStatus(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case 'pending':
      return 'Pending'

    case 'accepted':
      return 'Accepted'

    case 'cancelled':
      return 'Cancelled'

    case 'expired':
      return 'Expired'

    default:
      return status
  }
}


export function getInviteStatusVariant(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case 'accepted':
      return 'success' as const

    case 'pending':
      return 'warning' as const

    case 'expired':
      return 'danger' as const

    default:
      return undefined
  }
}


export function countActiveAdmins(
  members:
    WorkspaceMember[],
) {
  return members.filter(
    (
      member,
    ) =>
      member.is_active &&
      member.role ===
        'ORG_ADMIN',
  ).length
}