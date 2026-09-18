import {
  Filter,
} from 'lucide-react'

import {
  Card,
  Select,
} from '../../../components/ui'

import {
  NOTIFICATION_TYPES,
} from '../utils/notificationFormat'


type NotificationFiltersProps = {
  notificationType: string
  includeRead: boolean

  onTypeChange:
    (value: string) => void

  onIncludeReadChange:
    (value: boolean) => void
}


export function NotificationFilters({
  notificationType,
  includeRead,
  onTypeChange,
  onIncludeReadChange,
}: NotificationFiltersProps) {
  return (
    <Card className="mt-5 px-4 py-4 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Filter
              size={17}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">
              Activity filters
            </p>

            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Narrow the feed without leaving the page.
            </p>
          </div>
        </div>


        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(12rem,1fr)] lg:w-auto lg:grid-cols-[auto_13rem] lg:items-end">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Status
            </p>

            <div className="grid h-10 w-full grid-cols-2 rounded-lg border border-slate-300 bg-slate-50 p-1 sm:inline-grid sm:w-auto">
              <button
                type="button"
                aria-pressed={
                  includeRead
                }
                className={`
                  flex-1
                  rounded-md
                  px-4
                  text-sm
                  font-medium
                  transition
                  sm:flex-none
                  ${
                    includeRead
                      ? 'bg-slate-100 text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                onClick={() => {
                  onIncludeReadChange(
                    true,
                  )
                }}
              >
                All
              </button>

              <button
                type="button"
                aria-pressed={
                  !includeRead
                }
                className={`
                  flex-1
                  rounded-md
                  px-4
                  text-sm
                  font-medium
                  transition
                  sm:flex-none
                  ${
                    !includeRead
                      ? 'bg-slate-100 text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                onClick={() => {
                  onIncludeReadChange(
                    false,
                  )
                }}
              >
                Unread
              </button>
            </div>
          </div>


          <Select
            label="Type"
            value={
              notificationType
            }
            onChange={(
              event,
            ) => {
              onTypeChange(
                event.target.value,
              )
            }}
          >
            {NOTIFICATION_TYPES.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>
              ),
            )}
          </Select>
        </div>
      </div>
    </Card>
  )
}
