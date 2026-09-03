import type { PropertySummary } from '../../../api/properties'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui'

import { PropertyForm } from './PropertyForm'
import type { PropertyFormValues } from '../utils/propertyForm'

const PROPERTY_DIALOG_CLASS =
  'max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain'

type EditPropertyDialogProps = {
  property: PropertySummary | null
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: PropertyFormValues, photo: File | null) => void
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
        if (!open) onClose()
      }}
    >
      <DialogContent className={PROPERTY_DIALOG_CLASS}>
        <DialogHeader>
          <DialogTitle>Edit property</DialogTitle>
          <DialogDescription>
            Update property details and manage its photo.
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
