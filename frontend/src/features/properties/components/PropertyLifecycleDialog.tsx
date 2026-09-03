import {
  AlertTriangle,
  Archive,
  Building2,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

import type { PropertySummary } from '../../../api/properties'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '../../../components/ui'
import { formatCurrency, formatNumber } from '../../../lib/format'

type PropertyLifecycleDialogProps = {
  property: PropertySummary | null
  loading: boolean
  error: string | null
  onClose: () => void
  onArchive: () => void
  onConfirmDelete: () => void
}

export function PropertyLifecycleDialog({
  property,
  loading,
  error,
  onClose,
  onArchive,
  onConfirmDelete,
}: PropertyLifecycleDialogProps) {
  const [confirmation, setConfirmation] = useState('')

  function handleClose() {
    setConfirmation('')
    onClose()
  }

  const deleteConfirmed = confirmation.trim() === 'DELETE'

  return (
    <Dialog
      open={property !== null}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto p-0">
        {property && (
          <>
            <div className="border-b border-slate-200 px-6 pb-5 pt-6">
              <DialogHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Building2 size={20} aria-hidden="true" />
                </div>

                <DialogTitle>Manage property</DialogTitle>
                <DialogDescription>
                  Choose how you want to remove this property from active use.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {property.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {property.property_code} · {property.city}
                    </p>
                  </div>

                  <Badge variant="neutral">{property.property_type}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Bookings
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatNumber(property.total_bookings)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Revenue
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatCurrency(property.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {!property.is_archived && (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Archive size={17} aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">Archive property</h3>
                        <Badge variant="brand">Recommended</Badge>
                      </div>

                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        Removes the property from active operations while preserving booking history and analytics. You can restore it later.
                      </p>

                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-4"
                        disabled={loading}
                        onClick={onArchive}
                      >
                        {loading ? <Spinner size="sm" /> : <Archive size={16} aria-hidden="true" />}
                        Archive property
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-xl border border-danger-200 bg-danger-50/40">
                <div className="border-b border-danger-200 bg-danger-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-danger-800">
                    <AlertTriangle size={17} aria-hidden="true" />
                    <h3 className="font-semibold">Danger zone</h3>
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-semibold text-slate-950">Delete permanently</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Permanently deletes this property, its booking records and pricing history. Analytics will be recalculated. This action cannot be undone.
                  </p>

                  <label
                    htmlFor="property-delete-confirmation"
                    className="mt-4 block text-sm font-medium text-slate-800"
                  >
                    Type <span className="font-mono font-semibold text-danger-700">DELETE</span> to confirm.
                  </label>

                  <input
                    id="property-delete-confirmation"
                    type="text"
                    autoComplete="off"
                    value={confirmation}
                    disabled={loading}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="DELETE"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-danger-400 focus:ring-2 focus:ring-danger-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <Button
                    type="button"
                    variant="danger"
                    className="mt-4 w-full sm:w-auto"
                    disabled={loading || !deleteConfirmed}
                    onClick={onConfirmDelete}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="text-white" />
                        Deleting property
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} aria-hidden="true" />
                        Delete permanently
                      </>
                    )}
                  </Button>
                </div>
              </section>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
                >
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <Button type="button" variant="secondary" disabled={loading} onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
