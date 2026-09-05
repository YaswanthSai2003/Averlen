import { Plus } from 'lucide-react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { ApiError } from '../../api/client'
import {
  archiveProperty,
  createProperty,
  deleteProperty,
  getPropertySummaryPage,
  restoreProperty,
  updateProperty,
  uploadPropertyPhoto,
  type PropertySortField,
  type PropertySummary,
  type SortOrder,
} from '../../api/properties'
import { PROPERTY_MANAGE_ROLES } from '../../app/access'
import { PageHeader } from '../../components/layout'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui'
import { formatNumber } from '../../lib/format'
import { toast } from '../../lib/toast'
import { useAuth } from '../auth/auth-context'
import {
  CreatePropertyDialog,
  EditPropertyDialog,
  PropertyLifecycleDialog,
  PropertyTable,
  PropertyToolbar,
} from './components'
import {
  toPropertyPayload,
  type PropertyFormValues,
} from './utils/propertyForm'

const PAGE_SIZE = 10

function PropertiesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <Skeleton className="mt-8 h-24 rounded-xl" />
      <Skeleton className="mt-4 h-96 rounded-xl" />
    </div>
  )
}

function getMutationError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function getInitialSortOrder(field: PropertySortField): SortOrder {
  return field === 'property_code' ||
  field === 'name' || field === 'city' ? 'asc' : 'desc'
}

export function PropertiesPage() {
  const { user, demoReadOnly } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)
  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [sortBy, setSortBy] = useState<PropertySortField>('property_code')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<PropertySummary | null>(null)
  const [lifecycleProperty, setLifecycleProperty] = useState<PropertySummary | null>(null)

  const canManage =
    user !== null &&
    !demoReadOnly &&
    PROPERTY_MANAGE_ROLES.includes(user.role)

  const offset = (page - 1) * PAGE_SIZE

  const filterOptionsQuery = useQuery({
    queryKey: ['properties', 'filter-options', showArchived],
    queryFn: () =>
      getPropertySummaryPage(100, 0, {
        sortBy: 'name',
        sortOrder: 'asc',
        archived: showArchived,
      }),
    staleTime: 30_000,
  })

  const propertiesQuery = useQuery({
    queryKey: [
      'properties',
      'summary-page',
      { page, city, propertyType, sortBy, sortOrder, showArchived },
    ],
    queryFn: () =>
      getPropertySummaryPage(PAGE_SIZE, offset, {
        city: city || undefined,
        propertyType: propertyType || undefined,
        sortBy,
        sortOrder,
        archived: showArchived,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 15_000,
  })

  async function invalidatePropertyData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: (values: PropertyFormValues) =>
      createProperty(toPropertyPayload(values)),
    onSuccess: async () => {
      await invalidatePropertyData()
      setCreateOpen(false)
      toast.success('Property created')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      propertyId,
      values,
      photo,
    }: {
      propertyId: number
      values: PropertyFormValues
      photo: File | null
    }) => {
      const updated = await updateProperty(
        propertyId,
        toPropertyPayload(values),
      )

      if (!photo) return updated
      return uploadPropertyPhoto(propertyId, photo)
    },
    onSuccess: async () => {
      await invalidatePropertyData()
      setEditingProperty(null)
      toast.success('Property updated')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: archiveProperty,
    onSuccess: async () => {
      await invalidatePropertyData()
      setLifecycleProperty(null)
      toast.success('Property archived', {
        description: 'Historical bookings and analytics were preserved.',
      })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: restoreProperty,
    onSuccess: async () => {
      await invalidatePropertyData()
      toast.success('Property restored')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: async () => {
      const deletingLastItemOnPage =
        (propertiesQuery.data?.items.length ?? 0) === 1

      if (deletingLastItemOnPage && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      }

      await invalidatePropertyData()
      setLifecycleProperty(null)
      toast.success('Property and associated data deleted')
    },
  })

  const filterSource = useMemo(
    () => filterOptionsQuery.data?.items ?? [],
    [filterOptionsQuery.data?.items],
  )

  const cities = useMemo(
    () =>
      Array.from(new Set(filterSource.map((property) => property.city))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [filterSource],
  )

  const propertyTypes = useMemo(
    () =>
      Array.from(
        new Set(filterSource.map((property) => property.property_type)),
      ).sort((left, right) => left.localeCompare(right)),
    [filterSource],
  )

  function clearFilters() {
    setCity('')
    setPropertyType('')
    setPage(1)
  }

  function changePropertyView(archived: boolean) {
    setShowArchived(archived)
    setPage(1)
    setCity('')
    setPropertyType('')
  }

  function handleSort(field: PropertySortField) {
    if (field === sortBy) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder(getInitialSortOrder(field))
    }

    setPage(1)
  }

  if (propertiesQuery.isLoading) return <PropertiesLoading />

  if (propertiesQuery.isError) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <ErrorState
          title="Unable to load properties"
          description="Averlen couldn't load your property portfolio."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void propertiesQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  const data = propertiesQuery.data
  const total = data?.total ?? 0
  const items = data?.items ?? []
  const workspaceTotal = filterOptionsQuery.data?.total ?? total
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = Boolean(city || propertyType)
  const firstResult = total === 0 ? 0 : offset + 1
  const lastResult = Math.min(offset + items.length, total)

  const createError = createMutation.isError
    ? getMutationError(
        createMutation.error,
        'Unable to create the property. Please try again.',
      )
    : null

  const updateError = updateMutation.isError
    ? getMutationError(updateMutation.error, 'Unable to update the property.')
    : null

  const lifecycleError = deleteMutation.isError
    ? getMutationError(
        deleteMutation.error,
        'Unable to permanently delete the property.',
      )
    : archiveMutation.isError
      ? getMutationError(archiveMutation.error, 'Unable to archive the property.')
      : null

  const description = showArchived
    ? workspaceTotal === 1
      ? 'Review 1 archived property. Historical bookings and analytics are preserved.'
      : `Review ${formatNumber(workspaceTotal)} archived properties. Historical bookings and analytics are preserved.`
    : demoReadOnly
      ? `Explore ${formatNumber(workspaceTotal)} seeded ${workspaceTotal === 1 ? 'property' : 'properties'} in the Averlen demo workspace.`
      : workspaceTotal === 1
        ? 'Manage 1 active property in your Averlen workspace.'
        : `Manage ${formatNumber(workspaceTotal)} active properties in your Averlen workspace.`

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <PageHeader
          eyebrow="Operations"
          title="Properties"
          description={description}
          actions={
            canManage && !showArchived ? (
              <Button
                onClick={() => {
                  createMutation.reset()
                  setCreateOpen(true)
                }}
              >
                <Plus size={17} aria-hidden="true" />
                Add property
              </Button>
            ) : undefined
          }
        />

        <PropertyToolbar
          showArchived={showArchived}
          count={workspaceTotal}
          city={city}
          propertyType={propertyType}
          cities={cities}
          propertyTypes={propertyTypes}
          hasFilters={hasFilters}
          updating={propertiesQuery.isPlaceholderData}
          onShowArchivedChange={changePropertyView}
          onCityChange={(value) => {
            setCity(value)
            setPage(1)
          }}
          onPropertyTypeChange={(value) => {
            setPropertyType(value)
            setPage(1)
          }}
          onResetFilters={clearFilters}
        />

        {workspaceTotal === 0 && !hasFilters ? (
          <Card className="mt-4">
            <EmptyState
              title={showArchived ? 'No archived properties' : 'No properties yet'}
              description={
                showArchived
                  ? 'Archived properties will appear here and can be restored later.'
                  : 'Add your first property to start tracking revenue and importing booking data.'
              }
              action={
                canManage && !showArchived ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      createMutation.reset()
                      setCreateOpen(true)
                    }}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add property
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : items.length === 0 ? (
          <Card className="mt-4">
            <EmptyState
              title="No matching properties"
              description="No properties match the selected filters."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          </Card>
        ) : (
          <PropertyTable
            properties={items}
            canManage={canManage}
            page={page}
            totalPages={totalPages}
            total={total}
            firstResult={firstResult}
            lastResult={lastResult}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
            onNextPage={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            onEdit={(property) => {
              updateMutation.reset()
              setEditingProperty(property)
            }}
            onArchive={(property) => archiveMutation.mutate(property.property_id)}
            onRestore={(property) => restoreMutation.mutate(property.property_id)}
            onManageRemoval={(property) => {
              deleteMutation.reset()
              archiveMutation.reset()
              setLifecycleProperty(property)
            }}
          />
        )}
      </div>

      <CreatePropertyDialog
        open={createOpen}
        loading={createMutation.isPending}
        error={createError}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) createMutation.reset()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditPropertyDialog
        property={editingProperty}
        loading={updateMutation.isPending}
        error={updateError}
        onClose={() => {
          setEditingProperty(null)
          updateMutation.reset()
        }}
        onSubmit={(values, photo) => {
          if (!editingProperty) return

          updateMutation.mutate({
            propertyId: editingProperty.property_id,
            values,
            photo,
          })
        }}
      />

      <PropertyLifecycleDialog
        property={lifecycleProperty}
        loading={deleteMutation.isPending || archiveMutation.isPending}
        error={lifecycleError}
        onClose={() => {
          setLifecycleProperty(null)
          deleteMutation.reset()
          archiveMutation.reset()
        }}
        onArchive={() => {
          if (!lifecycleProperty) return
          archiveMutation.mutate(lifecycleProperty.property_id)
        }}
        onConfirmDelete={() => {
          if (!lifecycleProperty) return
          deleteMutation.mutate(lifecycleProperty.property_id)
        }}
      />
    </>
  )
}
