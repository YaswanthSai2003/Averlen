import { Archive, Building2, RotateCcw } from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  Select,
} from '../../../components/ui'
import { formatNumber } from '../../../lib/format'

type PropertyToolbarProps = {
  showArchived: boolean
  count: number
  city: string
  propertyType: string
  cities: string[]
  propertyTypes: string[]
  hasFilters: boolean
  updating: boolean
  onShowArchivedChange: (archived: boolean) => void
  onCityChange: (city: string) => void
  onPropertyTypeChange: (propertyType: string) => void
  onResetFilters: () => void
}

export function PropertyToolbar({
  showArchived,
  count,
  city,
  propertyType,
  cities,
  propertyTypes,
  hasFilters,
  updating,
  onShowArchivedChange,
  onCityChange,
  onPropertyTypeChange,
  onResetFilters,
}: PropertyToolbarProps) {
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              aria-pressed={!showArchived}
              onClick={() => onShowArchivedChange(false)}
              className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                !showArchived
                  ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 size={15} aria-hidden="true" />
              Active
            </button>

            <button
              type="button"
              aria-pressed={showArchived}
              onClick={() => onShowArchivedChange(true)}
              className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Archive size={15} aria-hidden="true" />
              Archived
            </button>
          </div>

          <span className="text-sm text-slate-500">
            {formatNumber(count)} {count === 1 ? 'property' : 'properties'}
          </span>

          {updating && <Badge variant="brand">Updating</Badge>}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            <RotateCcw size={15} aria-hidden="true" />
            Reset filters
          </Button>
        )}
      </div>

      {(cities.length > 0 || propertyTypes.length > 0 || hasFilters) && (
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:max-w-2xl">
          <Select
            label="City"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((cityOption) => (
              <option key={cityOption} value={cityOption}>
                {cityOption}
              </option>
            ))}
          </Select>

          <Select
            label="Property type"
            value={propertyType}
            onChange={(event) => onPropertyTypeChange(event.target.value)}
          >
            <option value="">All types</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
      )}
    </Card>
  )
}
