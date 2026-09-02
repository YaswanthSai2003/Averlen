import type {
  UserRole,
} from '../types/auth'


export const TEAM_ROLES:
  readonly UserRole[] = [
    'ORG_ADMIN',
  ]


// Audit logs are internal-only. No customer workspace role may access them.
export const AUDIT_ROLES:
  readonly UserRole[] = []


export const PROPERTY_MANAGE_ROLES:
  readonly UserRole[] = [
    'ORG_ADMIN',
    'REVENUE_MANAGER',
  ]