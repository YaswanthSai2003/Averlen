import {
  useEffect,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  X,
} from 'lucide-react'

import {
  NavLink,
} from 'react-router'

import {
  getVisibleNavigationSections,
} from '../../app/navigation'

import {
  cn,
} from '../../lib/cn'

import type {
  UserRole,
} from '../../types/auth'

import {
  Brand,
} from './Brand'


type MobileNavigationProps = {
  role: UserRole
  open: boolean
  onOpenChange: (
    open: boolean,
  ) => void
}


export function MobileNavigation({
  role,
  open,
  onOpenChange,
}: MobileNavigationProps) {
  const sections =
    getVisibleNavigationSections(
      role,
    )

  useEffect(
    () => {
      if (!open) {
        return
      }

      const previousOverflow =
        document.body.style.overflow

      document.body.style.overflow =
        'hidden'

      function handleKeyDown(
        event: KeyboardEvent,
      ) {
        if (
          event.key ===
          'Escape'
        ) {
          onOpenChange(
            false,
          )
        }
      }

      window.addEventListener(
        'keydown',
        handleKeyDown,
      )

      return () => {
        document.body.style.overflow =
          previousOverflow

        window.removeEventListener(
          'keydown',
          handleKeyDown,
        )
      }
    },
    [
      open,
      onOpenChange,
    ],
  )

  if (!open) {
    return null
  }

  const content = (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => {
          onOpenChange(
            false,
          )
        }}
        className="fixed inset-0 z-50 cursor-default bg-slate-950/40 backdrop-blur-[1px]"
      />

      <aside
        id="mobile-app-navigation"
        aria-label="Primary navigation"
        className="
        fixed inset-y-0 left-0 z-50
        flex w-[280px] max-w-[78vw] flex-col
        border-r border-slate-200
        bg-white shadow-xl
        outline-none
        lg:hidden
        "
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <Brand
            href="/app/overview"
            wordmarkOnly
            className="max-w-[8.75rem]"
          />

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => {
              onOpenChange(
                false,
              )
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {sections.map(
            (
              section,
              sectionIndex,
            ) => (
              <div
                key={
                  section.label ??
                  `mobile-section-${sectionIndex}`
                }
                className={cn(
                  sectionIndex > 0 &&
                    'mt-3 border-t border-slate-100 pt-3',
                )}
              >
                {section.label && (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    {section.label}
                  </p>
                )}

                <div className="grid gap-1">
                  {section.items.map(
                    (item) => {
                      const Icon =
                        item.icon

                      return (
                        <NavLink
                          key={
                            item.path
                          }
                          to={
                            item.path
                          }
                          end={
                            item.path ===
                            '/app/overview'
                          }
                          onClick={() => {
                            onOpenChange(
                              false,
                            )
                          }}
                          className={(
                            {
                              isActive,
                            },
                          ) =>
                            cn(
                              'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
                              isActive
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                            )
                          }
                        >
                          <Icon
                            size={18}
                            strokeWidth={1.85}
                            className="shrink-0"
                            aria-hidden="true"
                          />

                          <span className="min-w-0 flex-1 truncate">
                            {
                              item.label
                            }
                          </span>
                        </NavLink>
                      )
                    },
                  )}
                </div>
              </div>
            ),
          )}
        </nav>
      </aside>
    </div>
  )

  return createPortal(
    content,
    document.body,
  )
}
