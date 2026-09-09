import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CategoryId, Product } from '@/types'
import {
  ensureLaunchPoint,
  forgetProduct,
  loadPriceHistory,
  priceFootprint,
  recordPrice,
  savePriceHistory,
  summarise,
  today,
  type PriceHistory,
  type PriceOrigin,
  type PriceSummary,
} from './priceHistory'
import {
  clearSaved,
  findBySelection,
  loadSaved,
  newComparisonId,
  persistSaved,
  removeComparison,
  renameComparison,
  saveComparison,
  suggestTitle,
  type SavedComparison,
} from './savedComparisons'

/**
 * Owns the two entities the research report specifies but the app did not have:
 * PRICE_HISTORY, and COMPARISON / COMPARISON_ITEM.
 */

interface LibraryValue {
  /* PRICE_HISTORY */
  priceOf: (productId: string) => PriceSummary
  trackPrice: (product: Product, origin?: PriceOrigin, retailer?: string) => void
  addPricePoint: (productId: string, price: number, retailer: string, date?: string) => void
  dropPriceHistory: (productId: string) => void

  /* COMPARISON */
  saved: SavedComparison[]
  savedFor: (category: CategoryId, ids: string[]) => SavedComparison | undefined
  save: (entry: {
    category: CategoryId
    products: Product[]
    priorities: Record<string, number>
    title?: string
  }) => SavedComparison
  rename: (id: string, title: string) => void
  remove: (id: string) => void
  clearAll: () => void

  footprintBytes: number
}

const LibraryContext = createContext<LibraryValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<PriceHistory>({})
  const [saved, setSaved] = useState<SavedComparison[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHistory(loadPriceHistory())
    setSaved(loadSaved())
    setHydrated(true)
  }, [])

  // Gated on state, not a ref: both mount effects run in the same commit, so a
  // ref would let the first save write the empty initial value over real data.
  useEffect(() => {
    if (hydrated) savePriceHistory(history)
  }, [history, hydrated])

  useEffect(() => {
    if (hydrated) persistSaved(saved)
  }, [saved, hydrated])

  /* ------------------------------------------------------ price history */

  const priceOf = useCallback(
    (productId: string) => summarise(history[productId]),
    [history],
  )

  const trackPrice = useCallback(
    (product: Product, origin: PriceOrigin = 'edit', retailer = 'Your catalogue') => {
      setHistory((current) => {
        // First sight seeds the launch price so a later edit reads as a change
        // rather than appearing out of nowhere.
        const seeded = ensureLaunchPoint(
          current,
          product.id,
          product.price,
          product.releaseYear,
        )
        if (origin === 'launch') return seeded
        return recordPrice(seeded, product.id, {
          price: product.price,
          currency: 'USD',
          dateCollected: today(),
          retailer,
          origin,
        })
      })
    },
    [],
  )

  const addPricePoint = useCallback(
    (productId: string, price: number, retailer: string, date?: string) => {
      setHistory((current) =>
        recordPrice(current, productId, {
          price,
          currency: 'USD',
          dateCollected: date ?? today(),
          retailer,
          origin: 'manual',
        }),
      )
    },
    [],
  )

  const dropPriceHistory = useCallback((productId: string) => {
    setHistory((current) => forgetProduct(current, productId))
  }, [])

  /* -------------------------------------------------------- comparisons */

  const savedFor = useCallback(
    (category: CategoryId, ids: string[]) => findBySelection(saved, category, ids),
    [saved],
  )

  const save = useCallback(
    ({
      category,
      products,
      priorities,
      title,
    }: {
      category: CategoryId
      products: Product[]
      priorities: Record<string, number>
      title?: string
    }) => {
      const entry: SavedComparison = {
        id: newComparisonId(),
        title: title?.trim() || suggestTitle(products.map((p) => p.name)),
        createdAt: Date.now(),
        category,
        items: products.map((p) => ({ productId: p.id, productName: p.name })),
        priorities,
      }
      setSaved((current) => saveComparison(current, entry))
      return entry
    },
    [],
  )

  const rename = useCallback((id: string, title: string) => {
    setSaved((current) => renameComparison(current, id, title))
  }, [])

  const remove = useCallback((id: string) => {
    setSaved((current) => removeComparison(current, id))
  }, [])

  const clearAll = useCallback(() => {
    clearSaved()
    setSaved([])
  }, [])

  const value = useMemo<LibraryValue>(
    () => ({
      priceOf,
      trackPrice,
      addPricePoint,
      dropPriceHistory,
      saved,
      savedFor,
      save,
      rename,
      remove,
      clearAll,
      footprintBytes: priceFootprint(),
    }),
    [
      priceOf, trackPrice, addPricePoint, dropPriceHistory, saved, savedFor, save,
      rename, remove, clearAll,
    ],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryValue {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider')
  return context
}
