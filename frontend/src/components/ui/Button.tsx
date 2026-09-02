import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium',
    'transition-colors',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-brand-500',
    'focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700',

        secondary:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',

        ghost:
          'text-slate-700 hover:bg-slate-100',

        danger:
          'bg-danger-600 text-white hover:bg-danger-700',
      },

      size: {
        sm: 'h-8 rounded-md px-3 text-sm',
        md: 'h-10 rounded-lg px-4 text-sm',
        lg: 'h-11 rounded-lg px-5 text-sm',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        buttonVariants({
          variant,
          size,
        }),
        className,
      )}
      {...props}
    />
  )
}