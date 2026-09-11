import type { CategoryId, Product } from '@/types'

/**
 * What TechSpec remembers about you.
 *
 * Deliberately small and entirely local: no account, no network, no identifier.
 * It exists so the app stops asking the same questions twice — your priorities
 * for phones survive until you change them, and the home screen leads with the
 * things you actually look at.
 */

export const PROFILE_VERSION = 2
const PROFILE_KEY = `techspec:profile:v${PROFILE_VERSION}`

const MAX_VIEWS = 40
const MAX_COMPARISONS = 12

export interface ViewEvent {
  id: string
  category: CategoryId
  at: number
}

export interface ComparisonEvent {
  category: CategoryId
  ids: string[]
  names: string[]
  at: number
}

export interface UserProfile {
  version: number
  /** Remembered slider weights, per category. */
  priorities: Partial<Record<CategoryId, Record<string, number>>>
  /** Persona presets the user has loaded, by id, with a running count. */
  personaUse: Record<string, number>
  viewed: ViewEvent[]
  comparisons: ComparisonEvent[]
  categoryUse: Partial<Record<CategoryId, number>>
  /** Set once the user has been through the first-run explainer. */
  onboarded: boolean
  createdAt: number
}

export function emptyProfile(): UserProfile {
  return {
    version: PROFILE_VERSION,
    priorities: {},
    personaUse: {},
    viewed: [],
    comparisons: [],
    categoryUse: {},
    onboarded: false,
    createdAt: Date.now(),
  }
}

/* ------------------------------------------------------------ persistence */

export function loadProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (!raw) return emptyProfile()
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    if (parsed?.version !== PROFILE_VERSION) return emptyProfile()
    return { ...emptyProfile(), ...parsed, version: PROFILE_VERSION }
  } catch {
    // Private browsing, cleared storage, or a hand-edited value. Starting
    // fresh is always safe here — nothing in the profile is irreplaceable.
    return emptyProfile()
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Preferences simply won't survive the session.
  }
}

export function clearProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_KEY)
  } catch {
    // Nothing to do.
  }
}

/* ---------------------------------------------------------------- updates */

export function recordView(profile: UserProfile, product: Product): UserProfile {
  const viewed = [
    { id: product.id, category: product.category, at: Date.now() },
    ...profile.viewed.filter((v) => v.id !== product.id),
  ].slice(0, MAX_VIEWS)

  return {
    ...profile,
    viewed,
    categoryUse: {
      ...profile.categoryUse,
      [product.category]: (profile.categoryUse[product.category] ?? 0) + 1,
    },
  }
}

export function recordComparison(
  profile: UserProfile,
  category: CategoryId,
  products: Product[],
): UserProfile {
  const ids = products.map((p) => p.id)
  const key = ids.join(',')
  const comparisons = [
    { category, ids, names: products.map((p) => p.name), at: Date.now() },
    ...profile.comparisons.filter((c) => c.ids.join(',') !== key),
  ].slice(0, MAX_COMPARISONS)

  return {
    ...profile,
    comparisons,
    categoryUse: {
      ...profile.categoryUse,
      [category]: (profile.categoryUse[category] ?? 0) + 1,
    },
  }
}

/**
 * Drop a category's remembered weights.
 *
 * A neutral setting is the absence of a preference, not a preference worth
 * storing — so resetting the sliders has to remove the entry rather than
 * overwrite it, otherwise the old weights come back on the next visit.
 */
export function forgetPriorities(profile: UserProfile, category: CategoryId): UserProfile {
  if (!profile.priorities[category]) return profile
  const priorities = { ...profile.priorities }
  delete priorities[category]
  return { ...profile, priorities }
}

export function rememberPriorities(
  profile: UserProfile,
  category: CategoryId,
  priorities: Record<string, number>,
): UserProfile {
  return { ...profile, priorities: { ...profile.priorities, [category]: priorities } }
}

export function recordPersona(profile: UserProfile, personaId: string): UserProfile {
  return {
    ...profile,
    personaUse: { ...profile.personaUse, [personaId]: (profile.personaUse[personaId] ?? 0) + 1 },
  }
}

/* -------------------------------------------------------------- inference */

/**
 * Brand interest, decayed by age so a phase six months ago doesn't outweigh
 * what you looked at yesterday. Half-life is two weeks.
 */
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000

export function brandAffinity(
  profile: UserProfile,
  lookup: (id: string) => Product | undefined,
): Record<string, number> {
  const now = Date.now()
  const scores: Record<string, number> = {}

  for (const view of profile.viewed) {
    const product = lookup(view.id)
    if (!product) continue
    const weight = Math.pow(0.5, (now - view.at) / HALF_LIFE_MS)
    scores[product.brand] = (scores[product.brand] ?? 0) + weight
  }

  return scores
}

/** Categories ordered by how much the user actually uses them. */
export function rankCategories(
  profile: UserProfile,
  all: CategoryId[],
): CategoryId[] {
  return [...all].sort((a, b) => (profile.categoryUse[b] ?? 0) - (profile.categoryUse[a] ?? 0))
}

export function favouritePersona(profile: UserProfile): string | null {
  const entries = Object.entries(profile.personaUse)
  if (!entries.length) return null
  return entries.sort(([, a], [, b]) => b - a)[0][0]
}

export interface Suggestion {
  category: CategoryId
  ids: string[]
  title: string
  reason: string
}

/**
 * Suggested matchups built from what the user has actually done.
 *
 * Only ever suggests from products that exist in the resolved catalogue, and
 * says *why* it is suggesting — a recommendation you can't interrogate is the
 * thing this whole product is arguing against.
 */
export function suggestMatchups(
  profile: UserProfile,
  catalogueFor: (category: CategoryId) => Product[],
  limit = 3,
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const seen = new Set(profile.comparisons.map((c) => [...c.ids].sort().join(',')))

  // 1. Products viewed but never actually compared against anything.
  const byCategory = new Map<CategoryId, Product[]>()
  for (const view of profile.viewed) {
    const product = catalogueFor(view.category).find((p) => p.id === view.id)
    if (!product) continue
    const list = byCategory.get(view.category) ?? []
    if (list.length < 4) list.push(product)
    byCategory.set(view.category, list)
  }

  for (const [category, products] of byCategory) {
    if (products.length < 2) continue
    const ids = products.slice(0, 3).map((p) => p.id)
    if (seen.has([...ids].sort().join(','))) continue
    suggestions.push({
      category,
      ids,
      title: products.slice(0, 3).map((p) => p.name).join(' vs '),
      reason: 'You looked at these but never put them side by side',
    })
  }

  // 2. Rivals for the most recent comparison's winner, by price band.
  const recent = profile.comparisons[0]
  if (recent) {
    const catalogue = catalogueFor(recent.category)
    const anchor = catalogue.find((p) => p.id === recent.ids[0])
    if (anchor) {
      const rivals = catalogue
        .filter((p) => p.id !== anchor.id && !recent.ids.includes(p.id))
        .filter((p) => Math.abs(p.price - anchor.price) / Math.max(anchor.price, 1) < 0.25)
        .slice(0, 2)
      if (rivals.length) {
        const ids = [anchor.id, ...rivals.map((r) => r.id)]
        if (!seen.has([...ids].sort().join(','))) {
          suggestions.push({
            category: recent.category,
            ids,
            title: `${anchor.name} vs its price rivals`,
            reason: `Within 25% of what ${anchor.name} costs`,
          })
        }
      }
    }
  }

  return suggestions.slice(0, limit)
}

export function hasHistory(profile: UserProfile): boolean {
  return profile.viewed.length > 0 || profile.comparisons.length > 0
}
