import {
  ShieldCheck,
  Users,
} from 'lucide-react'

import type {
  WorkspaceMember,
  WorkspaceRole,
} from '../../../api/team'

import {
  buildApiUrl,
} from '../../../api/client'

import {
  Avatar,
  Badge,
  Button,
  Card,
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
  countActiveAdmins,
  formatTeamDate,
  formatTeamRole,
  getMemberDisplayName,
} from '../utils/teamFormat'

import {
  MemberActions,
} from './MemberActions'


type MembersPanelProps = {
  readOnly?: boolean

  members:
    WorkspaceMember[]

  currentUserId:
    number |
    null

  isLoading:
    boolean

  isError:
    boolean

  errorMessage:
    string |
    null

  changingRoleId:
    number |
    null

  deactivatingId:
    number |
    null

  onRoleChange:
    (
      userId: number,
      role: WorkspaceRole,
    ) => void

  onDeactivate:
    (userId: number) => void

  onRetry:
    () => void
}


export function MembersPanel({
  readOnly = false,
  members,
  currentUserId,
  isLoading,
  isError,
  errorMessage,
  changingRoleId,
  deactivatingId,
  onRoleChange,
  onDeactivate,
  onRetry,
}: MembersPanelProps) {
  const activeAdminCount =
    countActiveAdmins(
      members,
    )


  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:items-center sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Users
              size={18}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-950">
              Workspace members
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Manage roles and workspace
              access.
            </p>
          </div>
        </div>

        <Badge className="shrink-0">
          {members.length}{' '}
          {members.length === 1
            ? 'member'
            : 'members'}
        </Badge>
      </div>


      {isLoading ? (
        <div className="space-y-3 p-4 sm:p-6">
          {Array.from({
            length: 4,
          }).map(
            (
              _,
              index,
            ) => (
              <Skeleton
                key={index}
                className="h-24 rounded-xl md:h-16"
              />
            ),
          )}
        </div>
      ) : isError ? (
        <div className="p-4 sm:p-6">
          <ErrorState
            title="Unable to load team members"
            description={
              errorMessage ??
              "Averlen couldn't load workspace members."
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
      ) : members.length ===
        0 ? (
        <EmptyState
          title="No workspace members"
          description="Members who join this workspace will appear here."
        />
      ) : (
        <>
          <div className="divide-y divide-slate-200 md:hidden">
            {members.map(
              (
                member,
              ) => {
                const name =
                  getMemberDisplayName(
                    member,
                  )

                const isCurrentUser =
                  currentUserId ===
                  member.id

                const isLastAdmin =
                  member
                    .is_active &&
                  member.role ===
                    'ORG_ADMIN' &&
                  activeAdminCount <=
                    1

                const avatarUrl =
                  member.avatar_url
                    ? buildApiUrl(
                        member
                          .avatar_url,
                      )
                    : null

                return (
                  <div
                    key={
                      member.id
                    }
                    className={
                      member.is_active
                        ? 'px-4 py-4'
                        : 'bg-slate-50/70 px-4 py-4'
                    }
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar
                        name={
                          name
                        }
                        src={
                          avatarUrl
                        }
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                            {name}
                          </p>

                          {isCurrentUser && (
                            <Badge variant="brand">
                              You
                            </Badge>
                          )}

                          {isLastAdmin && (
                            <span
                              title="This is the last active organization admin."
                              className="text-amber-600"
                            >
                              <ShieldCheck
                                size={15}
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </div>

                        <p className="mt-1 break-all text-xs leading-5 text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          Role
                        </dt>

                        <dd className="mt-1 text-sm text-slate-700">
                          {formatTeamRole(
                            member.role,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          Status
                        </dt>

                        <dd className="mt-1">
                          <Badge
                            variant={
                              member
                                .is_active
                                ? 'success'
                                : undefined
                            }
                          >
                            {member
                              .is_active
                              ? 'Active'
                              : 'Inactive'}
                          </Badge>
                        </dd>
                      </div>

                      <div className="col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          Joined
                        </dt>

                        <dd className="mt-1 text-sm text-slate-500">
                          {formatTeamDate(
                            member
                              .created_at,
                          )}
                        </dd>
                      </div>
                    </dl>

                    {!readOnly && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <MemberActions
                          member={
                            member
                          }
                          activeAdminCount={
                            activeAdminCount
                          }
                          isChangingRole={
                            changingRoleId ===
                            member.id
                          }
                          isDeactivating={
                            deactivatingId ===
                            member.id
                          }
                          onRoleChange={
                            onRoleChange
                          }
                          onDeactivate={
                            onDeactivate
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              },
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%]">
                    Member
                  </TableHead>

                  <TableHead className="w-[24%]">
                    {readOnly
                      ? 'Role'
                      : 'Role & actions'}
                  </TableHead>

                  <TableHead className="w-[16%]">
                    Status
                  </TableHead>

                  <TableHead className="w-[22%]">
                    Joined
                  </TableHead>
                </TableRow>
              </TableHeader>


              <TableBody>
                {members.map(
                  (
                    member,
                  ) => {
                    const name =
                      getMemberDisplayName(
                        member,
                      )

                    const isCurrentUser =
                      currentUserId ===
                      member.id

                    const isLastAdmin =
                      member
                        .is_active &&
                      member.role ===
                        'ORG_ADMIN' &&
                      activeAdminCount <=
                        1

                    const avatarUrl =
                      member.avatar_url
                        ? buildApiUrl(
                            member
                              .avatar_url,
                          )
                        : null


                    return (
                      <TableRow
                        key={
                          member.id
                        }
                        className={
                          !member
                            .is_active
                            ? 'bg-slate-50/60'
                            : undefined
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={
                                name
                              }
                              src={
                                avatarUrl
                              }
                              size="sm"
                            />

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="max-w-60 truncate text-sm font-semibold text-slate-900">
                                  {name}
                                </p>

                                {isCurrentUser && (
                                  <Badge variant="brand">
                                    You
                                  </Badge>
                                )}

                                {isLastAdmin && (
                                  <span
                                    title="This is the last active organization admin."
                                    className="text-amber-600"
                                  >
                                    <ShieldCheck
                                      size={15}
                                      aria-hidden="true"
                                    />
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 max-w-72 truncate text-xs text-slate-500">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>


                        <TableCell>
                          {readOnly ? (
                            <Badge>
                              {formatTeamRole(
                                member.role,
                              )}
                            </Badge>
                          ) : (
                            <MemberActions
                              member={
                                member
                              }
                              activeAdminCount={
                                activeAdminCount
                              }
                              isChangingRole={
                                changingRoleId ===
                                member.id
                              }
                              isDeactivating={
                                deactivatingId ===
                                member.id
                              }
                              onRoleChange={
                                onRoleChange
                              }
                              onDeactivate={
                                onDeactivate
                              }
                            />
                          )}
                        </TableCell>


                        <TableCell>
                          <Badge
                            variant={
                              member
                                .is_active
                                ? 'success'
                                : undefined
                            }
                          >
                            {member
                              .is_active
                              ? 'Active'
                              : 'Inactive'}
                          </Badge>
                        </TableCell>


                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {formatTeamDate(
                              member
                                .created_at,
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  },
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </Card>
  )
}
