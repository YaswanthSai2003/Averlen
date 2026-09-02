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
  getAnalyticsTrends,
} from '../../../api/analytics'

import {
  Badge,
  Card,
} from '../../../components/ui'

import {
  formatCurrency,
  formatNumber,
} from '../../../lib/format'

import {
  formatDashboardChartDate,
  formatDashboardDate,
  formatDashboardFullDate,
} from '../utils/dashboardFormat'


type TrendPoint =
  Awaited<
    ReturnType<
      typeof getAnalyticsTrends
    >
  >['trends'][number]


type DashboardRevenueTrendProps = {
  trends:
    TrendPoint[]
  throughDate:
    string
}


export function DashboardRevenueTrend({
  trends,
  throughDate,
}: DashboardRevenueTrendProps) {
  const chartData =
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

  const years =
    new Set(
      chartData.map(
        (item) =>
          item.date.slice(
            0,
            4,
          ),
      ),
    )

  const includeYear =
    years.size > 1

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-5 xl:px-6">
        <div>
          <h2 className="font-semibold text-slate-950">
            Revenue trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Booking revenue by check-in date through {formatDashboardDate(
              throughDate,
            )}.
          </p>
        </div>

        <Badge variant="brand" className="w-fit shrink-0">
          {formatNumber(
            chartData.length,
          )} data points
        </Badge>
      </div>

      <div className="h-[250px] px-2 pb-3 pt-4 sm:h-[270px] sm:px-3 md:h-[250px] xl:h-[310px] xl:px-5 xl:pb-4 xl:pt-5">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={
              chartData
            }
            margin={{
              top: 8,
              right: 12,
              bottom: 12,
              left: 8,
            }}
          >
            <defs>
              <linearGradient
                id="dashboardRevenueFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#2563eb"
                  stopOpacity={0.22}
                />

                <stop
                  offset="95%"
                  stopColor="#2563eb"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              minTickGap={32}
              tickMargin={10}
              height={34}
              padding={{
                left: 8,
                right: 8,
              }}
              tickLine={false}
              axisLine={false}
              tick={{
                fill:
                  '#64748b',
                fontSize:
                  12,
              }}
              tickFormatter={(
                value,
              ) =>
                formatDashboardChartDate(
                  String(
                    value,
                  ),
                  includeYear,
                )
              }
            />

            <YAxis
              width={64}
              tickMargin={8}
              tickLine={false}
              axisLine={false}
              tick={{
                fill:
                  '#64748b',
                fontSize:
                  12,
              }}
              tickFormatter={(
                value,
              ) =>
                `₹${formatNumber(
                  Number(
                    value,
                  ),
                )}`
              }
            />

            <Tooltip
              labelFormatter={(
                label,
              ) =>
                formatDashboardFullDate(
                  String(
                    label,
                  ),
                )
              }
              formatter={(
                value,
              ) => [
                formatCurrency(
                  Number(
                    value,
                  ),
                ),
                'Revenue',
              ]}
              contentStyle={{
                borderRadius:
                  10,
                borderColor:
                  '#e2e8f0',
              }}
            />

            <Area
              type="monotone"
              dataKey="total_revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#dashboardRevenueFill)"
              activeDot={{
                r: 4,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
