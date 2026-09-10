import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Category, CategoryId, Product } from '@/types'
import { CATEGORIES, SEED_CATALOGUE, getCategory } from '@/data'
import {
  emptyOverlay,
  overlayStats,
  type CatalogueOverlay,
  type OverlayStats,
} from './types'
import { clearOverlay, loadOverlay, overlayFootprint, saveOverlay, type StorageStatus } from './persistence'
import { diffAgainstSeed, isEmptyPatch, resolveCatalogue } from './overlay'
import { validateProduct, type ValidationIssue } from './validate'
import { buildTransfer, parseTransfer, type ImportReport } from './transfer'

/**
 * Owns the user's catalogue.
 *
 * Seed data is a starting point, not a fixture: every category resolves as
 * seed + the user's overlay, and every mutation persists immediately. The rest
 * of the app never sees the seam — it asks for a catalogue and gets one.
 */

export type MutationResult =
  | { ok: true }
  | { ok: false; issues: ValidationIssue[] }

interface CatalogueValue {
  ready: boolean
  storage: StorageStatus
  catalogueFor: (categoryId: CategoryId) => Product[]
  statsFor: (categoryId: CategoryId) => OverlayStats
  isUserAdded: (categoryId: CategoryId, id: string) => boolean
  isEdited: (categoryId: CategoryId, id: string) => boolean
  seedFor: (categoryId: CategoryId) => Product[]

  addDevice: (categoryId: CategoryId, device: Product) => MutationResult
  updateDevice: (categoryId: CategoryId, device: Product) => MutationResult
  removeDevice: (categoryId: CategoryId, id: string) => void
  restoreDevice: (categoryId: CategoryId, id: string) => void
  resetCategory: (categoryId: CategoryId) => void
  resetEverything: () => void

  exportJson: () => string
  importJson: (json: string) => ImportReport
  applyImport: (report: ImportReport) => void
  footprintBytes: number
  totalCustomisations: number
}

const CatalogueContext = createContext<CatalogueValue | null>(null)

type OverlayMap = Partial<Record<CategoryId, CatalogueOverlay>>

export function CatalogueProvider({
  children,
  onPriceChanged,
}: {
  children: ReactNode
  /** Called when an edit changes a device's price, so history can record it. */
  onPriceChanged?: (product: Product) => void
}) {
  const [overlays, setOverlays] = useState<OverlayMap>({})
  const [storage, setStorage] = useState<StorageStatus>('ok')
  const [ready, setReady] = useState(false)
  const [footprintBytes, setFootprintBytes] = useState(0)

  // Load every overlay once. There are six small keys; doing it up front keeps
  // category switches synchronous and avoids a loading flash per category.
  useEffect(() => {
    const loaded: OverlayMap = {}
    let worst: StorageStatus = 'ok'
    for (const category of CATEGORIES) {
      const result = loadOverlay(category.id)
      loaded[category.id] = result.overlay
      if (result.status !== 'ok') worst = result.status
    }
    setOverlays(loaded)
    setStorage(worst)
    setFootprintBytes(overlayFootprint(CATEGORIES.map((c) => c.id)))
    setReady(true)
  }, [])

  const overlayOf = useCallback(
    (categoryId: CategoryId) => overlays[categoryId] ?? emptyOverlay(),
    [overlays],
  )

  const persist = useCallback((categoryId: CategoryId, next: CatalogueOverlay) => {
    setOverlays((current) => ({ ...current, [categoryId]: next }))
    const status = saveOverlay(categoryId, next)
    if (status !== 'ok') setStorage(status)
    setFootprintBytes(overlayFootprint(CATEGORIES.map((c) => c.id)))
  }, [])

  const seedFor = useCallback(
    (categoryId: CategoryId) => SEED_CATALOGUE[categoryId] ?? [],
    [],
  )

  // Resolve every category once per overlay change rather than on each read;
  // the picker and compare screens both call this on every render.
  const resolved = useMemo(() => {
    const map = {} as Record<CategoryId, Product[]>
    for (const category of CATEGORIES) {
      map[category.id] = resolveCatalogue(seedFor(category.id), overlayOf(category.id))
    }
    return map
  }, [overlayOf, seedFor])

  const catalogueFor = useCallback(
    (categoryId: CategoryId) => resolved[categoryId] ?? [],
    [resolved],
  )

  const statsFor = useCallback(
    (categoryId: CategoryId) => overlayStats(overlayOf(categoryId)),
    [overlayOf],
  )

  const isUserAdded = useCallback(
    (categoryId: CategoryId, id: string) =>
      overlayOf(categoryId).added.some((p) => p.id === id),
    [overlayOf],
  )

  const isEdited = useCallback(
    (categoryId: CategoryId, id: string) => Boolean(overlayOf(categoryId).edits[id]),
    [overlayOf],
  )

  /* ----------------------------------------------------------- mutations */

  const addDevice = useCallback(
    (categoryId: CategoryId, device: Product): MutationResult => {
      const category = getCategory(categoryId)
      if (!category) return { ok: false, issues: [{ field: 'category', message: 'Unknown category' }] }

      const existingIds = catalogueFor(categoryId).map((p) => p.id)
      const result = validateProduct(category, device, { existingIds })
      if (!result.ok) return { ok: false, issues: result.issues }

      const overlay = overlayOf(categoryId)
      persist(categoryId, { ...overlay, added: [...overlay.added, result.product] })
      return { ok: true }
    },
    [catalogueFor, overlayOf, persist],
  )

  const updateDevice = useCallback(
    (categoryId: CategoryId, device: Product): MutationResult => {
      const category = getCategory(categoryId)
      if (!category) return { ok: false, issues: [{ field: 'category', message: 'Unknown category' }] }

      const existingIds = catalogueFor(categoryId).map((p) => p.id)
      const result = validateProduct(category, device, { existingIds, allowId: device.id })
      if (!result.ok) return { ok: false, issues: result.issues }

      const overlay = overlayOf(categoryId)
      const seed = seedFor(categoryId).find((p) => p.id === device.id)
      const previous = catalogueFor(categoryId).find((p) => p.id === device.id)
      // A corrected price is a real, dated event — hand it to PRICE_HISTORY.
      if (previous && previous.price !== result.product.price) {
        onPriceChanged?.(result.product)
      }

      if (seed) {
        // Store only what differs, so a one-field change doesn't persist a
        // whole device and block future seed corrections to the rest.
        const patch = diffAgainstSeed(seed, result.product)
        const edits = { ...overlay.edits }
        if (isEmptyPatch(patch)) delete edits[device.id]
        else edits[device.id] = patch
        persist(categoryId, { ...overlay, edits })
      } else {
        persist(categoryId, {
          ...overlay,
          added: overlay.added.map((p) => (p.id === device.id ? result.product : p)),
        })
      }
      return { ok: true }
    },
    [catalogueFor, overlayOf, persist, seedFor, onPriceChanged],
  )

  const removeDevice = useCallback(
    (categoryId: CategoryId, id: string) => {
      const overlay = overlayOf(categoryId)
      const isSeed = seedFor(categoryId).some((p) => p.id === id)

      if (isSeed) {
        const edits = { ...overlay.edits }
        delete edits[id]
        persist(categoryId, {
          ...overlay,
          edits,
          removed: overlay.removed.includes(id) ? overlay.removed : [...overlay.removed, id],
        })
      } else {
        persist(categoryId, { ...overlay, added: overlay.added.filter((p) => p.id !== id) })
      }
    },
    [overlayOf, persist, seedFor],
  )

  const restoreDevice = useCallback(
    (categoryId: CategoryId, id: string) => {
      const overlay = overlayOf(categoryId)
      persist(categoryId, { ...overlay, removed: overlay.removed.filter((x) => x !== id) })
    },
    [overlayOf, persist],
  )

  const resetCategory = useCallback(
    (categoryId: CategoryId) => {
      clearOverlay(categoryId)
      setOverlays((current) => ({ ...current, [categoryId]: emptyOverlay() }))
      setFootprintBytes(overlayFootprint(CATEGORIES.map((c) => c.id)))
    },
    [],
  )

  const resetEverything = useCallback(() => {
    const cleared: OverlayMap = {}
    for (const category of CATEGORIES) {
      clearOverlay(category.id)
      cleared[category.id] = emptyOverlay()
    }
    setOverlays(cleared)
    setFootprintBytes(0)
  }, [])

  /* ------------------------------------------------------------ transfer */

  const exportJson = useCallback(() => {
    const populated: OverlayMap = {}
    for (const category of CATEGORIES) {
      const overlay = overlayOf(category.id)
      if (overlayStats(overlay).total > 0) populated[category.id] = overlay
    }
    return JSON.stringify(buildTransfer(populated), null, 2)
  }, [overlayOf])

  const importJson = useCallback(
    (json: string) =>
      parseTransfer(json, CATEGORIES as Category[], (id) => seedFor(id).map((p) => p.id)),
    [seedFor],
  )

  const applyImport = useCallback(
    (report: ImportReport) => {
      for (const [categoryId, incoming] of Object.entries(report.overlays)) {
        if (!incoming) continue
        const id = categoryId as CategoryId
        const current = overlayOf(id)
        // Merge rather than replace: an import adds to what you already have.
        const addedIds = new Set(current.added.map((p) => p.id))
        persist(id, {
          ...current,
          edits: { ...current.edits, ...incoming.edits },
          added: [...current.added, ...incoming.added.filter((p) => !addedIds.has(p.id))],
          removed: [...new Set([...current.removed, ...incoming.removed])],
        })
      }
    },
    [overlayOf, persist],
  )

  const totalCustomisations = useMemo(
    () => CATEGORIES.reduce((sum, c) => sum + overlayStats(overlayOf(c.id)).total, 0),
    [overlayOf],
  )

  const value = useMemo<CatalogueValue>(
    () => ({
      ready,
      storage,
      catalogueFor,
      statsFor,
      isUserAdded,
      isEdited,
      seedFor,
      addDevice,
      updateDevice,
      removeDevice,
      restoreDevice,
      resetCategory,
      resetEverything,
      exportJson,
      importJson,
      applyImport,
      footprintBytes,
      totalCustomisations,
    }),
    [
      ready, storage, catalogueFor, statsFor, isUserAdded, isEdited, seedFor, addDevice,
      updateDevice, removeDevice, restoreDevice, resetCategory, resetEverything,
      exportJson, importJson, applyImport, footprintBytes, totalCustomisations,
    ],
  )

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
}

export function useCatalogue(): CatalogueValue {
  const context = useContext(CatalogueContext)
  if (!context) throw new Error('useCatalogue must be used inside CatalogueProvider')
  return context
}
