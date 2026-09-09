import type { Category, Product } from '@/types'
import { DeviceGlyph } from '@/components/DeviceGlyph'
import { Icon } from '@/components/ui/Icon'
import { Badge, StarRating } from '@/components/ui/primitives'
import { formatPrice, formatSpec } from '@/lib/format'
import { cn } from '@/lib/cn'

export function ProductCard({
  product,
  category,
  selected,
  slotColor,
  disabled,
  added,
  edited,
  onToggle,
  onEdit,
}: {
  product: Product
  category: Category
  selected: boolean
  slotColor?: string
  disabled?: boolean
  /** Authored by the user rather than shipped in the seed. */
  added: boolean
  /** A seed device the user has changed. */
  edited: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const specByKey = new Map(category.specs.map((s) => [s.key, s]))

  return (
    <article
      className={cn(
        'group ts-card relative flex flex-col overflow-hidden transition-all duration-200',
        selected
          ? 'ring-2 ring-offset-2 ring-offset-paper'
          : 'hover:-translate-y-0.5 hover:shadow-card',
        disabled && !selected && 'opacity-55',
      )}
      style={selected ? ({ '--tw-ring-color': slotColor } as React.CSSProperties) : undefined}
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${product.name}`}
        className="ts-no-print absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl text-faint opacity-0 transition-all hover:bg-surface-2 hover:text-brand-text focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Icon name="Pencil" size={14} />
      </button>

      <div className="flex gap-4 p-5 pb-4">
        <div className="relative h-[92px] w-[74px] shrink-0">
          <DeviceGlyph category={product.category} accent={product.accent} />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[11px] font-semibold tracking-[0.07em] text-faint uppercase">
              {product.brand}
            </p>
            {added ? (
              <Badge tone="brand" icon="Sparkles">
                YOURS
              </Badge>
            ) : edited ? (
              <Badge tone="neutral" icon="Pencil">
                EDITED
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-1 text-[15px] leading-snug font-semibold text-ink">{product.name}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating value={product.rating} />
            <span className="tnum text-[11.5px] text-faint">{product.rating.toFixed(1)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
            {product.tagline}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line px-5 py-3.5">
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

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
        <div>
          <p className="tnum ts-display text-[18px] text-ink">{formatPrice(product.price)}</p>
          <p className="text-[11px] text-faint">at launch · {product.releaseYear}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled && !selected}
          aria-pressed={selected}
          className={cn(
            'inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium',
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

export function ProductCardSkeleton() {
  return (
    <div className="ts-card overflow-hidden">
      <div className="flex gap-4 p-5 pb-4">
        <div className="ts-shimmer h-[92px] w-[74px] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="ts-shimmer h-2.5 w-16" />
          <div className="ts-shimmer h-4 w-3/4" />
          <div className="ts-shimmer h-2.5 w-20" />
          <div className="ts-shimmer h-2.5 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-line px-5 py-3.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="ts-shimmer h-2 w-12" />
            <div className="ts-shimmer h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
        <div className="ts-shimmer h-5 w-16" />
        <div className="ts-shimmer h-10 w-28 rounded-xl" />
      </div>
    </div>
  )
}

/** Placeholder that invites the user to author their own device. */
export function AddDeviceCard({
  category,
  onClick,
}: {
  category: Category
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[1.375rem]',
        'border border-dashed border-line-strong/70 bg-surface-2/40 p-6 text-center',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand-soft/40',
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-faint transition-colors group-hover:border-brand/40 group-hover:text-brand-text">
        <Icon name="Plus" size={22} />
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-ink">
          Add your own {category.singular}
        </span>
        <span className="mt-1 block max-w-[240px] text-[12.5px] leading-relaxed text-muted">
          Missing something? Add it and it gets scored exactly like everything else.
        </span>
      </span>
    </button>
  )
}
