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
  slotColor?: string
  disabled?: boolean
  onToggle: () => void
}) {
  const specByKey = new Map(category.specs.map((s) => [s.key, s]))

  return (
    <article
      className={cn(
        'group ts-card relative flex flex-col overflow-hidden transition-all duration-200',
        selected
          ? 'ring-1 ring-offset-1 ring-offset-bg'
          : 'hover:-translate-y-0.5 hover:shadow-card',
        disabled && !selected && 'opacity-55',
      )}
      style={selected ? ({ '--tw-ring-color': slotColor } as React.CSSProperties) : undefined}
    >
      <div className="flex gap-3 p-4 pb-3">
        <div className="relative h-[68px] w-[54px] shrink-0">
          <DeviceGlyph category={product.category} accent={product.accent} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.07em] text-faint uppercase">
            {product.brand}
          </p>
          <h3 className="mt-0.5 text-[13.5px] leading-snug font-semibold text-ink">{product.name}</h3>
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
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium',
            'transition-all duration-150 active:scale-[0.97]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            selected
              ? 'text-white shadow-soft'
              : 'border border-line-strong/60 bg-surface text-ink hover:bg-surface-2',
          )}
          style={selected ? { background: slotColor } : undefined}
        >
          <Icon name={selected ? 'Check' : 'Plus'} size={15} />
          {selected ? 'Selected' : 'Compare'}
        </button>
      </div>
    </article>
  )
}
