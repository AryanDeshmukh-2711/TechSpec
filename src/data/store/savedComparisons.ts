import type { CategoryId } from '@/types'

/**
 * COMPARISON and COMPARISON_ITEM — from the research report's ER diagram:
 *
 *   USER       ||--o{ COMPARISON      : creates
 *   COMPARISON ||--|{ COMPARISON_ITEM : contains
 *   PRODUCT    ||--o{ COMPARISON_ITEM : appears_in
 *
 *   COMPARISON      { string id PK, string title, datetime created_at }
 *   COMPARISON_ITEM { string product_id FK, string comparison_id FK }
 *
 * The report assumes these live in Postgres behind a user account. There is no
 * backend, so they persist locally against the anonymous local profile — the
 * shape of the entity is the report's, only the storage engine differs.
 *
 * This is distinct from the automatic history in `personalisation/profile.ts`:
 * that records what you happened to open, this records what you deliberately
 * kept, with a title and your priority weights frozen alongside it.
 */

export const SAVED_VERSION = 1
const KEY = `techspec:saved-comparisons:v${SAVED_VERSION}`
const MAX_SAVED = 50

export interface ComparisonItem {
  productId: string
  /** Denormalised so a saved comparison still reads correctly if a device is
   *  later hidden or renamed in the user's catalogue. */
  productName: string
}

export interface SavedComparison {
  id: string
  title: string
  createdAt: number
  category: CategoryId
  items: ComparisonItem[]
  /** The weights in force when it was saved, so reopening restores the verdict. */
  priorities: Record<string, number>
  note?: string
}

export function newComparisonId(): string {
  // crypto.randomUUID is unavailable on insecure origins in some browsers.
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {
    // Fall through.
  }
  return `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/* ------------------------------------------------------------ persistence */

export function loadSaved(): SavedComparison[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { version?: number; items?: unknown }
    if (parsed?.version !== SAVED_VERSION || !Array.isArray(parsed.items)) return []
    return (parsed.items as SavedComparison[]).filter(
      (c) => c && typeof c.id === 'string' && Array.isArray(c.items),
    )
  } catch {
    return []
  }
}

export function persistSaved(items: SavedComparison[]): boolean {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: SAVED_VERSION, items: items.slice(0, MAX_SAVED) }),
    )
    return true
  } catch {
    return false
  }
}

export function clearSaved(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing to do.
  }
}

/* -------------------------------------------------------------- mutations */

/** Default title from the product names, e.g. "Legion Pro 7i vs Legion 5i". */
export function suggestTitle(names: string[]): string {
  if (names.length === 0) return 'Untitled comparison'
  if (names.length <= 3) return names.join(' vs ')
  return `${names.slice(0, 2).join(' vs ')} +${names.length - 2} more`
}

/** Same products in the same category counts as the same comparison. */
export function sameSelection(a: SavedComparison, ids: string[]): boolean {
  const left = [...a.items.map((i) => i.productId)].sort().join(',')
  return left === [...ids].sort().join(',')
}

export function saveComparison(
  existing: SavedComparison[],
  entry: SavedComparison,
): SavedComparison[] {
  // Re-saving the same set updates it in place rather than piling up copies.
  const ids = entry.items.map((i) => i.productId)
  const without = existing.filter(
    (c) => !(c.category === entry.category && sameSelection(c, ids)),
  )
  return [entry, ...without].slice(0, MAX_SAVED)
}

export function removeComparison(
  existing: SavedComparison[],
  id: string,
): SavedComparison[] {
  return existing.filter((c) => c.id !== id)
}

export function renameComparison(
  existing: SavedComparison[],
  id: string,
  title: string,
): SavedComparison[] {
  const trimmed = title.trim()
  if (!trimmed) return existing
  return existing.map((c) => (c.id === id ? { ...c, title: trimmed.slice(0, 120) } : c))
}

export function findBySelection(
  existing: SavedComparison[],
  category: CategoryId,
  ids: string[],
): SavedComparison | undefined {
  return existing.find((c) => c.category === category && sameSelection(c, ids))
}
