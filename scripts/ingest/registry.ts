/**
 * The allowlist of sources ingestion may touch.
 *
 * Two gates, both required:
 *
 *   1. robots.txt must permit the specific path (see `robots.ts`)
 *   2. the source must appear here with a stated `legalBasis`
 *
 * Gate 2 exists because robots.txt permission is not permission under a site's
 * terms of use. GSMArena, for one, allows device pages in robots.txt while its
 * Terms of Use prohibit automated extraction — passing gate 1 there would still
 * be a licence breach. Adding a source means writing down, in one sentence, why
 * it is lawful to read it programmatically.
 */

export type SourceKind = 'open-api' | 'open-data' | 'permitted-crawl'

/**
 * Whether robots.txt governs this source.
 *
 * `enforce` is the default and the only setting permitted for anything that
 * retrieves HTML. `api-exempt` exists for one specific, well-understood case:
 * hosts that disallow their API path in robots.txt to stop search engines
 * indexing JSON, while publishing that same path as an official API with its
 * own terms. Wikimedia does exactly this — robots.txt disallows /w/ and
 * /sparql, and the developer documentation simultaneously instructs clients to
 * call them. The Robots Exclusion Protocol governs crawling; a deliberate,
 * rate-limited, identified API call is not crawling.
 *
 * An exemption is never implicit: it must be declared per source, carry a
 * written reason, and the fetcher logs every time one is applied.
 */
export type RobotsPolicy = 'enforce' | 'api-exempt'

export interface SourceDefinition {
  id: string
  label: string
  kind: SourceKind
  /** Origins this source is permitted to fetch from. */
  origins: string[]
  /** Why reading this programmatically is lawful. Required. */
  legalBasis: string
  /** Licence the retrieved content carries, for attribution. */
  licence: string
  /** Minimum milliseconds between requests, over and above any crawl-delay. */
  minIntervalMs: number
  /** Defaults to `enforce`. Only a declared API may opt out. */
  robotsPolicy?: RobotsPolicy
  /** Required whenever `robotsPolicy` is `api-exempt`. */
  robotsExemptionReason?: string
  attribution?: string
}

export const SOURCES: SourceDefinition[] = [
  {
    id: 'wikidata',
    label: 'Wikidata',
    kind: 'open-api',
    origins: ['https://query.wikidata.org', 'https://www.wikidata.org'],
    legalBasis:
      'Public SPARQL and MediaWiki APIs offered by the Wikimedia Foundation for programmatic use; all statement data is released under CC0.',
    licence: 'CC0 1.0 (public domain)',
    minIntervalMs: 1200,
    robotsPolicy: 'api-exempt',
    robotsExemptionReason:
      'robots.txt disallows /w/ and /sparql to keep search engines from indexing API output. Both are published developer APIs with their own terms; this client follows the Wikimedia User-Agent policy and rate limits well under the documented ceiling.',
    attribution: 'Data from Wikidata (CC0)',
  },
  {
    id: 'wikipedia',
    label: 'Wikipedia',
    kind: 'open-api',
    origins: ['https://en.wikipedia.org'],
    legalBasis:
      'Public MediaWiki REST API offered for programmatic use; article text is licensed CC BY-SA 4.0, which permits reuse with attribution.',
    licence: 'CC BY-SA 4.0',
    minIntervalMs: 1200,
    robotsPolicy: 'api-exempt',
    robotsExemptionReason:
      'Same as Wikidata: /w/ and /api/ are disallowed to crawlers but published as developer APIs. Article HTML under /wiki/ is not fetched by this client.',
    attribution: 'Text from Wikipedia, CC BY-SA 4.0',
  },
]

/**
 * Sources deliberately excluded, kept visible so the reasoning is not lost and
 * nobody re-adds one on the strength of robots.txt alone.
 */
export const REFUSED_SOURCES: { host: string; reason: string }[] = [
  {
    host: 'gsmarena.com',
    reason:
      'robots.txt permits device pages, but the Terms of Use prohibit automated extraction and redistribution. No API is offered.',
  },
  {
    host: 'notebookcheck.net',
    reason:
      'robots.txt is permissive, but the site asserts copyright over its review and measurement data with no reuse licence.',
  },
  {
    host: 'psref.lenovo.com',
    reason:
      'No robots.txt is published and the data is a client-rendered app; absence of a policy is not permission, and no reuse terms are stated.',
  },
  {
    host: 'versus.com',
    reason: 'A direct competitor with no public API and no reuse licence.',
  },
]

export function findSource(id: string): SourceDefinition | undefined {
  return SOURCES.find((s) => s.id === id)
}

/** True when `url` belongs to an allowlisted source. */
export function permittedOrigin(url: string): SourceDefinition | undefined {
  let origin: string
  try {
    origin = new URL(url).origin
  } catch {
    return undefined
  }
  return SOURCES.find((source) => source.origins.includes(origin))
}

export function refusalFor(url: string): string | undefined {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
  return REFUSED_SOURCES.find((r) => host.endsWith(r.host))?.reason
}
