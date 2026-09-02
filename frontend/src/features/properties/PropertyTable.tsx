import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  useNavigate,
} from 'react-router'

import type {
  PropertySortField,
  PropertySummary,
  SortOrder,
} from '../../api/properties'
import {
  buildApiUrl,
} from '../../api/client'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui'
import {
  formatCurrency,
  formatNumber,
} from '../../lib/format'


type SortableHeaderProps = {
  label: string
  field: PropertySortField
  activeField: PropertySortField
  order: SortOrder
  onSort: (
    field: PropertySortField,
  ) => void
}


function SortableHeader({
  label,
  field,
  activeField,
  order,
  onSort,
}: SortableHeaderProps) {
  const active =
    field === activeField

  const ariaSort =
    active
      ? order === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none'

  return (
    <TableHead
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={() => {
          onSort(field)
        }}
        className="group inline-flex items-center gap-1.5 rounded-md font-medium transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <span>
          {label}
        </span>

        {active ? (
          order === 'asc' ? (
            <ArrowUp
              size={14}
              aria-hidden="true"
              className="text-brand-600"
            />
          ) : (
            <ArrowDown
              size={14}
              aria-hidden="true"
              className="text-brand-600"
            />
          )
        ) : (
          <ArrowUpDown
            size={14}
            aria-hidden="true"
            className="text-slate-400 transition-colors group-hover:text-slate-600"
          />
        )}
      </button>
    </TableHead>
  )
}


type PropertyTableProps = {
  properties: PropertySummary[]
  canManage: boolean

  page: number
  totalPages: number

  total: number
  firstResult: number
  lastResult: number

  sortBy: PropertySortField
  sortOrder: SortOrder

  onSort: (
    field: PropertySortField,
  ) => void

  onPreviousPage: () => void
  onNextPage: () => void

  onEdit: (
    property: PropertySummary,
  ) => void

  onDelete: (
    property: PropertySummary,
  ) => void
}


export function PropertyTable({
  properties,
  canManage,
  page,
  totalPages,
  total,
  firstResult,
  lastResult,
  sortBy,
  sortOrder,
  onSort,
  onPreviousPage,
  onNextPage,
  onEdit,
  onDelete,
}: PropertyTableProps) {
  const navigate =
    useNavigate()

  function openProperty(
    propertyId: number,
  ) {
    navigate(
      `/app/properties/${propertyId}`,
    )
  }

  return (
    <Card className="mt-4 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Property"
                field="name"
                activeField={
                  sortBy
                }
                order={
                  sortOrder
                }
                onSort={
                  onSort
                }
              />

              <TableHead>
                Type
              </TableHead>

              <SortableHeader
                label="Base price"
                field="base_price"
                activeField={
                  sortBy
                }
                order={
                  sortOrder
                }
                onSort={
                  onSort
                }
              />

              <TableHead>
                Capacity
              </TableHead>

              <SortableHeader
                label="Revenue"
                field="revenue"
                activeField={
                  sortBy
                }
                order={
                  sortOrder
                }
                onSort={
                  onSort
                }
              />

              <SortableHeader
                label="Bookings"
                field="bookings"
                activeField={
                  sortBy
                }
                order={
                  sortOrder
                }
                onSort={
                  onSort
                }
              />

              <SortableHeader
                label="ADR"
                field="adr"
                activeField={
                  sortBy
                }
                order={
                  sortOrder
                }
                onSort={
                  onSort
                }
              />

              <TableHead className="w-16">
                <span className="sr-only">
                  Actions
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {properties.map(
              (property) => {
                const photoUrl =
                  property.photo_url
                    ? buildApiUrl(
                        property.photo_url,
                      )
                    : null

                return (
                  <TableRow
                    key={
                      property.property_id
                    }
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          openProperty(
                            property.property_id,
                          )
                        }}
                        className="group flex min-w-56 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        {photoUrl ? (
                          <img
                            src={
                              photoUrl
                            }
                            alt=""
                            className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Building2
                              size={18}
                              aria-hidden="true"
                            />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950 transition-colors group-hover:text-brand-700">
                            {
                              property.name
                            }
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {
                              property.city
                            }
                          </p>
                        </div>
                      </button>
                    </TableCell>

                    <TableCell>
                      <Badge>
                        {
                          property.property_type
                        }
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {formatCurrency(
                        property.base_price,
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <p className="text-slate-900">
                          {formatNumber(
                            property.bedrooms,
                          )}{' '}
                          {property.bedrooms ===
                          1
                            ? 'bedroom'
                            : 'bedrooms'}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Up to{' '}
                          {formatNumber(
                            property.accommodates,
                          )}{' '}
                          guests
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-slate-950">
                        {formatCurrency(
                          property.total_revenue,
                        )}
                      </span>
                    </TableCell>

                    <TableCell>
                      {formatNumber(
                        property.total_bookings,
                      )}
                    </TableCell>

                    <TableCell>
                      {formatCurrency(
                        property.adr,
                      )}
                    </TableCell>

                    <TableCell>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                          >
                            <button
                              type="button"
                              aria-label={`Actions for ${property.name}`}
                              className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                              <MoreHorizontal
                                size={18}
                                aria-hidden="true"
                              />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-44"
                          >
                            <DropdownMenuItem
                              onSelect={() => {
                                onEdit(
                                  property,
                                )
                              }}
                            >
                              <Pencil
                                size={16}
                                aria-hidden="true"
                              />

                              Edit property
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              destructive
                              onSelect={() => {
                                onDelete(
                                  property,
                                )
                              }}
                            >
                              <Trash2
                                size={16}
                                aria-hidden="true"
                              />

                              Delete property
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              },
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-500">
          Showing{' '}
          {formatNumber(
            firstResult,
          )}
          –
          {formatNumber(
            lastResult,
          )}{' '}
          of{' '}
          {formatNumber(
            total,
          )}
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={
              page <= 1
            }
            onClick={
              onPreviousPage
            }
          >
            Previous
          </Button>

          <span className="min-w-20 text-center text-sm text-slate-500">
            Page {page} of{' '}
            {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={
              page >=
              totalPages
            }
            onClick={
              onNextPage
            }
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}