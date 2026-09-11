import type { Category, Product } from '@/types'
import { MAX_SELECTION, MIN_SELECTION } from '@/hooks/useAppState'
import { DeviceGlyph } from '@/components/DeviceGlyph'
import { Button } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * Sticky bottom tray. Always shows five slots so the "2 to 5" rule is legible
 * without reading any instructions.
 */
export function CompareTray({
  selected,
  category,
  onRemove,
  onClear,
  onCompare,
}: {
  selected: Product[]
  category: Category
  onRemove: (id: string) => void
  onClear: () => void
  onCompare: () => void
}) {
  const ready = selected.length >= MIN_SELECTION
  const slots = Array.from({ length: MAX_SELECTION }, (_, i) => selected[i] ?? null)

  return (
    <div className="sticky bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="ts-scroll-x ts-no-scrollbar flex min-w-0 flex-1 items-center gap-2">
            {slots.map((product, index) =>
              product ? (
                <div
                  key={product.id}
                  className="ts-pop flex shrink-0 items-center gap-2 rounded-md border bg-surface py-1 pr-1.5 pl-1.5"
                  style={{ borderColor: seriesColor(index) }}
                >
                  <span className="h-8 w-6 shrink-0">
                    <DeviceGlyph category={product.category} accent={product.accent} glow={false} />
                  </span>
                  <span className="max-w-[132px] truncate text-[12.5px] font-medium text-ink">
                    {product.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remove ${product.name} from comparison`}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Icon name="X" size={13} />
                  </button>
                </div>
              ) : (
                <div
                  key={`empty-${index}`}
                  className={cn(
                    'flex h-[42px] shrink-0 items-center gap-2 rounded-md border border-dashed px-3',
                    index < MIN_SELECTION ? 'border-line-strong' : 'border-line',
                  )}
                >
                  <Icon name="Plus" size={14} className="text-faint" />
                  <span className="text-[12px] text-faint">
                    {index < MIN_SELECTION ? 'Required' : `Slot ${index + 1}`}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear} className="hidden sm:inline-flex">
                Clear
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              iconRight="ArrowRight"
              onClick={onCompare}
              disabled={!ready}
            >
              <span className="hidden sm:inline">
                {ready
                  ? `Compare ${selected.length} ${category.plural}`
                  : `Add ${MIN_SELECTION - selected.length} more`}
              </span>
              <span className="sm:hidden">{ready ? `Compare ${selected.length}` : 'Compare'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
