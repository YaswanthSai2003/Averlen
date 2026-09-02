import {
  useState,
} from 'react'

import {
  MoreHorizontal,
  ShieldAlert,
  UserX,
} from 'lucide-react'

import type {
  WorkspaceMember,
  WorkspaceRole,
} from '../../../api/team'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui'

import {
  getMemberDisplayName,
  TEAM_ROLE_OPTIONS,
} from '../utils/teamFormat'


type MemberActionsProps = {
  member:
    WorkspaceMember

  activeAdminCount:
    number

  isChangingRole:
    boolean

  isDeactivating:
    boolean

  onRoleChange:
    (
      userId: number,
      role: WorkspaceRole,
    ) => void

  onDeactivate:
    (userId: number) => void
}


export function MemberActions({
  member,
  activeAdminCount,
  isChangingRole,
  isDeactivating,
  onRoleChange,
  onDeactivate,
}: MemberActionsProps) {
  const [
    deactivateOpen,
    setDeactivateOpen,
  ] =
    useState(false)


  const isLastActiveAdmin =
    member.is_active &&
    member.role ===
      'ORG_ADMIN' &&
    activeAdminCount <= 1


  const actionsDisabled =
    !member.is_active


  return (
    <>
      <div className="flex items-start justify-start gap-2">
        <div className="min-w-44">
          <select
            aria-label={`Role for ${getMemberDisplayName(
              member,
            )}`}
            value={
              member.role
            }
            disabled={
              actionsDisabled ||
              isChangingRole ||
              isLastActiveAdmin
            }
            onChange={(
              event,
            ) => {
              onRoleChange(
                member.id,
                event
                  .target
                  .value as
                  WorkspaceRole,
              )
            }}
            className="
              h-9
              w-full
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              text-sm
              text-slate-700
              outline-none
              transition
              hover:border-slate-300
              focus:border-brand-500
              focus:ring-2
              focus:ring-brand-100
              disabled:cursor-not-allowed
              disabled:bg-slate-50
              disabled:text-slate-400
            "
          >
            {TEAM_ROLE_OPTIONS.map(
              (role) => (
                <option
                  key={
                    role.value
                  }
                  value={
                    role.value
                  }
                >
                  {role.label}
                </option>
              ),
            )}
          </select>

          {isLastActiveAdmin && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
              <ShieldAlert
                size={12}
                aria-hidden="true"
              />

              Last active admin
            </p>
          )}
        </div>


        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
          >
            <button
              type="button"
              aria-label="Member actions"
              disabled={
                actionsDisabled
              }
              className="
                flex
                size-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-slate-200
                bg-white
                text-slate-500
                transition
                hover:bg-slate-50
                hover:text-slate-900
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-brand-500
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <MoreHorizontal
                size={17}
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="w-52"
          >
            <DropdownMenuItem
              destructive
              disabled={
                isLastActiveAdmin ||
                isDeactivating
              }
              onSelect={() => {
                setDeactivateOpen(
                  true,
                )
              }}
            >
              <UserX
                size={16}
                aria-hidden="true"
              />

              Deactivate member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      <Dialog
        open={
          deactivateOpen
        }
        onOpenChange={
          setDeactivateOpen
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Deactivate member?
            </DialogTitle>

            <DialogDescription>
              This member will lose
              access to the workspace
              and their active sessions
              will be revoked.
            </DialogDescription>
          </DialogHeader>


          <div className="mt-5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
            <p className="text-sm font-semibold text-danger-800">
              {getMemberDisplayName(
                member,
              )}
            </p>

            <p className="mt-1 text-sm text-danger-700">
              {member.email}
            </p>
          </div>


          <DialogFooter className="mt-6">
            <Button
              variant="secondary"
              disabled={
                isDeactivating
              }
              onClick={() => {
                setDeactivateOpen(
                  false,
                )
              }}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              disabled={
                isDeactivating
              }
              onClick={() => {
                onDeactivate(
                  member.id,
                )

                setDeactivateOpen(
                  false,
                )
              }}
            >
              <UserX
                size={16}
                aria-hidden="true"
              />

              {isDeactivating
                ? 'Deactivating...'
                : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}