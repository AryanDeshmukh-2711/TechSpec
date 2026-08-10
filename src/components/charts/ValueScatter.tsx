import { useId, useState } from 'react'
import type { ScoredProduct } from '@/types'
import { formatCompactPrice } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * Price against weighted score, with the Pareto frontier drawn through the
 * products nothing else beats on both axes. Anything below the line is
 * dominated — there is something here that costs the same or less and scores
 * higher. That is the single most useful chart in a buying decision.
 */
export function ValueScatter({
  items,
  colors,
  className,
}: {
  items: ScoredProduct[]
  colors: Record<string, string>
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState<string | null>(null)

  const W = 520
  const H = 300
  const PAD = { top: 20, right: 24, bottom: 42, left: 46 }

  const prices = items.map((i) => i.product.price)
  const scores = items.map((i) => i.overall)

  // Pad the domains so points never sit on the axis.
  const priceMin = Math.min(...prices)
  const priceMax = Math.max(...prices)
  const priceSpan = Math.max(priceMax - priceMin, 1)
  const pLo = Math.max(0, priceMin - priceSpan * 0.18)
  const pHi = priceMax + priceSpan * 0.18

  const scoreMin = Math.min(...scores)
  const scoreMax = Math.max(...scores)
  const scoreSpan = Math.max(scoreMax - scoreMin, 1)
  const sLo = Math.max(0, scoreMin - scoreSpan * 0.25)
  const sHi = Math.min(100, scoreMax + scoreSpan * 0.25)

  const x = (price: number) =>
    PAD.left + ((price - pLo) / (pHi - pLo)) * (W - PAD.left - PAD.right)
  const y = (score: number) =>
    H - PAD.bottom - ((score - sLo) / (sHi - sLo)) * (H - PAD.top - PAD.bottom)

  const frontier = items
    .filter((i) => i.onFrontier)
    .sort((a, b) => a.product.price - b.product.price)

  const frontierPath = frontier
    .map((i, idx) => `${idx === 0 ? 'M' : 'L'} ${x(i.product.price)} ${y(i.overall)}`)
    .join(' ')

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Price versus weighted score. Products on the upper line offer the best score available at their price."
      >
        <defs>
          <linearGradient id={`frontier-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ts-best)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--ts-best)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        <g className="text-line">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const gy = PAD.top + t * (H - PAD.top - PAD.bottom)
            const score = sHi - t * (sHi - sLo)
            return (
              <g key={t}>
                <line
                  x1={PAD.left}
                  y1={gy}
                  x2={W - PAD.right}
                  y2={gy}
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeDasharray={t === 1 ? '0' : '3 4'}
                  strokeOpacity={t === 1 ? 1 : 0.55}
                />
                <text
                  x={PAD.left - 8}
                  y={gy}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-faint text-[10px]"
                >
                  {Math.round(score)}
                </text>
              </g>
            )
          })}
          {[0, 0.5, 1].map((t) => {
            const gx = PAD.left + t * (W - PAD.left - PAD.right)
            return (
              <text
                key={t}
                x={gx}
                y={H - PAD.bottom + 16}
                textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'}
                className="fill-faint text-[10px]"
              >
                {formatCompactPrice(Math.round(pLo + t * (pHi - pLo)))}
              </text>
            )
          })}
        </g>

        {/* Value frontier */}
        {frontier.length > 1 && (
          <path
            d={frontierPath}
            fill="none"
            stroke={`url(#frontier-${uid})`}
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}

        {/* Points */}
        {items.map((item) => {
          const px = x(item.product.price)
          const py = y(item.overall)
          const color = colors[item.product.id]
          const isHovered = hovered === item.product.id
          return (
            <g
              key={item.product.id}
              onMouseEnter={() => setHovered(item.product.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-default"
            >
              <circle cx={px} cy={py} r="16" fill="transparent" />
              {item.onFrontier && (
                <circle
                  cx={px}
                  cy={py}
                  r="11"
                  fill="none"
                  stroke="var(--ts-best)"
                  strokeWidth="1.2"
                  strokeOpacity="0.55"
                />
              )}
              <circle
                cx={px}
                cy={py}
                r={isHovered ? 7.5 : 6}
                fill={color}
                stroke="var(--ts-surface)"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              <text
                x={px}
                y={py - 15}
                textAnchor="middle"
                className={cn(
                  'text-[10.5px] font-semibold transition-opacity',
                  isHovered ? 'fill-ink' : 'fill-muted',
                )}
              >
                {shorten(item.product.name)}
              </text>
              {isHovered && (
                <text x={px} y={py + 22} textAnchor="middle" className="fill-muted text-[10px]">
                  {formatCompactPrice(item.product.price)} · {item.overall}
                </text>
              )}
            </g>
          )
        })}

        <text
          x={W - PAD.right}
          y={H - 6}
          textAnchor="end"
          className="fill-faint text-[10px] font-medium"
        >
          Price →
        </text>
        <text
          x={PAD.left - 8}
          y={PAD.top - 8}
          textAnchor="end"
          className="fill-faint text-[10px] font-medium"
        >
          Score
        </text>
      </svg>

      <p className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-faint">
        <span className="inline-block h-0 w-5 border-t-2 border-dashed border-best" />
        Value frontier — nothing here beats these on price <em>and</em> score
      </p>
    </div>
  )
}

function shorten(name: string): string {
  return name.length > 18 ? `${name.slice(0, 17)}…` : name
}
