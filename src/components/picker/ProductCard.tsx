import type { Category, Product } from '@/types'
import { DeviceGlyph } from '@/components/DeviceGlyph'
import { Icon } from '@/components/ui/Icon'
import { StarRating } from '@/components/ui/primitives'
import { formatPrice, formatSpec } from '@/lib/format'
import { cn } from '@/lib/cn'

export function ProductCard({
  product,
  category,
  selected,
  slotColor,
  disabled,
  onToggle,
}: {
  product: Product
  category: Category
  selected: boolean
  /** Series colour for the slot this product occupies, when selected. */
  slotColor?: string
  disabled?: boolean
  onToggle: () => void
}) {
  const specByKey = new Map(category.specs.map((s) => [s.key, s]))

  return (
    <div
      className={cn(
        'group ts-card relative flex flex-col overflow-hidden transition-all duration-200',
        selected
          ? 'border-transparent ring-2'
          : 'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float',
        disabled && !selected && 'opacity-55',
      )}
      style={selected ? ({ '--tw-ring-color': slotColor } as React.CSSProperties) : undefined}
    >
      {selected && (
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: slotColor }}
          aria-hidden
        />
      )}

      <div className="flex gap-4 p-4">
        <div className="relative h-[86px] w-[70px] shrink-0">
          <DeviceGlyph category={product.category} accent={product.accent} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
            {product.brand}
          </p>
          <h3 className="mt-0.5 text-[14.5px] leading-snug font-semibold text-ink">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating value={product.rating} />
            <span className="tnum text-[11.5px] text-faint">{product.rating.toFixed(1)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
            {product.tagline}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line px-4 py-3">
        {category.cardSpecs.map((key) => {
          const def = specByKey.get(key)
          if (!def) return null
          return (
            <div key={key} className="min-w-0">
              <dt className="truncate text-[10.5px] tracking-wide text-faint uppercase">
                {def.label}
              </dt>
              <dd className="tnum truncate text-[12.5px] font-medium text-ink">
                {formatSpec(def, product.specs[key] ?? null)}
              </dd>
            </div>
          )
        })}
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <div>
          <p className="tnum text-[15px] font-semibold text-ink">{formatPrice(product.price)}</p>
          <p className="text-[11px] text-faint">at launch · {product.releaseYear}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled && !selected}
          aria-pressed={selected}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all duration-150 active:scale-[0.97]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            selected
              ? 'text-white'
              : 'border border-line bg-surface-2 text-ink hover:border-line-strong hover:bg-surface-3',
          )}
          style={selected ? { background: slotColor } : undefined}
        >
          <Icon name={selected ? 'Check' : 'Plus'} size={14} />
          {selected ? 'Selected' : 'Compare'}
        </button>
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="ts-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="ts-shimmer h-[86px] w-[70px] shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="ts-shimmer h-2.5 w-16 rounded" />
          <div className="ts-shimmer h-4 w-3/4 rounded" />
          <div className="ts-shimmer h-2.5 w-20 rounded" />
          <div className="ts-shimmer h-2.5 w-full rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line px-4 py-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="ts-shimmer h-2 w-12 rounded" />
            <div className="ts-shimmer h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <div className="ts-shimmer h-4 w-16 rounded" />
        <div className="ts-shimmer h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}
