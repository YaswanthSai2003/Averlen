import type {
  getAnalyticsPerformance,
  getAnalyticsTrends,
  getDashboardSummary,
} from '../../../api/analytics'


export type AnalyticsSummary =
  Awaited<
    ReturnType<
      typeof getDashboardSummary
    >
  >


export type AnalyticsTrendResponse =
  Awaited<
    ReturnType<
      typeof getAnalyticsTrends
    >
  >


export type AnalyticsTrendPoint =
  AnalyticsTrendResponse['trends'][number]


export type AnalyticsPerformance =
  Awaited<
    ReturnType<
      typeof getAnalyticsPerformance
    >
  >
