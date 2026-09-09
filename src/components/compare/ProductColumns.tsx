import type { Category, Product, ScoredProduct } from '@/types'
import { DeviceGlyph } from '@/components/DeviceGlyph'
import { ScoreRing } from '@/components/charts/ScoreRing'
import { Icon } from '@/components/ui/Icon'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { AddProduct } from './AddProduct'

/**
 * Sticky column header that stays aligned with the spec table below it, so
 * you always know which column you're reading 40 rows down.
 */
export function ProductColumns({
  category,
  catalogue,
  scored,
  colors,
  failures,
  onRemove,
  onAdd,
  canRemove,
}: {
  category: Category
  catalogue: Product[]
  scored: ScoredProduct[]
  colors: Record<string, string>
  /** Product id → the must-haves it fails, if any. */
  failures: Record<string, string[]>
  onRemove: (id: string) => void
  onAdd: (id: string) => void
  canRemove: boolean
}) {
  const columns = `minmax(150px, 210px) repeat(${scored.length}, minmax(0, 1fr))`
  const topScore = Math.max(...scored.map((s) => s.overall))

  return (
    <div className="sticky top-16 z-20 -mx-4 hidden border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-xl lg:block">
      {/*
        The transparent border + px-4 reproduce the spec card's box model
        (1px border, 1rem row padding) exactly. Without it the header's
        flexible columns end up ~7px wider than the rows they label, and the
        misalignment compounds across five products.
      */}
      <div
        className="grid items-end gap-x-4 border border-transparent px-4"
        style={{ gridTemplateColumns: columns }}
      >
        <div className="pb-1">
          <p className="mb-1.5 text-[11.5px] font-semibold tracking-[0.08em] text-faint uppercase">
            Comparing {scored.length}
          </p>
          <AddProduct
            category={category}
            catalogue={catalogue}
            selectedIds={scored.map((s) => s.product.id)}
            onAdd={onAdd}
          />
        </div>

        {scored.map((item) => {
          const isTop = item.overall === topScore
          const failed = failures[item.product.id]
          return (
            <div
              key={item.product.id}
              className={cn(
                'group relative flex items-end gap-2.5 rounded-lg border-b-2 px-2 pt-1 pb-2',
                failed && 'opacity-45',
              )}
              style={{ borderColor: colors[item.product.id] }}
            >
              <span className="h-11 w-9 shrink-0">
                <DeviceGlyph
                  category={item.product.category}
                  accent={item.product.accent}
                  glow={false}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10.5px] font-medium tracking-wide text-faint uppercase">
                  {item.product.brand}
                </p>
                <p
                  className={cn(
                    'truncate text-[13px] leading-tight font-semibold text-ink',
                    failed && 'line-through',
                  )}
                >
                  {item.product.name}
                </p>
                {failed ? (
                  <p className="truncate text-[11px] font-medium text-danger">
                    fails {failed.join(', ').toLowerCase()}
                  </p>
                ) : (
                  <p className="tnum mt-0.5 text-[11.5px] text-muted">
                    {formatPrice(item.product.price)}
                  </p>
                )}
              </div>
              <ScoreRing
                value={item.overall}
                color={colors[item.product.id]}
                size={40}
                className={isTop ? '' : 'opacity-90'}
              />
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(item.product.id)}
                  aria-label={`Remove ${item.product.name}`}
                  className="absolute -top-1 right-0 flex h-5 w-5 items-center justify-center rounded-md text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-3 hover:text-danger focus-visible:opacity-100"
                >
                  <Icon name="X" size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
