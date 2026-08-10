import { useId, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Radar chart, hand-drawn in SVG.
 *
 * Series are distinguished by colour *and* by dash pattern + marker shape, so
 * the chart still reads correctly in greyscale or for colour-blind viewers.
 */

export interface RadarSeries {
  id: string
  label: string
  color: string
  /** One value per axis, 0–100, in axis order. */
  values: number[]
}

interface RadarChartProps {
  axes: { id: string; label: string; hint?: string }[]
  series: RadarSeries[]
  size?: number
  className?: string
  /** Dim every series except this one. */
  focusId?: string | null
}

const DASHES = ['0', '0', '5 3', '2 3', '8 3']
const RINGS = [25, 50, 75, 100]

export function RadarChart({ axes, series, size = 320, className, focusId }: RadarChartProps) {
  const uid = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState<string | null>(null)

  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 46

  const points = useMemo(() => {
    const count = axes.length
    return axes.map((_, i) => {
      // Start at 12 o'clock and go clockwise.
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      return { cos: Math.cos(angle), sin: Math.sin(angle) }
    })
  }, [axes])

  const toXY = (value: number, index: number) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius
    return [cx + points[index].cos * r, cy + points[index].sin * r] as const
  }

  const polygon = (values: number[]) =>
    values.map((v, i) => toXY(v, i).join(',')).join(' ')

  const active = focusId ?? hovered

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`Radar comparison across ${axes.map((a) => a.label).join(', ')}`}
      >
        <defs>
          {series.map((s) => (
            <radialGradient key={s.id} id={`radar-fill-${uid}-${s.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>

        {/* Web */}
        <g className="text-line">
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={polygon(axes.map(() => ring))}
              fill="none"
              stroke="currentColor"
              strokeWidth={ring === 100 ? 1.2 : 0.8}
              strokeOpacity={ring === 100 ? 1 : 0.65}
            />
          ))}
          {points.map((p, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + p.cos * radius}
              y2={cy + p.sin * radius}
              stroke="currentColor"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />
          ))}
        </g>

        {/* Series */}
        {series.map((s, si) => {
          const dimmed = active !== null && active !== s.id
          return (
            <g
              key={s.id}
              className="transition-opacity duration-200"
              style={{ opacity: dimmed ? 0.14 : 1 }}
            >
              <polygon
                points={polygon(s.values)}
                fill={`url(#radar-fill-${uid}-${s.id})`}
                stroke={s.color}
                strokeWidth={active === s.id ? 2.4 : 1.8}
                strokeDasharray={DASHES[si % DASHES.length]}
                strokeLinejoin="round"
              />
              {s.values.map((v, i) => {
                const [x, y] = toXY(v, i)
                return <Marker key={i} x={x} y={y} shape={si} color={s.color} />
              })}
            </g>
          )
        })}

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const p = points[i]
          const lx = cx + p.cos * (radius + 24)
          const ly = cy + p.sin * (radius + 24)
          const anchor = Math.abs(p.cos) < 0.25 ? 'middle' : p.cos > 0 ? 'start' : 'end'
          return (
            <text
              key={axis.id}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-muted text-[11px] font-medium"
            >
              {axis.label}
            </text>
          )
        })}
      </svg>

      {/* Legend doubles as the focus control. */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {series.map((s, si) => (
          <button
            key={s.id}
            type="button"
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(s.id)}
            onBlur={() => setHovered(null)}
            className={cn(
              'inline-flex items-center gap-1.5 text-[12px] font-medium transition-opacity',
              active !== null && active !== s.id ? 'opacity-40' : 'opacity-100',
            )}
          >
            <svg width="18" height="10" aria-hidden>
              <line
                x1="0"
                y1="5"
                x2="18"
                y2="5"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={DASHES[si % DASHES.length]}
              />
              <Marker x={9} y={5} shape={si} color={s.color} scale={0.9} />
            </svg>
            <span className="text-muted">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Distinct marker per series index — the non-colour channel. */
function Marker({
  x,
  y,
  shape,
  color,
  scale = 1,
}: {
  x: number
  y: number
  shape: number
  color: string
  scale?: number
}) {
  const r = 3.2 * scale
  switch (shape % 5) {
    case 0:
      return <circle cx={x} cy={y} r={r} fill={color} />
    case 1:
      return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={0.6} fill={color} />
    case 2:
      return (
        <polygon
          points={`${x},${y - r * 1.2} ${x + r * 1.1},${y + r * 0.8} ${x - r * 1.1},${y + r * 0.8}`}
          fill={color}
        />
      )
    case 3:
      return (
        <polygon
          points={`${x},${y - r * 1.3} ${x + r * 1.3},${y} ${x},${y + r * 1.3} ${x - r * 1.3},${y}`}
          fill={color}
        />
      )
    default:
      return (
        <g stroke={color} strokeWidth={1.8 * scale} strokeLinecap="round">
          <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
          <line x1={x - r} y1={y + r} x2={x + r} y2={y - r} />
        </g>
      )
  }
}
