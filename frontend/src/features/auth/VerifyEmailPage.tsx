import {
  type ReactNode,
  useState,
} from 'react'

import {
  zodResolver,
} from '@hookform/resolvers/zod'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  useForm,
} from 'react-hook-form'

import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MailCheck,
  RefreshCw,
} from 'lucide-react'

import {
  Link,
  useSearchParams,
} from 'react-router'

import {
  z,
} from 'zod'

import {
  requestEmailVerification,
  verifyEmail,
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


const resendSchema =
  z.object({
    email:
      z.string()
        .trim()
        .email(
          'Enter a valid email address.',
        ),
  })


type ResendForm =
  z.infer<
    typeof resendSchema
  >


function AuthFrame({
  children,
}: {
  children:
    ReactNode
}) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-slate-50">
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[-180px]
          h-[420px]
          w-[620px]
          -translate-x-1/2
          rounded-full
          bg-brand-100/40
          blur-3xl
        "
      />

      <div className="relative mx-auto flex w-full max-w-[470px] flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-8 flex justify-center">
          <Brand size="large" />
        </div>

        {children}
      </div>
    </main>
  )
}


export function VerifyEmailPage() {
  const [
    searchParams,
  ] =
    useSearchParams()

  const token =
    searchParams.get(
      'token',
    )

  const email =
    searchParams.get(
      'email',
    ) ?? ''

  const hasRegistrationEmail =
    Boolean(email)

  const [
    resendMessage,
    setResendMessage,
  ] =
    useState<
      string |
      null
    >(null)

  const [
    resendError,
    setResendError,
  ] =
    useState<
      string |
      null
    >(null)

  const form =
    useForm<ResendForm>({
      resolver:
        zodResolver(
          resendSchema,
        ),

      defaultValues: {
        email,
      },
    })

  const verificationQuery =
    useQuery({
      queryKey: [
        'auth',
        'verify-email',
        token,
      ],

      queryFn: () =>
        verifyEmail(
          token!,
        ),

      enabled:
        Boolean(
          token,
        ),

      retry:
        false,
    })


  async function handleResend(
    values: ResendForm,
  ) {
    setResendMessage(
      null,
    )

    setResendError(
      null,
    )

    const resendEmail =
      hasRegistrationEmail
        ? email
        : values.email

    try {
      await requestEmailVerification(
        resendEmail,
      )

      setResendMessage(
        hasRegistrationEmail
          ? 'Verification email sent. Check your inbox.'
          : 'If this address belongs to an account that still needs verification, a new link has been sent.',
      )
    } catch (
      error
    ) {
      setResendError(
        error instanceof
          ApiError
          ? error.message
          : 'Unable to send a new verification email. Please try again.',
      )
    }
  }


  if (token) {
    return (
      <AuthFrame>
        <Card
          className="
            overflow-hidden
            border-slate-200/80
            bg-white
            shadow-[0_24px_70px_-35px_rgba(15,23,42,0.35)]
          "
        >
          {verificationQuery.isLoading ? (
            <div className="px-7 py-12 text-center sm:px-10">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Spinner />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Email verification
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Verifying your email
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Averlen is securely confirming your verification link.
              </p>
            </div>
          ) : verificationQuery.isSuccess ? (
            <div className="px-7 py-10 text-center sm:px-10 sm:py-12">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2
                  size={26}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Verification complete
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Email verified
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Your email address has been confirmed. Your Averlen account is ready to use.
              </p>

              <Link
                to="/login"
                state={{
                  emailVerified:
                    true,
                }}
                className="
                  mt-8
                  inline-flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-brand-600
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-brand-700
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-brand-500
                  focus-visible:ring-offset-2
                "
              >
                Continue to sign in

                <ArrowRight
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            </div>
          ) : (
            <div className="px-7 py-10 sm:px-10 sm:py-12">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <MailCheck
                  size={24}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                Verification unavailable
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                This link can’t be used
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {verificationQuery.error instanceof
                  ApiError
                  ? verificationQuery.error.message
                  : 'The verification link may have expired or already been used.'}
              </p>

              <Link
                to="/verify-email"
                className="
                  mt-7
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-brand-700
                  transition
                  hover:text-brand-800
                "
              >
                Request another verification email

                <ArrowRight
                  size={15}
                  aria-hidden="true"
                />
              </Link>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <LegalAuthLinks />
          </div>
        </Card>
      </AuthFrame>
    )
  }


  return (
    <AuthFrame>
      <Card
        className="
          overflow-hidden
          border-slate-200/80
          bg-white
          shadow-[0_24px_70px_-35px_rgba(15,23,42,0.35)]
        "
      >
        <div className="px-6 py-8 sm:px-9 sm:py-10">
          <div className="flex justify-center">
            <div
              className="
                flex
                size-14
                items-center
                justify-center
                rounded-2xl
                bg-brand-50
                text-brand-700
                ring-1
                ring-brand-100
              "
            >
              <MailCheck
                size={25}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
          </div>


          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-brand-600">
              Verify your email
            </p>

            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-950">
              Check your inbox
            </h1>


            {hasRegistrationEmail ? (
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                We sent a verification link to the email address you used to create your Averlen account.
              </p>
            ) : (
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Enter your email address and we’ll send you a new verification link.
              </p>
            )}
          </div>


          <form
            className="mt-7"
            onSubmit={
              form.handleSubmit(
                handleResend,
              )
            }
          >
            {hasRegistrationEmail ? (
              <>
                <input
                  type="hidden"
                  {...form.register(
                    'email',
                  )}
                />

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50/80
                    px-4
                    py-3.5
                  "
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
                    <Mail
                      size={17}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      Verification sent to
                    </p>

                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                      {email}
                    </p>
                  </div>
                </div>


                <div className="mt-4 flex items-start gap-2.5 px-1">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-500" />

                  <p className="text-xs leading-5 text-slate-500">
                    Open the email and follow the verification link to activate sign-in.
                  </p>
                </div>
              </>
            ) : (
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
            )}


            {resendMessage && (
              <div
                role="status"
                className="
                  mt-5
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-emerald-200
                  bg-emerald-50/80
                  px-4
                  py-3
                "
              >
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Email sent
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-emerald-700">
                    {resendMessage}
                  </p>
                </div>
              </div>
            )}


            {resendError && (
              <div
                role="alert"
                className="
                  mt-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-red-700
                "
              >
                {resendError}
              </div>
            )}


            <div className="mt-7 border-t border-slate-100 pt-6">
              <p className="text-center text-xs text-slate-400">
                Didn’t receive the email?
              </p>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="mt-3 w-full"
                disabled={
                  form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Spinner
                      size="sm"
                    />

                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={16}
                      aria-hidden="true"
                    />

                    Resend verification email
                  </>
                )}
              </Button>
            </div>
          </form>


          <p className="mt-7 text-center text-sm text-slate-500">
            Already verified?{' '}

            <Link
              to="/login"
              className="font-semibold text-brand-700 transition hover:text-brand-800"
            >
              Sign in
            </Link>
          </p>
        </div>


        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <LegalAuthLinks />
        </div>
      </Card>
    </AuthFrame>
  )
}