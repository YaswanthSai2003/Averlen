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
  BedDouble,
  CalendarCheck,
  Clock3,
  IndianRupee,
} from 'lucide-react'

import {
  Card,
  EmptyState,
  MetricCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  formatCurrency,
  formatDecimal,
  formatNumber,
} from '../../../lib/format'

import {
  type AnalyticsPerformance,
} from '../utils/analyticsTypes'


type AnalyticsPerformanceSectionProps = {
  performance:
    AnalyticsPerformance |
    undefined
  onOpenProperty:
    (propertyId: number) => void
}


export function AnalyticsPerformanceSection({
  performance,
  onOpenProperty,
}: AnalyticsPerformanceSectionProps) {
  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="ADR"
          value={
            formatCurrency(
              performance
                ?.overall
                .adr ??
              0,
            )
          }
          description="Revenue per booking"
          icon={
            <IndianRupee
              size={18}
              aria-hidden="true"
            />
          }
        />

        <MetricCard
          label="Revenue / booked night"
          value={
            formatCurrency(
              performance
                ?.overall
                .revenue_per_booked_night ??
              0,
            )
          }
          description="Revenue efficiency"
          icon={
            <BedDouble
              size={18}
              aria-hidden="true"
            />
          }
        />

        <MetricCard
          label="Average stay"
          value={`${formatDecimal(
            performance
              ?.overall
              .average_length_of_stay ??
            0,
            1,
          )} nights`}
          description="Average booking duration"
          icon={
            <Clock3
              size={18}
              aria-hidden="true"
            />
          }
        />

        <MetricCard
          label="Booked nights"
          value={
            formatNumber(
              performance
                ?.overall
                .total_booked_nights ??
              0,
            )
          }
          description="Across workspace"
          icon={
            <CalendarCheck
              size={18}
              aria-hidden="true"
            />
          }
        />
      </div>

      <Card className="p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            City performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Compare revenue contribution across cities.
          </p>
        </div>

        {(performance
          ?.city_performance
          .length ??
          0) > 0 ? (
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={
                  performance
                    ?.city_performance ??
                  []
                }
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="city"
                  tickLine={false}
                  axisLine={false}
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
                  width={78}
                  tick={{
                    fill:
                      '#64748b',
                    fontSize:
                      12,
                  }}
                />

                <Tooltip
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
                />

                <Bar
                  dataKey="total_revenue"
                  fill="#2563eb"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="No city performance available"
              description="City performance will appear once booking data is available for the selected period."
            />
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-slate-950">
            Property performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Compare revenue, bookings and stay performance across properties.
          </p>
        </div>

        {(performance
          ?.property_performance
          .length ??
          0) > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Property
                </TableHead>

                <TableHead>
                  City
                </TableHead>

                <TableHead>
                  Revenue
                </TableHead>

                <TableHead>
                  Bookings
                </TableHead>

                <TableHead>
                  Nights
                </TableHead>

                <TableHead>
                  ADR
                </TableHead>

                <TableHead>
                  Rev / night
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {performance
                ?.property_performance
                .map(
                  (
                    property,
                  ) => (
                    <TableRow
                      key={
                        property
                          .property_id
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        onOpenProperty(
                          property
                            .property_id,
                        )
                      }}
                    >
                      <TableCell className="font-medium text-slate-950">
                        {
                          property
                            .property_name
                        }
                      </TableCell>

                      <TableCell>
                        {
                          property
                            .city
                        }
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property
                            .total_revenue,
                        )}
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatNumber(
                          property
                            .total_bookings,
                        )}
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatNumber(
                          property
                            .total_booked_nights,
                        )}
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property
                            .adr,
                        )}
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property
                            .revenue_per_booked_night,
                        )}
                      </TableCell>
                    </TableRow>
                  ),
                )}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No property performance available"
            description="Property metrics will appear once booking data exists for this period."
          />
        )}
      </Card>
    </div>
  )
}
