import type { InputHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  className,
  id,
  label,
  error,
  hint,
  ...props
}: InputProps) {
  const generatedId =
    id ??
    (label
      ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : undefined)

  const describedBy =
    error && generatedId
      ? `${generatedId}-error`
      : hint && generatedId
        ? `${generatedId}-hint`
        : undefined

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={generatedId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <input
        id={generatedId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'outline-none transition',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
          error
            ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-50'
            : 'border-slate-300',
          className,
        )}
        {...props}
      />

      {error ? (
        <p
          id={
            generatedId
              ? `${generatedId}-error`
              : undefined
          }
          className="mt-1.5 text-sm text-danger-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={
            generatedId
              ? `${generatedId}-hint`
              : undefined
          }
          className="mt-1.5 text-sm text-slate-500"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}