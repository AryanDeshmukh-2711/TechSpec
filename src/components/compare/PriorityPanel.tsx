import { useState } from 'react'
import type { Category } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { Button, InfoHint } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'

/**
 * The differentiator.
 *
 * Every other comparison site publishes one score and asks you to accept its
 * priorities. Here the weights are yours: the overall score, the ranking and
 * the verdict recompute live, and the weights ride along in the share URL.
 *
 * The presets stay on screen because one click is the fast path; the full
 * slider grid is a tall block of controls that most visits never touch, so it
 * folds away — unless you arrived on a link that already carries weights, in
 * which case seeing the sender's settings *is* the point.
 */
export function PriorityPanel({
  category,
  priorities,
  onChange,
  onApplyPreset,
  onReset,
}: {
  category: Category
  priorities: Record<string, number>
  onChange: (pillarId: string, value: number) => void
  onApplyPreset: (weights: Record<string, number>) => void
  onReset: () => void
}) {
  const isDefault = category.pillars.every((p) => (priorities[p.id] ?? 5) === 5)
  const [open, setOpen] = useState(!isDefault)

  const tuned = category.pillars.filter((p) => (priorities[p.id] ?? 5) !== 5)

  return (
    <section className="ts-card p-5" aria-labelledby="priorities-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2
          id="priorities-heading"
          className="flex items-center gap-2 text-[15px] font-semibold text-ink"
        >
          <Icon name="SlidersHorizontal" size={16} className="text-brand-text" />
          What matters to you?
          <InfoHint text="Weights feed straight into the score and the verdict. They travel with the share link, so anyone you send it to sees your priorities, not ours." />
        </h2>
        {!isDefault && (
          <Button variant="ghost" size="sm" icon="RotateCcw" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Presets — the one-click path, always on screen. */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11.5px] font-medium tracking-wide text-faint uppercase">
          Presets
        </span>
        {category.personas.map((persona) => (
          <button
            key={persona.id}
            type="button"
            onClick={() => onApplyPreset(persona.weights)}
            title={persona.blurb}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 text-[12px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <Icon name={persona.icon} size={12} />
            {persona.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="priority-sliders"
        onClick={() => setOpen((v) => !v)}
        className="mt-3.5 flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
      >
        <Icon
          name="ChevronDown"
          size={14}
          className={cn('transition-transform duration-150', open && 'rotate-180')}
        />
        {open ? 'Hide sliders' : `Fine-tune all ${category.pillars.length} pillars`}
        {!open && tuned.length > 0 && (
          <span className="min-w-0 truncate text-faint">
            ·{' '}
            {tuned.length <= 2
              ? `${tuned.map((p) => p.label.toLowerCase()).join(' and ')} adjusted`
              : `${tuned.length} of ${category.pillars.length} pillars adjusted`}
          </span>
        )}
      </button>

      <div
        id="priority-sliders"
        className={cn('mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2', !open && 'hidden')}
      >
        {category.pillars.map((pillar) => {
          const value = priorities[pillar.id] ?? 5
          return (
            <div key={pillar.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor={`priority-${pillar.id}`}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-ink"
                >
                  {pillar.label}
                  <InfoHint text={pillar.hint} />
                </label>
                <span
                  className={cn(
                    'tnum rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                    value === 0
                      ? 'bg-surface-3 text-faint'
                      : value > 7
                        ? 'bg-brand-soft text-brand-text'
                        : 'bg-surface-3 text-muted',
                  )}
                >
                  {value === 0 ? 'ignore' : `${value}/10`}
                </span>
              </div>
              <input
                id={`priority-${pillar.id}`}
                type="range"
                className="ts-range"
                min={0}
                max={10}
                step={1}
                value={value}
                onChange={(e) => onChange(pillar.id, Number(e.target.value))}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
