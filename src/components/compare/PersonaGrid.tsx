import type { PersonaVerdict } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/primitives'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * "Best for…" grid. Each card runs the persona's own weight vector, which is
 * independent of the user's sliders — so this section answers "who is each of
 * these actually for?" rather than repeating the headline verdict.
 */
export function PersonaGrid({
  verdicts,
  colors,
  onApplyPreset,
}: {
  verdicts: PersonaVerdict[]
  colors: Record<string, string>
  onApplyPreset: (weights: Record<string, number>) => void
}) {
  return (
    <section className="ts-print-block" aria-labelledby="personas-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="personas-heading"
            className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink"
          >
            <Icon name="Award" size={17} className="text-brand-text" />
            Best for each kind of buyer
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Six fixed weightings, scored independently of your sliders. Tap one to load it above.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {verdicts.map((verdict) => {
          const color = colors[verdict.winner.product.id]
          const decisive = verdict.margin >= 6
          return (
            <button
              key={verdict.persona.id}
              type="button"
              onClick={() => onApplyPreset(verdict.persona.weights)}
              className="group ts-card relative overflow-hidden p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float"
            >
              <span
                className="absolute inset-y-0 left-0 w-0.5"
                style={{ background: color }}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-brand-text">
                    <Icon name={verdict.persona.icon} size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">
                      {verdict.persona.label}
                    </p>
                    <p className="text-[11.5px] text-faint">{verdict.persona.blurb}</p>
                  </div>
                </div>
                {verdict.margin > 0 && (
                  <Badge tone={decisive ? 'best' : 'neutral'}>
                    {decisive ? 'CLEAR' : 'CLOSE'}
                  </Badge>
                )}
              </div>

              <p className="mt-3.5 text-[15px] leading-snug font-semibold text-ink">
                {verdict.winner.product.name}
              </p>
              <p className="tnum mt-0.5 text-[12px] text-muted">
                {formatPrice(verdict.winner.product.price)}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{verdict.reason}</p>

              <p
                className={cn(
                  'ts-no-print mt-3 flex items-center gap-1 text-[11.5px] font-medium text-brand-text',
                  'opacity-0 transition-opacity group-hover:opacity-100',
                )}
              >
                Load this weighting
                <Icon name="ArrowRight" size={11} />
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
