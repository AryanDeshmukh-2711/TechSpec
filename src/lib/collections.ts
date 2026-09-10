import type { Category, Product, ScoredProduct } from '@/types'
import { scoreProducts } from './scoring'
import { formatPrice } from './format'

/**
 * Generated "best of" collections — items 14 and 83 in the research report:
 * SEO buying-guide pages, and unique in-depth content rather than a scraped
 * feed.
 *
 * These are generated from the catalogue rather than written, which means they
 * stay correct when a device is edited, added or hidden. Each one is a real
 * query against the scoring engine with its weights on show, so a reader can
 * disagree with the premise instead of just the conclusion.
 */

export interface CollectionDefinition {
  key: string
  title: string
  /** One-line statement of what the list is selecting for. */
  premise: string
  /** Pillar weights used to rank. */
  weights: Record<string, number>
  /** Optional price ceiling. */
  maxPrice?: number
  /** Quick-filter ids every entry must satisfy. */
  requires?: string[]
}

export interface CollectionEntry {
  scored: ScoredProduct
  reason: string
}

export interface Collection extends CollectionDefinition {
  categoryId: string
  entries: CollectionEntry[]
  /** Total considered before the cut, for the "picked from N" line. */
  considered: number
}

/** Round a price cap to something that reads like a shopping decision. */
function priceCap(catalogue: Product[], fraction: number): number | null {
  if (catalogue.length < 4) return null
  const prices = catalogue.map((p) => p.price).sort((a, b) => a - b)
  const raw = prices[Math.floor(prices.length * fraction)]
  const step = raw <= 500 ? 50 : raw <= 2000 ? 100 : 500
  return Math.ceil(raw / step) * step
}

/**
 * Build the collection definitions for a category.
 *
 * One per persona, because a persona already encodes an opinion about what
 * matters, plus a budget cut that adapts to the category's own prices.
 */
export function definitionsFor(
  category: Category,
  catalogue: Product[],
): CollectionDefinition[] {
  const definitions: CollectionDefinition[] = category.personas.map((persona) => ({
    key: persona.id,
    title: `Best ${category.plural} for ${persona.label.toLowerCase()}`,
    premise: persona.blurb,
    weights: Object.fromEntries(
      category.pillars.map((pillar) => [pillar.id, persona.weights[pillar.id] ?? 1]),
    ),
  }))

  const budget = priceCap(catalogue, 0.4)
  if (budget !== null) {
    definitions.push({
      key: 'under-budget',
      title: `Best ${category.plural} under ${formatPrice(budget)}`,
      premise: `Everything worth having below ${formatPrice(budget)}, ranked on overall capability rather than price alone.`,
      maxPrice: budget,
      weights: Object.fromEntries(category.pillars.map((p) => [p.id, p.id === 'value' ? 7 : 5])),
    })
  }

  return definitions
}

/** Run one definition against the catalogue. */
export function buildCollection(
  category: Category,
  catalogue: Product[],
  definition: CollectionDefinition,
  limit = 5,
): Collection {
  const required = category.quickFilters.filter((q) => definition.requires?.includes(q.id))

  const eligible = catalogue.filter((product) => {
    if (definition.maxPrice !== undefined && product.price > definition.maxPrice) return false
    return required.every((q) => q.test(product))
  })

  // Normalise against the whole catalogue so a bar still means class-leading.
  const scored = scoreProducts(category, catalogue, eligible, { priorities: definition.weights })
  const ranked = [...scored].sort((a, b) => b.overall - a.overall).slice(0, limit)

  return {
    ...definition,
    categoryId: category.id,
    considered: eligible.length,
    entries: ranked.map((item, index) => ({
      scored: item,
      reason: reasonFor(category, item, definition, ranked, index),
    })),
  }
}

function reasonFor(
  category: Category,
  item: ScoredProduct,
  definition: CollectionDefinition,
  field: ScoredProduct[],
  index: number,
): string {
  // Name the pillar this list actually selects for.
  const leading = Object.entries(definition.weights)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => category.pillars.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))[0]

  if (index === 0 && leading) {
    return `Tops this list on ${leading.label.toLowerCase()} once everything else is weighed in.`
  }

  const winner = field[0]
  const gap = Math.round(winner.overall - item.overall)
  const points = `${gap} point${gap === 1 ? '' : 's'}`

  const cheaper = winner.product.price - item.product.price
  if (cheaper > 0) {
    return `${points} behind the winner for ${formatPrice(cheaper)} less.`
  }

  if (item.onFrontier) {
    return `${points} behind the winner, and nothing cheaper here scores higher.`
  }

  const strongest = category.pillars
    .map((pillar) => ({ pillar, score: item.pillars[pillar.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)[0]

  return strongest
    ? `Strongest on ${strongest.pillar.label.toLowerCase()} of anything at this rank.`
    : `${gap} points behind the winner.`
}

/** Every collection for a category, skipping any that came out empty. */
export function collectionsFor(
  category: Category,
  catalogue: Product[],
  limit = 5,
): Collection[] {
  return definitionsFor(category, catalogue)
    .map((definition) => buildCollection(category, catalogue, definition, limit))
    .filter((collection) => collection.entries.length >= 2)
}

export function findCollection(
  category: Category,
  catalogue: Product[],
  key: string,
  limit = 5,
): Collection | undefined {
  const definition = definitionsFor(category, catalogue).find((d) => d.key === key)
  return definition ? buildCollection(category, catalogue, definition, limit) : undefined
}
