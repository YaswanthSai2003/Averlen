import { Menu } from 'lucide-react'
import { NavLink } from 'react-router'

import {
  getVisibleNavigationSections,
} from '../../app/navigation'

import { cn } from '../../lib/cn'
import type { UserRole } from '../../types/auth'

import { Brand } from './Brand'

type SidebarProps = {
  role: UserRole
  expanded: boolean
  onToggle: () => void
  onNavigate?: () => void
}

export function Sidebar({
  role,
  expanded,
  onToggle,
  onNavigate,
}: SidebarProps) {
  const sections =
    getVisibleNavigationSections(role)

  return (
    <aside
      id="app-navigation"
      className="flex h-screen w-full min-w-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white"
    >
      <div
        className={cn(
          'flex h-[4.25rem] shrink-0 items-center',
          expanded
            ? 'px-3'
            : 'justify-center px-0',
        )}
      >
        {expanded ? (
          <>
            <div className="flex min-w-0 flex-1 items-center pl-3">
              <Brand
                href="/app/overview"
                wordmarkOnly
                className="max-w-full"
              />
            </div>

            <button
              type="button"
              aria-label="Collapse navigation"
              title="Collapse navigation"
              onClick={
                onToggle
              }
              className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
            >
              <Menu
                size={19}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </button>
          </>
        ) : (
          <Brand
            href="/app/overview"
            compact
            className="justify-center"
          />
        )}
      </div>

      <nav
        className={cn(
          'scrollbar-hidden flex-1 overflow-y-auto pb-5 pt-4',
          expanded
            ? 'px-2.5'
            : 'px-2',
        )}
      >
        {sections.map(
          (section, sectionIndex) => (
            <div
              key={
                section.label ??
                `section-${sectionIndex}`
              }
              className={cn(
                sectionIndex > 0 &&
                  (
                    expanded
                      ? 'mt-[1.15rem]'
                      : 'mt-2 border-t border-slate-100 pt-2'
                  ),
              )}
            >
              {section.label && expanded && (
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {section.label}
                </p>
              )}

              <div className="grid gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/app/overview'}
                      aria-label={
                        expanded
                          ? undefined
                          : item.label
                      }
                      title={
                        expanded
                          ? undefined
                          : item.label
                      }
                      onClick={
                        onNavigate
                      }
                      className={({ isActive }) =>
                        cn(
                          'flex h-10 items-center rounded-lg text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
                          expanded
                            ? 'gap-2.5 px-2.5'
                            : 'mx-auto w-10 justify-center px-0',
                          isActive
                            ? 'bg-brand-50/90 text-brand-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                        )
                      }
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.85}
                        className="shrink-0"
                        aria-hidden="true"
                      />

                      {expanded && (
                        <span className="min-w-0 truncate">
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ),
        )}
      </nav>
    </aside>
  )
}
