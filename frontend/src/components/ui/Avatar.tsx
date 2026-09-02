import { Avatar as AvatarPrimitive } from 'radix-ui'

import { cn } from '../../lib/cn'

type AvatarSize = 'sm' | 'md' | 'lg'

type AvatarProps = {
  name: string
  src?: string | null
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-sm',
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

  return initials || '?'
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full bg-slate-100',
        sizeClasses[size],
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="size-full object-cover"
        />
      )}

      <AvatarPrimitive.Fallback
        delayMs={150}
        className="flex size-full items-center justify-center bg-brand-50 font-semibold text-brand-700"
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}