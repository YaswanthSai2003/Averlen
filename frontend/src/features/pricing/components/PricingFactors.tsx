import {
  type PricingFactor,
} from '../../../api/pricing'

import {
  Badge,
  Card,
} from '../../../components/ui'

import {
  formatPricingLabel,
  getImpactVariant,
} from '../utils/pricingFormat'


type PricingFactorsProps = {
  factors:
    PricingFactor[]
}


export function PricingFactors({
  factors,
}: PricingFactorsProps) {
  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Pricing factors
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Explainable signals contributing
          to the recommendation.
        </p>
      </div>


      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {factors.map(
          (
            factor,
            index,
          ) => (
            <div
              key={`${factor.name}-${index}`}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-950">
                  {factor.name}
                </p>

                <Badge
                  variant={
                    getImpactVariant(
                      factor
                        .impact,
                    )
                  }
                >
                  {formatPricingLabel(
                    factor
                      .impact,
                  )}
                </Badge>
              </div>

              <p className="mt-3 text-2xl font-semibold text-slate-950 [font-variant-numeric:tabular-nums]">
                {factor.value}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {
                  factor
                    .explanation
                }
              </p>
            </div>
          ),
        )}
      </div>
    </Card>
  )
}