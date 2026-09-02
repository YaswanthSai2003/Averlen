import type {
  ReactNode,
} from 'react'

import {
  Building2,
  Mail,
  UserCheck,
  UserRoundSearch,
} from 'lucide-react'

import type {
  Workspace,
  WorkspaceMember,
} from '../../../api/team'

import type {
  WorkspaceAccessRequest,
} from '../../../api/accessRequests'

import type {
  OrganizationInvite,
} from '../../../api/team'

import {
  Card,
} from '../../../components/ui'

import {
  getInviteDisplayStatus,
} from '../utils/teamFormat'


type TeamSummaryProps = {
  workspace:
    Workspace

  members:
    WorkspaceMember[]

  accessRequests:
    WorkspaceAccessRequest[]

  invites:
    OrganizationInvite[]

  onOpenMembers:
    () => void

  onOpenRequests:
    () => void

  onOpenInvites:
    () => void
}


function SummaryButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {children}
    </button>
  )
}


export function TeamSummary({
  workspace,
  members,
  accessRequests,
  invites,
  onOpenMembers,
  onOpenRequests,
  onOpenInvites,
}: TeamSummaryProps) {
  const activeMembers =
    members.filter(
      (
        member,
      ) =>
        member.is_active,
    ).length

  const pendingRequests =
    accessRequests.filter(
      (
        request,
      ) =>
        request.status ===
        'pending',
    ).length

  const pendingInvites =
    invites.filter(
      (
        invite,
      ) =>
        getInviteDisplayStatus(
          invite,
        ) ===
        'pending',
    ).length


  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Building2
              size={18}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Workspace
            </p>

            <p className="mt-1 truncate text-base font-semibold text-slate-950">
              {workspace.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {workspace.email_domain
                ? `@${workspace.email_domain}`
                : 'Invite-only membership'}
            </p>
          </div>
        </div>
      </Card>


      <SummaryButton
        onClick={
          onOpenMembers
        }
      >
        <Card className="h-full p-5 transition group-hover:border-emerald-200 group-hover:shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                Active members
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {activeMembers}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {members.length}{' '}
                total · View members
              </p>
            </div>
          </div>
        </Card>
      </SummaryButton>


      <SummaryButton
        onClick={
          onOpenRequests
        }
      >
        <Card className="h-full p-5 transition group-hover:border-violet-200 group-hover:shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <UserRoundSearch
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                Access requests
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {pendingRequests}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {pendingRequests > 0
                  ? 'Waiting for review · Open requests'
                  : 'No pending requests · View history'}
              </p>
            </div>
          </div>
        </Card>
      </SummaryButton>


      <SummaryButton
        onClick={
          onOpenInvites
        }
      >
        <Card className="h-full p-5 transition group-hover:border-amber-200 group-hover:shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Mail
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                Pending invites
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {pendingInvites}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {pendingInvites > 0
                  ? 'Awaiting registration · View invitations'
                  : 'No pending invitations · View history'}
              </p>
            </div>
          </div>
        </Card>
      </SummaryButton>
    </div>
  )
}
