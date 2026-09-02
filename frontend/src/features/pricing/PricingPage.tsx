import {
  useState,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  useNavigate,
} from 'react-router'

import {
  LoaderCircle,
} from 'lucide-react'

import {
  ApiError,
} from '../../api/client'

import {
  generatePricingRecommendation,
  getPricingHistory,
  getPricingRecommendation,
  updatePricingRecommendationStatus,
  type PricingHistoryStatus,
} from '../../api/pricing'

import {
  getPropertySummaryPage,
} from '../../api/properties'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
} from '../../components/ui'

import {
  formatNumber,
} from '../../lib/format'

import {
  toast,
} from '../../lib/toast'

import {
  useAuth,
} from '../auth/auth-context'

import {
  PricingContextPanels,
} from './components/PricingContextPanels'

import {
  PricingFactors,
} from './components/PricingFactors'

import {
  PricingHistory,
  PRICING_HISTORY_PAGE_SIZE,
} from './components/PricingHistory'

import {
  PricingRecommendationPanel,
} from './components/PricingRecommendationPanel'

import {
  PricingPortfolioOverview,
} from './components/PricingPortfolioOverview'


const PRICING_MANAGE_ROLES =
  new Set([
    'ORG_ADMIN',
    'REVENUE_MANAGER',
  ])


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    ApiError
  ) {
    return error.message
  }

  if (
    error instanceof
    Error
  ) {
    return error.message
  }

  return fallback
}


function PricingLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />

        <Skeleton className="h-10 w-52" />

        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <Skeleton className="mt-8 h-28 rounded-xl" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <Skeleton
              key={index}
              className="h-40 rounded-xl"
            />
          ),
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />

        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}


export function PricingPage() {
  const navigate =
    useNavigate()

  const {
    user,
    demoReadOnly,
  } =
    useAuth()

  const queryClient =
    useQueryClient()


  const [
    selectedPropertyIdState,
    setSelectedPropertyId,
  ] =
    useState<
      number |
      null
    >(null)


  const [
    historyPage,
    setHistoryPage,
  ] =
    useState(1)


  const canManage =
    user &&
    !demoReadOnly
      ? PRICING_MANAGE_ROLES.has(
          user.role,
        )
      : false


  const propertiesQuery =
    useQuery({
      queryKey: [
        'properties',
        'pricing-selector',
      ],

      queryFn: () =>
        getPropertySummaryPage(
          100,
          0,
        ),

      staleTime:
        30_000,
    })


  const properties =
    propertiesQuery
      .data
      ?.items ??
    []


  const selectedStateStillExists =
    selectedPropertyIdState !==
      null &&
    properties.some(
      (property) =>
        property.property_id ===
        selectedPropertyIdState,
    )


  const selectedPropertyId =
    selectedStateStillExists
      ? selectedPropertyIdState
      : null


  const selectedProperty =
    selectedPropertyId ===
    null
      ? null
      : properties.find(
          (property) =>
            property.property_id ===
            selectedPropertyId,
        ) ??
        null


  const historyOffset =
    (
      historyPage -
      1
    ) *
    PRICING_HISTORY_PAGE_SIZE


  const recommendationQuery =
    useQuery({
      queryKey: [
        'pricing',
        'preview',
        selectedPropertyId,
      ],

      queryFn: () =>
        getPricingRecommendation(
          selectedPropertyId!,
        ),

      enabled:
        selectedPropertyId !==
        null,

      placeholderData:
        (previousData) =>
          previousData,

      staleTime:
        20_000,
    })


  const historyQuery =
    useQuery({
      queryKey: [
        'pricing',
        'history',
        selectedPropertyId,
        {
          page:
            historyPage,
        },
      ],

      queryFn: () =>
        getPricingHistory(
          selectedPropertyId!,
          PRICING_HISTORY_PAGE_SIZE,
          historyOffset,
        ),

      enabled:
        selectedPropertyId !==
        null,

      placeholderData:
        (previousData) =>
          previousData,

      staleTime:
        20_000,
    })


  const generateMutation =
    useMutation({
      mutationFn: (
        propertyId: number,
      ) =>
        generatePricingRecommendation(
          propertyId,
        ),

      onSuccess:
        async () => {
          if (
            selectedPropertyId ===
            null
          ) {
            return
          }

          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'pricing',
                  'history',
                  selectedPropertyId,
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'pricing',
                  'preview',
                  selectedPropertyId,
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])

          toast.success(
            'Pricing recommendation generated',
            {
              description:
                selectedProperty
                  ? `Saved for ${selectedProperty.name}.`
                  : undefined,
            },
          )
        },
    })


  const statusMutation =
    useMutation({
      mutationFn:
        ({
          historyId,
          status,
        }: {
          historyId: number
          status:
            PricingHistoryStatus
        }) =>
          updatePricingRecommendationStatus(
            historyId,
            status,
          ),

      onSuccess:
        async () => {
          if (
            selectedPropertyId !==
            null
          ) {
            await queryClient
              .invalidateQueries({
                queryKey: [
                  'pricing',
                  'history',
                  selectedPropertyId,
                ],
              })
          }

          toast.success(
            'Recommendation status updated',
          )
        },

      onError: (
        error,
      ) => {
        toast.error(
          'Unable to update recommendation status',
          {
            description:
              getErrorMessage(
                error,
                "Averlen couldn't update the recommendation status.",
              ),
          },
        )
      },
    })


  if (
    propertiesQuery.isLoading
  ) {
    return (
      <PricingLoading />
    )
  }


  if (
    propertiesQuery.isError
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Intelligence"
          title="Pricing"
          description="Review explainable pricing recommendations for your properties."
        />

        <div className="mt-8">
          <ErrorState
            title="Unable to load properties"
            description="Averlen couldn't load the properties required for pricing recommendations."
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
    properties.length ===
    0
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Intelligence"
          title="Pricing"
          description="Review explainable pricing recommendations for your properties."
        />

        <Card className="mt-8">
          <EmptyState
            title="No properties available"
            description="Create a property before generating pricing recommendations."
            action={
              <Button
                size="sm"
                onClick={() => {
                  navigate(
                    '/app/properties',
                  )
                }}
              >
                Go to properties
              </Button>
            }
          />
        </Card>
      </div>
    )
  }


  const recommendation =
    recommendationQuery
      .data


  const isPortfolioView =
    selectedPropertyId ===
    null


  const isSwitchingProperty =
    selectedPropertyId !==
      null &&
    (
      recommendationQuery
        .isPlaceholderData ||
      historyQuery
        .isPlaceholderData
    )


  const generateError =
    generateMutation.isError
      ? getErrorMessage(
          generateMutation.error,
          "Averlen couldn't generate and save the recommendation.",
        )
      : null


  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Intelligence"
        title="Pricing"
        description="Turn booking and market signals into explainable pricing recommendations."
        actions={
          <Badge variant="brand">
            Explainable pricing
          </Badge>
        }
      />


      <div className="mt-8 border-y border-slate-200 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Pricing scope
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {isPortfolioView
                ? `All ${formatNumber(properties.length)} properties`
                : selectedProperty
                  ? `${selectedProperty.name} · ${selectedProperty.city}`
                  : 'All properties'}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {isPortfolioView
                ? 'Compare portfolio pricing signals, then review a property in detail.'
                : 'Review the live recommendation, factors and saved pricing history.'}
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <Select
              label="View"
              value={
                selectedPropertyId ===
                null
                  ? 'all'
                  : String(
                      selectedPropertyId,
                    )
              }
              onChange={(
                event,
              ) => {
                const value =
                  event.target.value

                setSelectedPropertyId(
                  value === 'all'
                    ? null
                    : Number(
                        value,
                      ),
                )

                setHistoryPage(
                  1,
                )
              }}
            >
              <option value="all">
                All properties
              </option>

              {properties.map(
                (property) => (
                  <option
                    key={
                      property
                        .property_id
                    }
                    value={
                      property
                        .property_id
                    }
                  >
                    {property.name}
                    {' · '}
                    {property.city}
                  </option>
                ),
              )}
            </Select>
          </div>
        </div>
      </div>


      {isPortfolioView ? (
        <PricingPortfolioOverview
          properties={
            properties
          }
          onReviewProperty={(
            propertyId,
          ) => {
            setSelectedPropertyId(
              propertyId,
            )

            setHistoryPage(
              1,
            )
          }}
        />
      ) : selectedProperty ? (
        <>
          <div
            className="relative"
            aria-busy={
              isSwitchingProperty
            }
          >
            <div
              className={
                isSwitchingProperty
                  ? 'invisible'
                  : undefined
              }
            >
              {recommendationQuery.isLoading ? (
                <>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({
                      length: 4,
                    }).map(
                      (_, index) => (
                        <Skeleton
                          key={index}
                          className="h-40 rounded-xl"
                        />
                      ),
                    )}
                  </div>

                  <Skeleton className="mt-6 h-80 rounded-xl" />
                </>
              ) : recommendationQuery.isError ||
                !recommendation ? (
                <Card className="mt-6">
                  <ErrorState
                    title="Unable to load recommendation"
                    description={
                      getErrorMessage(
                        recommendationQuery
                          .error,
                        "Averlen couldn't calculate the pricing recommendation for this property.",
                      )
                    }
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          void recommendationQuery
                            .refetch()
                        }}
                      >
                        Try again
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <>
                  <PricingRecommendationPanel
                    recommendation={
                      recommendation
                    }
                    propertyName={
                      selectedProperty
                        .name
                    }
                    canManage={
                      canManage
                    }
                    readOnly={
                      demoReadOnly
                    }
                    isGenerating={
                      generateMutation
                        .isPending
                    }
                    generateError={
                      generateError
                    }
                    onGenerate={() => {
                      generateMutation
                        .mutate(
                          selectedPropertyId,
                        )
                    }}
                  />

                  <PricingContextPanels
                    recommendation={
                      recommendation
                    }
                  />

                  <PricingFactors
                    factors={
                      recommendation
                        .pricing_factors
                    }
                  />
                </>
              )}


              <PricingHistory
                items={
                  historyQuery
                    .data
                    ?.items ??
                  []
                }
                total={
                  historyQuery
                    .data
                    ?.total ??
                  0
                }
                page={
                  historyPage
                }
                canManage={
                  canManage
                }
                isLoading={
                  historyQuery
                    .isLoading
                }
                isError={
                  historyQuery
                    .isError
                }
                errorMessage={
                  historyQuery
                    .isError
                    ? getErrorMessage(
                        historyQuery
                          .error,
                        "Averlen couldn't load pricing history.",
                      )
                    : null
                }
                updatingHistoryId={
                  statusMutation
                    .isPending
                    ? statusMutation
                        .variables
                        ?.historyId ??
                      null
                    : null
                }
                onPrevious={() => {
                  setHistoryPage(
                    (
                      current,
                    ) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                  )
                }}
                onNext={() => {
                  setHistoryPage(
                    (
                      current,
                    ) =>
                      current + 1,
                  )
                }}
                onRetry={() => {
                  void historyQuery
                    .refetch()
                }}
                onChangeStatus={(
                  historyId,
                  status,
                ) => {
                  statusMutation
                    .mutate({
                      historyId,
                      status,
                    })
                }}
              />
            </div>

            {isSwitchingProperty && (
              <div className="absolute inset-0 z-20 flex min-h-72 items-start justify-center bg-slate-50/95 pt-12 backdrop-blur-[1px]">
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />

                  Loading {
                    selectedProperty.name
                  }…
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}


      <Card className="mt-6 border-dashed p-5 sm:p-6">
        <p className="text-sm font-semibold text-slate-950">
          About “Mark applied”
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          Averlen currently records
          recommendation workflow status
          only. Marking a saved
          recommendation as applied does
          not automatically change the
          property&apos;s base price.
        </p>
      </Card>
    </div>
  )
}
