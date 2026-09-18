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
  Mail,
} from 'lucide-react'

import {
  Link,
  Navigate,
} from 'react-router'

import {
  z,
} from 'zod'

import {
  requestPasswordReset,
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
    email:
      z.string()
        .trim()
        .email(
          'Enter a valid email address.',
        ),
  })


type FormValues =
  z.infer<
    typeof schema
  >


export function ForgotPasswordPage() {
  const {
    status,
  } =
    useAuth()

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

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
        email: '',
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
    setServerError(
      null,
    )
    setSuccessMessage(
      null,
    )

    try {
      const response =
        await requestPasswordReset(
          values.email,
        )

      setSuccessMessage(
        response.message,
      )
    } catch (
      error
    ) {
      setServerError(
        error instanceof
          ApiError
          ? error.message
          : 'Unable to request a password reset. Please try again.',
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
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Mail
              size={20}
              aria-hidden="true"
            />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            Account recovery
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Forgot your password?
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter your email and we’ll send a secure password reset link if an Averlen account exists for it.
          </p>

          <form
            className="mt-6 grid gap-5"
            onSubmit={
              form.handleSubmit(
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
                form.formState.errors.email
                  ?.message
              }
              {...form.register(
                'email',
              )}
            />

            {successMessage && (
              <div
                role="status"
                className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm leading-6 text-success-700"
              >
                {successMessage}
              </div>
            )}

            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm leading-6 text-danger-700"
              >
                {serverError}
              </div>
            )}

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

                  Sending reset link
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{' '}

            <Link
              to="/login"
              className="font-medium text-brand-700 hover:text-brand-800"
            >
              Back to sign in
            </Link>
          </p>

          <LegalAuthLinks className="mt-6" />
        </Card>
      </div>
    </main>
  )
}
