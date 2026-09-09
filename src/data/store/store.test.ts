import { beforeEach, describe, expect, it } from 'vitest'
import type { Product } from '@/types'
import { testCategory, testCatalogue, byId } from '@/lib/__fixtures__/category'
import { applyPatch, diffAgainstSeed, hydrate, isEmptyPatch, resolveCatalogue } from './overlay'
import { emptyOverlay, overlayStats, isOverlayEmpty, TRANSFER_FORMAT } from './types'
import { clearOverlay, loadOverlay, saveOverlay } from './persistence'
import { completeness, slugify, validateProduct, validateSpecValue } from './validate'
import { buildTransfer, parseTransfer } from './transfer'

const seedIds = () => testCatalogue.map((p) => p.id)

const device = (overrides: Partial<Product> = {}): Product => ({
  id: 'my-widget',
  name: 'My Widget',
  brand: 'Homebrew',
  category: 'mobiles',
  price: 300,
  releaseYear: 2025,
  rating: 4,
  tagline: 'A device I added myself.',
  accent: '#7c5cff',
  specs: { speed: 150, weight: 250, flat: 7, tier: 'Silver', wireless: true },
  ...overrides,
})

describe('hydrate', () => {
  it('mirrors commercial fields into the spec map', () => {
    const result = hydrate(device({ price: 499, releaseYear: 2024 }))
    expect(result.specs.price).toBe(499)
    expect(result.specs.releaseYear).toBe(2024)
  })
})

describe('resolveCatalogue', () => {
  it('returns the seed untouched for an empty overlay', () => {
    const resolved = resolveCatalogue(testCatalogue, emptyOverlay())
    expect(resolved.map((p) => p.id)).toEqual(seedIds())
  })

  it('applies edits over the seed', () => {
    const resolved = resolveCatalogue(testCatalogue, {
      ...emptyOverlay(),
      edits: { slow: { price: 111, specs: { speed: 999 } } },
    })
    const slow = resolved.find((p) => p.id === 'slow')!
    expect(slow.price).toBe(111)
    expect(slow.specs.speed).toBe(999)
    // Untouched fields still come from seed.
    expect(slow.brand).toBe('Acme')
  })

  it('re-mirrors an edited price into the spec map so scoring sees it', () => {
    const resolved = resolveCatalogue(testCatalogue, {
      ...emptyOverlay(),
      edits: { slow: { price: 111 } },
    })
    expect(resolved.find((p) => p.id === 'slow')!.specs.price).toBe(111)
  })

  it('hides removed seed devices', () => {
    const resolved = resolveCatalogue(testCatalogue, { ...emptyOverlay(), removed: ['dud'] })
    expect(resolved.map((p) => p.id)).not.toContain('dud')
    expect(resolved).toHaveLength(testCatalogue.length - 1)
  })

  it('appends user-authored devices', () => {
    const resolved = resolveCatalogue(testCatalogue, {
      ...emptyOverlay(),
      added: [device()],
    })
    expect(resolved.map((p) => p.id)).toContain('my-widget')
    expect(resolved.find((p) => p.id === 'my-widget')!.specs.price).toBe(300)
  })

  it('never lets an added device shadow a seed id', () => {
    const resolved = resolveCatalogue(testCatalogue, {
      ...emptyOverlay(),
      added: [device({ id: 'slow', name: 'Impostor' })],
    })
    expect(resolved.filter((p) => p.id === 'slow')).toHaveLength(1)
    expect(resolved.find((p) => p.id === 'slow')!.name).toBe('SLOW')
  })

  it('lets a removed seed id be reused by an added device', () => {
    const resolved = resolveCatalogue(testCatalogue, {
      ...emptyOverlay(),
      removed: ['slow'],
      added: [device({ id: 'slow', name: 'Replacement' })],
    })
    expect(resolved.find((p) => p.id === 'slow')!.name).toBe('Replacement')
  })
})

describe('diffAgainstSeed', () => {
  it('records only what actually changed', () => {
    const seed = byId('slow')
    const edited = { ...seed, price: 250, specs: { ...seed.specs, speed: 140 } }
    const patch = diffAgainstSeed(seed, edited)
    expect(patch).toEqual({ price: 250, specs: { speed: 140 } })
  })

  it('is empty when nothing changed', () => {
    const seed = byId('slow')
    expect(isEmptyPatch(diffAgainstSeed(seed, { ...seed }))).toBe(true)
  })

  it('ignores the mirrored commercial specs', () => {
    const seed = byId('slow')
    const edited = applyPatch(seed, { price: 999 })
    const patch = diffAgainstSeed(seed, edited)
    // price is a real change; specs.price is a mirror and must not be stored.
    expect(patch.price).toBe(999)
    expect(patch.specs).toBeUndefined()
  })

  it('records a spec being cleared to null', () => {
    const seed = byId('mid')
    const edited = { ...seed, specs: { ...seed.specs, sparse: null } }
    expect(diffAgainstSeed(seed, edited).specs).toEqual({ sparse: null })
  })
})

describe('validateProduct', () => {
  it('accepts a well-formed device', () => {
    const result = validateProduct(testCategory, device())
    expect(result.ok).toBe(true)
  })

  it.each([
    ['id', { id: 'Not A Slug' }],
    ['name', { name: '' }],
    ['brand', { brand: '  ' }],
    ['price', { price: 0 }],
    ['price', { price: -5 }],
    ['rating', { rating: 9 }],
    ['releaseYear', { releaseYear: 1200 }],
    ['accent', { accent: 'purple' }],
  ])('rejects a bad %s', (field, patch) => {
    const result = validateProduct(testCategory, device(patch as Partial<Product>))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.some((i) => i.field === field)).toBe(true)
  })

  it('rejects a duplicate id', () => {
    const result = validateProduct(testCategory, device({ id: 'slow' }), {
      existingIds: seedIds(),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].message).toMatch(/already used/i)
  })

  it('allows a device to keep its own id while editing', () => {
    const result = validateProduct(testCategory, device({ id: 'slow', name: 'Renamed' }), {
      existingIds: seedIds(),
      allowId: 'slow',
    })
    expect(result.ok).toBe(true)
  })

  it('rejects an enum value the scale does not know', () => {
    const result = validateProduct(testCategory, device({ specs: { tier: 'Platinum' } }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].message).toMatch(/not a known option/i)
  })

  it('rejects a spec of the wrong type', () => {
    const result = validateProduct(
      testCategory,
      device({ specs: { speed: 'fast' as unknown as number } }),
    )
    expect(result.ok).toBe(false)
  })

  it('rejects an unknown spec key', () => {
    const result = validateProduct(testCategory, device({ specs: { nonsense: 1 } }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].message).toMatch(/unknown spec/i)
  })

  it('rejects a device filed under the wrong category', () => {
    const result = validateProduct(testCategory, device({ category: 'laptops' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.some((i) => i.field === 'category')).toBe(true)
  })

  it('reports every problem at once rather than the first', () => {
    const result = validateProduct(testCategory, device({ name: '', brand: '', price: -1 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateSpecValue', () => {
  it('accepts null as "not reported"', () => {
    expect(validateSpecValue(testCategory, 'speed', null)).toBeNull()
  })

  it('rejects a negative number', () => {
    expect(validateSpecValue(testCategory, 'speed', -1)).not.toBeNull()
  })
})

describe('completeness', () => {
  it('counts filled rankable specs and names missing weighted ones', () => {
    const result = completeness(testCategory, { speed: 100 })
    expect(result.filled).toBe(1)
    expect(result.total).toBeGreaterThan(1)
    expect(result.missingWeighted).toContain('Weight')
  })
})

describe('slugify', () => {
  it('produces a valid id from a product name', () => {
    expect(slugify('Galaxy S25 Ultra!')).toBe('galaxy-s25-ultra')
    expect(slugify('  --Pixel 9a--  ')).toBe('pixel-9a')
  })
})

describe('transfer', () => {
  const seedLookup = () => seedIds()

  it('round-trips an overlay through export and import', () => {
    const overlay = {
      ...emptyOverlay(),
      edits: { slow: { price: 150 } },
      added: [device()],
      removed: ['dud'],
    }
    const json = JSON.stringify(buildTransfer({ mobiles: overlay }))
    const report = parseTransfer(json, [testCategory], seedLookup)

    expect(report.ok).toBe(true)
    expect(report.added).toBe(1)
    expect(report.edited).toBe(1)
    expect(report.removed).toBe(1)
    expect(report.overlays.mobiles?.added[0].id).toBe('my-widget')
  })

  it('rejects a file that is not JSON', () => {
    const report = parseTransfer('{not json', [testCategory], seedLookup)
    expect(report.ok).toBe(false)
    expect(report.issues[0].message).toMatch(/not valid JSON/i)
  })

  it('rejects a file that is not a TechSpec export', () => {
    const report = parseTransfer('{"hello":"world"}', [testCategory], seedLookup)
    expect(report.ok).toBe(false)
    expect(report.issues[0].message).toMatch(/not a TechSpec catalogue/i)
  })

  it('refuses a file from a newer version', () => {
    const json = JSON.stringify({ format: TRANSFER_FORMAT, version: 99, categories: {} })
    const report = parseTransfer(json, [testCategory], seedLookup)
    expect(report.ok).toBe(false)
    expect(report.issues[0].message).toMatch(/newer version/i)
  })

  it('drops one bad device without losing the good ones', () => {
    const overlay = {
      ...emptyOverlay(),
      added: [device(), device({ id: 'broken', price: -10 })],
    }
    const json = JSON.stringify(buildTransfer({ mobiles: overlay }))
    const report = parseTransfer(json, [testCategory], seedLookup)

    expect(report.added).toBe(1)
    expect(report.overlays.mobiles?.added.map((p) => p.id)).toEqual(['my-widget'])
    // The rejection names the offending device so the user can fix it.
    expect(report.issues[0].device).toBe('My Widget')
    expect(report.issues[0].field).toBe('price')
  })

  it('skips edits for devices that no longer exist in this build', () => {
    const overlay = { ...emptyOverlay(), edits: { 'ghost-device': { price: 1 } } }
    const json = JSON.stringify(buildTransfer({ mobiles: overlay }))
    const report = parseTransfer(json, [testCategory], seedLookup)
    expect(report.edited).toBe(0)
    expect(report.issues[0].message).toMatch(/no such device/i)
  })
})

describe('persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns an empty overlay when nothing is stored', () => {
    const result = loadOverlay('mobiles')
    expect(isOverlayEmpty(result.overlay)).toBe(true)
    expect(result.status).toBe('ok')
  })

  it('round-trips an overlay', () => {
    const overlay = { ...emptyOverlay(), removed: ['slow'] }
    expect(saveOverlay('mobiles', overlay)).toBe('ok')
    expect(loadOverlay('mobiles').overlay.removed).toEqual(['slow'])
  })

  it('reports corruption instead of throwing', () => {
    window.localStorage.setItem('techspec:catalogue:mobiles:v1', 'not json at all')
    const result = loadOverlay('mobiles')
    expect(result.status).toBe('corrupt')
    expect(isOverlayEmpty(result.overlay)).toBe(true)
  })

  it('ignores an overlay written by a different version', () => {
    window.localStorage.setItem(
      'techspec:catalogue:mobiles:v1',
      JSON.stringify({ version: 99, edits: {}, added: [], removed: [] }),
    )
    expect(loadOverlay('mobiles').status).toBe('corrupt')
  })

  it('clears an overlay', () => {
    saveOverlay('mobiles', { ...emptyOverlay(), removed: ['slow'] })
    clearOverlay('mobiles')
    expect(isOverlayEmpty(loadOverlay('mobiles').overlay)).toBe(true)
  })
})

describe('overlayStats', () => {
  it('counts each kind of change', () => {
    const stats = overlayStats({
      ...emptyOverlay(),
      edits: { a: {}, b: {} },
      added: [device()],
      removed: ['x'],
    })
    expect(stats).toEqual({ edited: 2, added: 1, removed: 1, total: 4 })
  })
})
