import {
  Suspense,
  lazy,
  type ReactNode,
} from 'react'

import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import {
  TEAM_ROLES,
} from './access'

import {
  AuthenticatedLayout,
} from '../features/auth/AuthenticatedLayout'

import {
  RequireAuth,
} from '../features/auth/RequireAuth'

import {
  RequireRole,
} from '../features/auth/RequireRole'

import {
  RequirePlatformAdmin,
} from '../features/auth/RequirePlatformAdmin'

import {
  InternalLayout,
} from '../features/internal/InternalLayout'


import {
  PrivacyPage,
  TermsPage,
} from '../features/legal'

const LoginPage =
  lazy(
    () =>
      import(
        '../features/auth/LoginPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.LoginPage,
        }),
      ),
  )


const RegisterPage =
  lazy(
    () =>
      import(
        '../features/auth/RegisterPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.RegisterPage,
        }),
      ),
  )


const DashboardPage =
  lazy(
    () =>
      import(
        '../features/dashboard/DashboardPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.DashboardPage,
        }),
      ),
  )


const PropertiesPage =
  lazy(
    () =>
      import(
        '../features/properties/PropertiesPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.PropertiesPage,
        }),
      ),
  )


const PropertyDetailPage =
  lazy(
    () =>
      import(
        '../features/properties/PropertyDetailPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.PropertyDetailPage,
        }),
      ),
  )


const ImportsPage =
  lazy(
    () =>
      import(
        '../features/imports/ImportsPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.ImportsPage,
        }),
      ),
  )


const AnalyticsPage =
  lazy(
    () =>
      import(
        '../features/analytics/AnalyticsPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.AnalyticsPage,
        }),
      ),
  )


const PricingPage =
  lazy(
    () =>
      import(
        '../features/pricing/PricingPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.PricingPage,
        }),
      ),
  )


const InsightsPage =
  lazy(
    () =>
      import(
        '../features/insights/InsightsPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.InsightsPage,
        }),
      ),
  )


const NotificationsPage =
  lazy(
    () =>
      import(
        '../features/notifications/NotificationsPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.NotificationsPage,
        }),
      ),
  )


const TeamPage =
  lazy(
    () =>
      import(
        '../features/team/TeamPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.TeamPage,
        }),
      ),
  )


const SettingsPage =
  lazy(
    () =>
      import(
        '../features/settings/SettingsPage'
      ).then(
        (
          module,
        ) => ({
          default:
            module.SettingsPage,
        }),
      ),
  )



const InternalOverviewPage =
  lazy(
    () =>
      import(
        '../features/internal/pages/InternalOverviewPage'
      ).then(
        (module) => ({
          default:
            module.InternalOverviewPage,
        }),
      ),
  )


const OrganizationsPage =
  lazy(
    () =>
      import(
        '../features/internal/pages/OrganizationsPage'
      ).then(
        (module) => ({
          default:
            module.OrganizationsPage,
        }),
      ),
  )


const UsersPage =
  lazy(
    () =>
      import(
        '../features/internal/pages/UsersPage'
      ).then(
        (module) => ({
          default:
            module.UsersPage,
        }),
      ),
  )


const ActivityPage =
  lazy(
    () =>
      import(
        '../features/internal/pages/ActivityPage'
      ).then(
        (module) => ({
          default:
            module.ActivityPage,
        }),
      ),
  )


const InternalAuditPage =
  lazy(
    () =>
      import(
        '../features/audit/AuditPage'
      ).then(
        (module) => ({
          default:
            module.AuditPage,
        }),
      ),
  )


const ErrorsPage =
  lazy(
    () =>
      import(
        '../features/internal/pages/ErrorsPage'
      ).then(
        (module) => ({
          default:
            module.ErrorsPage,
        }),
      ),
  )


const UsagePage =
  lazy(
    () =>
      import(
        '../features/internal/pages/UsagePage'
      ).then(
        (module) => ({
          default:
            module.UsagePage,
        }),
      ),
  )

type LazyRouteProps = {
  children:
    ReactNode
}


function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div
        className="
          size-8
          animate-spin
          rounded-full
          border-[3px]
          border-slate-200
          border-t-brand-600
        "
        role="status"
        aria-label="Loading page"
      />
    </div>
  )
}


function LazyRoute({
  children,
}: LazyRouteProps) {
  return (
    <Suspense
      fallback={
        <RouteLoadingFallback />
      }
    >
      {children}
    </Suspense>
  )
}


export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/app/overview"
            replace
          />
        }
      />


      <Route
        path="/terms"
        element={
          <TermsPage />
        }
      />


      <Route
        path="/privacy"
        element={
          <PrivacyPage />
        }
      />


      <Route
        path="/login"
        element={
          <LazyRoute>
            <LoginPage />
          </LazyRoute>
        }
      />


      <Route
        path="/register"
        element={
          <LazyRoute>
            <RegisterPage />
          </LazyRoute>
        }
      />


      <Route
        element={
          <RequireAuth />
        }
      >
        <Route
          path="/app"
          element={
            <AuthenticatedLayout />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="overview"
                replace
              />
            }
          />


          <Route
            path="overview"
            element={
              <LazyRoute>
                <DashboardPage />
              </LazyRoute>
            }
          />


          <Route
            path="properties"
            element={
              <LazyRoute>
                <PropertiesPage />
              </LazyRoute>
            }
          />


          <Route
            path="properties/:propertyId"
            element={
              <LazyRoute>
                <PropertyDetailPage />
              </LazyRoute>
            }
          />


          <Route
            path="imports"
            element={
              <LazyRoute>
                <ImportsPage />
              </LazyRoute>
            }
          />


          <Route
            path="analytics"
            element={
              <LazyRoute>
                <AnalyticsPage />
              </LazyRoute>
            }
          />


          <Route
            path="pricing"
            element={
              <LazyRoute>
                <PricingPage />
              </LazyRoute>
            }
          />


          <Route
            path="insights"
            element={
              <LazyRoute>
                <InsightsPage />
              </LazyRoute>
            }
          />


          <Route
            path="notifications"
            element={
              <LazyRoute>
                <NotificationsPage />
              </LazyRoute>
            }
          />


          <Route
            path="team"
            element={
              <RequireRole
                allowedRoles={
                  TEAM_ROLES
                }
              >
                <LazyRoute>
                  <TeamPage />
                </LazyRoute>
              </RequireRole>
            }
          />



          <Route
            path="settings"
            element={
              <LazyRoute>
                <SettingsPage />
              </LazyRoute>
            }
          />


          <Route
            path="*"
            element={
              <Navigate
                to="/app/overview"
                replace
              />
            }
          />
        </Route>


        <Route
          element={
            <RequirePlatformAdmin />
          }
        >
          <Route
            path="/internal"
            element={
              <InternalLayout />
            }
          >
            <Route
              index
              element={
                <Navigate
                  to="overview"
                  replace
                />
              }
            />

            <Route
              path="overview"
              element={
                <LazyRoute>
                  <InternalOverviewPage />
                </LazyRoute>
              }
            />

            <Route
              path="organizations"
              element={
                <LazyRoute>
                  <OrganizationsPage />
                </LazyRoute>
              }
            />

            <Route
              path="users"
              element={
                <LazyRoute>
                  <UsersPage />
                </LazyRoute>
              }
            />

            <Route
              path="activity"
              element={
                <LazyRoute>
                  <ActivityPage />
                </LazyRoute>
              }
            />

            <Route
              path="audit"
              element={
                <LazyRoute>
                  <InternalAuditPage />
                </LazyRoute>
              }
            />

            <Route
              path="audit/:page"
              element={
                <LazyRoute>
                  <InternalAuditPage />
                </LazyRoute>
              }
            />

            <Route
              path="errors"
              element={
                <LazyRoute>
                  <ErrorsPage />
                </LazyRoute>
              }
            />

            <Route
              path="usage"
              element={
                <LazyRoute>
                  <UsagePage />
                </LazyRoute>
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/internal/overview"
                  replace
                />
              }
            />
          </Route>
        </Route>
      </Route>


      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}