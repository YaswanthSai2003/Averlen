import {
  apiRequest,
  buildApiUrl,
} from './client'

export type CsvPreviewRow =
  Record<string, unknown>

export type CsvPreviewResponse = {
  upload_id: string
  filename: string
  columns: string[]
  preview_rows: CsvPreviewRow[]
}

export type ColumnMappingRequest = {
  upload_id: string
  property_id: string
  check_in: string
  check_out: string
  price: string
  booked_on: string
}

export type IngestionResponse = {
  job_id: number
  status: string
  message: string
}

export type JobStatusResponse = {
  job_id: number
  status: string
  total_rows: number
  processed_rows: number
  failed_rows: number

  skipped_rows?: number
  duplicate_rows?: number

  error_message?: string | null
  error_summary?: string | null

  created_at?: string | null
  completed_at?: string | null
}

export type IngestionJobRead = {
  job_id: number
  organization_id: number
  user_id?: number | null

  filename: string
  status: string

  total_rows: number
  processed_rows: number
  failed_rows: number

  skipped_rows?: number
  duplicate_rows?: number

  error_message?: string | null
  error_summary?: string | null

  created_at: string
  completed_at?: string | null
}

export type IngestionJobPageResponse = {
  items: IngestionJobRead[]
  total: number
  limit: number
  offset: number
}

export type IngestionErrorRead = {
  id: number
  job_id: number
  row_number: number
  error_message: string
  raw_data: string
}

export type IngestionErrorListResponse = {
  job_id: number
  errors: IngestionErrorRead[]
}

export type DataQualityReport = {
  job_id: number

  total_rows: number
  valid_rows: number
  failed_rows: number

  duplicate_rows: number
  skipped_rows?: number

  invalid_property_rows: number
  invalid_date_rows: number
  invalid_price_rows: number
  other_error_rows: number

  data_quality_score: number
  data_quality_level: string

  warnings: string[]
}

export async function previewBookingUpload(
  file: File,
) {
  const formData =
    new FormData()

  formData.append(
    'file',
    file,
  )

  return apiRequest<CsvPreviewResponse>(
    '/api/upload/bookings/preview',
    {
      method: 'POST',
      body: formData,
    },
  )
}

export async function processBookingUpload(
  payload: ColumnMappingRequest,
) {
  return apiRequest<IngestionResponse>(
    '/api/upload/bookings/process',
    {
      method: 'POST',
      body: payload,
    },
  )
}

export async function getImportJob(
  jobId: number,
) {
  return apiRequest<JobStatusResponse>(
    `/api/upload/jobs/${jobId}`,
  )
}

export async function getImportJobsPage(
  limit = 10,
  offset = 0,
) {
  const search =
    new URLSearchParams({
      limit:
        String(limit),

      offset:
        String(offset),
    })

  return apiRequest<IngestionJobPageResponse>(
    `/api/upload/jobs/page?${search.toString()}`,
  )
}

export async function getImportJobErrors(
  jobId: number,
) {
  return apiRequest<IngestionErrorListResponse>(
    `/api/upload/jobs/${jobId}/errors`,
  )
}

export async function getImportJobQuality(
  jobId: number,
) {
  return apiRequest<DataQualityReport>(
    `/api/upload/jobs/${jobId}/quality`,
  )
}

export function getBookingTemplateUrl() {
  return buildApiUrl(
    '/api/upload/bookings/template',
  )
}

export function getBookingSampleUrl() {
  return buildApiUrl(
    '/api/upload/bookings/sample',
  )
}