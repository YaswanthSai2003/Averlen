import type { HTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

import { cn } from '../../lib/cn'

type SpinnerSize = 'sm' | 'md' | 'lg'

type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: SpinnerSize
  label?: string
}

const sizes: Record<SpinnerSize, number> = {
  sm: 16,
  md: 20,
  lg: 28,
}

export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center justify-center text-brand-600',
        className,
      )}
      {...props}
    >
      <LoaderCircle
        size={sizes[size]}
        className="animate-spin"
        aria-hidden="true"
      />

      <span className="sr-only">
        {label}
      </span>
    </span>
  )
}