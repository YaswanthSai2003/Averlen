import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarCheck,
  Clock3,
  IndianRupee,
  MapPin,
  Pencil,
  Upload,
  Users,
} from 'lucide-react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router'

import {
  getPropertySummary,
  updateProperty,
  uploadPropertyPhoto,
} from '../../api/properties'
import {
  ApiError,
  buildApiUrl,
} from '../../api/client'
import {
  PROPERTY_MANAGE_ROLES,
} from '../../app/access'
import {
  PageHeader,
} from '../../components/layout'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  MetricCard,
  Skeleton,
} from '../../components/ui'
import {
  formatCurrency,
  formatDecimal,
  formatNumber,
} from '../../lib/format'
import {
  useAuth,
} from '../auth/auth-context'

import {
  EditPropertyDialog,
} from './components'
import {
  toPropertyPayload,
  type PropertyFormValues,
} from './utils/propertyForm'


function PropertyDetailLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <Skeleton className="h-9 w-36" />

      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-52 max-w-full" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-36 rounded-xl"
          />
        ))}
      </div>
    </div>
  )
}


function getMutationError(
  error: unknown,
) {
  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  return 'Unable to update the property.'
}


export function PropertyDetailPage() {
  const {
    propertyId,
  } = useParams()

  const navigate =
    useNavigate()

  const queryClient =
    useQueryClient()

  const {
    user,
    demoReadOnly,
  } = useAuth()

  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false)

  const parsedPropertyId =
    Number(propertyId)

  const validPropertyId =
    Number.isInteger(
      parsedPropertyId,
    ) &&
    parsedPropertyId > 0

  const canManage =
    user !== null &&
    !demoReadOnly &&
    PROPERTY_MANAGE_ROLES.includes(
      user.role,
    )

  const propertyQuery =
    useQuery({
      queryKey: [
        'properties',
        'summary',
        parsedPropertyId,
      ],

      queryFn: () =>
        getPropertySummary(
          parsedPropertyId,
        ),

      enabled:
        validPropertyId,
    })

  const updateMutation =
    useMutation({
      mutationFn:
        async ({
          values,
          photo,
        }: {
          values:
            PropertyFormValues
          photo:
            File | null
        }) => {
          const updated =
            await updateProperty(
              parsedPropertyId,
              toPropertyPayload(
                values,
              ),
            )

          if (!photo) {
            return updated
          }

          return uploadPropertyPhoto(
            parsedPropertyId,
            photo,
          )
        },

      onSuccess:
        async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: [
                'properties',
              ],
            }),

            queryClient.invalidateQueries({
              queryKey: [
                'analytics',
              ],
            }),
          ])

          setEditOpen(false)
        },
    })

  if (!validPropertyId) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <ErrorState
          title="Invalid property"
          description="The property address is not valid."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                navigate(
                  '/app/properties',
                )
              }}
            >
              Back to properties
            </Button>
          }
        />
      </div>
    )
  }

  if (
    propertyQuery.isLoading
  ) {
    return (
      <PropertyDetailLoading />
    )
  }

  if (
    propertyQuery.isError ||
    !propertyQuery.data
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigate(
              '/app/properties',
            )
          }}
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
          />

          Properties
        </Button>

        <div className="mt-6">
          <ErrorState
            title="Unable to load property"
            description="Averlen couldn't load this property. It may no longer exist or you may not have access to it."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void propertyQuery.refetch()
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

  const property =
    propertyQuery.data

  const photoUrl =
    property.photo_url
      ? buildApiUrl(
          property.photo_url,
        )
      : null

  const hasBookings =
    property.total_bookings >
    0

  const updateError =
    updateMutation.isError
      ? getMutationError(
          updateMutation.error,
        )
      : null

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigate(
              '/app/properties',
            )
          }}
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
          />

          Properties
        </Button>

        <div className="mt-5">
          <PageHeader
            eyebrow="Property"
            title={
              property.name
            }
            description={`${property.property_code} · ${property.city} · ${property.property_type}`}
            actions={
              <div className="flex flex-wrap gap-2">
                {canManage && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateMutation.reset()
                      setEditOpen(true)
                    }}
                  >
                    <Pencil
                      size={16}
                      aria-hidden="true"
                    />

                    Edit property
                  </Button>
                )}

                <Button
                  variant={
                    demoReadOnly
                      ? 'secondary'
                      : undefined
                  }
                  onClick={() => {
                    navigate(
                      '/app/imports',
                    )
                  }}
                >
                  <Upload
                    size={16}
                    aria-hidden="true"
                  />

                  {demoReadOnly
                    ? 'View imports'
                    : 'Import bookings'}
                </Button>
              </div>
            }
          />
        </div>

        <Card className="mt-8 overflow-hidden">
          <div className="grid lg:grid-cols-[380px_minmax(0,1fr)]">
            <div className="min-h-64 bg-slate-100">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={property.name}
                  className="h-full min-h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
                      <Building2
                        size={24}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      No property photo
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">
                  {
                    property.property_type
                  }
                </Badge>

                <Badge
                  variant={
                    hasBookings
                      ? 'success'
                      : 'warning'
                  }
                >
                  {hasBookings
                    ? 'Data available'
                    : 'Awaiting bookings'}
                </Badge>
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                Property information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <MapPin
                      size={18}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      City
                    </p>

                    <p className="mt-1 font-medium text-slate-950">
                      {
                        property.city
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <IndianRupee
                      size={18}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Base price
                    </p>

                    <p className="mt-1 font-medium text-slate-950">
                      {formatCurrency(
                        property.base_price,
                      )}
                      {' / night'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <BedDouble
                      size={18}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bedrooms
                    </p>

                    <p className="mt-1 font-medium text-slate-950">
                      {formatNumber(
                        property.bedrooms,
                      )}{' '}
                      {property.bedrooms ===
                      1
                        ? 'bedroom'
                        : 'bedrooms'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Users
                      size={18}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Capacity
                    </p>

                    <p className="mt-1 font-medium text-slate-950">
                      Up to{' '}
                      {formatNumber(
                        property.accommodates,
                      )}{' '}
                      guests
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total revenue"
            value={
              formatCurrency(
                property.total_revenue,
              )
            }
            description="Recorded booking revenue"
            icon={
              <IndianRupee
                size={18}
                aria-hidden="true"
              />
            }
          />

          <MetricCard
            label="Bookings"
            value={
              formatNumber(
                property.total_bookings,
              )
            }
            description="Imported reservations"
            icon={
              <CalendarCheck
                size={18}
                aria-hidden="true"
              />
            }
          />

          <MetricCard
            label="Booked nights"
            value={
              formatNumber(
                property.total_booked_nights,
              )
            }
            description={
              hasBookings
                ? `${formatDecimal(
                    property.average_length_of_stay,
                    1,
                  )} nights average stay`
                : 'No booking nights yet'
            }
            icon={
              <Clock3
                size={18}
                aria-hidden="true"
              />
            }
          />

          <MetricCard
            label="ADR"
            value={
              formatCurrency(
                property.adr,
              )
            }
            description="Average booking revenue"
            icon={
              <IndianRupee
                size={18}
                aria-hidden="true"
              />
            }
          />
        </div>

        {hasBookings ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <p className="text-sm font-medium text-slate-500">
                Revenue per booked night
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(
                  property.revenue_per_booked_night,
                )}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Revenue generated for each occupied night represented in imported booking data.
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-medium text-slate-500">
                Average length of stay
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatDecimal(
                  property.average_length_of_stay,
                  1,
                )}{' '}
                nights
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Average stay duration across this property's imported bookings.
              </p>
            </Card>
          </div>
        ) : (
          <Card className="mt-6 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Upload
                    size={20}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {demoReadOnly
                      ? 'Booking data'
                      : 'Add booking data'}
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                    {demoReadOnly
                      ? 'This seeded property has no booking history. You can still review the demo import workflow and existing import history.'
                      : 'Import bookings for this property to populate revenue and stay-performance metrics.'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  navigate(
                    '/app/imports',
                  )
                }}
              >
                {demoReadOnly
                  ? 'View imports'
                  : 'Import bookings'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <EditPropertyDialog
        property={
          editOpen
            ? property
            : null
        }
        loading={
          updateMutation.isPending
        }
        error={
          updateError
        }
        onClose={() => {
          setEditOpen(false)
          updateMutation.reset()
        }}
        onSubmit={(
          values,
          photo,
        ) => {
          updateMutation.mutate({
            values,
            photo,
          })
        }}
      />
    </>
  )
}
