import type { Category, CategoryId, Product } from '@/types'
import { validateProduct } from './validate'

/**
 * Pluggable remote catalogue source.
 *
 * There is no free, CORS-friendly device-spec API worth depending on, so
 * nothing is configured by default and the app runs entirely on the seed plus
 * the user's own edits. This is the seam where a real one drops in: point
 * `VITE_CATALOGUE_ENDPOINT` at something that returns the documented shape and
 * every device flows through the same validation the editor and importer use.
 *
 *   GET {endpoint}/{categoryId}  ->  { products: Product[] }
 */

export interface RemoteResult {
  products: Product[]
  /** Devices the endpoint returned that failed validation. */
  rejected: number
  fetchedAt: number
}

export function remoteEndpoint(): string | null {
  const configured = import.meta.env.VITE_CATALOGUE_ENDPOINT
  return typeof configured === 'string' && configured.length > 0 ? configured : null
}

export const isRemoteConfigured = (): boolean => remoteEndpoint() !== null

export class RemoteSourceError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'RemoteSourceError'
  }
}

export async function fetchRemoteCatalogue(
  category: Category,
  signal?: AbortSignal,
): Promise<RemoteResult> {
  const endpoint = remoteEndpoint()
  if (!endpoint) throw new RemoteSourceError('No catalogue endpoint is configured')

  let response: Response
  try {
    response = await fetch(`${endpoint.replace(/\/$/, '')}/${category.id}`, {
      signal,
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    throw new RemoteSourceError('Could not reach the catalogue service', error)
  }

  if (!response.ok) {
    throw new RemoteSourceError(
      `Catalogue service returned ${response.status} ${response.statusText}`,
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    throw new RemoteSourceError('Catalogue service returned invalid JSON', error)
  }

  const list = (payload as { products?: unknown })?.products
  if (!Array.isArray(list)) {
    throw new RemoteSourceError('Catalogue service response is missing a products array')
  }

  // Remote data is no more trusted than an imported file.
  const products: Product[] = []
  let rejected = 0
  for (const candidate of list) {
    const result = validateProduct(category, candidate, {
      existingIds: products.map((p) => p.id),
    })
    if (result.ok) products.push(result.product)
    else rejected += 1
  }

  return { products, rejected, fetchedAt: Date.now() }
}

/** Categories a configured endpoint is expected to serve. */
export const REMOTE_CATEGORIES: CategoryId[] = [
  'mobiles',
  'laptops',
  'tablets',
  'smartwatches',
  'headphones',
  'cameras',
]
