import {
  useState,
  type FormEvent,
} from 'react'

import {
  Check,
  Copy,
  Mail,
  UserPlus,
} from 'lucide-react'

import type {
  InviteCreateResponse,
  WorkspaceRole,
} from '../../../api/team'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  Spinner,
} from '../../../components/ui'

import {
  formatTeamDate,
  formatTeamRole,
  TEAM_ROLE_OPTIONS,
} from '../utils/teamFormat'


type InviteMemberDialogProps = {
  open:
    boolean

  onOpenChange:
    (open: boolean) => void

  onInvite:
    (
      email: string,
      role: WorkspaceRole,
    ) =>
      Promise<InviteCreateResponse>
}


function isValidEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  )
}


export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
}: InviteMemberDialogProps) {
  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    role,
    setRole,
  ] =
    useState<WorkspaceRole>(
      'ANALYST',
    )

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(null)

  const [
    result,
    setResult,
  ] =
    useState<
      InviteCreateResponse |
      null
    >(null)

  const [
    copied,
    setCopied,
  ] =
    useState(false)

  const [
    copyError,
    setCopyError,
  ] =
    useState<
      string |
      null
    >(null)


  function resetDialogState() {
    setEmail('')

    setRole(
      'ANALYST',
    )

    setSubmitting(
      false,
    )

    setError(
      null,
    )

    setResult(
      null,
    )

    setCopied(
      false,
    )

    setCopyError(
      null,
    )
  }


  function handleDialogOpenChange(
    nextOpen: boolean,
  ) {
    if (!nextOpen) {
      resetDialogState()
    }

    onOpenChange(
      nextOpen,
    )
  }


  const fullInviteUrl =
    result
      ? new URL(
          result.invite_url,
          window.location.origin,
        ).toString()
      : ''


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const normalizedEmail =
      email
        .trim()
        .toLowerCase()

    if (!normalizedEmail) {
      setError(
        'Email address is required.',
      )

      return
    }

    if (
      !isValidEmail(
        normalizedEmail,
      )
    ) {
      setError(
        'Enter a valid email address.',
      )

      return
    }

    setSubmitting(
      true,
    )

    setError(
      null,
    )

    try {
      const response =
        await onInvite(
          normalizedEmail,
          role,
        )

      setResult(
        response,
      )
    } catch {
      return
    } finally {
      setSubmitting(
        false,
      )
    }
  }


  async function handleCopy() {
    if (!fullInviteUrl) {
      return
    }

    setCopyError(
      null,
    )

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
      setCopyError(
        'Unable to copy automatically. Select the link and copy it manually.',
      )
    }
  }


  return (
    <Dialog
      open={
        open
      }
      onOpenChange={
        handleDialogOpenChange
      }
    >
      <DialogContent className="max-w-lg">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Invite team member
              </DialogTitle>

              <DialogDescription>
                Invite someone to join
                this workspace with a
                specific Averlen role.
              </DialogDescription>
            </DialogHeader>


            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6"
            >
              <div>
                <label
                  htmlFor="team-invite-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="team-invite-email"
                    type="email"
                    autoComplete="email"
                    value={
                      email
                    }
                    onChange={(
                      event,
                    ) => {
                      setEmail(
                        event
                          .target
                          .value,
                      )

                      setError(
                        null,
                      )
                    }}
                    placeholder="teammate@company.com"
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      pl-10
                      pr-4
                      text-sm
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-brand-500
                      focus:ring-2
                      focus:ring-brand-100
                    "
                  />
                </div>
              </div>


              <div className="mt-5">
                <Select
                  label="Workspace role"
                  value={
                    role
                  }
                  onChange={(
                    event,
                  ) => {
                    setRole(
                      event
                        .target
                        .value as
                        WorkspaceRole,
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
                  {
                    TEAM_ROLE_OPTIONS.find(
                      (
                        option,
                      ) =>
                        option.value ===
                        role,
                    )
                      ?.description
                  }
                </p>
              </div>


              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
                >
                  {error}
                </div>
              )}


              <DialogFooter className="mt-7">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    submitting
                  }
                  onClick={() => {
                    handleDialogOpenChange(
                      false,
                    )
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <Spinner
                        size="sm"
                        className="text-white"
                      />

                      Creating invitation
                    </>
                  ) : (
                    <>
                      <UserPlus
                        size={16}
                        aria-hidden="true"
                      />

                      Create invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Invitation created
              </DialogTitle>

              <DialogDescription>
                Share this private
                registration link with
                the invited team member.
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
                {
                  result
                    .invite
                    .email
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Invited as{' '}
                {formatTeamRole(
                  result
                    .invite
                    .role,
                )}
                {' · '}
                expires{' '}
                {formatTeamDate(
                  result
                    .invite
                    .expires_at,
                )}
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


                {copyError && (
                  <p className="mt-2 text-xs text-danger-600">
                    {copyError}
                  </p>
                )}
              </div>


              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs leading-5 text-amber-800">
                  This link contains the
                  invitation token. Share
                  it only with the invited
                  email address.
                </p>
              </div>
            </div>


            <DialogFooter className="mt-7">
              <Button
                variant="secondary"
                onClick={() => {
                  resetDialogState()
                }}
              >
                <UserPlus
                  size={16}
                  aria-hidden="true"
                />

                Invite another
              </Button>

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
  )
}