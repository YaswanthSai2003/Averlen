import { Trash2 } from 'lucide-react'

import type {
  PropertySummary,
} from '../../api/properties'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '../../components/ui'

import { PropertyForm } from './PropertyForm'
import type {
  PropertyFormValues,
} from './property-form'

const LARGE_DIALOG_CLASS =
  'max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain'

type CreatePropertyDialogProps = {
  open: boolean
  loading: boolean
  error: string | null
  onOpenChange: (
    open: boolean,
  ) => void
  onSubmit: (
    values: PropertyFormValues,
  ) => void
}

export function CreatePropertyDialog({
  open,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: CreatePropertyDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className={LARGE_DIALOG_CLASS}
      >
        <DialogHeader>
          <DialogTitle>
            Add property
          </DialogTitle>

          <DialogDescription>
            Add an accommodation to your
            Averlen workspace.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PropertyForm
            mode="create"
            loading={loading}
            error={error}
            onCancel={() =>
              onOpenChange(false)
            }
            onSubmit={(values) =>
              onSubmit(values)
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type EditPropertyDialogProps = {
  property: PropertySummary | null
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (
    values: PropertyFormValues,
    photo: File | null,
  ) => void
}

export function EditPropertyDialog({
  property,
  loading,
  error,
  onClose,
  onSubmit,
}: EditPropertyDialogProps) {
  return (
    <Dialog
      open={property !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        className={LARGE_DIALOG_CLASS}
      >
        <DialogHeader>
          <DialogTitle>
            Edit property
          </DialogTitle>

          <DialogDescription>
            Update property details and manage
            its photo.
          </DialogDescription>
        </DialogHeader>

        {property && (
          <PropertyForm
            key={property.property_id}
            mode="edit"
            property={property}
            loading={loading}
            error={error}
            onCancel={onClose}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type DeletePropertyDialogProps = {
  property: PropertySummary | null
  loading: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export function DeletePropertyDialog({
  property,
  loading,
  error,
  onClose,
  onConfirm,
}: DeletePropertyDialogProps) {
  return (
    <Dialog
      open={property !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>
            Delete property?
          </DialogTitle>

          <DialogDescription>
            This action permanently removes the
            property from the workspace.
          </DialogDescription>
        </DialogHeader>

        {property && (
          <>
            <div className="mt-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
              <p className="text-sm font-medium text-danger-800">
                {property.name}
              </p>

              <p className="mt-1 text-sm text-danger-700">
                {property.city}
                {' · '}
                {property.property_type}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
              >
                {error}
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                variant="secondary"
                disabled={loading}
                onClick={onClose}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading ? (
                  <>
                    <Spinner
                      size="sm"
                      className="text-white"
                    />

                    Deleting
                  </>
                ) : (
                  <>
                    <Trash2
                      size={16}
                      aria-hidden="true"
                    />

                    Delete property
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}