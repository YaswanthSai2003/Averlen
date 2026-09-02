import {
  Fragment,
  useState,
} from 'react'

import {
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react'

import type {
  AuditLogItem,
} from '../../../api/audit'

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  AuditLogDetails,
} from './AuditLogDetails'

import {
  formatAuditAction,
  formatAuditPath,
  formatAuditRelativeTime,
  formatAuditTimestamp,
  formatDuration,
  formatNumber,
  getDurationClasses,
  getMethodClasses,
  getStatusClasses,
  getUserInitial,
} from '../utils/auditFormat'


type AuditLogTableProps = {
  items:
    AuditLogItem[]

  total:
    number

  page:
    number

  pageCount:
    number

  limit:
    number

  isLoading:
    boolean

  isError:
    boolean

  errorMessage:
    string |
    null

  onPageChange:
    (page: number) => void

  onRetry:
    () => void
}


export function AuditLogTable({
  items,
  total,
  page,
  pageCount,
  limit,
  isLoading,
  isError,
  errorMessage,
  onPageChange,
  onRetry,
}: AuditLogTableProps) {
  const [
    expandedId,
    setExpandedId,
  ] =
    useState<
      number |
      null
    >(null)


  const firstResult =
    total === 0
      ? 0
      : (
          page - 1
        ) *
          limit +
        1


  const lastResult =
    total === 0
      ? 0
      : Math.min(
          (
            page - 1
          ) *
            limit +
            items.length,
          total,
        )


  return (
    <Card className="mt-6 overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <History
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Activity history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              API and workspace activity recorded by Averlen.
            </p>
          </div>
        </div>
      </div>


      {isLoading ? (
        <div className="space-y-3 p-5 sm:p-6">
          {Array.from({
            length: 8,
          }).map(
            (
              _,
              index,
            ) => (
              <Skeleton
                key={
                  index
                }
                className="h-14 rounded-lg"
              />
            ),
          )}
        </div>
      ) : isError ? (
        <div className="p-6">
          <ErrorState
            title="Unable to load audit logs"
            description={
              errorMessage ??
              "Averlen couldn't load audit activity."
            }
            action={
              <Button
                variant="secondary"
                onClick={
                  onRetry
                }
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : items.length ===
        0 ? (
        <EmptyState
          title="No audit activity yet"
          description="Workspace and API activity will appear here as Averlen is used."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">
                    Timestamp
                  </TableHead>

                  <TableHead className="min-w-52">
                    User
                  </TableHead>

                  <TableHead className="min-w-44">
                    Action
                  </TableHead>

                  <TableHead className="min-w-64">
                    Request
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead className="min-w-28">
                    Duration
                  </TableHead>

                  <TableHead className="min-w-36">
                    IP
                  </TableHead>

                  <TableHead className="w-16 text-right">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>


              <TableBody>
                {items.map(
                  (
                    item,
                  ) => {
                    const expanded =
                      expandedId ===
                      item.id


                    return (
                      <Fragment
                        key={
                          item.id
                        }
                      >
                        <TableRow>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {formatAuditRelativeTime(
                                  item.created_at,
                                )}
                              </p>

                              <p
                                title={
                                  formatAuditTimestamp(
                                    item.created_at,
                                  )
                                }
                                className="mt-1 whitespace-nowrap font-mono text-[11px] text-slate-400"
                              >
                                {formatAuditTimestamp(
                                  item.created_at,
                                )}
                              </p>
                            </div>
                          </TableCell>


                          <TableCell>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                {getUserInitial(
                                  item.email,
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  title={
                                    item.email ??
                                    undefined
                                  }
                                  className="max-w-44 truncate text-sm font-medium text-slate-800"
                                >
                                  {item.email ??
                                    'Unauthenticated'}
                                </p>

                                {item.user_id !==
                                  null && (
                                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                    User #{item.user_id}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>


                          <TableCell>
                            <span className="text-sm font-medium text-slate-700">
                              {formatAuditAction(
                                item.action,
                              )}
                            </span>
                          </TableCell>


                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`
                                  inline-flex
                                  shrink-0
                                  items-center
                                  rounded-md
                                  border
                                  px-2
                                  py-1
                                  font-mono
                                  text-[10px]
                                  font-semibold
                                  ${
                                    getMethodClasses(
                                      item.method,
                                    )
                                  }
                                `}
                              >
                                {item.method.toUpperCase()}
                              </span>

                              <span
                                title={
                                  formatAuditPath(
                                    item.path,
                                  )
                                }
                                className="max-w-52 truncate font-mono text-xs text-slate-600"
                              >
                                {formatAuditPath(
                                  item.path,
                                )}
                              </span>
                            </div>
                          </TableCell>


                          <TableCell>
                            <span
                              className={`
                                inline-flex
                                rounded-md
                                px-2
                                py-1
                                font-mono
                                text-xs
                                font-semibold
                                ${
                                  getStatusClasses(
                                    item.status_code,
                                  )
                                }
                              `}
                            >
                              {item.status_code}
                            </span>
                          </TableCell>


                          <TableCell>
                            <span
                              className={`
                                whitespace-nowrap
                                font-mono
                                text-xs
                                font-medium
                                ${
                                  getDurationClasses(
                                    item.duration_ms,
                                  )
                                }
                              `}
                            >
                              {formatDuration(
                                item.duration_ms,
                              )}
                            </span>
                          </TableCell>


                          <TableCell>
                            <span
                              title={
                                item.ip_address ??
                                undefined
                              }
                              className="block max-w-32 truncate font-mono text-xs text-slate-500"
                            >
                              {item.ip_address ??
                                '—'}
                            </span>
                          </TableCell>


                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-expanded={
                                expanded
                              }
                              aria-label={
                                expanded
                                  ? 'Hide audit details'
                                  : 'Show audit details'
                              }
                              onClick={() => {
                                setExpandedId(
                                  (
                                    current,
                                  ) =>
                                    current ===
                                    item.id
                                      ? null
                                      : item.id,
                                )
                              }}
                            >
                              {expanded ? (
                                <ChevronUp
                                  size={16}
                                  aria-hidden="true"
                                />
                              ) : (
                                <ChevronDown
                                  size={16}
                                  aria-hidden="true"
                                />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>


                        {expanded && (
                          <TableRow>
                            <TableCell
                              colSpan={
                                8
                              }
                              className="p-0"
                            >
                              <AuditLogDetails
                                item={
                                  item
                                }
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  },
                )}
              </TableBody>
            </Table>
          </div>


          <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-medium text-slate-700">
                  {formatNumber(
                    firstResult,
                  )}
                </span>
                {' – '}
                <span className="font-medium text-slate-700">
                  {formatNumber(
                    lastResult,
                  )}
                </span>
                {' of '}
                <span className="font-medium text-slate-700">
                  {formatNumber(
                    total,
                  )}
                </span>
                {' events'}
              </p>

              <Pagination
                page={
                  page
                }
                pageCount={
                  pageCount
                }
                onPageChange={
                  onPageChange
                }
              />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}