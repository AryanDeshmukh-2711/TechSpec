import { describe, expect, it } from 'vitest'
import { EMPTY_ROBOTS, groupFor, isAllowed, parseRobots, robotsUrlFor } from './robots.ts'

const AGENT = 'techspec-ingest'

describe('parseRobots', () => {
  it('groups consecutive user-agent lines together', () => {
    const robots = parseRobots(`
      User-agent: a
      User-agent: b
      Disallow: /private
    `)
    expect(robots.groups).toHaveLength(1)
    expect(robots.groups[0].agents).toEqual(['a', 'b'])
  })

  it('starts a new group after a rule line', () => {
    const robots = parseRobots(`
      User-agent: a
      Disallow: /x
      User-agent: b
      Disallow: /y
    `)
    expect(robots.groups).toHaveLength(2)
  })

  it('ignores comments and blank lines', () => {
    const robots = parseRobots(`
      # a comment
      User-agent: *   # trailing comment
      Disallow: /admin
    `)
    expect(robots.groups[0].rules).toEqual([{ type: 'disallow', path: '/admin' }])
  })

  it('treats an empty Disallow as allow-everything', () => {
    const robots = parseRobots('User-agent: *\nDisallow:')
    expect(robots.groups[0].rules).toEqual([{ type: 'allow', path: '/' }])
  })

  it('reads crawl-delay and sitemaps', () => {
    const robots = parseRobots(`
      User-agent: *
      Crawl-delay: 2.5
      Sitemap: https://example.com/sitemap.xml
    `)
    expect(robots.groups[0].crawlDelay).toBe(2.5)
    expect(robots.sitemaps).toEqual(['https://example.com/sitemap.xml'])
  })

  it('survives malformed lines', () => {
    expect(() => parseRobots('garbage\n:::\nUser-agent')).not.toThrow()
  })
})

describe('groupFor', () => {
  const robots = parseRobots(`
    User-agent: *
    Disallow: /everyone

    User-agent: techspec
    Disallow: /specific
  `)

  it('prefers a named group over the wildcard', () => {
    expect(groupFor(robots, AGENT)?.rules[0].path).toBe('/specific')
  })

  it('falls back to the wildcard for an unknown agent', () => {
    expect(groupFor(robots, 'somebot')?.rules[0].path).toBe('/everyone')
  })

  it('returns null when there is no group at all', () => {
    expect(groupFor(parseRobots(''), AGENT)).toBeNull()
  })
})

describe('isAllowed', () => {
  it('refuses when robots.txt could not be read', () => {
    const decision = isAllowed(EMPTY_ROBOTS, AGENT, '/anything')
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toMatch(/could not be read/i)
  })

  it('allows a path no rule matches', () => {
    const robots = parseRobots('User-agent: *\nDisallow: /admin')
    expect(isAllowed(robots, AGENT, '/products/1').allowed).toBe(true)
  })

  it('blocks a disallowed prefix', () => {
    const robots = parseRobots('User-agent: *\nDisallow: /admin')
    expect(isAllowed(robots, AGENT, '/admin/users').allowed).toBe(false)
  })

  it('lets the longest matching rule win', () => {
    const robots = parseRobots(`
      User-agent: *
      Disallow: /data
      Allow: /data/public
    `)
    expect(isAllowed(robots, AGENT, '/data/private').allowed).toBe(false)
    expect(isAllowed(robots, AGENT, '/data/public/a').allowed).toBe(true)
  })

  it('prefers Allow when rules tie on length', () => {
    const robots = parseRobots(`
      User-agent: *
      Disallow: /x
      Allow: /x
    `)
    expect(isAllowed(robots, AGENT, '/x').allowed).toBe(true)
  })

  it('honours wildcards in a pattern', () => {
    const robots = parseRobots('User-agent: *\nDisallow: /*.php')
    expect(isAllowed(robots, AGENT, '/device.php').allowed).toBe(false)
    expect(isAllowed(robots, AGENT, '/device.html').allowed).toBe(true)
  })

  it('honours an end-of-path anchor', () => {
    const robots = parseRobots('User-agent: *\nDisallow: /report$')
    expect(isAllowed(robots, AGENT, '/report').allowed).toBe(false)
    expect(isAllowed(robots, AGENT, '/reports/2025').allowed).toBe(true)
  })

  it('applies a total block', () => {
    const robots = parseRobots('User-agent: *\nDisallow: /')
    expect(isAllowed(robots, AGENT, '/').allowed).toBe(false)
    expect(isAllowed(robots, AGENT, '/anything/at/all').allowed).toBe(false)
  })

  it('reports the crawl delay alongside the decision', () => {
    const robots = parseRobots('User-agent: *\nCrawl-delay: 3\nDisallow: /admin')
    expect(isAllowed(robots, AGENT, '/ok').crawlDelay).toBe(3)
  })

  it('applies the rules of the agent-specific group only', () => {
    // A named group replaces the wildcard entirely rather than merging.
    const robots = parseRobots(`
      User-agent: *
      Disallow: /

      User-agent: techspec
      Disallow: /private
    `)
    expect(isAllowed(robots, AGENT, '/public').allowed).toBe(true)
    expect(isAllowed(robots, AGENT, '/private').allowed).toBe(false)
  })

  it('matches the real GSMArena shape: device pages permitted, forums not', () => {
    // Kept as a reminder that robots.txt permission is not TOS permission —
    // this source is still refused by the registry for exactly that reason.
    const robots = parseRobots(`
      User-agent: *
      Disallow: /forum/
      Disallow: /news.php3/
    `)
    expect(isAllowed(robots, AGENT, '/samsung_galaxy_s25-13610.php').allowed).toBe(true)
    expect(isAllowed(robots, AGENT, '/forum/thread').allowed).toBe(false)
  })
})

describe('robotsUrlFor', () => {
  it('resolves to the origin root', () => {
    expect(robotsUrlFor('https://example.com/a/b?c=d')).toBe('https://example.com/robots.txt')
  })
})
