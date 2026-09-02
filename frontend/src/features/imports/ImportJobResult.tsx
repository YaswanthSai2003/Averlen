import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from 'lucide-react'

import {
  type DataQualityReport,
  type IngestionErrorListResponse,
  type JobStatusResponse,
} from '../../api/imports'

import {
  Button,
  Card,
  Spinner,
} from '../../components/ui'


type ImportJobResultProps = {
  job: JobStatusResponse

  quality?: DataQualityReport

  errors?: IngestionErrorListResponse

  onViewAnalytics: () => void

  onStartAnother: () => void

  onBackToImports: () => void
}


function formatNumber(
  value:
    number |
    undefined,
) {
  return new Intl.NumberFormat(
    'en-IN',
  ).format(
    value ?? 0,
  )
}


function isFinished(
  status: string,
) {
  return [
    'completed',
    'completed_with_errors',
    'failed',
  ].includes(
    status.toLowerCase(),
  )
}


function getProgress(
  job: JobStatusResponse,
) {
  if (
    job.total_rows <= 0
  ) {
    return 0
  }

  if (
    isFinished(
      job.status,
    )
  ) {
    return 100
  }

  // failed_rows already includes non-imported rows.
  const handledRows =
    job.processed_rows +
    job.failed_rows

  const percentage =
    Math.round(
      (
        handledRows /
        job.total_rows
      ) * 100,
    )

  return Math.min(
    99,
    Math.max(
      0,
      percentage,
    ),
  )
}


export function ImportJobResult({
  job,
  quality,
  errors,
  onViewAnalytics,
  onStartAnother,
  onBackToImports,
}: ImportJobResultProps) {
  const status =
    job.status.toLowerCase()

  const completed =
    status ===
    'completed'

  const completedWithErrors =
    status ===
    'completed_with_errors'

  const failed =
    status ===
    'failed'

  const finished =
    isFinished(
      status,
    )

  const progress =
    getProgress(
      job,
    )

  const finalizing =
    !finished &&
    progress >= 99


  return (
    <div className="grid gap-6">
      <Card className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center text-center">

            {!finished && (
              <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Spinner />
              </div>
            )}


            {completed && (
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={28}
                  aria-hidden="true"
                />
              </div>
            )}


            {completedWithErrors && (
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle
                  size={28}
                  aria-hidden="true"
                />
              </div>
            )}


            {failed && (
              <div className="flex size-14 items-center justify-center rounded-full bg-danger-50 text-danger-600">
                <XCircle
                  size={28}
                  aria-hidden="true"
                />
              </div>
            )}


            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              {completed
                ? 'Import complete'
                : completedWithErrors
                  ? 'Import complete with issues'
                  : failed
                    ? 'Import failed'
                    : finalizing
                      ? 'Finalizing booking data'
                      : 'Processing booking data'}
            </h2>


            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {completed
                ? (
                    'Your booking data has been processed and ' +
                    'Averlen analytics can now use the ' +
                    'imported records.'
                  )
                : completedWithErrors
                  ? (
                      'The import finished, but some rows were ' +
                      'skipped or require review.'
                    )
                  : failed
                    ? (
                        job.error_message ??
                        'Averlen could not complete this import.'
                      )
                    : finalizing
                      ? (
                          'All rows have been evaluated. ' +
                          'Averlen is finalizing the import.'
                        )
                      : (
                          'Averlen is validating and importing ' +
                          'your booking records.'
                        )}
            </p>


            {!finished && (
              <div className="mt-8">
                <p className="text-center text-xs leading-5 text-slate-500">
                  You can leave this page.
                  Averlen will continue processing
                  the import in the background.
                </p>

                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={
                    onBackToImports
                  }
                >
                  <ArrowLeft
                    size={16}
                    aria-hidden="true"
                  />

                  Back to imports
                </Button>
              </div>
            )}
          </div>


          {!finished && (
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>
                  {finalizing
                    ? 'Finalizing'
                    : 'Processing'}
                </span>

                <span>
                  {progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}


          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              label="Total rows"
              value={
                job.total_rows
              }
            />

            <Metric
              label="Imported"
              value={
                job.processed_rows
              }
            />

            <Metric
              label="Failed"
              value={
                job.failed_rows
              }
            />

            <Metric
              label="Skipped"
              value={
                job.skipped_rows ??
                0
              }
            />

            <Metric
              label="Duplicates"
              value={
                job.duplicate_rows ??
                0
              }
            />
          </div>


          {job.error_summary && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {
                job.error_summary
              }
            </div>
          )}


          {finished && (
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                onClick={
                  onStartAnother
                }
              >
                <RotateCcw
                  size={16}
                  aria-hidden="true"
                />

                Import another file
              </Button>


              {(completed ||
                completedWithErrors) && (
                <Button
                  onClick={
                    onViewAnalytics
                  }
                >
                  View analytics
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>


      {quality && (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                Data quality
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Import quality report
              </h2>
            </div>


            <div className="rounded-xl bg-slate-50 px-5 py-3 text-center">
              <p className="text-2xl font-semibold text-slate-950">
                {
                  quality
                    .data_quality_score
                }
                %
              </p>

              <p className="mt-0.5 text-xs capitalize text-slate-500">
                {
                  quality
                    .data_quality_level
                }
              </p>
            </div>
          </div>


          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QualityMetric
              label="Valid rows"
              value={
                quality.valid_rows
              }
            />

            <QualityMetric
              label="Failed rows"
              value={
                quality.failed_rows
              }
            />

            <QualityMetric
              label="Duplicate rows"
              value={
                quality.duplicate_rows
              }
            />

            <QualityMetric
              label="Skipped rows"
              value={
                quality.skipped_rows ??
                0
              }
            />

            <QualityMetric
              label="Property errors"
              value={
                quality
                  .invalid_property_rows
              }
            />

            <QualityMetric
              label="Date errors"
              value={
                quality
                  .invalid_date_rows
              }
            />

            <QualityMetric
              label="Price errors"
              value={
                quality
                  .invalid_price_rows
              }
            />

            <QualityMetric
              label="Other errors"
              value={
                quality
                  .other_error_rows
              }
            />
          </div>


          {quality.warnings.length >
          0 ? (
            <div className="mt-6 grid gap-2">
              {quality.warnings.map(
                (
                  warning,
                  index,
                ) => (
                  <div
                    key={
                      `${warning}-${index}`
                    }
                    className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />

                    <p className="text-sm leading-5 text-amber-800">
                      {warning}
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-6 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />

              <p className="text-sm leading-5 text-emerald-800">
                Upload data quality looks good.
              </p>
            </div>
          )}
        </Card>
      )}


      {errors &&
        errors.errors.length >
          0 && (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <h2 className="text-base font-semibold text-slate-950">
                Failed rows
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review rows that
                could not be imported.
              </p>
            </div>


            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-24 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Row
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Error
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Raw data
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {errors.errors.map(
                    (
                      error,
                    ) => (
                      <tr
                        key={
                          error.id
                        }
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          #
                          {
                            error
                              .row_number
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-danger-700">
                          {
                            error
                              .error_message
                          }
                        </td>

                        <td className="max-w-lg px-5 py-4">
                          <code className="block max-w-lg overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500">
                            {
                              error
                                .raw_data
                            }
                          </code>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
    </div>
  )
}


function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-slate-950">
        {formatNumber(
          value,
        )}
      </p>
    </div>
  )
}


function QualityMetric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-slate-950">
        {formatNumber(
          value,
        )}
      </p>
    </div>
  )
}