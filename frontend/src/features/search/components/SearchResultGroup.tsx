import {
  ArrowUpRight,
} from 'lucide-react'

import type {
  GlobalSearchTarget,
  SearchTargetGroup,
} from '../utils/searchNavigation'


type SearchResultGroupProps = {
  group:
    SearchTargetGroup

  startIndex:
    number

  selectedIndex:
    number

  onSelectedIndexChange:
    (index: number) => void

  onSelect:
    (
      target:
        GlobalSearchTarget,
    ) => void
}


export function SearchResultGroup({
  group,
  startIndex,
  selectedIndex,
  onSelectedIndexChange,
  onSelect,
}: SearchResultGroupProps) {
  return (
    <section>
      <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {group.label}
      </p>

      <div className="space-y-0.5">
        {group.items.map(
          (
            item,
            itemIndex,
          ) => {
            const index =
              startIndex +
              itemIndex

            const selected =
              index ===
              selectedIndex

            const Icon =
              item.icon

            return (
              <button
                key={
                  item.key
                }
                type="button"
                data-search-index={
                  index
                }
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  transition
                  ${
                    selected
                      ? 'bg-brand-50 text-brand-950'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                  }
                `}
                onMouseEnter={() => {
                  onSelectedIndexChange(
                    index,
                  )
                }}
                onClick={() => {
                  onSelect(
                    item,
                  )
                }}
              >
                <span
                  className={`
                    flex
                    size-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    ${
                      selected
                        ? 'bg-white text-brand-700 ring-1 ring-brand-100'
                        : 'bg-slate-100 text-slate-500'
                    }
                  `}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>

                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {
                      item.subtitle
                    }
                  </span>
                </span>

                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  className={
                    selected
                      ? 'shrink-0 text-brand-500'
                      : 'shrink-0 text-slate-300'
                  }
                />
              </button>
            )
          },
        )}
      </div>
    </section>
  )
}
