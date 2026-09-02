import {
  CalendarCheck,
  Clock3,
  IndianRupee,
  TrendingUp,
} from 'lucide-react'

import {
  type DashboardSummary,
} from '../../../api/analytics'

import {
  MetricCard,
} from '../../../components/ui'

import {
  formatCurrency,
  formatDecimal,
  formatNumber,
} from '../../../lib/format'

import {
  formatDashboardChange,
  getDashboardChangeTone,
} from '../utils/dashboardFormat'


type DashboardMetricsProps = {
  summary:
    DashboardSummary
}


export function DashboardMetrics({
  summary,
}: DashboardMetricsProps) {
  const hasBookings =
    summary.total_bookings > 0

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total revenue"
        value={
          formatCurrency(
            summary.total_revenue,
          )
        }
        change={
          formatDashboardChange(
            summary
              .total_revenue_change_pct,
          )
        }
        changeTone={
          getDashboardChangeTone(
            summary
              .total_revenue_change_pct,
          )
        }
        description={
          summary
            .total_revenue_change_pct !=
          null
            ? 'vs previous matching period'
            : 'Revenue through today'
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
            summary.total_bookings,
          )
        }
        change={
          formatDashboardChange(
            summary
              .total_bookings_change_pct,
          )
        }
        changeTone={
          getDashboardChangeTone(
            summary
              .total_bookings_change_pct,
          )
        }
        description={
          summary
            .total_bookings_change_pct !=
          null
            ? 'vs previous matching period'
            : 'Check-ins through today'
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
              .average_booking_value,
          )
        }
        change={
          formatDashboardChange(
            summary
              .average_booking_value_change_pct,
          )
        }
        changeTone={
          getDashboardChangeTone(
            summary
              .average_booking_value_change_pct,
          )
        }
        description="Revenue per booking"
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
              .total_booked_nights,
          )
        }
        description={
          hasBookings
            ? `${formatDecimal(
                summary
                  .average_length_of_stay,
                1,
              )} nights average stay`
            : 'No booked nights yet'
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
