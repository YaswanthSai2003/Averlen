import {
  useState,
} from 'react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  getAuditErrorsPage,
} from '../../../api/audit'

import {
  PageHeader,
} from '../../../components/layout'

import {
  Badge,
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
} from '../utils/internalFormat'


const PAGE_SIZE = 50


export function ErrorsPage() {
  const [page, setPage] =
    useState(1)

  const offset =
    (page - 1) * PAGE_SIZE

  const query =
    useQuery({
      queryKey: [
        'internal',
        'errors',
        page,
      ],
      queryFn: () =>
        getAuditErrorsPage({
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
        title="Errors"
        description="Review audited requests that returned HTTP 4xx or 5xx responses across the platform."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="font-semibold text-slate-950">
            Error activity
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Authentication failures, permission denials, validation errors and server failures.
          </p>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({
              length: 8,
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
              title="Unable to load errors"
              description="Averlen couldn't load audited error activity."
            />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {query.data?.items.map(
                  (item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {formatInternalDate(
                            item.created_at,
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="warning">
                          {item.status_code}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="max-w-60 truncate text-sm text-slate-600">
                          {item.email ?? 'Unauthenticated'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex max-w-xl items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-600">
                            {item.method}
                          </span>
                          <span className="truncate text-sm text-slate-800">
                            {item.path}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {item.duration_ms.toFixed(0)} ms
                        </span>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>

            {query.data?.items.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No audited errors found.
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
