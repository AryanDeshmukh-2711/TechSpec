import { useMemo, useState } from 'react'
import type { Category, ScoredProduct } from '@/types'
import { advantagesOver } from '@/lib/scoring'
import { formatSpec, seriesColor } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/**
 * Direct duel between any two of the selected products, with the specs that
 * actually produced each lead — not a generic "X is better" claim.
 */
export function HeadToHead({
  category,
  scored,
  colors,
}: {
  category: Category
  scored: ScoredProduct[]
  colors: Record<string, string>
}) {
  const ranked = useMemo(() => [...scored].sort((a, b) => b.overall - a.overall), [scored])
  const [leftId, setLeftId] = useState(ranked[0]?.product.id ?? '')
  const [rightId, setRightId] = useState(ranked[1]?.product.id ?? '')

  const left = scored.find((s) => s.product.id === leftId) ?? ranked[0]
  const right = scored.find((s) => s.product.id === rightId) ?? ranked[1]

  if (!left || !right || left === right) return null

  const leftWins = advantagesOver(category, left, right, 5)
  const rightWins = advantagesOver(category, right, left, 5)
  const specByKey = new Map(category.specs.map((s) => [s.key, s]))

  return (
    <section className="ts-card ts-print-block p-5" aria-labelledby="h2h-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="h2h-heading"
            className="flex items-center gap-2 text-[15px] font-semibold text-ink"
          >
            <Icon name="Scale" size={16} className="text-brand-text" />
            Head to head
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            The specs behind each product's lead, ordered by how big the gap is.
          </p>
        </div>

        {scored.length > 2 && (
          <div className="ts-no-print flex items-center gap-2">
            <Picker
              value={leftId}
              onChange={setLeftId}
              options={scored}
              exclude={rightId}
              label="First product"
            />
            <span className="text-[12px] font-medium text-faint">vs</span>
            <Picker
              value={rightId}
              onChange={setRightId}
              options={scored}
              exclude={leftId}
              label="Second product"
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          { side: left, wins: leftWins, opponent: right },
          { side: right, wins: rightWins, opponent: left },
        ].map(({ side, wins, opponent }) => (
          <div key={side.product.id} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: colors[side.product.id] }}
                aria-hidden
              />
              <h3 className="truncate text-[13.5px] font-semibold text-ink">
                {side.product.name} wins on
              </h3>
            </div>

            {wins.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-muted">
                Nothing meaningful — {opponent.product.name} matches or beats it everywhere we
                measure.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {wins.map((win) => {
                  const def = specByKey.get(win.specKey)
                  if (!def) return null
                  return (
                    <li key={win.specKey}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12.5px] text-muted">{win.label}</span>
                        <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink">
                          {formatSpec(def, win.winnerValue)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, win.gap)}%`,
                              background: colors[side.product.id],
                            }}
                          />
                        </div>
                        <span className="tnum shrink-0 text-[10.5px] text-faint">
                          vs {formatSpec(def, win.loserValue)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function Picker({
  value,
  onChange,
  options,
  exclude,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: ScoredProduct[]
  exclude: string
  label: string
}) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`h2h-${label}`}>
        {label}
      </label>
      <select
        id={`h2h-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-8 max-w-[150px] appearance-none truncate rounded-lg border border-line bg-surface pr-7 pl-2.5',
          'text-[12px] font-medium text-ink transition-colors hover:border-line-strong focus:outline-none',
        )}
      >
        {options.map((option, index) => (
          <option
            key={option.product.id}
            value={option.product.id}
            disabled={option.product.id === exclude}
            style={{ color: seriesColor(index) }}
          >
            {option.product.name}
          </option>
        ))}
      </select>
      <Icon
        name="ChevronDown"
        size={13}
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-faint"
      />
    </div>
  )
}
