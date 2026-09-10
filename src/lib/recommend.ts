import type { Category, Product, ScoredProduct } from '@/types'
import { scoreProducts } from './scoring'

/**
 * The guided recommender — differentiator #72 in the research report:
 * "Instead of basic search, an interactive wizard asks user needs and suggests
 * a ranked list."
 *
 * Every question is derived from the category's own schema rather than written
 * per category, so adding a category gets a working wizard for free. Budget
 * bands come from the actual price distribution, priorities are the category's
 * pillars, and must-haves are its quick filters.
 */

export interface QuizAnswers {
  /** Upper price bound, or null for "no limit". */
  budget: number | null
  /** Pillar ids in order of importance; the first matters most. */
  priorities: string[]
  /** Quick-filter ids treated as hard requirements. */
  mustHaves: string[]
}

export const EMPTY_ANSWERS: QuizAnswers = { budget: null, priorities: [], mustHaves: [] }

export interface BudgetBand {
  label: string
  max: number | null
  /** How many devices fall within it, so an empty band is never offered. */
  count: number
}

/** Round to something a person would actually say out loud. */
function niceCeiling(value: number): number {
  if (value <= 200) return Math.ceil(value / 25) * 25
  if (value <= 1000) return Math.ceil(value / 50) * 50
  if (value <= 3000) return Math.ceil(value / 100) * 100
  return Math.ceil(value / 500) * 500
}

/**
 * Budget bands from the catalogue's own quartiles, so they suit the category:
 * "under $500" is meaningful for phones and useless for cameras.
 */
export function budgetBands(catalogue: Product[]): BudgetBand[] {
  if (catalogue.length === 0) return [{ label: 'Any budget', max: null, count: 0 }]

  const prices = catalogue.map((p) => p.price).sort((a, b) => a - b)
  const at = (fraction: number) =>
    prices[Math.min(prices.length - 1, Math.floor(prices.length * fraction))]

  const cuts = [...new Set([at(0.33), at(0.66)].map(niceCeiling))].sort((a, b) => a - b)

  const bands: BudgetBand[] = cuts.map((max) => ({
    label: `Under $${max.toLocaleString('en-US')}`,
    max,
    count: catalogue.filter((p) => p.price <= max).length,
  }))

  bands.push({ label: 'Any budget', max: null, count: catalogue.length })

  // Drop bands that would show nothing, and any that duplicate the full set.
  return bands.filter(
    (band, index) => band.count > 0 && (index === bands.length - 1 || band.count < catalogue.length),
  )
}

/**
 * Only offer a requirement that actually splits the catalogue. A filter every
 * device passes teaches the user nothing and narrows nothing.
 */
export function usefulRequirements(category: Category, catalogue: Product[]) {
  return category.quickFilters
    .map((quick) => ({
      id: quick.id,
      label: quick.label,
      count: catalogue.filter((p) => quick.test(p)).length,
    }))
    .filter((entry) => entry.count > 0 && entry.count < catalogue.length)
}

/**
 * Turn answers into pillar weights.
 *
 * The first choice dominates, the second supports, everything else drops to a
 * low floor rather than zero — a buyer who prioritises battery still cares
 * slightly whether the thing is unusably slow.
 */
export function weightsFrom(category: Category, answers: QuizAnswers): Record<string, number> {
  const weights: Record<string, number> = {}
  for (const pillar of category.pillars) weights[pillar.id] = 2

  const [first, second] = answers.priorities
  if (first && first in weights) weights[first] = 10
  if (second && second in weights) weights[second] = 7

  // A budget answer is itself a statement about value.
  if (answers.budget !== null && 'value' in weights) {
    weights.value = Math.max(weights.value, 6)
  }

  return weights
}

export interface Recommendation {
  scored: ScoredProduct
  /** Plain-language reasons, strongest first. */
  reasons: string[]
}

export interface QuizOutcome {
  recommendations: Recommendation[]
  /** Devices excluded, and why — never silently dropped. */
  excluded: { product: Product; reason: string }[]
  weights: Record<string, number>
}

/**
 * Run the recommender.
 *
 * Scoring uses the *whole* catalogue as the normalisation basis even though
 * only the shortlist is returned, so a bar still means "good for a phone"
 * rather than "good among the four that survived the filter".
 */
export function recommend(
  category: Category,
  catalogue: Product[],
  answers: QuizAnswers,
  limit = 5,
): QuizOutcome {
  const requirements = category.quickFilters.filter((q) => answers.mustHaves.includes(q.id))
  const excluded: { product: Product; reason: string }[] = []
  const eligible: Product[] = []

  for (const product of catalogue) {
    if (answers.budget !== null && product.price > answers.budget) {
      excluded.push({ product, reason: `over $${answers.budget.toLocaleString('en-US')}` })
      continue
    }
    const failed = requirements.filter((q) => !q.test(product))
    if (failed.length) {
      excluded.push({ product, reason: `no ${failed.map((f) => f.label.toLowerCase()).join(', ')}` })
      continue
    }
    eligible.push(product)
  }

  const weights = weightsFrom(category, answers)
  const scored = scoreProducts(category, catalogue, eligible, { priorities: weights })
  const ranked = [...scored].sort((a, b) => b.overall - a.overall).slice(0, limit)

  return {
    recommendations: ranked.map((item) => ({
      scored: item,
      reasons: reasonsFor(category, item, answers, ranked),
    })),
    excluded,
    weights,
  }
}

function reasonsFor(
  category: Category,
  item: ScoredProduct,
  answers: QuizAnswers,
  field: ScoredProduct[],
): string[] {
  const reasons: string[] = []

  // Lead with the thing they said mattered most.
  for (const pillarId of answers.priorities.slice(0, 2)) {
    const pillar = category.pillars.find((p) => p.id === pillarId)
    if (!pillar) continue
    const score = item.pillars[pillarId] ?? 0
    const best = Math.max(...field.map((f) => f.pillars[pillarId] ?? 0))
    if (score >= best - 0.5) {
      reasons.push(`Best ${pillar.label.toLowerCase()} of everything that fits`)
    } else if (score >= 60) {
      reasons.push(`Strong ${pillar.label.toLowerCase()} (${Math.round(score)}/100)`)
    }
  }

  if (item.onFrontier) {
    reasons.push('Nothing cheaper here scores higher')
  }

  const cheapest = [...field].sort((a, b) => a.product.price - b.product.price)[0]
  if (cheapest?.product.id === item.product.id && field.length > 1) {
    reasons.push('Cheapest option that meets your requirements')
  }

  // Never list something without saying why it is there. A device that leads
  // on nothing still gets an honest line naming where it is relatively
  // strongest, rather than sitting in the shortlist unexplained.
  if (reasons.length === 0) {
    const strongest = category.pillars
      .map((pillar) => ({ pillar, score: item.pillars[pillar.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)[0]

    reasons.push(
      strongest && strongest.score > 0
        ? `Meets your requirements; strongest on ${strongest.pillar.label.toLowerCase()}`
        : 'Meets your requirements, but leads on nothing here',
    )
  }

  return reasons.slice(0, 3)
}

/** True once there is enough to produce a meaningful ranking. */
export function isAnswered(answers: QuizAnswers): boolean {
  return answers.priorities.length > 0
}
