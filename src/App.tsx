import { getCategory } from '@/data'
import { ProfileProvider } from '@/personalisation/ProfileProvider'
import { AppStateProvider, useAppState } from '@/hooks/useAppState'
import { AppShell } from '@/components/layout/AppShell'
import { HomeScreen } from '@/components/home/HomeScreen'
import { PickerScreen } from '@/components/picker/PickerScreen'
import { CompareScreen } from '@/components/compare/CompareScreen'
import { CollectionScreen } from '@/components/collections/CollectionScreen'

function Router() {
  const { screen, categoryId, collectionKey } = useAppState()
  const category = getCategory(categoryId)

  // A screen that needs a category but doesn't have one falls back home
  // rather than rendering an error — this also covers a hand-edited URL.
  if (screen === 'home' || !category) return <HomeScreen />
  if (screen === 'picker') return <PickerScreen category={category} />
  if (screen === 'collection' && collectionKey) {
    return <CollectionScreen category={category} collectionKey={collectionKey} />
  }
  return <CompareScreen category={category} />
}

export default function App() {
  return (
    <ProfileProvider>
      <AppStateProvider>
        <AppShell>
          <Router />
        </AppShell>
      </AppStateProvider>
    </ProfileProvider>
  )
}
