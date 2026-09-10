import { describe, expect, it } from 'vitest'
import { REFUSED_SOURCES, SOURCES, findSource, permittedOrigin, refusalFor } from './registry.ts'

describe('source registry', () => {
  it('gives every source a written legal basis', () => {
    for (const source of SOURCES) {
      expect(source.legalBasis.length, source.id).toBeGreaterThan(30)
      expect(source.licence.length, source.id).toBeGreaterThan(3)
    }
  })

  it('never lets an HTML-crawling source skip robots.txt', () => {
    // The exemption exists for declared APIs only. A `permitted-crawl` source
    // claiming it would silently disable the safety gate for real scraping.
    for (const source of SOURCES) {
      if (source.robotsPolicy === 'api-exempt') {
        expect(source.kind, source.id).toBe('open-api')
      }
    }
  })

  it('requires a written reason for any robots exemption', () => {
    for (const source of SOURCES) {
      if (source.robotsPolicy === 'api-exempt') {
        expect(source.robotsExemptionReason?.length ?? 0, source.id).toBeGreaterThan(40)
      }
    }
  })

  it('throttles every source', () => {
    for (const source of SOURCES) {
      expect(source.minIntervalMs, source.id).toBeGreaterThanOrEqual(1000)
    }
  })

  it('uses https for every origin', () => {
    for (const source of SOURCES) {
      for (const origin of source.origins) expect(origin.startsWith('https://')).toBe(true)
    }
  })

  it('matches an allowlisted origin', () => {
    expect(permittedOrigin('https://query.wikidata.org/sparql?q=1')?.id).toBe('wikidata')
  })

  it('does not match an unlisted origin', () => {
    expect(permittedOrigin('https://example.com/x')).toBeUndefined()
  })

  it('ignores a malformed url rather than throwing', () => {
    expect(permittedOrigin('not a url')).toBeUndefined()
    expect(refusalFor('not a url')).toBeUndefined()
  })

  it('refuses a listed host regardless of subdomain', () => {
    expect(refusalFor('https://www.gsmarena.com/anything.php')).toMatch(/Terms of Use/i)
    expect(refusalFor('https://m.gsmarena.com/x')).toBeTruthy()
  })

  it('gives every refusal a reason', () => {
    for (const refused of REFUSED_SOURCES) {
      expect(refused.reason.length, refused.host).toBeGreaterThan(30)
    }
  })

  it('never lists a host as both allowed and refused', () => {
    const allowedHosts = SOURCES.flatMap((s) => s.origins.map((o) => new URL(o).hostname))
    for (const refused of REFUSED_SOURCES) {
      expect(allowedHosts.some((h) => h.endsWith(refused.host))).toBe(false)
    }
  })

  it('finds a source by id', () => {
    expect(findSource('wikidata')?.label).toBe('Wikidata')
    expect(findSource('nope')).toBeUndefined()
  })
})
