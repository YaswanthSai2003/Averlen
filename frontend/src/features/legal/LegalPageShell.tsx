import type {
  ReactNode,
} from 'react'

import {
  ArrowLeft,
} from 'lucide-react'
import {
  Link,
} from 'react-router'

import {
  Brand,
} from '../../components/layout'


type LegalPageShellProps = {
  eyebrow: string
  title: string
  effectiveDate: string
  intro: string
  children: ReactNode
}


export function LegalPageShell({
  eyebrow,
  title,
  effectiveDate,
  intro,
  children,
}: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Brand />

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
            />
            Back to sign in
          </Link>
        </div>

        <article className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-6 py-7 sm:px-8 sm:py-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              {eyebrow}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {intro}
            </p>

            <p className="mt-4 text-xs font-medium text-slate-400">
              Effective version: {effectiveDate}
            </p>
          </header>

          <div className="space-y-8 px-6 py-7 text-sm leading-7 text-slate-600 sm:px-8 sm:py-9 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-950 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500 sm:px-8">
            <Link
              to="/terms"
              className="font-medium transition hover:text-brand-700"
            >
              Terms of Service
            </Link>

            <Link
              to="/privacy"
              className="font-medium transition hover:text-brand-700"
            >
              Privacy Policy
            </Link>
          </footer>
        </article>
      </div>
    </main>
  )
}
