import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button } from './Button'

type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

type PaginationItem =
  | number
  | 'start-ellipsis'
  | 'end-ellipsis'

function buildPaginationItems(
  page: number,
  pageCount: number,
): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from(
      { length: pageCount },
      (_, index) => index + 1,
    )
  }

  const items: PaginationItem[] = [1]

  if (page > 3) {
    items.push('start-ellipsis')
  }

  const rangeStart = Math.max(2, page - 1)
  const rangeEnd = Math.min(pageCount - 1, page + 1)

  for (
    let current = rangeStart;
    current <= rangeEnd;
    current += 1
  ) {
    items.push(current)
  }

  if (page < pageCount - 2) {
    items.push('end-ellipsis')
  }

  items.push(pageCount)

  return items
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  if (pageCount <= 1) {
    return null
  }

  const items = buildPaginationItems(
    page,
    pageCount,
  )

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex min-w-0 items-center justify-between gap-2 sm:gap-4',
        className,
      )}
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        aria-label="Go to previous page"
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft
          size={16}
          aria-hidden="true"
        />

        <span className="hidden sm:inline">
          Previous
        </span>
      </Button>

      <div className="hidden items-center gap-1 sm:flex">
        {items.map((item) => {
          if (
            item === 'start-ellipsis' ||
            item === 'end-ellipsis'
          ) {
            return (
              <span
                key={item}
                className="flex size-9 items-center justify-center text-slate-400"
              >
                <MoreHorizontal
                  size={17}
                  aria-hidden="true"
                />

                <span className="sr-only">
                  More pages
                </span>
              </span>
            )
          }

          const isCurrent = item === page

          return (
            <Button
              key={item}
              variant={
                isCurrent
                  ? 'primary'
                  : 'ghost'
              }
              size="sm"
              className="min-w-9 px-2"
              aria-current={
                isCurrent
                  ? 'page'
                  : undefined
              }
              aria-label={`Go to page ${item}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          )
        })}
      </div>

      <span className="min-w-0 truncate px-2 text-center text-xs font-medium text-slate-500 sm:hidden">
        Page {page} of {pageCount}
      </span>

      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        aria-label="Go to next page"
        onClick={() => onPageChange(page + 1)}
      >
        <span className="hidden sm:inline">
          Next
        </span>

        <ChevronRight
          size={16}
          aria-hidden="true"
        />
      </Button>
    </nav>
  )
}