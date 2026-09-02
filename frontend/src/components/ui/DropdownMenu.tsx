import type { ComponentPropsWithoutRef } from 'react'
import { DropdownMenu as DropdownPrimitive } from 'radix-ui'

import { cn } from '../../lib/cn'

export function DropdownMenu(
  props: ComponentPropsWithoutRef<typeof DropdownPrimitive.Root>,
) {
  return (
    <DropdownPrimitive.Root
      modal={false}
      {...props}
    />
  )
}

export function DropdownMenuTrigger(
  props: ComponentPropsWithoutRef<typeof DropdownPrimitive.Trigger>,
) {
  return <DropdownPrimitive.Trigger {...props} />
}

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 rounded-lg border border-slate-200',
          'bg-white p-1.5 shadow-lg',
          'outline-none',
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn(
        'px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500',
        className,
      )}
      {...props}
    />
  )
}

type DropdownMenuItemProps =
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    destructive?: boolean
  }

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-md',
        'px-2.5 py-2 text-sm outline-none',
        'transition-colors',
        'data-[disabled]:pointer-events-none',
        'data-[disabled]:opacity-50',
        destructive
          ? 'text-danger-700 data-[highlighted]:bg-danger-50'
          : 'text-slate-700 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn(
        '-mx-1 my-1 h-px bg-slate-200',
        className,
      )}
      {...props}
    />
  )
}
