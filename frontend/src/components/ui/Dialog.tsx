import type { ComponentPropsWithoutRef } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '../../lib/cn'

export function Dialog(
  props: ComponentPropsWithoutRef<typeof DialogPrimitive.Root>,
) {
  return <DialogPrimitive.Root {...props} />
}

export function DialogTrigger(
  props: ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger {...props} />
}

export function DialogClose(
  props: ComponentPropsWithoutRef<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close {...props} />
}

export function DialogContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />

      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50',
          'w-[calc(100%-1rem)] max-w-lg sm:w-[calc(100%-2rem)]',
          '-translate-x-1/2 -translate-y-1/2',
          'max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-6',
          'outline-none',
          className,
        )}
        {...props}
      >
        {children}

        <DialogPrimitive.Close
          aria-label="Close dialog"
          className={cn(
            'absolute right-4 top-4',
            'flex size-8 items-center justify-center rounded-md',
            'text-slate-500 transition',
            'hover:bg-slate-100 hover:text-slate-900',
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-brand-500',
          )}
        >
          <X
            size={17}
            aria-hidden="true"
          />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'pr-8',
        className,
      )}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-lg font-semibold tracking-tight text-slate-950',
        className,
      )}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn(
        'mt-1.5 text-sm leading-6 text-slate-600',
        className,
      )}
      {...props}
    />
  )
}

export function DialogFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2',
        'sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}