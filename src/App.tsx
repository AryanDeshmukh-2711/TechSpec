import { getCategory } from '@/data'
import { AppStateProvider, useAppState } from '@/hooks/useAppState'
import { AppShell } from '@/components/layout/AppShell'
import { HomeScreen } from '@/components/home/HomeScreen'
import { PickerScreen } from '@/components/picker/PickerScreen'
import { CompareScreen } from '@/components/compare/CompareScreen'

function Router() {
  const { screen, categoryId } = useAppState()
  const category = getCategory(categoryId)

  // A screen that needs a category but doesn't have one falls back home
  // rather than rendering an error — this also covers a hand-edited URL.
  if (screen === 'home' || !category) return <HomeScreen />
  if (screen === 'picker') return <PickerScreen category={category} />
  return <CompareScreen category={category} />
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell>
        <Router />
      </AppShell>
    </AppStateProvider>
  )
}
