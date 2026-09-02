import type { InputHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

type CheckboxProps =
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type'
  > & {
    label: string
    error?: string
  }

export function Checkbox({
  id,
  label,
  error,
  className,
  ...props
}: CheckboxProps) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className={cn(
            'mt-0.5 size-4 shrink-0 rounded border-slate-300',
            'accent-brand-600',
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-brand-500',
            'focus-visible:ring-offset-2',
            className,
          )}
          {...props}
        />

        <span className="text-sm leading-5 text-slate-600">
          {label}
        </span>
      </label>

      {error && (
        <p className="ml-7 mt-1.5 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}