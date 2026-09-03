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
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  z,
} from 'zod'

import {
  discoverWorkspaceByEmail,
  requestWorkspaceAccess,
} from '../../../api/accessRequests'

import {
  register as registerAccount,
} from '../../../api/auth'

import {
  ApiError,
} from '../../../api/client'

import {
  Button,
  Input,
  Spinner,
} from '../../../components/ui'

import {
  toast,
} from '../../../lib/toast'


const identitySchema =
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

    organizationName:
      z.string()
        .trim()
        .min(
          2,
          'Organization name must be at least 2 characters.',
        )
        .max(
          120,
          'Organization name must be 120 characters or fewer.',
        ),

    email:
      z.string()
        .trim()
        .email(
          'Enter a valid email address.',
        ),
  })


const securitySchema =
  z.object({
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


type IdentityValues =
  z.infer<
    typeof identitySchema
  >


type SecurityValues =
  z.infer<
    typeof securitySchema
  >


type Stage =
  | 'identity'
  | 'security'
  | 'request'
  | 'requested'


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


export function DirectRegistrationForm() {
  const navigate =
    useNavigate()

  const [
    stage,
    setStage,
  ] =
    useState<Stage>(
      'identity',
    )

  const [
    identity,
    setIdentity,
  ] =
    useState<IdentityValues | null>(
      null,
    )

  const [
    checkingWorkspace,
    setCheckingWorkspace,
  ] =
    useState(false)

  const [
    requestingAccess,
    setRequestingAccess,
  ] =
    useState(false)

  const [
    serverError,
    setServerError,
  ] =
    useState<string | null>(
      null,
    )


  const identityForm =
    useForm<IdentityValues>({
      resolver:
        zodResolver(
          identitySchema,
        ),

      defaultValues: {
        fullName: '',
        organizationName: '',
        email: '',
      },
    })


  const securityForm =
    useForm<SecurityValues>({
      resolver:
        zodResolver(
          securitySchema,
        ),

      defaultValues: {
        password: '',
        confirmPassword: '',
        acceptedTerms: false,
        acceptedPrivacy: false,
      },
    })


  async function handleIdentityContinue(
    values: IdentityValues,
  ) {
    setCheckingWorkspace(
      true,
    )

    setServerError(
      null,
    )

    const normalizedIdentity = {
      fullName:
        values.fullName.trim(),

      organizationName:
        values.organizationName.trim(),

      email:
        values.email
          .trim()
          .toLowerCase(),
    }

    try {
      const discovery =
        await discoverWorkspaceByEmail(
          normalizedIdentity.email,
        )

      setIdentity(
        normalizedIdentity,
      )

      if (
        discovery.existing_workspace &&
        discovery.can_request_access
      ) {
        setStage(
          'request',
        )
      } else {
        setStage(
          'security',
        )
      }
    } catch (
      error
    ) {
      setServerError(
        getErrorMessage(
          error,
          "Averlen couldn't check your company workspace.",
        ),
      )
    } finally {
      setCheckingWorkspace(
        false,
      )
    }
  }


  async function handleCreateWorkspace(
    values: SecurityValues,
  ) {
    if (!identity) {
      setStage(
        'identity',
      )

      return
    }

    setServerError(
      null,
    )

    try {
      await registerAccount({
        email:
          identity.email,

        password:
          values.password,

        full_name:
          identity.fullName,

        organization_name:
          identity.organizationName,

        accepted_terms:
          values.acceptedTerms,

        accepted_privacy_policy:
          values.acceptedPrivacy,
      })

      navigate(
        '/login',
        {
          replace: true,

          state: {
            registered:
              true,

            email:
              identity.email,
          },
        },
      )
    } catch (
      error
    ) {
      const discovery =
        await discoverWorkspaceByEmail(
          identity.email,
        ).catch(() => null)

      if (
        discovery?.existing_workspace &&
        discovery.can_request_access
      ) {
        securityForm.reset()

        setStage(
          'request',
        )

        toast.info(
          'Company workspace found',
          {
            description:
              'Request access instead of creating another workspace.',
          },
        )

        return
      }

      setServerError(
        getErrorMessage(
          error,
          'Unable to create your account. Please try again.',
        ),
      )
    }
  }


  async function handleRequestAccess() {
    if (!identity) {
      setStage(
        'identity',
      )

      return
    }

    setRequestingAccess(
      true,
    )

    setServerError(
      null,
    )

    try {
      await requestWorkspaceAccess({
        email:
          identity.email,

        full_name:
          identity.fullName,
      })

      setStage(
        'requested',
      )

      toast.success(
        'Access request sent',
        {
          description:
            'A workspace administrator can now review your request.',
        },
      )
    } catch (
      error
    ) {
      setServerError(
        getErrorMessage(
          error,
          "Averlen couldn't send your access request.",
        ),
      )
    } finally {
      setRequestingAccess(
        false,
      )
    }
  }


  if (
    stage ===
      'requested' &&
    identity
  ) {
    return (
      <div>
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2
            size={21}
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          Access request sent
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your request for{' '}
          <span className="font-medium text-slate-900">
            {identity.email}
          </span>{' '}
          is waiting for a workspace administrator to review it.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-sm font-medium text-slate-900">
            What happens next?
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            If approved, the administrator will choose your role and share a private Averlen invitation link with you. Use that link to finish creating your account.
          </p>
        </div>

        <Button
          className="mt-6 w-full"
          variant="secondary"
          onClick={() => {
            navigate(
              '/login',
            )
          }}
        >
          Go to sign in
        </Button>
      </div>
    )
  }


  if (
    stage ===
      'request' &&
    identity
  ) {
    return (
      <div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Building2
            size={20}
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          Your company has a Averlen workspace
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          A workspace for{' '}
          <span className="font-medium text-slate-900">
            @{identity.email.split('@')[1]}
          </span>{' '}
          already exists. Request access and an organization admin can approve your role.
        </p>

        <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <Mail
              size={16}
              className="text-slate-400"
              aria-hidden="true"
            />

            <span className="text-sm font-medium text-slate-800">
              {identity.email}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck
              size={16}
              className="mt-0.5 text-slate-400"
              aria-hidden="true"
            />

            <p className="text-sm leading-6 text-slate-500">
              An organization admin must approve your request and choose your workspace role.
            </p>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {serverError}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
          <Button
            variant="secondary"
            className="whitespace-nowrap"
            disabled={
              requestingAccess
            }
            onClick={() => {
              setServerError(
                null,
              )

              setStage(
                'identity',
              )
            }}
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Change email
          </Button>

          <Button
            className="w-full whitespace-nowrap"
            disabled={
              requestingAccess
            }
            onClick={() => {
              void handleRequestAccess()
            }}
          >
            {requestingAccess ? (
              <>
                <Spinner
                  size="sm"
                  className="text-white"
                />

                Sending request
              </>
            ) : (
              'Request access'
            )}
          </Button>
        </div>
      </div>
    )
  }


  if (
    stage ===
      'security' &&
    identity
  ) {
    return (
      <div>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          onClick={() => {
            setServerError(
              null,
            )

            setStage(
              'identity',
            )
          }}
        >
          <ArrowLeft
            size={15}
            aria-hidden="true"
          />

          Back
        </button>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          Secure your new workspace
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          You will become the organization admin for{' '}
          <span className="font-medium text-slate-900">
            {identity.organizationName}
          </span>.
        </p>

        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
            Workspace owner
          </p>

          <p className="mt-1 text-sm font-medium text-brand-900">
            {identity.email}
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {serverError}
          </div>
        )}

        <form
          className="mt-6 grid gap-5"
          onSubmit={
            securityForm.handleSubmit(
              handleCreateWorkspace,
            )
          }
        >
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Use between 8 and 128 characters."
            error={
              securityForm.formState.errors.password
                ?.message
            }
            {...securityForm.register(
              'password',
            )}
          />

          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password again"
            error={
              securityForm.formState.errors.confirmPassword
                ?.message
            }
            {...securityForm.register(
              'confirmPassword',
            )}
          />

          <div className="grid gap-3 pt-1">
            <div>
              <div className="flex items-start gap-3">
                <input
                  id="accepted-terms"
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  {...securityForm.register(
                    'acceptedTerms',
                  )}
                />

                <p className="text-sm leading-6 text-slate-700">
                  <label
                    htmlFor="accepted-terms"
                    className="cursor-pointer"
                  >
                    I agree to the{' '}
                  </label>

                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-800 hover:underline"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>

              {securityForm.formState.errors.acceptedTerms?.message && (
                <p className="mt-1 pl-7 text-xs text-danger-600">
                  {securityForm.formState.errors.acceptedTerms.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-3">
                <input
                  id="accepted-privacy"
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  {...securityForm.register(
                    'acceptedPrivacy',
                  )}
                />

                <p className="text-sm leading-6 text-slate-700">
                  <label
                    htmlFor="accepted-privacy"
                    className="cursor-pointer"
                  >
                    I agree to the{' '}
                  </label>

                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-800 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              {securityForm.formState.errors.acceptedPrivacy?.message && (
                <p className="mt-1 pl-7 text-xs text-danger-600">
                  {securityForm.formState.errors.acceptedPrivacy.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={
              securityForm.formState.isSubmitting
            }
          >
            {securityForm.formState.isSubmitting ? (
              <>
                <Spinner
                  size="sm"
                  className="text-white"
                />

                Creating workspace
              </>
            ) : (
              'Create workspace'
            )}
          </Button>
        </form>
      </div>
    )
  }


  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
        Get started
      </p>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Create your Averlen workspace
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Start a new organization or securely request access if your company already uses Averlen.
      </p>

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
          identityForm.handleSubmit(
            handleIdentityContinue,
          )
        }
      >
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          error={
            identityForm.formState.errors.fullName
              ?.message
          }
          {...identityForm.register(
            'fullName',
          )}
        />

        <Input
          label="Organization name"
          type="text"
          autoComplete="organization"
          placeholder="Acme Hotels"
          hint="This becomes the workspace name if your company is new to Averlen."
          error={
            identityForm.formState.errors.organizationName
              ?.message
          }
          {...identityForm.register(
            'organizationName',
          )}
        />

        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          hint="Company domains can be matched to an existing workspace. Public email domains stay invite-only."
          error={
            identityForm.formState.errors.email
              ?.message
          }
          {...identityForm.register(
            'email',
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={
            checkingWorkspace
          }
        >
          {checkingWorkspace ? (
            <>
              <Spinner
                size="sm"
                className="text-white"
              />

              Checking workspace
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </div>
  )
}