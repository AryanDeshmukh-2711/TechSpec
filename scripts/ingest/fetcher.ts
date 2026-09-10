import { EMPTY_ROBOTS, isAllowed, parseRobots, robotsUrlFor, type RobotsTxt } from './robots.ts'
import { permittedOrigin, refusalFor, type SourceDefinition } from './registry.ts'

/**
 * A polite fetcher.
 *
 * Every request passes three checks before it is made: the origin is on the
 * allowlist with a recorded legal basis, robots.txt permits the path, and
 * enough time has elapsed since the last request to that host. It identifies
 * itself honestly and never retries aggressively.
 */

export const USER_AGENT =
  'TechSpec-Ingest/1.0 (open-source comparison tool; contact via repository issues)'

export class NotPermittedError extends Error {
  readonly url: string
  readonly reason: string

  constructor(url: string, reason: string) {
    super(`Refused ${url}: ${reason}`)
    this.name = 'NotPermittedError'
    this.url = url
    this.reason = reason
  }
}

export interface FetchLogEntry {
  url: string
  status: number | 'refused'
  reason?: string
  at: number
}

export class PoliteFetcher {
  private robotsCache = new Map<string, RobotsTxt>()
  private lastRequestAt = new Map<string, number>()
  readonly log: FetchLogEntry[] = []
  /** Every robots.txt override applied, for the run summary. */
  readonly exemptionsApplied: { url: string; reason: string }[] = []
  private readonly dryRun: boolean

  constructor(dryRun = false) {
    this.dryRun = dryRun
  }

  private async wait(host: string, minIntervalMs: number): Promise<void> {
    const last = this.lastRequestAt.get(host) ?? 0
    const elapsed = Date.now() - last
    if (elapsed < minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed))
    }
    this.lastRequestAt.set(host, Date.now())
  }

  private async robotsFor(url: string): Promise<RobotsTxt> {
    const robotsUrl = robotsUrlFor(url)
    const cached = this.robotsCache.get(robotsUrl)
    if (cached) return cached

    let robots: RobotsTxt
    try {
      const response = await fetch(robotsUrl, { headers: { 'user-agent': USER_AGENT } })
      if (response.status === 404) {
        // No policy published. The standard reads that as unrestricted, but an
        // absent policy is not an affirmative grant — the registry gate is what
        // actually authorises a source, so treating this as open is safe here.
        robots = { groups: [], sitemaps: [], unavailable: false }
      } else if (!response.ok) {
        robots = EMPTY_ROBOTS
      } else {
        const body = await response.text()
        // A robots.txt that comes back as HTML is a soft 404 or an app shell.
        robots = /^\s*</.test(body)
          ? { groups: [], sitemaps: [], unavailable: false }
          : parseRobots(body)
      }
    } catch {
      robots = EMPTY_ROBOTS
    }

    this.robotsCache.set(robotsUrl, robots)
    return robots
  }

  /** Check permission without fetching. Useful for `--check` runs. */
  async permission(
    url: string,
  ): Promise<{ allowed: boolean; reason: string; source?: SourceDefinition; exempt?: boolean }> {
    const refusal = refusalFor(url)
    if (refusal) return { allowed: false, reason: `source is refused — ${refusal}` }

    const source = permittedOrigin(url)
    if (!source) {
      return {
        allowed: false,
        reason: 'origin is not on the allowlist; add it to registry.ts with a legal basis',
      }
    }

    const robots = await this.robotsFor(url)
    const decision = isAllowed(robots, USER_AGENT, new URL(url).pathname)

    // A declared API may proceed despite robots.txt, but never silently.
    if (!decision.allowed && source.robotsPolicy === 'api-exempt') {
      this.exemptionsApplied.push({ url, reason: source.robotsExemptionReason ?? '' })
      return {
        allowed: true,
        reason: `${decision.reason}, overridden by a declared API exemption`,
        source,
        exempt: true,
      }
    }

    return {
      allowed: decision.allowed,
      reason: decision.allowed ? `permitted (${decision.reason})` : decision.reason,
      source,
    }
  }

  async get(url: string, accept = 'application/json'): Promise<Response> {
    const permission = await this.permission(url)
    if (!permission.allowed || !permission.source) {
      this.log.push({ url, status: 'refused', reason: permission.reason, at: Date.now() })
      throw new NotPermittedError(url, permission.reason)
    }

    const robots = await this.robotsFor(url)
    const crawlDelayMs = isAllowed(robots, USER_AGENT, new URL(url).pathname).crawlDelay * 1000
    const interval = Math.max(permission.source.minIntervalMs, crawlDelayMs)
    await this.wait(new URL(url).hostname, interval)

    if (this.dryRun) {
      this.log.push({ url, status: 0, reason: 'dry run', at: Date.now() })
      return new Response('{}', { status: 200 })
    }

    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept },
    })
    this.log.push({ url, status: response.status, at: Date.now() })

    // Back off rather than hammer a rate limiter.
    if (response.status === 429) {
      throw new Error(`Rate limited by ${new URL(url).hostname}; stopping rather than retrying`)
    }
    return response
  }

  async json<T>(url: string): Promise<T> {
    const response = await this.get(url)
    if (!response.ok) throw new Error(`${url} returned ${response.status}`)
    return (await response.json()) as T
  }
}
