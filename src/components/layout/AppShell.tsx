import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getCategory } from '@/data'
import { MIN_SELECTION, useAppState, useTheme } from '@/hooks/useAppState'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { CommandPalette, type Command } from './CommandPalette'
import { CatalogueSettings } from './CatalogueSettings'

/**
 * The header holds four things: where you are, search, the one action that
 * matters right now, and a menu for everything else. Category navigation
 * lives on the page and in the palette — it does not belong in a bar that is
 * on screen at all times.
 */
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
  const category = getCategory(categoryId)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ⌘K / Ctrl+K anywhere; / opens the palette when not typing in a field.
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

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const actions = useMemo<Command[]>(
    () => [
      { id: 'action-home', label: 'Go home', icon: 'House', group: 'Actions', run: goHome },
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
        className="ts-no-print sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="ts-no-print sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-[1280px] items-center gap-2 px-4">
          {/* Where you are */}
          <button
            type="button"
            onClick={goHome}
            className="flex shrink-0 items-center gap-2 rounded-md text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-70"
          >
            <LogoMark />
            TechSpec
          </button>

          {category && (
            <>
              <Icon name="ChevronRight" size={13} className="shrink-0 text-faint" />
              <button
                type="button"
                onClick={goPicker}
                className={cn(
                  'shrink-0 truncate rounded-md px-1.5 py-1 text-[13px] transition-colors',
                  screen === 'picker' ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {category.label}
              </button>
            </>
          )}

          <div className="min-w-0 flex-1" />

          {/* Search */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[12.5px] text-faint transition-colors hover:border-line-strong hover:text-muted"
          >
            <Icon name="Search" size={14} />
            <span className="hidden sm:block">Search</span>
            <kbd className="ml-2 hidden rounded border border-line px-1 text-[10px] sm:block">
              ⌘K
            </kbd>
          </button>

          {/* The one action that matters right now */}
          {screen !== 'compare' && selection.length >= MIN_SELECTION && (
            <Button size="sm" variant="primary" onClick={goCompare}>
              Compare {selection.length}
            </Button>
          )}

          {/* Everything else */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="More"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Icon name="Ellipsis" size={16} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="ts-pop absolute top-full right-0 z-50 mt-1 w-52 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-float"
              >
                {category && (
                  <MenuItem
                    icon="Plus"
                    label={`Add a ${category.singular}`}
                    onClick={() => {
                      openEditorFor(null)
                      setMenuOpen(false)
                    }}
                  />
                )}
                <MenuItem
                  icon="Settings"
                  label="Your catalogue"
                  onClick={() => {
                    setSettingsOpen(true)
                    setMenuOpen(false)
                  }}
                />
                <MenuItem
                  icon={theme === 'dark' ? 'Sun' : 'Moon'}
                  label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                  onClick={() => {
                    toggle()
                    setMenuOpen(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="ts-no-print mt-16 border-t border-line">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6">
          <p className="text-[11.5px] leading-relaxed text-faint">
            Specs are a starting point compiled from manufacturer listings and published tests —
            edit anything that looks wrong, it's your catalogue. Stored on this device only.
            Verify against the retailer before buying.
          </p>
        </div>
      </footer>

      <div
        aria-live="polite"
        className="ts-no-print pointer-events-none fixed inset-x-0 bottom-5 z-[110] flex justify-center px-4"
      >
        {toast && (
          <div className="ts-pop flex items-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-2 text-[12.5px] font-medium text-ink shadow-float">
            <Icon name="CircleCheck" size={14} className="text-best" />
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

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] text-ink transition-colors hover:bg-surface-2"
    >
      <Icon name={icon} size={14} className="text-faint" />
      {label}
    </button>
  )
}

function LogoMark() {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand"
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width="13" height="13" fill="none">
        <path
          d="M8 21V11M14 21V7M20 21V14M26 21V9"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
