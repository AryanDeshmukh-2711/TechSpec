import type { SpecDef, SpecValue } from '@/types'

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatPrice(value: number): string {
  return priceFormatter.format(value)
}

export function formatCompactPrice(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `$${value}`
}

/** Render a spec value for the table: units, booleans, em-dash for missing. */
export function formatSpec(def: SpecDef, value: SpecValue): string {
  if (value === null || value === undefined) return '—'

  switch (def.kind) {
    case 'bool':
      return value ? 'Yes' : 'No'
    case 'number': {
      if (typeof value !== 'number') return String(value)
      if (def.format === 'currency') return formatPrice(value)
      if (def.format === 'year') return String(Math.round(value))
      const n = def.precision !== undefined ? value.toFixed(def.precision) : formatNumber(value)
      return def.unit ? `${n}${unitSeparator(def.unit)}${def.unit}` : n
    }
    default:
      return def.unit ? `${value} ${def.unit}` : String(value)
  }
}

/**
 * Word-like units get a space ("120 Hz", "227 g"); symbol units butt right up
 * against the number ('6.9"', '5×', '93/100').
 */
function unitSeparator(unit: string): string {
  return /^[a-zA-Z]/.test(unit) ? ' ' : ''
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** "+18%" style delta between two numbers; null when it can't be computed. */
export function percentDelta(a: number, b: number): string | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  const pct = ((a - b) / Math.abs(b)) * 100
  if (Math.abs(pct) < 1) return null
  return `${pct > 0 ? '+' : ''}${Math.round(pct)}%`
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Slot colour for a product column — matches the chart series palette. */
export function seriesColor(index: number): string {
  return `var(--series-${index % 5})`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
