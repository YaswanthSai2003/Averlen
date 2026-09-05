import {
  Info,
} from 'lucide-react'

import type {
  PropertySummary,
} from '../../../api/properties'
import {
  Card,
} from '../../../components/ui'

type PropertyIdReferenceProps = {
  properties: PropertySummary[]
}

export function PropertyIdReference({
  properties,
}: PropertyIdReferenceProps) {
  if (properties.length === 0) {
    return null
  }

  const sortedProperties = [
    ...properties,
  ].sort((left, right) =>
    left.property_code.localeCompare(
      right.property_code,
      undefined,
      {
        numeric: true,
        sensitivity: 'base',
      },
    ),
  )

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-2.5 border-b border-slate-200 px-4 py-3 sm:px-5">
        <Info
          size={17}
          className="mt-0.5 shrink-0 text-brand-600"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-950">
            Property IDs
          </h3>

          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Use the matching Property ID in the CSV{' '}
            <code className="font-mono text-[11px] text-slate-700">
              property_code
            </code>{' '}
            column.
          </p>
        </div>
      </div>

      <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-5">
        {sortedProperties.map((property, index) => (
          <div
            key={property.property_id}
            className={[
              'flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5',
              index >= 2 ? 'sm:border-t sm:border-slate-200' : '',
              index >= 3 ? 'lg:border-t lg:border-slate-200' : '',
              index >= 5 ? 'xl:border-t xl:border-slate-200' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="w-14 shrink-0 font-mono text-xs font-semibold tracking-wide text-brand-700">
              {property.property_code}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {property.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {property.city}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
