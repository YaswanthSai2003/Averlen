import {
  Activity,
  ArrowLeft,
  Building2,
  BarChart3,
  CircleAlert,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react'

import {
  Link,
  NavLink,
  Outlet,
} from 'react-router'

import {
  useAuth,
} from '../auth/auth-context'


const INTERNAL_NAV_ITEMS = [
  {
    label: 'Overview',
    path: '/internal/overview',
    icon: LayoutDashboard,
  },
  {
    label: 'Organizations',
    path: '/internal/organizations',
    icon: Building2,
  },
  {
    label: 'Users',
    path: '/internal/users',
    icon: Users,
  },
  {
    label: 'Platform activity',
    path: '/internal/activity',
    icon: Activity,
  },
  {
    label: 'Audit logs',
    path: '/internal/audit',
    icon: ClipboardList,
  },
  {
    label: 'Errors',
    path: '/internal/errors',
    icon: CircleAlert,
  },
  {
    label: 'Usage',
    path: '/internal/usage',
    icon: BarChart3,
  },
] as const


function InternalNavigation() {
  return (
    <nav className="space-y-1">
      {INTERNAL_NAV_ITEMS.map(
        ({
          label,
          path,
          icon: Icon,
        }) => (
          <NavLink
            key={path}
            to={path}
            className={({
              isActive,
            }) => `
              flex items-center gap-3
              rounded-lg px-3 py-2.5
              text-sm font-medium transition
              ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }
            `}
          >
            <Icon
              size={17}
              aria-hidden="true"
            />
            {label}
          </NavLink>
        ),
      )}
    </nav>
  )
}


export function InternalLayout() {
  const {
    user,
  } = useAuth()

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-5 pt-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShieldCheck
                size={20}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="font-semibold text-slate-950">
                Averlen
              </p>
              <p className="text-xs text-slate-500">
                Internal console
              </p>
            </div>
          </div>

          <div className="mt-5 flex-1">
            <InternalNavigation />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="truncate px-2 text-xs font-medium text-slate-700">
              {user?.email}
            </p>
            <p className="mt-1 px-2 text-xs text-slate-400">
              Platform administrator
            </p>

            <Link
              to="/app/overview"
              className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <ArrowLeft
                size={16}
                aria-hidden="true"
              />
              Back to workspace
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={18}
                className="text-slate-900"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-slate-950">
                Internal console
              </span>
            </div>

            <Link
              to="/app/overview"
              className="text-xs font-medium text-slate-600"
            >
              Workspace
            </Link>
          </div>

          <div className="overflow-x-auto px-3 pb-3">
            <div className="flex min-w-max gap-1">
              {INTERNAL_NAV_ITEMS.map(
                ({
                  label,
                  path,
                }) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({
                      isActive,
                    }) => `
                      rounded-lg px-3 py-2
                      text-xs font-medium transition
                      ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }
                    `}
                  >
                    {label}
                  </NavLink>
                ),
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
