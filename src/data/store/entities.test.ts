import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPriceHistory,
  ensureLaunchPoint,
  forgetProduct,
  loadPriceHistory,
  recordPrice,
  savePriceHistory,
  summarise,
  trackedProducts,
  type PriceHistory,
  type PricePoint,
} from './priceHistory'
import {
  clearSaved,
  findBySelection,
  loadSaved,
  newComparisonId,
  persistSaved,
  removeComparison,
  renameComparison,
  sameSelection,
  saveComparison,
  suggestTitle,
  type SavedComparison,
} from './savedComparisons'

const point = (overrides: Partial<PricePoint> = {}): PricePoint => ({
  price: 999,
  currency: 'USD',
  dateCollected: '2025-01-01',
  retailer: 'Manufacturer launch price',
  origin: 'launch',
  ...overrides,
})

/* ======================================================== PRICE_HISTORY */

describe('recordPrice', () => {
  it('appends a point', () => {
    const history = recordPrice({}, 'legion-5i-g10', point())
    expect(history['legion-5i-g10']).toHaveLength(1)
  })

  it('ignores a duplicate price on the same day from the same retailer', () => {
    let history = recordPrice({}, 'a', point())
    history = recordPrice(history, 'a', point())
    expect(history.a).toHaveLength(1)
  })

  it('keeps a different price on the same day', () => {
    let history = recordPrice({}, 'a', point())
    history = recordPrice(history, 'a', point({ price: 899, origin: 'edit' }))
    expect(history.a).toHaveLength(2)
  })

  it('keeps points sorted by date regardless of insertion order', () => {
    let history = recordPrice({}, 'a', point({ dateCollected: '2025-06-01' }))
    history = recordPrice(history, 'a', point({ dateCollected: '2025-02-01', price: 1 }))
    expect(history.a.map((p) => p.dateCollected)).toEqual(['2025-02-01', '2025-06-01'])
  })

  it('caps history so storage cannot grow without bound', () => {
    let history: PriceHistory = {}
    for (let i = 0; i < 90; i += 1) {
      history = recordPrice(history, 'a', point({ price: i, dateCollected: `2025-01-${String((i % 28) + 1).padStart(2, '0')}` }))
    }
    expect(history.a.length).toBeLessThanOrEqual(60)
  })

  it('does not mutate the input', () => {
    const original: PriceHistory = {}
    recordPrice(original, 'a', point())
    expect(original).toEqual({})
  })
})

describe('ensureLaunchPoint', () => {
  it('seeds the launch price anchored to the release year', () => {
    const history = ensureLaunchPoint({}, 'a', 1399, 2025)
    expect(history.a[0]).toMatchObject({
      price: 1399,
      dateCollected: '2025-01-01',
      origin: 'launch',
    })
  })

  it('never overwrites existing history', () => {
    const seeded = recordPrice({}, 'a', point({ price: 500, origin: 'edit' }))
    const after = ensureLaunchPoint(seeded, 'a', 1399, 2025)
    expect(after.a).toHaveLength(1)
    expect(after.a[0].price).toBe(500)
  })
})

describe('summarise', () => {
  it('reports nothing for an untracked product', () => {
    const s = summarise(undefined)
    expect(s.hasTrend).toBe(false)
    expect(s.current).toBeNull()
    expect(s.points).toEqual([])
  })

  it('has no trend from a single point', () => {
    expect(summarise([point()]).hasTrend).toBe(false)
  })

  it('computes current, extremes and change', () => {
    const s = summarise([
      point({ price: 1000, dateCollected: '2025-01-01' }),
      point({ price: 800, dateCollected: '2025-03-01' }),
      point({ price: 900, dateCollected: '2025-06-01' }),
    ])
    expect(s.current).toBe(900)
    expect(s.lowest).toBe(800)
    expect(s.highest).toBe(1000)
    expect(s.changeAbsolute).toBe(-100)
    expect(s.changePercent).toBeCloseTo(-10)
    expect(s.hasTrend).toBe(true)
  })
})

describe('forgetProduct', () => {
  it('drops a product', () => {
    const history = recordPrice({}, 'a', point())
    expect(forgetProduct(history, 'a').a).toBeUndefined()
  })

  it('is a no-op for an unknown product', () => {
    const history = recordPrice({}, 'a', point())
    expect(forgetProduct(history, 'ghost')).toBe(history)
  })
})

describe('trackedProducts', () => {
  it('orders by most recent activity', () => {
    let history = recordPrice({}, 'old', point({ dateCollected: '2024-01-01' }))
    history = recordPrice(history, 'new', point({ dateCollected: '2025-09-01' }))
    expect(trackedProducts(history)).toEqual(['new', 'old'])
  })
})

describe('price history persistence', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips', () => {
    savePriceHistory(recordPrice({}, 'a', point()))
    expect(loadPriceHistory().a).toHaveLength(1)
  })

  it('returns empty on corrupt data instead of throwing', () => {
    window.localStorage.setItem('techspec:prices:v1', 'not json')
    expect(loadPriceHistory()).toEqual({})
  })

  it('discards a different schema version', () => {
    window.localStorage.setItem(
      'techspec:prices:v1',
      JSON.stringify({ version: 99, entries: { a: [point()] } }),
    )
    expect(loadPriceHistory()).toEqual({})
  })

  it('clears', () => {
    savePriceHistory(recordPrice({}, 'a', point()))
    clearPriceHistory()
    expect(loadPriceHistory()).toEqual({})
  })
})

/* ==================================== COMPARISON / COMPARISON_ITEM */

const comparison = (overrides: Partial<SavedComparison> = {}): SavedComparison => ({
  id: newComparisonId(),
  title: 'Legion shortlist',
  createdAt: Date.now(),
  category: 'laptops',
  items: [
    { productId: 'legion-pro-7i-g10', productName: 'Legion Pro 7i Gen 10' },
    { productId: 'legion-5i-g10', productName: 'Legion 5i Gen 10' },
  ],
  priorities: { graphics: 9, value: 3 },
  ...overrides,
})

describe('newComparisonId', () => {
  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newComparisonId()))
    expect(ids.size).toBe(50)
  })
})

describe('suggestTitle', () => {
  it('joins up to three names', () => {
    expect(suggestTitle(['A', 'B', 'C'])).toBe('A vs B vs C')
  })

  it('summarises beyond three', () => {
    expect(suggestTitle(['A', 'B', 'C', 'D'])).toBe('A vs B +2 more')
  })

  it('handles an empty selection', () => {
    expect(suggestTitle([])).toBe('Untitled comparison')
  })
})

describe('sameSelection', () => {
  it('ignores product order', () => {
    expect(sameSelection(comparison(), ['legion-5i-g10', 'legion-pro-7i-g10'])).toBe(true)
  })

  it('is false for a different set', () => {
    expect(sameSelection(comparison(), ['legion-5i-g10'])).toBe(false)
  })
})

describe('saveComparison', () => {
  it('adds a new entry at the front', () => {
    const list = saveComparison([], comparison({ title: 'First' }))
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('First')
  })

  it('replaces rather than duplicates the same selection', () => {
    const first = comparison({ title: 'Original' })
    const second = comparison({ title: 'Renamed' })
    const list = saveComparison(saveComparison([], first), second)
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('Renamed')
  })

  it('keeps the same products under a different category as separate', () => {
    const laptops = comparison()
    const phones = comparison({ category: 'mobiles' })
    expect(saveComparison(saveComparison([], laptops), phones)).toHaveLength(2)
  })

  it('freezes the priority weights alongside the selection', () => {
    const list = saveComparison([], comparison({ priorities: { graphics: 10 } }))
    expect(list[0].priorities).toEqual({ graphics: 10 })
  })
})

describe('removeComparison / renameComparison', () => {
  it('removes by id', () => {
    const entry = comparison()
    expect(removeComparison([entry], entry.id)).toEqual([])
  })

  it('renames by id', () => {
    const entry = comparison()
    expect(renameComparison([entry], entry.id, '  Gaming picks  ')[0].title).toBe('Gaming picks')
  })

  it('refuses an empty title', () => {
    const entry = comparison({ title: 'Keep me' })
    expect(renameComparison([entry], entry.id, '   ')[0].title).toBe('Keep me')
  })
})

describe('findBySelection', () => {
  it('finds a saved comparison regardless of order', () => {
    const entry = comparison()
    const found = findBySelection([entry], 'laptops', ['legion-5i-g10', 'legion-pro-7i-g10'])
    expect(found?.id).toBe(entry.id)
  })

  it('returns undefined when nothing matches', () => {
    expect(findBySelection([comparison()], 'laptops', ['other'])).toBeUndefined()
  })
})

describe('saved comparison persistence', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips', () => {
    persistSaved([comparison({ title: 'Shortlist' })])
    expect(loadSaved()[0].title).toBe('Shortlist')
  })

  it('returns empty on corrupt data', () => {
    window.localStorage.setItem('techspec:saved-comparisons:v1', '{{{')
    expect(loadSaved()).toEqual([])
  })

  it('discards a different schema version', () => {
    window.localStorage.setItem(
      'techspec:saved-comparisons:v1',
      JSON.stringify({ version: 99, items: [comparison()] }),
    )
    expect(loadSaved()).toEqual([])
  })

  it('drops malformed entries but keeps good ones', () => {
    window.localStorage.setItem(
      'techspec:saved-comparisons:v1',
      JSON.stringify({ version: 1, items: [comparison(), { nonsense: true }, null] }),
    )
    expect(loadSaved()).toHaveLength(1)
  })

  it('clears', () => {
    persistSaved([comparison()])
    clearSaved()
    expect(loadSaved()).toEqual([])
  })
})
