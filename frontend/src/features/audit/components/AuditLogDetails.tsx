import {
  Clock3,
  Globe2,
  Monitor,
  Route,
  UserRound,
} from 'lucide-react'

import type {
  AuditLogItem,
} from '../../../api/audit'

import {
  formatAuditAction,
  formatAuditPath,
  formatAuditTimestamp,
  formatUserAgent,
} from '../utils/auditFormat'


type AuditLogDetailsProps = {
  item:
    AuditLogItem
}


type DetailItemProps = {
  label:
    string

  value:
    string

  monospace?:
    boolean

  icon:
    typeof Clock3
}


function DetailItem({
  label,
  value,
  monospace = false,
  icon:
    Icon,
}: DetailItemProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon
          size={15}
          aria-hidden="true"
        />

        <p className="text-xs font-medium uppercase tracking-[0.08em]">
          {label}
        </p>
      </div>

      <p
        className={`
          mt-2
          break-all
          text-sm
          text-slate-700
          ${
            monospace
              ? 'font-mono text-xs'
              : ''
          }
        `}
      >
        {value}
      </p>
    </div>
  )
}


export function AuditLogDetails({
  item,
}: AuditLogDetailsProps) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
          Audit event #{item.id}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-800">
          {formatAuditAction(
            item.action,
          )}
        </p>
      </div>


      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem
          icon={
            Clock3
          }
          label="Recorded"
          value={
            formatAuditTimestamp(
              item.created_at,
            )
          }
        />

        <DetailItem
          icon={
            UserRound
          }
          label="User ID"
          value={
            item.user_id ===
            null
              ? 'Not authenticated'
              : String(
                  item.user_id,
                )
          }
          monospace
        />

        <DetailItem
          icon={
            UserRound
          }
          label="Organization ID"
          value={
            item.organization_id ===
            null
              ? '—'
              : String(
                  item.organization_id,
                )
          }
          monospace
        />

        <DetailItem
          icon={
            Globe2
          }
          label="IP address"
          value={
            item.ip_address ??
            'Unavailable'
          }
          monospace
        />

        <DetailItem
          icon={
            Route
          }
          label="Full request"
          value={
            `${item.method.toUpperCase()} ${formatAuditPath(
              item.path,
            )}`
          }
          monospace
        />

        <DetailItem
          icon={
            Monitor
          }
          label="Device"
          value={
            formatUserAgent(
              item.user_agent,
            )
          }
        />
      </div>


      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
          Full user agent
        </p>

        <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">
          {item.user_agent ??
            'User agent was not recorded.'}
        </p>
      </div>
    </div>
  )
}