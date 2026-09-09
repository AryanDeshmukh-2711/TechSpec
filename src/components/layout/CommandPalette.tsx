import { useEffect, useMemo, useRef, useState } from 'react'
import type { CategoryId, Product } from '@/types'
import { CATEGORIES, getCategory } from '@/data'
import { useCatalogue } from '@/data/store/CatalogueProvider'
import { useProfile } from '@/personalisation/ProfileProvider'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

/**
 * ⌘K. One entry point for everything: jump to a category, find any device
 * across the whole catalogue, or run an action. Replaces the old breadcrumb
 * as the primary way to move around.
 */

export interface Command {
  id: string
  label: string
  hint?: string
  icon: string
  group: string
  keywords?: string
  run: () => void
}

export function CommandPalette({
  open,
  onClose,
  onSelectCategory,
  onOpenDevice,
  actions,
}: {
  open: boolean
  onClose: () => void
  onSelectCategory: (id: CategoryId) => void
  onOpenDevice: (categoryId: CategoryId, product: Product) => void
  actions: Command[]
}) {
  const { catalogueFor } = useCatalogue()
  const { profile } = useProfile()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo<Command[]>(() => {
    const q = query.toLowerCase().trim()

    const categoryCommands: Command[] = CATEGORIES.map((category) => ({
      id: `category-${category.id}`,
      label: category.label,
      hint: `${catalogueFor(category.id).length} devices`,
      icon: category.icon,
      group: 'Categories',
      keywords: category.blurb,
      run: () => onSelectCategory(category.id),
    }))

    // Devices only appear once you type — otherwise the list is 65 rows deep.
    const deviceCommands: Command[] = q
      ? CATEGORIES.flatMap((category) =>
          catalogueFor(category.id)
            .filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(q))
            .slice(0, 6)
            .map((product) => ({
              id: `device-${category.id}-${product.id}`,
              label: product.name,
              hint: `${product.brand} · ${formatPrice(product.price)}`,
              icon: category.icon,
              group: category.label,
              run: () => onOpenDevice(category.id, product),
            })),
        )
      : []

    const recent: Command[] = q
      ? []
      : profile.comparisons.slice(0, 3).map((comparison) => ({
          id: `recent-${comparison.ids.join('-')}`,
          label: comparison.names.join(' vs '),
          hint: getCategory(comparison.category)?.label,
          icon: 'History',
          group: 'Recent',
          run: () => onSelectCategory(comparison.category),
        }))

    return [...recent, ...deviceCommands, ...categoryCommands, ...actions].filter((command) => {
      if (!q) return true
      return `${command.label} ${command.hint ?? ''} ${command.keywords ?? ''}`
        .toLowerCase()
        .includes(q)
    })
  }, [query, catalogueFor, actions, onSelectCategory, onOpenDevice, profile.comparisons])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Wait a frame so the input exists before focusing it.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((i) => Math.min(i + 1, commands.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const command = commands[active]
        if (command) {
          command.run()
          onClose()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, commands, active, onClose])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  let lastGroup = ''

    <div className="ts-no-print fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="ts-fade absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="ts-pop relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-float"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="Search" size={18} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search devices, categories and actions…"
            aria-label="Search devices, categories and actions"
            className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-faint sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
          {commands.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-faint">
              Nothing matches “{query}”.
            </p>
          ) : (
            commands.map((command, index) => {
              const showGroup = command.group !== lastGroup
              lastGroup = command.group
              return (
                <div key={command.id}>
                  {showGroup && (
                    <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">
                      {command.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => {
                      command.run()
                      onClose()
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      index === active ? 'bg-brand-soft' : 'hover:bg-surface-2',
                    )}
                  >
                    <Icon
                      name={command.icon}
                      size={16}
                      className={index === active ? 'text-brand-text' : 'text-faint'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {command.label}
                      </span>
                      {command.hint && (
                        <span className="block truncate text-[11.5px] text-faint">
                          {command.hint}
                        </span>
                      )}
                    </span>
                    {index === active && (
                      <Icon name="ArrowRight" size={14} className="shrink-0 text-brand-text" />
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-surface-2 px-4 py-2.5 text-[11px] text-faint">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-surface px-1">↑</kbd>
            <kbd className="rounded border border-line bg-surface px-1">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-surface px-1">↵</kbd>
            open
          </span>
        </div>
      </div>
    </div>
  )
}
