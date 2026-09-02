import {
  Activity,
  CircleAlert,
  Gauge,
  ListChecks,
} from 'lucide-react'

import type {
  AuditLogItem,
} from '../../../api/audit'

import {
  Card,
  Skeleton,
} from '../../../components/ui'

import {
  formatDuration,
  formatNumber,
} from '../utils/auditFormat'


type AuditSummaryProps = {
  items:
    AuditLogItem[]

  total:
    number

  isLoading:
    boolean
}


export function AuditSummary({
  items,
  total,
  isLoading,
}: AuditSummaryProps) {
  if (isLoading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (
            _,
            index,
          ) => (
            <Skeleton
              key={
                index
              }
              className="h-28 rounded-xl"
            />
          ),
        )}
      </div>
    )
  }


  const failures =
    items.filter(
      (
        item,
      ) =>
        item.status_code >=
        400,
    ).length


  const averageDuration =
    items.length > 0
      ? items.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.duration_ms,
          0,
        ) /
        items.length
      : 0


  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Activity
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Total events
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {formatNumber(
                total,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Recorded workspace activity
            </p>
          </div>
        </div>
      </Card>


      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ListChecks
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              This page
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {formatNumber(
                items.length,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Events currently loaded
            </p>
          </div>
        </div>
      </Card>


      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <CircleAlert
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Failed requests
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {formatNumber(
                failures,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              On the current page
            </p>
          </div>
        </div>
      </Card>


      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Gauge
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Avg response
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {formatDuration(
                averageDuration,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current page average
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}