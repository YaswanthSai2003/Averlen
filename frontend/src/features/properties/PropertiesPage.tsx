import {
  Plus,
} from 'lucide-react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  useMemo,
  useState,
} from 'react'

import {
  createProperty,
  deleteProperty,
  getPropertySummaryPage,
  updateProperty,
  uploadPropertyPhoto,
  type PropertySortField,
  type PropertySummary,
  type SortOrder,
} from '../../api/properties'

import {
  ApiError,
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
  CreatePropertyDialog,
  DeletePropertyDialog,
  EditPropertyDialog,
} from './PropertyDialogs'

import {
  PropertyTable,
} from './PropertyTable'

import {
  toPropertyPayload,
  type PropertyFormValues,
} from './property-form'


const PAGE_SIZE = 10


function PropertiesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />

        <Skeleton className="h-10 w-48" />

        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <Skeleton className="mt-8 h-16 rounded-xl" />

      <Skeleton className="mt-4 h-96 rounded-xl" />
    </div>
  )
}


function getMutationError(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  return fallback
}


function getInitialSortOrder(
  field: PropertySortField,
): SortOrder {
  if (
    field === 'name' ||
    field === 'city'
  ) {
    return 'asc'
  }

  return 'desc'
}


export function PropertiesPage() {
  const {
    user,
    demoReadOnly,
  } = useAuth()

  const queryClient =
    useQueryClient()

  const [
    page,
    setPage,
  ] =
    useState(1)

  const [
    city,
    setCity,
  ] =
    useState('')

  const [
    propertyType,
    setPropertyType,
  ] =
    useState('')

  const [
    sortBy,
    setSortBy,
  ] =
    useState<PropertySortField>(
      'name',
    )

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState<SortOrder>(
      'asc',
    )

  const [
    createOpen,
    setCreateOpen,
  ] =
    useState(false)

  const [
    editingProperty,
    setEditingProperty,
  ] =
    useState<PropertySummary | null>(
      null,
    )

  const [
    deletingProperty,
    setDeletingProperty,
  ] =
    useState<PropertySummary | null>(
      null,
    )

  const canManage =
    user !== null &&
    !demoReadOnly &&
    PROPERTY_MANAGE_ROLES.includes(
      user.role,
    )

  const offset =
    (page - 1) *
    PAGE_SIZE

  const filterOptionsQuery =
    useQuery({
      queryKey: [
        'properties',
        'filter-options',
      ],

      queryFn: () =>
        getPropertySummaryPage(
          100,
          0,
          {
            sortBy:
              'name',

            sortOrder:
              'asc',
          },
        ),

      staleTime:
        30_000,
    })

  const propertiesQuery =
    useQuery({
      queryKey: [
        'properties',
        'summary-page',
        {
          page,
          city,
          propertyType,
          sortBy,
          sortOrder,
        },
      ],

      queryFn: () =>
        getPropertySummaryPage(
          PAGE_SIZE,
          offset,
          {
            city:
              city ||
              undefined,

            propertyType:
              propertyType ||
              undefined,

            sortBy,

            sortOrder,
          },
        ),

      placeholderData:
        (previousData) =>
          previousData,

      staleTime:
        15_000,
    })

  async function invalidatePropertyData() {
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
  }

  const createMutation =
    useMutation({
      mutationFn: (
        values:
          PropertyFormValues,
      ) =>
        createProperty(
          toPropertyPayload(
            values,
          ),
        ),

      onSuccess:
        async () => {
          await invalidatePropertyData()

          setCreateOpen(
            false,
          )

          toast.success(
            'Property created',
          )
        },
    })

  const updateMutation =
    useMutation({
      mutationFn:
        async ({
          propertyId,
          values,
          photo,
        }: {
          propertyId: number
          values:
            PropertyFormValues
          photo:
            File | null
        }) => {
          const updated =
            await updateProperty(
              propertyId,
              toPropertyPayload(
                values,
              ),
            )

          if (!photo) {
            return updated
          }

          return (
            uploadPropertyPhoto(
              propertyId,
              photo,
            )
          )
        },

      onSuccess:
        async () => {
          await invalidatePropertyData()

          setEditingProperty(
            null,
          )

          toast.success(
            'Property updated',
          )
        },
    })

  const deleteMutation =
    useMutation({
      mutationFn:
        deleteProperty,

      onSuccess:
        async () => {
          const deletingLastItemOnPage =
            (
              propertiesQuery
                .data
                ?.items
                .length ??
              0
            ) === 1

          if (
            deletingLastItemOnPage &&
            page > 1
          ) {
            setPage(
              (
                current,
              ) =>
                Math.max(
                  1,
                  current - 1,
                ),
            )
          }

          await invalidatePropertyData()

          setDeletingProperty(
            null,
          )

          toast.success(
            'Property deleted',
          )
        },
    })

  const filterSource =
    useMemo(
      () =>
        filterOptionsQuery
          .data
          ?.items ??
        [],
      [
        filterOptionsQuery
          .data
          ?.items,
      ],
    )

  const cities =
    useMemo(
      () =>
        Array.from(
          new Set(
            filterSource.map(
              (
                property,
              ) =>
                property.city,
            ),
          ),
        ).sort(
          (
            left,
            right,
          ) =>
            left.localeCompare(
              right,
            ),
        ),
      [
        filterSource,
      ],
    )

  const propertyTypes =
    useMemo(
      () =>
        Array.from(
          new Set(
            filterSource.map(
              (
                property,
              ) =>
                property
                  .property_type,
            ),
          ),
        ).sort(
          (
            left,
            right,
          ) =>
            left.localeCompare(
              right,
            ),
        ),
      [
        filterSource,
      ],
    )

  function clearFilters() {
    setCity('')
    setPropertyType('')
    setPage(1)
  }

  function handleSort(
    field:
      PropertySortField,
  ) {
    if (
      field === sortBy
    ) {
      setSortOrder(
        (
          current,
        ) =>
          current === 'asc'
            ? 'desc'
            : 'asc',
      )
    } else {
      setSortBy(
        field,
      )

      setSortOrder(
        getInitialSortOrder(
          field,
        ),
      )
    }

    setPage(1)
  }

  if (
    propertiesQuery.isLoading
  ) {
    return (
      <PropertiesLoading />
    )
  }

  if (
    propertiesQuery.isError
  ) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <ErrorState
          title="Unable to load properties"
          description="Averlen couldn't load your property portfolio."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void propertiesQuery.refetch()
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  const data =
    propertiesQuery.data

  const total =
    data?.total ??
    0

  const items =
    data?.items ??
    []

  const workspaceTotal =
    filterOptionsQuery
      .data
      ?.total ??
    total

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        PAGE_SIZE,
      ),
    )

  const hasFilters =
    Boolean(
      city ||
      propertyType,
    )

  const firstResult =
    total === 0
      ? 0
      : offset + 1

  const lastResult =
    Math.min(
      offset +
        items.length,
      total,
    )

  const createError =
    createMutation.isError
      ? getMutationError(
          createMutation.error,
          'Unable to create the property. Please try again.',
        )
      : null

  const updateError =
    updateMutation.isError
      ? getMutationError(
          updateMutation.error,
          'Unable to update the property.',
        )
      : null

  const deleteError =
    deleteMutation.isError
      ? getMutationError(
          deleteMutation.error,
          'Unable to delete the property.',
        )
      : null

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Operations"
          title="Properties"
          description={
            demoReadOnly
              ? `Explore ${formatNumber(workspaceTotal)} seeded ${workspaceTotal === 1 ? 'property' : 'properties'} in the Averlen demo workspace.`
              : workspaceTotal === 1
                ? 'Manage 1 property in your Averlen workspace.'
                : `Manage ${formatNumber(workspaceTotal)} properties in your Averlen workspace.`
          }
          actions={
            <>
              {propertiesQuery
                .isPlaceholderData && (
                <Badge variant="brand">
                  Updating
                </Badge>
              )}

              {canManage && (
                <Button
                  onClick={() => {
                    createMutation.reset()

                    setCreateOpen(
                      true,
                    )
                  }}
                >
                  <Plus
                    size={17}
                    aria-hidden="true"
                  />

                  Add property
                </Button>
              )}
            </>
          }
        />

        {workspaceTotal ===
          0 &&
        !hasFilters ? (
          <Card className="mt-8">
            <EmptyState
              title="No properties yet"
              description="Add your first property to start tracking revenue and importing booking data."
              action={
                canManage ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      createMutation.reset()

                      setCreateOpen(
                        true,
                      )
                    }}
                  >
                    <Plus
                      size={16}
                      aria-hidden="true"
                    />

                    Add property
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            <Card className="mt-8 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="City"
                    value={
                      city
                    }
                    onChange={(
                      event,
                    ) => {
                      setCity(
                        event
                          .target
                          .value,
                      )

                      setPage(1)
                    }}
                  >
                    <option value="">
                      All cities
                    </option>

                    {cities.map(
                      (
                        cityOption,
                      ) => (
                        <option
                          key={
                            cityOption
                          }
                          value={
                            cityOption
                          }
                        >
                          {
                            cityOption
                          }
                        </option>
                      ),
                    )}
                  </Select>

                  <Select
                    label="Property type"
                    value={
                      propertyType
                    }
                    onChange={(
                      event,
                    ) => {
                      setPropertyType(
                        event
                          .target
                          .value,
                      )

                      setPage(1)
                    }}
                  >
                    <option value="">
                      All types
                    </option>

                    {propertyTypes.map(
                      (
                        type,
                      ) => (
                        <option
                          key={
                            type
                          }
                          value={
                            type
                          }
                        >
                          {type}
                        </option>
                      ),
                    )}
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  disabled={
                    !hasFilters
                  }
                  onClick={
                    clearFilters
                  }
                >
                  Reset filters
                </Button>
              </div>
            </Card>

            {items.length ===
            0 ? (
              <Card className="mt-4">
                <EmptyState
                  title="No matching properties"
                  description="No properties match the selected filters."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={
                        clearFilters
                      }
                    >
                      Clear filters
                    </Button>
                  }
                />
              </Card>
            ) : (
              <PropertyTable
                properties={
                  items
                }
                canManage={
                  canManage
                }
                page={
                  page
                }
                totalPages={
                  totalPages
                }
                total={
                  total
                }
                firstResult={
                  firstResult
                }
                lastResult={
                  lastResult
                }
                sortBy={
                  sortBy
                }
                sortOrder={
                  sortOrder
                }
                onSort={
                  handleSort
                }
                onPreviousPage={() => {
                  setPage(
                    (
                      current,
                    ) =>
                      Math.max(
                        1,
                        current -
                          1,
                      ),
                  )
                }}
                onNextPage={() => {
                  setPage(
                    (
                      current,
                    ) =>
                      Math.min(
                        totalPages,
                        current +
                          1,
                      ),
                  )
                }}
                onEdit={(
                  property,
                ) => {
                  updateMutation.reset()

                  setEditingProperty(
                    property,
                  )
                }}
                onDelete={(
                  property,
                ) => {
                  deleteMutation.reset()

                  setDeletingProperty(
                    property,
                  )
                }}
              />
            )}
          </>
        )}
      </div>

      <CreatePropertyDialog
        open={
          createOpen
        }
        loading={
          createMutation.isPending
        }
        error={
          createError
        }
        onOpenChange={(
          open,
        ) => {
          setCreateOpen(
            open,
          )

          if (!open) {
            createMutation.reset()
          }
        }}
        onSubmit={(
          values,
        ) => {
          createMutation.mutate(
            values,
          )
        }}
      />

      <EditPropertyDialog
        property={
          editingProperty
        }
        loading={
          updateMutation.isPending
        }
        error={
          updateError
        }
        onClose={() => {
          setEditingProperty(
            null,
          )

          updateMutation.reset()
        }}
        onSubmit={(
          values,
          photo,
        ) => {
          if (
            !editingProperty
          ) {
            return
          }

          updateMutation.mutate({
            propertyId:
              editingProperty
                .property_id,

            values,

            photo,
          })
        }}
      />

      <DeletePropertyDialog
        property={
          deletingProperty
        }
        loading={
          deleteMutation.isPending
        }
        error={
          deleteError
        }
        onClose={() => {
          setDeletingProperty(
            null,
          )

          deleteMutation.reset()
        }}
        onConfirm={() => {
          if (
            !deletingProperty
          ) {
            return
          }

          deleteMutation.mutate(
            deletingProperty
              .property_id,
          )
        }}
      />
    </>
  )
}
