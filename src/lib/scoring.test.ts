import { describe, expect, it } from 'vitest'
import {
  advantagesOver,
  applyDealBreakers,
  buildRanges,
  computeBest,
  computePersonaVerdicts,
  defaultPriorities,
  explainPillar,
  pillarDeltas,
  scoreProducts,
  specDiffers,
} from './scoring'
import { byId, testCatalogue, testCategory } from './__fixtures__/category'

const score = (ids: string[], priorities?: Record<string, number>) =>
  scoreProducts(testCategory, testCatalogue, ids.map(byId), { priorities })

const pick = (ids: string[], id: string, priorities?: Record<string, number>) => {
  const found = score(ids, priorities).find((s) => s.product.id === id)
  if (!found) throw new Error(`not scored: ${id}`)
  return found
}

describe('buildRanges', () => {
  it('spans the whole catalogue and skips unrankable specs', () => {
    const ranges = buildRanges(testCategory, testCatalogue)
    expect(ranges.speed).toEqual({ min: 100, max: 300 })
    expect(ranges.name).toBeUndefined()
  })

  it('ignores missing values when computing bounds', () => {
    expect(buildRanges(testCategory, testCatalogue).sparse).toEqual({ min: 50, max: 100 })
  })
})

describe('normalisation', () => {
  it('scores against the catalogue, not the selection', () => {
    // `mid` sits at the midpoint of the 100..300 catalogue range. Comparing it
    // against only `fast` must not rescale it to 0.
    expect(pick(['mid', 'fast'], 'mid').specs.speed.norm).toBe(50)
    expect(pick(['mid'], 'mid').specs.speed.norm).toBe(50)
  })

  it('inverts lower-is-better specs', () => {
    // weight 100 is the lightest in the catalogue, so it must score 100.
    expect(pick(['fast', 'slow'], 'fast').specs.weight.norm).toBe(100)
    expect(pick(['fast', 'slow'], 'slow').specs.weight.norm).toBe(0)
  })

  it('parks a spec every product shares at mid-scale', () => {
    expect(pick(['slow', 'fast'], 'fast').specs.flat.norm).toBe(50)
  })

  it('ranks enums best-first and booleans as 0/1', () => {
    expect(pick(['slow', 'fast'], 'fast').specs.tier.norm).toBe(100)
    expect(pick(['slow', 'fast'], 'slow').specs.tier.norm).toBe(0)
    expect(pick(['slow', 'fast'], 'fast').specs.wireless.norm).toBe(100)
  })

  it('reports missing values as null rather than zero', () => {
    expect(pick(['slow', 'fast'], 'slow').specs.sparse.norm).toBeNull()
    expect(pick(['slow', 'fast'], 'slow').specs.sparse.raw).toBeNull()
  })

  it('leaves informational specs unranked', () => {
    expect(pick(['slow', 'fast'], 'fast').specs.name.norm).toBeNull()
  })
})

describe('pillars', () => {
  it('aggregates member specs by weight', () => {
    // battery = weight(0.5) + wireless(0.5); fast is lightest and wireless.
    expect(pick(['slow', 'fast'], 'fast').pillars.battery).toBe(100)
    expect(pick(['slow', 'fast'], 'slow').pillars.battery).toBe(0)
  })

  it('re-normalises around missing members instead of penalising them', () => {
    // `mid`: weight 200 -> 50, wireless true -> 100. Mean of the two = 75.
    expect(pick(['mid', 'fast'], 'mid').pillars.battery).toBe(75)
  })
})

describe('priority weighting', () => {
  const ids = ['slow', 'fast']

  it('changes the winner when priorities change', () => {
    const top = (list: ReturnType<typeof score>) =>
      [...list].sort((a, b) => b.overall - a.overall)[0].product.id

    expect(top(score(ids, { performance: 10, battery: 1, value: 0 }))).toBe('fast')
    expect(top(score(ids, { performance: 0, battery: 1, value: 10 }))).toBe('slow')
  })

  it('excludes a pillar weighted to zero', () => {
    // `mid` scores differently on the two pillars (perf 50, battery 75), so
    // zeroing one has to move the overall. `fast` maxes both, which would
    // make this pass for the wrong reason.
    const onlyPerf = pick(['slow', 'mid'], 'mid', { performance: 10, battery: 0, value: 0 })
    const onlyBattery = pick(['slow', 'mid'], 'mid', { performance: 0, battery: 10, value: 0 })
    expect(onlyPerf.overall).toBe(50)
    expect(onlyBattery.overall).toBe(75)
  })

  it('defaults every pillar to neutral', () => {
    expect(defaultPriorities(testCategory)).toEqual({
      performance: 5,
      battery: 5,
      value: 5,
    })
  })
})

describe('value index and frontier', () => {
  it('rewards the higher scorer when prices match', () => {
    const list = score(['mid', 'dud'])
    const mid = list.find((s) => s.product.id === 'mid')!
    const dud = list.find((s) => s.product.id === 'dud')!
    expect(mid.value).toBeGreaterThan(dud.value)
  })

  it('drops a product dominated on both price and score', () => {
    const frontier = score(['mid', 'dud', 'fast'])
      .filter((s) => s.onFrontier)
      .map((s) => s.product.id)
    // `dud` costs the same as `mid` but scores worse, so it is dominated.
    expect(frontier).not.toContain('dud')
    expect(frontier).toContain('mid')
  })

  it('keeps the cheapest product on the frontier by definition', () => {
    const slow = score(['slow', 'mid', 'fast']).find((s) => s.product.id === 'slow')!
    expect(slow.onFrontier).toBe(true)
  })

  it('rebases the top value score to 100', () => {
    expect(Math.max(...score(['slow', 'mid', 'fast']).map((s) => s.value))).toBe(100)
  })
})

describe('computeBest', () => {
  it('marks the winner and loser of each spec', () => {
    const best = computeBest(testCategory, score(['slow', 'fast']))
    expect(best.speed.bestIds).toEqual(['fast'])
    expect(best.speed.worstIds).toEqual(['slow'])
    expect(best.speed.spread).toBe(100)
  })

  it('declares no winner when every product ties', () => {
    const best = computeBest(testCategory, score(['slow', 'fast']))
    expect(best.flat.bestIds).toEqual([])
    expect(best.flat.worstIds).toEqual([])
    expect(best.flat.spread).toBe(0)
  })

  it('returns an empty result for specs nobody reports', () => {
    expect(computeBest(testCategory, score(['slow'])).sparse.bestIds).toEqual([])
  })
})

describe('specDiffers', () => {
  const specOf = (key: string) => testCategory.specs.find((s) => s.key === key)!

  it('is false when every product shares the value', () => {
    expect(specDiffers(specOf('flat'), score(['slow', 'fast']))).toBe(false)
  })

  it('is true when any product differs', () => {
    expect(specDiffers(specOf('speed'), score(['slow', 'fast']))).toBe(true)
  })
})

describe('advantagesOver', () => {
  it('lists the biggest genuine leads first', () => {
    const wins = advantagesOver(
      testCategory,
      pick(['slow', 'fast'], 'fast'),
      pick(['slow', 'fast'], 'slow'),
    )
    expect(wins[0].specKey).toBe('speed')
    expect(wins.map((w) => w.specKey)).not.toContain('flat')
  })

  it('never quotes a spec flagged as minor', () => {
    // `slow` is newer than `mid`, but release year is not a buying advantage.
    const wins = advantagesOver(
      testCategory,
      pick(['slow', 'mid'], 'slow'),
      pick(['slow', 'mid'], 'mid'),
    )
    expect(wins.map((w) => w.specKey)).not.toContain('releaseYear')
  })

  it('returns nothing when a product leads on nothing', () => {
    // `dud` and `mid` cost the same, and `dud` is worse or equal everywhere
    // else. (Against `fast` it would still legitimately lead on price.)
    expect(
      advantagesOver(testCategory, pick(['dud', 'mid'], 'dud'), pick(['dud', 'mid'], 'mid')),
    ).toEqual([])
  })
})

describe('pillarDeltas', () => {
  it('orders by absolute gap and signs the direction', () => {
    const deltas = pillarDeltas(
      testCategory,
      pick(['slow', 'fast'], 'fast'),
      pick(['slow', 'fast'], 'slow'),
    )
    expect(deltas[0].delta).toBeGreaterThan(0)
    expect(deltas.find((d) => d.pillar === 'value')!.delta).toBeLessThan(0)
  })
})

describe('persona verdicts', () => {
  it('picks a different winner per persona', () => {
    const verdicts = computePersonaVerdicts(testCategory, score(['slow', 'fast']))
    const winner = (id: string) => verdicts.find((v) => v.persona.id === id)!.winner.product.id
    expect(winner('power')).toBe('fast')
    expect(winner('budget')).toBe('slow')
  })

  it('explains itself using a pillar the persona actually weights', () => {
    // Regression guard: the budget verdict once justified itself with a huge
    // performance gap on a pillar it barely weighted.
    const verdicts = computePersonaVerdicts(testCategory, score(['slow', 'fast']))
    const budget = verdicts.find((v) => v.persona.id === 'budget')!
    expect(budget.reason.toLowerCase()).toContain('value')
    expect(budget.reason.toLowerCase()).not.toContain('performance')
  })

  it('handles a single-product selection without dividing by zero', () => {
    const verdicts = computePersonaVerdicts(testCategory, score(['fast']))
    expect(verdicts).toHaveLength(testCategory.personas.length)
    expect(verdicts[0].margin).toBe(0)
    expect(verdicts[0].runnerUp).toBeUndefined()
  })

  it('returns nothing for an empty selection', () => {
    expect(computePersonaVerdicts(testCategory, [])).toEqual([])
  })
})

describe('explainPillar', () => {
  it('decomposes a pillar into its contributing specs', () => {
    const contributions = explainPillar(testCategory, 'battery', score(['slow', 'fast']))
    expect(contributions.map((c) => c.specKey).sort()).toEqual(['weight', 'wireless'])
    expect(contributions[0].share).toBe(0.5)
  })

  it('sums its points back to the pillar score', () => {
    const scored = score(['slow', 'mid', 'fast'])
    for (const pillar of testCategory.pillars) {
      const contributions = explainPillar(testCategory, pillar.id, scored)
      for (const item of scored) {
        const summed = contributions.reduce((t, c) => t + c.perProduct[item.product.id].points, 0)
        expect(
          Math.abs(summed - item.pillars[pillar.id]),
          `${item.product.id} / ${pillar.id}`,
        ).toBeLessThan(0.5)
      }
    }
  })

  it('gives a missing spec zero points without skewing the others', () => {
    const scored = score(['slow', 'mid'])
    const battery = explainPillar(testCategory, 'battery', scored)
    const wireless = battery.find((c) => c.specKey === 'wireless')!
    expect(wireless.perProduct.slow.norm).toBe(0)
    expect(wireless.perProduct.slow.points).toBe(0)
  })

  it('returns nothing for an unknown pillar', () => {
    expect(explainPillar(testCategory, 'nope', score(['slow']))).toEqual([])
  })
})

describe('applyDealBreakers', () => {
  it('passes everything through when no requirement is set', () => {
    const scored = score(['slow', 'mid', 'fast'])
    const result = applyDealBreakers(testCategory, scored, [])
    expect(result.eligible).toHaveLength(3)
    expect(result.failures).toEqual({})
  })

  it('disqualifies products failing a requirement and says which', () => {
    const result = applyDealBreakers(testCategory, score(['slow', 'mid', 'fast']), ['wireless'])
    expect(result.eligible.map((s) => s.product.id)).toEqual(['mid', 'fast'])
    expect(result.failures.slow).toEqual(['Wireless'])
  })

  it('intersects multiple requirements', () => {
    // `mid` is wireless but not under 500; `fast` is wireless but expensive.
    const result = applyDealBreakers(testCategory, score(['slow', 'mid', 'fast']), [
      'wireless',
      'cheap',
    ])
    expect(result.eligible).toHaveLength(0)
    expect(result.failures.slow).toEqual(['Wireless'])
    expect(result.failures.fast).toEqual(['Under 500'])
  })

  it('ignores requirement ids the category does not define', () => {
    const result = applyDealBreakers(testCategory, score(['slow', 'fast']), ['nonexistent'])
    expect(result.eligible).toHaveLength(2)
  })
})
