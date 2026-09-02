import type { ComponentPropsWithoutRef } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import { cn } from '../../lib/cn'

export function Tabs(
  props: ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
) {
  return <TabsPrimitive.Root {...props} />
}

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center rounded-lg bg-slate-100 p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-600',
        'outline-none transition',
        'hover:text-slate-950',
        'focus-visible:ring-2 focus-visible:ring-brand-500',
        'data-[state=active]:bg-white',
        'data-[state=active]:text-slate-950',
        'data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-5 outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-500',
        className,
      )}
      {...props}
    />
  )
}