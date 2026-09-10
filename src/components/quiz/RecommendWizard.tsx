import { useMemo, useState } from 'react'
import type { Category, Product } from '@/types'
import {
  EMPTY_ANSWERS,
  budgetBands,
  isAnswered,
  recommend,
  usefulRequirements,
  type QuizAnswers,
} from '@/lib/recommend'
import { formatPrice, seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Badge, Button, Modal } from '@/components/ui/primitives'
import { DeviceGlyph } from '@/components/DeviceGlyph'

/**
 * Guided recommendation wizard.
 *
 * Three questions, all generated from the category schema: a budget band drawn
 * from the real price distribution, the pillars that matter, and the quick
 * filters treated as hard requirements. Results carry their reasons and the
 * weights used, so the recommendation can be argued with rather than just
 * accepted.
 */
export function RecommendWizard({
  category,
  catalogue,
  open,
  onClose,
  onCompare,
  onApplyWeights,
}: {
  category: Category
  catalogue: Product[]
  open: boolean
  onClose: () => void
  onCompare: (ids: string[], weights: Record<string, number>) => void
  onApplyWeights: (weights: Record<string, number>) => void
}) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY_ANSWERS)

  const bands = useMemo(() => budgetBands(catalogue), [catalogue])
  const requirements = useMemo(
    () => usefulRequirements(category, catalogue),
    [category, catalogue],
  )

  const outcome = useMemo(
    () => (isAnswered(answers) ? recommend(category, catalogue, answers) : null),
    [category, catalogue, answers],
  )

  const reset = () => {
    setStep(0)
    setAnswers(EMPTY_ANSWERS)
  }

  const togglePriority = (id: string) => {
    setAnswers((current) => {
      const has = current.priorities.includes(id)
      if (has) return { ...current, priorities: current.priorities.filter((p) => p !== id) }
      // Two is the useful maximum: a third choice barely moves the ranking and
      // makes the question feel like a checklist rather than a decision.
      if (current.priorities.length >= 2) {
        return { ...current, priorities: [current.priorities[1], id] }
      }
      return { ...current, priorities: [...current.priorities, id] }
    })
  }

  const steps = ['Budget', 'Priorities', 'Must-haves', 'Results']

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      size="lg"
      title={`Help me choose a ${category.singular}`}
      description="Three questions. The answer explains itself, and you can change it after."
      footer={
        <>
          {step > 0 && (
            <Button size="sm" variant="ghost" icon="ArrowLeft" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <span className="mr-auto text-[11.5px] text-faint">
            Step {Math.min(step + 1, steps.length)} of {steps.length} · {steps[step]}
          </span>
          {step < 2 && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && answers.priorities.length === 0}
            >
              Next
            </Button>
          )}
          {step === 2 && (
            <Button size="sm" variant="primary" onClick={() => setStep(3)}>
              See results
            </Button>
          )}
          {step === 3 && (
            <Button size="sm" variant="ghost" icon="RotateCcw" onClick={reset}>
              Start over
            </Button>
          )}
        </>
      }
    >
      {/* ------------------------------------------------------- 1. budget */}
      {step === 0 && (
        <div>
          <h3 className="mb-1 text-[14px] font-semibold text-ink">What are you spending?</h3>
          <p className="mb-4 text-[12.5px] text-muted">
            Bands come from the actual prices in this category.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {bands.map((band) => (
              <button
                key={band.label}
                type="button"
                onClick={() => {
                  setAnswers((c) => ({ ...c, budget: band.max }))
                  setStep(1)
                }}
                className={cn(
                  'flex items-center justify-between rounded-md border px-3.5 py-3 text-left transition-colors',
                  answers.budget === band.max
                    ? 'border-brand bg-brand-soft'
                    : 'border-line hover:border-line-strong hover:bg-surface-2',
                )}
              >
                <span className="text-[13px] font-medium text-ink">{band.label}</span>
                <span className="tnum text-[11.5px] text-faint">{band.count} devices</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------- 2. priorities */}
      {step === 1 && (
        <div>
          <h3 className="mb-1 text-[14px] font-semibold text-ink">What matters most?</h3>
          <p className="mb-4 text-[12.5px] text-muted">
            Pick one or two. The first counts most — that is exactly how the score is weighted.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {category.pillars.map((pillar) => {
              const rank = answers.priorities.indexOf(pillar.id)
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => togglePriority(pillar.id)}
                  className={cn(
                    'rounded-md border px-3.5 py-3 text-left transition-colors',
                    rank !== -1
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong hover:bg-surface-2',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-ink">{pillar.label}</span>
                    {rank !== -1 && (
                      <Badge tone="brand">{rank === 0 ? 'MOST' : 'ALSO'}</Badge>
                    )}
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">
                    {pillar.hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------- 3. must-haves */}
      {step === 2 && (
        <div>
          <h3 className="mb-1 text-[14px] font-semibold text-ink">Anything you must have?</h3>
          <p className="mb-4 text-[12.5px] text-muted">
            Optional. Anything failing one of these is excluded outright, and told to you.
          </p>
          {requirements.length === 0 ? (
            <p className="text-[12.5px] text-faint">
              Nothing here would narrow the field usefully — skip ahead.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {requirements.map((requirement) => {
                const on = answers.mustHaves.includes(requirement.id)
                return (
                  <button
                    key={requirement.id}
                    type="button"
                    onClick={() =>
                      setAnswers((c) => ({
                        ...c,
                        mustHaves: on
                          ? c.mustHaves.filter((m) => m !== requirement.id)
                          : [...c.mustHaves, requirement.id],
                      }))
                    }
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors',
                      on
                        ? 'border-brand bg-brand text-white'
                        : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
                    )}
                  >
                    <Icon name={on ? 'Check' : 'Plus'} size={13} />
                    {requirement.label}
                    <span className="tnum opacity-70">{requirement.count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------ 4. results */}
      {step === 3 && outcome && (
        <div>
          {outcome.recommendations.length === 0 ? (
            <div className="rounded-md border border-warn/30 bg-best-soft p-4">
              <p className="text-[13px] font-medium text-ink">Nothing matches all of that.</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {outcome.excluded.length} device
                {outcome.excluded.length === 1 ? ' was' : 's were'} excluded. Go back and raise the
                budget or drop a must-have.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <p className="text-[12.5px] text-muted">
                  {outcome.recommendations.length} picks from{' '}
                  {catalogue.length - outcome.excluded.length} that fit.
                </p>
                <Button
                  size="xs"
                  variant="ghost"
                  icon="SlidersHorizontal"
                  onClick={() => {
                    onApplyWeights(outcome.weights)
                    onClose()
                  }}
                >
                  Use these weights
                </Button>
              </div>

              <ol className="space-y-2">
                {outcome.recommendations.map((entry, index) => (
                  <li
                    key={entry.scored.product.id}
                    className="flex gap-3 rounded-md border border-line bg-surface-2 p-3"
                  >
                    <span className="tnum w-4 shrink-0 pt-0.5 text-[12px] font-semibold text-faint">
                      {index + 1}
                    </span>
                    <span className="h-11 w-9 shrink-0">
                      <DeviceGlyph
                        category={entry.scored.product.category}
                        accent={entry.scored.product.accent}
                        glow={false}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[13.5px] font-semibold text-ink">
                          {entry.scored.product.name}
                        </span>
                        <span className="tnum text-[12px] text-muted">
                          {formatPrice(entry.scored.product.price)}
                        </span>
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {entry.reasons.map((reason) => (
                          <li
                            key={reason}
                            className="flex items-start gap-1.5 text-[12px] text-muted"
                          >
                            <Icon
                              name="Check"
                              size={12}
                              className="mt-0.5 shrink-0 text-best"
                            />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </span>
                    <span
                      className="tnum shrink-0 self-start text-[13px] font-semibold"
                      style={{ color: seriesColor(index) }}
                    >
                      {Math.round(entry.scored.overall)}
                    </span>
                  </li>
                ))}
              </ol>

              {outcome.recommendations.length >= 2 && (
                <Button
                  className="mt-4"
                  variant="primary"
                  block
                  iconRight="ArrowRight"
                  onClick={() => {
                    onCompare(
                      outcome.recommendations.slice(0, 3).map((r) => r.scored.product.id),
                      outcome.weights,
                    )
                    onClose()
                  }}
                >
                  Compare the top {Math.min(3, outcome.recommendations.length)}
                </Button>
              )}

              {outcome.excluded.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-[12px] text-faint hover:text-muted">
                    Why {outcome.excluded.length} others were excluded
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {outcome.excluded.slice(0, 12).map((entry) => (
                      <li key={entry.product.id} className="text-[11.5px] text-faint">
                        <span className="text-muted">{entry.product.name}</span> — {entry.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
