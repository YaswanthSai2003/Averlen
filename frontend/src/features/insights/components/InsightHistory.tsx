import {
  History,
  Pin,
  Trash2,
} from 'lucide-react'

import {
  type InsightHistoryItem,
} from '../../../api/insights'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../../components/ui'

import {
  formatConfidence,
  formatInsightDateTime,
  formatSupportingFact,
  getConfidenceVariant,
  getSourceLabel,
  getSourceVariant,
} from '../utils/insightFormat'

import {
  InsightContent,
} from './InsightContent'


export const INSIGHT_HISTORY_PAGE_SIZE =
  10


type InsightHistoryProps = {
  items:
    InsightHistoryItem[]

  total: number

  page: number

  pinnedOnly: boolean

  canManage: boolean

  isLoading: boolean

  isError: boolean

  errorMessage:
    string |
    null

  pinningId:
    number |
    null

  deletingId:
    number |
    null

  actionError:
    string |
    null

  onPinnedOnlyChange:
    (value: boolean) => void

  onPin:
    (id: number) => void

  onDelete:
    (id: number) => void

  onPrevious: () => void

  onNext: () => void

  onRetry: () => void
}


export function InsightHistory({
  items,
  total,
  page,
  pinnedOnly,
  canManage,
  isLoading,
  isError,
  errorMessage,
  pinningId,
  deletingId,
  actionError,
  onPinnedOnlyChange,
  onPin,
  onDelete,
  onPrevious,
  onNext,
  onRetry,
}: InsightHistoryProps) {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        INSIGHT_HISTORY_PAGE_SIZE,
      ),
    )


  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <History
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Insight history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Previous questions and
              answers from this workspace.
            </p>
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <Badge>
            {total} saved
          </Badge>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onPinnedOnlyChange(
                !pinnedOnly,
              )
            }}
          >
            <Pin
              size={14}
              aria-hidden="true"
            />

            {pinnedOnly
              ? 'Show all'
              : 'Pinned only'}
          </Button>
        </div>
      </div>


      {actionError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 sm:px-6">
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {actionError}
          </p>
        </div>
      )}


      {isLoading ? (
        <div className="space-y-4 p-5 sm:p-6">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-44 rounded-xl"
              />
            ),
          )}
        </div>
      ) : isError ? (
        <div className="p-5 sm:p-6">
          <ErrorState
            title="Unable to load insight history"
            description={
              errorMessage ??
              "Averlen couldn't load saved AI insights."
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={
                  onRetry
                }
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : items.length ===
        0 ? (
        <EmptyState
          title={
            pinnedOnly
              ? 'No pinned insights'
              : 'No insight history yet'
          }
          description={
            pinnedOnly
              ? 'Pin useful insights and they will appear here.'
              : 'Ask Averlen a workspace question to create your first saved insight.'
          }
        />
      ) : (
        <>
          <div className="divide-y divide-slate-200">
            {items.map(
              (item) => {
                const visibleFacts =
                  item
                    .supporting_facts
                    .slice(
                      0,
                      3,
                    )

                const hiddenFactCount =
                  Math.max(
                    0,
                    item
                      .supporting_facts
                      .length -
                      visibleFacts.length,
                  )


                return (
                  <article
                    key={
                      item.id
                    }
                    className="px-5 py-6 sm:px-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.is_pinned && (
                            <Badge variant="brand">
                              Pinned
                            </Badge>
                          )}

                          <Badge
                            variant={
                              getSourceVariant(
                                item.source,
                              )
                            }
                          >
                            {getSourceLabel(
                              item.source,
                            )}
                          </Badge>

                          <Badge
                            variant={
                              getConfidenceVariant(
                                item.confidence,
                              )
                            }
                          >
                            {formatConfidence(
                              item.confidence,
                            )}
                          </Badge>
                        </div>


                        <h3 className="mt-4 text-base font-semibold leading-6 text-slate-950">
                          {item.question}
                        </h3>


                        <div className="mt-3 max-w-5xl">
                          <InsightContent
                            content={
                              item.answer
                            }
                            compact
                          />
                        </div>


                        <p className="mt-4 text-xs text-slate-400">
                          {formatInsightDateTime(
                            item.created_at,
                          )}
                        </p>


                        {visibleFacts.length >
                          0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {visibleFacts.map(
                              (
                                fact,
                                index,
                              ) => (
                                <span
                                  key={`${item.id}-${fact}-${index}`}
                                  className="
                                    rounded-full
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    px-3
                                    py-1.5
                                    text-xs
                                    text-slate-600
                                  "
                                >
                                  {formatSupportingFact(
                                    fact,
                                  )}
                                </span>
                              ),
                            )}

                            {hiddenFactCount >
                              0 && (
                              <span
                                className="
                                  rounded-full
                                  border
                                  border-slate-200
                                  bg-slate-50
                                  px-3
                                  py-1.5
                                  text-xs
                                  text-slate-500
                                "
                              >
                                +
                                {hiddenFactCount}{' '}
                                more
                              </span>
                            )}
                          </div>
                        )}
                      </div>


                      {canManage && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                              pinningId ===
                              item.id
                            }
                            onClick={() => {
                              onPin(
                                item.id,
                              )
                            }}
                          >
                            <Pin
                              size={14}
                              aria-hidden="true"
                            />

                            {pinningId ===
                            item.id
                              ? 'Saving...'
                              : item.is_pinned
                                ? 'Unpin'
                                : 'Pin'}
                          </Button>


                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                              deletingId ===
                              item.id
                            }
                            onClick={() => {
                              onDelete(
                                item.id,
                              )
                            }}
                          >
                            <Trash2
                              size={14}
                              aria-hidden="true"
                            />

                            {deletingId ===
                            item.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              },
            )}
          </div>


          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Page {page} of{' '}
              {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={
                  page <= 1
                }
                onClick={
                  onPrevious
                }
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={
                  page >=
                  totalPages
                }
                onClick={
                  onNext
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}