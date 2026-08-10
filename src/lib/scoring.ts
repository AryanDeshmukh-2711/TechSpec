import type {
  Category,
  NormalisedSpec,
  Persona,
  PersonaVerdict,
  Product,
  ScoredProduct,
  SpecDef,
  SpecValue,
} from '@/types'

/**
 * The scoring engine.
 *
 * Every spec is normalised to 0–100 against the *whole category catalogue*,
 * not just the current selection — so a bar means "good for a phone", not
 * "good compared to the two other things you happened to pick". Pillars
 * aggregate those normals; the overall score aggregates pillars using the
 * user's own priority weights. Change a slider, the winner can change.
 */

const EPSILON = 1e-9

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n))
}

/** Numeric position of any spec value, or null if it can't be ranked. */
function numericValue(def: SpecDef, value: SpecValue): number | null {
  if (value === null || value === undefined) return null
  switch (def.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? value : null
    case 'bool':
      return value === true ? 1 : value === false ? 0 : null
    case 'enum': {
      if (!def.enumOrder || typeof value !== 'string') return null
      const idx = def.enumOrder.indexOf(value)
      if (idx === -1) return null
      // enumOrder is best→worst, so invert into an ascending scale.
      return def.enumOrder.length - 1 - idx
    }
    default:
      return null
  }
}

interface Range {
  min: number
  max: number
}

/** Per-spec min/max across a catalogue, used as the normalisation basis. */
export function buildRanges(category: Category, catalogue: Product[]): Record<string, Range> {
  const ranges: Record<string, Range> = {}
  for (const def of category.specs) {
    if (def.higherIsBetter === null) continue
    let min = Infinity
    let max = -Infinity
    for (const product of catalogue) {
      const n = numericValue(def, product.specs[def.key] ?? null)
      if (n === null) continue
      if (n < min) min = n
      if (n > max) max = n
    }
    if (min !== Infinity) ranges[def.key] = { min, max }
  }
  return ranges
}

function normaliseSpec(def: SpecDef, value: SpecValue, range: Range | undefined): number | null {
  if (def.higherIsBetter === null || !range) return null
  const n = numericValue(def, value)
  if (n === null) return null

  const span = range.max - range.min
  // A spec every product shares carries no information — park it mid-scale
  // rather than declaring an arbitrary winner.
  if (span < EPSILON) return 50

  const position = ((n - range.min) / span) * 100
  return clamp(def.higherIsBetter ? position : 100 - position)
}

/**
 * Weighted mean that skips missing members and re-normalises the remaining
 * weights, so a product missing one input isn't silently penalised.
 */
function weightedMean(
  weights: Record<string, number>,
  lookup: (key: string) => number | null,
): number {
  let total = 0
  let weightSum = 0
  for (const [key, weight] of Object.entries(weights)) {
    const v = lookup(key)
    if (v === null) continue
    total += v * weight
    weightSum += weight
  }
  return weightSum < EPSILON ? 0 : total / weightSum
}

export interface ScoreOptions {
  /** Pillar id → user weight (0–10). Missing pillars default to 5. */
  priorities?: Record<string, number>
}

/**
 * Score a set of products. `catalogue` sets the normalisation basis and
 * should be the full category, even when `selection` is a subset.
 */
export function scoreProducts(
  category: Category,
  catalogue: Product[],
  selection: Product[],
  options: ScoreOptions = {},
): ScoredProduct[] {
  const ranges = buildRanges(category, catalogue)
  const specByKey = new Map(category.specs.map((s) => [s.key, s]))
  const priorities = options.priorities ?? {}

  const prelim = selection.map((product) => {
    const specs: Record<string, NormalisedSpec> = {}
    for (const def of category.specs) {
      const raw = product.specs[def.key] ?? null
      specs[def.key] = { raw, norm: normaliseSpec(def, raw, ranges[def.key]) }
    }

    const pillars: Record<string, number> = {}
    for (const pillar of category.pillars) {
      pillars[pillar.id] = weightedMean(pillar.weights, (key) => {
        const def = specByKey.get(key)
        if (!def) return null
        return specs[key]?.norm ?? null
      })
    }

    const overall = weightedMean(
      Object.fromEntries(category.pillars.map((p) => [p.id, priorities[p.id] ?? 5])),
      (id) => pillars[id] ?? null,
    )

    return { product, specs, pillars, overall }
  })

  // Value index: score per dollar, rebased so the *catalogue* median = 50.
  const medianPrice = median(catalogue.map((p) => p.price)) || 1
  const withValue = prelim.map((p) => {
    const priceRatio = Math.max(p.product.price, 1) / medianPrice
    // Square-rooting the price ratio stops a $99 product from dominating
    // purely by being cheap — it rewards efficiency, not just frugality.
    const raw = p.overall / Math.sqrt(priceRatio)
    return { ...p, valueRaw: raw }
  })

  const maxValue = Math.max(...withValue.map((p) => p.valueRaw), EPSILON)

  return withValue.map((p) => ({
    product: p.product,
    specs: p.specs,
    pillars: p.pillars,
    overall: round(p.overall),
    value: round((p.valueRaw / maxValue) * 100),
    // Pareto-optimal: nothing else is both no-more-expensive and better.
    onFrontier: !withValue.some(
      (other) =>
        other !== p && other.product.price <= p.product.price && other.overall > p.overall,
    ),
  }))
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function round(n: number, places = 1): number {
  const f = 10 ** places
  return Math.round(n * f) / f
}

/* ------------------------------------------------------------ best-in-set */

export type BestMap = Record<string, { bestIds: string[]; worstIds: string[]; spread: number }>

/**
 * For each spec, which of the compared products win and lose, plus how far
 * apart they are (0–100). `spread` drives the "differences only" filter and
 * the "biggest gaps" ordering.
 */
export function computeBest(category: Category, scored: ScoredProduct[]): BestMap {
  const map: BestMap = {}
  for (const def of category.specs) {
    const entries = scored
      .map((s) => ({ id: s.product.id, norm: s.specs[def.key]?.norm ?? null }))
      .filter((e): e is { id: string; norm: number } => e.norm !== null)

    if (!entries.length) {
      map[def.key] = { bestIds: [], worstIds: [], spread: 0 }
      continue
    }

    const max = Math.max(...entries.map((e) => e.norm))
    const min = Math.min(...entries.map((e) => e.norm))
    const spread = max - min

    map[def.key] = {
      // No winner when everything ties — highlighting all of them is noise.
      bestIds: spread < 0.5 ? [] : entries.filter((e) => e.norm >= max - 0.5).map((e) => e.id),
      worstIds: spread < 0.5 ? [] : entries.filter((e) => e.norm <= min + 0.5).map((e) => e.id),
      spread,
    }
  }
  return map
}

/** True when the compared products don't all share the same value. */
export function specDiffers(def: SpecDef, scored: ScoredProduct[]): boolean {
  const values = scored.map((s) => s.specs[def.key]?.raw ?? null)
  const first = JSON.stringify(values[0])
  return values.some((v) => JSON.stringify(v) !== first)
}

/* ---------------------------------------------------------------- verdicts */

function personaScore(persona: Persona, scored: ScoredProduct): number {
  return weightedMean(persona.weights, (id) => scored.pillars[id] ?? null)
}

/** Rank the selection against every persona and explain each result. */
export function computePersonaVerdicts(
  category: Category,
  scored: ScoredProduct[],
): PersonaVerdict[] {
  if (!scored.length) return []

  return category.personas.map((persona) => {
    const ranked = [...scored]
      .map((s) => ({ s, score: personaScore(persona, s) }))
      .sort((a, b) => b.score - a.score)

    const winner = ranked[0]
    const runnerUp = ranked[1]
    const margin = runnerUp ? round(winner.score - runnerUp.score) : 0

    return {
      persona,
      winner: winner.s,
      runnerUp: runnerUp?.s,
      margin,
      reason: explainPersonaWin(category, persona, winner.s, runnerUp?.s, margin),
    }
  })
}

function explainPersonaWin(
  category: Category,
  persona: Persona,
  winner: ScoredProduct,
  runnerUp: ScoredProduct | undefined,
  margin: number,
): string {
  if (!runnerUp) return `The only pick in this comparison.`

  // Only quote pillars this persona actually cares about. Without the weight
  // floor a huge gap on a barely-weighted pillar hijacks the sentence — the
  // photography verdict ends up citing raw CPU speed.
  const maxWeight = Math.max(...Object.values(persona.weights))
  const weighted = Object.entries(persona.weights)
    .filter(([, weight]) => weight >= maxWeight * 0.4)
    .map(([id, weight]) => ({
      id,
      weight,
      gap: (winner.pillars[id] ?? 0) - (runnerUp.pillars[id] ?? 0),
    }))
    .sort((a, b) => b.gap * b.weight - a.gap * a.weight)

  const top = weighted[0]
  const pillar = category.pillars.find((p) => p.id === top?.id)

  if (margin < 2) {
    return `Effectively tied with ${runnerUp.product.name} — pick on price or brand preference.`
  }
  if (pillar && top.gap > 3) {
    return `Leads ${runnerUp.product.name} by ${margin} pts, mostly on ${pillar.label.toLowerCase()} (+${round(top.gap)}).`
  }
  if (pillar && top.gap > 0) {
    return `Just ahead of ${runnerUp.product.name} — only ${round(top.gap)} pts of ${pillar.label.toLowerCase()} separates them.`
  }
  return `Wins on the supporting pillars — ${runnerUp.product.name} is level or better on ${pillar?.label.toLowerCase() ?? 'the headline metric'}.`
}

/* -------------------------------------------------------- head-to-head copy */

export interface Advantage {
  specKey: string
  label: string
  winnerValue: SpecValue
  loserValue: SpecValue
  /** Normalised gap, 0–100. */
  gap: number
}

/** The specs where `a` most clearly beats `b`, strongest first. */
export function advantagesOver(
  category: Category,
  a: ScoredProduct,
  b: ScoredProduct,
  limit = 4,
): Advantage[] {
  return category.specs
    .filter((def) => def.higherIsBetter !== null && !def.internal && !def.minor)
    .map((def) => {
      const an = a.specs[def.key]?.norm
      const bn = b.specs[def.key]?.norm
      if (an === null || an === undefined || bn === null || bn === undefined) return null
      const gap = an - bn
      if (gap <= 1) return null
      return {
        specKey: def.key,
        label: def.label,
        winnerValue: a.specs[def.key].raw,
        loserValue: b.specs[def.key].raw,
        gap: round(gap),
      }
    })
    .filter((x): x is Advantage => x !== null)
    .sort((x, y) => y.gap - x.gap)
    .slice(0, limit)
}

/** Pillar-level deltas between two products, largest lead first. */
export function pillarDeltas(
  category: Category,
  a: ScoredProduct,
  b: ScoredProduct,
): { pillar: string; label: string; delta: number }[] {
  return category.pillars
    .map((p) => ({
      pillar: p.id,
      label: p.label,
      delta: round((a.pillars[p.id] ?? 0) - (b.pillars[p.id] ?? 0)),
    }))
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
}

/** Default priorities: everything matters equally until the user says otherwise. */
export function defaultPriorities(category: Category): Record<string, number> {
  return Object.fromEntries(category.pillars.map((p) => [p.id, 5]))
}
