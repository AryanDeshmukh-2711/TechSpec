import type { Category, Product, ScoredProduct } from '@/types'

/**
 * schema.org structured data — SEO section of the research report:
 * "Use schema.org markup (Product, Review) to enhance search snippets".
 *
 * Emitted as JSON-LD. Note the honest limits: the app is a client-rendered SPA,
 * so a crawler that does not execute JavaScript will not see this. The report
 * pairs structured data with server-side rendering for exactly that reason —
 * see `docs/research-execution.md` item 61, which is blocked on having a host.
 */

const CURRENCY = 'USD'

export interface ProductSchema {
  '@context': 'https://schema.org'
  '@type': 'Product'
  name: string
  brand: { '@type': 'Brand'; name: string }
  category: string
  description: string
  offers: {
    '@type': 'Offer'
    price: number
    priceCurrency: string
    availability: string
  }
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    bestRating: number
    ratingCount: number
  }
  additionalProperty: { '@type': 'PropertyValue'; name: string; value: string }[]
}

export function productSchema(category: Category, product: Product): ProductSchema {
  const specs = category.specs
    .filter((def) => !def.internal && def.key !== 'price' && def.key !== 'releaseYear')
    .map((def) => ({ def, value: product.specs[def.key] }))
    .filter(({ value }) => value !== null && value !== undefined)
    .slice(0, 30)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    category: category.label,
    description: product.tagline,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: CURRENCY,
      availability: 'https://schema.org/InStock',
    },
    // Editorial rating only. Deliberately no ratingCount fabrication: Google
    // requires aggregateRating to reflect genuine user reviews, and there are
    // none, so this is omitted rather than invented.
    additionalProperty: specs.map(({ def, value }) => ({
      '@type': 'PropertyValue' as const,
      name: def.unit ? `${def.label} (${def.unit})` : def.label,
      value: String(value),
    })),
  }
}

/**
 * An ItemList for a comparison page, which is what a "X vs Y" URL actually is.
 * Ordered by the weighted score so the list reflects the page's own verdict.
 */
export function comparisonSchema(category: Category, scored: ScoredProduct[]) {
  const ranked = [...scored].sort((a, b) => b.overall - a.overall)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${ranked.map((s) => s.product.name).join(' vs ')} — ${category.label} comparison`,
    numberOfItems: ranked.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: ranked.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: productSchema(category, item.product),
    })),
  }
}

export function breadcrumbSchema(trail: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}
