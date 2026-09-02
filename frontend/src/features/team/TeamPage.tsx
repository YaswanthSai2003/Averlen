import {
  useState,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Mail,
  UserPlus,
  UserRoundSearch,
  Users,
} from 'lucide-react'

import {
  approveWorkspaceAccessRequest,
  getWorkspaceAccessRequests,
  rejectWorkspaceAccessRequest,
} from '../../api/accessRequests'

import {
  ApiError,
} from '../../api/client'

import {
  cancelWorkspaceInvite,
  createWorkspaceInvite,
  deactivateWorkspaceMember,
  getWorkspace,
  getWorkspaceInvites,
  getWorkspaceMembers,
  updateWorkspaceMemberRole,
  type WorkspaceRole,
} from '../../api/team'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
} from '../../components/ui'

import {
  toast,
} from '../../lib/toast'

import {
  useAuth,
} from '../auth/auth-context'

import {
  AccessRequestsPanel,
} from './components/AccessRequestsPanel'

import {
  InviteMemberDialog,
} from './components/InviteMemberDialog'

import {
  InvitesPanel,
} from './components/InvitesPanel'

import {
  MembersPanel,
} from './components/MembersPanel'

import {
  TeamSummary,
} from './components/TeamSummary'

import {
  getInviteDisplayStatus,
} from './utils/teamFormat'


type TeamTab =
  | 'members'
  | 'requests'
  | 'invites'


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    ApiError
  ) {
    return error.message
  }

  if (
    error instanceof
    Error
  ) {
    return error.message
  }

  return fallback
}


export function TeamPage() {
  const {
    user,
    demoReadOnly,
  } =
    useAuth()

  const queryClient =
    useQueryClient()

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TeamTab>(
      'members',
    )

  const [
    inviteOpen,
    setInviteOpen,
  ] =
    useState(false)


  const workspaceQuery =
    useQuery({
      queryKey: [
        'team',
        'workspace',
      ],

      queryFn:
        getWorkspace,
    })


  const membersQuery =
    useQuery({
      queryKey: [
        'team',
        'members',
      ],

      queryFn:
        getWorkspaceMembers,
    })


  const accessRequestsQuery =
    useQuery({
      queryKey: [
        'team',
        'access-requests',
      ],

      queryFn:
        getWorkspaceAccessRequests,
    })


  const invitesQuery =
    useQuery({
      queryKey: [
        'team',
        'invites',
      ],

      queryFn:
        getWorkspaceInvites,
    })


  const roleMutation =
    useMutation({
      mutationFn:
        ({
          userId,
          role,
        }: {
          userId:
            number

          role:
            WorkspaceRole
        }) =>
          updateWorkspaceMemberRole(
            userId,
            role,
          ),

      onSuccess:
        async () => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'members',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Member role updated',
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to update member role',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't update the member role.",
                ),
            },
          )
        },
    })


  const deactivateMutation =
    useMutation({
      mutationFn:
        deactivateWorkspaceMember,

      onSuccess:
        async () => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'members',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Member deactivated',
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to deactivate member',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't deactivate the member.",
                ),
            },
          )
        },
    })


  const createInviteMutation =
    useMutation({
      mutationFn:
        createWorkspaceInvite,

      onSuccess:
        async () => {
          setActiveTab(
            'invites',
          )

          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'invites',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Invitation created',
            {
              description:
                'The private registration link is ready to share.',
            },
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to create invitation',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't create the invitation.",
                ),
            },
          )
        },
    })


  const cancelInviteMutation =
    useMutation({
      mutationFn:
        cancelWorkspaceInvite,

      onSuccess:
        async () => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'invites',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Invitation cancelled',
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to cancel invitation',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't cancel the invitation.",
                ),
            },
          )
        },
    })


  const approveAccessMutation =
    useMutation({
      mutationFn:
        ({
          requestId,
          role,
        }: {
          requestId:
            number

          role:
            WorkspaceRole
        }) =>
          approveWorkspaceAccessRequest(
            requestId,
            role,
          ),

      onSuccess:
        async () => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'access-requests',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'invites',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Access request approved',
            {
              description:
                'An invitation link has been created for the requester.',
            },
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to approve access',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't approve this access request.",
                ),
            },
          )
        },
    })


  const rejectAccessMutation =
    useMutation({
      mutationFn:
        rejectWorkspaceAccessRequest,

      onSuccess:
        async () => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'team',
                  'access-requests',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Access request rejected',
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to reject access',
            {
              description:
                getErrorMessage(
                  error,
                  "Averlen couldn't reject this access request.",
                ),
            },
          )
        },
    })


  const workspace =
    workspaceQuery.data

  const members =
    membersQuery.data
      ?.members ??
    []

  const accessRequests =
    accessRequestsQuery.data ??
    []

  const invites =
    invitesQuery.data ??
    []


  const pendingRequestCount =
    accessRequests.filter(
      (
        request,
      ) =>
        request.status ===
        'pending',
    ).length

  const pendingInviteCount =
    invites.filter(
      (
        invite,
      ) =>
        getInviteDisplayStatus(
          invite,
        ) ===
        'pending',
    ).length


  const initialLoading =
    workspaceQuery.isLoading ||
    membersQuery.isLoading ||
    accessRequestsQuery.isLoading ||
    invitesQuery.isLoading

  const initialError =
    workspaceQuery.isError ||
    membersQuery.isError ||
    accessRequestsQuery.isError ||
    invitesQuery.isError

  const initialErrorMessage =
    workspaceQuery.isError
      ? getErrorMessage(
          workspaceQuery.error,
          "Averlen couldn't load the workspace.",
        )
      : membersQuery.isError
        ? getErrorMessage(
            membersQuery.error,
            "Averlen couldn't load workspace members.",
          )
        : accessRequestsQuery.isError
          ? getErrorMessage(
              accessRequestsQuery.error,
              "Averlen couldn't load workspace access requests.",
            )
          : invitesQuery.isError
            ? getErrorMessage(
                invitesQuery.error,
                "Averlen couldn't load workspace invitations.",
              )
            : null

  const membersErrorMessage =
    membersQuery.error
      ? getErrorMessage(
          membersQuery.error,
          "Averlen couldn't load workspace members.",
        )
      : null

  const accessRequestsErrorMessage =
    accessRequestsQuery.error
      ? getErrorMessage(
          accessRequestsQuery.error,
          "Averlen couldn't load workspace access requests.",
        )
      : null

  const invitesErrorMessage =
    invitesQuery.error
      ? getErrorMessage(
          invitesQuery.error,
          "Averlen couldn't load workspace invitations.",
        )
      : null


  function retryAll() {
    void Promise.all([
      workspaceQuery.refetch(),
      membersQuery.refetch(),
      accessRequestsQuery.refetch(),
      invitesQuery.refetch(),
    ])
  }


  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        description={
          demoReadOnly
            ? 'Review the seeded workspace members, access requests and invitations.'
            : 'Manage workspace members, access requests, roles and invitations.'
        }
        actions={
          demoReadOnly ? (
            <Badge variant="warning">
              Read only
            </Badge>
          ) : (
            <Button
              onClick={() => {
                setInviteOpen(
                  true,
                )
              }}
            >
              <UserPlus
                size={16}
                aria-hidden="true"
              />

              Invite member
            </Button>
          )
        }
      />


      {initialError ? (
        <Card className="mt-8 p-6">
          <ErrorState
            title="Unable to load Team"
            description={
              initialErrorMessage ??
              "Averlen couldn't load the team workspace."
            }
            action={
              <Button
                variant="secondary"
                onClick={
                  retryAll
                }
              >
                Try again
              </Button>
            }
          />
        </Card>
      ) : initialLoading ||
        !workspace ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (
                _,
                index,
              ) => (
                <Skeleton
                  key={index}
                  className="h-28 rounded-xl"
                />
              ),
            )}
          </div>

          <Skeleton className="mt-6 h-[420px] rounded-xl" />
        </>
      ) : (
        <>
          <TeamSummary
            workspace={
              workspace
            }
            members={
              members
            }
            accessRequests={
              accessRequests
            }
            invites={
              invites
            }
            onOpenMembers={() => {
              setActiveTab(
                'members',
              )
            }}
            onOpenRequests={() => {
              setActiveTab(
                'requests',
              )
            }}
            onOpenInvites={() => {
              setActiveTab(
                'invites',
              )
            }}
          />


          <div className="scrollbar-hidden mt-6 flex max-w-full items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab(
                  'members',
                )
              }}
              className={`
                relative
                flex
                items-center
                gap-2
                whitespace-nowrap
                px-4
                py-3
                text-sm
                font-medium
                transition
                ${
                  activeTab ===
                  'members'
                    ? 'text-brand-700'
                    : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              <Users
                size={16}
                aria-hidden="true"
              />

              Members

              <Badge>
                {members.length}
              </Badge>

              {activeTab ===
                'members' && (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-brand-600" />
              )}
            </button>


            <button
              type="button"
              onClick={() => {
                setActiveTab(
                  'requests',
                )
              }}
              className={`
                relative
                flex
                items-center
                gap-2
                whitespace-nowrap
                px-4
                py-3
                text-sm
                font-medium
                transition
                ${
                  activeTab ===
                  'requests'
                    ? 'text-brand-700'
                    : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              <UserRoundSearch
                size={16}
                aria-hidden="true"
              />

              Access requests

              {pendingRequestCount >
                0 && (
                <Badge variant="warning">
                  {pendingRequestCount}
                </Badge>
              )}

              {activeTab ===
                'requests' && (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-brand-600" />
              )}
            </button>


            <button
              type="button"
              onClick={() => {
                setActiveTab(
                  'invites',
                )
              }}
              className={`
                relative
                flex
                items-center
                gap-2
                whitespace-nowrap
                px-4
                py-3
                text-sm
                font-medium
                transition
                ${
                  activeTab ===
                  'invites'
                    ? 'text-brand-700'
                    : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              <Mail
                size={16}
                aria-hidden="true"
              />

              Invitations

              {pendingInviteCount >
                0 && (
                <Badge variant="warning">
                  {pendingInviteCount}
                </Badge>
              )}

              {activeTab ===
                'invites' && (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-brand-600" />
              )}
            </button>
          </div>


          <div className="mt-5">
            {activeTab ===
            'members' ? (
              <MembersPanel
                readOnly={
                  demoReadOnly
                }
                members={
                  members
                }
                currentUserId={
                  user?.id ??
                  null
                }
                isLoading={
                  membersQuery.isLoading
                }
                isError={
                  membersQuery.isError
                }
                errorMessage={
                  membersErrorMessage
                }
                changingRoleId={
                  roleMutation.isPending
                    ? roleMutation.variables
                        ?.userId ??
                      null
                    : null
                }
                deactivatingId={
                  deactivateMutation.isPending
                    ? deactivateMutation.variables ??
                      null
                    : null
                }
                onRoleChange={(
                  userId,
                  role,
                ) => {
                  roleMutation.mutate({
                    userId,
                    role,
                  })
                }}
                onDeactivate={(
                  userId,
                ) => {
                  deactivateMutation.mutate(
                    userId,
                  )
                }}
                onRetry={() => {
                  void membersQuery.refetch()
                }}
              />
            ) : activeTab ===
              'requests' ? (
              <AccessRequestsPanel
                readOnly={
                  demoReadOnly
                }
                requests={
                  accessRequests
                }
                isLoading={
                  accessRequestsQuery.isLoading
                }
                isError={
                  accessRequestsQuery.isError
                }
                errorMessage={
                  accessRequestsErrorMessage
                }
                approvingId={
                  approveAccessMutation.isPending
                    ? approveAccessMutation.variables
                        ?.requestId ??
                      null
                    : null
                }
                rejectingId={
                  rejectAccessMutation.isPending
                    ? rejectAccessMutation.variables ??
                      null
                    : null
                }
                onApprove={async (
                  requestId,
                  role,
                ) =>
                  approveAccessMutation.mutateAsync({
                    requestId,
                    role,
                  })
                }
                onReject={async (
                  requestId,
                ) => {
                  await rejectAccessMutation.mutateAsync(
                    requestId,
                  )
                }}
                onRetry={() => {
                  void accessRequestsQuery.refetch()
                }}
              />
            ) : (
              <InvitesPanel
                readOnly={
                  demoReadOnly
                }
                invites={
                  invites
                }
                members={
                  members
                }
                isLoading={
                  invitesQuery.isLoading
                }
                isError={
                  invitesQuery.isError
                }
                errorMessage={
                  invitesErrorMessage
                }
                cancellingId={
                  cancelInviteMutation.isPending
                    ? cancelInviteMutation.variables ??
                      null
                    : null
                }
                onCancel={async (
                  inviteId,
                ) => {
                  await cancelInviteMutation.mutateAsync(
                    inviteId,
                  )
                }}
                onRetry={() => {
                  void invitesQuery.refetch()
                }}
              />
            )}
          </div>
        </>
      )}


      {!demoReadOnly && (
        <InviteMemberDialog
          open={
            inviteOpen
          }
          onOpenChange={
            setInviteOpen
          }
          onInvite={async (
            email,
            role,
          ) =>
            createInviteMutation.mutateAsync({
              email,
              role,
            })
          }
        />
      )}
    </div>
  )
}
