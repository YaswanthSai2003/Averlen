import {
  Send,
  Sparkles,
} from 'lucide-react'

import {
  Badge,
  Button,
  Card,
} from '../../../components/ui'


const SUGGESTED_QUESTIONS = [
  'Which city has highest bookings?',
  'Which property has highest revenue?',
  'What is my total revenue?',
  'What are my total bookings?',
]


type InsightComposerProps = {
  question: string

  canAsk: boolean
  readOnly?: boolean

  isSubmitting: boolean

  error:
    string |
    null

  onQuestionChange:
    (value: string) => void

  onSubmit: () => void

  onSuggestion:
    (value: string) => void
}


export function InsightComposer({
  question,
  canAsk,
  readOnly = false,
  isSubmitting,
  error,
  onQuestionChange,
  onSubmit,
  onSuggestion,
}: InsightComposerProps) {
  const trimmedLength =
    question
      .trim()
      .length

  const canSubmit =
    canAsk &&
    !isSubmitting &&
    trimmedLength >= 3 &&
    question.length <= 500


  return (
    <Card className="mt-8 overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Sparkles
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-950">
                Ask Averlen
              </h2>

              <Badge variant="brand">
                AI-assisted
              </Badge>
            </div>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Ask questions about revenue,
              bookings, cities, properties,
              occupancy and pricing using
              your workspace data.
            </p>
          </div>
        </div>
      </div>


      <div className="p-5 sm:p-6">
        <form
          onSubmit={(
            event,
          ) => {
            event.preventDefault()

            if (canSubmit) {
              onSubmit()
            }
          }}
        >
          <label
            htmlFor="insight-question"
            className="text-sm font-medium text-slate-950"
          >
            Your question
          </label>

          <textarea
            id="insight-question"
            value={
              question
            }
            maxLength={500}
            disabled={
              !canAsk ||
              isSubmitting
            }
            placeholder="Example: Which property is generating the most revenue?"
            className="
              mt-2
              min-h-32
              w-full
              resize-y
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-sm
              leading-6
              text-slate-950
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-brand-500
              focus:ring-4
              focus:ring-brand-50
              disabled:cursor-not-allowed
              disabled:bg-slate-50
              disabled:text-slate-500
            "
            onChange={(
              event,
            ) => {
              onQuestionChange(
                event.target.value,
              )
            }}
          />


          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {question.length}/500
              characters
            </p>

            <Button
              type="submit"
              disabled={
                !canSubmit
              }
            >
              <Send
                size={16}
                aria-hidden="true"
              />

              {isSubmitting
                ? 'Thinking...'
                : 'Ask Averlen'}
            </Button>
          </div>
        </form>


        {error && (
          <p
            role="alert"
            className="mt-4 text-sm text-danger-600"
          >
            {error}
          </p>
        )}


        {!canAsk && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Read-only AI insights access
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              {readOnly
                ? 'The demo workspace can explore saved AI insights, but creating, pinning or deleting insights is disabled.'
                : 'Your role can review saved insight history, but only analysts, revenue managers and workspace admins can ask new questions.'}
            </p>
          </div>
        )}


        {canAsk && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Try asking
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map(
                (
                  suggestion,
                ) => (
                  <button
                    key={
                      suggestion
                    }
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    className="
                      rounded-full
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2
                      text-sm
                      text-slate-700
                      transition
                      hover:border-brand-200
                      hover:bg-brand-50
                      hover:text-brand-700
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                    onClick={() => {
                      onSuggestion(
                        suggestion,
                      )
                    }}
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
