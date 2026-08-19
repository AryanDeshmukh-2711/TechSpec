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
import { fetchCatalogue, getCategory } from '@/data'
import { EMPTY_FILTERS } from '@/lib/filters'
import { defaultPriorities } from '@/lib/scoring'
import { parseUrl, writeUrl } from '@/lib/urlState'

export const MAX_SELECTION = 5
export const MIN_SELECTION = 2

const RECENTS_KEY = 'techspec:recents'
const MAX_RECENTS = 6

export interface RecentComparison {
  category: CategoryId
  ids: string[]
  names: string[]
  at: number
}

interface AppStateValue {
  screen: Screen
  categoryId: CategoryId | null
  selection: string[]
  priorities: Record<string, number>
  filters: PickerFilters
  catalogue: Product[]
  loadState: LoadState
  recents: RecentComparison[]
  toast: string | null

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
  showToast: (message: string) => void 
  /** Products in the current selection, in selection order. */
  selected: Product[]
}

const AppStateContext = createContext<AppStateValue | null>(null)

function readRecents(): RecentComparison[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RecentComparison[]).slice(0, MAX_RECENTS) : []
  } catch {
    return []
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const initial = useRef(parseUrl()).current

  const [screen, setScreen] = useState<Screen>(initial.screen)
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initial.category)
  const [selection, setSelectionState] = useState<string[]>(initial.selection)
  const [priorities, setPrioritiesState] = useState<Record<string, number>>(initial.priorities)
  const [filters, setFilters] = useState<PickerFilters>(EMPTY_FILTERS)
  const [catalogue, setCatalogue] = useState<Product[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [recents, setRecents] = useState<RecentComparison[]>(() => readRecents())
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  /* ------------------------------------------------------- data loading */

  useEffect(() => {
    if (!categoryId) {
      setCatalogue([])
      setLoadState('idle')
      return
    }
    let cancelled = false
    setLoadState('loading')
    fetchCatalogue(categoryId)
      .then((products) => {
        if (cancelled) return
        setCatalogue(products)
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [categoryId])

  /* --------------------------------------------------------- priorities */

  // Seed defaults for a category's pillars, preserving anything the URL set.
  useEffect(() => {
    const category = getCategory(categoryId)
    if (!category) return
    setPrioritiesState((current) => {
      const defaults = defaultPriorities(category)
      const merged = { ...defaults }
      for (const [key, value] of Object.entries(current)) {
        if (key in defaults) merged[key] = value
      }
      return merged
    })
  }, [categoryId])

  /* ------------------------------------------------------------ URL sync */

  // One history entry per navigation. Priority sliders mutate the current
  // entry instead of stacking one per drag tick.
  const lastNavKey = useRef<string | null>(null)
  useEffect(() => {
    const navKey = `${screen}|${categoryId ?? ''}|${selection.join(',')}`
    const isNavigation = lastNavKey.current !== null && lastNavKey.current !== navKey
    writeUrl(
      { screen, category: categoryId, selection, priorities },
      isNavigation ? 'push' : 'replace',
    )
    lastNavKey.current = navKey
  }, [screen, categoryId, selection, priorities])

  useEffect(() => {
    const onPopState = () => {
      const next = parseUrl()
      setScreen(next.screen)
      setCategoryId(next.category)
      setSelectionState(next.selection)
      if (Object.keys(next.priorities).length) setPrioritiesState(next.priorities)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  /* --------------------------------------------------------------- toast */

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /* ------------------------------------------------------------- actions */

  const selectCategory = useCallback((id: CategoryId) => {
    setCategoryId(id)
    setSelectionState([])
    setFilters(EMPTY_FILTERS)
    setScreen('picker')
  }, [])

  const toggleProduct = useCallback(
    (id: string) => {
      setSelectionState((current) => {
        if (current.includes(id)) return current.filter((x) => x !== id)
        if (current.length >= MAX_SELECTION) {
          showToast(`You can compare up to ${MAX_SELECTION} at once`)
          return current
        }
        return [...current, id]
      })
    },
    [showToast],
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
  }, [])

  const goPicker = useCallback(() => setScreen('picker'), [])

  const selected = useMemo(() => {
    const byId = new Map(catalogue.map((p) => [p.id, p]))
    return selection.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
  }, [catalogue, selection])

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
    setFilters(EMPTY_FILTERS)
    setScreen('compare')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  /* ------------------------------------------------- recent comparisons */

  useEffect(() => {
    if (screen !== 'compare' || !categoryId || selected.length < MIN_SELECTION) return
    const entry: RecentComparison = {
      category: categoryId,
      ids: selected.map((p) => p.id),
      names: selected.map((p) => p.name),
      at: Date.now(),
    }
    setRecents((current) => {
      const key = entry.ids.join(',')
      const next = [entry, ...current.filter((r) => r.ids.join(',') !== key)].slice(0, MAX_RECENTS)
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {
        // Storage can be unavailable (private mode, quota) — recents are a
        // convenience, never a requirement.
      }
      return next
    })
  }, [screen, categoryId, selected])

  const value = useMemo<AppStateValue>(
    () => ({
      screen,
      categoryId,
      selection,
      priorities,
      filters,
      catalogue,
      loadState,
      recents,
      toast,
      selected,
      selectCategory,
      toggleProduct,
      removeProduct,
      clearSelection,
      setSelection,
      setPriority,
      setPriorities: setPrioritiesState,
      resetPriorities,
      patchFilters,
      resetFilters,
      goHome,
      goPicker,
      goCompare,
      startMatchup,
      showToast,
    }),
    [
      screen, categoryId, selection, priorities, filters, catalogue, loadState, recents,
      toast, selected, selectCategory, toggleProduct, removeProduct, clearSelection,
      setSelection, setPriority, resetPriorities, patchFilters, resetFilters, goHome,
      goPicker, goCompare, startMatchup, showToast,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}

/* ---------------------------------------------------------------- theme */

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
