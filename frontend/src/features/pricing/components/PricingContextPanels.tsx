import {
  type ReactNode,
} from 'react'

import {
  Building2,
  Database,
  MapPin,
} from 'lucide-react'

import {
  type PricingRecommendation,
} from '../../../api/pricing'

import {
  Badge,
  Card,
} from '../../../components/ui'

import {
  formatCurrency,
  formatDecimal,
  formatNumber,
} from '../../../lib/format'

import {
  formatPricingLabel,
  getQualityVariant,
  getRiskVariant,
} from '../utils/pricingFormat'


type ScoreBarProps = {
  label: string
  value: number
  description: string
}


function ScoreBar({
  label,
  value,
  description,
}: ScoreBarProps) {
  const normalized =
    Math.max(
      0,
      Math.min(
        100,
        value,
      ),
    )

  const barClass =
    normalized >= 75
      ? 'bg-emerald-500'
      : normalized >= 60
        ? 'bg-amber-500'
        : 'bg-red-500'

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-950">
            {label}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span className="shrink-0 text-lg font-semibold text-slate-950 [font-variant-numeric:tabular-nums]">
          {formatDecimal(
            value,
            0,
          )}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{
            width:
              `${normalized}%`,
          }}
        />
      </div>
    </div>
  )
}


type ContextMetricProps = {
  icon:
    ReactNode

  label: string

  value: string
}


function ContextMetric({
  icon,
  label,
  value,
}: ContextMetricProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <p className="text-sm">
          {label}
        </p>
      </div>

      <p className="mt-3 text-xl font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}


type PricingContextPanelsProps = {
  recommendation:
    PricingRecommendation
}


export function PricingContextPanels({
  recommendation,
}: PricingContextPanelsProps) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Pricing confidence
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Demand strength and evidence
              behind this recommendation.
            </p>
          </div>

          <Badge
            variant={
              getRiskVariant(
                recommendation
                  .risk_level,
              )
            }
          >
            {formatPricingLabel(
              recommendation
                .risk_level,
            )}{' '}
            risk
          </Badge>
        </div>


        <div className="mt-6 space-y-6">
          <ScoreBar
            label="Demand score"
            value={
              recommendation
                .demand_score
            }
            description="Property volume and city-level booking value signals."
          />

          <ScoreBar
            label="Confidence score"
            value={
              recommendation
                .confidence_score
            }
            description="Higher booking history increases confidence."
          />
        </div>


        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-5">
          <Badge
            variant={
              getQualityVariant(
                recommendation
                  .data_quality,
              )
            }
          >
            Data quality:{' '}
            {formatPricingLabel(
              recommendation
                .data_quality,
            )}
          </Badge>

          <Badge
            variant={
              getRiskVariant(
                recommendation
                  .risk_level,
              )
            }
          >
            Risk:{' '}
            {formatPricingLabel(
              recommendation
                .risk_level,
            )}
          </Badge>
        </div>
      </Card>


      <Card className="p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Market context
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Property and city-level inputs
            used by the pricing model.
          </p>
        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ContextMetric
            icon={
              <Building2
                size={16}
                aria-hidden="true"
              />
            }
            label="Property average"
            value={
              formatCurrency(
                recommendation
                  .property_average_price,
              )
            }
          />

          <ContextMetric
            icon={
              <MapPin
                size={16}
                aria-hidden="true"
              />
            }
            label="City average"
            value={
              formatCurrency(
                recommendation
                  .city_average_price,
              )
            }
          />

          <ContextMetric
            icon={
              <Database
                size={16}
                aria-hidden="true"
              />
            }
            label="Property bookings"
            value={
              formatNumber(
                recommendation
                  .booking_volume,
              )
            }
          />

          <ContextMetric
            icon={
              <Database
                size={16}
                aria-hidden="true"
              />
            }
            label="City bookings"
            value={
              formatNumber(
                recommendation
                  .city_booking_volume,
              )
            }
          />
        </div>
      </Card>
    </div>
  )
}