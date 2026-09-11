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
import { formatCompactPrice, seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Button, Chip, EmptyState } from '@/components/ui/primitives'
import { DualRange } from '@/components/ui/DualRange'
import { ProductCard, ProductCardSkeleton } from './ProductCard'
import { CompareTray } from './CompareTray'
import { RecommendWizard } from '@/components/quiz/RecommendWizard'
import { collectionsFor } from '@/lib/collections'

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
    setPriorities,
    startMatchup,
    openCollection,
  } = useAppState()

  const [showFilters, setShowFilters] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)

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

  // Generated buying guides — cheap to build and they keep the picker from
  // being the only way in.
  const guides = useMemo(
    () => (loadState === 'ready' ? collectionsFor(category, catalogue, 3).slice(0, 4) : []),
    [category, catalogue, loadState],
  )

  const filterCount = activeFilterCount(filters)
  const atCapacity = selection.length >= MAX_SELECTION

  useEffect(() => {
    if (!showFilters) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFilters(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFilters])

  return (
    <div className="ts-fade flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6">
        {/* -------------------------------------------------------- heading */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface-2 text-brand-text">
                <Icon name={category.icon} size={15} />
              </span>
              <h1 className="text-[19px] font-semibold text-ink">{category.label}</h1>
            </div>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
              {category.blurb} Pick between 2 and {MAX_SELECTION} to compare.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button icon="Wand" variant="primary" onClick={() => setWizardOpen(true)}>
              <span className="hidden sm:inline">Help me choose</span>
              <span className="sm:hidden">Choose</span>
            </Button>
            <Button
              icon="SlidersHorizontal"
              onClick={() => setShowFilters((v) => !v)}
              className="lg:hidden"
            >
              {filterCount > 0 ? `Filters (${filterCount})` : 'Filters'}
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------- search */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon
              name="Search"
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => patchFilters({ query: e.target.value })}
              placeholder={`Search ${category.plural} by name, brand or chipset…`}
              aria-label={`Search ${category.label}`}
              className="h-9 w-full rounded-md border border-line bg-surface pr-3 pl-9 text-[13px] text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-brand focus:outline-none"
            />
          </div>

          <div className="relative shrink-0">
            <label className="sr-only" htmlFor="sort">
              Sort results
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => patchFilters({ sort: e.target.value as SortKey })}
              className="h-9 appearance-none rounded-md border border-line bg-surface pr-8 pl-8 text-[12.5px] font-medium text-ink transition-colors hover:border-line-strong focus:outline-none"
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
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
            />
            <Icon
              name="ChevronDown"
              size={14}
              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-faint"
            />
          </div>
        </div>

        {/* --------------------------------------------------------- guides */}
        {guides.length > 0 && filters.query === '' && filterCount === 0 && (
          <div className="ts-scroll-x ts-no-scrollbar mt-4 flex gap-2 pb-1">
            <span className="flex shrink-0 items-center gap-1.5 pr-1 text-[11.5px] font-medium tracking-wide text-faint uppercase">
              <Icon name="Bookmark" size={12} />
              Guides
            </span>
            {guides.map((guide) => (
              <button
                key={guide.key}
                type="button"
                onClick={() => openCollection(category.id, guide.key)}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[12px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                {guide.title}
                <Icon name="ArrowRight" size={11} className="text-faint" />
              </button>
            ))}
          </div>
        )}

        {/* ----------------------------------------------------- quick chips */}
        <div className="ts-scroll-x ts-no-scrollbar mt-4 flex items-center gap-2 pb-1">
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
        <div className="mt-5 grid gap-6 lg:grid-cols-[210px_1fr]">
          <FilterPanel
            className={cn('lg:sticky lg:top-16 lg:block lg:h-fit', showFilters ? 'block' : 'hidden')}
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

          <div className="min-w-0">
            {loadState === 'ready' && (
              <p className="mb-4 text-[12.5px] text-faint" aria-live="polite">
                {results.length === catalogue.length
                  ? `${results.length} ${results.length === 1 ? category.singular : category.plural}`
                  : `${results.length} of ${catalogue.length} ${category.plural}`}
                {atCapacity && ' · comparison slots full'}
              </p>
            )}

            {loadState !== 'ready' ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="ts-card">
                <EmptyState
                  icon="Search"
                  title="No matches"
                  description={
                    filters.query
                      ? `Nothing matches “${filters.query}” with these filters.`
                      : 'Nothing matches the current filters. Try widening the price range or clearing a chip.'
                  }
                  action={
                    <Button variant="primary" icon="RotateCcw" onClick={resetFilters}>
                      Clear all filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((product, index) => {
                  const slot = selection.indexOf(product.id)
                  return (
                    <div key={product.id} style={{ '--i': Math.min(index, 8) } as React.CSSProperties}>
                      <ProductCard
                        product={product}
                        category={category}
                        selected={slot !== -1}
                        slotColor={slot !== -1 ? seriesColor(slot) : undefined}
                        disabled={atCapacity}
                        onToggle={() => toggleProduct(product.id)}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <RecommendWizard
        category={category}
        catalogue={catalogue}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCompare={(ids, weights) => {
          setPriorities(weights)
          startMatchup(category.id, ids)
        }}
        onApplyWeights={setPriorities}
      />

      <div className="mt-8">
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
        <h2 className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
          <Icon name="SlidersHorizontal" size={15} className="text-faint" />
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

      <div className="mt-5">
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

      <div className="mt-7">
        <p className="mb-3 text-[12px] font-medium text-muted">Brand</p>
        <div className="flex flex-wrap gap-1.5">
          {brands.map((brand) => (
            <Chip
              key={brand}
              active={selectedBrands.includes(brand)}
              onClick={() => onBrandToggle(brand)}
              className="h-8 px-3 text-[12px]"
            >
              {brand}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-7 border-t border-line pt-4">
        <p className="tnum text-[12px] text-faint">
          Showing <span className="font-semibold text-ink">{resultCount}</span> of {totalCount}
        </p>
      </div>
    </aside>
  )
}
