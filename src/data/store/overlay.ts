import type { Product } from '@/types'
import type { CatalogueOverlay, ProductPatch } from './types'

/**
 * Compose the seed catalogue with a user's overlay.
 *
 * Order matters: edits apply before hydration, so changing a device's price
 * also updates the mirrored `specs.price` the scoring engine reads.
 */

/** Mirror commercial fields into the spec map so they can be scored. */
export function hydrate(product: Product): Product {
  return {
    ...product,
    specs: {
      ...product.specs,
      price: product.price,
      releaseYear: product.releaseYear,
    },
  }
}

export function applyPatch(product: Product, patch: ProductPatch): Product {
  return hydrate({
    ...product,
    name: patch.name ?? product.name,
    brand: patch.brand ?? product.brand,
    price: patch.price ?? product.price,
    releaseYear: patch.releaseYear ?? product.releaseYear,
    rating: patch.rating ?? product.rating,
    tagline: patch.tagline ?? product.tagline,
    accent: patch.accent ?? product.accent,
    specs: { ...product.specs, ...(patch.specs ?? {}) },
  })
}

export function resolveCatalogue(seed: Product[], overlay: CatalogueOverlay): Product[] {
  const removed = new Set(overlay.removed)

  const fromSeed = seed
    .filter((product) => !removed.has(product.id))
    .map((product) => {
      const patch = overlay.edits[product.id]
      return patch ? applyPatch(product, patch) : hydrate(product)
    })

  // User-authored devices can't shadow a seed id; the store prevents it, but
  // a hand-edited import might try.
  const seedIds = new Set(fromSeed.map((p) => p.id))
  const added = overlay.added.filter((p) => !seedIds.has(p.id)).map(hydrate)

  return [...fromSeed, ...added]
}

/**
 * Reduce a full product back to the fields that actually differ from seed, so
 * an edit of one number doesn't persist a copy of the whole device.
 */
export function diffAgainstSeed(seed: Product, edited: Product): ProductPatch {
  const patch: ProductPatch = {}

  if (edited.name !== seed.name) patch.name = edited.name
  if (edited.brand !== seed.brand) patch.brand = edited.brand
  if (edited.price !== seed.price) patch.price = edited.price
  if (edited.releaseYear !== seed.releaseYear) patch.releaseYear = edited.releaseYear
  if (edited.rating !== seed.rating) patch.rating = edited.rating
  if (edited.tagline !== seed.tagline) patch.tagline = edited.tagline
  if (edited.accent !== seed.accent) patch.accent = edited.accent

  const specs: Record<string, Product['specs'][string]> = {}
  const keys = new Set([...Object.keys(seed.specs), ...Object.keys(edited.specs)])
  for (const key of keys) {
    if (key === 'price' || key === 'releaseYear') continue
    const before = seed.specs[key] ?? null
    const after = edited.specs[key] ?? null
    if (before !== after) specs[key] = after
  }
  if (Object.keys(specs).length) patch.specs = specs

  return patch
}

/** True when a patch would change nothing — used to drop no-op edits. */
export function isEmptyPatch(patch: ProductPatch): boolean {
  return Object.keys(patch).length === 0
}
