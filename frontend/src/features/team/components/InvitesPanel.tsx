import {
  useMemo,
  useState,
} from 'react'

import {
  Mail,
  XCircle,
} from 'lucide-react'

import type {
  OrganizationInvite,
  WorkspaceMember,
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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  InviteLinkActions,
} from './InviteLinkActions'

import {
  formatInviteStatus,
  formatRelativeTeamDate,
  formatTeamDate,
  formatTeamRole,
  getInviteDisplayStatus,
  getInviteStatusVariant,
  getMemberDisplayName,
} from '../utils/teamFormat'


type InviteFilter =
  | 'all'
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'cancelled'


type InvitesPanelProps = {
  readOnly?: boolean

  invites:
    OrganizationInvite[]

  members:
    WorkspaceMember[]

  isLoading:
    boolean

  isError:
    boolean

  errorMessage:
    string |
    null

  cancellingId:
    number |
    null

  onCancel:
    (
      inviteId: number,
    ) =>
      Promise<void>

  onRetry:
    () => void
}


const FILTERS:
  {
    value:
      InviteFilter

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
      value: 'accepted',
      label: 'Accepted',
    },
    {
      value: 'expired',
      label: 'Expired',
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
    },
  ]


export function InvitesPanel({
  readOnly = false,
  invites,
  members,
  isLoading,
  isError,
  errorMessage,
  cancellingId,
  onCancel,
  onRetry,
}: InvitesPanelProps) {
  const [
    filter,
    setFilter,
  ] =
    useState<InviteFilter>(
      'all',
    )

  const [
    cancellingInvite,
    setCancellingInvite,
  ] =
    useState<
      OrganizationInvite |
      null
    >(null)


  const filteredInvites =
    useMemo(
      () => {
        if (
          filter ===
          'all'
        ) {
          return invites
        }

        return invites.filter(
          (
            invite,
          ) =>
            getInviteDisplayStatus(
              invite,
            ) ===
            filter,
        )
      },
      [
        filter,
        invites,
      ],
    )


  const pendingInviteCount =
    useMemo(
      () =>
        invites.filter(
          (
            invite,
          ) =>
            getInviteDisplayStatus(
              invite,
            ) ===
            'pending',
        ).length,
      [
        invites,
      ],
    )


  const memberById =
    useMemo(
      () =>
        new Map(
          members.map(
            (
              member,
            ) => [
              member.id,
              member,
            ],
          ),
        ),
      [
        members,
      ],
    )


  async function handleConfirmCancel() {
    if (
      !cancellingInvite
    ) {
      return
    }

    try {
      await onCancel(
        cancellingInvite.id,
      )

      setCancellingInvite(
        null,
      )
    } catch {
      return
    }
  }


  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Mail
                  size={18}
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">
                    Invitations
                  </h2>

                  {pendingInviteCount >
                    0 && (
                    <Badge variant="warning">
                      {pendingInviteCount}{' '}
                      pending
                    </Badge>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Track invitations and
                  pending workspace access.
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
              title="Unable to load invitations"
              description={
                errorMessage ??
                "Averlen couldn't load workspace invitations."
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
        ) : filteredInvites
            .length ===
          0 ? (
          <EmptyState
            title={
              filter ===
              'all'
                ? 'No invitations yet'
                : `No ${filter} invitations`
            }
            description={
              filter ===
              'pending'
                ? 'There are currently no invitations waiting to be accepted.'
                : 'Workspace invitations matching this view will appear here.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Invitee
                </TableHead>

                <TableHead>
                  Role
                </TableHead>

                <TableHead>
                  Invited by
                </TableHead>

                <TableHead>
                  Sent
                </TableHead>

                <TableHead>
                  Expires
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead className="text-right">
                  {readOnly
                    ? 'Access'
                    : 'Action'}
                </TableHead>
              </TableRow>
            </TableHeader>


            <TableBody>
              {filteredInvites.map(
                (
                  invite,
                ) => {
                  const status =
                    getInviteDisplayStatus(
                      invite,
                    )

                  const inviter =
                    memberById.get(
                      invite
                        .invited_by_user_id,
                    )


                  return (
                    <TableRow
                      key={
                        invite.id
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="max-w-64 truncate text-sm font-medium text-slate-900">
                            {invite.email}
                          </p>

                          {invite
                            .accepted_at && (
                            <p className="mt-1 text-xs text-slate-400">
                              Accepted{' '}
                              {formatRelativeTeamDate(
                                invite
                                  .accepted_at,
                              )}
                            </p>
                          )}
                        </div>
                      </TableCell>


                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatTeamRole(
                            invite.role,
                          )}
                        </span>
                      </TableCell>


                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {inviter
                            ? getMemberDisplayName(
                                inviter,
                              )
                            : `User #${invite.invited_by_user_id}`}
                        </span>
                      </TableCell>


                      <TableCell>
                        <span
                          title={
                            formatTeamDate(
                              invite
                                .created_at,
                            )
                          }
                          className="text-sm text-slate-500"
                        >
                          {formatRelativeTeamDate(
                            invite
                              .created_at,
                          )}
                        </span>
                      </TableCell>


                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {status ===
                          'pending'
                            ? formatTeamDate(
                                invite
                                  .expires_at,
                              )
                            : '—'}
                        </span>
                      </TableCell>


                      <TableCell>
                        <Badge
                          variant={
                            getInviteStatusVariant(
                              status,
                            )
                          }
                        >
                          {formatInviteStatus(
                            status,
                          )}
                        </Badge>
                      </TableCell>


                      <TableCell className="text-right">
                        {!readOnly &&
                        (
                          status === 'pending' ||
                          status === 'expired'
                        ) ? (
                          <InviteLinkActions
                            invite={
                              invite
                            }
                            canCancel={
                              status ===
                              'pending'
                            }
                            cancelling={
                              cancellingId ===
                              invite.id
                            }
                            onCancel={() => {
                              setCancellingInvite(
                                invite,
                              )
                            }}
                          />
                        ) : (
                          <span className="text-sm text-slate-400">
                            {readOnly && status === 'pending'
                              ? 'Read only'
                              : '—'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                },
              )}
            </TableBody>
          </Table>
        )}
      </Card>


      <Dialog
        open={
          cancellingInvite !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (
            !open &&
            cancellingId ===
              null
          ) {
            setCancellingInvite(
              null,
            )
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Cancel invitation?
            </DialogTitle>

            <DialogDescription>
              The recipient will no
              longer be able to use this
              registration link.
            </DialogDescription>
          </DialogHeader>


          {cancellingInvite && (
            <>
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {
                    cancellingInvite
                      .email
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatTeamRole(
                    cancellingInvite
                      .role,
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Invitation expires{' '}
                  {formatTeamDate(
                    cancellingInvite
                      .expires_at,
                  )}
                </p>
              </div>


              <div className="mt-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
                <p className="text-xs leading-5 text-danger-700">
                  Cancelling this invitation
                  immediately invalidates the
                  registration link.
                </p>
              </div>


              <DialogFooter className="mt-6">
                <Button
                  variant="secondary"
                  disabled={
                    cancellingId ===
                    cancellingInvite
                      .id
                  }
                  onClick={() => {
                    setCancellingInvite(
                      null,
                    )
                  }}
                >
                  Keep invite
                </Button>

                <Button
                  variant="danger"
                  disabled={
                    cancellingId ===
                    cancellingInvite
                      .id
                  }
                  onClick={() => {
                    void handleConfirmCancel()
                  }}
                >
                  <XCircle
                    size={16}
                    aria-hidden="true"
                  />

                  {cancellingId ===
                  cancellingInvite.id
                    ? 'Cancelling...'
                    : 'Cancel invitation'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
