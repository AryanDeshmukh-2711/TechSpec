import { useCallback } from 'react'

/**
 * Two-thumb range slider built from a pair of native inputs, so keyboard
 * control and screen-reader semantics come for free.
 */
export function DualRange({
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  label,
}: {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  format: (value: number) => string
  label: string
}) {
  const [lo, hi] = value
  const span = Math.max(max - min, 1)
  const loPct = ((lo - min) / span) * 100
  const hiPct = ((hi - min) / span) * 100

  const setLo = useCallback(
    (next: number) => onChange([Math.min(next, hi - step), hi]),
    [hi, onChange, step],
  )
  const setHi = useCallback(
    (next: number) => onChange([lo, Math.max(next, lo + step)]),
    [lo, onChange, step],
  )

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted">{label}</span>
        <span className="tnum text-[12px] font-semibold text-ink">
          {format(lo)} – {format(hi)}
        </span>
      </div>

      <div className="relative h-4">
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-3" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          className="ts-range ts-range-stacked"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={`${label} minimum`}
          onChange={(e) => setLo(Number(e.target.value))}
        />
        <input
          type="range"
          className="ts-range ts-range-stacked"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={`${label} maximum`}
          onChange={(e) => setHi(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
