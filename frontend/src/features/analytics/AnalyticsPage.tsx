import {
  useState,
} from 'react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  Download,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  exportAnalyticsCsv,
  getAnalyticsPerformance,
  getAnalyticsTrends,
  getDashboardSummary,
  type AnalyticsQuery,
} from '../../api/analytics'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui'

import {
  toast,
} from '../../lib/toast'

import {
  AnalyticsDateFilter,
} from './components/AnalyticsDateFilter'

import {
  AnalyticsLoading,
} from './components/AnalyticsLoading'

import {
  AnalyticsPerformanceSection,
} from './components/AnalyticsPerformanceSection'

import {
  AnalyticsRevenueSection,
} from './components/AnalyticsRevenueSection'

import {
  AnalyticsSummaryMetrics,
} from './components/AnalyticsSummaryMetrics'

import {
  getActivePreset,
  getPeriodLabel,
  getPresetRange,
  getTodayDateValue,
} from './utils/analyticsFormat'


export function AnalyticsPage() {
  const navigate =
    useNavigate()

  const [
    today,
  ] =
    useState(
      getTodayDateValue,
    )

  const [
    appliedStartDate,
    setAppliedStartDate,
  ] =
    useState('')

  const [
    appliedEndDate,
    setAppliedEndDate,
  ] =
    useState('')

  const [
    startDate,
    setStartDate,
  ] =
    useState('')

  const [
    endDate,
    setEndDate,
  ] =
    useState('')

  const [
    isExporting,
    setIsExporting,
  ] =
    useState(false)

  const incompleteDateRange =
    Boolean(startDate) !==
    Boolean(endDate)

  const reversedDateRange =
    Boolean(
      startDate &&
      endDate &&
      endDate < startDate,
    )

  const hasPendingChanges =
    startDate !==
      appliedStartDate ||
    endDate !==
      appliedEndDate

  const canApply =
    hasPendingChanges &&
    !incompleteDateRange &&
    !reversedDateRange

  const rangeError =
    reversedDateRange
      ? 'To date must be on or after From date.'
      : undefined

  const isDefaultPeriod =
    !appliedStartDate &&
    !appliedEndDate

  const hasCustomPeriod =
    !isDefaultPeriod

  const activePreset =
    getActivePreset(
      startDate,
      endDate,
      today,
    )

  const periodLabel =
    getPeriodLabel(
      appliedStartDate,
      appliedEndDate,
    )

  const analyticsQuery:
    AnalyticsQuery = {
      startDate:
        appliedStartDate ||
        undefined,

      endDate:
        appliedEndDate ||
        undefined,

      compare:
        Boolean(
          appliedStartDate &&
          appliedEndDate,
        ),
    }

  const summaryQuery =
    useQuery({
      queryKey: [
        'analytics',
        'analytics-page',
        'summary',
        appliedStartDate,
        appliedEndDate,
      ],

      queryFn: () =>
        getDashboardSummary(
          analyticsQuery,
        ),

      placeholderData:
        (previousData) =>
          previousData,

      staleTime:
        15_000,
    })

  const trendsQuery =
    useQuery({
      queryKey: [
        'analytics',
        'analytics-page',
        'trends',
        appliedStartDate,
        appliedEndDate,
      ],

      queryFn: () =>
        getAnalyticsTrends({
          startDate:
            appliedStartDate ||
            undefined,

          endDate:
            appliedEndDate ||
            undefined,
        }),

      placeholderData:
        (previousData) =>
          previousData,

      staleTime:
        15_000,
    })

  const performanceQuery =
    useQuery({
      queryKey: [
        'analytics',
        'analytics-page',
        'performance',
        appliedStartDate,
        appliedEndDate,
      ],

      queryFn: () =>
        getAnalyticsPerformance({
          startDate:
            appliedStartDate ||
            undefined,

          endDate:
            appliedEndDate ||
            undefined,
        }),

      placeholderData:
        (previousData) =>
          previousData,

      staleTime:
        15_000,
    })

  async function handleExport() {
    if (
      isExporting
    ) {
      return
    }

    setIsExporting(true)

    try {
      const {
        csv,
        filename,
      } =
        await exportAnalyticsCsv({
          startDate:
            appliedStartDate ||
            undefined,

          endDate:
            appliedEndDate ||
            undefined,
        })

      const blob =
        new Blob(
          [csv],
          {
            type:
              'text/csv;charset=utf-8',
          },
        )

      const url =
        window.URL
          .createObjectURL(
            blob,
          )

      const anchor =
        document
          .createElement('a')

      anchor.href =
        url

      anchor.download =
        filename

      document.body
        .appendChild(
          anchor,
        )

      anchor.click()
      anchor.remove()

      window.setTimeout(
        () => {
          window.URL
            .revokeObjectURL(
              url,
            )
        },
        0,
      )

      toast.success(
        'Analytics CSV exported',
        {
          description:
            filename,
        },
      )
    } catch {
      toast.error(
        'Unable to export analytics',
        {
          description:
            "Averlen couldn't export the analytics CSV. Please try again.",
        },
      )
    } finally {
      setIsExporting(false)
    }
  }

  const isLoading =
    summaryQuery.isLoading ||
    trendsQuery.isLoading ||
    performanceQuery.isLoading

  const isUpdating =
    summaryQuery.isPlaceholderData ||
    trendsQuery.isPlaceholderData ||
    performanceQuery.isPlaceholderData

  if (isLoading) {
    return (
      <AnalyticsLoading />
    )
  }

  const hasQueryError =
    summaryQuery.isError ||
    trendsQuery.isError ||
    performanceQuery.isError

  if (
    hasQueryError ||
    !summaryQuery.data ||
    !trendsQuery.data ||
    !performanceQuery.data
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Intelligence"
          title="Analytics"
          description="Explore revenue, booking and property performance across your workspace."
        />

        <div className="mt-8">
          <ErrorState
            title="Unable to load analytics"
            description="Averlen couldn't load the analytics data for this workspace."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void Promise.all([
                    summaryQuery.refetch(),
                    trendsQuery.refetch(),
                    performanceQuery.refetch(),
                  ])
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

  const summary =
    summaryQuery.data

  const trends =
    trendsQuery.data?.trends ??
    []

  const performance =
    performanceQuery.data

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Intelligence"
        title="Analytics"
        description="Explore revenue trends and compare performance across cities and properties."
        actions={
          <>
            {isUpdating && (
              <Badge variant="brand">
                Updating
              </Badge>
            )}

            <Badge
              variant={
                isDefaultPeriod
                  ? 'success'
                  : 'brand'
              }
            >
              {isDefaultPeriod
                ? 'All time'
                : 'Custom period'}
            </Badge>

            <Button
              variant="secondary"
              disabled={
                isExporting
              }
              onClick={() => {
                void handleExport()
              }}
            >
              <Download
                size={16}
                aria-hidden="true"
              />

              {isExporting
                ? 'Exporting...'
                : 'Export CSV'}
            </Button>
          </>
        }
      />

      <AnalyticsDateFilter
        startDate={startDate}
        endDate={endDate}
        today={today}
        activePreset={
          activePreset
        }
        isDefaultPeriod={
          isDefaultPeriod
        }
        periodLabel={
          periodLabel
        }
        hasPendingChanges={
          hasPendingChanges
        }
        canApply={
          canApply
        }
        rangeError={
          rangeError
        }
        onStartDateChange={
          setStartDate
        }
        onEndDateChange={
          setEndDate
        }
        onPreset={(
          preset,
        ) => {
          const range =
            getPresetRange(
              preset,
              today,
            )

          setStartDate(
            range.startDate,
          )
          setEndDate(
            range.endDate,
          )
          setAppliedStartDate(
            range.startDate,
          )
          setAppliedEndDate(
            range.endDate,
          )
        }}
        onApply={() => {
          if (!canApply) {
            return
          }

          setAppliedStartDate(
            startDate,
          )
          setAppliedEndDate(
            endDate,
          )
        }}
        onReset={() => {
          setStartDate('')
          setEndDate('')
          setAppliedStartDate('')
          setAppliedEndDate('')
        }}
      />

      <AnalyticsSummaryMetrics
        summary={
          summary
        }
      />

      {(summary?.total_bookings ??
        0) === 0 ? (
        <Card className="mt-6">
          <EmptyState
            title={
              hasCustomPeriod
                ? 'No bookings in this period'
                : 'No booking data yet'
            }
            description={
              hasCustomPeriod
                ? 'There are no bookings with check-in dates inside the selected period.'
                : 'Import booking data to start generating revenue and performance analytics.'
            }
            action={
              hasCustomPeriod ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                    setAppliedStartDate('')
                    setAppliedEndDate('')
                  }}
                >
                  Reset period
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    navigate(
                      '/app/imports',
                    )
                  }}
                >
                  Import booking data
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Tabs
          defaultValue="revenue"
          className="mt-6"
        >
          <TabsList aria-label="Analytics sections">
            <TabsTrigger value="revenue">
              Revenue
            </TabsTrigger>

            <TabsTrigger value="performance">
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <AnalyticsRevenueSection
              summary={
                summary
              }
              trends={
                trends
              }
              periodLabel={
                periodLabel
              }
            />
          </TabsContent>

          <TabsContent value="performance">
            <AnalyticsPerformanceSection
              performance={
                performance
              }
              onOpenProperty={(
                propertyId,
              ) => {
                navigate(
                  `/app/properties/${propertyId}`,
                )
              }}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
