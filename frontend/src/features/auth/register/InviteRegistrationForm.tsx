import {
  useState,
} from 'react'

import {
  zodResolver,
} from '@hookform/resolvers/zod'

import {
  useForm,
} from 'react-hook-form'

import {
  CheckCircle2,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  z,
} from 'zod'

import {
  register as registerAccount,
  type InviteValidation,
} from '../../../api/auth'

import {
  ApiError,
} from '../../../api/client'

import {
  Button,
  Checkbox,
  Input,
  Spinner,
} from '../../../components/ui'

import {
  formatDateTimeIST,
} from '../../../lib/dateTime'


const inviteRegistrationSchema =
  z.object({
    fullName:
      z.string()
        .trim()
        .min(
          2,
          'Enter your full name.',
        )
        .max(
          120,
          'Full name is too long.',
        ),

    password:
      z.string()
        .min(
          8,
          'Password must be at least 8 characters.',
        )
        .max(
          128,
          'Password must be 128 characters or fewer.',
        ),

    confirmPassword:
      z.string(),

    acceptedTerms:
      z.boolean()
        .refine(
          (
            value,
          ) =>
            value,
          'You must accept the Terms of Service.',
        ),

    acceptedPrivacy:
      z.boolean()
        .refine(
          (
            value,
          ) =>
            value,
          'You must accept the Privacy Policy.',
        ),
  })
    .refine(
      (
        values,
      ) =>
        values.password ===
        values.confirmPassword,
      {
        path: [
          'confirmPassword',
        ],

        message:
          'Passwords do not match.',
      },
    )


type InviteRegistrationValues =
  z.infer<
    typeof inviteRegistrationSchema
  >


type InviteRegistrationFormProps = {
  inviteToken: string
  invite: InviteValidation
}


function formatRole(
  role: string,
) {
  switch (
    role
  ) {
    case 'ORG_ADMIN':
      return 'Organization admin'

    case 'REVENUE_MANAGER':
      return 'Revenue manager'

    case 'ANALYST':
      return 'Analyst'

    case 'VIEWER':
      return 'Viewer'

    default:
      return role.replace(
        /_/g,
        ' ',
      )
  }
}


export function InviteRegistrationForm({
  inviteToken,
  invite,
}: InviteRegistrationFormProps) {
  const navigate =
    useNavigate()

  const [
    serverError,
    setServerError,
  ] =
    useState<string | null>(
      null,
    )

  const form =
    useForm<InviteRegistrationValues>({
      resolver:
        zodResolver(
          inviteRegistrationSchema,
        ),

      defaultValues: {
        fullName: '',
        password: '',
        confirmPassword: '',
        acceptedTerms: false,
        acceptedPrivacy: false,
      },
    })


  async function handleSubmit(
    values:
      InviteRegistrationValues,
  ) {
    setServerError(
      null,
    )

    try {
      await registerAccount({
        email:
          invite.email,

        password:
          values.password,

        full_name:
          values.fullName.trim(),

        accepted_terms:
          values.acceptedTerms,

        accepted_privacy_policy:
          values.acceptedPrivacy,

        invite_token:
          inviteToken,
      })

      navigate(
        '/login',
        {
          replace: true,

          state: {
            registered:
              true,

            email:
              invite.email,
          },
        },
      )
    } catch (
      error
    ) {
      setServerError(
        error instanceof
          ApiError
          ? error.message
          : 'Unable to accept this invitation. Please try again.',
      )
    }
  }


  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
        Workspace invitation
      </p>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Accept your invitation
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Create your account to join the existing workspace with the access selected by its administrator.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-brand-200 bg-brand-50">
        <div className="flex items-start gap-3 border-b border-brand-100 px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
            <ShieldCheck
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-brand-900">
                Invitation verified
              </p>

              <CheckCircle2
                size={15}
                className="text-emerald-600"
                aria-hidden="true"
              />
            </div>

            <p className="mt-1 text-xs leading-5 text-brand-700">
              This invitation is valid and ready to accept.
            </p>
          </div>
        </div>

        <div className="grid gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-500">
              Invited email
            </p>

            <div className="mt-1 flex items-center gap-2">
              <Mail
                size={14}
                className="text-brand-600"
                aria-hidden="true"
              />

              <p className="truncate text-sm font-medium text-brand-900">
                {invite.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                Role
              </p>

              <p className="mt-1 text-sm font-medium text-brand-900">
                {formatRole(
                  invite.role,
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                Expires
              </p>

              <p className="mt-1 text-xs leading-5 text-brand-800">
                {formatDateTimeIST(
                  invite.expires_at,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          {serverError}
        </div>
      )}

      <form
        className="mt-6 grid gap-5"
        onSubmit={
          form.handleSubmit(
            handleSubmit,
          )
        }
      >
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          error={
            form.formState.errors.fullName
              ?.message
          }
          {...form.register(
            'fullName',
          )}
        />

        <Input
          label="Email address"
          type="email"
          value={
            invite.email
          }
          readOnly
          hint="This email is fixed by the invitation."
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use between 8 and 128 characters."
          error={
            form.formState.errors.password
              ?.message
          }
          {...form.register(
            'password',
          )}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          error={
            form.formState.errors.confirmPassword
              ?.message
          }
          {...form.register(
            'confirmPassword',
          )}
        />

        <div className="grid gap-3 pt-1">
          <Checkbox
            label="I agree to the Terms of Service."
            error={
              form.formState.errors.acceptedTerms
                ?.message
            }
            {...form.register(
              'acceptedTerms',
            )}
          />

          <Checkbox
            label="I agree to the Privacy Policy."
            error={
              form.formState.errors.acceptedPrivacy
                ?.message
            }
            {...form.register(
              'acceptedPrivacy',
            )}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={
            form.formState.isSubmitting
          }
        >
          {form.formState.isSubmitting ? (
            <>
              <Spinner
                size="sm"
                className="text-white"
              />

              Creating account
            </>
          ) : (
            'Accept invitation'
          )}
        </Button>
      </form>
    </div>
  )
}
