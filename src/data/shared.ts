import type { Persona, Product, QuickFilter, SpecDef } from '@/types'

/**
 * Spec definitions and personas reused across categories. `price` and
 * `releaseYear` are injected into every product's spec map at hydration
 * time (see `data/index.ts`) so they can be scored like any other spec
 * without duplicating them in the product records.
 */

export const priceSpec: SpecDef = {
  key: 'price',
  label: 'Launch price',
  group: 'price',
  kind: 'number',
  format: 'currency',
  higherIsBetter: false,
  bar: true,
  hint: 'Manufacturer launch price in USD. Street prices drop over time.',
}

export const releaseYearSpec: SpecDef = {
  key: 'releaseYear',
  label: 'Released',
  group: 'price',
  kind: 'number',
  format: 'year',
  higherIsBetter: true,
  minor: true,
  hint: 'Newer hardware generally means longer software support.',
}

export const commercialSpecs: SpecDef[] = [priceSpec, releaseYearSpec]

/** Persona presets shared by device categories that behave like computers. */
export const budgetPersona = (valuePillar = 'value'): Persona => ({
  id: 'budget',
  label: 'Budget buyers',
  icon: 'PiggyBank',
  blurb: 'Most capability per dollar spent',
  weights: { [valuePillar]: 10 },
})

export const priceQuickFilters = (thresholds: number[]): QuickFilter[] =>
  thresholds.map((t) => ({
    id: `under-${t}`,
    label: `Under $${t.toLocaleString('en-US')}`,
    test: (p: Product) => p.price < t,
  }))

/** Brand accent colours used by the generated device artwork. */
export const BRAND_ACCENT: Record<string, string> = {
  Apple: '#9aa3ad',
  Samsung: '#2f6fed',
  Google: '#2fa66b',
  OnePlus: '#e5333f',
  Xiaomi: '#ff7a1a',
  Nothing: '#c9ced6',
  Motorola: '#5b9df0',
  Asus: '#e8455f',
  Sony: '#e0a44a',
  Bose: '#4b8fd6',
  Sennheiser: '#3fb2a0',
  Dell: '#2f8fd6',
  Lenovo: '#e0464f',
  HP: '#3fa8c4',
  Razer: '#5ecb63',
  Framework: '#e8823f',
  Acer: '#7ec44a',
  Garmin: '#3f9ad6',
  Amazfit: '#e8a13f',
  Anker: '#4fb0e8',
  Beyerdynamic: '#9a86e0',
  Canon: '#e05555',
  Nikon: '#e8c33f',
  Fujifilm: '#4fbf8a',
  Panasonic: '#5c8fe0',
  'OM System': '#5fc4d6',
}

export function accentFor(brand: string): string {
  return BRAND_ACCENT[brand] ?? '#7c5cff'
}
