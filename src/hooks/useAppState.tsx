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
import { getCategory } from '@/data'
import { useCatalogue } from '@/data/store/CatalogueProvider'
import { useProfile } from '@/personalisation/ProfileProvider'
import { EMPTY_FILTERS } from '@/lib/filters'
import { defaultPriorities } from '@/lib/scoring'
import { parseUrl, writeUrl } from '@/lib/urlState'

export const MAX_SELECTION = 5
export const MIN_SELECTION = 2

/** `undefined` = editor closed, `null` = creating, `Product` = editing. */
export type EditorTarget = Product | null | undefined

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
  editorTarget: EditorTarget

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
  openEditorFor: (product: Product | null) => void
  closeEditor: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const initial = useRef(parseUrl()).current
  const store = useCatalogue()
  const profile = useProfile()

  const [screen, setScreen] = useState<Screen>(initial.screen)
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initial.category)
  const [selection, setSelectionState] = useState<string[]>(initial.selection)
  const [priorities, setPrioritiesState] = useState<Record<string, number>>(initial.priorities)
  const [filters, setFilters] = useState<PickerFilters>(EMPTY_FILTERS)
  const [toast, setToast] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(undefined)
  const toastTimer = useRef<number | undefined>(undefined)

  /* ------------------------------------------------------------- catalogue */

  // The catalogue is now resolved synchronously from seed + the user's
  // overlay, so the only asynchronous step left is reading storage once.
  const catalogue = useMemo(
    () => (categoryId ? store.catalogueFor(categoryId) : []),
    [categoryId, store],
  )

  const loadState: LoadState = !categoryId ? 'idle' : store.ready ? 'ready' : 'loading'

  /* ------------------------------------------------------------ priorities */

  // Seed from what the user last chose for this category, then the URL, then
  // neutral. Remembering priorities is the whole point of asking for them.
  const seededFor = useRef<CategoryId | null>(null)
  useEffect(() => {
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
    if (!categoryId || !Object.keys(priorities).length) return
    const timer = window.setTimeout(() => profile.savePriorities(categoryId, priorities), 600)
    return () => window.clearTimeout(timer)
    // profile is intentionally omitted: it changes identity on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, priorities])

  /* ---------------------------------------------------------------- URL sync */

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
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goPicker = useCallback(() => setScreen('picker'), [])

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

  const openEditorFor = useCallback((product: Product | null) => setEditorTarget(product), [])
  const closeEditor = useCallback(() => setEditorTarget(undefined), [])

  /* --------------------------------------------------- comparison history */

  useEffect(() => {
    if (screen !== 'compare' || !categoryId || selected.length < MIN_SELECTION) return
    profile.noteComparison(categoryId, selected)
    // Recording once per settled comparison, not on every profile identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, categoryId, selected.map((p) => p.id).join(',')])

  const value = useMemo<AppStateValue>(
    () => ({
      screen, categoryId, selection, priorities, filters, catalogue, loadState, toast,
      selected, editorTarget,
      selectCategory, toggleProduct, removeProduct, clearSelection, setSelection,
      setPriority, setPriorities: setPrioritiesState, resetPriorities, patchFilters,
      resetFilters, goHome, goPicker, goCompare, startMatchup, showToast,
      openEditorFor, closeEditor,
    }),
    [
      screen, categoryId, selection, priorities, filters, catalogue, loadState, toast,
      selected, editorTarget, selectCategory, toggleProduct, removeProduct, clearSelection,
      setSelection, setPriority, resetPriorities, patchFilters, resetFilters, goHome,
      goPicker, goCompare, startMatchup, showToast, openEditorFor, closeEditor,
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
