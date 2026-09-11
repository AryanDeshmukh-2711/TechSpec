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
  brandAffinity,
  clearProfile,
  emptyProfile,
  favouritePersona,
  forgetPriorities as dropPriorities,
  hasHistory,
  loadProfile,
  rankCategories,
  recordComparison,
  recordPersona,
  recordView,
  rememberPriorities,
  saveProfile,
  suggestMatchups,
  type Suggestion,
  type UserProfile,
} from './profile'

interface ProfileValue {
  profile: UserProfile
  /**
   * False until the stored profile has been read.
   *
   * Effects run child-first, so a consumer's mount effect fires *before* this
   * provider has hydrated. A read taken then comes back empty — which is how
   * one-shot priority seeding silently replaced remembered weights with
   * neutral defaults. A write taken then is merely wasted, since the load
   * replaces it. Consumers must wait for this before doing either.
   */
  ready: boolean
  hasHistory: boolean
  noteView: (product: Product) => void
  noteComparison: (category: CategoryId, products: Product[]) => void
  notePersona: (personaId: string) => void
  savePriorities: (category: CategoryId, priorities: Record<string, number>) => void
  forgetPriorities: (category: CategoryId) => void
  prioritiesFor: (category: CategoryId) => Record<string, number> | undefined
  orderedCategories: (all: CategoryId[]) => CategoryId[]
  affinity: (lookup: (id: string) => Product | undefined) => Record<string, number>
  suggestions: (catalogueFor: (c: CategoryId) => Product[]) => Suggestion[]
  favouritePersonaId: string | null
  markOnboarded: () => void
  forgetEverything: () => void
}

const ProfileContext = createContext<ProfileValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => emptyProfile())
  const [hydrated, setHydrated] = useState(false)

  // Read once on mount rather than in the initialiser: localStorage is not
  // available during SSR or a prerender, and this keeps first paint pure.
  useEffect(() => {
    setProfile(loadProfile())
    setHydrated(true)
  }, [])

  useEffect(() => {
    // `hydrated` must be state, not a ref. Both mount effects run in the same
    // commit, so a ref would already read `true` here while `profile` still
    // held the empty initial value — saving it straight over the user's real
    // stored profile. Gating on state defers this until the render that
    // actually carries the loaded data.
    if (!hydrated) return
    saveProfile(profile)
  }, [profile, hydrated])

  const noteView = useCallback((product: Product) => {
    setProfile((current) => recordView(current, product))
  }, [])

  const noteComparison = useCallback((category: CategoryId, products: Product[]) => {
    setProfile((current) => recordComparison(current, category, products))
  }, [])

  const notePersona = useCallback((personaId: string) => {
    setProfile((current) => recordPersona(current, personaId))
  }, [])

  const savePriorities = useCallback(
    (category: CategoryId, priorities: Record<string, number>) => {
      setProfile((current) => rememberPriorities(current, category, priorities))
    },
    [],
  )

  const forgetPriorities = useCallback((category: CategoryId) => {
    setProfile((current) => dropPriorities(current, category))
  }, [])

  const prioritiesFor = useCallback(
    (category: CategoryId) => profile.priorities[category],
    [profile.priorities],
  )

  const orderedCategories = useCallback(
    (all: CategoryId[]) => rankCategories(profile, all),
    [profile],
  )

  const affinity = useCallback(
    (lookup: (id: string) => Product | undefined) => brandAffinity(profile, lookup),
    [profile],
  )

  const suggestions = useCallback(
    (catalogueFor: (c: CategoryId) => Product[]) => suggestMatchups(profile, catalogueFor),
    [profile],
  )

  const markOnboarded = useCallback(() => {
    setProfile((current) => (current.onboarded ? current : { ...current, onboarded: true }))
  }, [])

  const forgetEverything = useCallback(() => {
    clearProfile()
    setProfile(emptyProfile())
  }, [])

  const value = useMemo<ProfileValue>(
    () => ({
      profile,
      ready: hydrated,
      hasHistory: hasHistory(profile),
      noteView,
      noteComparison,
      notePersona,
      savePriorities,
      forgetPriorities,
      prioritiesFor,
      orderedCategories,
      affinity,
      suggestions,
      favouritePersonaId: favouritePersona(profile),
      markOnboarded,
      forgetEverything,
    }),
    [
      profile, hydrated, noteView, noteComparison, notePersona, savePriorities,
      forgetPriorities, prioritiesFor,
      orderedCategories, affinity, suggestions, markOnboarded, forgetEverything,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileValue {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used inside ProfileProvider')
  return context
}
