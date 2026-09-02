import {
  ArrowRight,
  Building2,
  Upload,
} from 'lucide-react'

import {
  Button,
  Card,
} from '../../../components/ui'


type NoPropertiesStateProps = {
  readOnly?: boolean
  onAddProperty: () => void
}


export function NoPropertiesState({
  readOnly = false,
  onAddProperty,
}: NoPropertiesStateProps) {
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-6 sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Building2
              size={22}
              aria-hidden="true"
            />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            Workspace setup
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {readOnly
              ? 'Demo workspace data'
              : 'Add your first property'}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {readOnly
              ? 'This demo workspace is read-only. Explore the seeded Averlen workflow without creating or changing workspace data.'
              : 'Your Averlen workspace is ready. Start by adding a property, then import booking data to generate real revenue analytics and pricing intelligence.'}
          </p>

          {!readOnly && (
            <div className="mt-6">
              <Button
                onClick={
                  onAddProperty
                }
              >
                Add property

                <ArrowRight
                  size={16}
                  aria-hidden="true"
                />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-sm font-semibold text-slate-950">
            Getting started
          </p>

          <div className="mt-5 grid gap-5">
            <div className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                1
              </span>

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Create a property
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Add the accommodation Averlen will analyze.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                2
              </span>

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Import booking data
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Upload your CSV or use the provided sample format.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                3
              </span>

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Review intelligence
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Analytics, pricing recommendations and AI insights populate from your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}


type NoBookingsStateProps = {
  readOnly?: boolean
  onUploadBookings: () => void
}


export function NoBookingsState({
  readOnly = false,
  onUploadBookings,
}: NoBookingsStateProps) {
  return (
    <Card className="mt-6 p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Upload
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {readOnly
                ? 'No seeded bookings available'
                : 'Your properties are ready'}
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              {readOnly
                ? 'The demo workspace is read-only, so new booking data cannot be uploaded.'
                : 'Import booking data to populate revenue metrics, analytics, property comparisons and pricing recommendations.'}
            </p>
          </div>
        </div>

        {!readOnly && (
          <Button
            onClick={
              onUploadBookings
            }
          >
            Upload booking data

            <ArrowRight
              size={16}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </Card>
  )
}
