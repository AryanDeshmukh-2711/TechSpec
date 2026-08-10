import type { Category, CategoryId, Product, SpecGroupId } from '@/types'
import { mobilesCategory, mobileProducts } from './categories/mobiles'
import { laptopsCategory, laptopProducts } from './categories/laptops'
import { tabletsCategory, tabletProducts } from './categories/tablets'
import { smartwatchesCategory, smartwatchProducts } from './categories/smartwatches'
import { headphonesCategory, headphoneProducts } from './categories/headphones'
import { camerasCategory, cameraProducts } from './categories/cameras'

/**
 * Product records don't carry `price` / `releaseYear` inside their spec map —
 * they live on the product itself. Hydration copies them in so the scoring
 * engine can treat commercial terms as just another rankable spec.
 */
function hydrate(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    specs: {
      ...product.specs,
      price: product.price,
      releaseYear: product.releaseYear,
    },
  }))
}

export const CATEGORIES: Category[] = [
  mobilesCategory,
  laptopsCategory,
  tabletsCategory,
  smartwatchesCategory,
  headphonesCategory,
  camerasCategory,
]

const CATALOGUE: Record<CategoryId, Product[]> = {
  mobiles: hydrate(mobileProducts),
  laptops: hydrate(laptopProducts),
  tablets: hydrate(tabletProducts),
  smartwatches: hydrate(smartwatchProducts),
  headphones: hydrate(headphoneProducts),
  cameras: hydrate(cameraProducts),
}

export function getCategory(id: CategoryId | null | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function productCount(id: CategoryId): number {
  return CATALOGUE[id]?.length ?? 0
}

export const TOTAL_PRODUCTS = Object.values(CATALOGUE).reduce((sum, list) => sum + list.length, 0)

/**
 * Deliberately async. The data ships in the bundle today, but every call site
 * already awaits it — swapping in a real API later touches this file only.
 */
export async function fetchCatalogue(id: CategoryId): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 260))
  const list = CATALOGUE[id]
  if (!list) throw new Error(`Unknown category: ${id}`)
  return list
}

/** Group display metadata, shared by the spec table and the group nav. */
export const SPEC_GROUPS: Record<SpecGroupId, { label: string; icon: string }> = {
  display: { label: 'Display', icon: 'Monitor' },
  performance: { label: 'Performance', icon: 'Cpu' },
  camera: { label: 'Camera', icon: 'Camera' },
  battery: { label: 'Battery', icon: 'BatteryCharging' },
  storage: { label: 'Storage', icon: 'HardDrive' },
  build: { label: 'Build', icon: 'Box' },
  connectivity: { label: 'Connectivity', icon: 'Wifi' },
  price: { label: 'Price & support', icon: 'Tag' },
  health: { label: 'Health sensors', icon: 'HeartPulse' },
  sound: { label: 'Sound', icon: 'AudioLines' },
  features: { label: 'Features', icon: 'Sparkles' },
}

/** Curated matchups shown on the home screen. */
export const FEATURED_MATCHUPS: {
  category: CategoryId
  ids: string[]
  title: string
  subtitle: string
}[] = [
  {
    category: 'mobiles',
    ids: ['iphone-16-pro-max', 'galaxy-s25-ultra', 'pixel-9-pro-xl'],
    title: 'The flagship three',
    subtitle: 'iPhone vs Galaxy vs Pixel, at the top of each range',
  },
  {
    category: 'mobiles',
    ids: ['pixel-9a', 'galaxy-a56', 'moto-edge-60-pro', 'nothing-3a-pro'],
    title: 'Best under $500',
    subtitle: 'Where the value actually is this year',
  },
  {
    category: 'laptops',
    ids: ['mba-13-m4', 'zenbook-s-14', 'thinkpad-x1-carbon-g13'],
    title: 'Ultrabook showdown',
    subtitle: 'Three takes on the perfect 14-inch carry',
  },
  {
    category: 'laptops',
    ids: ['zephyrus-g14-2025', 'blade-16-2025', 'legion-pro-7i-g10'],
    title: 'Gaming laptops',
    subtitle: 'Portable, premium or pure horsepower',
  },
  {
    category: 'headphones',
    ids: ['sony-wh1000xm6', 'bose-qc-ultra', 'airpods-max-usbc'],
    title: 'Flagship noise cancelling',
    subtitle: 'The three that actually silence a cabin',
  },
  {
    category: 'cameras',
    ids: ['sony-a7-iv', 'canon-r6-ii', 'nikon-z6-iii'],
    title: 'Hybrid full-frame',
    subtitle: 'The $2,500 bracket, decided',
  },
]
