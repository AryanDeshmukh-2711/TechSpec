import { useMemo, useState } from 'react'
import type { Category } from '@/types'
import { SPEC_GROUPS } from '@/data'
import { MIN_SELECTION, useAppState } from '@/hooks/useAppState'
import { computePersonaVerdicts, scoreProducts } from '@/lib/scoring'
import { seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Button, EmptyState, Skeleton, Switch } from '@/components/ui/primitives'
import { RadarChart, type RadarSeries } from '@/components/charts/RadarChart'
import { ValueScatter } from '@/components/charts/ValueScatter'
import { ProductColumns } from './ProductColumns'
import { VerdictPanel } from './VerdictPanel'
import { PriorityPanel } from './PriorityPanel'
import { PersonaGrid } from './PersonaGrid'
import { HeadToHead } from './HeadToHead'
import { SpecTable } from './SpecTable'
import { ExportBar } from './ExportBar'

export function CompareScreen({ category }: { category: Category }) {
  const {
    catalogue,
    loadState,
    selected,
    priorities,
    setPriority,
    setPriorities,
    resetPriorities,
    removeProduct,
    goPicker,
    showToast,
  } = useAppState()

  const [differencesOnly, setDifferencesOnly] = useState(false)
  const [biggestGapsFirst, setBiggestGapsFirst] = useState(false)

  const scored = useMemo(
    () =>
      loadState === 'ready' && selected.length
        ? scoreProducts(category, catalogue, selected, { priorities })
        : [],
    [category, catalogue, selected, priorities, loadState],
  )

  const verdicts = useMemo(
    () => (scored.length ? computePersonaVerdicts(category, scored) : []),
    [category, scored],
  )

  const colors = useMemo(
    () =>
      Object.fromEntries(selected.map((product, index) => [product.id, seriesColor(index)])),
    [selected],
  )

  const radarSeries: RadarSeries[] = useMemo(
    () =>
      scored.map((item, index) => ({
        id: item.product.id,
        label: item.product.name,
        color: seriesColor(index),
        values: category.pillars.map((pillar) => item.pillars[pillar.id] ?? 0),
      })),
    [scored, category.pillars],
  )

  /* --------------------------------------------------------------- states */

  if (loadState === 'loading' || loadState === 'idle') {
    return <CompareSkeleton />
  }

  if (selected.length < MIN_SELECTION) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="ts-card">
          <EmptyState
            icon="Scale"
            title={
              selected.length === 0
                ? 'Nothing selected yet'
                : `Add ${MIN_SELECTION - selected.length} more to compare`
            }
            description={`A comparison needs at least ${MIN_SELECTION} ${category.plural}. ${
              selected.length === 1
                ? `You have ${selected[0].name} in the tray.`
                : 'Head back and pick a few.'
            }`}
            action={
              <Button variant="primary" icon="ArrowLeft" onClick={goPicker}>
                Choose {category.label.toLowerCase()}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const applyPreset = (weights: Record<string, number>) => {
    // Pillars a persona doesn't mention drop to 1 rather than the neutral 5 —
    // a preset should express a real opinion.
    const next = Object.fromEntries(
      category.pillars.map((pillar) => [pillar.id, weights[pillar.id] ?? 1]),
    )
    setPriorities(next)
    showToast('Priorities updated')
  }

  const activeGroups = category.groupOrder.filter((groupId) =>
    category.specs.some(
      (spec) =>
        spec.group === groupId &&
        !spec.internal &&
        scored.some((item) => item.specs[spec.key]?.raw !== null),
    ),
  )

  return (
    <div className="ts-fade mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6">
      {/* --------------------------------------------------------- toolbar */}
      <div className="ts-no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon="ArrowLeft" onClick={goPicker}>
            Change selection
          </Button>
        </div>
        <ExportBar
          category={category}
          scored={scored}
          verdicts={verdicts}
          priorities={priorities}
          onToast={showToast}
        />
      </div>

      <header className="mt-4 print:mt-0">
        <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-balance text-ink sm:text-[30px]">
          {selected.map((p) => p.name).join('  vs  ')}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {category.label} · {category.pillars.length} weighted pillars ·{' '}
          {category.specs.filter((s) => !s.internal).length} specs tracked
        </p>
      </header>

      <ProductColumns
        scored={scored}
        colors={colors}
        onRemove={removeProduct}
        canRemove={selected.length > MIN_SELECTION}
      />

      <div className="mt-5 space-y-4 pb-4">
        <VerdictPanel category={category} scored={scored} colors={colors} />

        <PriorityPanel
          category={category}
          priorities={priorities}
          onChange={setPriority}
          onApplyPreset={applyPreset}
          onReset={resetPriorities}
        />

        {/* ---------------------------------------------------------- charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="ts-card ts-print-block p-5" aria-labelledby="radar-heading">
            <h2
              id="radar-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-ink"
            >
              <Icon name="Target" size={16} className="text-brand-text" />
              Capability profile
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Each axis is scored against every {category.singular} in the catalogue, so the
              shape tells you where these sit in the class — not just against each other.
            </p>
            <div className="mt-4">
              <RadarChart
                axes={category.pillars.map((p) => ({
                  id: p.id,
                  label: p.short,
                  hint: p.hint,
                }))}
                series={radarSeries}
                size={340}
              />
            </div>
          </section>

          <section className="ts-card ts-print-block p-5" aria-labelledby="value-heading">
            <h2
              id="value-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-ink"
            >
              <Icon name="TrendingUp" size={16} className="text-brand-text" />
              Is it worth the money?
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Your weighted score plotted against price. Anything below the dashed line is
              beaten by something cheaper in this very comparison.
            </p>
            <div className="mt-6">
              <ValueScatter items={scored} colors={colors} />
            </div>
          </section>
        </div>

        <PersonaGrid verdicts={verdicts} colors={colors} onApplyPreset={applyPreset} />

        <HeadToHead category={category} scored={scored} colors={colors} />

        {/* ------------------------------------------------------ spec sheet */}
        <section aria-labelledby="specs-heading" className="pt-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="specs-heading"
                className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink"
              >
                <Icon name="Rows3" size={17} className="text-brand-text" />
                Full spec sheet
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Bars show where each value sits across the whole category. A green cell is the
                best of the products you're comparing.
              </p>
            </div>
            <div className="ts-no-print flex flex-wrap items-center gap-x-5 gap-y-2">
              <Switch
                checked={differencesOnly}
                onChange={setDifferencesOnly}
                label="Differences only"
                hint="Hide every spec where all products match"
              />
              <Switch
                checked={biggestGapsFirst}
                onChange={setBiggestGapsFirst}
                label="Biggest gaps first"
                hint="Order specs within each group by how far apart the products are"
              />
            </div>
          </div>

          {/* Group jump nav */}
          <nav
            className="ts-no-print ts-scroll-x ts-no-scrollbar mb-4 flex gap-1.5 pb-1"
            aria-label="Jump to spec group"
          >
            {activeGroups.map((groupId) => (
              <a
                key={groupId}
                href={`#group-${groupId}`}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3',
                  'text-[12.5px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink',
                )}
              >
                <Icon name={SPEC_GROUPS[groupId].icon} size={13} />
                {SPEC_GROUPS[groupId].label}
              </a>
            ))}
          </nav>

          <SpecTable
            category={category}
            scored={scored}
            colors={colors}
            options={{ differencesOnly, biggestGapsFirst }}
          />
        </section>
      </div>
    </div>
  )
}

function CompareSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6">
      <Skeleton className="h-8 w-2/3 max-w-lg" />
      <Skeleton className="mt-3 h-3 w-52" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="mt-4 h-56" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}
