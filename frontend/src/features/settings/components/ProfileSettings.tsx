import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Camera,
  Trash2,
} from 'lucide-react'

import {
  toast,
} from 'sonner'

import {
  deleteCurrentUserAvatar,
  updateCurrentUser,
  uploadCurrentUserAvatar,
} from '../../../api/auth'

import {
  buildApiUrl,
} from '../../../api/client'

import {
  Badge,
  Button,
  Input,
  Spinner,
} from '../../../components/ui'

import {
  useAuth,
} from '../../auth/auth-context'

import {
  formatSettingsRole,
  getSettingsErrorMessage,
  getSettingsRoleVariant,
  getUserInitials,
} from '../utils/settingsFormat'


const MAX_AVATAR_SIZE =
  2 * 1024 * 1024


const ALLOWED_AVATAR_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])


function validateAvatar(
  file: File,
) {
  if (
    !ALLOWED_AVATAR_TYPES.has(
      file.type,
    )
  ) {
    return (
      'Only JPG, PNG and WEBP images are supported.'
    )
  }


  if (
    file.size >
    MAX_AVATAR_SIZE
  ) {
    return (
      'Profile photo must be 2 MB or smaller.'
    )
  }


  return null
}


type ProfileSettingsProps = {
  readOnly?: boolean
}


export function ProfileSettings({
  readOnly = false,
}: ProfileSettingsProps) {
  const {
    user,
    refreshUser,
  } =
    useAuth()


  const queryClient =
    useQueryClient()


  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    )


  const [
    fullName,
    setFullName,
  ] =
    useState(
      user?.full_name ??
      '',
    )


  const updateMutation =
    useMutation({
      mutationFn: () =>
        updateCurrentUser({
          full_name:
            fullName
              .trim() ||
            null,
        }),

      onSuccess:
        async (
          updatedUser,
        ) => {
          setFullName(
            updatedUser
              .full_name ??
            '',
          )

          await refreshUser()

          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
              ],
            })


          toast.success(
            'Profile updated',
            {
              description:
                'Your account details have been saved.',
            },
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to update profile',
            {
              description:
                getSettingsErrorMessage(
                  error,
                  "Averlen couldn't update your profile.",
                ),
            },
          )
        },
    })


  const avatarMutation =
    useMutation({
      mutationFn:
        uploadCurrentUserAvatar,

      onSuccess:
        async () => {
          if (
            fileInputRef
              .current
          ) {
            fileInputRef
              .current
              .value = ''
          }


          await refreshUser()

          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
              ],
            })


          toast.success(
            'Profile photo updated',
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to update photo',
            {
              description:
                getSettingsErrorMessage(
                  error,
                  "Averlen couldn't upload your photo.",
                ),
            },
          )
        },
    })


  const removeAvatarMutation =
    useMutation({
      mutationFn:
        deleteCurrentUserAvatar,

      onSuccess:
        async () => {
          await refreshUser()

          await queryClient
            .invalidateQueries({
              queryKey: [
                'notifications',
              ],
            })


          toast.success(
            'Profile photo removed',
          )
        },

      onError:
        (
          error,
        ) => {
          toast.error(
            'Unable to remove photo',
            {
              description:
                getSettingsErrorMessage(
                  error,
                  "Averlen couldn't remove your photo.",
                ),
            },
          )
        },
    })


  if (!user) {
    return null
  }


  const avatarUrl =
    user.avatar_url
      ? buildApiUrl(
          user.avatar_url,
        )
      : null


  const initials =
    getUserInitials(
      user.full_name,
      user.email,
    )


  const currentName =
    user.full_name ??
    ''


  const nameChanged =
    fullName.trim() !==
    currentName


  const busy =
    updateMutation
      .isPending ||
    avatarMutation
      .isPending ||
    removeAvatarMutation
      .isPending


  function handleAvatarChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    if (readOnly) {
      event.target.value =
        ''

      return
    }


    const file =
      event.target
        .files?.[0]


    if (!file) {
      return
    }


    const validationError =
      validateAvatar(
        file,
      )


    if (
      validationError
    ) {
      event.target.value =
        ''


      toast.error(
        'Invalid profile photo',
        {
          description:
            validationError,
        },
      )

      return
    }


    avatarMutation.mutate(
      file,
    )
  }


  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()


    if (readOnly) {
      return
    }


    if (!nameChanged) {
      return
    }


    updateMutation.mutate()
  }


  return (
    <div>
      <div className="px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={
                  avatarUrl
                }
                alt=""
                className="size-[72px] rounded-2xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex size-[72px] items-center justify-center rounded-2xl bg-brand-50 text-xl font-semibold text-brand-700 ring-1 ring-brand-100">
                {initials}
              </div>
            )}


            {avatarMutation
              .isPending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
                <Spinner
                  size="sm"
                />
              </div>
            )}
          </div>


          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-950">
                {user.full_name ||
                  user.email}
              </h3>

              <Badge
                variant={
                  getSettingsRoleVariant(
                    user.role,
                  )
                }
              >
                {formatSettingsRole(
                  user.role,
                )}
              </Badge>
            </div>


            <p className="mt-1 truncate text-sm text-slate-500">
              {user.email}
            </p>


            <p className="mt-1 text-xs text-slate-400">
              Personal account
            </p>
          </div>


          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={
                readOnly ||
                busy
              }
              onClick={() => {
                fileInputRef
                  .current
                  ?.click()
              }}
            >
              <Camera
                size={15}
                aria-hidden="true"
              />

              Change photo
            </Button>


            {user.avatar_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  readOnly ||
                  busy
                }
                onClick={() => {
                  removeAvatarMutation
                    .mutate()
                }}
              >
                <Trash2
                  size={15}
                  aria-hidden="true"
                />

                Remove
              </Button>
            )}
          </div>


          <input
            ref={
              fileInputRef
            }
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={
              readOnly ||
              busy
            }
            onChange={
              handleAvatarChange
            }
          />
        </div>
      </div>


      <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-5 sm:px-6">
        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </span>

              <Input
                value={
                  fullName
                }
                maxLength={
                  120
                }
                placeholder="Your full name"
                disabled={
                  readOnly ||
                  busy
                }
                onChange={(
                  event,
                ) => {
                  setFullName(
                    event.target
                      .value,
                  )
                }}
              />
            </label>


            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </span>

              <Input
                value={
                  user.email
                }
                readOnly
                disabled
              />
            </label>


            <Button
              type="submit"
              disabled={
                readOnly ||
                !nameChanged ||
                busy
              }
            >
              {updateMutation
                .isPending
                ? 'Saving...'
                : 'Save changes'}
            </Button>
          </div>


          <p
            className={`mt-3 text-xs ${
              readOnly
                ? 'font-medium text-amber-700'
                : 'text-slate-400'
            }`}
          >
            {readOnly
              ? 'Profile changes are disabled in the demo workspace.'
              : 'JPG, PNG or WEBP · Maximum 2 MB'}
          </p>
        </form>
      </div>
    </div>
  )
}