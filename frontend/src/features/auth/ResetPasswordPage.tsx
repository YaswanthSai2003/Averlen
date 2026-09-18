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
  KeyRound,
} from 'lucide-react'

import {
  Link,
  Navigate,
  useSearchParams,
} from 'react-router'

import {
  z,
} from 'zod'

import {
  resetPassword,
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
  Input,
  Spinner,
} from '../../components/ui'

import {
  LegalAuthLinks,
} from '../legal/LegalAuthLinks'

import {
  useAuth,
} from './auth-context'


const schema =
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


type FormValues =
  z.infer<
    typeof schema
  >


export function ResetPasswordPage() {
  const {
    status,
  } =
    useAuth()

  const [
    searchParams,
  ] =
    useSearchParams()

  const token =
    searchParams.get(
      'token',
    )

  const [
    complete,
    setComplete,
  ] =
    useState(false)

  const [
    serverError,
    setServerError,
  ] =
    useState<string | null>(
      null,
    )

  const form =
    useForm<FormValues>({
      resolver:
        zodResolver(
          schema,
        ),

      defaultValues: {
        password: '',
        confirmPassword: '',
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
    values: FormValues,
  ) {
    if (!token) {
      return
    }

    setServerError(
      null,
    )

    try {
      await resetPassword({
        token,
        new_password:
          values.password,
      })

      setComplete(
        true,
      )
    } catch (
      error
    ) {
      setServerError(
        error instanceof
          ApiError
          ? error.message
          : 'Unable to reset your password. Please request a new reset link.',
      )
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-8">
          <Brand size="large" />
        </div>

        <Card className="p-6 sm:p-8">
          {complete ? (
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2
                  size={22}
                  aria-hidden="true"
                />
              </div>

              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                Password updated
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your password has been reset and existing sessions have been signed out.
              </p>

              <Link
                to="/login"
                state={{
                  passwordReset:
                    true,
                }}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Sign in with new password
              </Link>
            </div>
          ) : !token ? (
            <div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-danger-50 text-danger-700">
                <KeyRound
                  size={20}
                  aria-hidden="true"
                />
              </div>

              <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                Reset link missing
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page needs a valid password reset link from your email.
              </p>

              <Link
                to="/forgot-password"
                className="mt-6 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <>
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <KeyRound
                  size={20}
                  aria-hidden="true"
                />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                Account recovery
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Choose a new password
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use between 8 and 128 characters. Your existing sessions will be signed out after the reset.
              </p>

              {serverError && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm leading-6 text-danger-700"
                >
                  {serverError}
                </div>
              )}

              <form
                className="mt-6 grid gap-5"
                onSubmit={
                  form.handleSubmit(
                    onSubmit,
                  )
                }
              >
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  error={
                    form.formState.errors.password
                      ?.message
                  }
                  {...form.register(
                    'password',
                  )}
                />

                <Input
                  label="Confirm new password"
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

                      Updating password
                    </>
                  ) : (
                    'Reset password'
                  )}
                </Button>
              </form>
            </>
          )}

          <LegalAuthLinks className="mt-6" />
        </Card>
      </div>
    </main>
  )
}
