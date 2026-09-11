import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, Product } from '@/types'
import { MAX_SELECTION } from '@/hooks/useAppState'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { DeviceGlyph } from '@/components/DeviceGlyph'

/**
 * Add another product without leaving the comparison.
 *
 * Bouncing back to the picker loses your scroll position, your priority
 * sliders and your train of thought — which is exactly when you decide it
 * isn't worth checking that fourth option.
 */
export function AddProduct({
  category,
  catalogue,
  selectedIds,
  onAdd,
}: {
  category: Category
  catalogue: Product[]
  selectedIds: string[]
  onAdd: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const full = selectedIds.length >= MAX_SELECTION

  const candidates = useMemo(() => {
    const q = query.toLowerCase().trim()
    return catalogue
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => !q || `${p.brand} ${p.name}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [catalogue, selectedIds, query])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (full) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-line px-2 py-2 text-center">
        <span className="text-[11px] leading-tight text-faint">
          All {MAX_SELECTION} slots full
        </span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex h-full w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-2 py-2',
          'text-[12px] font-medium transition-colors',
          open
            ? 'border-brand text-brand-text'
            : 'border-line text-faint hover:border-line-strong hover:text-muted',
        )}
      >
        <Icon name="Plus" size={14} />
        Add {category.singular}
      </button>

      {open && (
        <div
          className="ts-fade absolute top-full right-0 z-50 mt-2 w-[290px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-float"
          role="listbox"
        >
          <div className="relative border-b border-line">
            <Icon
              name="Search"
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${category.plural}…`}
              aria-label={`Search ${category.plural} to add`}
              className="h-10 w-full bg-transparent pr-3 pl-9 text-[13px] text-ink placeholder:text-faint focus:outline-none"
            />
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12.5px] text-faint">
                {selectedIds.length >= catalogue.length
                  ? 'Everything in this category is already selected.'
                  : `No ${category.plural} match “${query}”.`}
              </p>
            ) : (
              candidates.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onAdd(product.id)
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="h-8 w-7 shrink-0">
                    <DeviceGlyph
                      category={product.category}
                      accent={product.accent}
                      glow={false}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-ink">
                      {product.name}
                    </span>
                    <span className="block text-[11px] text-faint">{product.brand}</span>
                  </span>
                  <span className="tnum shrink-0 text-[11.5px] text-muted">
                    {formatPrice(product.price)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
