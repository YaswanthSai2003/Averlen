import {
  Bot,
  Building2,
  FileUp,
  Home,
  MessageSquareText,
  IndianRupee,
  Users,
  Waypoints,
} from 'lucide-react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  getInternalUsage,
} from '../../../api/internal'

import {
  PageHeader,
} from '../../../components/layout'

import {
  ErrorState,
} from '../../../components/ui'

import {
  InternalMetric,
} from '../components/InternalMetric'

import {
  formatInternalNumber,
} from '../utils/internalFormat'


export function UsagePage() {
  const query =
    useQuery({
      queryKey: [
        'internal',
        'usage',
      ],
      queryFn:
        getInternalUsage,
      staleTime:
        15_000,
    })

  const data =
    query.data

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Internal"
        title="Usage"
        description="Platform-wide product usage totals across all Averlen customer organizations."
      />

      {query.isError ? (
        <ErrorState
          title="Unable to load platform usage"
          description="Averlen couldn't load usage metrics."
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
            icon={Waypoints}
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
            description={
              data
                ? `${formatInternalNumber(data.completed_import_jobs)} completed · ${formatInternalNumber(data.failed_import_jobs)} failed`
                : undefined
            }
          />

          <InternalMetric
            label="Pricing recommendations"
            value={
              data
                ? formatInternalNumber(
                    data.pricing_recommendations,
                  )
                : '—'
            }
            icon={IndianRupee}
          />

          <InternalMetric
            label="AI insights"
            value={
              data
                ? formatInternalNumber(
                    data.ai_insights,
                  )
                : '—'
            }
            icon={Bot}
          />

          <InternalMetric
            label="Notifications"
            value={
              data
                ? formatInternalNumber(
                    data.notifications,
                  )
                : '—'
            }
            icon={MessageSquareText}
          />
        </div>
      )}
    </div>
  )
}
