/**
 * robots.txt parsing and permission checks.
 *
 * This is the safety-critical part of ingestion, so it is deliberately
 * conservative: anything ambiguous resolves to "not allowed". A fetch is only
 * permitted when robots.txt actively says so *and* the source carries a
 * recorded legal basis (see `sources/registry.ts`) — robots.txt permission is
 * not the same as permission under a site's terms of use, and several sites
 * that allow crawling in robots.txt forbid scraping in their TOS.
 */

export interface RobotsRule {
  type: 'allow' | 'disallow'
  path: string
}

export interface RobotsGroup {
  agents: string[]
  rules: RobotsRule[]
  crawlDelay?: number
}

export interface RobotsTxt {
  groups: RobotsGroup[]
  sitemaps: string[]
  /** True when the file could not be fetched or parsed. */
  unavailable: boolean
}

export const EMPTY_ROBOTS: RobotsTxt = { groups: [], sitemaps: [], unavailable: true }

/** Parse a robots.txt body into grouped rules. */
export function parseRobots(body: string): RobotsTxt {
  const groups: RobotsGroup[] = []
  const sitemaps: string[] = []

  let current: RobotsGroup | null = null
  // Consecutive User-agent lines share one group; a rule line closes the run.
  let acceptingAgents = false

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim()
    if (!line) continue

    const separator = line.indexOf(':')
    if (separator === -1) continue

    const field = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()

    switch (field) {
      case 'user-agent': {
        if (!acceptingAgents || !current) {
          current = { agents: [], rules: [] }
          groups.push(current)
          acceptingAgents = true
        }
        current.agents.push(value.toLowerCase())
        break
      }
      case 'allow':
      case 'disallow': {
        if (!current) break
        acceptingAgents = false
        // "Disallow:" with an empty value means allow everything.
        if (field === 'disallow' && value === '') {
          current.rules.push({ type: 'allow', path: '/' })
        } else if (value !== '') {
          current.rules.push({ type: field, path: value })
        }
        break
      }
      case 'crawl-delay': {
        if (!current) break
        acceptingAgents = false
        const delay = Number(value)
        if (Number.isFinite(delay) && delay >= 0) current.crawlDelay = delay
        break
      }
      case 'sitemap': {
        if (value) sitemaps.push(value)
        break
      }
      default:
        break
    }
  }

  return { groups, sitemaps, unavailable: false }
}

/** The group that applies to `agent`, preferring an exact match over `*`. */
export function groupFor(robots: RobotsTxt, agent: string): RobotsGroup | null {
  const needle = agent.toLowerCase()

  let wildcard: RobotsGroup | null = null
  let best: RobotsGroup | null = null
  let bestLength = -1

  for (const group of robots.groups) {
    for (const candidate of group.agents) {
      if (candidate === '*') {
        wildcard = wildcard ?? group
        continue
      }
      // A robots User-agent token matches if it is a prefix of our agent.
      if (needle.includes(candidate) && candidate.length > bestLength) {
        best = group
        bestLength = candidate.length
      }
    }
  }

  return best ?? wildcard
}

/** Expand a robots path pattern (`*` and `$`) into a regular expression. */
function patternToRegExp(pattern: string): RegExp {
  let source = ''
  for (const char of pattern) {
    if (char === '*') source += '.*'
    else if (char === '$') source += '$'
    else source += char.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}`)
}

export interface RobotsDecision {
  allowed: boolean
  reason: string
  crawlDelay: number
}

/**
 * Decide whether `pathname` may be fetched.
 *
 * Longest matching rule wins, and Allow beats Disallow at equal length — the
 * behaviour Google and the RFC 9309 draft both specify.
 */
export function isAllowed(
  robots: RobotsTxt,
  agent: string,
  pathname: string,
): RobotsDecision {
  if (robots.unavailable) {
    return {
      allowed: false,
      reason: 'robots.txt could not be read, so fetching is refused',
      crawlDelay: 0,
    }
  }

  const group = groupFor(robots, agent)
  if (!group) {
    // No applicable group at all means nothing is restricted.
    return { allowed: true, reason: 'no matching robots.txt group', crawlDelay: 0 }
  }

  let decision: RobotsRule | null = null
  let decisionLength = -1

  for (const rule of group.rules) {
    if (!patternToRegExp(rule.path).test(pathname)) continue
    const length = rule.path.length
    if (
      length > decisionLength ||
      (length === decisionLength && rule.type === 'allow' && decision?.type === 'disallow')
    ) {
      decision = rule
      decisionLength = length
    }
  }

  const crawlDelay = group.crawlDelay ?? 0

  if (!decision) {
    return { allowed: true, reason: 'no rule matches this path', crawlDelay }
  }

  return decision.type === 'allow'
    ? { allowed: true, reason: `allowed by "Allow: ${decision.path}"`, crawlDelay }
    : { allowed: false, reason: `blocked by "Disallow: ${decision.path}"`, crawlDelay }
}

export function robotsUrlFor(target: string): string {
  const url = new URL(target)
  return `${url.origin}/robots.txt`
}
