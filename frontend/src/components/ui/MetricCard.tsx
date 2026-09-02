import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

type ChangeTone = 'positive' | 'negative' | 'neutral'

type MetricCardProps = {
  label: string
  value: string
  description?: string
  change?: string
  changeTone?: ChangeTone
  icon?: ReactNode
  className?: string
}

const changeToneClasses: Record<ChangeTone, string> = {
  positive: 'text-success-700',
  negative: 'text-danger-700',
  neutral: 'text-slate-500',
}

export function MetricCard({
  label,
  value,
  description,
  change,
  changeTone = 'neutral',
  icon,
  className,
}: MetricCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 [font-variant-numeric:tabular-nums]">
            {value}
          </p>
        </div>

        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {icon}
          </div>
        )}
      </div>

      {(change || description) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {change && (
            <span className={cn('font-medium', changeToneClasses[changeTone])}>
              {change}
            </span>
          )}

          {description && (
            <span className="text-slate-500">
              {description}
            </span>
          )}
        </div>
      )}
    </section>
  )
}