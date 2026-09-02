import {
  ShieldCheck,
} from 'lucide-react'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
  Card,
} from '../../components/ui'

import {
  ActiveSessions,
} from './components/ActiveSessions'

import {
  ProfileSettings,
} from './components/ProfileSettings'

import {
  SecuritySettings,
} from './components/SecuritySettings'

import {
  useAuth,
} from '../auth/auth-context'


export function SettingsPage() {
  const {
    demoReadOnly,
  } =
    useAuth()


  return (
    <div className="mx-auto max-w-[1160px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account details, security and signed-in devices."
      />


      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <ShieldCheck
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-950">
                  Account & security
                </h2>

                {demoReadOnly && (
                  <Badge variant="warning">
                    Read only
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Your personal Averlen account information and security settings.
              </p>
            </div>
          </div>
        </div>


        <ProfileSettings
          readOnly={
            demoReadOnly
          }
        />


        <div className="border-t border-slate-200">
          <SecuritySettings
            readOnly={
              demoReadOnly
            }
          />
        </div>
      </Card>


      <div className="mt-6">
        <ActiveSessions
          readOnly={
            demoReadOnly
          }
        />
      </div>
    </div>
  )
}
