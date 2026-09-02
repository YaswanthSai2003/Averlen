import {
  useState,
} from 'react'

import {
  useQueryClient,
} from '@tanstack/react-query'

import {
  Copy,
  Link2,
  MoreHorizontal,
  RefreshCw,
  XCircle,
} from 'lucide-react'

import {
  ApiError,
  apiRequest,
} from '../../../api/client'

import type {
  InviteCreateResponse,
  OrganizationInvite,
} from '../../../api/team'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
} from '../../../components/ui'

import {
  toast,
} from '../../../lib/toast'

import {
  formatTeamDate,
  formatTeamRole,
} from '../utils/teamFormat'


type InviteLinkActionsProps = {
  invite:
    OrganizationInvite

  canCancel:
    boolean

  cancelling:
    boolean

  onCancel:
    () => void
}


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


export function InviteLinkActions({
  invite,
  canCancel,
  cancelling,
  onCancel,
}: InviteLinkActionsProps) {
  const queryClient =
    useQueryClient()

  const [
    dialogOpen,
    setDialogOpen,
  ] =
    useState(false)

  const [
    generatedLink,
    setGeneratedLink,
  ] =
    useState<string | null>(
      null,
    )

  const [
    regenerating,
    setRegenerating,
  ] =
    useState(false)


  function handleDialogOpenChange(
    open: boolean,
  ) {
    if (
      !open &&
      regenerating
    ) {
      return
    }

    setDialogOpen(
      open,
    )

    if (!open) {
      setGeneratedLink(
        null,
      )
    }
  }


  async function handleRegenerate() {
    setRegenerating(
      true,
    )

    try {
      const response =
        await apiRequest<
          InviteCreateResponse
        >(
          `/api/invites/${invite.id}/regenerate`,
          {
            method:
              'PATCH',
          },
        )

      const fullInviteUrl =
        new URL(
          response.invite_url,
          window.location.origin,
        ).toString()

      setGeneratedLink(
        fullInviteUrl,
      )

      await queryClient
        .invalidateQueries({
          queryKey: [
            'team',
            'invites',
          ],
        })

      toast.success(
        'Invitation link generated',
        {
          description:
            'The previous registration link is no longer valid.',
        },
      )
    } catch (
      error
    ) {
      toast.error(
        'Unable to generate invitation link',
        {
          description:
            getErrorMessage(
              error,
              "Averlen couldn't generate a new invitation link.",
            ),
        },
      )
    } finally {
      setRegenerating(
        false,
      )
    }
  }


  async function handleCopy() {
    if (!generatedLink) {
      return
    }

    try {
      await navigator
        .clipboard
        .writeText(
          generatedLink,
        )

      toast.success(
        'Invitation link copied',
      )
    } catch {
      toast.error(
        'Unable to copy invitation link',
        {
          description:
            'Select the link and copy it manually.',
        },
      )
    }
  }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              cancelling
            }
            aria-label={`Manage invitation for ${invite.email}`}
            className="px-2.5"
          >
            <MoreHorizontal
              size={16}
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-52"
        >
          <DropdownMenuItem
            onSelect={() => {
              setGeneratedLink(
                null,
              )

              setDialogOpen(
                true,
              )
            }}
          >
            <Link2
              size={16}
              aria-hidden="true"
            />

            Generate new link
          </DropdownMenuItem>

          {canCancel && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                destructive
                onSelect={
                  onCancel
                }
              >
                <XCircle
                  size={16}
                  aria-hidden="true"
                />

                Cancel invitation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>


      <Dialog
        open={
          dialogOpen
        }
        onOpenChange={
          handleDialogOpenChange
        }
      >
        <DialogContent className="max-w-lg">
          {!generatedLink ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Generate a new invitation link?
                </DialogTitle>

                <DialogDescription>
                  Use this when the original link was not copied, was lost, or needs to be replaced.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">
                  {invite.email}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatTeamRole(
                    invite.role,
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Current expiry{' '}
                  {formatTeamDate(
                    invite.expires_at,
                  )}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs leading-5 text-amber-800">
                  The current registration link will stop working immediately. Averlen will create a fresh secure token and refresh the invitation expiry.
                </p>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="secondary"
                  disabled={
                    regenerating
                  }
                  onClick={() => {
                    handleDialogOpenChange(
                      false,
                    )
                  }}
                >
                  Keep current link
                </Button>

                <Button
                  disabled={
                    regenerating
                  }
                  onClick={() => {
                    void handleRegenerate()
                  }}
                >
                  {regenerating ? (
                    <>
                      <Spinner
                        size="sm"
                        className="text-white"
                      />

                      Generating link
                    </>
                  ) : (
                    <>
                      <RefreshCw
                        size={16}
                        aria-hidden="true"
                      />

                      Generate new link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  New invitation link ready
                </DialogTitle>

                <DialogDescription>
                  Share this private link with the invited email address. The previous link is now invalid.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Link2
                    size={16}
                    aria-hidden="true"
                  />

                  <p className="text-sm font-semibold">
                    Secure link regenerated
                  </p>
                </div>

                <p className="mt-2 text-xs leading-5 text-emerald-700">
                  This new link is the only active registration link for {invite.email}.
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                  Registration link
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    readOnly
                    value={
                      generatedLink
                    }
                    onFocus={(
                      event,
                    ) => {
                      event
                        .currentTarget
                        .select()
                    }}
                    className="
                      h-10
                      min-w-0
                      flex-1
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      px-3
                      text-xs
                      text-slate-600
                      outline-none
                    "
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void handleCopy()
                    }}
                  >
                    <Copy
                      size={14}
                      aria-hidden="true"
                    />

                    Copy
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  onClick={() => {
                    handleDialogOpenChange(
                      false,
                    )
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}