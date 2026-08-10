import { useEffect, useMemo, useState } from 'react'
import type { Category, SortKey } from '@/types'
import { MAX_SELECTION, useAppState } from '@/hooks/useAppState'
import {
  SORT_OPTIONS,
  activeFilterCount,
  applyFilters,
  brandsOf,
  priceBoundsOf,
} from '@/lib/filters'
import { formatCompactPrice, pluralise, seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Button, Chip, EmptyState } from '@/components/ui/primitives'
import { DualRange } from '@/components/ui/DualRange'
import { ProductCard, ProductCardSkeleton } from './ProductCard'
import { CompareTray } from './CompareTray'

export function PickerScreen({ category }: { category: Category }) {
  const {
    catalogue,
    loadState,
    filters,
    patchFilters,
    resetFilters,
    selection,
    selected,
    toggleProduct,
    removeProduct,
    clearSelection,
    goCompare,
  } = useAppState()

  const [showFilters, setShowFilters] = useState(false)

  const brands = useMemo(() => brandsOf(catalogue), [catalogue])
  const [priceFloor, priceCeiling] = useMemo(() => priceBoundsOf(catalogue), [catalogue])

  const priceRange: [number, number] = [
    filters.priceMin ?? priceFloor,
    filters.priceMax ?? priceCeiling,
  ]

  const results = useMemo(
    () => (loadState === 'ready' ? applyFilters(category, catalogue, filters) : []),
    [category, catalogue, filters, loadState],
  )

  const filterCount = activeFilterCount(filters)
  const atCapacity = selection.length >= MAX_SELECTION

  // Close the mobile filter sheet when escape is pressed.
  useEffect(() => {
    if (!showFilters) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFilters(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFilters])

  return (
    <div className="ts-fade flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-8 sm:px-6">
        {/* -------------------------------------------------------- heading */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]">
              <Icon name={category.icon} size={22} className="text-brand-text" />
              Choose {category.label.toLowerCase()} to compare
            </h1>
            <p className="mt-2 text-[14px] text-muted">
              Select between 2 and {MAX_SELECTION}. {category.blurb}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sort">
              Sort results
            </label>
            <div className="relative">
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => patchFilters({ sort: e.target.value as SortKey })}
                className="h-10 appearance-none rounded-xl border border-line bg-surface-2 pr-9 pl-9 text-[13px] font-medium text-ink transition-colors hover:border-line-strong focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon
                name="ArrowUpDown"
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
              />
              <Icon
                name="ChevronDown"
                size={14}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-faint"
              />
            </div>
            <Button
              icon="SlidersHorizontal"
              onClick={() => setShowFilters((v) => !v)}
              className="lg:hidden"
            >
              Filters{filterCount > 0 && ` (${filterCount})`}
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------- search */}
        <div className="relative mt-6">
          <Icon
            name="Search"
            size={17}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => patchFilters({ query: e.target.value })}
            placeholder={`Search ${category.label.toLowerCase()} by name, brand or chipset…`}
            aria-label={`Search ${category.label}`}
            className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-[14px] text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-brand focus:outline-none"
          />
        </div>

        {/* ----------------------------------------------------- quick chips */}
        <div className="ts-scroll-x ts-no-scrollbar mt-3 flex items-center gap-2 pb-1">
          {category.quickFilters.map((quick) => {
            const active = filters.quickFilters.includes(quick.id)
            return (
              <Chip
                key={quick.id}
                active={active}
                className="shrink-0"
                onClick={() =>
                  patchFilters({
                    quickFilters: active
                      ? filters.quickFilters.filter((id) => id !== quick.id)
                      : [...filters.quickFilters, quick.id],
                  })
                }
              >
                {quick.label}
              </Chip>
            )
          })}
          {filterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        {/* ------------------------------------------------------ main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[236px_1fr]">
          <FilterPanel
            className={cn(
              'lg:sticky lg:top-[4.5rem] lg:block lg:h-fit',
              showFilters ? 'block' : 'hidden',
            )}
            brands={brands}
            selectedBrands={filters.brands}
            onBrandToggle={(brand) =>
              patchFilters({
                brands: filters.brands.includes(brand)
                  ? filters.brands.filter((b) => b !== brand)
                  : [...filters.brands, brand],
              })
            }
            priceFloor={priceFloor}
            priceCeiling={priceCeiling}
            priceRange={priceRange}
            onPriceChange={([min, max]) =>
              patchFilters({
                priceMin: min <= priceFloor ? null : min,
                priceMax: max >= priceCeiling ? null : max,
              })
            }
            resultCount={results.length}
            totalCount={catalogue.length}
            onReset={resetFilters}
            hasFilters={filterCount > 0}
          />

          <div>
            {loadState === 'ready' && (
              <p className="mb-3 text-[12.5px] text-faint" aria-live="polite">
                {results.length === catalogue.length
                  ? pluralise(results.length, category.singular, category.plural)
                  : `${results.length} of ${catalogue.length} ${category.plural}`}
                {atCapacity && ' · comparison slots full'}
              </p>
            )}

            {loadState === 'loading' || loadState === 'idle' ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : loadState === 'error' ? (
              <div className="ts-card">
                <EmptyState
                  icon="CircleAlert"
                  title="Couldn't load this category"
                  description="Something went wrong fetching the catalogue. Try again in a moment."
                  action={
                    <Button icon="RotateCcw" onClick={() => window.location.reload()}>
                      Reload
                    </Button>
                  }
                />
              </div>
            ) : results.length === 0 ? (
              <div className="ts-card">
                <EmptyState
                  icon="Search"
                  title="No matches"
                  description={
                    filters.query
                      ? `Nothing in ${category.label.toLowerCase()} matches “${filters.query}” with these filters.`
                      : 'No products match the current filters. Try widening the price range or clearing a chip.'
                  }
                  action={
                    <Button icon="RotateCcw" onClick={resetFilters}>
                      Clear all filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((product) => {
                  const index = selection.indexOf(product.id)
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={category}
                      selected={index !== -1}
                      slotColor={index !== -1 ? seriesColor(index) : undefined}
                      disabled={atCapacity}
                      onToggle={() => toggleProduct(product.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <CompareTray
          selected={selected}
          category={category}
          onRemove={removeProduct}
          onClear={clearSelection}
          onCompare={goCompare}
        />
      </div>
    </div>
  )
}

function FilterPanel({
  className,
  brands,
  selectedBrands,
  onBrandToggle,
  priceFloor,
  priceCeiling,
  priceRange,
  onPriceChange,
  resultCount,
  totalCount,
  onReset,
  hasFilters,
}: {
  className?: string
  brands: string[]
  selectedBrands: string[]
  onBrandToggle: (brand: string) => void
  priceFloor: number
  priceCeiling: number
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  resultCount: number
  totalCount: number
  onReset: () => void
  hasFilters: boolean
}) {
  const step = priceCeiling > 2000 ? 50 : 10

  return (
    <aside className={cn('ts-card h-fit p-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          <Icon name="SlidersHorizontal" size={14} className="text-faint" />
          Filters
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-[12px] font-medium text-brand-text hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <DualRange
          label="Price"
          min={priceFloor}
          max={priceCeiling}
          step={step}
          value={priceRange}
          onChange={onPriceChange}
          format={formatCompactPrice}
        />
      </div>

      <div className="mt-6">
        <p className="mb-2.5 text-[12px] font-medium text-muted">Brand</p>
        <div className="flex flex-wrap gap-1.5">
          {brands.map((brand) => (
            <Chip
              key={brand}
              active={selectedBrands.includes(brand)}
              onClick={() => onBrandToggle(brand)}
              className="h-7 px-2.5 text-[12px]"
            >
              {brand}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-3.5">
        <p className="tnum text-[12px] text-faint">
          Showing <span className="font-semibold text-ink">{resultCount}</span> of {totalCount}
        </p>
      </div>
    </aside>
  )
}
