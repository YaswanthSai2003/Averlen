import { zodResolver } from '@hookform/resolvers/zod'
import {
  Camera,
  Pencil,
  Plus,
  Upload,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'

import type {
  PropertySummary,
} from '../../../api/properties'
import { buildApiUrl } from '../../../api/client'
import {
  Button,
  DialogFooter,
  Input,
  Select,
  Spinner,
} from '../../../components/ui'

import {
  CREATE_PROPERTY_DEFAULTS,
  getPropertyFormDefaults,
  PROPERTY_TYPES,
  propertyFormSchema,
  validatePropertyPhoto,
  type PropertyFormValues,
} from '../utils/propertyForm'

type PropertyFormProps = {
  mode: 'create' | 'edit'
  property?: PropertySummary
  loading: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (
    values: PropertyFormValues,
    photo: File | null,
  ) => void
}

export function PropertyForm({
  mode,
  property,
  loading,
  error,
  onCancel,
  onSubmit,
}: PropertyFormProps) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoError, setPhotoError] =
    useState<string | null>(null)

  const defaultValues =
    mode === 'edit' && property
      ? getPropertyFormDefaults(property)
      : CREATE_PROPERTY_DEFAULTS

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues,
  })

  const previewUrl = useMemo(() => {
    if (!photo) {
      return null
    }

    return URL.createObjectURL(photo)
  }, [photo])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const currentPhotoUrl =
    mode === 'edit' && property?.photo_url
      ? buildApiUrl(property.photo_url)
      : null

  function handlePhotoChange(
    selectedFile: File | null,
  ) {
    if (!selectedFile) {
      setPhoto(null)
      setPhotoError(null)
      return
    }

    const validationError =
      validatePropertyPhoto(selectedFile)

    if (validationError) {
      setPhoto(null)
      setPhotoError(validationError)
      return
    }

    setPhoto(selectedFile)
    setPhotoError(null)
  }

  return (
    <form
      className="mt-6 min-w-0"
      onSubmit={handleSubmit((values) => {
        if (photoError) {
          return
        }

        onSubmit(values, photo)
      })}
    >
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-5">
        <Input
          label="Property name"
          placeholder={
            mode === 'create'
              ? 'Grand Ocean Hotel'
              : undefined
          }
          autoComplete="off"
          disabled={loading}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="City"
          placeholder={
            mode === 'create'
              ? 'Chennai'
              : undefined
          }
          autoComplete="address-level2"
          disabled={loading}
          error={errors.city?.message}
          {...register('city')}
        />

        <div className="min-w-0">
          <Select
            label="Property type"
            disabled={loading}
            {...register('propertyType')}
          >
            {PROPERTY_TYPES.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type === 'Private Room'
                  ? 'Private room'
                  : type}
              </option>
            ))}
          </Select>

          {errors.propertyType?.message && (
            <p className="mt-1.5 text-sm text-danger-600">
              {errors.propertyType.message}
            </p>
          )}
        </div>

        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <Input
              label="Base price per night"
              type="number"
              min="0.01"
              step="0.01"
              disabled={loading}
              error={errors.basePrice?.message}
              {...register('basePrice', {
                valueAsNumber: true,
              })}
            />
          </div>

          <div className="min-w-0">
            <Input
              label="Bedrooms"
              type="number"
              min="0"
              max="20"
              step="1"
              disabled={loading}
              error={errors.bedrooms?.message}
              {...register('bedrooms', {
                valueAsNumber: true,
              })}
            />
          </div>
        </div>

        <Input
          label="Maximum guests"
          type="number"
          min="1"
          max="100"
          step="1"
          disabled={loading}
          error={errors.accommodates?.message}
          {...register('accommodates', {
            valueAsNumber: true,
          })}
        />

        {mode === 'edit' && property ? (
          <div className="min-w-0">
            <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-900">
                Property photo
              </label>

              {currentPhotoUrl && !photo && (
                <span className="shrink-0 text-xs text-slate-500">
                  Current photo
                </span>
              )}
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-40">
                  {previewUrl || currentPhotoUrl ? (
                    <img
                      src={
                        previewUrl ??
                        currentPhotoUrl ??
                        ''
                      }
                      alt={`${property.name} preview`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Camera
                      size={26}
                      aria-hidden="true"
                      className="text-slate-400"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="max-w-full truncate text-sm font-medium text-slate-900"
                    title={photo?.name}
                  >
                    {photo
                      ? photo.name
                      : currentPhotoUrl
                        ? 'Replace property photo'
                        : 'Upload property photo'}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    JPG, PNG or WEBP. Maximum file
                    size 5 MB.
                  </p>

                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                    <label
                      className={`
                        inline-flex h-9 max-w-full cursor-pointer
                        items-center justify-center gap-2 rounded-lg
                        border border-slate-200 bg-white px-3
                        text-sm font-medium text-slate-700
                        transition-colors hover:bg-slate-100
                        ${
                          loading
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      `}
                    >
                      <Upload
                        size={15}
                        aria-hidden="true"
                        className="shrink-0"
                      />

                      <span className="truncate">
                        {currentPhotoUrl
                          ? 'Choose replacement'
                          : 'Choose photo'}
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={loading}
                        className="sr-only"
                        onChange={(event) => {
                          handlePhotoChange(
                            event.target.files?.[0] ??
                              null,
                          )

                          event.target.value = ''
                        }}
                      />
                    </label>

                    {photo && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setPhoto(null)
                          setPhotoError(null)
                        }}
                        className="inline-flex h-9 max-w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <X
                          size={15}
                          aria-hidden="true"
                          className="shrink-0"
                        />

                        <span className="truncate">
                          Cancel selection
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {photoError && (
              <p
                role="alert"
                className="mt-1.5 text-sm text-danger-600"
              >
                {photoError}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-500">
            You can add a property photo after
            creating the property.
          </p>
        )}
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={
            loading ||
            Boolean(photoError)
          }
        >
          {loading ? (
            <>
              <Spinner
                size="sm"
                className="text-white"
              />

              {mode === 'create'
                ? 'Creating property'
                : 'Saving changes'}
            </>
          ) : mode === 'create' ? (
            <>
              <Plus
                size={16}
                aria-hidden="true"
              />

              Add property
            </>
          ) : (
            <>
              <Pencil
                size={16}
                aria-hidden="true"
              />

              Save changes
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}