import {
  Button,
  Card,
  Input,
} from '../../../components/ui'

import {
  type DatePreset,
} from '../utils/analyticsFormat'


type AnalyticsDateFilterProps = {
  startDate: string
  endDate: string
  today: string
  activePreset:
    DatePreset | null
  isDefaultPeriod: boolean
  periodLabel: string
  hasPendingChanges: boolean
  canApply: boolean
  rangeError?: string
  onStartDateChange:
    (value: string) => void
  onEndDateChange:
    (value: string) => void
  onPreset:
    (preset: DatePreset) => void
  onApply: () => void
  onReset: () => void
}


const PRESETS: Array<{
  value: DatePreset
  label: string
}> = [
  {
    value: 'all',
    label: 'All time',
  },
  {
    value: 'ytd',
    label: 'YTD',
  },
  {
    value: '90d',
    label: '90 days',
  },
  {
    value: '30d',
    label: '30 days',
  },
]


export function AnalyticsDateFilter({
  startDate,
  endDate,
  today,
  activePreset,
  isDefaultPeriod,
  periodLabel,
  hasPendingChanges,
  canApply,
  rangeError,
  onStartDateChange,
  onEndDateChange,
  onPreset,
  onApply,
  onReset,
}: AnalyticsDateFilterProps) {
  const hasIncompleteRange =
    Boolean(startDate) !==
    Boolean(endDate)

  return (
    <Card className="mt-8 p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Analysis period
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Current view · {periodLabel}
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            aria-label="Analytics date presets"
          >
            {PRESETS.map(
              (preset) => (
                <Button
                  key={
                    preset.value
                  }
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-pressed={
                    activePreset ===
                    preset.value
                  }
                  className={
                    activePreset ===
                    preset.value
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : undefined
                  }
                  onClick={() => {
                    onPreset(
                      preset.value,
                    )
                  }}
                >
                  {preset.label}
                </Button>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            label="From date"
            type="date"
            max={
              endDate ||
              today
            }
            value={startDate}
            className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            onClick={(event) => {
              event.currentTarget
                .showPicker?.()
            }}
            onChange={(event) => {
              onStartDateChange(
                event.target.value,
              )
            }}
          />

          <Input
            label="To date"
            type="date"
            min={
              startDate ||
              undefined
            }
            max={today}
            value={endDate}
            className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            onClick={(event) => {
              event.currentTarget
                .showPicker?.()
            }}
            onChange={(event) => {
              onEndDateChange(
                event.target.value,
              )
            }}
            error={
              rangeError
            }
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {rangeError
              ? 'Adjust the dates before applying this range.'
              : hasIncompleteRange
                ? 'Select both dates to apply a custom range.'
                : hasPendingChanges
                  ? 'Date range ready to apply.'
                  : 'Choose a preset or enter a custom date range.'}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={
                isDefaultPeriod &&
                !hasPendingChanges
              }
              onClick={
                onReset
              }
            >
              Clear
            </Button>

            <Button
              type="button"
              disabled={
                !canApply
              }
              onClick={
                onApply
              }
            >
              Apply range
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
