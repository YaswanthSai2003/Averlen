import { cn } from '../../lib/cn'

type BrandProps = {
  compact?: boolean
  wordmarkOnly?: boolean
  className?: string
  size?: 'default' | 'large'
  href?: string
}

export function Brand({
  compact = false,
  wordmarkOnly = false,
  className,
  size = 'default',
  href,
}: BrandProps) {
  const large =
    size === 'large'

  const content =
    compact ? (
      <img
        src="/averlen-mark.png"
        alt="Averlen"
        className={cn(
          'block shrink-0 object-contain',
          large
            ? 'size-12'
            : 'size-9',
        )}
      />
    ) : wordmarkOnly ? (
      <img
        src="/averlen-wordmark.png"
        alt="Averlen"
        className={cn(
          'block h-auto max-w-full object-contain object-left',
          large
            ? 'w-[15.5rem]'
            : 'w-[8.1rem]',
        )}
      />
    ) : (
      <div
        className={cn(
          'flex min-w-0 items-center',
          large
            ? 'gap-4'
            : 'gap-2.5',
        )}
      >
        <img
          src="/averlen-mark.png"
          alt=""
          aria-hidden="true"
          className={cn(
            'block shrink-0 object-contain',
            large
              ? 'size-14'
              : 'size-9',
          )}
        />

        <div className="min-w-0">
          <img
            src="/averlen-wordmark.png"
            alt="Averlen"
            className={cn(
              'block h-auto max-w-full object-contain object-left',
              large
                ? 'w-[15.5rem]'
                : 'w-[8.7rem]',
            )}
          />
        </div>
      </div>
    )

  const brandClassName =
    cn(
      'inline-flex min-w-0 items-center',
      href &&
        'cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
      className,
    )

  if (href) {
    return (
      <a
        href={href}
        className={brandClassName}
        aria-label="Averlen overview"
      >
        {content}
      </a>
    )
  }

  return (
    <div className={brandClassName}>
      {content}
    </div>
  )
}
