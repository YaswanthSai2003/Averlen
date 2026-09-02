import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Download,
  FileSpreadsheet,
  History,
  Upload,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  ApiError,
} from '../../api/client'

import {
  getBookingSampleUrl,
  getBookingTemplateUrl,
  getImportJob,
  getImportJobErrors,
  getImportJobQuality,
  getImportJobsPage,
  previewBookingUpload,
  processBookingUpload,
  type ColumnMappingRequest,
  type CsvPreviewResponse,
} from '../../api/imports'

import {
  getPropertySummaryPage,
} from '../../api/properties'

import {
  PageHeader,
} from '../../components/layout'

import {
  Button,
  Card,
  ErrorState,
  Spinner,
} from '../../components/ui'

import {
  toast,
} from '../../lib/toast'

import {
  useAuth,
} from '../auth/auth-context'

import {
  ImportJobResult,
} from './ImportJobResult'

import {
  ImportPreview,
} from './ImportPreview'


const MAX_FILE_SIZE =
  5 * 1024 * 1024


const UPLOAD_ROLES =
  new Set([
    'ORG_ADMIN',
    'REVENUE_MANAGER',
  ])


const TERMINAL_JOB_STATUSES =
  new Set([
    'completed',
    'completed_with_errors',
    'failed',
  ])


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  if (
    error instanceof Error
  ) {
    return error.message
  }

  return fallback
}


function downloadFile(
  url: string,
) {
  const anchor =
    document.createElement(
      'a',
    )

  anchor.href = url
  anchor.rel = 'noopener'

  document.body.appendChild(
    anchor,
  )

  anchor.click()
  anchor.remove()
}


function formatDate(
  value:
    string |
    null |
    undefined,
) {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}


function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-IN',
  ).format(value)
}


function formatStatus(
  status: string,
) {
  return status
    .replaceAll(
      '_',
      ' ',
    )
}


function getStatusClasses(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case 'completed':
      return (
        'bg-emerald-50 ' +
        'text-emerald-700'
      )

    case 'completed_with_errors':
      return (
        'bg-amber-50 ' +
        'text-amber-700'
      )

    case 'failed':
      return (
        'bg-red-50 ' +
        'text-red-700'
      )

    case 'processing':
    case 'pending':
    case 'queued':
      return (
        'bg-brand-50 ' +
        'text-brand-700'
      )

    default:
      return (
        'bg-slate-100 ' +
        'text-slate-600'
      )
  }
}


export function ImportsPage() {
  const {
    user,
    demoReadOnly,
  } = useAuth()

  const navigate =
    useNavigate()

  const queryClient =
    useQueryClient()

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    )


  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    fileError,
    setFileError,
  ] =
    useState<
      string |
      null
    >(null)

  const [
    preview,
    setPreview,
  ] =
    useState<
      CsvPreviewResponse |
      null
    >(null)

  const [
    jobId,
    setJobId,
  ] =
    useState<
      number |
      null
    >(null)


  const canUpload =
    user &&
    !demoReadOnly
      ? UPLOAD_ROLES.has(
          user.role,
        )
      : false


  const propertiesQuery =
    useQuery({
      queryKey: [
        'properties',
        'import-reference',
      ],

      queryFn: () =>
        getPropertySummaryPage(
          100,
          0,
        ),
    })


  const jobsQuery =
    useQuery({
      queryKey: [
        'imports',
        'jobs',
        {
          limit: 5,
          offset: 0,
        },
      ],

      queryFn: () =>
        getImportJobsPage(
          5,
          0,
        ),
    })


  const previewMutation =
    useMutation({
      mutationFn:
        previewBookingUpload,

      onSuccess:
        (
          data,
        ) => {
          setPreview(data)
          setJobId(null)
          setFileError(null)
        },
    })


  const processMutation =
    useMutation({
      mutationFn:
        processBookingUpload,

      onSuccess:
        (
          data,
        ) => {
          setJobId(
            data.job_id,
          )

          void queryClient
            .invalidateQueries({
              queryKey: [
                'imports',
                'jobs',
              ],
            })

          toast.success(
            'Import started',
            {
              description:
                'Your booking data is being processed.',
            },
          )
        },
    })


  const jobQuery =
    useQuery({
      queryKey: [
        'imports',
        'job',
        jobId,
      ],

      queryFn: () =>
        getImportJob(
          jobId!,
        ),

      enabled:
        jobId !== null,

      refetchInterval:
        (
          query,
        ) => {
          const status =
            query.state.data
              ?.status
              ?.toLowerCase()

          if (
            status &&
            TERMINAL_JOB_STATUSES
              .has(status)
          ) {
            return false
          }

          return 1500
        },
    })


  const terminalStatus =
    jobQuery.data
      ?.status
      ?.toLowerCase()


  const isTerminal =
    terminalStatus
      ? TERMINAL_JOB_STATUSES
          .has(
            terminalStatus,
          )
      : false


  const qualityQuery =
    useQuery({
      queryKey: [
        'imports',
        'quality',
        jobId,
      ],

      queryFn: () =>
        getImportJobQuality(
          jobId!,
        ),

      enabled:
        jobId !== null &&
        isTerminal,
    })


  const errorsQuery =
    useQuery({
      queryKey: [
        'imports',
        'errors',
        jobId,
      ],

      queryFn: () =>
        getImportJobErrors(
          jobId!,
        ),

      enabled:
        jobId !== null &&
        isTerminal &&
        (
          jobQuery.data
            ?.failed_rows ??
          0
        ) > 0,
    })


  useEffect(
    () => {
      const completedImport =
        terminalStatus ===
          'completed' ||
        terminalStatus ===
          'completed_with_errors'

      if (!completedImport) {
        return
      }

      void Promise.all([
        queryClient
          .invalidateQueries({
            queryKey: [
              'analytics',
            ],
          }),

        queryClient
          .invalidateQueries({
            queryKey: [
              'properties',
            ],
          }),

        queryClient
          .invalidateQueries({
            queryKey: [
              'imports',
              'jobs',
            ],
          }),
      ])
    },
    [
      terminalStatus,
      queryClient,
    ],
  )


  function resetImport() {
    setSelectedFile(null)
    setFileError(null)
    setPreview(null)
    setJobId(null)

    previewMutation.reset()
    processMutation.reset()

    if (
      fileInputRef.current
    ) {
      fileInputRef
        .current
        .value = ''
    }

    void queryClient
      .invalidateQueries({
        queryKey: [
          'imports',
          'jobs',
        ],
      })
  }


  function validateFile(
    file: File,
  ) {
    const lowerName =
      file.name
        .toLowerCase()

    const isCsv =
      lowerName.endsWith(
        '.csv',
      ) ||
      file.type ===
        'text/csv' ||
      file.type ===
        'application/csv' ||
      file.type ===
        'application/vnd.ms-excel'

    if (!isCsv) {
      return (
        'Only CSV files ' +
        'are accepted.'
      )
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return (
        'The CSV file must ' +
        'be 5 MB or smaller.'
      )
    }

    return null
  }


  function handleFileChange(
    event:
      ChangeEvent<
        HTMLInputElement
      >,
  ) {
    const file =
      event.target
        .files?.[0]

    if (!file) {
      return
    }

    const error =
      validateFile(
        file,
      )

    if (error) {
      setSelectedFile(null)
      setFileError(error)

      event.target.value =
        ''

      return
    }

    setSelectedFile(file)
    setFileError(null)

    previewMutation.reset()
  }


  async function handlePreview() {
    if (!selectedFile) {
      return
    }

    await previewMutation
      .mutateAsync(
        selectedFile,
      )
  }


  async function handleProcess(
    mapping:
      ColumnMappingRequest,
  ) {
    await processMutation
      .mutateAsync(
        mapping,
      )
  }


  function openPreviousJob(
    nextJobId: number,
  ) {
    setSelectedFile(null)
    setPreview(null)
    setFileError(null)

    setJobId(
      nextJobId,
    )
  }


  const properties =
    propertiesQuery.data
      ?.items ??
    []


  const currentJob =
    jobQuery.data


  const previewError =
    previewMutation.isError
      ? getErrorMessage(
          previewMutation.error,
          'Unable to preview the CSV file.',
        )
      : null


  const processError =
    processMutation.isError
      ? getErrorMessage(
          processMutation.error,
          'Unable to start the booking import.',
        )
      : null


  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Operations"
        title="Data imports"
        description="Upload booking data, validate CSV columns and track ingestion quality."
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                downloadFile(
                  getBookingTemplateUrl(),
                )
              }}
            >
              <Download
                size={16}
                aria-hidden="true"
              />

              CSV template
            </Button>


            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                downloadFile(
                  getBookingSampleUrl(),
                )
              }}
            >
              <FileSpreadsheet
                size={16}
                aria-hidden="true"
              />

              Sample data
            </Button>
          </div>
        }
      />


      <div className="mt-8 min-w-0">
        {jobId &&
        currentJob ? (
          <ImportJobResult
            job={
              currentJob
            }
            quality={
              qualityQuery.data
            }
            errors={
              errorsQuery.data
            }
            onViewAnalytics={() => {
              navigate(
                '/app/analytics',
              )
            }}
            onStartAnother={
              resetImport
            }
            onBackToImports={
              resetImport
            }
          />
        ) : preview ? (
          <ImportPreview
            key={
              preview.upload_id
            }
            preview={
              preview
            }
            properties={
              properties
            }
            processing={
              processMutation
                .isPending
            }
            errorMessage={
              processError
            }
            onBack={
              resetImport
            }
            onProcess={
              handleProcess
            }
          />
        ) : (
          <UploadPanel
            readOnly={
              demoReadOnly
            }
            canUpload={
              canUpload
            }
            selectedFile={
              selectedFile
            }
            fileError={
              fileError
            }
            previewError={
              previewError
            }
            previewPending={
              previewMutation
                .isPending
            }
            fileInputRef={
              fileInputRef
            }
            onFileChange={
              handleFileChange
            }
            onChooseFile={() => {
              fileInputRef
                .current
                ?.click()
            }}
            onPreview={() => {
              void handlePreview()
            }}
          />
        )}


        {!preview &&
          !jobId && (
          <RecentImports
            isLoading={
              jobsQuery.isLoading
            }
            isError={
              jobsQuery.isError
            }
            jobs={
              jobsQuery.data
                ?.items ??
              []
            }
            onRetry={() => {
              void jobsQuery
                .refetch()
            }}
            onView={
              openPreviousJob
            }
          />
        )}
      </div>
    </div>
  )
}


type UploadPanelProps = {
  readOnly?: boolean

  canUpload: boolean

  selectedFile:
    File |
    null

  fileError:
    string |
    null

  previewError:
    string |
    null

  previewPending: boolean

  fileInputRef:
    React.RefObject<
      HTMLInputElement |
      null
    >

  onFileChange:
    (
      event:
        ChangeEvent<
          HTMLInputElement
        >,
    ) => void

  onChooseFile:
    () => void

  onPreview:
    () => void
}


function UploadPanel({
  readOnly = false,
  canUpload,
  selectedFile,
  fileError,
  previewError,
  previewPending,
  fileInputRef,
  onFileChange,
  onChooseFile,
  onPreview,
}: UploadPanelProps) {
  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Upload
              size={22}
              aria-hidden="true"
            />
          </div>


          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            Booking data
          </p>


          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Upload booking CSV
          </h2>


          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Upload your own booking
            data or use the Averlen
            sample file to explore the
            import workflow.
          </p>


          {!canUpload ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {readOnly
                ? 'The demo workspace can review seeded import history and data quality, but uploading or processing new CSV files is disabled.'
                : 'Your workspace role can review import history, but only an organization admin or revenue manager can upload booking data.'}
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={
                    onFileChange
                  }
                />

                <div className="flex flex-col items-center text-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <FileSpreadsheet
                      size={20}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-4 max-w-full truncate text-sm font-medium text-slate-900">
                    {selectedFile
                      ? selectedFile.name
                      : 'Choose a CSV file'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Maximum file size
                    5 MB
                  </p>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    disabled={
                      previewPending
                    }
                    onClick={
                      onChooseFile
                    }
                  >
                    Choose file
                  </Button>
                </div>
              </div>


              {fileError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {fileError}
                </div>
              )}


              {previewError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {
                    previewError
                  }
                </div>
              )}


              <Button
                className="mt-5 w-full sm:w-auto"
                disabled={
                  !selectedFile ||
                  previewPending
                }
                onClick={
                  onPreview
                }
              >
                {previewPending ? (
                  <>
                    <Spinner
                      size="sm"
                      className="text-white"
                    />

                    Reading CSV
                  </>
                ) : (
                  <>
                    Preview data

                    <Upload
                      size={16}
                      aria-hidden="true"
                    />
                  </>
                )}
              </Button>
            </>
          )}
        </div>


        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6 lg:p-8 xl:border-l xl:border-t-0">
          <p className="text-sm font-semibold text-slate-950">
            Required CSV fields
          </p>

          <div className="mt-5 grid gap-4">
            {[
              'property_id',
              'check_in',
              'check_out',
              'price',
              'booked_on',
            ].map(
              (
                field,
                index,
              ) => (
                <div
                  key={
                    field
                  }
                  className="flex items-center gap-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {index + 1}
                  </span>

                  <code className="text-sm text-slate-700">
                    {field}
                  </code>
                </div>
              ),
            )}
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            Column names do not need
            to match exactly. You can
            map your CSV columns after
            previewing the file.
          </p>
        </div>
      </div>
    </Card>
  )
}


type RecentImportJob = {
  job_id: number
  filename: string
  status: string
  total_rows: number
  processed_rows: number
  failed_rows: number
  created_at:
    string |
    null |
    undefined
}


type RecentImportsProps = {
  isLoading: boolean
  isError: boolean
  jobs: RecentImportJob[]
  onRetry: () => void
  onView:
    (
      jobId: number,
    ) => void
}


function RecentImports({
  isLoading,
  isError,
  jobs,
  onRetry,
  onView,
}: RecentImportsProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <History
          size={18}
          className="text-slate-500"
          aria-hidden="true"
        />

        <h2 className="text-base font-semibold text-slate-950">
          Recent imports
        </h2>
      </div>


      {isLoading ? (
        <Card className="flex min-h-40 items-center justify-center">
          <Spinner />
        </Card>
      ) : isError ? (
        <ErrorState
          title="Unable to load import history"
          description="Averlen couldn't load recent booking imports."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={
                onRetry
              }
            >
              Try again
            </Button>
          }
        />
      ) : jobs.length > 0 ? (
        <Card className="min-w-0 overflow-hidden">
          <div className="grid gap-3 p-4 md:hidden">
            {jobs.map(
              (
                job,
              ) => (
                <article
                  key={
                    job.job_id
                  }
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <FileSpreadsheet
                        size={17}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {
                          job.filename
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Job #{job.job_id}
                        {' · '}
                        {formatDate(
                          job.created_at,
                        )}
                      </p>
                    </div>

                    <span
                      className={`
                        inline-flex
                        shrink-0
                        rounded-full
                        px-2.5
                        py-1
                        text-xs
                        font-medium
                        capitalize
                        ${getStatusClasses(
                          job.status,
                        )}
                      `}
                    >
                      {formatStatus(
                        job.status,
                      )}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Rows
                      </dt>

                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {formatNumber(
                          job.total_rows,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Imported
                      </dt>

                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {formatNumber(
                          job.processed_rows,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Failed
                      </dt>

                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {formatNumber(
                          job.failed_rows,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      onView(
                        job.job_id,
                      )
                    }}
                  >
                    View import
                  </Button>
                </article>
              ),
            )}
          </div>


          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <TableHeading>
                    File
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Rows
                  </TableHeading>

                  <TableHeading>
                    Imported
                  </TableHeading>

                  <TableHeading>
                    Failed
                  </TableHeading>

                  <TableHeading>
                    Created
                  </TableHeading>

                  <th className="w-24 px-5 py-3">
                    <span className="sr-only">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>


              <tbody>
                {jobs.map(
                  (
                    job,
                  ) => (
                    <tr
                      key={
                        job.job_id
                      }
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-48 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <FileSpreadsheet
                              size={17}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {
                                job.filename
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Job #
                              {
                                job.job_id
                              }
                            </p>
                          </div>
                        </div>
                      </td>


                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            capitalize
                            ${getStatusClasses(
                              job.status,
                            )}
                          `}
                        >
                          {formatStatus(
                            job.status,
                          )}
                        </span>
                      </td>


                      <TableValue>
                        {formatNumber(
                          job.total_rows,
                        )}
                      </TableValue>

                      <TableValue>
                        {formatNumber(
                          job.processed_rows,
                        )}
                      </TableValue>

                      <TableValue>
                        {formatNumber(
                          job.failed_rows,
                        )}
                      </TableValue>


                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDate(
                          job.created_at,
                        )}
                      </td>


                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onView(
                              job.job_id,
                            )
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <FileSpreadsheet
            size={26}
            className="mx-auto text-slate-400"
            aria-hidden="true"
          />

          <h3 className="mt-3 text-sm font-semibold text-slate-950">
            No imports yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your booking CSV import
            history will appear here.
          </p>
        </Card>
      )}
    </section>
  )
}


function TableHeading({
  children,
}: {
  children:
    React.ReactNode
}) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  )
}


function TableValue({
  children,
}: {
  children:
    React.ReactNode
}) {
  return (
    <td className="px-5 py-4 text-sm text-slate-700">
      {children}
    </td>
  )
}
