import {
  Database,
  Sparkles,
} from 'lucide-react'

import {
  type InsightResponse,
} from '../../../api/insights'

import {
  Badge,
  Card,
} from '../../../components/ui'

import {
  formatConfidence,
  getConfidenceVariant,
  getSourceLabel,
  getSourceVariant,
  parseSupportingFact,
} from '../utils/insightFormat'

import {
  InsightContent,
} from './InsightContent'


type InsightAnswerProps = {
  insight:
    InsightResponse
}


export function InsightAnswer({
  insight,
}: InsightAnswerProps) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Sparkles
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Latest answer
            </p>

            <h2 className="mt-1 text-lg font-semibold leading-7 text-slate-950">
              {insight.question}
            </h2>
          </div>
        </div>


        <div className="flex flex-wrap gap-2">
          <Badge
            variant={
              getSourceVariant(
                insight.source,
              )
            }
          >
            {getSourceLabel(
              insight.source,
            )}
          </Badge>

          <Badge
            variant={
              getConfidenceVariant(
                insight.confidence,
              )
            }
          >
            {formatConfidence(
              insight.confidence,
            )}{' '}
            confidence
          </Badge>
        </div>
      </div>


      <div className="p-5 sm:p-6">
        {insight.source ===
          'fallback' && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Fallback analysis used
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              The external AI service was
              unavailable or not configured,
              so Averlen answered using
              its built-in revenue analysis.
            </p>
          </div>
        )}


        {insight.source ===
          'blocked' && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Request blocked
            </p>

            <p className="mt-1 text-sm leading-6 text-red-800">
              Averlen restricted this
              request because it was outside
              the supported workspace-data
              question scope.
            </p>
          </div>
        )}


        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-5 sm:px-6 sm:py-6">
          <InsightContent
            content={
              insight.answer
            }
          />
        </div>


        {insight
          .supporting_facts
          .length > 0 && (
          <section className="mt-7">
            <div className="flex items-center gap-2">
              <Database
                size={17}
                className="text-slate-500"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold text-slate-950">
                Supporting workspace
                facts
              </h3>
            </div>


            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {insight
                .supporting_facts
                .map(
                  (
                    fact,
                    index,
                  ) => {
                    const parsed =
                      parseSupportingFact(
                        fact,
                      )

                    return (
                      <div
                        key={`${fact}-${index}`}
                        className="
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-4
                        "
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {parsed.label}
                        </p>

                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {parsed.value}
                        </p>
                      </div>
                    )
                  },
                )}
            </div>
          </section>
        )}
      </div>
    </Card>
  )
}