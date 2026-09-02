import {
  ArrowRight,
} from 'lucide-react'

import {
  getAnalyticsPerformance,
} from '../../../api/analytics'

import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  formatCurrency,
  formatNumber,
} from '../../../lib/format'


type PropertyPerformance =
  Awaited<
    ReturnType<
      typeof getAnalyticsPerformance
    >
  >['property_performance'][number]


type DashboardPropertyPerformanceProps = {
  properties:
    PropertyPerformance[]

  topPropertyId:
    number |
    null

  onOpenProperty:
    (propertyId: number) => void
}


function isTopProperty(
  propertyId: number,
  topPropertyId:
    number |
    null,
  index: number,
) {
  return (
    propertyId ===
      topPropertyId ||
    (
      topPropertyId ===
        null &&
      index === 0
    )
  )
}


export function DashboardPropertyPerformance({
  properties,
  topPropertyId,
  onOpenProperty,
}: DashboardPropertyPerformanceProps) {
  const rows =
    [
      ...properties,
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
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5 lg:px-6">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-950">
            Property performance
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
            Revenue, demand and booking value across your highest-performing properties.
          </p>
        </div>

        <Badge className="w-fit shrink-0">
          Top {formatNumber(
            rows.length,
          )}
        </Badge>
      </div>


      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:hidden">
        {rows.map(
          (
            property,
            index,
          ) => (
            <article
              key={
                property
                  .property_id
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-950">
                      {
                        property
                          .property_name
                      }
                    </h3>

                    {isTopProperty(
                      property
                        .property_id,
                      topPropertyId,
                      index,
                    ) && (
                      <Badge variant="success">
                        Top
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {
                      property.city
                    }
                  </p>
                </div>
              </div>


              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Revenue
                  </dt>

                  <dd className="mt-1 text-sm font-semibold text-slate-950 [font-variant-numeric:tabular-nums]">
                    {formatCurrency(
                      property
                        .total_revenue,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Bookings
                  </dt>

                  <dd className="mt-1 text-sm font-medium text-slate-800 [font-variant-numeric:tabular-nums]">
                    {formatNumber(
                      property
                        .total_bookings,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    ADR
                  </dt>

                  <dd className="mt-1 text-sm font-medium text-slate-800 [font-variant-numeric:tabular-nums]">
                    {formatCurrency(
                      property.adr,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Nights
                  </dt>

                  <dd className="mt-1 text-sm font-medium text-slate-800 [font-variant-numeric:tabular-nums]">
                    {formatNumber(
                      property
                        .total_booked_nights,
                    )}
                  </dd>
                </div>
              </dl>


              <Button
                size="sm"
                variant="secondary"
                className="mt-4 w-full justify-center"
                onClick={() => {
                  onOpenProperty(
                    property
                      .property_id,
                  )
                }}
              >
                View property

                <ArrowRight
                  size={14}
                  aria-hidden="true"
                />
              </Button>
            </article>
          ),
        )}
      </div>


      <div className="hidden overflow-x-auto lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Property
              </TableHead>

              <TableHead>
                Revenue
              </TableHead>

              <TableHead>
                Bookings
              </TableHead>

              <TableHead>
                ADR
              </TableHead>

              <TableHead>
                Booked nights
              </TableHead>

              <TableHead className="w-28">
                <span className="sr-only">
                  Open property
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map(
              (
                property,
                index,
              ) => (
                <TableRow
                  key={
                    property
                      .property_id
                  }
                >
                  <TableCell>
                    <div className="min-w-48">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-950">
                          {
                            property
                              .property_name
                          }
                        </p>

                        {isTopProperty(
                          property
                            .property_id,
                          topPropertyId,
                          index,
                        ) && (
                          <Badge variant="success">
                            Top
                          </Badge>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {
                          property.city
                        }
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-slate-950 [font-variant-numeric:tabular-nums]">
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
                    {formatCurrency(
                      property.adr,
                    )}
                  </TableCell>

                  <TableCell className="[font-variant-numeric:tabular-nums]">
                    {formatNumber(
                      property
                        .total_booked_nights,
                    )}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onOpenProperty(
                          property
                            .property_id,
                        )
                      }}
                    >
                      View

                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
