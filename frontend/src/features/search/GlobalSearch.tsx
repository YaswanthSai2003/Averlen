import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  Search,
  X,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  searchAverlen,
} from '../../api/search'

import type {
  UserRole,
} from '../../types/auth'

import {
  SearchResultsPanel,
} from './components/SearchResultsPanel'

import {
  getBackendSearchTargets,
  getPageSearchTargets,
  groupSearchTargets,
  type GlobalSearchTarget,
} from './utils/searchNavigation'


const SEARCH_DEBOUNCE_MS =
  250


function getSearchShortcutLabel(): string | null {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined'
  ) {
    return null
  }

  const isTouchFirstDevice =
    window.matchMedia(
      '(pointer: coarse)',
    ).matches &&
    window.matchMedia(
      '(hover: none)',
    ).matches

  if (isTouchFirstDevice) {
    return null
  }

  const platform =
    `${navigator.platform} ${navigator.userAgent}`
      .toLowerCase()

  const isMac =
    platform.includes('mac')

  return isMac
    ? '⌘ K'
    : 'Ctrl K'
}


type GlobalSearchProps = {
  role:
    UserRole
}


export function GlobalSearch({
  role,
}: GlobalSearchProps) {
  const navigate =
    useNavigate()

  const shortcutLabel =
    getSearchShortcutLabel()

  const containerRef =
    useRef<HTMLDivElement>(
      null,
    )

  const desktopInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const mobileInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    )

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(
      false,
    )

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    debouncedQuery,
    setDebouncedQuery,
  ] =
    useState('')

  const [
    selectedIndex,
    setSelectedIndex,
  ] =
    useState(0)

  const normalizedQuery =
    query.trim()

  const minimumQueryReached =
    normalizedQuery.length >=
    2


  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setDebouncedQuery(
              normalizedQuery,
            )
          },
          SEARCH_DEBOUNCE_MS,
        )

      return () => {
        window.clearTimeout(
          timer,
        )
      }
    },
    [
      normalizedQuery,
    ],
  )


  useEffect(
    () => {
      function handleShortcut(
        event:
          globalThis.KeyboardEvent,
      ) {
        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key
            .toLowerCase() ===
            'k'
        ) {
          event.preventDefault()

          setOpen(
            true,
          )

          window.setTimeout(
            () => {
              desktopInputRef
                .current
                ?.focus()
            },
            0,
          )
        }
      }

      window.addEventListener(
        'keydown',
        handleShortcut,
      )

      return () => {
        window.removeEventListener(
          'keydown',
          handleShortcut,
        )
      }
    },
    [],
  )


  useEffect(
    () => {
      function handlePointerDown(
        event:
          MouseEvent,
      ) {
        const target =
          event.target

        if (
          target instanceof
            Node &&
          containerRef.current &&
          !containerRef.current
            .contains(
              target,
            )
        ) {
          setOpen(
            false,
          )
        }
      }

      document.addEventListener(
        'mousedown',
        handlePointerDown,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          handlePointerDown,
        )
      }
    },
    [],
  )


  const searchQuery =
    useQuery({
      queryKey: [
        'global-search',
        debouncedQuery,
      ],

      queryFn: () =>
        searchAverlen(
          debouncedQuery,
        ),

      enabled:
        (
          open ||
          mobileOpen
        ) &&
        debouncedQuery.length >=
          2,

      staleTime:
        30_000,

      retry:
        1,
    })


  const pageTargets =
    useMemo(
      () =>
        getPageSearchTargets(
          normalizedQuery,
          role,
        ),
      [
        normalizedQuery,
        role,
      ],
    )


  const backendTargets =
    useMemo(
      () => {
        if (
          !minimumQueryReached ||
          debouncedQuery !==
            normalizedQuery
        ) {
          return []
        }

        return (
          getBackendSearchTargets(
            searchQuery.data
              ?.results ??
              [],
            role,
          )
        )
      },
      [
        debouncedQuery,
        minimumQueryReached,
        normalizedQuery,
        role,
        searchQuery.data,
      ],
    )


  const groups =
    useMemo(
      () =>
        groupSearchTargets([
          ...pageTargets,
          ...backendTargets,
        ]),
      [
        backendTargets,
        pageTargets,
      ],
    )


  const flattenedResults =
    useMemo(
      () =>
        groups.flatMap(
          (group) =>
            group.items,
        ),
      [
        groups,
      ],
    )


  const resultCount =
    flattenedResults.length

  const isWaitingForDebounce =
    minimumQueryReached &&
    debouncedQuery !==
      normalizedQuery

  const isSearching =
    isWaitingForDebounce ||
    (
      minimumQueryReached &&
      searchQuery.isFetching
    )

  const isError =
    minimumQueryReached &&
    debouncedQuery ===
      normalizedQuery &&
    searchQuery.isError


  useEffect(
    () => {
      if (
        resultCount === 0
      ) {
        return
      }

      const selectedElement =
        document.querySelector(
          `[data-search-index="${selectedIndex}"]`,
        )

      selectedElement
        ?.scrollIntoView({
          block:
            'nearest',
        })
    },
    [
      resultCount,
      selectedIndex,
    ],
  )


  function clearSearch() {
    setQuery('')
    setDebouncedQuery('')
    setSelectedIndex(
      0,
    )
  }


  function closeDesktop() {
    setOpen(
      false,
    )
  }


  function closeMobile() {
    setMobileOpen(
      false,
    )
  }


  function openTarget(
    target:
      GlobalSearchTarget,
  ) {
    navigate(
      target.path,
    )

    clearSearch()
    closeDesktop()
    closeMobile()
  }


  function handleKeyDown(
    event:
      KeyboardEvent<HTMLInputElement>,
    close:
      () => void,
  ) {
    if (
      event.key ===
      'Escape'
    ) {
      event.preventDefault()

      close()

      event.currentTarget
        .blur()

      return
    }

    if (
      event.key ===
      'ArrowDown'
    ) {
      event.preventDefault()

      if (
        resultCount >
        0
      ) {
        setSelectedIndex(
          (current) =>
            (
              current + 1
            ) %
            resultCount,
        )
      }

      return
    }

    if (
      event.key ===
      'ArrowUp'
    ) {
      event.preventDefault()

      if (
        resultCount >
        0
      ) {
        setSelectedIndex(
          (current) =>
            (
              current -
              1 +
              resultCount
            ) %
            resultCount,
        )
      }

      return
    }

    if (
      event.key ===
      'Enter'
    ) {
      const target =
        flattenedResults[
          selectedIndex
        ]

      if (target) {
        event.preventDefault()

        openTarget(
          target,
        )
      }
    }
  }


  const resultsPanel =
    (
      <SearchResultsPanel
        query={
          query
        }
        groups={
          groups
        }
        selectedIndex={
          selectedIndex
        }
        resultCount={
          resultCount
        }
        isSearching={
          isSearching
        }
        isError={
          isError
        }
        minimumQueryReached={
          minimumQueryReached
        }
        onSelectedIndexChange={
          setSelectedIndex
        }
        onSelect={
          openTarget
        }
        onRetry={() => {
          void searchQuery
            .refetch()
        }}
      />
    )


  return (
    <>
      <div
        ref={
          containerRef
        }
        className="relative hidden min-w-0 flex-1 max-w-[40rem] md:block"
      >
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
        />

        <input
          ref={
            desktopInputRef
          }
          type="text"
          value={
            query
          }
          autoComplete="off"
          spellCheck={false}
          placeholder="Search properties, imports, insights..."
          aria-label="Search Averlen"
          className="
            h-10
            w-full
            rounded-xl
            border
            border-slate-200
            bg-slate-50/80
            pl-10
            pr-16
            text-sm
            font-normal
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            shadow-[0_1px_2px_rgba(15,23,42,0.03)]
            hover:border-slate-300
            hover:bg-white
            focus:border-brand-400
            focus:bg-white
            focus:ring-2
            focus:ring-brand-100/80
          "
          onFocus={() => {
            setOpen(
              true,
            )
          }}
          onChange={(
            event,
          ) => {
            setQuery(
              event.target
                .value,
            )

            setSelectedIndex(
              0,
            )

            setOpen(
              true,
            )
          }}
          onKeyDown={(
            event,
          ) => {
            handleKeyDown(
              event,
              closeDesktop,
            )
          }}
        />

        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(
              event,
            ) => {
              event.preventDefault()
            }}
            onClick={() => {
              clearSearch()

              desktopInputRef
                .current
                ?.focus()
            }}
            className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X
              size={15}
              aria-hidden="true"
            />
          </button>
        ) : shortcutLabel ? (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            {shortcutLabel}
          </kbd>
        ) : null}

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2">
            {resultsPanel}
          </div>
        )}
      </div>


      <div className="relative md:hidden">
        <button
          type="button"
          aria-label="Search Averlen"
          onClick={() => {
            setMobileOpen(
              true,
            )

            window.setTimeout(
              () => {
                mobileInputRef
                  .current
                  ?.focus()
              },
              0,
            )
          }}
          className="
            flex
            size-10
            items-center
            justify-center
            rounded-lg
            text-slate-500
            transition-colors
            hover:bg-slate-100
            hover:text-slate-900
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-500
          "
        >
          <Search
            size={19}
            aria-hidden="true"
          />
        </button>

        {mobileOpen && (
          <div className="fixed left-3 right-3 top-[4.4rem] z-50 md:hidden">
            <div className="mb-2 flex items-center rounded-xl border border-slate-200 bg-white shadow-lg">
              <Search
                size={17}
                aria-hidden="true"
                className="ml-3 shrink-0 text-slate-400"
              />

              <input
                ref={
                  mobileInputRef
                }
                type="text"
                value={
                  query
                }
                autoComplete="off"
                spellCheck={false}
                placeholder="Search Averlen..."
                aria-label="Search Averlen"
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(
                  event,
                ) => {
                  setQuery(
                    event.target
                      .value,
                  )

                  setSelectedIndex(
                    0,
                  )
                }}
                onKeyDown={(
                  event,
                ) => {
                  handleKeyDown(
                    event,
                    closeMobile,
                  )
                }}
              />

              <button
                type="button"
                className="mr-2 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={
                  query
                    ? 'Clear search'
                    : 'Close search'
                }
                onClick={() => {
                  if (query) {
                    clearSearch()

                    mobileInputRef
                      .current
                      ?.focus()

                    return
                  }

                  closeMobile()
                }}
              >
                <X
                  size={16}
                  aria-hidden="true"
                />
              </button>
            </div>

            {resultsPanel}
          </div>
        )}
      </div>
    </>
  )
}