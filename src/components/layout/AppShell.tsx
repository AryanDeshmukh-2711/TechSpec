import type { ReactNode } from 'react'
import { getCategory } from '@/data'
import { MIN_SELECTION, useAppState, useTheme } from '@/hooks/useAppState'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

export function AppShell({ children }: { children: ReactNode }) {
  const { screen, categoryId, selection, goHome, goPicker, goCompare, toast } = useAppState()
  const { theme, toggle } = useTheme()
  const category = getCategory(categoryId)

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="ts-no-print sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="ts-no-print sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={goHome}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
            aria-label="TechSpec home"
          >
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              Tech<span className="text-brand-text">Spec</span>
            </span>
          </button>

          {category && (
            <>
              <Icon name="ChevronRight" size={14} className="text-faint" />
              <button
                type="button"
                onClick={goPicker}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors',
                  screen === 'picker' ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                <Icon name={category.icon} size={14} />
                <span className="hidden sm:inline">{category.label}</span>
              </button>
            </>
          )}

          <div className="flex-1" />

          {screen !== 'compare' && selection.length >= MIN_SELECTION && (
            <Button size="sm" variant="primary" iconRight="ArrowRight" onClick={goCompare}>
              Compare {selection.length}
            </Button>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={16} />
          </button>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="ts-no-print mt-16 border-t border-line py-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 text-[12px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-1.5">
            <LogoMark size={14} />
            TechSpec — comparison weighted your way.
          </p>
          <p className="max-w-md leading-relaxed">
            Specs are compiled from manufacturer listings and published test results, and are
            provided for comparison only. Verify against the retailer before buying.
          </p>
        </div>
      </footer>

      {/* Toast */}
      <div
        aria-live="polite"
        className="ts-no-print pointer-events-none fixed inset-x-0 bottom-6 z-100 flex justify-center px-4"
      >
        {toast && (
          <div className="ts-rise flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-[13px] font-medium text-ink shadow-float">
            <Icon name="Info" size={14} className="text-brand-text" />
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[7px] bg-brand"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width={size * 0.7} height={size * 0.7} fill="none">
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
