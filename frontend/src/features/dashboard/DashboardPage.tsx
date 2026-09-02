import {
  ArrowRight,
} from 'lucide-react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  useNavigate,
} from 'react-router'

import {
  getAnalyticsPerformance,
  getAnalyticsTrends,
  getDashboardSummary,
} from '../../api/analytics'

import {
  getPropertySummaryPage,
} from '../../api/properties'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
  Button,
  ErrorState,
} from '../../components/ui'

import {
  DashboardCityRevenue,
} from './components/DashboardCityRevenue'

import {
  NoBookingsState,
  NoPropertiesState,
} from './components/DashboardEmptyStates'

import {
  DashboardLoading,
} from './components/DashboardLoading'

import {
  DashboardMetrics,
} from './components/DashboardMetrics'

import {
  DashboardPropertyPerformance,
} from './components/DashboardPropertyPerformance'

import {
  DashboardRevenueTrend,
} from './components/DashboardRevenueTrend'

import {
  formatDashboardDate,
  getTodayDateValue,
} from './utils/dashboardFormat'

import {
  useAuth,
} from '../auth/auth-context'


export function DashboardPage() {
  const {
    demoReadOnly,
  } =
    useAuth()

  const navigate =
    useNavigate()

  const today =
    getTodayDateValue()

  const propertiesQuery =
    useQuery({
      queryKey: [
        'properties',
        'summary',
        {
          limit: 1,
          offset: 0,
        },
      ],

      queryFn: () =>
        getPropertySummaryPage(
          1,
          0,
        ),

      staleTime:
        30_000,
    })

  const propertyCount =
    propertiesQuery
      .data
      ?.total ??
    0

  const dashboardQuery =
    useQuery({
      queryKey: [
        'dashboard',
        'overview',
        today,
      ],

      queryFn:
        async () => {
          const [
            summary,
            trends,
            performance,
          ] =
            await Promise.all([
              getDashboardSummary({
                endDate:
                  today,
              }),

              getAnalyticsTrends({
                endDate:
                  today,
              }),

              getAnalyticsPerformance({
                endDate:
                  today,
              }),
            ])

          return {
            summary,
            trends,
            performance,
          }
        },

      enabled:
        propertyCount > 0,

      staleTime:
        15_000,
    })

  if (
    propertiesQuery.isLoading
  ) {
    return (
      <DashboardLoading />
    )
  }

  if (
    propertiesQuery.isError
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Overview"
          title="Revenue overview"
          description="Monitor performance across your Averlen workspace."
        />

        <div className="mt-8">
          <ErrorState
            title="Unable to load properties"
            description="Averlen couldn't load the properties needed to build your dashboard."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void propertiesQuery
                    .refetch()
                }}
              >
                Try again
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (
    propertyCount === 0
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Overview"
          title="Welcome to Averlen"
          description="Set up your workspace to begin generating revenue intelligence."
          actions={
            <Badge variant="warning">
              Setup required
            </Badge>
          }
        />

        <NoPropertiesState
          readOnly={
            demoReadOnly
          }
          onAddProperty={() => {
            navigate(
              '/app/properties',
            )
          }}
        />
      </div>
    )
  }

  if (
    dashboardQuery.isLoading
  ) {
    return (
      <DashboardLoading />
    )
  }

  if (
    dashboardQuery.isError ||
    !dashboardQuery.data
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Overview"
          title="Revenue overview"
          description={`Workspace revenue snapshot through ${formatDashboardDate(
            today,
          )}.`}
        />

        <div className="mt-8">
          <ErrorState
            title="Unable to load dashboard"
            description="Averlen couldn't load your current revenue overview."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void dashboardQuery
                    .refetch()
                }}
              >
                Try again
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const {
    summary,
    trends,
    performance,
  } =
    dashboardQuery.data

  const hasBookings =
    summary.total_bookings > 0

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Overview"
        title="Revenue overview"
        description={`Workspace performance across ${propertyCount} ${
          propertyCount === 1
            ? 'property'
            : 'properties'
        } through ${formatDashboardDate(
          today,
        )}.`}
        actions={
          <>
            <Badge
              variant={
                hasBookings
                  ? 'success'
                  : 'warning'
              }
            >
              {hasBookings
                ? 'Through today'
                : 'Awaiting booking data'}
            </Badge>

            <Button
              variant="secondary"
              onClick={() => {
                navigate(
                  '/app/analytics',
                )
              }}
            >
              View analytics

              <ArrowRight
                size={15}
                aria-hidden="true"
              />
            </Button>
          </>
        }
      />

      <DashboardMetrics
        summary={
          summary
        }
      />

      {!hasBookings ? (
        <NoBookingsState
          readOnly={
            demoReadOnly
          }
          onUploadBookings={() => {
            navigate(
              '/app/imports',
            )
          }}
        />
      ) : (
        <div className="mt-6 flex min-w-0 flex-col gap-6">
          <div className="order-1 grid min-w-0 gap-6 md:order-2 md:grid-cols-2 xl:order-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
            <DashboardRevenueTrend
              trends={
                trends.trends
              }
              throughDate={
                today
              }
            />

            <DashboardCityRevenue
              cityPerformance={
                performance
                  .city_performance
              }
              topCity={
                summary
                  .top_city_by_revenue
              }
            />
          </div>

          <div className="order-2 min-w-0 md:order-1 xl:order-2">
            <DashboardPropertyPerformance
              properties={
                performance
                  .property_performance
              }
              topPropertyId={
                typeof summary
                  .top_property_by_revenue ===
                'object'
                  ? summary
                      .top_property_by_revenue
                      ?.id ??
                    null
                  : null
              }
              onOpenProperty={(
                propertyId,
              ) => {
                navigate(
                  `/app/properties/${propertyId}`,
                )
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
