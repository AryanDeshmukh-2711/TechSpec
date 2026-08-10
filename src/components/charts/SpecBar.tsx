import { cn } from '@/lib/cn'

/**
 * The proportional bar shown next to a spec value.
 *
 * The fill is the spec's position within the *whole category*, so a full bar
 * means "class-leading", not merely "best of the two you picked".
 */
export function SpecBar({
  value,
  color,
  best,
  className,
}: {
  /** 0–100 */
  value: number | null
  color: string
  best?: boolean
  className?: string
}) {
  if (value === null) {
    return <div className={cn('h-1.5 rounded-full bg-surface-3', className)} />
  }
  return (
    <div
      className={cn('relative h-1.5 overflow-hidden rounded-full bg-surface-3', className)}
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.max(2, value)}%`,
          background: color,
          boxShadow: best ? `0 0 8px -1px ${color}` : undefined,
        }}
      />
    </div>
  )
}

/** Horizontal labelled bar used in the pillar breakdown. */
export function LabelledBar({
  label,
  value,
  color,
  suffix,
  className,
}: {
  label: string
  value: number
  color: string
  suffix?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="w-[86px] shrink-0 truncate text-[12px] text-muted">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(2, value)}%`, background: color }}
        />
      </div>
      <span className="tnum w-9 shrink-0 text-right text-[12px] font-semibold text-ink">
        {Math.round(value)}
        {suffix}
      </span>
    </div>
  )
}
