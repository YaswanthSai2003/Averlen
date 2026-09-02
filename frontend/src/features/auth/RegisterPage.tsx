import {
  type ReactNode,
} from 'react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  Link,
  Navigate,
  useSearchParams,
} from 'react-router'

import {
  ShieldCheck,
} from 'lucide-react'

import {
  validateInviteToken,
} from '../../api/auth'

import {
  ApiError,
} from '../../api/client'

import {
  Brand,
} from '../../components/layout'

import {
  Button,
  Card,
  Spinner,
} from '../../components/ui'

import {
  useAuth,
} from './auth-context'

import {
  DirectRegistrationForm,
} from './register/DirectRegistrationForm'

import {
  InviteRegistrationForm,
} from './register/InviteRegistrationForm'


type AuthFrameProps = {
  children:
    ReactNode
}


function AuthFrame({
  children,
}: AuthFrameProps) {
  return (
    <main className="flex min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-8">
          <Brand size="large" />
        </div>

        {children}
      </div>
    </main>
  )
}


function getInviteErrorMessage(
  error: unknown,
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

  return 'This invitation is invalid, expired, cancelled or no longer available.'
}


export function RegisterPage() {
  const {
    status,
  } =
    useAuth()

  const [
    searchParams,
  ] =
    useSearchParams()

  const inviteToken =
    searchParams.get(
      'invite_token',
    )

  const inviteQuery =
    useQuery({
      queryKey: [
        'invite',
        'validate',
        inviteToken,
      ],

      queryFn: () => {
        if (!inviteToken) {
          throw new Error(
            'Invitation token is missing.',
          )
        }

        return validateInviteToken(
          inviteToken,
        )
      },

      enabled:
        Boolean(
          inviteToken,
        ) &&
        status !==
          'authenticated',

      retry:
        false,
    })


  if (
    status ===
    'authenticated'
  ) {
    return (
      <Navigate
        to="/app"
        replace
      />
    )
  }


  if (
    inviteToken &&
    inviteQuery.isLoading
  ) {
    return (
      <AuthFrame>
        <Card className="p-8">
          <div className="flex flex-col items-center py-8 text-center">
            <Spinner />

            <h1 className="mt-5 text-lg font-semibold text-slate-950">
              Checking invitation
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Averlen is validating the invitation before registration.
            </p>
          </div>
        </Card>
      </AuthFrame>
    )
  }


  if (
    inviteToken &&
    inviteQuery.isError
  ) {
    return (
      <AuthFrame>
        <Card className="p-6 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-danger-50 text-danger-700">
            <ShieldCheck
              size={20}
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            Invitation unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {getInviteErrorMessage(
              inviteQuery.error,
            )}
          </p>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs leading-5 text-slate-500">
              The invitation may have expired, been cancelled or already been used. Ask the workspace administrator for a new invitation.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                void inviteQuery.refetch()
              }}
            >
              Try again
            </Button>

            <Link
              to="/login"
              className="text-center text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Go to sign in
            </Link>
          </div>
        </Card>
      </AuthFrame>
    )
  }


  return (
    <AuthFrame>
      <Card className="p-6 sm:p-8">
        {inviteToken &&
        inviteQuery.data ? (
          <InviteRegistrationForm
            inviteToken={
              inviteToken
            }
            invite={
              inviteQuery.data
            }
          />
        ) : (
          <DirectRegistrationForm />
        )}

        {!inviteToken && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}

            <Link
              to="/login"
              className="font-medium text-brand-700 hover:text-brand-800"
            >
              Sign in
            </Link>
          </p>
        )}
      </Card>
    </AuthFrame>
  )
}
