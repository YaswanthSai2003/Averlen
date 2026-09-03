import {
  Check,
  Copy,
  Info,
} from 'lucide-react'
import {
  useState,
} from 'react'

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
  const [
    copiedCode,
    setCopiedCode,
  ] = useState<string | null>(
    null,
  )

  if (
    properties.length ===
    0
  ) {
    return null
  }

  async function copyPropertyCode(
    propertyCode: string,
  ) {
    try {
      await navigator.clipboard
        .writeText(
          propertyCode,
        )

      setCopiedCode(
        propertyCode,
      )

      window.setTimeout(
        () => {
          setCopiedCode(
            (current) =>
              current === propertyCode
                ? null
                : current,
          )
        },
        1500,
      )
    } catch {
      setCopiedCode(null)
    }
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
            Property codes in this workspace
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Use the code beside each property in the CSV{' '}
            <code>property_code</code> column. These codes are stable
            inside your workspace; internal database IDs stay hidden.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map(
          (property) => (
            <div
              key={property.property_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {property.name}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-brand-700">
                    {property.property_code}
                  </span>
                  {' · '}
                  {property.city}
                </p>
              </div>

              <button
                type="button"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:text-slate-950"
                aria-label={`Copy property code ${property.property_code}`}
                title="Copy this code for your CSV"
                onClick={() => {
                  void copyPropertyCode(
                    property.property_code,
                  )
                }}
              >
                {copiedCode === property.property_code ? (
                  <>
                    <Check size={14} aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
          ),
        )}
      </div>
    </Card>
  )
}
