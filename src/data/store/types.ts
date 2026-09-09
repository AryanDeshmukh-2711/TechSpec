import type { CategoryId, Product, SpecValue } from '@/types'

/**
 * The catalogue is no longer a fixture.
 *
 * Bundled products are a *seed*, not the truth. Everything a user changes is
 * kept as an overlay on top of that seed rather than a full copy, which means
 * a future seed update still reaches them: they keep their edits, and inherit
 * corrections to everything they never touched.
 */

export interface ProductPatch {
  name?: string
  brand?: string
  price?: number
  releaseYear?: number
  rating?: number
  tagline?: string
  accent?: string
  /** Sparse: only the specs the user actually changed. */
  specs?: Record<string, SpecValue>
}

export interface CatalogueOverlay {
  version: number
  /** Seed product id → the fields the user overrode. */
  edits: Record<string, ProductPatch>
  /** Devices the user authored from scratch. */
  added: Product[]
  /** Seed product ids the user hid. */
  removed: string[]
  updatedAt: number
}

export const OVERLAY_VERSION = 1

export function emptyOverlay(): CatalogueOverlay {
  return { version: OVERLAY_VERSION, edits: {}, added: [], removed: [], updatedAt: 0 }
}

export function isOverlayEmpty(overlay: CatalogueOverlay): boolean {
  return (
    Object.keys(overlay.edits).length === 0 &&
    overlay.added.length === 0 &&
    overlay.removed.length === 0
  )
}

/** How much of a category the user has made their own. */
export interface OverlayStats {
  edited: number
  added: number
  removed: number
  total: number
}

export function overlayStats(overlay: CatalogueOverlay): OverlayStats {
  return {
    edited: Object.keys(overlay.edits).length,
    added: overlay.added.length,
    removed: overlay.removed.length,
    total:
      Object.keys(overlay.edits).length + overlay.added.length + overlay.removed.length,
  }
}

/* ------------------------------------------------------------------ export */

export const TRANSFER_FORMAT = 'techspec/catalogue'
export const TRANSFER_VERSION = 1

export interface CatalogueTransfer {
  format: typeof TRANSFER_FORMAT
  version: number
  exportedAt: string
  categories: Partial<Record<CategoryId, CatalogueOverlay>>
}
