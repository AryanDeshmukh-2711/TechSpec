import type { Category, ScoredProduct, SpecDef } from '@/types'
import { DeviceGlyph } from '@/components/DeviceGlyph'
import { ScoreRing } from '@/components/charts/ScoreRing'
import { Badge, InfoHint } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { formatPrice, formatSpec } from '@/lib/format'
import { pillarDeltas, round } from '@/lib/scoring'
import { cn } from '@/lib/cn'

export function VerdictPanel({
  category,
  scored,
  colors,
}: {
  category: Category
  scored: ScoredProduct[]
  colors: Record<string, string>
}) {
  const ranked = [...scored].sort((a, b) => b.overall - a.overall)
  const winner = ranked[0]
  const runnerUp = ranked[1]
  const bestValue = [...scored].sort((a, b) => b.value - a.value)[0]
  const cheapest = [...scored].sort((a, b) => a.product.price - b.product.price)[0]

  const leads = runnerUp
    ? pillarDeltas(category, winner, runnerUp).filter((d) => d.delta > 1).slice(0, 3)
    : []
  const trails = runnerUp
    ? pillarDeltas(category, winner, runnerUp)
        .filter((d) => d.delta < -1)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 2)
    : []

  const specByKey = new Map(category.specs.map((s) => [s.key, s]))

  return (
    <section className="ts-card ts-print-block overflow-hidden" aria-labelledby="verdict-heading">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        {/* ------------------------------------------------------- winner */}
        <div className="relative overflow-hidden p-5 sm:p-6">
          <div
            className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
            style={{ background: colors[winner.product.id] }}
          />
          <div className="relative">
            <p
              id="verdict-heading"
              className="flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.08em] text-brand-text uppercase"
            >
              <Icon name="Trophy" size={13} />
              Best match for your priorities
            </p>

            <div className="mt-4 flex items-start gap-4">
              <div className="h-[92px] w-[76px] shrink-0">
                <DeviceGlyph
                  category={winner.product.category}
                  accent={winner.product.accent}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-semibold tracking-[0.06em] text-faint uppercase">
                  {winner.product.brand}
                </p>
                <h3 className="mt-0.5 text-[22px] leading-tight font-semibold tracking-tight text-ink">
                  {winner.product.name}
                </h3>
                <p className="tnum mt-1.5 text-[14px] font-medium text-muted">
                  {formatPrice(winner.product.price)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="brand" icon="Trophy">
                    BEST OVERALL
                  </Badge>
                  {bestValue.product.id === winner.product.id && (
                    <Badge tone="best" icon="Scale">
                      BEST VALUE
                    </Badge>
                  )}
                  {winner.onFrontier && bestValue.product.id !== winner.product.id && (
                    <Badge tone="best" icon="TrendingUp">
                      ON VALUE FRONTIER
                    </Badge>
                  )}
                  {cheapest.product.id === winner.product.id && scored.length > 1 && (
                    <Badge tone="best" icon="Tag">
                      CHEAPEST TOO
                    </Badge>
                  )}
                </div>
              </div>
              <ScoreRing
                value={winner.overall}
                color={colors[winner.product.id]}
                size={76}
                label="match"
                className="hidden sm:inline-flex"
              />
            </div>

            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              {winner.product.tagline}
            </p>

            {runnerUp && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-[12px] font-semibold tracking-wide text-faint uppercase">
                  Why it wins vs {runnerUp.product.name}
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {leads.length === 0 && (
                    <li className="text-[13px] text-muted">
                      It doesn't, really — the two are within a point of each other. Decide on
                      price or brand preference.
                    </li>
                  )}
                  {leads.map((lead) => (
                    <li key={lead.pillar} className="flex items-start gap-2 text-[13px]">
                      <Icon
                        name="Check"
                        size={14}
                        className="mt-0.5 shrink-0 text-best"
                      />
                      <span className="text-muted">
                        <span className="font-medium text-ink">{lead.label}</span>{' '}
                        <span className="tnum text-best">+{lead.delta}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {trails.length > 0 && (
                  <>
                    <p className="mt-4 text-[12px] font-semibold tracking-wide text-faint uppercase">
                      Where it gives ground
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {trails.map((trail) => (
                        <li key={trail.pillar} className="flex items-start gap-2 text-[13px]">
                          <Icon
                            name="Minus"
                            size={14}
                            className="mt-0.5 shrink-0 text-warn"
                          />
                          <span className="text-muted">
                            <span className="font-medium text-ink">{trail.label}</span>{' '}
                            <span className="tnum text-warn">{trail.delta}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------ ranking */}
        <div className="border-t border-line bg-surface-2 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <h3 className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-faint uppercase">
            Weighted ranking
            <InfoHint text="A match score, not a quality grade. 100 would mean topping every pillar you weighted against the entire category — including price, which flagships never win." />
          </h3>
          <ol className="mt-4 space-y-3.5">
            {ranked.map((item, index) => {
              const delta = round(item.overall - winner.overall)
              const color = colors[item.product.id]
              return (
                <li key={item.product.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="tnum w-3.5 shrink-0 text-[12px] font-semibold text-faint">
                        {index + 1}
                      </span>
                      <span className="truncate text-[13.5px] font-medium text-ink">
                        {item.product.name}
                      </span>
                      {item.onFrontier && (
                        <Icon
                          name="TrendingUp"
                          size={12}
                          className="shrink-0 text-best"
                          aria-label="On the value frontier"
                        />
                      )}
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1.5">
                      <span className="tnum text-[14px] font-semibold text-ink">
                        {item.overall}
                      </span>
                      {index > 0 && (
                        <span className="tnum text-[11.5px] text-faint">{delta}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 ml-5.5 h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${item.overall}%`, background: color }}
                    />
                  </div>
                  <div className="mt-1 ml-5.5 flex items-center gap-2.5 text-[11.5px] text-faint">
                    <span className="tnum">{formatPrice(item.product.price)}</span>
                    <span aria-hidden>·</span>
                    <span className="tnum">value {item.value}</span>
                    {category.headlineSpecs.slice(0, 1).map((key) => {
                      const def = specByKey.get(key) as SpecDef | undefined
                      if (!def) return null
                      return (
                        <span key={key} className="truncate">
                          {formatSpec(def, item.specs[key]?.raw ?? null)}
                        </span>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ol>

          <p
            className={cn(
              'mt-5 flex items-start gap-2 rounded-lg border border-line bg-surface p-3',
              'text-[12px] leading-relaxed text-muted',
            )}
          >
            <Icon name="Lightbulb" size={14} className="mt-0.5 shrink-0 text-warn" />
            <span>
              <span className="font-medium text-ink">Value index</span> rebases each score
              against its price, so a cheaper product with a slightly lower score can still come
              out ahead.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
