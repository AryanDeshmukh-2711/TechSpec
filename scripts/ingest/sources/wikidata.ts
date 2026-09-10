import type { PoliteFetcher } from '../fetcher.ts'

/**
 * Wikidata adapter.
 *
 * Honest about what this can and cannot do. Wikidata models device *series*
 * well ("Lenovo Legion Laptops", "Galaxy S25 series") and individual flagship
 * phones reasonably, but per-SKU laptop coverage is thin and detailed specs are
 * mostly absent. So this is a **discovery** source: it finds models that exist,
 * with manufacturer and release date, and produces stubs to fill in — not a
 * replacement for a spec sheet.
 */

const SPARQL = 'https://query.wikidata.org/sparql'
const API = 'https://www.wikidata.org/w/api.php'

/**
 * Device class QIDs, each verified by direct entity lookup rather than label
 * search. Label search is actively unsafe here: searching "headphones" returns
 * a Little Boots single first, and "camera" returns a genus of wasp.
 */
export const DEVICE_CLASSES: Record<string, { qid: string; label: string }> = {
  mobiles: { qid: 'Q22645', label: 'smartphone' },
  laptops: { qid: 'Q3962', label: 'laptop' },
  tablets: { qid: 'Q155972', label: 'tablet computer' },
  smartwatches: { qid: 'Q5362345', label: 'smartwatch' },
  headphones: { qid: 'Q186819', label: 'headphone' },
  cameras: { qid: 'Q15328', label: 'camera' },
}

export interface DiscoveredDevice {
  qid: string
  name: string
  description?: string
  manufacturer?: string
  releaseYear?: number
  sourceUrl: string
}

interface SearchResponse {
  search?: { id: string; label: string; description?: string }[]
}

interface SparqlResponse {
  results: { bindings: Record<string, { value: string }>[] }
}

function searchUrl(term: string, limit: number): string {
  const url = new URL(API)
  url.searchParams.set('action', 'wbsearchentities')
  url.searchParams.set('search', term)
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  url.searchParams.set('type', 'item')
  url.searchParams.set('limit', String(Math.min(limit, 50)))
  url.searchParams.set('origin', '*')
  return url.toString()
}

/**
 * Resolve a manufacturer name to a QID at run time.
 *
 * Deliberately not a hard-coded table: company QIDs are easy to get wrong from
 * memory (Lenovo is Q14799, not the Q192384 you might guess) and a wrong id
 * silently returns zero results rather than failing loudly.
 */
export async function resolveManufacturer(
  fetcher: PoliteFetcher,
  name: string,
): Promise<{ qid: string; label: string; description?: string } | null> {
  const payload = await fetcher.json<SearchResponse>(searchUrl(name, 5))
  const hit = payload.search?.[0]
  return hit ? { qid: hit.id, label: hit.label, description: hit.description } : null
}

/** Find candidate models by partial name, the way a person would type it. */
export async function discoverByName(
  fetcher: PoliteFetcher,
  query: string,
  limit = 20,
): Promise<DiscoveredDevice[]> {
  const payload = await fetcher.json<SearchResponse>(searchUrl(query, limit))
  return (payload.search ?? []).map((entry) => ({
    qid: entry.id,
    name: entry.label,
    description: entry.description,
    sourceUrl: `https://www.wikidata.org/wiki/${entry.id}`,
  }))
}

/**
 * List devices of a class made by a manufacturer.
 *
 * Returns an empty list rather than throwing when Wikidata simply has no such
 * models — which, for individual laptop SKUs, is common.
 */
export async function discoverByManufacturer(
  fetcher: PoliteFetcher,
  classQid: string,
  manufacturerQid: string,
  limit = 200,
): Promise<DiscoveredDevice[]> {
  const query = `
    SELECT ?item ?itemLabel ?itemDescription ?inception ?makerLabel WHERE {
      ?item wdt:P31/wdt:P279* wd:${classQid} .
      { ?item wdt:P176 wd:${manufacturerQid} }
      UNION { ?item wdt:P1716 wd:${manufacturerQid} }
      UNION { ?item wdt:P178 wd:${manufacturerQid} }
      OPTIONAL { ?item wdt:P571 ?inception }
      OPTIONAL { ?item wdt:P176 ?maker }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT ${Math.min(limit, 500)}
  `
  const url = new URL(SPARQL)
  url.searchParams.set('query', query)
  url.searchParams.set('format', 'json')

  const payload = await fetcher.json<SparqlResponse>(url.toString())
  return payload.results.bindings.map((row) => toDevice(row))
}

/** Everything of a class released in or after `sinceYear`, any manufacturer. */
export async function discoverRecent(
  fetcher: PoliteFetcher,
  classQid: string,
  sinceYear: number,
  limit = 200,
): Promise<DiscoveredDevice[]> {
  const query = `
    SELECT ?item ?itemLabel ?itemDescription ?inception ?makerLabel WHERE {
      ?item wdt:P31/wdt:P279* wd:${classQid} .
      ?item wdt:P571 ?inception .
      FILTER(YEAR(?inception) >= ${sinceYear})
      OPTIONAL { ?item wdt:P176 ?maker }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?inception)
    LIMIT ${Math.min(limit, 500)}
  `
  const url = new URL(SPARQL)
  url.searchParams.set('query', query)
  url.searchParams.set('format', 'json')

  const payload = await fetcher.json<SparqlResponse>(url.toString())
  return payload.results.bindings.map((row) => toDevice(row))
}

function toDevice(row: Record<string, { value: string }>): DiscoveredDevice {
  const qid = row.item.value.split('/').pop() ?? ''
  const inception = row.inception?.value
  const label = row.itemLabel?.value ?? qid
  return {
    qid,
    // An unlabelled entity falls back to its QID; drop those downstream.
    name: label,
    description: row.itemDescription?.value,
    manufacturer: row.makerLabel?.value,
    releaseYear: inception ? Number(inception.slice(0, 4)) : undefined,
    sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
  }
}

/** Entities whose label is still a bare QID carry no usable information. */
export function isUsable(device: DiscoveredDevice): boolean {
  return !/^Q\d+$/.test(device.name) && device.name.trim().length > 1
}

/**
 * Fill in manufacturer and release date for entities found by name search.
 *
 * `wbsearchentities` returns only labels, so a search-discovered device would
 * otherwise carry brand "Unknown" and no year. One SPARQL round trip covers up
 * to 50 entities, so this costs a single extra request per batch.
 */
export async function enrich(
  fetcher: PoliteFetcher,
  devices: DiscoveredDevice[],
): Promise<DiscoveredDevice[]> {
  const wanted = devices.filter((d) => /^Q\d+$/.test(d.qid)).slice(0, 50)
  if (wanted.length === 0) return devices

  const values = wanted.map((d) => `wd:${d.qid}`).join(' ')
  const query = `
    SELECT ?item ?makerLabel ?inception WHERE {
      VALUES ?item { ${values} }
      OPTIONAL { ?item wdt:P176 ?maker }
      OPTIONAL { ?item wdt:P571 ?inception }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `
  const url = new URL(SPARQL)
  url.searchParams.set('query', query)
  url.searchParams.set('format', 'json')

  let payload: SparqlResponse
  try {
    payload = await fetcher.json<SparqlResponse>(url.toString())
  } catch {
    // Enrichment is a bonus; a failure here must not lose the discoveries.
    return devices
  }

  const byQid = new Map<string, { maker?: string; year?: number }>()
  for (const row of payload.results.bindings) {
    const qid = row.item.value.split('/').pop() ?? ''
    const inception = row.inception?.value
    byQid.set(qid, {
      maker: row.makerLabel?.value,
      year: inception ? Number(inception.slice(0, 4)) : undefined,
    })
  }

  return devices.map((device) => {
    const extra = byQid.get(device.qid)
    if (!extra) return device
    return {
      ...device,
      manufacturer: device.manufacturer ?? extra.maker,
      releaseYear: device.releaseYear ?? extra.year,
    }
  })
}
