import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Building2,
  MapPin,
} from 'lucide-react'

import {
  Badge,
  Card,
} from '../../../components/ui'

import {
  formatCurrency,
  formatNumber,
} from '../../../lib/format'

import {
  formatChartDate,
  formatFullDate,
} from '../utils/analyticsFormat'

import {
  type AnalyticsSummary,
  type AnalyticsTrendPoint,
} from '../utils/analyticsTypes'


type AnalyticsRevenueSectionProps = {
  summary:
    AnalyticsSummary |
    undefined
  trends:
    AnalyticsTrendPoint[]
  periodLabel: string
}


export function AnalyticsRevenueSection({
  summary,
  trends,
  periodLabel,
}: AnalyticsRevenueSectionProps) {
  const chartTrends =
    [
      ...trends,
    ].sort(
      (
        left,
        right,
      ) =>
        left.date.localeCompare(
          right.date,
        ),
    )

  const trendYears =
    new Set(
      chartTrends.map(
        (item) =>
          item.date.slice(
            0,
            4,
          ),
      ),
    )

  const chartSpansMultipleYears =
    trendYears.size > 1

  return (
    <div className="mt-6 grid gap-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Revenue trend
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Booking revenue by check-in date · {periodLabel}
            </p>
          </div>

          <Badge variant="brand">
            {chartTrends.length} data points
          </Badge>
        </div>

        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={chartTrends}
              margin={{
                top: 10,
                right: 12,
                left: 4,
                bottom: 8,
              }}
            >
              <defs>
                <linearGradient
                  id="analyticsRevenueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#2563eb"
                    stopOpacity={0.24}
                  />

                  <stop
                    offset="95%"
                    stopColor="#2563eb"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="date"
                tickFormatter={(
                  value,
                ) =>
                  formatChartDate(
                    String(
                      value,
                    ),
                    chartSpansMultipleYears,
                  )
                }
                minTickGap={28}
                padding={{
                  left: 16,
                  right: 16,
                }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                height={34}
                tick={{
                  fill:
                    '#64748b',
                  fontSize:
                    12,
                }}
              />

              <YAxis
                tickFormatter={(
                  value,
                ) =>
                  `₹${formatNumber(
                    Number(
                      value,
                    ),
                  )}`
                }
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={72}
                tick={{
                  fill:
                    '#64748b',
                  fontSize:
                    12,
                }}
              />

              <Tooltip
                labelFormatter={(
                  label,
                ) =>
                  formatFullDate(
                    String(
                      label,
                    ),
                  )
                }
                formatter={(
                  value,
                  name,
                ) => {
                  if (
                    name ===
                    'total_revenue'
                  ) {
                    return [
                      formatCurrency(
                        Number(
                          value,
                        ),
                      ),
                      'Revenue',
                    ]
                  }

                  return [
                    value,
                    name,
                  ]
                }}
              />

              <Area
                type="monotone"
                dataKey="total_revenue"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#analyticsRevenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <MapPin
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Top city by revenue
              </p>

              <p className="mt-0.5 text-lg font-semibold text-slate-950">
                {
                  summary
                    ?.top_city_by_revenue
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Building2
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                Top property
              </p>

              <p className="mt-0.5 truncate text-lg font-semibold text-slate-950">
                {typeof summary
                  ?.top_property_by_revenue ===
                'object'
                  ? summary
                      .top_property_by_revenue
                      ?.name
                  : '—'}
              </p>

              {typeof summary
                ?.top_property_by_revenue ===
                'object' &&
                summary
                  .top_property_by_revenue && (
                  <p className="mt-1 text-sm text-slate-500">
                    {
                      summary
                        .top_property_by_revenue
                        .city
                    }
                    {' · '}
                    {formatCurrency(
                      summary
                        .top_property_by_revenue
                        .total_revenue,
                    )}
                  </p>
                )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
