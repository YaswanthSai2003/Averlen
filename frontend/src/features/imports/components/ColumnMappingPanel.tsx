import {
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

import type {
  ColumnMappingRequest,
  CsvPreviewResponse,
} from '../../../api/imports'

import {
  Button,
  Card,
  Spinner,
} from '../../../components/ui'

import {
  CsvColumnCombobox,
} from './CsvColumnCombobox'

import {
  getSelectedColumns,
  getUnavailableColumns,
  hasUniqueMappings,
  isMappingComplete,
  MAPPING_FIELDS,
  type MappingKey,
} from '../utils/columnMapping'


type ColumnMappingPanelProps = {
  preview:
    CsvPreviewResponse

  mapping:
    ColumnMappingRequest

  initialMapping:
    ColumnMappingRequest

  processing: boolean

  errorMessage?:
    string |
    null

  onChange:
    (
      key:
        MappingKey,
      value:
        string,
    ) => void

  onBack:
    () => void

  onProcess:
    () => Promise<void>
}


export function ColumnMappingPanel({
  preview,
  mapping,
  initialMapping,
  processing,
  errorMessage,
  onChange,
  onBack,
  onProcess,
}: ColumnMappingPanelProps) {
  const selectedColumns =
    getSelectedColumns(
      mapping,
    )

  const complete =
    isMappingComplete(
      mapping,
    )

  const unique =
    hasUniqueMappings(
      mapping,
    )

  const ready =
    complete &&
    unique &&
    !processing


  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Map CSV columns
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Averlen suggests
            likely matches.
            Search and confirm
            columns detected from
            your uploaded CSV.
          </p>
        </div>


        <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {
            selectedColumns.length
          }
          {' / '}
          {
            MAPPING_FIELDS.length
          }
          {' mapped'}
        </div>
      </div>


      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {MAPPING_FIELDS.map(
          (
            field,
          ) => {
            const value =
              mapping[
                field.key
              ]

            const suggested =
              Boolean(
                value,
              ) &&
              value ===
                initialMapping[
                  field.key
                ]

            return (
              <CsvColumnCombobox
                key={
                  field.key
                }
                label={
                  field.label
                }
                description={
                  field.description
                }
                columns={
                  preview.columns
                }
                value={
                  value
                }
                disabled={
                  processing
                }
                suggested={
                  suggested
                }
                unavailableColumns={
                  getUnavailableColumns(
                    mapping,
                    field.key,
                  )
                }
                onChange={(
                  nextValue,
                ) => {
                  onChange(
                    field.key,
                    nextValue,
                  )
                }}
              />
            )
          },
        )}
      </div>


      <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-sm font-medium text-brand-900">
          Flexible column
          names supported
        </p>

        <p className="mt-1 text-xs leading-5 text-brand-700">
          Your CSV does not
          need to use exact
          Averlen names.
          For example,
          {' '}
          <code>
            arrival_date
          </code>
          {' '}
          can map to
          Check-in date and
          {' '}
          <code>
            total_amount
          </code>
          {' '}
          can map to
          Booking revenue.
        </p>
      </div>


      {!unique &&
        complete && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Each required field
          must map to a
          different CSV column.
        </div>
      )}


      {errorMessage && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}


      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={
            processing
          }
          onClick={
            onBack
          }
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
          />

          Choose another file
        </Button>


        <Button
          type="button"
          disabled={
            !ready
          }
          onClick={() => {
            void onProcess()
          }}
        >
          {processing ? (
            <>
              <Spinner
                size="sm"
                className="text-white"
              />

              Starting import
            </>
          ) : (
            <>
              Process bookings

              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}