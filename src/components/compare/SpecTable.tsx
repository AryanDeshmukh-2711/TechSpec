import { useMemo } from 'react'
import type { Category, ScoredProduct, SpecDef, SpecGroupId } from '@/types'
import { SPEC_GROUPS } from '@/data'
import { computeBest, specDiffers } from '@/lib/scoring'
import { formatSpec, percentDelta } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { InfoHint } from '@/components/ui/primitives'
import { SpecBar } from '@/components/charts/SpecBar'
import { useIsDesktop } from '@/hooks/useMediaQuery'

export interface SpecTableOptions {
  differencesOnly: boolean
  biggestGapsFirst: boolean
}

export function SpecTable({
  category,
  scored,
  colors,
  options,
}: {
  category: Category
  scored: ScoredProduct[]
  colors: Record<string, string>
  options: SpecTableOptions
}) {
  const isDesktop = useIsDesktop()
  const best = useMemo(() => computeBest(category, scored), [category, scored])

  const groups = useMemo(() => {
    return category.groupOrder
      .map((groupId) => {
        let specs = category.specs.filter((s) => s.group === groupId && !s.internal)

        // Drop specs no product in the selection reports at all.
        specs = specs.filter((s) => scored.some((p) => p.specs[s.key]?.raw !== null))

        const differing = specs.filter((s) => specDiffers(s, scored))
        if (options.differencesOnly) specs = differing

        if (options.biggestGapsFirst) {
          specs = [...specs].sort(
            (a, b) => (best[b.key]?.spread ?? 0) - (best[a.key]?.spread ?? 0),
          )
        }

        return { groupId, specs, differingCount: differing.length }
      })
      .filter((group) => group.specs.length > 0)
  }, [category, scored, options, best])

  if (groups.length === 0) {
    return (
      <div className="ts-card p-8 text-center">
        <p className="text-[14px] font-medium text-ink">These products are spec-identical</p>
        <p className="mt-1.5 text-[13px] text-muted">
          Every tracked spec matches. Turn off “differences only” to see the full sheet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SpecGroup
          key={group.groupId}
          groupId={group.groupId}
          specs={group.specs}
          differingCount={group.differingCount}
          category={category}
          scored={scored}
          colors={colors}
          best={best}
          isDesktop={isDesktop}
        />
      ))}
    </div>
  )
}

function SpecGroup({
  groupId,
  specs,
  differingCount,
  scored,
  colors,
  best,
  isDesktop,
}: {
  groupId: SpecGroupId
  specs: SpecDef[]
  differingCount: number
  category: Category
  scored: ScoredProduct[]
  colors: Record<string, string>
  best: ReturnType<typeof computeBest>
  isDesktop: boolean
}) {
  const meta = SPEC_GROUPS[groupId]
  const columns = `minmax(150px, 210px) repeat(${scored.length}, minmax(0, 1fr))`

  return (
    <section
      id={`group-${groupId}`}
      className="ts-card ts-print-block scroll-mt-32 overflow-hidden"
      aria-labelledby={`group-heading-${groupId}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <h3
          id={`group-heading-${groupId}`}
          className="flex items-center gap-2 text-[13px] font-semibold text-ink"
        >
          <Icon name={meta.icon} size={15} className="text-brand-text" />
          {meta.label}
        </h3>
        <span className="text-[11.5px] text-faint">
          {differingCount === 0
            ? 'all identical'
            : `${differingCount} of ${specs.length} differ`}
        </span>
      </header>

      <div className="divide-y divide-[var(--ts-line)]">
        {specs.map((def) => {
          const info = best[def.key]
          const isRankable = def.higherIsBetter !== null

          return isDesktop ? (
            <div
              key={def.key}
              className="grid items-center gap-x-4 px-4 py-2.5 transition-colors hover:bg-surface-2"
              style={{ gridTemplateColumns: columns }}
            >
              <div className="flex items-center gap-1.5 pr-2">
                <span className="text-[12.5px] leading-snug text-muted">{def.label}</span>
                {def.hint && <InfoHint text={def.hint} />}
              </div>

              {scored.map((item) => (
                <ValueCell
                  key={item.product.id}
                  def={def}
                  item={item}
                  color={colors[item.product.id]}
                  isBest={info?.bestIds.includes(item.product.id) ?? false}
                  isWorst={
                    (info?.worstIds.includes(item.product.id) ?? false) && scored.length > 2
                  }
                  bestValue={bestRawFor(def, scored, info?.bestIds ?? [])}
                  rankable={isRankable}
                />
              ))}
            </div>
          ) : (
            <div key={def.key} className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium tracking-wide text-faint uppercase">
                  {def.label}
                </span>
                {def.hint && <InfoHint text={def.hint} />}
              </div>
              <ul className="mt-2 space-y-2">
                {scored.map((item) => {
                  const isBest = info?.bestIds.includes(item.product.id) ?? false
                  const norm = item.specs[def.key]?.norm ?? null
                  return (
                    <li key={item.product.id} className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: colors[item.product.id] }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">
                        {item.product.name}
                      </span>
                      {def.bar && norm !== null && (
                        <SpecBar
                          value={norm}
                          color={colors[item.product.id]}
                          best={isBest}
                          className="w-16 shrink-0"
                        />
                      )}
                      <span
                        className={cn(
                          'tnum shrink-0 text-right text-[13px] tabular-nums',
                          isBest ? 'font-semibold text-best' : 'font-medium text-ink',
                        )}
                      >
                        {formatSpec(def, item.specs[def.key]?.raw ?? null)}
                      </span>
                      {isBest && (
                        <Icon
                          name="Check"
                          size={13}
                          className="shrink-0 text-best"
                          aria-label="best in this comparison"
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ValueCell({
  def,
  item,
  color,
  isBest,
  isWorst,
  bestValue,
  rankable,
}: {
  def: SpecDef
  item: ScoredProduct
  color: string
  isBest: boolean
  isWorst: boolean
  bestValue: number | null
  rankable: boolean
}) {
  const raw = item.specs[def.key]?.raw ?? null
  const norm = item.specs[def.key]?.norm ?? null
  const text = formatSpec(def, raw)

  const delta =
    !isBest && rankable && typeof raw === 'number' && bestValue !== null
      ? percentDelta(raw, bestValue)
      : null

  return (
    <div
      className={cn(
        'relative -my-1 rounded-lg py-1.5 pr-2 pl-2.5',
        isBest && 'bg-best-soft/60',
      )}
    >
      {isBest && (
        <span
          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-best"
          aria-hidden
        />
      )}
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'tnum text-[13.5px] leading-tight',
            isBest
              ? 'font-semibold text-best'
              : isWorst
                ? 'font-medium text-faint'
                : 'font-medium text-ink',
          )}
        >
          {text}
        </span>
        {isBest && (
          <Icon name="Check" size={12} className="shrink-0 text-best" aria-label="best" />
        )}
        {delta && <span className="tnum text-[10.5px] text-faint">{delta}</span>}
      </div>
      {def.bar && norm !== null && (
        <SpecBar value={norm} color={color} best={isBest} className="mt-1.5" />
      )}
    </div>
  )
}

/** Raw numeric value of the winning cell, for percentage deltas. */
function bestRawFor(def: SpecDef, scored: ScoredProduct[], bestIds: string[]): number | null {
  if (!bestIds.length) return null
  const winner = scored.find((s) => s.product.id === bestIds[0])
  const raw = winner?.specs[def.key]?.raw
  return typeof raw === 'number' ? raw : null
}
