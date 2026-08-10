import { cn } from '@/lib/cn'

/** Circular score readout used on the verdict card and column headers. */
export function ScoreRing({
  value,
  color,
  size = 64,
  label,
  className,
}: {
  /** 0–100 */
  value: number
  color: string
  size?: number
  label?: string
  className?: string
}) {
  const stroke = size >= 56 ? 5 : 4
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100)

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ts-surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tnum leading-none font-semibold text-ink"
          style={{ fontSize: size * 0.31 }}
        >
          {Math.round(value)}
        </span>
        {label && (
          <span className="mt-0.5 text-[9px] font-medium tracking-wide text-faint uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
