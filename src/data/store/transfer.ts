import type { Category, CategoryId } from '@/types'
import {
  OVERLAY_VERSION,
  TRANSFER_FORMAT,
  TRANSFER_VERSION,
  emptyOverlay,
  type CatalogueOverlay,
  type CatalogueTransfer,
} from './types'
import { validateProduct, type ValidationIssue } from './validate'

/**
 * Import and export of a user's catalogue.
 *
 * A catalogue you can't take with you isn't really yours, so everything the
 * user has changed round-trips through a plain JSON file: portable, diffable,
 * and reviewable before it's trusted.
 */

export function buildTransfer(
  overlays: Partial<Record<CategoryId, CatalogueOverlay>>,
): CatalogueTransfer {
  return {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    categories: overlays,
  }
}

export interface ImportReport {
  ok: boolean
  /** Overlays safe to apply, keyed by category. */
  overlays: Partial<Record<CategoryId, CatalogueOverlay>>
  added: number
  edited: number
  removed: number
  /** Everything rejected, with a reason the user can act on. */
  issues: (ValidationIssue & { category?: string; device?: string })[]
}

/**
 * Parse and validate an exported file.
 *
 * An import is untrusted input: it can be hand-edited, produced by a different
 * version, or simply the wrong file. Bad devices are dropped individually with
 * a reason rather than failing the whole import, so one typo doesn't cost the
 * user the other forty devices in the file.
 */
export function parseTransfer(
  json: string,
  categories: Category[],
  seedIdsFor: (categoryId: CategoryId) => string[],
): ImportReport {
  const report: ImportReport = {
    ok: false,
    overlays: {},
    added: 0,
    edited: 0,
    removed: 0,
    issues: [],
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    report.issues.push({ field: 'file', message: 'That file is not valid JSON.' })
    return report
  }

  if (typeof parsed !== 'object' || parsed === null) {
    report.issues.push({ field: 'file', message: 'That file is not a TechSpec catalogue.' })
    return report
  }

  const raw = parsed as Record<string, unknown>
  if (raw.format !== TRANSFER_FORMAT) {
    report.issues.push({
      field: 'format',
      message: 'That file is not a TechSpec catalogue export.',
    })
    return report
  }
  if (typeof raw.version !== 'number' || raw.version > TRANSFER_VERSION) {
    report.issues.push({
      field: 'version',
      message: `This file was made by a newer version of TechSpec (v${String(raw.version)}).`,
    })
    return report
  }

  const incoming = (raw.categories ?? {}) as Record<string, unknown>

  for (const category of categories) {
    const entry = incoming[category.id]
    if (typeof entry !== 'object' || entry === null) continue

    const overlayRaw = entry as Record<string, unknown>
    const overlay = emptyOverlay()
    const seedIds = seedIdsFor(category.id)
    const takenIds = new Set(seedIds)

    // --- added devices ------------------------------------------------
    if (Array.isArray(overlayRaw.added)) {
      for (const candidate of overlayRaw.added) {
        const result = validateProduct(category, candidate, {
          existingIds: [...takenIds],
        })
        if (result.ok) {
          overlay.added.push(result.product)
          takenIds.add(result.product.id)
          report.added += 1
        } else {
          const name =
            (candidate as { name?: string } | null)?.name ??
            (candidate as { id?: string } | null)?.id ??
            'unnamed device'
          for (const issue of result.issues) {
            report.issues.push({ ...issue, category: category.label, device: String(name) })
          }
        }
      }
    }

    // --- edits to seed devices ---------------------------------------
    if (typeof overlayRaw.edits === 'object' && overlayRaw.edits !== null) {
      const seedSet = new Set(seedIds)
      const nowYear = new Date().getFullYear()
      for (const [id, patch] of Object.entries(overlayRaw.edits as Record<string, unknown>)) {
        if (!seedSet.has(id)) {
          report.issues.push({
            field: 'edits',
            message: `Skipped an edit for "${id}" — no such device in this build.`,
            category: category.label,
          })
          continue
        }
        if (typeof patch !== 'object' || patch === null) continue

        const rawPatch = patch as Record<string, unknown>
        const next: CatalogueOverlay['edits'][string] = {}
        const issues: ValidationIssue[] = []
        const push = (field: string, message: string) => issues.push({ field, message })

        if ('name' in rawPatch) typeof rawPatch.name === 'string' ? (next.name = rawPatch.name.trim()) : push('name', 'Name must be text')
        if ('brand' in rawPatch) typeof rawPatch.brand === 'string' ? (next.brand = rawPatch.brand.trim()) : push('brand', 'Brand must be text')
        if ('tagline' in rawPatch) typeof rawPatch.tagline === 'string' ? (next.tagline = rawPatch.tagline) : push('tagline', 'Tagline must be text')
        if ('accent' in rawPatch) typeof rawPatch.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(rawPatch.accent) ? (next.accent = rawPatch.accent) : push('accent', 'Accent must be a hex colour like #7c5cff')

        if ('price' in rawPatch) typeof rawPatch.price === 'number' && Number.isFinite(rawPatch.price) && rawPatch.price > 0 ? (next.price = rawPatch.price) : push('price', 'Price must be a number above zero')
        if ('releaseYear' in rawPatch) typeof rawPatch.releaseYear === 'number' && Number.isInteger(rawPatch.releaseYear) && rawPatch.releaseYear >= 1990 && rawPatch.releaseYear <= nowYear + 2 ? (next.releaseYear = rawPatch.releaseYear) : push('releaseYear', `Release year must be between 1990 and ${nowYear + 2}`)
        if ('rating' in rawPatch) typeof rawPatch.rating === 'number' && Number.isFinite(rawPatch.rating) && rawPatch.rating >= 0 && rawPatch.rating <= 5 ? (next.rating = rawPatch.rating) : push('rating', 'Rating must be between 0 and 5')

        if ('specs' in rawPatch) {
          if (typeof rawPatch.specs !== 'object' || rawPatch.specs === null) {
            push('specs', 'Specs must be an object')
          } else {
            const specsNext: Record<string, SpecValue> = {}
            for (const [key, value] of Object.entries(rawPatch.specs as Record<string, unknown>)) {
              if (key === 'price' || key === 'releaseYear') continue
              const def = category.specs.find((s) => s.key === key)
              if (!def) {
                push(`specs.${key}`, `Unknown spec "${key}"`)
                continue
              }
              if (value === null) {
                specsNext[key] = null
                continue
              }
              switch (def.kind) {
                case 'number':
                  if (typeof value !== 'number' || !Number.isFinite(value)) push(`specs.${key}`, `${def.label} must be a number`)
                  else if (value < 0) push(`specs.${key}`, `${def.label} cannot be negative`)
                  else specsNext[key] = value
                  break
                case 'bool':
                  if (typeof value !== 'boolean') push(`specs.${key}`, `${def.label} must be yes or no`)
                  else specsNext[key] = value
                  break
                case 'enum':
                  if (typeof value !== 'string') push(`specs.${key}`, `${def.label} must be one of the listed options`)
                  else if (def.enumOrder && !def.enumOrder.includes(value)) push(`specs.${key}`, `${def.label}: "${value}" is not a known option`)
                  else specsNext[key] = value
                  break
                case 'text':
                  if (typeof value !== 'string') push(`specs.${key}`, `${def.label} must be text`)
                  else specsNext[key] = value
                  break
                default:
                  break
              }
            }
            if (Object.keys(specsNext).length) next.specs = specsNext
          }
        }

        if (issues.length) {
          for (const issue of issues) {
            report.issues.push({ ...issue, category: category.label, device: id })
          }
          continue
        }

        if (Object.keys(next).length === 0) continue
        overlay.edits[id] = next
        report.edited += 1
      }
    }

    // --- hidden seed devices -----------------------------------------
    if (Array.isArray(overlayRaw.removed)) {
      const seedSet = new Set(seedIds)
      overlay.removed = (overlayRaw.removed as unknown[])
        .filter((x): x is string => typeof x === 'string' && seedSet.has(x))
      report.removed += overlay.removed.length
    }

    overlay.version = OVERLAY_VERSION
    report.overlays[category.id] = overlay
  }

  report.ok = report.added + report.edited + report.removed > 0
  if (!report.ok && report.issues.length === 0) {
    report.issues.push({
      field: 'file',
      message: 'That export contained no catalogue changes.',
    })
  }

  return report
}

/** A single device as JSON, for sharing one entry rather than a whole catalogue. */
export function deviceToJson(product: unknown): string {
  return JSON.stringify(product, null, 2)
}
