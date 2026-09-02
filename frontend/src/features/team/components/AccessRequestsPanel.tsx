import {
  useMemo,
  useState,
} from 'react'

import {
  Check,
  Copy,
  UserRoundSearch,
  XCircle,
} from 'lucide-react'

import type {
  AccessRequestApprovalResponse,
  WorkspaceAccessRequest,
  WorkspaceAccessRequestStatus,
} from '../../../api/accessRequests'

import type {
  WorkspaceRole,
} from '../../../api/team'

import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  formatRelativeTeamDate,
  formatTeamDate,
  formatTeamRole,
  TEAM_ROLE_OPTIONS,
} from '../utils/teamFormat'


type RequestFilter =
  | 'all'
  | WorkspaceAccessRequestStatus


type AccessRequestsPanelProps = {
  readOnly?: boolean

  requests:
    WorkspaceAccessRequest[]

  isLoading:
    boolean

  isError:
    boolean

  errorMessage:
    string |
    null

  approvingId:
    number |
    null

  rejectingId:
    number |
    null

  onApprove:
    (
      requestId: number,
      role: WorkspaceRole,
    ) =>
      Promise<AccessRequestApprovalResponse>

  onReject:
    (
      requestId: number,
    ) =>
      Promise<void>

  onRetry:
    () => void
}


const FILTERS:
  {
    value:
      RequestFilter

    label:
      string
  }[] = [
    {
      value: 'all',
      label: 'All',
    },
    {
      value: 'pending',
      label: 'Pending',
    },
    {
      value: 'approved',
      label: 'Approved',
    },
    {
      value: 'rejected',
      label: 'Rejected',
    },
  ]


function getStatusVariant(
  status:
    WorkspaceAccessRequestStatus,
) {
  switch (
    status
  ) {
    case 'approved':
      return 'success' as const

    case 'pending':
      return 'warning' as const

    default:
      return undefined
  }
}


function formatStatus(
  status:
    WorkspaceAccessRequestStatus,
) {
  return status
    .charAt(0)
    .toUpperCase() +
    status.slice(1)
}


export function AccessRequestsPanel({
  readOnly = false,
  requests,
  isLoading,
  isError,
  errorMessage,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
  onRetry,
}: AccessRequestsPanelProps) {
  const [
    filter,
    setFilter,
  ] =
    useState<RequestFilter>(
      'all',
    )

  const [
    reviewRequest,
    setReviewRequest,
  ] =
    useState<WorkspaceAccessRequest | null>(
      null,
    )

  const [
    role,
    setRole,
  ] =
    useState<WorkspaceRole>(
      'ANALYST',
    )

  const [
    approvalResult,
    setApprovalResult,
  ] =
    useState<AccessRequestApprovalResponse | null>(
      null,
    )

  const [
    copied,
    setCopied,
  ] =
    useState(false)

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    )


  const filteredRequests =
    useMemo(
      () => {
        if (
          filter ===
          'all'
        ) {
          return requests
        }

        return requests.filter(
          (
            request,
          ) =>
            request.status ===
            filter,
        )
      },
      [
        filter,
        requests,
      ],
    )


  const pendingCount =
    useMemo(
      () =>
        requests.filter(
          (
            request,
          ) =>
            request.status ===
            'pending',
        ).length,
      [
        requests,
      ],
    )


  const fullInviteUrl =
    approvalResult
      ? new URL(
          approvalResult.invite_url,
          window.location.origin,
        ).toString()
      : ''


  function openReview(
    request:
      WorkspaceAccessRequest,
  ) {
    if (readOnly) {
      return
    }

    setReviewRequest(
      request,
    )

    setRole(
      'ANALYST',
    )

    setApprovalResult(
      null,
    )

    setLocalError(
      null,
    )

    setCopied(
      false,
    )
  }


  function closeDialog() {
    if (
      approvingId !==
        null ||
      rejectingId !==
        null
    ) {
      return
    }

    setReviewRequest(
      null,
    )

    setApprovalResult(
      null,
    )

    setLocalError(
      null,
    )

    setCopied(
      false,
    )
  }


  async function handleApprove() {
    if (!reviewRequest) {
      return
    }

    setLocalError(
      null,
    )

    try {
      const result =
        await onApprove(
          reviewRequest.id,
          role,
        )

      setApprovalResult(
        result,
      )

      setReviewRequest(
        null,
      )
    } catch {
      return
    }
  }


  async function handleReject() {
    if (!reviewRequest) {
      return
    }

    setLocalError(
      null,
    )

    try {
      await onReject(
        reviewRequest.id,
      )

      setReviewRequest(
        null,
      )
    } catch {
      return
    }
  }


  async function handleCopy() {
    if (!fullInviteUrl) {
      return
    }

    try {
      await navigator
        .clipboard
        .writeText(
          fullInviteUrl,
        )

      setCopied(
        true,
      )

      window.setTimeout(
        () => {
          setCopied(
            false,
          )
        },
        2000,
      )
    } catch {
      setLocalError(
        'Unable to copy automatically. Select the link and copy it manually.',
      )
    }
  }


  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <UserRoundSearch
                  size={18}
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">
                    Access requests
                  </h2>

                  {pendingCount >
                    0 && (
                    <Badge variant="warning">
                      {pendingCount}{' '}
                      pending
                    </Badge>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Review people who requested access using your company email domain.
                </p>
              </div>
            </div>

            <div className="scrollbar-hidden flex max-w-full gap-1 overflow-x-auto overflow-y-hidden rounded-lg bg-slate-100 p-1">
              {FILTERS.map(
                (
                  item,
                ) => (
                  <button
                    key={
                      item.value
                    }
                    type="button"
                    onClick={() => {
                      setFilter(
                        item.value,
                      )
                    }}
                    className={`
                      whitespace-nowrap
                      rounded-md
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      transition
                      ${
                        filter ===
                        item.value
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>


        {isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({
              length: 4,
            }).map(
              (
                _,
                index,
              ) => (
                <Skeleton
                  key={index}
                  className="h-16 rounded-xl"
                />
              ),
            )}
          </div>
        ) : isError ? (
          <div className="p-5 sm:p-6">
            <ErrorState
              title="Unable to load access requests"
              description={
                errorMessage ??
                "Averlen couldn't load workspace access requests."
              }
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={
                    onRetry
                  }
                >
                  Try again
                </Button>
              }
            />
          </div>
        ) : filteredRequests
            .length ===
          0 ? (
          <EmptyState
            title={
              filter ===
              'all'
                ? 'No access requests yet'
                : `No ${filter} access requests`
            }
            description={
              filter ===
              'pending'
                ? 'There are currently no requests waiting for review.'
                : 'Workspace access requests matching this view will appear here.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Requester
                </TableHead>

                <TableHead>
                  Requested
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Access
                </TableHead>

                <TableHead className="text-right">
                  {readOnly
                    ? 'Access'
                    : 'Action'}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRequests.map(
                (
                  request,
                ) => (
                  <TableRow
                    key={
                      request.id
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="max-w-64 truncate text-sm font-semibold text-slate-900">
                          {request.full_name ||
                            request.email}
                        </p>

                        <p className="mt-1 max-w-72 truncate text-xs text-slate-500">
                          {request.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        title={
                          formatTeamDate(
                            request.created_at,
                          )
                        }
                        className="text-sm text-slate-500"
                      >
                        {formatRelativeTeamDate(
                          request.created_at,
                        )}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          getStatusVariant(
                            request.status,
                          )
                        }
                      >
                        {formatStatus(
                          request.status,
                        )}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {request.approved_role
                          ? formatTeamRole(
                              request.approved_role,
                            )
                          : '—'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {request.status ===
                      'pending' &&
                      !readOnly ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            openReview(
                              request,
                            )
                          }}
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {request.status === 'pending' && readOnly
                            ? 'Read only'
                            : '—'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )}
      </Card>


      <Dialog
        open={
          reviewRequest !==
            null ||
          approvalResult !==
            null
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            closeDialog()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {approvalResult ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Access approved
                </DialogTitle>

                <DialogDescription>
                  Share this private registration link with the approved person.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Check
                    size={21}
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-950">
                  {approvalResult.request.email}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Approved as{' '}
                  {approvalResult.request.approved_role
                    ? formatTeamRole(
                        approvalResult.request.approved_role,
                      )
                    : 'workspace member'}
                </p>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                    Registration link
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      readOnly
                      value={
                        fullInviteUrl
                      }
                      onFocus={(
                        event,
                      ) => {
                        event.currentTarget.select()
                      }}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
                    />

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        void handleCopy()
                      }}
                    >
                      {copied ? (
                        <>
                          <Check
                            size={14}
                            aria-hidden="true"
                          />

                          Copied
                        </>
                      ) : (
                        <>
                          <Copy
                            size={14}
                            aria-hidden="true"
                          />

                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {localError && (
                  <p className="mt-3 text-xs text-danger-600">
                    {localError}
                  </p>
                )}
              </div>

              <DialogFooter className="mt-7">
                <Button
                  onClick={
                    closeDialog
                  }
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : reviewRequest ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Review access request
                </DialogTitle>

                <DialogDescription>
                  Approve the requester with a Averlen role, or reject the request.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-950">
                  {reviewRequest.full_name ||
                    reviewRequest.email}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {reviewRequest.email}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Requested{' '}
                  {formatRelativeTeamDate(
                    reviewRequest.created_at,
                  )}
                </p>
              </div>

              <div className="mt-5">
                <Select
                  label="Workspace role"
                  value={
                    role
                  }
                  disabled={
                    approvingId ===
                      reviewRequest.id ||
                    rejectingId ===
                      reviewRequest.id
                  }
                  onChange={(
                    event,
                  ) => {
                    setRole(
                      event.target.value as WorkspaceRole,
                    )
                  }}
                >
                  {TEAM_ROLE_OPTIONS.map(
                    (
                      option,
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </Select>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {TEAM_ROLE_OPTIONS.find(
                    (
                      option,
                    ) =>
                      option.value ===
                      role,
                  )?.description}
                </p>
              </div>

              {localError && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
                >
                  {localError}
                </div>
              )}

              <DialogFooter className="mt-7">
                <Button
                  variant="danger"
                  disabled={
                    approvingId ===
                      reviewRequest.id ||
                    rejectingId ===
                      reviewRequest.id
                  }
                  onClick={() => {
                    void handleReject()
                  }}
                >
                  <XCircle
                    size={16}
                    aria-hidden="true"
                  />

                  {rejectingId ===
                  reviewRequest.id
                    ? 'Rejecting...'
                    : 'Reject'}
                </Button>

                <Button
                  disabled={
                    approvingId ===
                      reviewRequest.id ||
                    rejectingId ===
                      reviewRequest.id
                  }
                  onClick={() => {
                    void handleApprove()
                  }}
                >
                  {approvingId ===
                  reviewRequest.id
                    ? 'Approving...'
                    : 'Approve access'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
