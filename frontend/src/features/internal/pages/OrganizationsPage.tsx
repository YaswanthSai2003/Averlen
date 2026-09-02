import {
  useState,
} from 'react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  Search,
} from 'lucide-react'

import {
  getInternalOrganizations,
} from '../../../api/internal'

import {
  PageHeader,
} from '../../../components/layout'

import {
  Card,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  InternalPagination,
} from '../components/InternalPagination'

import {
  formatInternalDate,
  formatInternalNumber,
} from '../utils/internalFormat'


const PAGE_SIZE = 25


export function OrganizationsPage() {
  const [
    search,
    setSearch,
  ] = useState('')

  const [
    page,
    setPage,
  ] = useState(1)

  const offset =
    (page - 1) * PAGE_SIZE

  const query =
    useQuery({
      queryKey: [
        'internal',
        'organizations',
        search,
        page,
      ],
      queryFn: () =>
        getInternalOrganizations({
          q: search,
          limit: PAGE_SIZE,
          offset,
        }),
      placeholderData:
        (previousData) => previousData,
      staleTime: 10_000,
    })

  const total =
    query.data?.total ?? 0

  const pageCount =
    Math.max(
      1,
      Math.ceil(total / PAGE_SIZE),
    )

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Internal"
        title="Organizations"
        description="Inspect customer workspaces without exposing platform controls inside the customer application."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-950">
              Customer organizations
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Global workspace inventory.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search organization or domain"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 rounded-xl"
              />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-5 sm:p-6">
            <ErrorState
              title="Unable to load organizations"
              description="Averlen couldn't load the global organization list."
            />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {query.data?.items.map(
                  (organization) => (
                    <TableRow
                      key={organization.id}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {organization.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {organization.email_domain
                              ? `@${organization.email_domain}`
                              : 'No verified workspace domain'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="text-sm text-slate-700">
                          {formatInternalNumber(
                            organization.user_count,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatInternalNumber(
                            organization.active_user_count,
                          )}{' '}
                          active
                        </p>
                      </TableCell>

                      <TableCell>
                        {formatInternalNumber(
                          organization.property_count,
                        )}
                      </TableCell>

                      <TableCell>
                        {formatInternalNumber(
                          organization.booking_count,
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {formatInternalDate(
                            organization.created_at,
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>

            {query.data?.items.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No organizations match this search.
              </div>
            )}

            <InternalPagination
              page={page}
              pageCount={pageCount}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  )
}
