import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const CONFIGURED_API_BASE_URL =
  (
    import.meta.env
      .VITE_API_BASE_URL as
      | string
      | undefined
  )
    ?.trim()
    .replace(
      /\/+$/,
      '',
    ) ?? ''

const API_BASE_URL =
  CONFIGURED_API_BASE_URL ||
  (
    import.meta.env.DEV
      ? 'http://127.0.0.1:8000'
      : ''
  )

const READY_URL =
  API_BASE_URL
    ? `${API_BASE_URL}/readyz`
    : ''

const RETRY_DELAYS_MS = [
  1_200,
  1_800,
  2_500,
  3_500,
  5_000,
]

const REQUEST_TIMEOUT_MS =
  9_000

type BackendWakeGateProps = {
  children: ReactNode
}

export function BackendWakeGate({
  children,
}: BackendWakeGateProps) {
  const [
    ready,
    setReady,
  ] =
    useState(
      READY_URL === '',
    )

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] =
    useState(0)

  const [
    retryKey,
    setRetryKey,
  ] =
    useState(0)

  const [
    online,
    setOnline,
  ] =
    useState(
      typeof navigator ===
        'undefined'
        ? true
        : navigator.onLine,
    )

  useEffect(
    () => {
      if (!READY_URL) {
        return
      }

      let active =
        true

      let retryTimer:
        ReturnType<
          typeof setTimeout
        > |
        null =
        null

      let requestController:
        AbortController |
        null =
        null

      let attemptIndex =
        0

      const startedAt =
        Date.now()

      const elapsedTimer =
        setInterval(
          () => {
            if (!active) {
              return
            }

            setElapsedSeconds(
              Math.floor(
                (
                  Date.now() -
                  startedAt
                ) /
                  1_000,
              ),
            )
          },
          1_000,
        )

      async function checkReady() {
        if (
          !active ||
          !navigator.onLine
        ) {
          return
        }

        requestController
          ?.abort()

        const controller =
          new AbortController()

        requestController =
          controller

        const timeout =
          setTimeout(
            () => {
              controller.abort()
            },
            REQUEST_TIMEOUT_MS,
          )

        try {
          const response =
            await fetch(
              READY_URL,
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',

                signal:
                  controller.signal,
              },
            )

          if (
            active &&
            response.ok
          ) {
            setReady(true)
            return
          }
        } catch {
          // Expected while the backend is
          // cold-starting or unavailable.
        } finally {
          clearTimeout(
            timeout,
          )
        }

        if (!active) {
          return
        }

        attemptIndex +=
          1

        const delay =
          RETRY_DELAYS_MS[
            Math.min(
              attemptIndex -
                1,
              RETRY_DELAYS_MS
                .length -
                1,
            )
          ]

        retryTimer =
          setTimeout(
            () => {
              void checkReady()
            },
            delay,
          )
      }

      function handleOnline() {
        setOnline(true)

        if (retryTimer) {
          clearTimeout(
            retryTimer,
          )
        }

        void checkReady()
      }

      function handleOffline() {
        setOnline(false)
      }

      void checkReady()

      window.addEventListener(
        'online',
        handleOnline,
      )

      window.addEventListener(
        'offline',
        handleOffline,
      )

      return () => {
        active =
          false

        clearInterval(
          elapsedTimer,
        )

        if (retryTimer) {
          clearTimeout(
            retryTimer,
          )
        }

        requestController
          ?.abort()

        window.removeEventListener(
          'online',
          handleOnline,
        )

        window.removeEventListener(
          'offline',
          handleOffline,
        )
      }
    },
    [
      retryKey,
    ],
  )

  if (ready) {
    return (
      <>
        {children}
      </>
    )
  }

  const canRetry =
    online &&
    elapsedSeconds >= 20

  const eyebrow =
    online
      ? 'Secure Connection'
      : 'Connection paused'

  const title =
    online
      ? 'Preparing your workspace'
      : 'You’re offline'

  const description =
    online
      ? 'Averlen is starting secure services. This may take a few seconds after a period of inactivity.'
      : 'Averlen will resume automatically when your connection is restored.'

  const serviceLabel =
    online
      ? 'Connecting services'
      : 'Waiting for connection'

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#fbfcfe] text-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-18rem] size-[42rem] -translate-x-1/2 rounded-full bg-brand-50/80 blur-3xl" />
        <div className="absolute bottom-[-20rem] right-[-12rem] size-[34rem] rounded-full bg-slate-100 blur-3xl" />
      </div>

      <header className="relative z-10 flex h-20 items-center px-6 sm:px-10 lg:px-14">
        <img
          src="/averlen-wordmark.png"
          alt="Averlen"
          className="h-6 w-auto object-contain"
        />
      </header>

      <main className="relative z-10 grid min-h-[calc(100dvh-5rem)] place-items-center px-6 pb-24 pt-10">
        <section
          role="status"
          aria-live="polite"
          className="w-full max-w-[540px] text-center"
        >
          <img
            src="/averlen-mark.png"
            alt=""
            className="mx-auto size-16 object-contain"
          />

          <div className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
              {eyebrow}
            </p>

            <h1 className="mt-3 min-h-11 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[2.15rem]">
              {title}
            </h1>

            <p className="mx-auto mt-3 min-h-12 max-w-[470px] text-sm leading-6 text-slate-500 sm:text-[15px]">
              {description}
            </p>
          </div>

          <div className="mx-auto mt-7 h-1 w-48 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={[
                'h-full rounded-full transition-colors',
                online
                  ? 'w-2/3 animate-pulse bg-brand-600 motion-reduce:animate-none'
                  : 'w-1/3 bg-slate-400',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </div>

          <div className="mt-8 flex min-h-5 flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2
                size={14}
                className="text-emerald-600"
                aria-hidden="true"
              />

              Interface ready
            </span>

            <span
              aria-hidden="true"
              className="hidden size-1 rounded-full bg-slate-300 sm:block"
            />

            <span className="inline-flex items-center gap-1.5">
              {online ? (
                <LoaderCircle
                  size={14}
                  className="animate-spin text-brand-600 motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <WifiOff
                  size={14}
                  className="text-slate-500"
                  aria-hidden="true"
                />
              )}

              {serviceLabel}
            </span>
          </div>

          <div className="mt-8 flex h-10 items-center justify-center">
            {canRetry && (
              <button
                type="button"
                onClick={() => {
                  setElapsedSeconds(0)

                  setRetryKey(
                    (
                      current,
                    ) =>
                      current + 1,
                  )
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <RefreshCw
                  size={15}
                  aria-hidden="true"
                />

                Try again
              </button>
            )}
          </div>
        </section>
      </main>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 pb-6 text-center text-[11px] tracking-wide text-slate-400">
        Revenue intelligence for hospitality
      </footer>
    </div>
  )
}
