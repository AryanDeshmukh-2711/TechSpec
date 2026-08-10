import type { Category, PickerFilters, Product, SortKey } from '@/types'
import { buildRanges } from './scoring'

/**
 * Search + filter + sort for the picker. Kept pure so it's trivially
 * testable and cheap to memoise.
 */

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Best match' },
  { key: 'score-desc', label: 'Overall score' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'rating-desc', label: 'Editorial rating' },
  { key: 'newest', label: 'Newest first' },
]

export const EMPTY_FILTERS: PickerFilters = {
  query: '',
  brands: [],
  priceMin: null,
  priceMax: null,
  quickFilters: [],
  sort: 'relevance',
}

/** Simple subsequence-tolerant scorer: name > brand > tagline > spec text. */
function matchScore(product: Product, query: string): number {
  if (!query) return 0
  const q = query.toLowerCase().trim()
  if (!q) return 0

  const terms = q.split(/\s+/)
  const name = product.name.toLowerCase()
  const brand = product.brand.toLowerCase()
  const tagline = product.tagline.toLowerCase()
  const specText = Object.values(product.specs)
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase()

  let score = 0
  for (const term of terms) {
    if (name.startsWith(term)) score += 100
    else if (name.includes(term)) score += 60
    else if (brand.includes(term)) score += 40
    else if (tagline.includes(term)) score += 15
    else if (specText.includes(term)) score += 10
    else return -1 // every term must land somewhere
  }
  return score
}

export function applyFilters(
  category: Category,
  catalogue: Product[],
  filters: PickerFilters,
): Product[] {
  const quick = category.quickFilters.filter((q) => filters.quickFilters.includes(q.id))

  const matched = catalogue
    .map((product) => ({ product, score: matchScore(product, filters.query) }))
    .filter(({ product, score }) => {
      if (score < 0) return false
      if (filters.brands.length && !filters.brands.includes(product.brand)) return false
      if (filters.priceMin !== null && product.price < filters.priceMin) return false
      if (filters.priceMax !== null && product.price > filters.priceMax) return false
      // Quick filters intersect — each one narrows further.
      return quick.every((q) => q.test(product))
    })

  const sorted = [...matched].sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.product.price - b.product.price
      case 'price-desc':
        return b.product.price - a.product.price
      case 'rating-desc':
        return b.product.rating - a.product.rating
      case 'newest':
        return b.product.releaseYear - a.product.releaseYear || b.product.price - a.product.price
      case 'score-desc':
        return baselineScore(category, catalogue, b.product) -
          baselineScore(category, catalogue, a.product)
      case 'relevance':
      default:
        if (filters.query) return b.score - a.score || b.product.rating - a.product.rating
        return (
          b.product.rating - a.product.rating ||
          b.product.releaseYear - a.product.releaseYear ||
          a.product.name.localeCompare(b.product.name)
        )
    }
  })

  return sorted.map((m) => m.product)
}

/**
 * An unweighted overall score used only for sorting the picker grid, cached
 * per category so sorting a long list stays cheap.
 */
const baselineCache = new WeakMap<Category, Map<string, number>>()

export function baselineScore(category: Category, catalogue: Product[], product: Product): number {
  let cache = baselineCache.get(category)
  if (!cache) {
    cache = new Map()
    baselineCache.set(category, cache)
  }
  const hit = cache.get(product.id)
  if (hit !== undefined) return hit

  const ranges = buildRanges(category, catalogue)
  let total = 0
  let weight = 0
  for (const pillar of category.pillars) {
    let pTotal = 0
    let pWeight = 0
    for (const [key, w] of Object.entries(pillar.weights)) {
      const def = category.specs.find((s) => s.key === key)
      const range = ranges[key]
      if (!def || !range || def.higherIsBetter === null) continue
      const raw = product.specs[key]
      let n: number | null = null
      if (typeof raw === 'number') n = raw
      else if (typeof raw === 'boolean') n = raw ? 1 : 0
      else if (typeof raw === 'string' && def.enumOrder) {
        const idx = def.enumOrder.indexOf(raw)
        n = idx === -1 ? null : def.enumOrder.length - 1 - idx
      }
      if (n === null) continue
      const span = range.max - range.min
      const pos = span < 1e-9 ? 50 : ((n - range.min) / span) * 100
      pTotal += (def.higherIsBetter ? pos : 100 - pos) * w
      pWeight += w
    }
    if (pWeight > 0) {
      total += pTotal / pWeight
      weight += 1
    }
  }
  const score = weight ? total / weight : 0
  cache.set(product.id, score)
  return score
}

export function activeFilterCount(filters: PickerFilters): number {
  return (
    filters.brands.length +
    filters.quickFilters.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0)
  )
}

export function brandsOf(catalogue: Product[]): string[] {
  return [...new Set(catalogue.map((p) => p.brand))].sort((a, b) => a.localeCompare(b))
}

export function priceBoundsOf(catalogue: Product[]): [number, number] {
  if (!catalogue.length) return [0, 0]
  const prices = catalogue.map((p) => p.price)
  return [Math.min(...prices), Math.max(...prices)]
}
