import { useMemo, useState } from 'react'
import type { Category, ScoredProduct } from '@/types'
import { explainPillar } from '@/lib/scoring'
import { formatSpec } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { InfoHint } from '@/components/ui/primitives'

/**
 * Opens a pillar score up to audit.
 *
 * Every other comparison site asks you to trust a composite number. Here you
 * can click any pillar and see the specs behind it, the weight each carries,
 * the 0-100 each product scored, and the points that produced the total.
 * The points column sums to the pillar score — no residual, nothing hidden.
 */
export function PillarBreakdown({
  category,
  scored,
  colors,
}: {
  category: Category
  scored: ScoredProduct[]
  colors: Record<string, string>
}) {
  const [openPillar, setOpenPillar] = useState<string | null>(null)
  const specByKey = useMemo(
    () => new Map(category.specs.map((s) => [s.key, s])),
    [category.specs],
  )

  const contributions = useMemo(
    () => (openPillar ? explainPillar(category, openPillar, scored) : []),
    [category, openPillar, scored],
  )

  const pillar = category.pillars.find((p) => p.id === openPillar)

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="mr-1 flex items-center gap-1 text-[11.5px] font-medium tracking-wide text-faint uppercase">
          Audit a score
          <InfoHint text="Open any pillar to see the specs behind it, their weights, and the points each contributed. The points always sum to the pillar score." />
        </span>
        {category.pillars.map((p) => {
          const active = openPillar === p.id
          return (
            <button
              key={p.id}
              type="button"
              aria-expanded={active}
              onClick={() => setOpenPillar(active ? null : p.id)}
              className={cn(
                'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] font-medium transition-colors',
                active
                  ? 'border-brand/60 bg-brand-soft text-brand-text'
                  : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {p.label}
              <Icon
                name="ChevronDown"
                size={12}
                className={cn('transition-transform', active && 'rotate-180')}
              />
            </button>
          )
        })}
      </div>

      {pillar && contributions.length > 0 && (
        <div className="ts-fade mt-4 overflow-hidden rounded-xl border border-line bg-surface-2">
          <div className="border-b border-line px-3 py-2">
            <p className="text-[12.5px] text-muted">
              <span className="font-semibold text-ink">{pillar.label}</span> — {pillar.hint}
            </p>
          </div>

          <div className="ts-scroll-x">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-[11px] font-medium tracking-wide text-faint uppercase">
                    Spec
                  </th>
                  <th className="px-2 py-2 text-right text-[11px] font-medium tracking-wide text-faint uppercase">
                    Weight
                  </th>
                  {scored.map((item) => (
                    <th
                      key={item.product.id}
                      className="px-2 py-2 text-right text-[11px] font-medium tracking-wide uppercase"
                      style={{ color: colors[item.product.id] }}
                    >
                      <span className="block max-w-[110px] truncate">{item.product.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contributions.map((row) => {
                  const def = specByKey.get(row.specKey)
                  return (
                    <tr key={row.specKey} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 text-[12.5px] text-muted">{row.label}</td>
                      <td className="tnum px-2 py-2 text-right text-[12px] text-faint">
                        {Math.round(row.share * 100)}%
                      </td>
                      {scored.map((item) => {
                        const cell = row.perProduct[item.product.id]
                        return (
                          <td key={item.product.id} className="px-2 py-2 text-right">
                            <span className="tnum block text-[12.5px] font-medium text-ink">
                              {def ? formatSpec(def, cell.raw) : '—'}
                            </span>
                            <span className="tnum block text-[10.5px] text-faint">
                              {cell.norm === null ? 'not reported' : `${Math.round(cell.norm)}/100`}
                              {cell.norm !== null && ` · +${cell.points}`}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line-strong bg-surface">
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink" colSpan={2}>
                    {pillar.label} score
                  </td>
                  {scored.map((item) => (
                    <td
                      key={item.product.id}
                      className="tnum px-2 py-2 text-right text-[13px] font-semibold"
                      style={{ color: colors[item.product.id] }}
                    >
                      {Math.round(item.pillars[pillar.id] ?? 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
