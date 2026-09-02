import {
  useState,
  type FormEvent,
} from 'react'

import {
  useMutation,
} from '@tanstack/react-query'

import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  toast,
} from 'sonner'

import {
  changePassword,
} from '../../../api/auth'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '../../../components/ui'

import {
  useAuth,
} from '../../auth/auth-context'

import {
  getPasswordStrength,
  getSettingsErrorMessage,
} from '../utils/settingsFormat'


type SecuritySettingsProps = {
  readOnly?: boolean
}


export function SecuritySettings({
  readOnly = false,
}: SecuritySettingsProps) {
  const {
    signOut,
  } =
    useAuth()


  const navigate =
    useNavigate()


  const [
    dialogOpen,
    setDialogOpen,
  ] =
    useState(false)


  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState('')


  const [
    newPassword,
    setNewPassword,
  ] =
    useState('')


  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('')


  const [
    showCurrent,
    setShowCurrent,
  ] =
    useState(false)


  const [
    showNew,
    setShowNew,
  ] =
    useState(false)


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string |
      null
    >(null)


  const strength =
    getPasswordStrength(
      newPassword,
    )


  function resetForm() {
    setCurrentPassword(
      '',
    )

    setNewPassword(
      '',
    )

    setConfirmPassword(
      '',
    )

    setShowCurrent(
      false,
    )

    setShowNew(
      false,
    )

    setErrorMessage(
      null,
    )
  }


  const mutation =
    useMutation({
      mutationFn: () =>
        changePassword({
          current_password:
            currentPassword,

          new_password:
            newPassword,
        }),

      onSuccess:
        async () => {
          toast.success(
            'Password changed',
            {
              description:
                'Sign in again using your new password.',
            },
          )


          await signOut()


          navigate(
            '/login',
            {
              replace:
                true,
            },
          )
        },

      onError:
        (
          error,
        ) => {
          setErrorMessage(
            getSettingsErrorMessage(
              error,
              "Averlen couldn't change your password.",
            ),
          )
        },
    })


  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (readOnly) {
      return
    }


    setErrorMessage(
      null,
    )


    if (
      newPassword.length <
      8
    ) {
      setErrorMessage(
        'New password must be at least 8 characters.',
      )

      return
    }


    if (
      newPassword.length >
      128
    ) {
      setErrorMessage(
        'New password must be 128 characters or fewer.',
      )

      return
    }


    if (
      newPassword !==
      confirmPassword
    ) {
      setErrorMessage(
        'New passwords do not match.',
      )

      return
    }


    if (
      currentPassword ===
      newPassword
    ) {
      setErrorMessage(
        'Choose a password different from your current password.',
      )

      return
    }


    mutation.mutate()
  }


  return (
    <>
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <KeyRound
              size={18}
              aria-hidden="true"
            />
          </div>


          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-slate-900">
              Password
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {readOnly
                ? 'Password changes are disabled in the demo workspace.'
                : 'Update your password if you suspect unauthorized account access.'}
            </p>
          </div>


          <Button
            variant="secondary"
            disabled={
              readOnly
            }
            title={
              readOnly
                ? 'Unavailable in demo mode'
                : undefined
            }
            onClick={() => {
              resetForm()

              setDialogOpen(
                true,
              )
            }}
          >
            Change password
          </Button>
        </div>
      </div>


      <Dialog
        open={
          dialogOpen
        }
        onOpenChange={(
          open,
        ) => {
          if (
            mutation
              .isPending
          ) {
            return
          }

          setDialogOpen(
            open,
          )

          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form
            onSubmit={
              handleSubmit
            }
          >
            <DialogHeader>
              <DialogTitle>
                Change password
              </DialogTitle>

              <DialogDescription>
                Create a new password for your Averlen account.
              </DialogDescription>
            </DialogHeader>


            <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <TriangleAlert
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-amber-800">
                Changing your password signs you out of all active sessions.
              </p>
            </div>


            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Current password
                </span>

                <div className="relative">
                  <Input
                    type={
                      showCurrent
                        ? 'text'
                        : 'password'
                    }
                    value={
                      currentPassword
                    }
                    autoComplete="current-password"
                    disabled={
                      mutation
                        .isPending
                    }
                    className="pr-11"
                    onChange={(
                      event,
                    ) => {
                      setCurrentPassword(
                        event.target
                          .value,
                      )

                      setErrorMessage(
                        null,
                      )
                    }}
                  />

                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showCurrent
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                    onClick={() => {
                      setShowCurrent(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }}
                  >
                    {showCurrent ? (
                      <EyeOff
                        size={17}
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        size={17}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              </label>


              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </span>

                <div className="relative">
                  <Input
                    type={
                      showNew
                        ? 'text'
                        : 'password'
                    }
                    value={
                      newPassword
                    }
                    minLength={
                      8
                    }
                    maxLength={
                      128
                    }
                    autoComplete="new-password"
                    disabled={
                      mutation
                        .isPending
                    }
                    className="pr-11"
                    onChange={(
                      event,
                    ) => {
                      setNewPassword(
                        event.target
                          .value,
                      )

                      setErrorMessage(
                        null,
                      )
                    }}
                  />

                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showNew
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                    onClick={() => {
                      setShowNew(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }}
                  >
                    {showNew ? (
                      <EyeOff
                        size={17}
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        size={17}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>


                <div className="mt-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({
                      length: 5,
                    }).map(
                      (
                        _,
                        index,
                      ) => (
                        <span
                          key={
                            index
                          }
                          className={`
                            h-1.5
                            rounded-full
                            ${
                              index <
                              strength.score
                                ? strength.score >=
                                  4
                                  ? 'bg-emerald-500'
                                  : strength.score >=
                                      2
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                : 'bg-slate-200'
                            }
                          `}
                        />
                      ),
                    )}
                  </div>


                  <div className="mt-2 flex justify-between gap-3 text-xs">
                    <span className="text-slate-400">
                      8–128 characters
                    </span>

                    <span className="font-medium text-slate-600">
                      {strength.label}
                    </span>
                  </div>
                </div>
              </label>


              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm new password
                </span>

                <Input
                  type="password"
                  value={
                    confirmPassword
                  }
                  autoComplete="new-password"
                  disabled={
                    mutation
                      .isPending
                  }
                  onChange={(
                    event,
                  ) => {
                    setConfirmPassword(
                      event.target
                        .value,
                    )

                    setErrorMessage(
                      null,
                    )
                  }}
                />
              </label>
            </div>


            {errorMessage && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}


            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                size={15}
                aria-hidden="true"
              />

              Your password is never displayed or stored in plain text.
            </div>


            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="secondary"
                disabled={
                  mutation
                    .isPending
                }
                onClick={() => {
                  setDialogOpen(
                    false,
                  )

                  resetForm()
                }}
              >
                Cancel
              </Button>


              <Button
                type="submit"
                disabled={
                  mutation
                    .isPending ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {mutation
                  .isPending
                  ? 'Updating...'
                  : 'Change password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}