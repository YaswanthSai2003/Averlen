import {
  type ReactNode,
} from 'react'

import {
  Database,
  IndianRupee,
  Settings,
  Shield,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'

import {
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '../../../api/notifications'

import {
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
} from '../../../components/ui'


type PreferenceDefinition = {
  key:
    NotificationPreferenceKey |
    'security_enabled'

  title: string

  description: string

  icon: ReactNode
}


const PREFERENCES:
  PreferenceDefinition[] = [
    {
      key:
        'upload_enabled',

      title:
        'Uploads',

      description:
        'Successful or failed booking imports.',

      icon: (
        <Upload
          size={17}
          aria-hidden="true"
        />
      ),
    },

    {
      key:
        'data_quality_enabled',

      title:
        'Data quality',

      description:
        'Import issues, duplicates and skipped rows.',

      icon: (
        <Database
          size={17}
          aria-hidden="true"
        />
      ),
    },

    {
      key:
        'pricing_enabled',

      title:
        'Pricing',

      description:
        'Meaningful pricing opportunities and recommendations.',

      icon: (
        <IndianRupee
          size={17}
          aria-hidden="true"
        />
      ),
    },

    {
      key:
        'workspace_enabled',

      title:
        'Workspace',

      description:
        'Workspace-level activity and collaboration events.',

      icon: (
        <Users
          size={17}
          aria-hidden="true"
        />
      ),
    },

    {
      key:
        'ai_insight_enabled',

      title:
        'AI insights',

      description:
        'AI-assisted insight activity and related events.',

      icon: (
        <Sparkles
          size={17}
          aria-hidden="true"
        />
      ),
    },

    {
      key:
        'system_enabled',

      title:
        'System',

      description:
        'Important Averlen system activity.',

      icon: (
        <Settings
          size={17}
          aria-hidden="true"
        />
      ),
    },

    {
      key:
        'security_enabled',

      title:
        'Security',

      description:
        'Login, password and account-security alerts.',

      icon: (
        <Shield
          size={17}
          aria-hidden="true"
        />
      ),
    },
  ]


type NotificationPreferencesProps = {
  readOnly?: boolean

  preferences:
    NotificationPreferences |
    undefined

  isLoading: boolean

  isError: boolean

  errorMessage:
    string |
    null

  updatingKey:
    NotificationPreferenceKey |
    null

  updateError:
    string |
    null

  onToggle:
    (
      key:
        NotificationPreferenceKey,
      value:
        boolean,
    ) => void

  onRetry: () => void
}


export function NotificationPreferences({
  readOnly = false,
  preferences,
  isLoading,
  isError,
  errorMessage,
  updatingKey,
  updateError,
  onToggle,
  onRetry,
}: NotificationPreferencesProps) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-slate-950">
            Notification preferences
          </h2>

          {readOnly && (
            <Badge variant="warning">
              Read only
            </Badge>
          )}
        </div>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Choose which optional
          notification categories
          Averlen should store for
          your account.
        </p>
      </div>


      {updateError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 sm:px-6">
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {updateError}
          </p>
        </div>
      )}


      {isLoading ? (
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
          {Array.from({
            length: 6,
          }).map(
            (
              _,
              index,
            ) => (
              <Skeleton
                key={index}
                className="h-24 rounded-xl"
              />
            ),
          )}
        </div>
      ) : isError ||
        !preferences ? (
        <div className="p-5 sm:p-6">
          <ErrorState
            title="Unable to load preferences"
            description={
              errorMessage ??
              "Averlen couldn't load notification preferences."
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={
                  onRetry
                }
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
          {PREFERENCES.map(
            (
              preference,
            ) => {
              const isSecurity =
                preference.key ===
                'security_enabled'


              const enabled =
                preferences[
                  preference.key
                ]


              const isUpdating =
                preference.key !==
                  'security_enabled' &&
                updatingKey ===
                  preference.key


              return (
                <div
                  key={
                    preference.key
                  }
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      {
                        preference.icon
                      }
                    </div>


                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {
                            preference.title
                          }
                        </p>

                        {isSecurity && (
                          <Badge variant="success">
                            Always on
                          </Badge>
                        )}
                      </div>


                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {
                          preference.description
                        }
                      </p>
                    </div>
                  </div>


                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      enabled
                    }
                    aria-label={`${preference.title} notifications`}
                    disabled={
                      readOnly ||
                      isSecurity ||
                      isUpdating
                    }
                    className={`
                      relative
                      h-6
                      w-11
                      shrink-0
                      rounded-full
                      transition
                      focus:outline-none
                      focus:ring-4
                      focus:ring-brand-100
                      disabled:cursor-not-allowed
                      disabled:opacity-70
                      ${
                        enabled
                          ? 'bg-brand-600'
                          : 'bg-slate-300'
                      }
                    `}
                    onClick={() => {
                      if (
                        preference.key ===
                        'security_enabled'
                      ) {
                        return
                      }

                      onToggle(
                        preference.key,
                        !enabled,
                      )
                    }}
                  >
                    <span
                      className={`
                        absolute
                        top-0.5
                        size-5
                        rounded-full
                        bg-white
                        shadow-sm
                        transition
                        ${
                          enabled
                            ? 'left-5'
                            : 'left-0.5'
                        }
                      `}
                    />
                  </button>
                </div>
              )
            },
          )}
        </div>
      )}
    </Card>
  )
}
