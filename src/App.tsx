import { getCategory } from '@/data'
import { CatalogueProvider } from '@/data/store/CatalogueProvider'
import { ProfileProvider } from '@/personalisation/ProfileProvider'
import { AppStateProvider, useAppState } from '@/hooks/useAppState'
import { AppShell } from '@/components/layout/AppShell'
import { HomeScreen } from '@/components/home/HomeScreen'
import { PickerScreen } from '@/components/picker/PickerScreen'
import { CompareScreen } from '@/components/compare/CompareScreen'
import { DeviceEditor } from '@/components/devices/DeviceEditor'

function Router() {
  const { screen, categoryId, editorTarget, closeEditor, showToast, toggleProduct, selection } =
    useAppState()
  const category = getCategory(categoryId)

  // A screen that needs a category but doesn't have one falls back home
  // rather than rendering an error — this also covers a hand-edited URL.
  const view =
    screen === 'home' || !category ? (
      <HomeScreen />
    ) : screen === 'picker' ? (
      <PickerScreen category={category} />
    ) : (
      <CompareScreen category={category} />
    )

  return (
    <>
      {view}
      {category && editorTarget !== undefined && (
        <DeviceEditor
          category={category}
          target={editorTarget}
          onClose={closeEditor}
          onToast={showToast}
          onSaved={(product) => {
            // A device you just created is almost always one you want to
            // compare, so drop it straight into an open slot.
            if (editorTarget === null && !selection.includes(product.id)) {
              toggleProduct(product.id)
            }
          }}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <CatalogueProvider>
      <ProfileProvider>
        <AppStateProvider>
          <AppShell>
            <Router />
          </AppShell>
        </AppStateProvider>
      </ProfileProvider>
    </CatalogueProvider>
  )
}
