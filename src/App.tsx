import type { ReactNode } from 'react'
import { getCategory } from '@/data'
import { CatalogueProvider } from '@/data/store/CatalogueProvider'
import { LibraryProvider, useLibrary } from '@/data/store/LibraryProvider'
import { ProfileProvider } from '@/personalisation/ProfileProvider'
import { AppStateProvider, useAppState } from '@/hooks/useAppState'
import { AppShell } from '@/components/layout/AppShell'
import { HomeScreen } from '@/components/home/HomeScreen'
import { PickerScreen } from '@/components/picker/PickerScreen'
import { CompareScreen } from '@/components/compare/CompareScreen'
import { CollectionScreen } from '@/components/collections/CollectionScreen'
import { DeviceEditor } from '@/components/devices/DeviceEditor'

function Router() {
  const { screen, categoryId, editorTarget, closeEditor, showToast, toggleProduct, selection, collectionKey } =
    useAppState()
  const category = getCategory(categoryId)

  // A screen that needs a category but doesn't have one falls back home
  // rather than rendering an error — this also covers a hand-edited URL.
  const view =
    screen === 'home' || !category ? (
      <HomeScreen />
    ) : screen === 'picker' ? (
      <PickerScreen category={category} />
    ) : screen === 'collection' && collectionKey ? (
      <CollectionScreen category={category} collectionKey={collectionKey} />
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

/**
 * The catalogue reports price corrections into PRICE_HISTORY, so it has to sit
 * inside the library rather than outside it. This bridge is the only reason
 * the provider order is Library → Catalogue and not the other way round.
 */
function CatalogueBridge({ children }: { children: ReactNode }) {
  const { trackPrice } = useLibrary()
  return <CatalogueProvider onPriceChanged={trackPrice}>{children}</CatalogueProvider>
}

export default function App() {
  return (
    <LibraryProvider>
      <CatalogueBridge>
        <ProfileProvider>
          <AppStateProvider>
            <AppShell>
              <Router />
            </AppShell>
          </AppStateProvider>
        </ProfileProvider>
      </CatalogueBridge>
    </LibraryProvider>
  )
}
