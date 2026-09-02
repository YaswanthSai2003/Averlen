import {
  Button,
} from '../../../components/ui'


type InternalPaginationProps = {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}


export function InternalPagination({
  page,
  pageCount,
  total,
  onPageChange,
}: InternalPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-slate-500">
        {total.toLocaleString('en-IN')} total
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1)
          }}
        >
          Previous
        </Button>

        <span className="min-w-20 text-center text-xs font-medium text-slate-600">
          {page} / {pageCount}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => {
            onPageChange(page + 1)
          }}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
