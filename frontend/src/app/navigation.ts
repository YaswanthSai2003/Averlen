import {
  Bell,
  BrainCircuit,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  FileUp,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react'

import type { UserRole } from '../types/auth'

import {
  TEAM_ROLES,
} from './access'

export type NavigationItem = {
  label: string
  path: string
  icon: typeof CircleGauge
  allowedRoles?: readonly UserRole[]
}

export type NavigationSection = {
  label?: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  {
    items: [
      {
        label: 'Overview',
        path: '/app/overview',
        icon: CircleGauge,
      },
    ],
  },

  {
    label: 'Operations',
    items: [
      {
        label: 'Properties',
        path: '/app/properties',
        icon: Building2,
      },
      {
        label: 'Data imports',
        path: '/app/imports',
        icon: FileUp,
      },
    ],
  },

  {
    label: 'Intelligence',
    items: [
      {
        label: 'Analytics',
        path: '/app/analytics',
        icon: ChartNoAxesCombined,
      },
      {
        label: 'Pricing',
        path: '/app/pricing',
        icon: SlidersHorizontal,
      },
      {
        label: 'AI insights',
        path: '/app/insights',
        icon: BrainCircuit,
      },
    ],
  },

  {
    label: 'Workspace',
    items: [
      {
        label: 'Notifications',
        path: '/app/notifications',
        icon: Bell,
      },
      {
        label: 'Team',
        path: '/app/team',
        icon: Users,
        allowedRoles: TEAM_ROLES,
      },
    ],
  },

  {
    label: 'Account',
    items: [
      {
        label: 'Settings',
        path: '/app/settings',
        icon: Settings,
      },
    ],
  },
]

export function canViewNavigationItem(
  item: NavigationItem,
  role: UserRole,
) {
  return (
    !item.allowedRoles ||
    item.allowedRoles.includes(role)
  )
}

export function getVisibleNavigationSections(
  role: UserRole,
): NavigationSection[] {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canViewNavigationItem(item, role),
      ),
    }))
    .filter((section) => section.items.length > 0)
}
