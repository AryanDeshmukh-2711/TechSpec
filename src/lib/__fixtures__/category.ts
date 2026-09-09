import type { Category, Product } from '@/types'

/**
 * A deliberately tiny synthetic category.
 *
 * Scoring tests run against this rather than the real catalogues so that
 * adding a phone can never break an engine test, and so every expected
 * number can be derived by hand from the fixture.
 */
export const testCategory: Category = {
  id: 'mobiles',
  label: 'Test widgets',
  singular: 'widget',
  plural: 'widgets',
  icon: 'Smartphone',
  blurb: 'Fixture category.',
  groupOrder: ['performance', 'battery', 'price'],
  cardSpecs: ['speed'],
  headlineSpecs: ['speed'],
  specs: [
    // higher is better, spans 100..300 across the catalogue
    { key: 'speed', label: 'Speed', group: 'performance', kind: 'number', higherIsBetter: true, bar: true },
    // lower is better
    { key: 'weight', label: 'Weight', group: 'battery', kind: 'number', unit: 'g', higherIsBetter: false },
    // identical on every product — must never produce a winner
    { key: 'flat', label: 'Flat', group: 'performance', kind: 'number', higherIsBetter: true },
    // informational only
    { key: 'name', label: 'Codename', group: 'performance', kind: 'text', higherIsBetter: null },
    // best-first enum
    { key: 'tier', label: 'Tier', group: 'performance', kind: 'enum', enumOrder: ['Gold', 'Silver', 'Bronze'], higherIsBetter: true },
    { key: 'wireless', label: 'Wireless', group: 'battery', kind: 'bool', higherIsBetter: true },
    // present on some products only
    { key: 'sparse', label: 'Sparse', group: 'battery', kind: 'number', higherIsBetter: true },
    { key: 'price', label: 'Price', group: 'price', kind: 'number', format: 'currency', higherIsBetter: false, bar: true },
    { key: 'releaseYear', label: 'Released', group: 'price', kind: 'number', format: 'year', higherIsBetter: true, minor: true },
  ],
  pillars: [
    { id: 'performance', label: 'Performance', short: 'Perf', hint: 'Speed.', weights: { speed: 1 } },
    { id: 'battery', label: 'Battery', short: 'Batt', hint: 'Weight and wireless.', weights: { weight: 0.5, wireless: 0.5 } },
    { id: 'value', label: 'Value', short: 'Value', hint: 'Price.', weights: { price: 1 } },
  ],
  personas: [
    { id: 'power', label: 'Power', icon: 'Zap', blurb: 'Speed above all', weights: { performance: 10, battery: 1 } },
    { id: 'budget', label: 'Budget', icon: 'PiggyBank', blurb: 'Cheap', weights: { value: 10, performance: 1 } },
  ],
  quickFilters: [
    { id: 'cheap', label: 'Under 500', test: (p) => p.price < 500 },
    { id: 'wireless', label: 'Wireless', test: (p) => p.specs.wireless === true },
  ],
}

const make = (
  id: string,
  price: number,
  specs: Product['specs'],
  overrides: Partial<Product> = {},
): Product => ({
  id,
  name: id.toUpperCase(),
  brand: overrides.brand ?? 'Acme',
  category: 'mobiles',
  price,
  releaseYear: overrides.releaseYear ?? 2025,
  rating: overrides.rating ?? 4,
  tagline: `${id} tagline`,
  accent: '#7c5cff',
  specs: { ...specs, price, releaseYear: overrides.releaseYear ?? 2025 },
  ...overrides,
})

/** slow+cheap, mid, fast+expensive, plus a strictly dominated option. */
export const testCatalogue: Product[] = [
  make('slow', 200, { speed: 100, weight: 300, flat: 7, name: 'Alpha', tier: 'Bronze', wireless: false, sparse: null }, { brand: 'Acme' }),
  make('mid', 500, { speed: 200, weight: 200, flat: 7, name: 'Beta', tier: 'Silver', wireless: true, sparse: 50 }, { brand: 'Globex', releaseYear: 2024 }),
  make('fast', 900, { speed: 300, weight: 100, flat: 7, name: 'Gamma', tier: 'Gold', wireless: true, sparse: 100 }, { brand: 'Globex' }),
  // Same price as `mid` but worse on everything — must fall off the frontier.
  make('dud', 500, { speed: 120, weight: 280, flat: 7, name: 'Delta', tier: 'Bronze', wireless: false, sparse: null }, { brand: 'Initech', rating: 2 }),
]

export const byId = (id: string): Product => {
  const found = testCatalogue.find((p) => p.id === id)
  if (!found) throw new Error(`fixture missing: ${id}`)
  return found
}
