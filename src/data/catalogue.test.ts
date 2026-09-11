import { describe, expect, it } from 'vitest'
import { CATEGORIES, SPEC_GROUPS, FEATURED_MATCHUPS, catalogueFor } from './index'
import type { Category, Product } from '@/types'

/**
 * Data-integrity suite.
 *
 * The catalogues are hand-authored, so the realistic failure mode is a typo —
 * a pillar weighting a spec key that no longer exists, an enum value missing
 * from its own ordering, a persona pointing at a renamed pillar. None of that
 * throws at runtime; it silently scores as zero and quietly corrupts a
 * verdict. These tests make the data validate itself.
 */

const catalogues = new Map<string, Product[]>()
for (const category of CATEGORIES) {
  catalogues.set(category.id, catalogueFor(category.id))
}

const products = (category: Category): Product[] => catalogues.get(category.id) ?? []

describe.each(CATEGORIES.map((c) => [c.label, c] as const))('%s', (_label, category) => {
  const specKeys = new Set(category.specs.map((s) => s.key))
  const pillarIds = new Set(category.pillars.map((p) => p.id))

  it('has a unique key per spec', () => {
    expect(category.specs.map((s) => s.key)).toHaveLength(specKeys.size)
  })

  it('declares every spec group it uses in groupOrder', () => {
    const used = new Set(category.specs.map((s) => s.group))
    for (const group of used) expect(category.groupOrder).toContain(group)
  })

  it('only uses spec groups that have display metadata', () => {
    for (const group of category.groupOrder) expect(SPEC_GROUPS[group]).toBeDefined()
  })

  it('weights only spec keys that exist', () => {
    for (const pillar of category.pillars) {
      for (const key of Object.keys(pillar.weights)) {
        expect(specKeys, `pillar "${pillar.id}" weights unknown spec "${key}"`).toContain(key)
      }
    }
  })

  it('never weights an unrankable spec', () => {
    const unrankable = new Set(
      category.specs.filter((s) => s.higherIsBetter === null).map((s) => s.key),
    )
    for (const pillar of category.pillars) {
      for (const key of Object.keys(pillar.weights)) {
        expect(unrankable, `pillar "${pillar.id}" weights unrankable spec "${key}"`).not.toContain(key)
      }
    }
  })

  it('gives every pillar a positive total weight', () => {
    for (const pillar of category.pillars) {
      const total = Object.values(pillar.weights).reduce((a, b) => a + b, 0)
      expect(total, `pillar "${pillar.id}"`).toBeGreaterThan(0)
    }
  })

  it('routes every persona weight to a real pillar', () => {
    for (const persona of category.personas) {
      for (const id of Object.keys(persona.weights)) {
        expect(pillarIds, `persona "${persona.id}" weights unknown pillar "${id}"`).toContain(id)
      }
    }
  })

  it('surfaces the six buyer profiles the product promises', () => {
    expect(category.personas.length).toBe(6)
    expect(new Set(category.personas.map((p) => p.id)).size).toBe(6)
  })

  it('points cardSpecs and headlineSpecs at real specs', () => {
    for (const key of [...category.cardSpecs, ...category.headlineSpecs]) {
      expect(specKeys, `display spec "${key}" does not exist`).toContain(key)
    }
  })

  it('gives every enum spec an ordering', () => {
    for (const spec of category.specs) {
      if (spec.kind !== 'enum') continue
      if (spec.higherIsBetter === null) continue
      expect(spec.enumOrder, `enum spec "${spec.key}" has no enumOrder`).toBeDefined()
      expect(new Set(spec.enumOrder).size).toBe(spec.enumOrder!.length)
    }
  })

  /* ------------------------------------------------------------- products */

  it('ships at least two products so a comparison is possible', () => {
    expect(products(category).length).toBeGreaterThanOrEqual(2)
  })

  it('has a unique id per product', () => {
    const ids = products(category).map((p) => p.id)
    expect(new Set(ids).size, `duplicate ids in ${category.id}`).toBe(ids.length)
  })

  it('files every product under its own category', () => {
    for (const product of products(category)) expect(product.category).toBe(category.id)
  })

  it('gives every product a sane price, year and rating', () => {
    for (const product of products(category)) {
      expect(product.price, product.id).toBeGreaterThan(0)
      expect(product.releaseYear, product.id).toBeGreaterThanOrEqual(2018)
      expect(product.rating, product.id).toBeGreaterThanOrEqual(0)
      expect(product.rating, product.id).toBeLessThanOrEqual(5)
      expect(product.accent, product.id).toMatch(/^#[0-9a-f]{6}$/i)
      expect(product.tagline.length, product.id).toBeGreaterThan(10)
    }
  })

  it('mirrors price and release year into the spec map', () => {
    // Hydration copies these in so they can be scored like any other spec.
    for (const product of products(category)) {
      expect(product.specs.price, product.id).toBe(product.price)
      expect(product.specs.releaseYear, product.id).toBe(product.releaseYear)
    }
  })

  it('uses only enum values that appear in the spec ordering', () => {
    for (const spec of category.specs) {
      if (spec.kind !== 'enum' || !spec.enumOrder) continue
      for (const product of products(category)) {
        const value = product.specs[spec.key]
        if (value === null || value === undefined) continue
        expect(
          spec.enumOrder,
          `${product.id}.${spec.key} = "${value}" is not in enumOrder`,
        ).toContain(value)
      }
    }
  })

  it('matches the declared kind for every value it reports', () => {
    for (const spec of category.specs) {
      for (const product of products(category)) {
        const value = product.specs[spec.key]
        if (value === null || value === undefined) continue
        const actual = typeof value
        const expected =
          spec.kind === 'number' ? 'number' : spec.kind === 'bool' ? 'boolean' : 'string'
        expect(actual, `${product.id}.${spec.key} should be ${expected}, got ${actual}`).toBe(expected)
      }
    }
  })

  it('reports every spec that any pillar depends on', () => {
    // A product missing a weighted spec is legal, but if *no* product reports
    // it the pillar silently loses that input everywhere.
    const weighted = new Set(category.pillars.flatMap((p) => Object.keys(p.weights)))
    for (const key of weighted) {
      const reported = products(category).some((p) => p.specs[key] !== null && p.specs[key] !== undefined)
      expect(reported, `no ${category.id} product reports weighted spec "${key}"`).toBe(true)
    }
  })
})

describe('featured matchups', () => {
  it('references products that exist in the category it names', () => {
    for (const matchup of FEATURED_MATCHUPS) {
      const ids = new Set((catalogues.get(matchup.category) ?? []).map((p) => p.id))
      for (const id of matchup.ids) {
        expect(ids, `matchup "${matchup.title}" references missing product "${id}"`).toContain(id)
      }
    }
  })

  it('stays within the two-to-five comparison limit', () => {
    for (const matchup of FEATURED_MATCHUPS) {
      expect(matchup.ids.length, matchup.title).toBeGreaterThanOrEqual(2)
      expect(matchup.ids.length, matchup.title).toBeLessThanOrEqual(5)
      expect(new Set(matchup.ids).size, `${matchup.title} repeats a product`).toBe(matchup.ids.length)
    }
  })
})

describe('catalogueFor', () => {
  it('returns an empty list for an unknown category rather than undefined', () => {
    // @ts-expect-error deliberately invalid category id
    expect(catalogueFor('drones')).toEqual([])
  })

  it('returns an empty list when no category is selected', () => {
    expect(catalogueFor(null)).toEqual([])
  })

  it('has devices for every registered category', () => {
    // `catalogueFor` answers an unknown id with silence, so registering a
    // category in CATEGORIES but forgetting it in CATALOGUE would produce a
    // browsable, permanently empty category instead of an error. Nothing in
    // the type system catches that — both are keyed by CategoryId.
    for (const category of CATEGORIES) {
      expect(catalogueFor(category.id).length, category.id).toBeGreaterThan(0)
    }
  })
})
