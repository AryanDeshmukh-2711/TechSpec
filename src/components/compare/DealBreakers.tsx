import type { Category, ScoredProduct } from '@/types'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { InfoHint } from '@/components/ui/primitives'

/**
 * Hard requirements.
 *
 * A comparison engine that only ever ranks is missing half the decision: some
 * specs aren't a matter of degree. If you need IP68, a phone without it isn't
 * "slightly worse" — it's out. Failing products stay in the table, visibly
 * disqualified, because seeing *why* something is eliminated is the point.
 */
export function DealBreakers({
  category,
  scored,
  active,
  failures,
  eligibleCount,
  onToggle,
  onClear,
}: {
  category: Category
  scored: ScoredProduct[]
  active: string[]
  failures: Record<string, string[]>
  eligibleCount: number
  onToggle: (id: string) => void
  onClear: () => void
}) {
  // Only offer requirements that would actually split this selection — a
  // filter everything passes or everything fails is noise.
  const useful = category.quickFilters.filter((quick) => {
    const passing = scored.filter((s) => quick.test(s.product)).length
    return passing > 0 && passing < scored.length
  })

  const offered = category.quickFilters.filter(
    (q) => useful.includes(q) || active.includes(q.id),
  )

  if (!offered.length) return null

  const disqualified = Object.keys(failures).length

  return (
    <section className="ts-card ts-print-block p-5" aria-labelledby="dealbreakers-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="dealbreakers-heading"
            className="flex items-center gap-2 text-[15px] font-semibold text-ink"
          >
            <Icon name="Target" size={16} className="text-brand-text" />
            Must-haves
            <InfoHint text="Requirements, not preferences. Anything failing one is removed from the ranking and the verdict, but stays in the table so you can see what it cost." />
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Some specs aren't a matter of degree. Mark what you won't compromise on and the
            verdict recalculates around what's left.
          </p>
        </div>
        {active.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="ts-no-print text-[12px] font-medium text-brand-text hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="ts-no-print mt-4 flex flex-wrap gap-1.5">
        {offered.map((quick) => {
          const on = active.includes(quick.id)
          return (
            <button
              key={quick.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(quick.id)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors active:scale-[0.97]',
                on
                  ? 'border-brand bg-brand text-white'
                  : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink',
              )}
            >
              <Icon name={on ? 'Check' : 'Plus'} size={13} />
              {quick.label}
            </button>
          )
        })}
      </div>

      {active.length > 0 && (
        <div className="mt-4 border-t border-line pt-3.5">
          {eligibleCount === 0 ? (
            <p className="flex items-start gap-2 text-[13px] text-danger">
              <Icon name="CircleAlert" size={15} className="mt-0.5 shrink-0" />
              <span>
                Nothing here meets all {active.length} requirements. Relax one, or go back and
                widen the selection.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 text-[13px] text-muted">
              <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-best" />
              <span>
                <span className="font-semibold text-ink">{eligibleCount}</span> of {scored.length}{' '}
                {scored.length === 1 ? category.singular : category.plural} qualify.
                {disqualified > 0 && ' The rest are struck through below.'}
              </span>
            </p>
          )}

          {disqualified > 0 && (
            <ul className="mt-2.5 space-y-1">
              {scored
                .filter((s) => failures[s.product.id])
                .map((s) => (
                  <li
                    key={s.product.id}
                    className="flex flex-wrap items-baseline gap-x-1.5 text-[12.5px]"
                  >
                    <Icon name="X" size={12} className="shrink-0 self-center text-danger" />
                    <span className="font-medium text-muted line-through">{s.product.name}</span>
                    <span className="text-faint">
                      fails {failures[s.product.id].join(', ').toLowerCase()}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
