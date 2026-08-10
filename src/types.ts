/**
 * Core domain types.
 *
 * The whole app is category-agnostic: a `Category` carries its own spec
 * schema, its own radar pillars and its own personas, so adding "drones" or
 * "monitors" later means adding data, not code.
 */

export type CategoryId =
  | 'mobiles'
  | 'laptops'
  | 'tablets'
  | 'smartwatches'
  | 'headphones'
  | 'cameras'

export type SpecGroupId =
  | 'display'
  | 'performance'
  | 'battery'
  | 'camera'
  | 'storage'
  | 'build'
  | 'connectivity'
  | 'price'
  // Category-specific groups — watches and headphones need their own shelves.
  | 'health'
  | 'sound'
  | 'features'

export type SpecValue = number | string | boolean | null

/** How a spec is rendered and whether it can be ranked. */
export type SpecKind = 'number' | 'text' | 'bool' | 'enum'

export interface SpecDef {
  key: string
  label: string
  group: SpecGroupId
  kind: SpecKind
  /** Suffix appended in the table, e.g. "Hz", "g", "mAh". */
  unit?: string
  /**
   * `true`  → bigger wins (RAM, nits)
   * `false` → smaller wins (weight, price, thickness)
   * `null`  → informational only, never ranked or bar-charted
   */
  higherIsBetter: boolean | null
  /**
   * Ordered best→worst for `enum` specs. Position drives the score, so
   * ["Wi-Fi 7", "Wi-Fi 6E", "Wi-Fi 6"] scores Wi-Fi 7 at 100.
   */
  enumOrder?: string[]
  /** Decimal places when formatting numbers. */
  precision?: number
  /** Special rendering: money, or a bare year with no thousands separator. */
  format?: 'currency' | 'year'
  /** Plain-English explanation surfaced on hover/tap. */
  hint?: string
  /** Hide from the spec table but keep for scoring (raw benchmark inputs). */
  internal?: boolean
  /**
   * Still shown and ranked in the table, but never quoted as a reason one
   * product beats another — release year isn't a buying advantage.
   */
  minor?: boolean
  /** Render a proportional bar next to the value in the spec table. */
  bar?: boolean
}

export interface Pillar {
  id: string
  label: string
  /** Short label for the radar axis on narrow screens. */
  short: string
  /** Spec key → relative weight within this pillar. */
  weights: Record<string, number>
  hint: string
}

export interface Persona {
  id: string
  label: string
  /** lucide icon name, resolved through `components/ui/Icon`. */
  icon: string
  blurb: string
  /** Pillar id → weight. Normalised at scoring time. */
  weights: Record<string, number>
}

/** A quick one-tap filter in the picker, e.g. "120Hz+" or "Under $600". */
export interface QuickFilter {
  id: string
  label: string
  test: (product: Product) => boolean
}

export interface Category {
  id: CategoryId
  label: string
  /** "phone", "watch" — never derived, because "watchs" is not a word. */
  singular: string
  plural: string
  /** lucide icon name. */
  icon: string
  blurb: string
  specs: SpecDef[]
  pillars: Pillar[]
  personas: Persona[]
  quickFilters: QuickFilter[]
  /** Groups shown, in order. Categories opt out of irrelevant groups. */
  groupOrder: SpecGroupId[]
  /** Spec keys surfaced on the product card in the picker. */
  cardSpecs: string[]
  /** Spec keys surfaced in the sticky comparison header. */
  headlineSpecs: string[]
}

export interface Product {
  id: string
  name: string
  brand: string
  category: CategoryId
  /** USD, used for the price axis and value index. */
  price: number
  releaseYear: number
  /** Editorial score out of 5 — shown, never used for ranking specs. */
  rating: number
  tagline: string
  /** Hex accent used by the generated device artwork. */
  accent: string
  specs: Record<string, SpecValue>
}

/* ---------------------------------------------------------------- scoring */

/** A spec value plus its 0–100 position within the category corpus. */
export interface NormalisedSpec {
  raw: SpecValue
  /** null when the spec is informational or missing. */
  norm: number | null
}

export interface ScoredProduct {
  product: Product
  /** Spec key → normalised value. */
  specs: Record<string, NormalisedSpec>
  /** Pillar id → 0–100. */
  pillars: Record<string, number>
  /** 0–100, weighted by the user's current priorities. */
  overall: number
  /** Performance-per-dollar, rebased so the category median sits at 50. */
  value: number
  /** True when no other product is both cheaper and better. */
  onFrontier: boolean
}

export interface PersonaVerdict {
  persona: Persona
  winner: ScoredProduct
  runnerUp?: ScoredProduct
  /** Score gap between winner and runner-up. */
  margin: number
  /** Generated one-line justification. */
  reason: string
}

/* ------------------------------------------------------------- app state */

export type Screen = 'home' | 'picker' | 'compare'

export type SortKey =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'score-desc'
  | 'newest'
  | 'rating-desc'

export interface PickerFilters {
  query: string
  brands: string[]
  priceMin: number | null
  priceMax: number | null
  quickFilters: string[]
  sort: SortKey
}

export type LoadState = 'idle' | 'loading' | 'ready' | 'error'
