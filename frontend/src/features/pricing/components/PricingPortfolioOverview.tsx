import {
  Building2,
  CalendarCheck,
  IndianRupee,
  TrendingUp,
} from 'lucide-react'

import {
  type PropertySummary,
} from '../../../api/properties'

import {
  Badge,
  Button,
  Card,
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


type PricingPortfolioOverviewProps = {
  properties:
    PropertySummary[]
  onReviewProperty:
    (propertyId: number) => void
}


function getPriceGap(
  property:
    PropertySummary,
) {
  if (
    property.total_bookings <=
      0 ||
    property.base_price <=
      0
  ) {
    return null
  }

  return (
    (
      property.adr -
      property.base_price
    ) /
    property.base_price
  ) * 100
}


function getGapVariant(
  value:
    number |
    null,
) {
  if (value === null) {
    return undefined
  }

  if (value > 3) {
    return 'success' as const
  }

  if (value < -3) {
    return 'warning' as const
  }

  return undefined
}


function formatGap(
  gap: number | null,
) {
  if (gap === null) {
    return 'No data'
  }

  return `${
    gap > 0
      ? '+'
      : ''
  }${formatDecimal(gap, 1)}%`
}


export function PricingPortfolioOverview({
  properties,
  onReviewProperty,
}: PricingPortfolioOverviewProps) {
  const totalRevenue =
    properties.reduce(
      (
        total,
        property,
      ) =>
        total +
        property.total_revenue,
      0,
    )

  const totalBookings =
    properties.reduce(
      (
        total,
        property,
      ) =>
        total +
        property.total_bookings,
      0,
    )

  const portfolioAdr =
    totalBookings > 0
      ? totalRevenue /
        totalBookings
      : 0

  const comparisonRows =
    [
      ...properties,
    ].sort(
      (
        left,
        right,
      ) =>
        right.total_revenue -
        left.total_revenue,
    )

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Properties"
          value={
            formatNumber(
              properties.length,
            )
          }
          description="Active pricing scope"
          icon={
            <Building2
              size={18}
              aria-hidden="true"
            />
          }
        />

        <MetricCard
          label="Portfolio revenue"
          value={
            formatCurrency(
              totalRevenue,
            )
          }
          description="Across all listed properties"
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
              totalBookings,
            )
          }
          description="Bookings across the portfolio"
          icon={
            <CalendarCheck
              size={18}
              aria-hidden="true"
            />
          }
        />

        <MetricCard
          label="Portfolio ADR"
          value={
            formatCurrency(
              portfolioAdr,
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
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <h2 className="font-semibold text-slate-950">
            Property pricing comparison
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Compare current base prices with realized booking value, then open a property for its explainable recommendation.
          </p>
        </div>


        <div className="divide-y divide-slate-200 xl:hidden">
          {comparisonRows.map(
            (property) => {
              const gap =
                getPriceGap(
                  property,
                )

              return (
                <article
                  key={property.property_id}
                  className="p-4 sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {property.name}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {property.city}
                        {' · '}
                        {property.property_type}
                      </p>
                    </div>

                    <Badge
                      variant={
                        getGapVariant(
                          gap,
                        )
                      }
                    >
                      {formatGap(gap)}
                    </Badge>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Base price
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 [font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property.base_price,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        ADR
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 [font-variant-numeric:tabular-nums]">
                        {property.total_bookings > 0
                          ? formatCurrency(
                              property.adr,
                            )
                          : '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Bookings
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 [font-variant-numeric:tabular-nums]">
                        {formatNumber(
                          property.total_bookings,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Revenue
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 [font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property.total_revenue,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4 w-full sm:w-auto"
                    onClick={() => {
                      onReviewProperty(
                        property.property_id,
                      )
                    }}
                  >
                    Review property
                  </Button>
                </article>
              )
            },
          )}
        </div>


        <div className="hidden overflow-x-auto xl:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Property
                </TableHead>
                <TableHead>
                  Base price
                </TableHead>
                <TableHead>
                  ADR
                </TableHead>
                <TableHead>
                  ADR vs base
                </TableHead>
                <TableHead>
                  Bookings
                </TableHead>
                <TableHead>
                  Revenue
                </TableHead>
                <TableHead className="w-24">
                  <span className="sr-only">
                    Review
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {comparisonRows.map(
                (property) => {
                  const gap =
                    getPriceGap(
                      property,
                    )

                  return (
                    <TableRow
                      key={property.property_id}
                    >
                      <TableCell>
                        <div className="min-w-52">
                          <p className="font-medium text-slate-950">
                            {property.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {property.city}
                            {' · '}
                            {property.property_type}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property.base_price,
                        )}
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {property.total_bookings > 0
                          ? formatCurrency(
                              property.adr,
                            )
                          : '—'}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            getGapVariant(
                              gap,
                            )
                          }
                        >
                          {formatGap(gap)}
                        </Badge>
                      </TableCell>

                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatNumber(
                          property.total_bookings,
                        )}
                      </TableCell>

                      <TableCell className="font-medium text-slate-950 [font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          property.total_revenue,
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            onReviewProperty(
                              property.property_id,
                            )
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                },
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
