import {
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'

import { useNavigate } from 'react-router'

import {
  Button,
  Card,
} from '../../components/ui'

export function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-warning-50 text-warning-700">
          <ShieldAlert
            size={22}
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
          Access restricted
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your workspace role does not have permission
          to access this section.
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => navigate('/app')}
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Back to overview
          </Button>
        </div>
      </Card>
    </div>
  )
}