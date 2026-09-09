import type { CategoryId } from '@/types'

/**
 * PRICE_HISTORY — from the research report's ER diagram:
 *
 *   PRICE_HISTORY { float price, string currency, date date_collected, string retailer }
 *   PRODUCT ||--o{ PRICE_HISTORY : has
 *
 * The report pairs this with a live retailer feed, which needs a paid API we do
 * not have. Rather than fabricate a price curve — the whole point of this app is
 * that its numbers are checkable — history starts empty and fills from real
 * events: the launch price on first sight, then a point every time someone
 * corrects a price, plus anything entered by hand.
 */

export const PRICE_HISTORY_VERSION = 1
const KEY = `techspec:prices:v${PRICE_HISTORY_VERSION}`

/** Marks a point the app derived rather than one a person supplied. */
export type PriceOrigin = 'launch' | 'edit' | 'manual'

export interface PricePoint {
  price: number
  currency: string
  /** ISO date, day precision — `date_collected` in the report's schema. */
  dateCollected: string
  retailer: string
  origin: PriceOrigin
}

export type PriceHistory = Record<string, PricePoint[]>

export const today = (): string => new Date().toISOString().slice(0, 10)

/* ------------------------------------------------------------ persistence */

export function loadPriceHistory(): PriceHistory {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { version?: number; entries?: PriceHistory }
    if (parsed?.version !== PRICE_HISTORY_VERSION) return {}
    return parsed.entries && typeof parsed.entries === 'object' ? parsed.entries : {}
  } catch {
    return {}
  }
}

export function savePriceHistory(entries: PriceHistory): boolean {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: PRICE_HISTORY_VERSION, entries }),
    )
    return true
  } catch {
    return false
  }
}

export function clearPriceHistory(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing to do.
  }
}

/* ---------------------------------------------------------------- writing */

/** Cap per product so a long-lived profile cannot grow storage without bound. */
const MAX_POINTS = 60

/**
 * Append a point, unless it would duplicate the same price on the same day
 * from the same retailer — editing a spec five times should not produce five
 * identical price points.
 */
export function recordPrice(
  history: PriceHistory,
  productId: string,
  point: PricePoint,
): PriceHistory {
  const existing = history[productId] ?? []
  const duplicate = existing.some(
    (p) =>
      p.price === point.price &&
      p.dateCollected === point.dateCollected &&
      p.retailer === point.retailer,
  )
  if (duplicate) return history

  const next = [...existing, point]
    .sort((a, b) => a.dateCollected.localeCompare(b.dateCollected))
    .slice(-MAX_POINTS)

  return { ...history, [productId]: next }
}

/** Seed the launch price the first time a product is seen. */
export function ensureLaunchPoint(
  history: PriceHistory,
  productId: string,
  price: number,
  releaseYear: number,
  currency = 'USD',
): PriceHistory {
  if (history[productId]?.length) return history
  return recordPrice(history, productId, {
    price,
    currency,
    // Day precision is all the report's schema asks for; launch date is only
    // known to the year, so anchor it there and label the origin honestly.
    dateCollected: `${releaseYear}-01-01`,
    retailer: 'Manufacturer launch price',
    origin: 'launch',
  })
}

export function forgetProduct(history: PriceHistory, productId: string): PriceHistory {
  if (!history[productId]) return history
  const next = { ...history }
  delete next[productId]
  return next
}

/* ---------------------------------------------------------------- reading */

export interface PriceSummary {
  points: PricePoint[]
  current: number | null
  lowest: number | null
  highest: number | null
  /** Signed change from the first recorded point to the latest. */
  changeAbsolute: number | null
  changePercent: number | null
  /** True once there is more than one point, i.e. an actual trend. */
  hasTrend: boolean
}

export function summarise(points: PricePoint[] | undefined): PriceSummary {
  if (!points || points.length === 0) {
    return {
      points: [],
      current: null,
      lowest: null,
      highest: null,
      changeAbsolute: null,
      changePercent: null,
      hasTrend: false,
    }
  }

  const prices = points.map((p) => p.price)
  const first = prices[0]
  const current = prices[prices.length - 1]

  return {
    points,
    current,
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    changeAbsolute: current - first,
    changePercent: first === 0 ? null : ((current - first) / first) * 100,
    hasTrend: points.length > 1,
  }
}

/** Rough storage footprint, for the settings read-out. */
export function priceFootprint(): number {
  try {
    return (window.localStorage.getItem(KEY) ?? '').length
  } catch {
    return 0
  }
}

/** Products with recorded history, newest activity first. */
export function trackedProducts(history: PriceHistory): string[] {
  return Object.keys(history).sort((a, b) => {
    const aLast = history[a]?.at(-1)?.dateCollected ?? ''
    const bLast = history[b]?.at(-1)?.dateCollected ?? ''
    return bLast.localeCompare(aLast)
  })
}

/** Category is carried alongside so the settings screen can group by it. */
export interface TrackedRef {
  productId: string
  category: CategoryId
}
