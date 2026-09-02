import {
  CalendarCheck,
  Clock3,
  IndianRupee,
  TrendingUp,
} from 'lucide-react'

import {
  MetricCard,
} from '../../../components/ui'

import {
  formatCurrency,
  formatDecimal,
  formatNumber,
} from '../../../lib/format'

import {
  formatChange,
  getChangeTone,
} from '../utils/analyticsFormat'

import {
  type AnalyticsSummary,
} from '../utils/analyticsTypes'


type AnalyticsSummaryMetricsProps = {
  summary:
    AnalyticsSummary |
    undefined
}


export function AnalyticsSummaryMetrics({
  summary,
}: AnalyticsSummaryMetricsProps) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total revenue"
        value={
          formatCurrency(
            summary?.total_revenue ??
            0,
          )
        }
        change={
          formatChange(
            summary
              ?.total_revenue_change_pct,
          )
        }
        changeTone={
          getChangeTone(
            summary
              ?.total_revenue_change_pct,
          )
        }
        description={
          summary
            ?.total_revenue_change_pct !=
          null
            ? 'vs previous matching period'
            : 'Revenue in selected period'
        }
        icon={
          <IndianRupee
            size={18}
            aria-hidden="true"
          />
        }
      />

      <MetricCard
        label="Bookings"
        value={
          formatNumber(
            summary
              ?.total_bookings ??
            0,
          )
        }
        change={
          formatChange(
            summary
              ?.total_bookings_change_pct,
          )
        }
        changeTone={
          getChangeTone(
            summary
              ?.total_bookings_change_pct,
          )
        }
        description={
          summary
            ?.total_bookings_change_pct !=
          null
            ? 'vs previous matching period'
            : 'Bookings in selected period'
        }
        icon={
          <CalendarCheck
            size={18}
            aria-hidden="true"
          />
        }
      />

      <MetricCard
        label="Average booking value"
        value={
          formatCurrency(
            summary
              ?.average_booking_value ??
            0,
          )
        }
        change={
          formatChange(
            summary
              ?.average_booking_value_change_pct,
          )
        }
        changeTone={
          getChangeTone(
            summary
              ?.average_booking_value_change_pct,
          )
        }
        description={
          summary
            ?.average_booking_value_change_pct !=
          null
            ? 'vs previous matching period'
            : 'Revenue per booking'
        }
        icon={
          <TrendingUp
            size={18}
            aria-hidden="true"
          />
        }
      />

      <MetricCard
        label="Booked nights"
        value={
          formatNumber(
            summary
              ?.total_booked_nights ??
            0,
          )
        }
        description={
          summary &&
          summary.total_bookings > 0
            ? `${formatDecimal(
                summary
                  .average_length_of_stay,
                1,
              )} nights average stay`
            : 'No booked nights'
        }
        icon={
          <Clock3
            size={18}
            aria-hidden="true"
          />
        }
      />
    </div>
  )
}
