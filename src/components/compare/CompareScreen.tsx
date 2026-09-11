import { useMemo, useState } from 'react'
import type { Category } from '@/types'
import { SPEC_GROUPS } from '@/data'
import { MIN_SELECTION, useAppState } from '@/hooks/useAppState'
import { applyDealBreakers, computePersonaVerdicts, scoreProducts } from '@/lib/scoring'
import { seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Button, Disclosure, EmptyState, Skeleton, Switch } from '@/components/ui/primitives'
import { RadarChart, type RadarSeries } from '@/components/charts/RadarChart'
import { ValueScatter } from '@/components/charts/ValueScatter'
import { ProductColumns } from './ProductColumns'
import { VerdictPanel } from './VerdictPanel'
import { PriorityPanel } from './PriorityPanel'
import { PersonaGrid } from './PersonaGrid'
import { HeadToHead } from './HeadToHead'
import { SpecTable } from './SpecTable'
import { PillarBreakdown } from './PillarBreakdown'
import { DealBreakers } from './DealBreakers'
import { ShareButton } from './ShareButton'
import { PageMeta, StructuredData } from '@/components/StructuredData'
import { comparisonSchema } from '@/lib/structuredData'

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
    toggleProduct,
    goPicker,
    showToast,
  } = useAppState()

  const [dealBreakers, setDealBreakers] = useState<string[]>([])
  const [differencesOnly, setDifferencesOnly] = useState(false)
  const [biggestGapsFirst, setBiggestGapsFirst] = useState(false)

  const scored = useMemo(
    () =>
      loadState === 'ready' && selected.length
        ? scoreProducts(category, catalogue, selected, { priorities })
        : [],
    [category, catalogue, selected, priorities, loadState],
  )

  // Must-haves gate the ranking and every verdict, but never the spec table:
  // a disqualified product stays visible so you can see what it cost.
  const { eligible, failures } = useMemo(
    () => applyDealBreakers(category, scored, dealBreakers),
    [category, scored, dealBreakers],
  )

  const verdicts = useMemo(
    () => (eligible.length ? computePersonaVerdicts(category, eligible) : []),
    [category, eligible],
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
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16">
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
    <div className="ts-fade mx-auto w-full max-w-[1280px] px-4 pt-5">
      {/* SEO: schema.org ItemList + a title/description matching the page. */}
      <PageMeta
        title={`${selected.map((p) => p.name).join(' vs ')} — ${category.label} comparison`}
        description={`Side-by-side ${category.singular} comparison of ${selected
          .map((p) => p.name)
          .join(', ')}, scored against the specs you weight.`}
      />
      <StructuredData id="comparison" data={comparisonSchema(category, scored)} />

      {/* --------------------------------------------------------- toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="sm" variant="ghost" icon="ArrowLeft" onClick={goPicker}>
          Change selection
        </Button>
        <ShareButton
          category={category}
          products={selected}
          priorities={priorities}
          onToast={showToast}
        />
      </div>

      <header className="mt-4">
        <h1 className="text-[19px] leading-tight font-semibold text-balance text-ink sm:text-[22px]">
          {selected.map((p) => p.name).join('  vs  ')}
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          {category.label} · {category.pillars.length} weighted pillars
        </p>
      </header>

      <ProductColumns
        category={category}
        catalogue={catalogue}
        scored={scored}
        colors={colors}
        failures={failures}
        onRemove={removeProduct}
        onAdd={toggleProduct}
        canRemove={selected.length > MIN_SELECTION}
      />

      <div className="mt-4 space-y-3 pb-4">
        <DealBreakers
          category={category}
          scored={scored}
          active={dealBreakers}
          failures={failures}
          eligibleCount={eligible.length}
          onToggle={(id) =>
            setDealBreakers((current) =>
              current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
            )
          }
          onClear={() => setDealBreakers([])}
        />

        {eligible.length > 0 && (
          <VerdictPanel category={category} scored={eligible} colors={colors} />
        )}

        <PriorityPanel
          category={category}
          priorities={priorities}
          onChange={setPriority}
          onApplyPreset={applyPreset}
          onReset={resetPriorities}
        />

        {/* Heavy sections start closed. The page opens with the answer and
            the evidence is one click away. */}
        <Disclosure
          title="Capability profile"
          icon="Target"
          summary={`Radar across ${category.pillars.length} pillars, plus a spec-level audit`}
        >
          <p className="mb-4 text-[12.5px] leading-relaxed text-muted">
            Each axis is scored against every {category.singular} in the catalogue, so the shape
            tells you where these sit in the class — not just against each other.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <RadarChart
                axes={category.pillars.map((p) => ({ id: p.id, label: p.short, hint: p.hint }))}
                series={radarSeries}
                size={320}
              />
            </div>
            <div className="min-w-0">
              <ValueScatter items={scored} colors={colors} />
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                Weighted score against price. Anything below the dashed line is beaten by
                something cheaper in this very comparison.
              </p>
            </div>
          </div>
          <PillarBreakdown category={category} scored={scored} colors={colors} />
        </Disclosure>

        {verdicts.length > 0 && (
          <Disclosure
            title="Best for each kind of buyer"
            icon="Award"
            summary={`${verdicts.length} buyer profiles scored independently`}
          >
            <PersonaGrid verdicts={verdicts} colors={colors} onApplyPreset={applyPreset} />
          </Disclosure>
        )}

        <Disclosure
          title="Head to head"
          icon="Scale"
          summary="The specs behind each product's lead"
        >
          <HeadToHead category={category} scored={scored} colors={colors} />
        </Disclosure>

        <Disclosure
          title="Full spec sheet"
          icon="Rows3"
          summary={`${category.specs.filter((sp) => !sp.internal).length} specs across ${activeGroups.length} groups`}
        >
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
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

          <nav
            className="ts-scroll-x ts-no-scrollbar mb-4 flex gap-1.5 pb-1"
            aria-label="Jump to spec group"
          >
            {activeGroups.map((groupId) => (
              <a
                key={groupId}
                href={`#group-${groupId}`}
                className={cn(
                  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5',
                  'text-[12px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink',
                )}
              >
                <Icon name={SPEC_GROUPS[groupId].icon} size={12} />
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
        </Disclosure>
      </div>
    </div>
  )
}

function CompareSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-8">
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
