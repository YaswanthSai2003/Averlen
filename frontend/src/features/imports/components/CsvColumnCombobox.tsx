import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import {
  Check,
  ChevronDown,
  Search,
} from 'lucide-react'


type CsvColumnComboboxProps = {
  label: string

  description: string

  columns: string[]

  value: string

  disabled?: boolean

  unavailableColumns:
    Set<string>

  suggested?: boolean

  onChange: (
    value: string,
  ) => void
}


export function CsvColumnCombobox({
  label,
  description,
  columns,
  value,
  disabled = false,
  unavailableColumns,
  suggested = false,
  onChange,
}: CsvColumnComboboxProps) {
  const rootRef =
    useRef<HTMLDivElement>(
      null,
    )

  const searchRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    open,
    setOpen,
  ] =
    useState(false)

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0)


  const filteredColumns =
    useMemo(
      () => {
        const normalizedQuery =
          query
            .trim()
            .toLowerCase()

        if (!normalizedQuery) {
          return columns
        }

        return columns.filter(
          (column) =>
            column
              .toLowerCase()
              .includes(
                normalizedQuery,
              ),
        )
      },
      [
        columns,
        query,
      ],
    )


  useEffect(
    () => {
      if (!open) {
        return
      }

      function handleOutsideClick(
        event: MouseEvent,
      ) {
        const target =
          event.target

        if (
          target instanceof Node &&
          !rootRef.current
            ?.contains(target)
        ) {
          setOpen(false)
          setQuery('')
        }
      }

      document.addEventListener(
        'mousedown',
        handleOutsideClick,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          handleOutsideClick,
        )
      }
    },
    [
      open,
    ],
  )


  function openMenu() {
    if (disabled) {
      return
    }

    setActiveIndex(0)
    setQuery('')
    setOpen(true)

    window.setTimeout(
      () => {
        searchRef.current
          ?.focus()
      },
      0,
    )
  }


  function closeMenu() {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }


  function toggleMenu() {
    if (open) {
      closeMenu()
      return
    }

    openMenu()
  }


  function selectColumn(
    column: string,
  ) {
    const usedElsewhere =
      unavailableColumns.has(
        column,
      ) &&
      column !== value

    if (usedElsewhere) {
      return
    }

    onChange(column)

    closeMenu()
  }


  function handleQueryChange(
    nextQuery: string,
  ) {
    setQuery(nextQuery)
    setActiveIndex(0)
  }


  function moveActiveIndex(
    direction: 1 | -1,
  ) {
    if (
      filteredColumns.length ===
      0
    ) {
      return
    }

    setActiveIndex(
      (current) => {
        let next =
          current +
          direction

        if (
          next <
          0
        ) {
          next =
            filteredColumns.length -
            1
        }

        if (
          next >=
          filteredColumns.length
        ) {
          next = 0
        }

        return next
      },
    )
  }


  function handleKeyDown(
    event:
      KeyboardEvent<
        HTMLInputElement
      >,
  ) {
    if (
      event.key ===
      'ArrowDown'
    ) {
      event.preventDefault()

      moveActiveIndex(1)

      return
    }

    if (
      event.key ===
      'ArrowUp'
    ) {
      event.preventDefault()

      moveActiveIndex(-1)

      return
    }

    if (
      event.key ===
      'Escape'
    ) {
      event.preventDefault()

      closeMenu()

      return
    }

    if (
      event.key !==
      'Enter'
    ) {
      return
    }

    event.preventDefault()

    const selected =
      filteredColumns[
        activeIndex
      ]

    if (!selected) {
      return
    }

    selectColumn(selected)
  }


  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">
          {label}
        </span>

        {suggested &&
          value && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
            Auto-matched
          </span>
        )}
      </div>


      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={
          toggleMenu
        }
        className="
          flex
          h-12
          w-full
          items-center
          justify-between
          gap-3
          rounded-lg
          border
          border-slate-300
          bg-white
          px-4
          text-left
          text-sm
          transition
          hover:border-slate-400
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand-500
          focus-visible:ring-offset-1
          disabled:cursor-not-allowed
          disabled:bg-slate-50
          disabled:text-slate-400
        "
      >
        <span
          className={
            value
              ? (
                  'min-w-0 truncate ' +
                  'text-slate-900'
                )
              : (
                  'min-w-0 truncate ' +
                  'text-slate-400'
                )
          }
        >
          {value ||
            'Select CSV column'}
        </span>

        <ChevronDown
          size={17}
          className="shrink-0 text-slate-500"
          aria-hidden="true"
        />
      </button>


      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-full
            z-50
            mt-2
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-xl
          "
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search
                size={16}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
                aria-hidden="true"
              />

              <input
                ref={searchRef}
                type="text"
                value={query}
                placeholder="Search CSV columns..."
                onChange={(
                  event,
                ) => {
                  handleQueryChange(
                    event.target.value,
                  )
                }}
                onKeyDown={
                  handleKeyDown
                }
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-slate-200
                  bg-slate-50
                  pl-9
                  pr-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-brand-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-brand-100
                "
              />
            </div>
          </div>


          <div
            role="listbox"
            className="
              max-h-60
              overflow-y-auto
              p-1.5
            "
          >
            {filteredColumns.length >
            0 ? (
              filteredColumns.map(
                (
                  column,
                  index,
                ) => {
                  const selected =
                    column ===
                    value

                  const usedElsewhere =
                    unavailableColumns.has(
                      column,
                    ) &&
                    !selected

                  const active =
                    index ===
                    activeIndex

                  return (
                    <button
                      key={column}
                      type="button"
                      role="option"
                      aria-selected={
                        selected
                      }
                      disabled={
                        usedElsewhere
                      }
                      onMouseEnter={() => {
                        setActiveIndex(
                          index,
                        )
                      }}
                      onClick={() => {
                        selectColumn(
                          column,
                        )
                      }}
                      className={`
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-3
                        rounded-lg
                        px-3
                        py-2.5
                        text-left
                        text-sm
                        transition
                        ${
                          active &&
                          !usedElsewhere
                            ? (
                                'bg-slate-100 ' +
                                'text-slate-950'
                              )
                            : (
                                'text-slate-700'
                              )
                        }
                        ${
                          usedElsewhere
                            ? (
                                'cursor-not-allowed ' +
                                'opacity-45'
                              )
                            : (
                                'hover:bg-slate-100'
                              )
                        }
                      `}
                    >
                      <span className="min-w-0 truncate">
                        {column}
                      </span>

                      <span className="flex shrink-0 items-center gap-2">
                        {usedElsewhere && (
                          <span className="text-xs text-slate-400">
                            Used
                          </span>
                        )}

                        {selected && (
                          <Check
                            size={16}
                            className="text-brand-600"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  )
                },
              )
            ) : (
              <div className="px-4 py-7 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No matching
                  columns
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Search only matches
                  columns that actually
                  exist in this CSV.
                </p>
              </div>
            )}
          </div>
        </div>
      )}


      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  )
}