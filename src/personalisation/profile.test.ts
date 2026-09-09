import { beforeEach, describe, expect, it } from 'vitest'
import type { Product } from '@/types'
import { byId, testCatalogue } from '@/lib/__fixtures__/category'
import {
  brandAffinity,
  clearProfile,
  emptyProfile,
  favouritePersona,
  hasHistory,
  loadProfile,
  rankCategories,
  recordComparison,
  recordPersona,
  recordView,
  rememberPriorities,
  saveProfile,
  suggestMatchups,
} from './profile'

const lookup = (id: string): Product | undefined => testCatalogue.find((p) => p.id === id)
const catalogueFor = () => testCatalogue

describe('recordView', () => {
  it('puts the newest view first and de-duplicates', () => {
    let profile = emptyProfile()
    profile = recordView(profile, byId('slow'))
    profile = recordView(profile, byId('fast'))
    profile = recordView(profile, byId('slow'))

    expect(profile.viewed.map((v) => v.id)).toEqual(['slow', 'fast'])
  })

  it('counts category usage', () => {
    let profile = emptyProfile()
    profile = recordView(profile, byId('slow'))
    profile = recordView(profile, byId('fast'))
    expect(profile.categoryUse.mobiles).toBe(2)
  })

  it('caps history so storage cannot grow without bound', () => {
    let profile = emptyProfile()
    for (let i = 0; i < 60; i += 1) {
      profile = recordView(profile, { ...byId('slow'), id: `device-${i}` })
    }
    expect(profile.viewed.length).toBeLessThanOrEqual(40)
  })
})

describe('recordComparison', () => {
  it('stores ids and names, newest first', () => {
    const profile = recordComparison(emptyProfile(), 'mobiles', [byId('slow'), byId('fast')])
    expect(profile.comparisons[0].ids).toEqual(['slow', 'fast'])
    expect(profile.comparisons[0].names).toEqual(['SLOW', 'FAST'])
  })

  it('de-duplicates an identical matchup', () => {
    let profile = emptyProfile()
    profile = recordComparison(profile, 'mobiles', [byId('slow'), byId('fast')])
    profile = recordComparison(profile, 'mobiles', [byId('slow'), byId('fast')])
    expect(profile.comparisons).toHaveLength(1)
  })
})

describe('rememberPriorities', () => {
  it('stores weights per category', () => {
    const profile = rememberPriorities(emptyProfile(), 'mobiles', { performance: 9 })
    expect(profile.priorities.mobiles).toEqual({ performance: 9 })
    expect(profile.priorities.laptops).toBeUndefined()
  })
})

describe('brandAffinity', () => {
  it('weights recent views above old ones', () => {
    const now = Date.now()
    const profile = {
      ...emptyProfile(),
      viewed: [
        { id: 'fast', category: 'mobiles' as const, at: now },
        // Acme, but eight weeks ago — four half-lives, so ~1/16 the weight.
        { id: 'slow', category: 'mobiles' as const, at: now - 56 * 24 * 60 * 60 * 1000 },
      ],
    }
    const scores = brandAffinity(profile, lookup)
    expect(scores.Globex).toBeGreaterThan(scores.Acme)
  })

  it('ignores views of devices no longer in the catalogue', () => {
    const profile = {
      ...emptyProfile(),
      viewed: [{ id: 'deleted-device', category: 'mobiles' as const, at: Date.now() }],
    }
    expect(brandAffinity(profile, lookup)).toEqual({})
  })
})

describe('rankCategories', () => {
  it('orders by how much the user actually uses each one', () => {
    const profile = { ...emptyProfile(), categoryUse: { laptops: 5, mobiles: 1 } }
    expect(rankCategories(profile, ['mobiles', 'laptops', 'cameras'])[0]).toBe('laptops')
  })

  it('is stable when there is no history', () => {
    const all = ['mobiles', 'laptops', 'cameras'] as const
    expect(rankCategories(emptyProfile(), [...all])).toEqual([...all])
  })
})

describe('favouritePersona', () => {
  it('returns null until a preset is used', () => {
    expect(favouritePersona(emptyProfile())).toBeNull()
  })

  it('returns the most-used preset', () => {
    let profile = recordPersona(emptyProfile(), 'gaming')
    profile = recordPersona(profile, 'budget')
    profile = recordPersona(profile, 'gaming')
    expect(favouritePersona(profile)).toBe('gaming')
  })
})

describe('suggestMatchups', () => {
  it('suggests nothing without history', () => {
    expect(suggestMatchups(emptyProfile(), catalogueFor)).toEqual([])
  })

  it('suggests products viewed but never compared', () => {
    let profile = emptyProfile()
    profile = recordView(profile, byId('slow'))
    profile = recordView(profile, byId('fast'))

    const suggestions = suggestMatchups(profile, catalogueFor)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].reason).toMatch(/never put them side by side/i)
  })

  it('does not re-suggest a matchup already run', () => {
    let profile = emptyProfile()
    profile = recordView(profile, byId('slow'))
    profile = recordView(profile, byId('fast'))
    profile = recordComparison(profile, 'mobiles', [byId('fast'), byId('slow')])

    const viewedSuggestion = suggestMatchups(profile, catalogueFor).find((s) =>
      s.reason.match(/never put them side by side/i),
    )
    expect(viewedSuggestion).toBeUndefined()
  })

  it('suggests price rivals for the most recent comparison', () => {
    const profile = recordComparison(emptyProfile(), 'mobiles', [byId('mid')])
    const suggestions = suggestMatchups(profile, catalogueFor)
    // `dud` costs the same 500 as `mid`, so it is within the 25% band.
    const rivals = suggestions.find((s) => s.reason.match(/within 25%/i))
    expect(rivals?.ids).toContain('dud')
  })

  it('never suggests a device missing from the catalogue', () => {
    const profile = {
      ...emptyProfile(),
      viewed: [
        { id: 'ghost-a', category: 'mobiles' as const, at: Date.now() },
        { id: 'ghost-b', category: 'mobiles' as const, at: Date.now() },
      ],
    }
    expect(suggestMatchups(profile, catalogueFor)).toEqual([])
  })
})

describe('hasHistory', () => {
  it('is false for a fresh profile', () => {
    expect(hasHistory(emptyProfile())).toBe(false)
  })

  it('is true once anything is recorded', () => {
    expect(hasHistory(recordView(emptyProfile(), byId('slow')))).toBe(true)
  })
})

describe('persistence', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips a profile', () => {
    const profile = rememberPriorities(emptyProfile(), 'mobiles', { performance: 8 })
    saveProfile(profile)
    expect(loadProfile().priorities.mobiles).toEqual({ performance: 8 })
  })

  it('starts fresh when the stored profile is corrupt', () => {
    window.localStorage.setItem('techspec:profile:v2', 'garbage')
    expect(hasHistory(loadProfile())).toBe(false)
  })

  it('discards a profile from an older version', () => {
    window.localStorage.setItem(
      'techspec:profile:v2',
      JSON.stringify({ version: 1, viewed: [{ id: 'slow' }] }),
    )
    expect(loadProfile().viewed).toEqual([])
  })

  it('clears on request', () => {
    saveProfile(recordView(emptyProfile(), byId('slow')))
    clearProfile()
    expect(hasHistory(loadProfile())).toBe(false)
  })
})
