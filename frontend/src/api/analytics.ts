import { z } from 'zod'

import {
  apiRequest,
} from './client'


export type AnalyticsQuery = {
  startDate?: string
  endDate?: string
  compare?: boolean
}


export type AnalyticsCsvExport = {
  csv: string
  filename: string
}


const topPropertySchema =
  z.object({
    id: z.number(),
    name: z.string(),
    city: z.string(),
    total_revenue: z.number(),
  })


const dashboardSummarySchema =
  z.object({
    total_revenue:
      z.number(),

    total_revenue_change_pct:
      z.number()
        .nullable()
        .optional(),

    total_bookings:
      z.number(),

    total_bookings_change_pct:
      z.number()
        .nullable()
        .optional(),

    average_booking_value:
      z.number(),

    average_booking_value_change_pct:
      z.number()
        .nullable()
        .optional(),

    total_booked_nights:
      z.number(),

    average_length_of_stay:
      z.number(),

    average_length_of_stay_change_pct:
      z.number()
        .nullable()
        .optional(),

    top_city_by_revenue:
      z.string(),

    top_property_by_revenue:
      z.union([
        z.number(),
        topPropertySchema,
      ])
        .nullable(),
  })


const trendPointSchema =
  z.object({
    date:
      z.string(),

    total_revenue:
      z.number(),

    booking_count:
      z.number(),

    booked_nights:
      z.number(),
  })


const analyticsTrendResponseSchema =
  z.object({
    trends:
      z.array(
        trendPointSchema,
      ),
  })


const performanceMetricSchema =
  z.object({
    total_revenue:
      z.number(),

    total_bookings:
      z.number(),

    total_booked_nights:
      z.number(),

    adr:
      z.number(),

    revenue_per_booked_night:
      z.number(),

    average_length_of_stay:
      z.number(),
  })


const cityPerformanceSchema =
  z.object({
    city:
      z.string(),

    total_revenue:
      z.number(),

    total_bookings:
      z.number(),

    total_booked_nights:
      z.number(),

    adr:
      z.number(),

    revenue_per_booked_night:
      z.number(),
  })


const propertyPerformanceSchema =
  z.object({
    property_id:
      z.number(),

    property_name:
      z.string(),

    city:
      z.string(),

    total_revenue:
      z.number(),

    total_bookings:
      z.number(),

    total_booked_nights:
      z.number(),

    adr:
      z.number(),

    revenue_per_booked_night:
      z.number(),
  })


const analyticsPerformanceSchema =
  z.object({
    overall:
      performanceMetricSchema,

    city_performance:
      z.array(
        cityPerformanceSchema,
      ),

    property_performance:
      z.array(
        propertyPerformanceSchema,
      ),
  })


export type DashboardSummary =
  z.infer<
    typeof dashboardSummarySchema
  >


export type TrendPoint =
  z.infer<
    typeof trendPointSchema
  >


export type AnalyticsTrendResponse =
  z.infer<
    typeof analyticsTrendResponseSchema
  >


export type AnalyticsPerformance =
  z.infer<
    typeof analyticsPerformanceSchema
  >


export type CityPerformance =
  z.infer<
    typeof cityPerformanceSchema
  >


export type PropertyPerformance =
  z.infer<
    typeof propertyPerformanceSchema
  >


function buildAnalyticsUrl(
  path: string,
  query: AnalyticsQuery = {},
) {
  const params =
    new URLSearchParams()

  if (query.startDate) {
    params.set(
      'start_date',
      query.startDate,
    )
  }

  if (query.endDate) {
    params.set(
      'end_date',
      query.endDate,
    )
  }

  if (query.compare) {
    params.set(
      'compare',
      'true',
    )
  }

  const queryString =
    params.toString()

  return queryString
    ? `${path}?${queryString}`
    : path
}


export async function getDashboardSummary(
  query: AnalyticsQuery = {},
): Promise<DashboardSummary> {
  const raw =
    await apiRequest<unknown>(
      buildAnalyticsUrl(
        '/api/analytics/dashboard-summary',
        query,
      ),
    )

  return dashboardSummarySchema.parse(
    raw,
  )
}


export async function getAnalyticsTrends(
  query: AnalyticsQuery = {},
): Promise<AnalyticsTrendResponse> {
  const raw =
    await apiRequest<unknown>(
      buildAnalyticsUrl(
        '/api/analytics/trends',
        query,
      ),
    )

  return analyticsTrendResponseSchema.parse(
    raw,
  )
}


export async function getAnalyticsPerformance(
  query: AnalyticsQuery = {},
): Promise<AnalyticsPerformance> {
  const raw =
    await apiRequest<unknown>(
      buildAnalyticsUrl(
        '/api/analytics/performance',
        query,
      ),
    )

  return analyticsPerformanceSchema.parse(
    raw,
  )
}


export async function exportAnalyticsCsv(
  query: AnalyticsQuery = {},
): Promise<AnalyticsCsvExport> {
  const csv =
    await apiRequest<string>(
      buildAnalyticsUrl(
        '/api/analytics/export/csv',
        {
          startDate:
            query.startDate,

          endDate:
            query.endDate,
        },
      ),
    )

  const filenameParts = [
    'averlen_analytics_export',
  ]

  if (query.startDate) {
    filenameParts.push(
      query.startDate,
    )
  }

  if (query.endDate) {
    filenameParts.push(
      query.endDate,
    )
  }

  return {
    csv,

    filename:
      `${filenameParts.join('_')}.csv`,
  }
}