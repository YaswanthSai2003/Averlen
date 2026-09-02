import {
  Check,
  History,
  X,
} from 'lucide-react'

import {
  type PricingHistoryStatus,
  type PricingRecommendationHistory,
} from '../../../api/pricing'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  formatCurrency,
  formatDecimal,
  formatNumber,
} from '../../../lib/format'

import {
  formatPricingDateTime,
  formatPricingLabel,
  formatSignedPercent,
  getRiskVariant,
  getStatusVariant,
} from '../utils/pricingFormat'


export const PRICING_HISTORY_PAGE_SIZE =
  10


type HistoryActionsProps = {
  item:
    PricingRecommendationHistory

  canManage: boolean

  isUpdating: boolean

  onChangeStatus:
    (
      historyId: number,
      status:
        PricingHistoryStatus,
    ) => void
}


function HistoryActions({
  item,
  canManage,
  isUpdating,
  onChangeStatus,
}: HistoryActionsProps) {
  if (!canManage) {
    return (
      <span className="text-sm text-slate-400">
        —
      </span>
    )
  }


  if (
    item.status ===
    'generated'
  ) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={
            isUpdating
          }
          onClick={() => {
            onChangeStatus(
              item.id,
              'accepted',
            )
          }}
        >
          <Check
            size={14}
            aria-hidden="true"
          />

          Accept
        </Button>


        <Button
          variant="secondary"
          size="sm"
          disabled={
            isUpdating
          }
          onClick={() => {
            onChangeStatus(
              item.id,
              'rejected',
            )
          }}
        >
          <X
            size={14}
            aria-hidden="true"
          />

          Reject
        </Button>
      </div>
    )
  }


  if (
    item.status ===
    'accepted'
  ) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled={
          isUpdating
        }
        onClick={() => {
          onChangeStatus(
            item.id,
            'applied',
          )
        }}
      >
        <Check
          size={14}
          aria-hidden="true"
        />

        Mark applied
      </Button>
    )
  }


  return (
    <span className="text-sm text-slate-400">
      —
    </span>
  )
}


type PricingHistoryProps = {
  items:
    PricingRecommendationHistory[]

  total: number

  page: number

  canManage: boolean

  isLoading: boolean

  isError: boolean

  errorMessage:
    string |
    null

  updatingHistoryId:
    number |
    null

  onPrevious: () => void

  onNext: () => void

  onRetry: () => void

  onChangeStatus:
    (
      historyId: number,
      status:
        PricingHistoryStatus,
    ) => void
}


export function PricingHistory({
  items,
  total,
  page,
  canManage,
  isLoading,
  isError,
  errorMessage,
  updatingHistoryId,
  onPrevious,
  onNext,
  onRetry,
  onChangeStatus,
}: PricingHistoryProps) {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        PRICING_HISTORY_PAGE_SIZE,
      ),
    )


  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <History
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Recommendation history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Saved pricing decisions for
              this property.
            </p>
          </div>
        </div>

        <Badge>
          {formatNumber(
            total,
          )}{' '}
          saved
        </Badge>
      </div>


      {isLoading ? (
        <div className="space-y-3 p-6">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-14 rounded-lg"
              />
            ),
          )}
        </div>
      ) : isError ? (
        <div className="p-6">
          <ErrorState
            title="Unable to load pricing history"
            description={
              errorMessage ??
              "Averlen couldn't load saved recommendations."
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
      ) : items.length === 0 ? (
        <EmptyState
          title="No saved recommendations yet"
          description="The live recommendation above is only a preview. Generate and save it to begin building pricing history."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Generated
                  </TableHead>

                  <TableHead>
                    Current
                  </TableHead>

                  <TableHead>
                    Recommended
                  </TableHead>

                  <TableHead>
                    Change
                  </TableHead>

                  <TableHead>
                    Confidence
                  </TableHead>

                  <TableHead>
                    Risk
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>


              <TableBody>
                {items.map(
                  (item) => (
                    <TableRow
                      key={
                        item.id
                      }
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatPricingDateTime(
                          item
                            .created_at,
                        )}
                      </TableCell>


                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          item
                            .current_base_price,
                        )}
                      </TableCell>


                      <TableCell className="font-medium text-slate-950 [font-variant-numeric:tabular-nums]">
                        {formatCurrency(
                          item
                            .recommended_price,
                        )}
                      </TableCell>


                      <TableCell
                        className={
                          item
                            .price_change_percent >
                          0
                            ? 'text-emerald-700'
                            : item
                                  .price_change_percent <
                                0
                              ? 'text-red-600'
                              : 'text-slate-600'
                        }
                      >
                        {formatSignedPercent(
                          item
                            .price_change_percent,
                          formatDecimal,
                        )}
                      </TableCell>


                      <TableCell className="[font-variant-numeric:tabular-nums]">
                        {formatDecimal(
                          item
                            .confidence_score,
                          0,
                        )}
                        %
                      </TableCell>


                      <TableCell>
                        <Badge
                          variant={
                            getRiskVariant(
                              item
                                .risk_level,
                            )
                          }
                        >
                          {formatPricingLabel(
                            item
                              .risk_level,
                          )}
                        </Badge>
                      </TableCell>


                      <TableCell>
                        <Badge
                          variant={
                            getStatusVariant(
                              item
                                .status,
                            )
                          }
                        >
                          {formatPricingLabel(
                            item
                              .status,
                          )}
                        </Badge>
                      </TableCell>


                      <TableCell>
                        <HistoryActions
                          item={
                            item
                          }
                          canManage={
                            canManage
                          }
                          isUpdating={
                            updatingHistoryId ===
                            item.id
                          }
                          onChangeStatus={
                            onChangeStatus
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
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