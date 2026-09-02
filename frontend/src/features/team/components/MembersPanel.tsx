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
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Users
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Workspace members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage roles and workspace
              access.
            </p>
          </div>
        </div>

        <Badge>
          {members.length}{' '}
          {members.length === 1
            ? 'member'
            : 'members'}
        </Badge>
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
      )}
    </Card>
  )
}
