import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  buildApiUrl,
} from '../../../api/client'
import type {
  PropertySortField,
  PropertySummary,
  SortOrder,
} from '../../../api/properties'
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
} from '../../../components/ui'
import {
  formatCurrency,
  formatNumber,
} from '../../../lib/format'

import {
  useAuth,
} from '../../auth/auth-context'

import {
  getDemoPropertyPhotoUrl,
} from '../utils/demoPropertyPhotos'


type SortableHeaderProps = {
  label: string
  field: PropertySortField
  activeField: PropertySortField
  order: SortOrder
  onSort: (field: PropertySortField) => void
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
    <TableHead aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => {
          onSort(field)
        }}
        className="group inline-flex items-center gap-1.5 rounded-md font-medium transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <span>{label}</span>

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
  onSort: (field: PropertySortField) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onEdit: (property: PropertySummary) => void
  onArchive: (property: PropertySummary) => void
  onRestore: (property: PropertySummary) => void
  onManageRemoval: (property: PropertySummary) => void
}


type PropertyActionsProps = {
  property: PropertySummary
  onEdit: (property: PropertySummary) => void
  onArchive: (property: PropertySummary) => void
  onRestore: (property: PropertySummary) => void
  onManageRemoval: (property: PropertySummary) => void
}


function PropertyActions({
  property,
  onEdit,
  onArchive,
  onRestore,
  onManageRemoval,
}: PropertyActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${property.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <MoreHorizontal
            size={18}
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48"
      >
        {!property.is_archived && (
          <DropdownMenuItem
            onSelect={() => {
              onEdit(property)
            }}
          >
            <Pencil
              size={16}
              aria-hidden="true"
            />
            Edit property
          </DropdownMenuItem>
        )}

        {property.is_archived ? (
          <DropdownMenuItem
            onSelect={() => {
              onRestore(property)
            }}
          >
            <RotateCcw
              size={16}
              aria-hidden="true"
            />
            Restore property
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              onArchive(property)
            }}
          >
            <Archive
              size={16}
              aria-hidden="true"
            />
            Archive property
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          destructive
          onSelect={() => {
            onManageRemoval(property)
          }}
        >
          <Trash2
            size={16}
            aria-hidden="true"
          />
          Removal options
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
  onArchive,
  onRestore,
  onManageRemoval,
}: PropertyTableProps) {
  const {
    demoReadOnly,
  } = useAuth()

  const navigate =
    useNavigate()


  function getPhotoUrl(
    property: PropertySummary,
  ) {
    if (property.photo_url) {
      return buildApiUrl(
        property.photo_url,
      )
    }

    if (demoReadOnly) {
      return getDemoPropertyPhotoUrl(
        property.property_code,
      )
    }

    return null
  }


  function openProperty(
    propertyId: number,
  ) {
    navigate(
      `/app/properties/${propertyId}`,
    )
  }


  return (
    <Card className="mt-4 overflow-hidden">
      <div className="divide-y divide-slate-200 xl:hidden">
        {properties.map((property) => {
          const photoUrl =
            getPhotoUrl(property)

          return (
            <article
              key={property.property_id}
              className="p-4 sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    openProperty(
                      property.property_id,
                    )
                  }}
                  className="group flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 sm:size-16"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 sm:size-16">
                      <Building2
                        size={20}
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="min-w-0 truncate font-semibold text-slate-950 transition-colors group-hover:text-brand-700">
                        {property.name}
                      </p>

                      {property.is_archived && (
                        <Badge variant="neutral">
                          Archived
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {property.city}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold tracking-wide text-brand-700">
                        {property.property_code}
                      </span>

                      <span className="text-slate-300">
                        ·
                      </span>

                      <span className="text-xs text-slate-500">
                        {property.property_type}
                      </span>
                    </div>
                  </div>
                </button>

                {canManage && (
                  <PropertyActions
                    property={property}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onRestore={onRestore}
                    onManageRemoval={
                      onManageRemoval
                    }
                  />
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Base price
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {formatCurrency(
                      property.base_price,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Revenue
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {formatCurrency(
                      property.total_revenue,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Bookings
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {formatNumber(
                      property.total_bookings,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    ADR
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {formatCurrency(
                      property.adr,
                    )}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-slate-500">
                {formatNumber(property.bedrooms)}{' '}
                {property.bedrooms === 1
                  ? 'bedroom'
                  : 'bedrooms'}
                {' · '}
                Up to {formatNumber(property.accommodates)} guests
              </p>
            </article>
          )
        })}
      </div>


      <div className="hidden overflow-x-auto xl:block">
        <Table className="min-w-[1120px] table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[11%]" />
            <col className="w-[5%]" />
          </colgroup>

          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Property"
                field="name"
                activeField={sortBy}
                order={sortOrder}
                onSort={onSort}
              />

              <SortableHeader
                label="Property ID"
                field="property_code"
                activeField={sortBy}
                order={sortOrder}
                onSort={onSort}
              />

              <TableHead>Type</TableHead>

              <SortableHeader
                label="Base price"
                field="base_price"
                activeField={sortBy}
                order={sortOrder}
                onSort={onSort}
              />

              <TableHead>Capacity</TableHead>

              <SortableHeader
                label="Revenue"
                field="revenue"
                activeField={sortBy}
                order={sortOrder}
                onSort={onSort}
              />

              <SortableHeader
                label="Bookings"
                field="bookings"
                activeField={sortBy}
                order={sortOrder}
                onSort={onSort}
              />

              <SortableHeader
                label="ADR"
                field="adr"
                activeField={sortBy}
                order={sortOrder}
                onSort={onSort}
              />

              <TableHead className="w-16">
                <span className="sr-only">
                  Actions
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {properties.map((property) => {
              const photoUrl =
                getPhotoUrl(property)

              return (
                <TableRow
                  key={property.property_id}
                  className="border-slate-200 focus-within:border-slate-200"
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
                          src={photoUrl}
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
                          {property.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {property.city}
                        </p>
                        {property.is_archived && (
                          <div className="mt-1">
                            <Badge variant="neutral">
                              Archived
                            </Badge>
                          </div>
                        )}
                      </div>
                    </button>
                  </TableCell>

                  <TableCell>
                    <span className="whitespace-nowrap font-mono text-xs font-semibold tracking-wide text-brand-700">
                      {property.property_code}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge>
                      {property.property_type}
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
                        {formatNumber(property.bedrooms)}{' '}
                        {property.bedrooms === 1
                          ? 'bedroom'
                          : 'bedrooms'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Up to {formatNumber(property.accommodates)} guests
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
                      <PropertyActions
                        property={property}
                        onEdit={onEdit}
                        onArchive={onArchive}
                        onRestore={onRestore}
                        onManageRemoval={
                          onManageRemoval
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>


      <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between xl:px-6">
        <p className="text-sm text-slate-500">
          Showing {formatNumber(firstResult)}–{formatNumber(lastResult)} of{' '}
          {formatNumber(total)}
        </p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            disabled={page <= 1}
            onClick={onPreviousPage}
          >
            Previous
          </Button>

          <span className="min-w-20 whitespace-nowrap text-center text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            disabled={page >= totalPages}
            onClick={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
