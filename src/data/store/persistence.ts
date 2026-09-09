import type { CategoryId } from '@/types'
import { OVERLAY_VERSION, emptyOverlay, type CatalogueOverlay } from './types'

/**
 * localStorage persistence, defensively.
 *
 * Storage is genuinely unreliable: private windows throw on write, quota is
 * finite and small, and anything already stored may have been written by an
 * older version of the app. Every path here degrades to "the user keeps
 * working with the seed catalogue" rather than throwing into a render.
 */

const PREFIX = 'techspec:catalogue'

export const overlayKey = (categoryId: CategoryId) => `${PREFIX}:${categoryId}:v${OVERLAY_VERSION}`

export type StorageStatus = 'ok' | 'unavailable' | 'quota' | 'corrupt'

export interface LoadResult {
  overlay: CatalogueOverlay
  status: StorageStatus
}

function storage(): Storage | null {
  try {
    const probe = '__techspec_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

/** Narrow unknown JSON into an overlay, discarding anything malformed. */
function coerceOverlay(value: unknown): CatalogueOverlay | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (raw.version !== OVERLAY_VERSION) return null

  const edits =
    typeof raw.edits === 'object' && raw.edits !== null
      ? (raw.edits as CatalogueOverlay['edits'])
      : {}
  const added = Array.isArray(raw.added) ? (raw.added as CatalogueOverlay['added']) : []
  const removed = Array.isArray(raw.removed)
    ? (raw.removed as unknown[]).filter((x): x is string => typeof x === 'string')
    : []

  return {
    version: OVERLAY_VERSION,
    edits,
    added,
    removed,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  }
}

export function loadOverlay(categoryId: CategoryId): LoadResult {
  const store = storage()
  if (!store) return { overlay: emptyOverlay(), status: 'unavailable' }

  try {
    const raw = store.getItem(overlayKey(categoryId))
    if (!raw) return { overlay: emptyOverlay(), status: 'ok' }

    const parsed = coerceOverlay(JSON.parse(raw))
    if (!parsed) {
      // Written by an older version, or hand-edited into nonsense. Keep the
      // bad value in place rather than deleting someone's data behind their
      // back — just don't use it.
      return { overlay: emptyOverlay(), status: 'corrupt' }
    }
    return { overlay: parsed, status: 'ok' }
  } catch {
    return { overlay: emptyOverlay(), status: 'corrupt' }
  }
}

export function saveOverlay(
  categoryId: CategoryId,
  overlay: CatalogueOverlay,
): StorageStatus {
  const store = storage()
  if (!store) return 'unavailable'

  try {
    store.setItem(
      overlayKey(categoryId),
      JSON.stringify({ ...overlay, updatedAt: Date.now() }),
    )
    return 'ok'
  } catch (error) {
    // QuotaExceededError is the realistic failure once someone imports a
    // large catalogue. Report it so the UI can say so instead of silently
    // dropping the change.
    const name = (error as { name?: string } | null)?.name ?? ''
    return name.includes('Quota') || name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ? 'quota'
      : 'unavailable'
  }
}

export function clearOverlay(categoryId: CategoryId): void {
  try {
    storage()?.removeItem(overlayKey(categoryId))
  } catch {
    // Nothing to do — the in-memory reset still applies for this session.
  }
}

/** Approximate bytes used by the catalogue, for the storage read-out. */
export function overlayFootprint(categoryIds: CategoryId[]): number {
  const store = storage()
  if (!store) return 0
  let bytes = 0
  for (const id of categoryIds) {
    try {
      bytes += (store.getItem(overlayKey(id)) ?? '').length
    } catch {
      // Skip anything unreadable.
    }
  }
  return bytes
}
