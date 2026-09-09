import { useEffect, useMemo } from 'react'
import type { ScoredProduct } from '@/types'
import { useLibrary } from '@/data/store/LibraryProvider'
import type { PriceSummary } from '@/data/store/priceHistory'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

/**
 * Price history, per the report's PRICE_HISTORY entity.
 *
 * Without a retailer feed there is no market price curve to draw, and inventing
 * one would undermine the whole premise. What is shown instead is genuinely
 * known: the launch price, and every correction anyone has made since. When
 * there is only one point, the panel says so rather than drawing a flat line
 * and implying it tracked the price all year.
 */
export function PriceHistoryPanel({ scored }: { scored: ScoredProduct[] }) {
  const { priceOf, trackPrice } = useLibrary()

  // Record the launch price the first time a device is seen, so a later
  // correction reads as a change rather than appearing from nowhere.
  useEffect(() => {
    for (const item of scored) trackPrice(item.product, 'launch')
  }, [scored, trackPrice])

  const rows = useMemo(
    () => scored.map((item) => ({ item, summary: priceOf(item.product.id) })),
    [scored, priceOf],
  )

  const anyTrend = rows.some((r) => r.summary.hasTrend)

  return (
    <div>
      <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
        {anyTrend
          ? 'Launch price plus every correction recorded in your catalogue.'
          : 'Only launch prices are on record so far. Edit a price and the change is tracked here.'}
      </p>

      <ul className="space-y-2.5">
        {rows.map(({ item, summary }) => (
          <li
            key={item.product.id}
            className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-ink">
                {item.product.name}
              </span>
              <span className="tnum block text-[11px] text-faint">
                {summary.points.length} point{summary.points.length === 1 ? '' : 's'} on record
              </span>
            </span>

            {summary.hasTrend && <Sparkline summary={summary} />}

            <span className="shrink-0 text-right">
              <span className="tnum block text-[13px] font-semibold text-ink">
                {summary.current === null ? '—' : formatPrice(summary.current)}
              </span>
              {summary.hasTrend && summary.changeAbsolute !== null && (
                <span
                  className={cn(
                    'tnum block text-[11px] font-medium',
                    summary.changeAbsolute < 0 ? 'text-best' : 'text-warn',
                  )}
                >
                  {summary.changeAbsolute < 0 ? '↓' : '↑'}{' '}
                  {formatPrice(Math.abs(summary.changeAbsolute))}
                  {summary.changePercent !== null &&
                    ` (${Math.abs(Math.round(summary.changePercent))}%)`}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tiny inline line chart. Two points is a line, not a trend — but it is real. */
function Sparkline({ summary }: { summary: PriceSummary }) {
  const prices = summary.points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || 1
  const width = 72
  const height = 22

  const path = prices
    .map((price, i) => {
      const x = (i / Math.max(prices.length - 1, 1)) * width
      const y = height - ((price - min) / span) * height
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const falling = prices[prices.length - 1] < prices[0]

  return (
    <svg
      width={width}
      height={height}
      className="shrink-0 overflow-visible"
      role="img"
      aria-label={`Price trend across ${prices.length} recorded points`}
    >
      <path
        d={path}
        fill="none"
        stroke={falling ? 'var(--ts-best)' : 'var(--ts-warn)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {prices.map((price, i) => {
        const x = (i / Math.max(prices.length - 1, 1)) * width
        const y = height - ((price - min) / span) * height
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.8"
            fill={falling ? 'var(--ts-best)' : 'var(--ts-warn)'}
          />
        )
      })}
    </svg>
  )
}

/** Compact indicator for a single product, used in the picker card. */
export function PriceTrendBadge({ productId }: { productId: string }) {
  const { priceOf } = useLibrary()
  const summary = priceOf(productId)
  if (!summary.hasTrend || summary.changeAbsolute === null || summary.changeAbsolute === 0) {
    return null
  }
  const falling = summary.changeAbsolute < 0
  return (
    <span
      className={cn(
        'tnum inline-flex items-center gap-0.5 text-[11px] font-medium',
        falling ? 'text-best' : 'text-warn',
      )}
      title={`Changed by ${formatPrice(Math.abs(summary.changeAbsolute))} since launch`}
    >
      <Icon name={falling ? 'ChevronDown' : 'ChevronUp'} size={11} />
      {formatPrice(Math.abs(summary.changeAbsolute))}
    </span>
  )
}
