import {
  AlertCircle,
  LoaderCircle,
} from 'lucide-react'

import {
  Button,
} from '../../../components/ui'

import {
  SearchResultGroup,
} from './SearchResultGroup'

import type {
  GlobalSearchTarget,
  SearchTargetGroup,
} from '../utils/searchNavigation'


type SearchResultsPanelProps = {
  query:
    string

  groups:
    SearchTargetGroup[]

  selectedIndex:
    number

  resultCount:
    number

  isSearching:
    boolean

  isError:
    boolean

  minimumQueryReached:
    boolean

  onSelectedIndexChange:
    (index: number) => void

  onSelect:
    (
      target:
        GlobalSearchTarget,
    ) => void

  onRetry:
    () => void
}


export function SearchResultsPanel({
  query,
  groups,
  selectedIndex,
  resultCount,
  isSearching,
  isError,
  minimumQueryReached,
  onSelectedIndexChange,
  onSelect,
  onRetry,
}: SearchResultsPanelProps) {
  let resultOffset =
    0

  const hasResults =
    resultCount > 0

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
      <div className="scrollbar-hidden max-h-[min(56vh,500px)] overflow-y-auto px-2 pb-2">
        {!query.trim() && (
          <div className="px-3 pb-1 pt-3">
            <p className="text-xs text-slate-500">
              Quick navigation
            </p>
          </div>
        )}

        {query.trim() &&
          !minimumQueryReached && (
            <div className="px-3 py-4 text-xs text-slate-500">
              Type at least 2 characters to search workspace data.
            </div>
          )}

        {isSearching && (
          <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500">
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="animate-spin"
            />

            Searching...
          </div>
        )}

        {isError &&
          !isSearching && (
            <div className="m-2 rounded-lg border border-danger-200 bg-danger-50 p-3">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={17}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-danger-600"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-danger-900">
                    Search unavailable
                  </p>

                  <p className="mt-1 text-xs leading-5 text-danger-700">
                    Quick navigation still works.
                  </p>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={
                      onRetry
                    }
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

        {!isSearching &&
          groups.map(
            (group) => {
              const startIndex =
                resultOffset

              resultOffset +=
                group.items.length

              return (
                <SearchResultGroup
                  key={
                    group.label
                  }
                  group={
                    group
                  }
                  startIndex={
                    startIndex
                  }
                  selectedIndex={
                    selectedIndex
                  }
                  onSelectedIndexChange={
                    onSelectedIndexChange
                  }
                  onSelect={
                    onSelect
                  }
                />
              )
            },
          )}

        {!isSearching &&
          !isError &&
          query.trim() &&
          minimumQueryReached &&
          !hasResults && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-slate-800">
                No results found
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Try a property, city, import, insight or page name.
              </p>
            </div>
          )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] text-slate-400">
        <span>
          Workspace search
        </span>

        <span className="hidden sm:inline">
          ↑↓ navigate · Enter open · Esc close
        </span>
      </div>
    </div>
  )
}
