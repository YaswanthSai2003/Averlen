import {
  useMemo,
  useState,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Globe2,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react'

import {
  toast,
} from 'sonner'

import {
  getActiveSessions,
  revokeActiveSession,
  type AuthSession,
} from '../../../api/auth'

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
} from '../../../components/ui'

import {
  formatSessionExpiry,
  formatSessionStarted,
  formatSessionStartedExact,
  getSettingsErrorMessage,
  parseUserAgent,
} from '../utils/settingsFormat'


type ActiveSessionsProps = {
  readOnly?: boolean
}


export function ActiveSessions({
  readOnly = false,
}: ActiveSessionsProps) {
  const queryClient =
    useQueryClient()


  const [
    sessionToRevoke,
    setSessionToRevoke,
  ] =
    useState<
      AuthSession |
      null
    >(null)


  const sessionsQuery =
    useQuery({
      queryKey: [
        'auth',
        'sessions',
      ],

      queryFn:
        getActiveSessions,

      staleTime:
        10_000,
    })


  const revokeMutation =
    useMutation({
      mutationFn:
        revokeActiveSession,

      onSuccess:
        async () => {
          setSessionToRevoke(
            null,
          )


          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'auth',
                  'sessions',
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
            'Session revoked',
            {
              description:
                'That device will need to sign in again.',
            },
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to revoke session',
            {
              description:
                getSettingsErrorMessage(
                  error,
                  "Averlen couldn't revoke this session.",
                ),
            },
          )
        },
    })


  const sessions =
    useMemo(
      () => {
        const items =
          sessionsQuery
            .data ??
          []


        return [
          ...items,
        ].sort(
          (
            left,
            right,
          ) => {
            if (
              left.is_current ===
              right.is_current
            ) {
              return (
                new Date(
                  right.created_at,
                ).getTime() -
                new Date(
                  left.created_at,
                ).getTime()
              )
            }


            return left
              .is_current
              ? -1
              : 1
          },
        )
      },
      [
        sessionsQuery.data,
      ],
    )


  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck
                size={18}
                aria-hidden="true"
              />
            </div>


            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-950">
                  Active sessions
                </h2>


                {!sessionsQuery
                  .isLoading && (
                  <Badge>
                    {sessions.length}{' '}
                    active
                  </Badge>
                )}
              </div>


              <p className="mt-1 text-sm text-slate-500">
                Devices currently signed in to your Averlen account.
              </p>
            </div>
          </div>


          <Button
            variant="secondary"
            size="sm"
            disabled={
              sessionsQuery
                .isFetching
            }
            onClick={() => {
              void sessionsQuery
                .refetch()
            }}
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={
                sessionsQuery
                  .isFetching
                  ? 'animate-spin'
                  : undefined
              }
            />

            Refresh
          </Button>
        </div>


        {sessionsQuery
          .isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({
              length: 2,
            }).map(
              (
                _,
                index,
              ) => (
                <Skeleton
                  key={
                    index
                  }
                  className="h-24 rounded-xl"
                />
              ),
            )}
          </div>
        ) : sessionsQuery
            .isError ? (
          <div className="p-6">
            <ErrorState
              title="Unable to load sessions"
              description={
                getSettingsErrorMessage(
                  sessionsQuery
                    .error,
                  "Averlen couldn't load your active sessions.",
                )
              }
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    void sessionsQuery
                      .refetch()
                  }}
                >
                  Try again
                </Button>
              }
            />
          </div>
        ) : sessions.length ===
          0 ? (
          <div className="p-6">
            <EmptyState
              title="No active sessions"
              description="No active Averlen sessions were found."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {sessions.map(
              (
                session,
              ) => {
                const device =
                  parseUserAgent(
                    session
                      .user_agent,
                  )


                const DeviceIcon =
                  device.mobile
                    ? Smartphone
                    : Laptop


                return (
                  <div
                    key={
                      session.id
                    }
                    className={`
                      px-5
                      py-5
                      transition
                      sm:px-6
                      ${
                        session.is_current
                          ? 'bg-brand-50/30'
                          : 'bg-white'
                      }
                    `}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div
                        className={`
                          flex
                          size-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          ${
                            session.is_current
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-slate-100 text-slate-600'
                          }
                        `}
                      >
                        <DeviceIcon
                          size={18}
                          aria-hidden="true"
                        />
                      </div>


                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {device.browser}
                          </p>

                          <span className="text-sm text-slate-300">
                            ·
                          </span>

                          <p className="text-sm text-slate-500">
                            {device.platform}
                          </p>


                          {session.is_current && (
                            <Badge
                              variant="brand"
                            >
                              This device
                            </Badge>
                          )}
                        </div>


                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Globe2
                              size={13}
                              aria-hidden="true"
                            />

                            <span className="font-mono">
                              {session
                                .ip_address ??
                                'IP unavailable'}
                            </span>
                          </span>


                          <span
                            title={
                              formatSessionStartedExact(
                                session
                                  .created_at,
                              )
                            }
                          >
                            Signed in{' '}
                            {formatSessionStarted(
                              session
                                .created_at,
                            )}
                          </span>


                          <span>
                            Expires{' '}
                            {formatSessionExpiry(
                              session
                                .expires_at,
                            )}
                          </span>
                        </div>
                      </div>


                      <div className="shrink-0">
                        {session.is_current ? (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <span className="size-2 rounded-full bg-emerald-500" />

                            Current session
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                              readOnly ||
                              revokeMutation
                                .isPending
                            }
                            title={
                              readOnly
                                ? 'Unavailable in demo mode'
                                : undefined
                            }
                            onClick={() => {
                              if (readOnly) {
                                return
                              }

                              setSessionToRevoke(
                                session,
                              )
                            }}
                          >
                            <Trash2
                              size={14}
                              aria-hidden="true"
                            />

                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </Card>


      <Dialog
        open={
          sessionToRevoke !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (
            !open &&
            !revokeMutation
              .isPending
          ) {
            setSessionToRevoke(
              null,
            )
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Revoke this session?
            </DialogTitle>

            <DialogDescription>
              This device will lose access to its active Averlen session and will need to sign in again.
            </DialogDescription>
          </DialogHeader>


          {sessionToRevoke && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">
                {
                  parseUserAgent(
                    sessionToRevoke
                      .user_agent,
                  ).browser
                }
                {' · '}
                {
                  parseUserAgent(
                    sessionToRevoke
                      .user_agent,
                  ).platform
                }
              </p>


              <p className="mt-2 font-mono text-xs text-slate-500">
                {sessionToRevoke
                  .ip_address ??
                  'IP unavailable'}
              </p>
            </div>
          )}


          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={
                revokeMutation
                  .isPending
              }
              onClick={() => {
                setSessionToRevoke(
                  null,
                )
              }}
            >
              Cancel
            </Button>


            <Button
              type="button"
              variant="danger"
              disabled={
                readOnly ||
                !sessionToRevoke ||
                revokeMutation
                  .isPending
              }
              onClick={() => {
                if (
                  readOnly ||
                  !sessionToRevoke
                ) {
                  return
                }


                revokeMutation
                  .mutate(
                    sessionToRevoke
                      .id,
                  )
              }}
            >
              {revokeMutation
                .isPending
                ? 'Revoking...'
                : 'Revoke session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}