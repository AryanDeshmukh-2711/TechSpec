import { useEffect, useRef, useState } from 'react'
import type { Category, Product } from '@/types'
import { useLibrary } from '@/data/store/LibraryProvider'
import { suggestTitle } from '@/data/store/savedComparisons'
import { Button, inputClass } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

/**
 * Saves the current comparison as a COMPARISON entity: a title, the
 * COMPARISON_ITEMs, and the priority weights in force at the time — so
 * reopening it reproduces the verdict, not just the product list.
 */
export function SaveComparison({
  category,
  products,
  priorities,
  onToast,
}: {
  category: Category
  products: Product[]
  priorities: Record<string, number>
  onToast: (message: string) => void
}) {
  const { save, savedFor, remove } = useLibrary()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ids = products.map((p) => p.id)
  const existing = savedFor(category.id, ids)

  useEffect(() => {
    if (!open) return
    setTitle(existing?.title ?? suggestTitle(products.map((p) => p.name)))
    requestAnimationFrame(() => inputRef.current?.select())

    const onDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, existing, products])

  const commit = () => {
    save({ category: category.id, products, priorities, title })
    onToast(existing ? 'Comparison updated' : 'Comparison saved')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="ts-no-print relative">
      <Button
        size="sm"
        variant={existing ? 'quiet' : 'secondary'}
        icon={existing ? 'Check' : 'Bookmark'}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {existing ? 'Saved' : 'Save'}
      </Button>

      {open && (
        <div className="ts-pop absolute top-full right-0 z-50 mt-1 w-72 rounded-md border border-line bg-surface p-3 shadow-float">
          <label className="mb-1.5 block text-[12px] font-medium text-ink" htmlFor="save-title">
            Name this comparison
          </label>
          <input
            id="save-title"
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
            className={inputClass()}
            placeholder="Gaming laptop shortlist"
          />
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-faint">
            <Icon name="Info" size={12} className="mt-0.5 shrink-0" />
            Your current priority weights are saved with it, so it reopens exactly as it is
            now.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={commit}>
              {existing ? 'Update' : 'Save'}
            </Button>
            {existing && (
              <Button
                size="sm"
                variant="danger"
                icon="Trash2"
                onClick={() => {
                  remove(existing.id)
                  onToast('Removed from saved')
                  setOpen(false)
                }}
              >
                Remove
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
