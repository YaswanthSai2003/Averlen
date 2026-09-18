import {
  useState,
  type InputHTMLAttributes,
} from 'react'

import {
  Eye,
  EyeOff,
} from 'lucide-react'

import {
  cn,
} from '../../lib/cn'


type InputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string
    error?: string
    hint?: string
    showPasswordToggle?: boolean
  }


export function Input({
  className,
  id,
  label,
  error,
  hint,
  type,
  disabled,
  showPasswordToggle = false,
  ...props
}: InputProps) {
  const [
    passwordVisible,
    setPasswordVisible,
  ] =
    useState(false)

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

  const canTogglePassword =
    showPasswordToggle &&
    type === 'password'

  const resolvedType =
    canTogglePassword &&
    passwordVisible
      ? 'text'
      : type

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

      <div className="relative">
        <input
          id={generatedId}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'outline-none transition',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
            canTogglePassword
              ? 'pr-11'
              : '',
            error
              ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-50'
              : 'border-slate-300',
            className,
          )}
          {...props}
        />

        {canTogglePassword && (
          <button
            type="button"
            disabled={disabled}
            aria-label={
              passwordVisible
                ? 'Hide password'
                : 'Show password'
            }
            aria-pressed={passwordVisible}
            className="
              absolute
              inset-y-0
              right-0
              flex
              w-11
              cursor-pointer
              items-center
              justify-center
              text-slate-400
              transition
              hover:text-slate-700
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-inset
              focus-visible:ring-brand-500
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            onClick={() => {
              setPasswordVisible(
                (
                  current,
                ) =>
                  !current,
              )
            }}
          >
            {passwordVisible ? (
              <EyeOff
                size={17}
                aria-hidden="true"
              />
            ) : (
              <Eye
                size={17}
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>

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
