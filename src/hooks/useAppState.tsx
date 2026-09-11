import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CategoryId, LoadState, PickerFilters, Product, Screen } from '@/types'
import { catalogueFor, getCategory } from '@/data'
import { useProfile } from '@/personalisation/ProfileProvider'
import { EMPTY_FILTERS } from '@/lib/filters'
import { defaultPriorities } from '@/lib/scoring'
import { parseUrl, writeUrl } from '@/lib/urlState'

export const MAX_SELECTION = 5
export const MIN_SELECTION = 2

interface AppStateValue {
  screen: Screen
  categoryId: CategoryId | null
  selection: string[]
  priorities: Record<string, number>
  filters: PickerFilters
  catalogue: Product[]
  loadState: LoadState
  toast: string | null
  selected: Product[]
  collectionKey: string | null

  selectCategory: (id: CategoryId) => void
  toggleProduct: (id: string) => void
  removeProduct: (id: string) => void
  clearSelection: () => void
  setSelection: (ids: string[]) => void
  setPriority: (pillarId: string, value: number) => void
  setPriorities: (next: Record<string, number>) => void
  resetPriorities: () => void
  patchFilters: (patch: Partial<PickerFilters>) => void
  resetFilters: () => void
  goHome: () => void
  goPicker: () => void
  goCompare: () => void
  startMatchup: (category: CategoryId, ids: string[]) => void
  showDevice: (category: CategoryId, productId: string) => void
  showToast: (message: string) => void
  openCollection: (category: CategoryId, key: string) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const initial = useRef(parseUrl()).current
  const profile = useProfile()

  const [screen, setScreen] = useState<Screen>(initial.screen)
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initial.category)
  const [selection, setSelectionState] = useState<string[]>(initial.selection)
  const [priorities, setPrioritiesState] = useState<Record<string, number>>(initial.priorities)
  const [filters, setFilters] = useState<PickerFilters>(EMPTY_FILTERS)
  const [toast, setToast] = useState<string | null>(null)
  const [collectionKey, setCollectionKey] = useState<string | null>(
    initial.collection ?? null,
  )
  const toastTimer = useRef<number | undefined>(undefined)

  /* ------------------------------------------------------------- catalogue */

  // The catalogue is bundled with the app, so there is nothing to wait for —
  // picking a category is the only thing that makes it non-empty.
  const catalogue = useMemo(() => catalogueFor(categoryId), [categoryId])

  const loadState: LoadState = categoryId ? 'ready' : 'idle'

  /* ------------------------------------------------------------ priorities */

  // Seed from what the user last chose for this category, then the URL, then
  // neutral. Remembering priorities is the whole point of asking for them.
  const seededFor = useRef<CategoryId | null>(null)
  useEffect(() => {
    // Wait for the stored profile: seeding is one-shot per category, so doing
    // it against an unhydrated profile would silently discard the weights the
    // user set last time.
    if (!profile.ready) return
    const category = getCategory(categoryId)
    if (!category || seededFor.current === categoryId) return
    seededFor.current = categoryId

    const defaults = defaultPriorities(category)
    const remembered = profile.prioritiesFor(category.id) ?? {}
    const fromUrl = initial.category === category.id ? initial.priorities : {}

    const merged = { ...defaults }
    for (const [key, value] of Object.entries({ ...remembered, ...fromUrl })) {
      if (key in defaults) merged[key] = value
    }
    setPrioritiesState(merged)
  }, [categoryId, profile, initial])

  // Persist priority changes so the next visit starts where this one ended.
  useEffect(() => {
    if (!profile.ready || !categoryId) return
    const category = getCategory(categoryId)
    if (!category || !Object.keys(priorities).length) return

    const defaults = defaultPriorities(category)
    const neutral = Object.entries(defaults).every(([id, value]) => priorities[id] === value)

    const timer = window.setTimeout(() => {
      // Neutral is the absence of a preference, not one worth storing. Writing
      // it back would leave the previous weights in place, so resetting the
      // sliders — or clearing history — would silently restore them next visit.
      if (neutral) profile.forgetPriorities(categoryId)
      else profile.savePriorities(categoryId, priorities)
    }, 600)
    return () => window.clearTimeout(timer)
    // profile is intentionally omitted: it changes identity on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.ready, categoryId, priorities])

  /* ---------------------------------------------------------------- URL sync */

  const lastNavKey = useRef<string | null>(null)
  useEffect(() => {
    const navKey = `${screen}|${categoryId ?? ''}|${selection.join(',')}`
    const isNavigation = lastNavKey.current !== null && lastNavKey.current !== navKey
    writeUrl(
      {
        screen,
        category: categoryId,
        selection,
        priorities,
        ...(collectionKey ? { collection: collectionKey } : {}),
      },
      isNavigation ? 'push' : 'replace',
    )
    lastNavKey.current = navKey
  }, [screen, categoryId, selection, priorities, collectionKey])

  useEffect(() => {
    const onPopState = () => {
      const next = parseUrl()
      setScreen(next.screen)
      setCategoryId(next.category)
      setSelectionState(next.selection)
      setCollectionKey(next.collection ?? null)
      if (Object.keys(next.priorities).length) setPrioritiesState(next.priorities)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  /* ------------------------------------------------------------------ toast */

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /* ---------------------------------------------------------------- actions */

  const selectCategory = useCallback((id: CategoryId) => {
    setCategoryId(id)
    setSelectionState([])
    setCollectionKey(null)
    setFilters(EMPTY_FILTERS)
    setScreen('picker')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const selected = useMemo(() => {
    const byId = new Map(catalogue.map((p) => [p.id, p]))
    return selection.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
  }, [catalogue, selection])

  const toggleProduct = useCallback(
    (id: string) => {
      setSelectionState((current) => {
        if (current.includes(id)) return current.filter((x) => x !== id)
        if (current.length >= MAX_SELECTION) {
          showToast(`You can compare up to ${MAX_SELECTION} at once`)
          return current
        }
        const product = catalogue.find((p) => p.id === id)
        if (product) profile.noteView(product)
        return [...current, id]
      })
    },
    [showToast, catalogue, profile],
  )

  const removeProduct = useCallback((id: string) => {
    setSelectionState((current) => current.filter((x) => x !== id))
  }, [])

  const clearSelection = useCallback(() => setSelectionState([]), [])

  const setSelection = useCallback((ids: string[]) => {
    setSelectionState(ids.slice(0, MAX_SELECTION))
  }, [])

  const setPriority = useCallback((pillarId: string, value: number) => {
    setPrioritiesState((current) => ({ ...current, [pillarId]: value }))
  }, [])

  const resetPriorities = useCallback(() => {
    const category = getCategory(categoryId)
    if (category) setPrioritiesState(defaultPriorities(category))
  }, [categoryId])

  const patchFilters = useCallback((patch: Partial<PickerFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }, [])

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), [])

  const goHome = useCallback(() => {
    setScreen('home')
    setCategoryId(null)
    setSelectionState([])
    setCollectionKey(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goPicker = useCallback(() => {
    setCollectionKey(null)
    setScreen('picker')
  }, [])

  const goCompare = useCallback(() => {
    if (selection.length < MIN_SELECTION) {
      showToast(`Pick at least ${MIN_SELECTION} to compare`)
      return
    }
    setScreen('compare')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [selection.length, showToast])

  const startMatchup = useCallback((category: CategoryId, ids: string[]) => {
    setCategoryId(category)
    setSelectionState(ids.slice(0, MAX_SELECTION))
    setCollectionKey(null)
    setFilters(EMPTY_FILTERS)
    setScreen('compare')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Searching for a device should land you somewhere you can act on it: its
  // category, with it already in the tray waiting for something to compare to.
  const showDevice = useCallback(
    (category: CategoryId, productId: string) => {
      // Reaching a device through search is still looking at it, so it has to
      // be recorded like a click on its card — the home feed is built from
      // these, and it would otherwise be blind to anything found by searching.
      const product = catalogueFor(category).find((p) => p.id === productId)
      if (product) profile.noteView(product)

      setCategoryId(category)
      setSelectionState(product ? [productId] : [])
      setCollectionKey(null)
      setFilters(EMPTY_FILTERS)
      setScreen('picker')
      window.scrollTo({ top: 0, behavior: 'instant' })
    },
    [profile],
  )

  const openCollection = useCallback((category: CategoryId, key: string) => {
    setCategoryId(category)
    setCollectionKey(key)
    setScreen('collection')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  /* --------------------------------------------------- comparison history */

  useEffect(() => {
    // Writing into a profile that is about to be replaced by the stored one is
    // wasted work, not a loss — StrictMode's second effect pass re-records it.
    // The guard is here so the write happens once, against real data.
    if (!profile.ready) return
    if (screen !== 'compare' || !categoryId || selected.length < MIN_SELECTION) return
    profile.noteComparison(categoryId, selected)
    // Recording once per settled comparison, not on every profile identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.ready, screen, categoryId, selected.map((p) => p.id).join(',')])

  const value = useMemo<AppStateValue>(
    () => ({
      screen, categoryId, selection, priorities, filters, catalogue, loadState, toast,
      selected, collectionKey,
      openCollection,
      selectCategory, toggleProduct, removeProduct, clearSelection, setSelection,
      setPriority, setPriorities: setPrioritiesState, resetPriorities, patchFilters,
      resetFilters, goHome, goPicker, goCompare, startMatchup, showDevice, showToast,
    }),
    [
      screen, categoryId, selection, priorities, filters, catalogue, loadState, toast,
      selected, collectionKey, openCollection,
      selectCategory, toggleProduct, removeProduct, clearSelection,
      setSelection, setPriority, resetPriorities, patchFilters, resetFilters, goHome,
      goPicker, goCompare, startMatchup, showDevice, showToast,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}

/* ------------------------------------------------------------------- theme */

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.documentElement.classList.toggle('light', next === 'light')
      try {
        localStorage.setItem('techspec:theme', next)
      } catch {
        // Preference simply won't persist.
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
