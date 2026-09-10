import { describe, expect, it } from 'vitest'
import { testCatalogue, testCategory } from './__fixtures__/category'
import {
  EMPTY_ANSWERS,
  budgetBands,
  isAnswered,
  recommend,
  usefulRequirements,
  weightsFrom,
  type QuizAnswers,
} from './recommend'

const answers = (overrides: Partial<QuizAnswers> = {}): QuizAnswers => ({
  ...EMPTY_ANSWERS,
  ...overrides,
})

describe('budgetBands', () => {
  it('derives bands from the catalogue price distribution', () => {
    const bands = budgetBands(testCatalogue)
    expect(bands.length).toBeGreaterThan(1)
    expect(bands.at(-1)?.max).toBeNull()
  })

  it('never offers a band that would show nothing', () => {
    for (const band of budgetBands(testCatalogue)) expect(band.count).toBeGreaterThan(0)
  })

  it('rounds to figures a person would say', () => {
    for (const band of budgetBands(testCatalogue)) {
      if (band.max !== null) expect(band.max % 25).toBe(0)
    }
  })

  it('handles an empty catalogue', () => {
    expect(budgetBands([])).toEqual([{ label: 'Any budget', max: null, count: 0 }])
  })
})

describe('usefulRequirements', () => {
  it('drops filters that everything or nothing passes', () => {
    const useful = usefulRequirements(testCategory, testCatalogue)
    for (const entry of useful) {
      expect(entry.count).toBeGreaterThan(0)
      expect(entry.count).toBeLessThan(testCatalogue.length)
    }
  })
})

describe('weightsFrom', () => {
  it('makes the first priority dominate and the second support', () => {
    const weights = weightsFrom(testCategory, answers({ priorities: ['performance', 'battery'] }))
    expect(weights.performance).toBe(10)
    expect(weights.battery).toBe(7)
  })

  it('floors everything else rather than zeroing it', () => {
    const weights = weightsFrom(testCategory, answers({ priorities: ['performance'] }))
    expect(weights.battery).toBe(2)
    // A buyer who wants speed still cares if the thing is unusable elsewhere.
    expect(weights.battery).toBeGreaterThan(0)
  })

  it('treats a budget answer as caring about value', () => {
    const weights = weightsFrom(testCategory, answers({ budget: 500, priorities: ['performance'] }))
    expect(weights.value).toBeGreaterThanOrEqual(6)
  })

  it('ignores an unknown pillar id', () => {
    expect(() => weightsFrom(testCategory, answers({ priorities: ['nonsense'] }))).not.toThrow()
  })
})

describe('recommend', () => {
  it('ranks by the stated priority', () => {
    const outcome = recommend(testCategory, testCatalogue, answers({ priorities: ['performance'] }))
    expect(outcome.recommendations[0].scored.product.id).toBe('fast')
  })

  it('changes its answer when the priority changes', () => {
    const perf = recommend(testCategory, testCatalogue, answers({ priorities: ['performance'] }))
    const value = recommend(testCategory, testCatalogue, answers({ priorities: ['value'] }))
    expect(perf.recommendations[0].scored.product.id).not.toBe(
      value.recommendations[0].scored.product.id,
    )
  })

  it('excludes over-budget devices and says so', () => {
    const outcome = recommend(
      testCategory,
      testCatalogue,
      answers({ budget: 500, priorities: ['performance'] }),
    )
    const ids = outcome.recommendations.map((r) => r.scored.product.id)
    expect(ids).not.toContain('fast')
    expect(outcome.excluded.find((e) => e.product.id === 'fast')?.reason).toMatch(/over \$500/)
  })

  it('excludes devices failing a must-have and names it', () => {
    const outcome = recommend(
      testCategory,
      testCatalogue,
      answers({ priorities: ['performance'], mustHaves: ['wireless'] }),
    )
    expect(outcome.recommendations.map((r) => r.scored.product.id)).not.toContain('slow')
    expect(outcome.excluded.find((e) => e.product.id === 'slow')?.reason).toMatch(/wireless/i)
  })

  it('normalises against the whole catalogue, not just the survivors', () => {
    // `mid` sits mid-range across the full catalogue. Filtering the field must
    // not rescale it to the top of a two-device shortlist.
    const outcome = recommend(
      testCategory,
      testCatalogue,
      answers({ budget: 500, priorities: ['performance'] }),
    )
    const mid = outcome.recommendations.find((r) => r.scored.product.id === 'mid')
    expect(mid?.scored.specs.speed.norm).toBe(50)
  })

  it('returns nothing when the requirements are impossible', () => {
    const outcome = recommend(
      testCategory,
      testCatalogue,
      answers({ budget: 1, priorities: ['performance'] }),
    )
    expect(outcome.recommendations).toEqual([])
    expect(outcome.excluded.length).toBe(testCatalogue.length)
  })

  it('gives every recommendation at least one stated reason', () => {
    const outcome = recommend(
      testCategory,
      testCatalogue,
      answers({ priorities: ['performance', 'value'] }),
    )
    for (const entry of outcome.recommendations) {
      expect(entry.reasons.length, entry.scored.product.id).toBeGreaterThan(0)
    }
  })

  it('caps the shortlist', () => {
    const outcome = recommend(
      testCategory,
      testCatalogue,
      answers({ priorities: ['performance'] }),
      2,
    )
    expect(outcome.recommendations).toHaveLength(2)
  })

  it('reports the weights it used, so the result can be audited', () => {
    const outcome = recommend(testCategory, testCatalogue, answers({ priorities: ['battery'] }))
    expect(outcome.weights.battery).toBe(10)
  })
})

describe('isAnswered', () => {
  it('needs at least one priority', () => {
    expect(isAnswered(EMPTY_ANSWERS)).toBe(false)
    expect(isAnswered(answers({ priorities: ['performance'] }))).toBe(true)
  })
})
