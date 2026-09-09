import type { Category, Product, SpecValue } from '@/types'

/**
 * Validation for user-supplied devices.
 *
 * Once people can author and import devices, the data-integrity guarantees the
 * test suite makes about the seed stop holding automatically. This is the same
 * contract enforced at runtime: a device that would silently score as zero, or
 * carry an enum value the scale doesn't know about, is rejected with a reason
 * the user can act on rather than accepted and quietly mis-ranked.
 */

export interface ValidationIssue {
  field: string
  message: string
}

export type ValidationResult =
  | { ok: true; product: Product }
  | { ok: false; issues: ValidationIssue[] }

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/** Validate one spec value against its definition. Returns null when fine. */
export function validateSpecValue(
  category: Category,
  key: string,
  value: SpecValue,
): ValidationIssue | null {
  const def = category.specs.find((s) => s.key === key)
  if (!def) return { field: `specs.${key}`, message: `Unknown spec "${key}"` }
  if (value === null) return null

  switch (def.kind) {
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { field: `specs.${key}`, message: `${def.label} must be a number` }
      }
      if (value < 0) {
        return { field: `specs.${key}`, message: `${def.label} cannot be negative` }
      }
      return null
    case 'bool':
      return typeof value === 'boolean'
        ? null
        : { field: `specs.${key}`, message: `${def.label} must be yes or no` }
    case 'enum':
      if (typeof value !== 'string') {
        return { field: `specs.${key}`, message: `${def.label} must be one of the listed options` }
      }
      if (def.enumOrder && !def.enumOrder.includes(value)) {
        return {
          field: `specs.${key}`,
          message: `${def.label}: "${value}" is not a known option`,
        }
      }
      return null
    case 'text':
      return typeof value === 'string'
        ? null
        : { field: `specs.${key}`, message: `${def.label} must be text` }
    default:
      return null
  }
}

const currentYear = () => new Date().getFullYear()

/**
 * Validate a whole device. `existingIds` guards against collisions; pass the
 * device's own id in `allowId` when editing so it doesn't collide with itself.
 */
export function validateProduct(
  category: Category,
  candidate: unknown,
  options: { existingIds?: string[]; allowId?: string } = {},
): ValidationResult {
  const issues: ValidationIssue[] = []

  if (typeof candidate !== 'object' || candidate === null) {
    return { ok: false, issues: [{ field: 'root', message: 'Device must be an object' }] }
  }

  const raw = candidate as Record<string, unknown>
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const brand = typeof raw.brand === 'string' ? raw.brand.trim() : ''

  if (!ID_PATTERN.test(id)) {
    issues.push({
      field: 'id',
      message: 'Id must be lowercase letters, numbers and hyphens (2–64 characters)',
    })
  } else if (
    options.existingIds &&
    id !== options.allowId &&
    options.existingIds.includes(id)
  ) {
    issues.push({ field: 'id', message: `Id "${id}" is already used in this category` })
  }

  if (!name) issues.push({ field: 'name', message: 'Name is required' })
  if (name.length > 80) issues.push({ field: 'name', message: 'Name is too long (max 80)' })
  if (!brand) issues.push({ field: 'brand', message: 'Brand is required' })

  const price = raw.price
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    issues.push({ field: 'price', message: 'Price must be a number above zero' })
  } else if (price > 1_000_000) {
    issues.push({ field: 'price', message: 'Price looks implausible' })
  }

  const year = raw.releaseYear
  if (typeof year !== 'number' || !Number.isInteger(year)) {
    issues.push({ field: 'releaseYear', message: 'Release year must be a whole number' })
  } else if (year < 1990 || year > currentYear() + 2) {
    issues.push({
      field: 'releaseYear',
      message: `Release year must be between 1990 and ${currentYear() + 2}`,
    })
  }

  const rating = raw.rating
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0 || rating > 5) {
    issues.push({ field: 'rating', message: 'Rating must be between 0 and 5' })
  }

  if (typeof raw.tagline !== 'string') {
    issues.push({ field: 'tagline', message: 'Tagline must be text' })
  }

  if (typeof raw.accent !== 'string' || !HEX_PATTERN.test(raw.accent)) {
    issues.push({ field: 'accent', message: 'Accent must be a hex colour like #7c5cff' })
  }

  if (raw.category !== category.id) {
    issues.push({
      field: 'category',
      message: `Device belongs to "${String(raw.category)}", not "${category.id}"`,
    })
  }

  const specs = raw.specs
  if (typeof specs !== 'object' || specs === null) {
    issues.push({ field: 'specs', message: 'Specs must be an object' })
  } else {
    for (const [key, value] of Object.entries(specs as Record<string, SpecValue>)) {
      // price and releaseYear are mirrored in automatically; ignore any copy.
      if (key === 'price' || key === 'releaseYear') continue
      const issue = validateSpecValue(category, key, value)
      if (issue) issues.push(issue)
    }
  }

  if (issues.length) return { ok: false, issues }

  return {
    ok: true,
    product: {
      id,
      name,
      brand,
      category: category.id,
      price: price as number,
      releaseYear: year as number,
      rating: rating as number,
      tagline: raw.tagline as string,
      accent: raw.accent as string,
      specs: { ...(specs as Record<string, SpecValue>) },
    },
  }
}

/**
 * How complete a device is against its category schema. Surfaced in the editor
 * so a half-filled device is obviously half-filled rather than quietly
 * scoring badly on every pillar that depends on the blanks.
 */
export function completeness(
  category: Category,
  specs: Record<string, SpecValue>,
): { filled: number; total: number; missingWeighted: string[] } {
  const rankable = category.specs.filter((s) => s.higherIsBetter !== null)
  const filled = rankable.filter(
    (s) => specs[s.key] !== undefined && specs[s.key] !== null,
  ).length

  const weighted = new Set(category.pillars.flatMap((p) => Object.keys(p.weights)))
  const missingWeighted = [...weighted]
    .filter((key) => key !== 'price' && key !== 'releaseYear')
    .filter((key) => specs[key] === undefined || specs[key] === null)
    .map((key) => category.specs.find((s) => s.key === key)?.label ?? key)

  return { filled, total: rankable.length, missingWeighted }
}
