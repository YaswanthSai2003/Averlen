import type {
  LucideIcon,
} from 'lucide-react'

import {
  ChartNoAxesCombined,
  Bell,
  BrainCircuit,
  Building2,
  CircleGauge,
  Settings,
  SlidersHorizontal,
  FileUp,
  Users,
} from 'lucide-react'

import type {
  SearchResult,
  SearchResultType,
} from '../../../api/search'

import type {
  UserRole,
} from '../../../types/auth'


export type GlobalSearchTarget = {
  key:
    string

  group:
    string

  title:
    string

  subtitle:
    string

  path:
    string

  icon:
    LucideIcon

  backendType?:
    SearchResultType
}


type PageDefinition = {
  title:
    string

  subtitle:
    string

  path:
    string

  keywords:
    string

  icon:
    LucideIcon

  roles?:
    UserRole[]
}


const PAGE_DEFINITIONS:
  PageDefinition[] = [
    {
      title:
        'Overview',

      subtitle:
        'Workspace revenue dashboard',

      path:
        '/app/overview',

      keywords:
        'dashboard overview revenue performance home',

      icon:
        CircleGauge,
    },

    {
      title:
        'Properties',

      subtitle:
        'Manage properties and accommodation details',

      path:
        '/app/properties',

      keywords:
        'property properties accommodation hotel villa apartment',

      icon:
        Building2,
    },

    {
      title:
        'Data imports',

      subtitle:
        'Upload and review booking CSV data',

      path:
        '/app/imports',

      keywords:
        'data imports upload csv bookings ingestion',

      icon:
        FileUp,
    },

    {
      title:
        'Analytics',

      subtitle:
        'Revenue trends and property performance',

      path:
        '/app/analytics',

      keywords:
        'analytics revenue trends chart performance city adr',

      icon:
        ChartNoAxesCombined,
    },

    {
      title:
        'Pricing',

      subtitle:
        'Pricing recommendations and history',

      path:
        '/app/pricing',

      keywords:
        'pricing recommendation rate price demand confidence',

      icon:
        SlidersHorizontal,
    },

    {
      title:
        'AI insights',

      subtitle:
        'Ask questions and review insight history',

      path:
        '/app/insights',

      keywords:
        'ai insights question answer history intelligence',

      icon:
        BrainCircuit,
    },

    {
      title:
        'Notifications',

      subtitle:
        'Workspace alerts and activity',

      path:
        '/app/notifications',

      keywords:
        'notifications alerts activity updates',

      icon:
        Bell,
    },

    {
      title:
        'Team',

      subtitle:
        'Members, roles and invitations',

      path:
        '/app/team',

      keywords:
        'team member members roles invitations workspace users',

      icon:
        Users,

      roles: [
        'ORG_ADMIN',
      ],
    },

    {
      title:
        'Settings',

      subtitle:
        'Profile, security and active sessions',

      path:
        '/app/settings',

      keywords:
        'settings profile account security password sessions',

      icon:
        Settings,
    },
  ]


function pageIsAvailable(
  page: PageDefinition,
  role: UserRole,
) {
  return (
    !page.roles ||
    page.roles.includes(
      role,
    )
  )
}


export function getPageSearchTargets(
  query: string,
  role: UserRole,
) {
  const normalized =
    query
      .trim()
      .toLowerCase()

  const available =
    PAGE_DEFINITIONS.filter(
      (page) =>
        pageIsAvailable(
          page,
          role,
        ),
    )

  const visible =
    normalized
      ? available.filter(
          (page) => {
            const haystack =
              `${
                page.title
              } ${
                page.subtitle
              } ${
                page.keywords
              }`
                .toLowerCase()

            return (
              haystack.includes(
                normalized,
              )
            )
          },
        )
      : available.slice(
          0,
          6,
        )

  return visible.map(
    (
      page,
    ): GlobalSearchTarget => ({
      key:
        `page:${page.path}`,

      group:
        normalized
          ? 'Pages'
          : 'Quick navigation',

      title:
        page.title,

      subtitle:
        page.subtitle,

      path:
        page.path,

      icon:
        page.icon,
    }),
  )
}


function getBackendResultPresentation(
  result: SearchResult,
  role: UserRole,
): GlobalSearchTarget | null {
  switch (
    result.type
  ) {
    case 'property':
      return {
        key:
          `property:${result.id}`,

        group:
          'Properties',

        title:
          result.title,

        subtitle:
          result.subtitle ??
          'Property',

        path:
          `/app/properties/${result.id}`,

        icon:
          Building2,

        backendType:
          result.type,
      }

    case 'upload_job':
      return {
        key:
          `upload:${result.id}`,

        group:
          'Data imports',

        title:
          result.title,

        subtitle:
          result.subtitle ??
          'Import job',

        path:
          '/app/imports',

        icon:
          FileUp,

        backendType:
          result.type,
      }

    case 'workspace_member':
      if (
        role !==
        'ORG_ADMIN'
      ) {
        return null
      }

      return {
        key:
          `member:${result.id}`,

        group:
          'Workspace members',

        title:
          result.title,

        subtitle:
          result.subtitle ??
          'Workspace member',

        path:
          '/app/team',

        icon:
          Users,

        backendType:
          result.type,
      }

    case 'ai_insight':
      return {
        key:
          `insight:${result.id}`,

        group:
          'AI insights',

        title:
          result.title,

        subtitle:
          result.subtitle ??
          'Saved AI insight',

        path:
          '/app/insights',

        icon:
          BrainCircuit,

        backendType:
          result.type,
      }

    case 'pricing_recommendation':
      return {
        key:
          `pricing:${result.id}`,

        group:
          'Pricing',

        title:
          result.title,

        subtitle:
          result.subtitle ??
          'Pricing recommendation',

        path:
          '/app/pricing',

        icon:
          SlidersHorizontal,

        backendType:
          result.type,
      }

    default:
      return null
  }
}


export function getBackendSearchTargets(
  results:
    SearchResult[],
  role:
    UserRole,
) {
  return results.flatMap(
    (result) => {
      const target =
        getBackendResultPresentation(
          result,
          role,
        )

      return target
        ? [
            target,
          ]
        : []
    },
  )
}


export type SearchTargetGroup = {
  label:
    string

  items:
    GlobalSearchTarget[]
}


export function groupSearchTargets(
  targets:
    GlobalSearchTarget[],
) {
  const groups =
    new Map<
      string,
      GlobalSearchTarget[]
    >()

  for (
    const target
    of targets
  ) {
    const current =
      groups.get(
        target.group,
      ) ??
      []

    current.push(
      target,
    )

    groups.set(
      target.group,
      current,
    )
  }

  return Array.from(
    groups.entries(),
  ).map(
    (
      [
        label,
        items,
      ],
    ): SearchTargetGroup => ({
      label,
      items,
    }),
  )
}
