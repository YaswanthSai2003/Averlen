import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

type ErrorStateProps = {
  title?: string
  description: string
  action?: ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
        <TriangleAlert size={20} aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}