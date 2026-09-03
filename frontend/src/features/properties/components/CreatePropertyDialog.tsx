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

type CreatePropertyDialogProps = {
  open: boolean
  loading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PropertyFormValues) => void
}

export function CreatePropertyDialog({
  open,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: CreatePropertyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={PROPERTY_DIALOG_CLASS}>
        <DialogHeader>
          <DialogTitle>Add property</DialogTitle>
          <DialogDescription>
            Add an accommodation to your Averlen workspace.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PropertyForm
            mode="create"
            loading={loading}
            error={error}
            onCancel={() => onOpenChange(false)}
            onSubmit={(values) => onSubmit(values)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
