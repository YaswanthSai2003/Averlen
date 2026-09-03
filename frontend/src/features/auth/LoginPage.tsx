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
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router'

import {
  z,
} from 'zod'

import {
  ApiError,
} from '../../api/client'

import {
  Brand,
} from '../../components/layout'

import {
  Button,
  Card,
  Input,
  Spinner,
} from '../../components/ui'

import {
  useAuth,
} from './auth-context'

import {
  LegalAuthLinks,
} from '../legal/LegalAuthLinks'

const loginSchema =
  z.object({
    email:
      z.string()
        .trim()
        .email(
          'Enter a valid email address.',
        ),

    password:
      z.string()
        .min(
          1,
          'Password is required.',
        ),
  })

type LoginForm =
  z.infer<
    typeof loginSchema
  >

type LoginLocationState = {
  registered?: boolean
  email?: string
}

export function LoginPage() {
  const {
    status,
    signIn,
    signInDemo,
  } = useAuth()

  const navigate =
    useNavigate()

  const location =
    useLocation()

  const locationState =
    location.state as
      | LoginLocationState
      | null

  const [
    serverError,
    setServerError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    demoLoading,
    setDemoLoading,
  ] =
    useState(false)

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<LoginForm>({
      resolver:
        zodResolver(
          loginSchema,
        ),

      defaultValues: {
        email:
          locationState?.email ??
          '',

        password: '',
      },
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

  async function onSubmit(
    values: LoginForm,
  ) {
    setServerError(null)

    try {
      await signIn(
        values.email,
        values.password,
      )

      navigate(
        '/app',
        {
          replace: true,
        },
      )
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
    }
  }

  async function handleDemoLogin() {
    setServerError(null)
    setDemoLoading(true)

    try {
      await signInDemo()

      navigate(
        '/app',
        {
          replace: true,
        },
      )
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Unable to start the demo workspace.',
      )
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-8">
          <Brand size="large" />
        </div>

        <Card className="p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              Welcome back
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Sign in to Averlen
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Access your revenue intelligence workspace.
            </p>
          </div>

          {locationState?.registered && (
            <div
              role="status"
              className="mt-6 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700"
            >
              Your account was created successfully. Sign in to continue.
            </div>
          )}

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
              handleSubmit(
                onSubmit,
              )
            }
          >
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={
                errors.email
                  ?.message
              }
              {...register(
                'email',
              )}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={
                errors.password
                  ?.message
              }
              {...register(
                'password',
              )}
            />

            <Button
              type="submit"
              size="lg"
              disabled={
                isSubmitting ||
                demoLoading
              }
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    size="sm"
                    className="text-white"
                  />

                  Signing in
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              or
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={
              isSubmitting ||
              demoLoading
            }
            onClick={() => {
              void handleDemoLogin()
            }}
          >
            {demoLoading ? (
              <>
                <Spinner
                  size="sm"
                />

                Preparing demo
              </>
            ) : (
              'Try demo workspace'
            )}
          </Button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            The demo uses seeded Averlen data
            and does not require your own CSV.
          </p>

          <div className="my-6 h-px bg-slate-200" />

          <p className="text-center text-sm text-slate-500">
            New to Averlen?{' '}

            <Link
              to="/register"
              className="font-medium text-brand-700 hover:text-brand-800"
            >
              Create an account
            </Link>
          </p>

        <LegalAuthLinks className="mt-6" />
</Card>
      </div>
    </main>
  )
}