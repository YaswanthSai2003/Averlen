import type {
  LucideIcon,
} from 'lucide-react'

import {
  Card,
} from '../../../components/ui'


type InternalMetricProps = {
  label: string
  value: number | string
  icon: LucideIcon
  description?: string
}


export function InternalMetric({
  label,
  value,
  icon: Icon,
  description,
}: InternalMetricProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon
            size={18}
            aria-hidden="true"
          />
        </div>
      </div>
    </Card>
  )
}
