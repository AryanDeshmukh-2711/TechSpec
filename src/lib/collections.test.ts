import { describe, expect, it } from 'vitest'
import { testCatalogue, testCategory } from './__fixtures__/category'
import { buildCollection, collectionsFor, definitionsFor, findCollection } from './collections'

describe('definitionsFor', () => {
  it('creates one collection per persona', () => {
    const definitions = definitionsFor(testCategory, testCatalogue)
    for (const persona of testCategory.personas) {
      expect(definitions.some((d) => d.key === persona.id), persona.id).toBe(true)
    }
  })

  it('adds a budget collection derived from real prices', () => {
    const budget = definitionsFor(testCategory, testCatalogue).find((d) => d.key === 'under-budget')
    expect(budget).toBeDefined()
    expect(budget!.maxPrice).toBeGreaterThan(0)
    expect(budget!.title).toMatch(/under \$/i)
  })

  it('skips the budget collection for a catalogue too small to split', () => {
    const definitions = definitionsFor(testCategory, testCatalogue.slice(0, 2))
    expect(definitions.some((d) => d.key === 'under-budget')).toBe(false)
  })

  it('gives every pillar a weight so none is silently ignored', () => {
    for (const definition of definitionsFor(testCategory, testCatalogue)) {
      for (const pillar of testCategory.pillars) {
        expect(definition.weights[pillar.id], `${definition.key}/${pillar.id}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('buildCollection', () => {
  const budgetDefinition = {
    key: 'cheap',
    title: 'Cheap ones',
    premise: 'Under 500',
    maxPrice: 500,
    weights: { performance: 5, battery: 5, value: 5 },
  }

  it('respects a price ceiling', () => {
    const collection = buildCollection(testCategory, testCatalogue, budgetDefinition)
    for (const entry of collection.entries) {
      expect(entry.scored.product.price).toBeLessThanOrEqual(500)
    }
  })

  it('respects a hard requirement', () => {
    const collection = buildCollection(testCategory, testCatalogue, {
      key: 'w',
      title: 'Wireless',
      premise: 'Wireless only',
      weights: { performance: 5 },
      requires: ['wireless'],
    })
    for (const entry of collection.entries) {
      expect(entry.scored.product.specs.wireless).toBe(true)
    }
  })

  it('ranks by the collection weights', () => {
    const perf = buildCollection(testCategory, testCatalogue, {
      key: 'p',
      title: 'Fast',
      premise: 'Speed',
      weights: { performance: 10, battery: 1, value: 1 },
    })
    expect(perf.entries[0].scored.product.id).toBe('fast')
  })

  it('normalises against the whole catalogue, not the filtered set', () => {
    const collection = buildCollection(testCategory, testCatalogue, budgetDefinition)
    const mid = collection.entries.find((e) => e.scored.product.id === 'mid')
    expect(mid?.scored.specs.speed.norm).toBe(50)
  })

  it('gives every entry a reason', () => {
    const collection = buildCollection(testCategory, testCatalogue, budgetDefinition)
    for (const entry of collection.entries) {
      expect(entry.reason.length, entry.scored.product.id).toBeGreaterThan(10)
    }
  })

  it('reports how many were considered', () => {
    const collection = buildCollection(testCategory, testCatalogue, budgetDefinition)
    expect(collection.considered).toBe(
      testCatalogue.filter((p) => p.price <= 500).length,
    )
  })

  it('caps the list', () => {
    const collection = buildCollection(testCategory, testCatalogue, budgetDefinition, 1)
    expect(collection.entries).toHaveLength(1)
  })

  it('returns an empty list rather than throwing when nothing qualifies', () => {
    const collection = buildCollection(testCategory, testCatalogue, {
      ...budgetDefinition,
      maxPrice: 1,
    })
    expect(collection.entries).toEqual([])
  })
})

describe('collectionsFor', () => {
  it('drops collections too thin to be a list', () => {
    for (const collection of collectionsFor(testCategory, testCatalogue)) {
      expect(collection.entries.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('produces different winners for different premises', () => {
    const collections = collectionsFor(testCategory, testCatalogue)
    const winners = new Set(collections.map((c) => c.entries[0]?.scored.product.id))
    // If every list crowned the same device the premises would be decorative.
    expect(winners.size).toBeGreaterThan(1)
  })
})

describe('findCollection', () => {
  it('finds one by key', () => {
    expect(findCollection(testCategory, testCatalogue, 'budget')?.key).toBe('budget')
  })

  it('returns undefined for an unknown key', () => {
    expect(findCollection(testCategory, testCatalogue, 'nope')).toBeUndefined()
  })
})

describe('reason grammar', () => {
  it('says "1 point" rather than "1 points"', () => {
    // A generated list is read by people; the singular has to be right.
    const collection = buildCollection(testCategory, testCatalogue, {
      key: 'g',
      title: 'Grammar',
      premise: 'Check',
      weights: { performance: 5, battery: 5, value: 5 },
    })
    for (const entry of collection.entries) {
      expect(entry.reason).not.toMatch(/\b1 points\b/)
    }
  })
})
