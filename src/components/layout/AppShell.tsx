import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CATEGORIES, getCategory } from '@/data'
import { MIN_SELECTION, useAppState, useTheme } from '@/hooks/useAppState'
import { useCatalogue } from '@/data/store/CatalogueProvider'
import { cn } from '@/lib/cn'
import { Button, IconButton } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { CommandPalette, type Command } from './CommandPalette'
import { CatalogueSettings } from './CatalogueSettings'

export function AppShell({ children }: { children: ReactNode }) {
  const {
    screen,
    categoryId,
    selection,
    selectCategory,
    goHome,
    goPicker,
    goCompare,
    toast,
    showToast,
    openEditorFor,
  } = useAppState()
  const { theme, toggle } = useTheme()
  const catalogue = useCatalogue()
  const category = getCategory(categoryId)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ⌘K / Ctrl+K anywhere except while typing in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (event.key === '/' && !typing) {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const actions = useMemo<Command[]>(
    () => [
      {
        id: 'action-home',
        label: 'Go home',
        icon: 'House',
        group: 'Actions',
        run: goHome,
      },
      {
        id: 'action-add-device',
        label: 'Add a device',
        hint: category ? `to ${category.label}` : 'pick a category first',
        icon: 'Plus',
        group: 'Actions',
        keywords: 'new create custom',
        run: () => (categoryId ? openEditorFor(null) : showToast('Choose a category first')),
      },
      {
        id: 'action-settings',
        label: 'Manage your catalogue',
        hint: 'Import, export, reset',
        icon: 'Settings',
        group: 'Actions',
        keywords: 'import export reset storage privacy',
        run: () => setSettingsOpen(true),
      },
      {
        id: 'action-theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? 'Sun' : 'Moon',
        group: 'Actions',
        run: toggle,
      },
    ],
    [goHome, category, categoryId, openEditorFor, showToast, theme, toggle],
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="ts-no-print sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* ------------------------------------------------------------ bar */}
      <header className="ts-no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={goHome}
            className="group flex shrink-0 items-center gap-2.5 rounded-xl pr-2 transition-opacity hover:opacity-80"
            aria-label="TechSpec home"
          >
            <LogoMark />
            <span className="ts-display hidden text-[19px] text-ink sm:block">TechSpec</span>
          </button>

          {/* Category switcher */}
          <nav
            aria-label="Categories"
            className="ts-scroll-x ts-no-scrollbar hidden min-w-0 flex-1 items-center gap-1 md:flex"
          >
            {CATEGORIES.map((entry) => {
              const active = entry.id === categoryId
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectCategory(entry.id)}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-brand-soft text-brand-text'
                      : 'text-muted hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <Icon name={entry.icon} size={15} />
                  {entry.label}
                </button>
              )
            })}
          </nav>

          <div className="flex-1 md:hidden" />

          {/* Search */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] text-faint transition-colors hover:border-line-strong hover:text-muted"
          >
            <Icon name="Search" size={15} />
            <span className="hidden lg:block">Search…</span>
            <kbd className="ml-3 hidden rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium lg:block">
              ⌘K
            </kbd>
          </button>

          {screen !== 'compare' && selection.length >= MIN_SELECTION && (
            <Button size="sm" variant="primary" iconRight="ArrowRight" onClick={goCompare}>
              Compare {selection.length}
            </Button>
          )}

          <IconButton
            icon="Settings"
            label="Manage your catalogue"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className={cn(catalogue.totalCustomisations > 0 && 'text-brand-text')}
          />
          <IconButton
            icon={theme === 'dark' ? 'Sun' : 'Moon'}
            label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            size="sm"
            onClick={toggle}
          />
        </div>

        {/* Mobile category strip */}
        <nav
          aria-label="Categories"
          className="ts-scroll-x ts-no-scrollbar flex items-center gap-1 border-t border-line px-4 py-2 md:hidden"
        >
          {CATEGORIES.map((entry) => {
            const active = entry.id === categoryId
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => selectCategory(entry.id)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium transition-colors',
                  active ? 'bg-brand-soft text-brand-text' : 'text-muted',
                )}
              >
                <Icon name={entry.icon} size={14} />
                {entry.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      {/* --------------------------------------------------------- footer */}
      <footer className="ts-no-print mt-20 border-t border-line bg-surface-2/60">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <LogoMark size={22} />
                <span className="ts-display text-[16px] text-ink">TechSpec</span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
                Comparison weighted your way. Your catalogue, your priorities, stored on your
                device and never uploaded.
              </p>
            </div>
            <div className="max-w-md text-[12px] leading-relaxed text-faint">
              <p className="mb-1.5 font-medium text-muted">About the data</p>
              <p>
                Built-in devices are compiled from manufacturer listings and published test
                results as a starting point, and a few metrics are explicitly editorial. Edit
                anything that looks wrong — it is your catalogue. Verify against the retailer
                before buying.
              </p>
            </div>
          </div>

          {category && screen !== 'home' && (
            <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
              <Button size="sm" variant="ghost" icon="ArrowLeft" onClick={goHome}>
                Home
              </Button>
              {screen === 'compare' && (
                <Button size="sm" variant="ghost" icon="LayoutGrid" onClick={goPicker}>
                  Back to {category.label.toLowerCase()}
                </Button>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* ---------------------------------------------------------- toast */}
      <div
        aria-live="polite"
        className="ts-no-print pointer-events-none fixed inset-x-0 bottom-6 z-[110] flex justify-center px-4"
      >
        {toast && (
          <div className="ts-pop flex items-center gap-2.5 rounded-2xl border border-line-strong bg-surface px-4 py-3 text-[13.5px] font-medium text-ink shadow-float">
            <Icon name="CircleCheck" size={16} className="text-brand-text" />
            {toast}
          </div>
        )}
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectCategory={selectCategory}
        onOpenDevice={(id, product) => {
          selectCategory(id)
          showToast(`Opened ${product.name}`)
        }}
        actions={actions}
      />

      <CatalogueSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onToast={showToast}
      />
    </div>
  )
}

function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[9px] bg-brand"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width={size * 0.66} height={size * 0.66} fill="none">
        <path
          d="M8 21V11M14 21V7M20 21V14M26 21V9"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
