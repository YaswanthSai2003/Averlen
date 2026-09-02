import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral:
          'bg-slate-100 text-slate-700',

        brand:
          'bg-brand-50 text-brand-700',

        success:
          'bg-success-50 text-success-700',

        warning:
          'bg-warning-50 text-warning-700',

        danger:
          'bg-danger-50 text-danger-700',
      },
    },

    defaultVariants: {
      variant: 'neutral',
    },
  },
)

type BadgeProps =
  HTMLAttributes<HTMLSpanElement> &
    VariantProps<typeof badgeVariants>

export function Badge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        className,
      )}
      {...props}
    />
  )
}