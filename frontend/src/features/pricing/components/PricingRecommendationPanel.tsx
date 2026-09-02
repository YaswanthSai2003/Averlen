import {
  Gauge,
  IndianRupee,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import {
  type PricingRecommendation,
} from '../../../api/pricing'

import {
  Badge,
  Button,
  Card,
  MetricCard,
} from '../../../components/ui'

import {
  formatCurrency,
  formatDecimal,
} from '../../../lib/format'

import {
  formatPricingLabel,
  formatSignedPercent,
  getAdjustmentVariant,
  getChangeTone,
} from '../utils/pricingFormat'


type PricingRecommendationPanelProps = {
  recommendation:
    PricingRecommendation

  propertyName: string

  canManage: boolean
  readOnly?: boolean

  isGenerating: boolean

  generateError:
    string |
    null

  onGenerate: () => void
}


function getAdjustmentIcon(
  adjustmentType: string,
) {
  switch (
    adjustmentType.toLowerCase()
  ) {
    case 'increase':
      return (
        <TrendingUp
          size={18}
          aria-hidden="true"
        />
      )

    case 'decrease':
      return (
        <TrendingDown
          size={18}
          aria-hidden="true"
        />
      )

    default:
      return (
        <Minus
          size={18}
          aria-hidden="true"
        />
      )
  }
}


export function PricingRecommendationPanel({
  recommendation,
  propertyName,
  canManage,
  readOnly = false,
  isGenerating,
  generateError,
  onGenerate,
}: PricingRecommendationPanelProps) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Sparkles
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Pricing recommendation
              </h2>

              <Badge
                variant={
                  getAdjustmentVariant(
                    recommendation
                      .adjustment_type,
                  )
                }
              >
                {formatPricingLabel(
                  recommendation
                    .adjustment_type,
                )}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Live preview for{' '}
              {propertyName}.
              Previewing does not create
              history.
            </p>
          </div>
        </div>


        {canManage ? (
          <Button
            disabled={
              isGenerating
            }
            onClick={
              onGenerate
            }
          >
            <Sparkles
              size={16}
              aria-hidden="true"
            />

            {isGenerating
              ? 'Generating...'
              : 'Generate & save'}
          </Button>
        ) : (
          <Badge>
            Preview only
          </Badge>
        )}
      </div>


      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Current base price"
            value={
              formatCurrency(
                recommendation
                  .current_base_price,
              )
            }
            description="Current property setting"
            icon={
              <IndianRupee
                size={18}
                aria-hidden="true"
              />
            }
          />


          <MetricCard
            label="Recommended price"
            value={
              formatCurrency(
                recommendation
                  .recommended_price,
              )
            }
            description={`${formatPricingLabel(
              recommendation
                .adjustment_type,
            )} recommendation`}
            icon={
              getAdjustmentIcon(
                recommendation
                  .adjustment_type,
              )
            }
          />


          <MetricCard
            label="Price change"
            value={
              formatSignedPercent(
                recommendation
                  .price_change_percent,
                formatDecimal,
              )
            }
            change={
              formatSignedPercent(
                recommendation
                  .price_change_percent,
                formatDecimal,
              )
            }
            changeTone={
              getChangeTone(
                recommendation
                  .price_change_percent,
              )
            }
            description="vs current base price"
            icon={
              getAdjustmentIcon(
                recommendation
                  .adjustment_type,
              )
            }
          />


          <MetricCard
            label="Confidence"
            value={`${formatDecimal(
              recommendation
                .confidence_score,
              0,
            )}%`}
            description="Recommendation confidence"
            icon={
              <Gauge
                size={18}
                aria-hidden="true"
              />
            }
          />
        </div>


        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            Recommendation rationale
          </p>

          <p className="mt-2 text-base font-medium leading-7 text-slate-950">
            {
              recommendation
                .reason
            }
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {
              recommendation
                .explanation_summary
            }
          </p>
        </div>


        {generateError && (
          <p
            role="alert"
            className="mt-4 text-sm text-danger-600"
          >
            {generateError}
          </p>
        )}


        {!canManage && (
          <p className="mt-4 text-sm text-slate-500">
            {readOnly
              ? 'The demo workspace is read-only. You can review pricing recommendations and saved history, but cannot generate or change recommendation status.'
              : 'Only workspace admins and revenue managers can generate and save recommendation history.'}
          </p>
        )}
      </div>
    </Card>
  )
}
