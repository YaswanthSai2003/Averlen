import {
  AlertTriangle,
  Undo2,
} from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui'


type UndoImportDialogProps = {
  open: boolean
  filename: string
  importNumber: number
  bookingCount: number
  pending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}


export function UndoImportDialog({
  open,
  filename,
  importNumber,
  bookingCount,
  pending = false,
  onOpenChange,
  onConfirm,
}: UndoImportDialogProps) {
  const bookingLabel =
    `${bookingCount} booking${bookingCount === 1 ? '' : 's'}`

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <Undo2
              size={20}
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Undo import?
          </DialogTitle>

          <DialogDescription>
            This reverses the booking records created by this import.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="truncate text-sm font-semibold text-slate-950">
            {filename}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Import #{importNumber} · {bookingLabel}
          </p>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-amber-600"
            aria-hidden="true"
          />

          <div className="text-sm leading-6 text-amber-900">
            <p>
              The imported bookings will be permanently removed and workspace metrics will be recalculated.
            </p>

            <p className="mt-1 font-medium">
              Your properties will not be deleted. This action cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            disabled={pending}
            onClick={onConfirm}
          >
            <Undo2
              size={16}
              aria-hidden="true"
            />

            {pending
              ? 'Undoing import…'
              : 'Undo import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
