import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  getAnalyticsPerformance,
} from '../../../api/analytics'

import {
  Badge,
  Card,
} from '../../../components/ui'

import {
  formatCurrency,
  formatNumber,
} from '../../../lib/format'


type CityPerformance =
  Awaited<
    ReturnType<
      typeof getAnalyticsPerformance
    >
  >['city_performance'][number]


type DashboardCityRevenueProps = {
  cityPerformance:
    CityPerformance[]
  topCity:
    string
}


function formatAxisCurrency(
  value: number,
) {
  if (
    Math.abs(value) >=
    100_000
  ) {
    return `₹${(
      value /
      100_000
    ).toFixed(
      value %
        100_000 ===
        0
        ? 0
        : 1,
    )}L`
  }

  if (
    Math.abs(value) >=
    1_000
  ) {
    return `₹${(
      value /
      1_000
    ).toFixed(
      value %
        1_000 ===
        0
        ? 0
        : 1,
    )}k`
  }

  return `₹${formatNumber(
    value,
  )}`
}


export function DashboardCityRevenue({
  cityPerformance,
  topCity,
}: DashboardCityRevenueProps) {
  const chartData =
    [
      ...cityPerformance,
    ]
      .sort(
        (
          left,
          right,
        ) =>
          right.total_revenue -
          left.total_revenue,
      )
      .slice(
        0,
        5,
      )

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5 xl:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-950">
              Revenue by city
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Top markets in the current dashboard period.
            </p>
          </div>

          {topCity &&
            topCity !==
              'N/A' && (
              <Badge variant="success">
                {topCity}
              </Badge>
            )}
        </div>
      </div>

      <div className="h-[250px] px-3 pb-3 pt-4 sm:h-[270px] sm:px-4 md:h-[250px] xl:h-[310px] xl:px-5 xl:pb-4 xl:pt-5">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={
              chartData
            }
            layout="vertical"
            barCategoryGap="28%"
            margin={{
              top: 4,
              right: 18,
              bottom: 4,
              left: 4,
            }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              horizontal={false}
            />

            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{
                fill:
                  '#64748b',
                fontSize:
                  11,
              }}
              tickFormatter={(
                value,
              ) =>
                formatAxisCurrency(
                  Number(
                    value,
                  ),
                )
              }
            />

            <YAxis
              dataKey="city"
              type="category"
              width={82}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{
                fill:
                  '#475569',
                fontSize:
                  12,
                fontWeight:
                  500,
              }}
            />

            <Tooltip
              cursor={{
                fill:
                  '#f8fafc',
              }}
              content={({
                active,
                payload,
                label,
              }) => {
                if (
                  !active ||
                  !payload?.length
                ) {
                  return null
                }

                const revenue =
                  Number(
                    payload[0]
                      ?.value ??
                      0,
                  )

                return (
                  <div className="pointer-events-none min-w-[132px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
                    <p className="text-xs font-semibold text-slate-900">
                      {String(
                        label ??
                          '',
                      )}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span
                        className="size-2 rounded-full bg-brand-600"
                        aria-hidden="true"
                      />

                      <span className="text-slate-500">
                        Revenue
                      </span>

                      <span className="ml-auto font-semibold tabular-nums text-slate-900">
                        {formatCurrency(
                          revenue,
                        )}
                      </span>
                    </div>
                  </div>
                )
              }}
            />

            <Bar
              dataKey="total_revenue"
              fill="#2563eb"
              radius={[
                0,
                7,
                7,
                0,
              ]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
