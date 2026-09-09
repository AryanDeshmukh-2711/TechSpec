import { describe, expect, it } from 'vitest'
import type { SpecDef } from '@/types'
import { formatCompactPrice, formatPrice, formatSpec, initials, percentDelta, pluralise } from './format'

const spec = (overrides: Partial<SpecDef>): SpecDef => ({
  key: 'x',
  label: 'X',
  group: 'performance',
  kind: 'number',
  higherIsBetter: true,
  ...overrides,
})

describe('formatSpec', () => {
  it('renders a missing value as an em dash', () => {
    expect(formatSpec(spec({}), null)).toBe('—')
  })

  it('renders booleans as Yes/No', () => {
    expect(formatSpec(spec({ kind: 'bool' }), true)).toBe('Yes')
    expect(formatSpec(spec({ kind: 'bool' }), false)).toBe('No')
  })

  it('separates word units with a space', () => {
    expect(formatSpec(spec({ unit: 'Hz' }), 120)).toBe('120 Hz')
    expect(formatSpec(spec({ unit: 'nits' }), 2600)).toBe('2,600 nits')
  })

  it('butts symbol units against the number', () => {
    // Regression guard: these used to render as `6.9 "` and `5 ×`.
    expect(formatSpec(spec({ unit: '"', precision: 1 }), 6.9)).toBe('6.9"')
    expect(formatSpec(spec({ unit: '×', precision: 1 }), 5)).toBe('5.0×')
    expect(formatSpec(spec({ unit: '/100' }), 93)).toBe('93/100')
    expect(formatSpec(spec({ unit: '%' }), 100)).toBe('100%')
  })

  it('formats currency as money, not a bare number with a unit', () => {
    expect(formatSpec(spec({ format: 'currency' }), 1099)).toBe('$1,099')
  })

  it('formats a year without a thousands separator', () => {
    // Regression guard: this used to render as `2,025`.
    expect(formatSpec(spec({ format: 'year' }), 2025)).toBe('2025')
  })

  it('honours precision and groups large numbers', () => {
    expect(formatSpec(spec({ precision: 2 }), 0.775)).toBe('0.78')
    expect(formatSpec(spec({}), 2650000)).toBe('2,650,000')
  })

  it('passes enum and text values through', () => {
    expect(formatSpec(spec({ kind: 'enum' }), 'Wi-Fi 7')).toBe('Wi-Fi 7')
  })
})

describe('formatPrice / formatCompactPrice', () => {
  it('formats whole dollars', () => {
    expect(formatPrice(1299)).toBe('$1,299')
  })

  it('compacts thousands only when it stays readable', () => {
    expect(formatCompactPrice(429)).toBe('$429')
    expect(formatCompactPrice(2000)).toBe('$2k')
    expect(formatCompactPrice(1499)).toBe('$1.5k')
  })
})

describe('percentDelta', () => {
  it('signs the direction', () => {
    expect(percentDelta(120, 100)).toBe('+20%')
    expect(percentDelta(80, 100)).toBe('-20%')
  })

  it('suppresses noise below one percent', () => {
    expect(percentDelta(100.4, 100)).toBeNull()
  })

  it('refuses to divide by zero', () => {
    expect(percentDelta(5, 0)).toBeNull()
  })
})

describe('pluralise', () => {
  it('uses the explicit plural when the naive one is wrong', () => {
    // Regression guard: this used to render `8 watchs`.
    expect(pluralise(8, 'watch', 'watches')).toBe('8 watches')
    expect(pluralise(1, 'watch', 'watches')).toBe('1 watch')
  })
})

describe('initials', () => {
  it('takes at most two leading characters', () => {
    expect(initials('Galaxy S25 Ultra')).toBe('GS')
    expect(initials('iPhone')).toBe('I')
  })
})
