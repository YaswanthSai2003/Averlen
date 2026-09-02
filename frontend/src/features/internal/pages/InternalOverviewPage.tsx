import {
  Activity,
  Building2,
  CircleAlert,
  Database,
  FileUp,
  Home,
  Users,
  Waypoints,
} from 'lucide-react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  getAuditLogsPage,
} from '../../../api/audit'

import {
  getInternalOverview,
} from '../../../api/internal'

import {
  PageHeader,
} from '../../../components/layout'

import {
  Badge,
  Card,
  ErrorState,
} from '../../../components/ui'

import {
  InternalMetric,
} from '../components/InternalMetric'

import {
  formatInternalDate,
  formatInternalNumber,
} from '../utils/internalFormat'


export function InternalOverviewPage() {
  const overviewQuery =
    useQuery({
      queryKey: [
        'internal',
        'overview',
      ],
      queryFn:
        getInternalOverview,
      staleTime:
        15_000,
    })

  const activityQuery =
    useQuery({
      queryKey: [
        'internal',
        'recent-activity',
      ],
      queryFn: () =>
        getAuditLogsPage({
          limit: 8,
          offset: 0,
        }),
      staleTime:
        10_000,
    })

  const data =
    overviewQuery.data

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Internal"
        title="Platform overview"
        description="Monitor Averlen across every customer organization from one protected operator console."
      />

      {overviewQuery.isError ? (
        <ErrorState
          title="Unable to load platform overview"
          description="Averlen couldn't load internal platform metrics."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InternalMetric
            label="Organizations"
            value={
              data
                ? formatInternalNumber(
                    data.organizations,
                  )
                : '—'
            }
            icon={Building2}
          />

          <InternalMetric
            label="Users"
            value={
              data
                ? formatInternalNumber(
                    data.users,
                  )
                : '—'
            }
            icon={Users}
            description={
              data
                ? `${formatInternalNumber(data.active_users)} active`
                : undefined
            }
          />

          <InternalMetric
            label="Properties"
            value={
              data
                ? formatInternalNumber(
                    data.properties,
                  )
                : '—'
            }
            icon={Home}
          />

          <InternalMetric
            label="Bookings"
            value={
              data
                ? formatInternalNumber(
                    data.bookings,
                  )
                : '—'
            }
            icon={Database}
          />

          <InternalMetric
            label="Import jobs"
            value={
              data
                ? formatInternalNumber(
                    data.import_jobs,
                  )
                : '—'
            }
            icon={FileUp}
          />

          <InternalMetric
            label="Audit events"
            value={
              data
                ? formatInternalNumber(
                    data.audit_events,
                  )
                : '—'
            }
            icon={Activity}
          />

          <InternalMetric
            label="Errors"
            value={
              data
                ? formatInternalNumber(
                    data.error_events,
                  )
                : '—'
            }
            icon={CircleAlert}
          />

          <InternalMetric
            label="Console scope"
            value="Global"
            icon={Waypoints}
            description="All organizations"
          />
        </div>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="font-semibold text-slate-950">
            Recent platform activity
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest audited requests across Averlen.
          </p>
        </div>

        {activityQuery.isError ? (
          <div className="p-5 sm:p-6">
            <ErrorState
              title="Unable to load recent activity"
              description="Audit activity is temporarily unavailable."
            />
          </div>
        ) : activityQuery.data?.items.length ? (
          <div className="divide-y divide-slate-100">
            {activityQuery.data.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {item.method}
                      </span>
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.path}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.email ?? 'Unauthenticated'}
                      {' · '}
                      {formatInternalDate(
                        item.created_at,
                      )}
                    </p>
                  </div>

                  <Badge
                    variant={
                      item.status_code >= 400
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {item.status_code}
                  </Badge>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No audited platform activity yet.
          </div>
        )}
      </Card>
    </div>
  )
}
