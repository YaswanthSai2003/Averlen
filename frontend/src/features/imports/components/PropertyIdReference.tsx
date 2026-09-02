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
  properties:
    PropertySummary[]
}


export function PropertyIdReference({
  properties,
}: PropertyIdReferenceProps) {
  if (
    properties.length ===
    0
  ) {
    return null
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex gap-3">
        <Info
          size={18}
          className="mt-0.5 shrink-0 text-brand-600"
          aria-hidden="true"
        />

        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Property IDs in
            this workspace
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Values in your CSV
            property column should
            reference these
            Averlen property IDs.
          </p>
        </div>
      </div>


      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map(
          (
            property,
          ) => (
            <div
              key={
                property
                  .property_id
              }
              className="
                rounded-lg
                border
                border-slate-200
                bg-slate-50
                px-3
                py-2.5
              "
            >
              <p className="text-sm font-medium text-slate-900">
                #
                {
                  property
                    .property_id
                }
                {' '}
                {
                  property.name
                }
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {
                  property.city
                }
              </p>
            </div>
          ),
        )}
      </div>
    </Card>
  )
}