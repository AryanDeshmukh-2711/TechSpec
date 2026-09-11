import { useMemo } from 'react'
import type { Category } from '@/types'
import { useAppState } from '@/hooks/useAppState'
import { collectionsFor, findCollection } from '@/lib/collections'
import { formatPrice, formatSpec, seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Badge, Button, EmptyState } from '@/components/ui/primitives'
import { DeviceGlyph } from '@/components/DeviceGlyph'
import { PageMeta, StructuredData } from '@/components/StructuredData'
import { productSchema } from '@/lib/structuredData'

/**
 * A generated buying guide.
 *
 * Generated rather than written, so it cannot go stale against a catalogue the
 * user edits. The weights that produced the ranking are on the page, because a
 * "best of" list whose criteria are hidden is just an assertion.
 */
export function CollectionScreen({
  category,
  collectionKey,
}: {
  category: Category
  collectionKey: string
}) {
  const { catalogue, startMatchup, openCollection, goPicker, setPriorities } = useAppState()

  const collection = useMemo(
    () => findCollection(category, catalogue, collectionKey, 6),
    [category, catalogue, collectionKey],
  )

  const siblings = useMemo(
    () => collectionsFor(category, catalogue, 3).filter((c) => c.key !== collectionKey),
    [category, catalogue, collectionKey],
  )

  if (!collection || collection.entries.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-16">
        <div className="ts-card">
          <EmptyState
            icon="Bookmark"
            title="Nothing qualifies for this guide"
            description="Every device is filtered out by this guide's criteria — likely because the catalogue has been narrowed."
            action={
              <Button variant="primary" icon="ArrowLeft" onClick={goPicker}>
                Browse {category.plural}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const topWeights = Object.entries(collection.weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => category.pillars.find((p) => p.id === id)?.label)
    .filter(Boolean)

  const specByKey = new Map(category.specs.map((s) => [s.key, s]))

  // In a list ranked by score, the leaders are usually also progressively
  // cheaper, so nearly everything sits on the value frontier and the badge
  // stops meaning anything. Only show it while it still discriminates.
  const onFrontier = collection.entries.filter((e) => e.scored.onFrontier).length
  const frontierIsMeaningful = onFrontier > 0 && onFrontier <= collection.entries.length / 2

  return (
    <div className="ts-fade mx-auto w-full max-w-[900px] px-4 pt-6">
      <PageMeta
        title={`${collection.title} (${new Date().getFullYear()}) — TechSpec`}
        description={`${collection.premise} Ranked from ${collection.considered} ${category.plural} on the specs that matter.`}
      />
      <StructuredData
        id="collection"
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: collection.title,
          description: collection.premise,
          numberOfItems: collection.entries.length,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          itemListElement: collection.entries.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: productSchema(category, entry.scored.product),
          })),
        }}
      />

      <Button size="sm" variant="ghost" icon="ArrowLeft" onClick={goPicker}>
        All {category.plural}
      </Button>

      <header className="mt-3">
        <h1 className="text-[24px] leading-tight font-semibold text-balance text-ink sm:text-[28px]">
          {collection.title}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{collection.premise}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-faint">
          <span className="tnum">
            Ranked from {collection.considered} {category.plural}
          </span>
          {topWeights.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>weighted towards {topWeights.join(', ').toLowerCase()}</span>
            </>
          )}
        </p>
      </header>

      {collection.entries.length >= 2 && (
        <Button
          className="mt-4"
          variant="primary"
          iconRight="ArrowRight"
          onClick={() => {
            setPriorities(collection.weights)
            startMatchup(
              category.id,
              collection.entries.slice(0, 3).map((e) => e.scored.product.id),
            )
          }}
        >
          Compare the top {Math.min(3, collection.entries.length)} side by side
        </Button>
      )}

      <ol className="mt-6 space-y-3">
        {collection.entries.map((entry, index) => {
          const product = entry.scored.product
          return (
            <li key={product.id} className="ts-card p-4">
              <div className="flex gap-4">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <span
                    className="tnum flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                    style={{ background: seriesColor(index) }}
                  >
                    {index + 1}
                  </span>
                  <span className="h-14 w-11">
                    <DeviceGlyph
                      category={product.category}
                      accent={product.accent}
                      glow={false}
                    />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h2 className="text-[15px] font-semibold text-ink">{product.name}</h2>
                    <span className="tnum text-[13px] text-muted">
                      {formatPrice(product.price)}
                    </span>
                    {entry.scored.onFrontier && frontierIsMeaningful && (
                      <Badge tone="best" icon="TrendingUp">
                        BEST AT ITS PRICE
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{entry.reason}</p>

                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                    {category.headlineSpecs.slice(0, 4).map((key) => {
                      const def = specByKey.get(key)
                      if (!def) return null
                      return (
                        <div key={key} className="min-w-0">
                          <dt className="text-[10.5px] tracking-wide text-faint uppercase">
                            {def.label}
                          </dt>
                          <dd className="tnum truncate text-[12.5px] font-medium text-ink">
                            {formatSpec(def, product.specs[key] ?? null)}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>

                <span
                  className="tnum shrink-0 self-start text-[15px] font-semibold"
                  style={{ color: seriesColor(index) }}
                >
                  {Math.round(entry.scored.overall)}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-5 flex items-start gap-2 rounded-md border border-line bg-surface-2 p-3 text-[12px] leading-relaxed text-muted">
        <Icon name="Lightbulb" size={14} className="mt-0.5 shrink-0 text-best" />
        <span>
          This list is generated from the catalogue, not written by hand — so it updates the
          moment you correct a spec or add a device. Disagree with the premise? Open the
          comparison and move the sliders.
        </span>
      </p>

      {/* Internal linking — report item 87. */}
      {siblings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[14px] font-semibold text-ink">Other guides in {category.label}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {siblings.map((sibling) => (
              <button
                key={sibling.key}
                type="button"
                onClick={() => openCollection(category.id, sibling.key)}
                className={cn(
                  'group ts-card flex items-center gap-2 p-3 text-left transition-colors',
                  'hover:border-line-strong hover:bg-surface-2',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {sibling.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-faint">
                    Top pick: {sibling.entries[0]?.scored.product.name}
                  </span>
                </span>
                <Icon
                  name="ArrowRight"
                  size={13}
                  className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
