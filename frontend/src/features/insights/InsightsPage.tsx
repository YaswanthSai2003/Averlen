import {
  useState,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  ApiError,
} from '../../api/client'

import {
  deleteInsight,
  getInsightHistory,
  queryInsight,
  toggleInsightPin,
  type InsightResponse,
} from '../../api/insights'

import {
  PageHeader,
} from '../../components/layout'

import {
  Badge,
} from '../../components/ui'

import {
  toast,
} from '../../lib/toast'

import {
  useAuth,
} from '../auth/auth-context'

import {
  InsightAnswer,
} from './components/InsightAnswer'

import {
  InsightComposer,
} from './components/InsightComposer'

import {
  INSIGHT_HISTORY_PAGE_SIZE,
  InsightHistory,
} from './components/InsightHistory'


const INSIGHT_QUERY_ROLES =
  new Set([
    'ORG_ADMIN',
    'REVENUE_MANAGER',
    'ANALYST',
  ])


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    ApiError
  ) {
    return error.message
  }

  if (
    error instanceof
    Error
  ) {
    return error.message
  }

  return fallback
}


export function InsightsPage() {
  const {
    user,
    demoReadOnly,
  } =
    useAuth()

  const queryClient =
    useQueryClient()


  const [
    question,
    setQuestion,
  ] =
    useState('')


  const [
    currentInsight,
    setCurrentInsight,
  ] =
    useState<
      InsightResponse |
      null
    >(null)


  const [
    pinnedOnly,
    setPinnedOnly,
  ] =
    useState(false)


  const [
    historyPage,
    setHistoryPage,
  ] =
    useState(1)


  const canAsk =
    user &&
    !demoReadOnly
      ? INSIGHT_QUERY_ROLES.has(
          user.role,
        )
      : false


  const historyOffset =
    (
      historyPage -
      1
    ) *
    INSIGHT_HISTORY_PAGE_SIZE


  const historyQuery =
    useQuery({
      queryKey: [
        'insights',
        'history',
        {
          pinnedOnly,
          page:
            historyPage,
        },
      ],

      queryFn: () =>
        getInsightHistory({
          pinnedOnly,

          limit:
            INSIGHT_HISTORY_PAGE_SIZE,

          offset:
            historyOffset,
        }),
    })


  const queryMutation =
    useMutation({
      mutationFn: (
        value: string,
      ) =>
        queryInsight(
          value,
        ),

      onSuccess:
        async (
          data,
        ) => {
          setCurrentInsight(
            data,
          )

          setQuestion('')

          setHistoryPage(
            1,
          )

          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'insights',
                  'history',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'notifications',
                ],
              }),
          ])
        },
    })


  const pinMutation =
    useMutation({
      mutationFn:
        toggleInsightPin,

      onSuccess:
        async (
          data,
        ) => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'insights',
                'history',
              ],
            })

          toast.success(
            data.is_pinned
              ? 'Insight pinned'
              : 'Insight unpinned',
          )
        },

      onError: (
        error,
      ) => {
        toast.error(
          'Unable to update insight',
          {
            description:
              getErrorMessage(
                error,
                "Averlen couldn't update the pinned insight.",
              ),
          },
        )
      },
    })


  const deleteMutation =
    useMutation({
      mutationFn:
        deleteInsight,

      onSuccess:
        async () => {
          const deletingLastItem =
            (
              historyQuery
                .data
                ?.items
                .length ??
              0
            ) === 1

          if (
            deletingLastItem &&
            historyPage > 1
          ) {
            setHistoryPage(
              (
                current,
              ) =>
                Math.max(
                  1,
                  current - 1,
                ),
            )
          }

          await queryClient
            .invalidateQueries({
              queryKey: [
                'insights',
                'history',
              ],
            })

          toast.success(
            'Insight deleted',
          )
        },

      onError: (
        error,
      ) => {
        toast.error(
          'Unable to delete insight',
          {
            description:
              getErrorMessage(
                error,
                "Averlen couldn't delete the insight.",
              ),
          },
        )
      },
    })


  const queryError =
    queryMutation.isError
      ? getErrorMessage(
          queryMutation.error,
          "Averlen couldn't answer this question. Please try again.",
        )
      : null


  const historyError =
    historyQuery.isError
      ? getErrorMessage(
          historyQuery.error,
          "Averlen couldn't load insight history.",
        )
      : null


  function handleSubmit() {
    if (
      !canAsk ||
      queryMutation.isPending
    ) {
      return
    }

    const cleaned =
      question.trim()

    if (
      cleaned.length < 3 ||
      cleaned.length > 500
    ) {
      return
    }

    queryMutation.mutate(
      cleaned,
    )
  }


  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Intelligence"
        title="AI insights"
        description="Ask business-focused questions using revenue and booking data from your Averlen workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">
              AI-assisted
            </Badge>

            <Badge>
              Workspace data only
            </Badge>
          </div>
        }
      />


      <InsightComposer
        question={
          question
        }
        canAsk={
          canAsk
        }
        readOnly={
          demoReadOnly
        }
        isSubmitting={
          queryMutation
            .isPending
        }
        error={
          queryError
        }
        onQuestionChange={(
          value,
        ) => {
          setQuestion(
            value,
          )
        }}
        onSuggestion={(
          value,
        ) => {
          setQuestion(
            value,
          )
        }}
        onSubmit={
          handleSubmit
        }
      />


      {currentInsight && (
        <InsightAnswer
          insight={
            currentInsight
          }
        />
      )}


      <InsightHistory
        items={
          historyQuery
            .data
            ?.items ??
          []
        }
        total={
          historyQuery
            .data
            ?.total ??
          0
        }
        page={
          historyPage
        }
        pinnedOnly={
          pinnedOnly
        }
        canManage={
          canAsk
        }
        isLoading={
          historyQuery
            .isLoading
        }
        isError={
          historyQuery
            .isError
        }
        errorMessage={
          historyError
        }
        actionError={
          null
        }
        pinningId={
          pinMutation
            .isPending
            ? pinMutation
                .variables ??
              null
            : null
        }
        deletingId={
          deleteMutation
            .isPending
            ? deleteMutation
                .variables ??
              null
            : null
        }
        onPinnedOnlyChange={(
          value,
        ) => {
          setPinnedOnly(
            value,
          )

          setHistoryPage(
            1,
          )

        }}
        onPin={(
          id,
        ) => {
          pinMutation
            .mutate(
              id,
            )
        }}
        onDelete={(
          id,
        ) => {
          deleteMutation
            .mutate(
              id,
            )
        }}
        onPrevious={() => {
          setHistoryPage(
            (
              current,
            ) =>
              Math.max(
                1,
                current - 1,
              ),
          )
        }}
        onNext={() => {
          setHistoryPage(
            (
              current,
            ) =>
              current + 1,
          )
        }}
        onRetry={() => {
          void historyQuery
            .refetch()
        }}
      />
    </div>
  )
}
