import { useMemo } from 'react'
import { CATEGORIES, FEATURED_MATCHUPS, getCategory } from '@/data'
import { useAppState } from '@/hooks/useAppState'
import { useCatalogue } from '@/data/store/CatalogueProvider'
import { useProfile } from '@/personalisation/ProfileProvider'
import { useLibrary } from '@/data/store/LibraryProvider'
import { seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Badge, Button } from '@/components/ui/primitives'
import { DeviceGlyph } from '@/components/DeviceGlyph'

/**
 * The home screen is a feed, not a brochure.
 *
 * A first-time visitor gets the pitch and a way in. Everyone after that gets
 * their own things first: what they were comparing, what they looked at but
 * never decided on, and the categories they actually use — ordered by use, not
 * by our preference.
 */
export function HomeScreen() {
  const { selectCategory, startMatchup } = useAppState()
  const catalogue = useCatalogue()
  const { profile, hasHistory, orderedCategories, suggestions } = useProfile()
  const { saved, remove } = useLibrary()

  const categories = useMemo(() => {
    const order = orderedCategories(CATEGORIES.map((c) => c.id))
    return order
      .map((id) => CATEGORIES.find((c) => c.id === id))
      .filter((c): c is (typeof CATEGORIES)[number] => Boolean(c))
  }, [orderedCategories])

  const picks = useMemo(
    () => suggestions((id) => catalogue.catalogueFor(id)),
    [suggestions, catalogue],
  )

  const recent = profile.comparisons.slice(0, 4)
  const totalDevices = CATEGORIES.reduce(
    (sum, c) => sum + catalogue.catalogueFor(c.id).length,
    0,
  )

  return (
    <div className="ts-fade">
      {/* ------------------------------------------------------------ hero */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-[1280px] px-4">
          <div className={cn('max-w-2xl', hasHistory ? 'py-8' : 'py-14')}>
            {hasHistory ? (
              <>
                <h1 className="text-[22px] leading-tight font-semibold text-ink">
                  Pick up where you left off
                </h1>
              </>
            ) : (
              <>
                <h1 className="text-[28px] leading-tight font-semibold text-balance text-ink sm:text-[34px]">
                  Compare on your terms
                </h1>
                <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">
                  Set what matters — battery over camera, portability over speed — and every
                  score, ranking and verdict recalculates around you.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={() => selectCategory('mobiles')}>
                    Compare phones
                  </Button>
                  <Button onClick={() => selectCategory('laptops')}>Compare laptops</Button>
                </div>
                <p className="tnum mt-5 text-[12px] text-faint">
                  {totalDevices} devices across {CATEGORIES.length} categories · every spec
                  editable · no account
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1280px] px-4">
        {/* ------------------------------------------------------ saved */}
        {saved.length > 0 && (
          <Section
            title="Saved comparisons"
            subtitle="Kept deliberately, with the priority weights you had at the time."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((entry) => {
                const entryCategory = getCategory(entry.category)
                return (
                  <div
                    key={entry.id}
                    className="group ts-card relative flex flex-col p-4 transition-colors hover:border-line-strong"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        startMatchup(entry.category, entry.items.map((i) => i.productId))
                      }
                      className="text-left"
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-faint uppercase">
                        {entryCategory && <Icon name={entryCategory.icon} size={12} />}
                        {entryCategory?.label}
                      </span>
                      <span className="mt-2 block text-[14px] leading-snug font-semibold text-ink">
                        {entry.title}
                      </span>
                      <span className="mt-1 block text-[12px] text-muted">
                        {entry.items.map((i) => i.productName).join(' · ')}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${entry.title}`}
                      onClick={() => remove(entry.id)}
                      className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-2 hover:text-danger focus-visible:opacity-100"
                    >
                      <Icon name="X" size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* -------------------------------------------------- continue */}
        {recent.length > 0 && (
          <Section
            title="Your recent comparisons"
            subtitle="Priority weights are remembered per category, so these open exactly as you left them."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((comparison, index) => {
                const category = getCategory(comparison.category)
                return (
                  <button
                    key={comparison.ids.join(',')}
                    type="button"
                    style={{ '--i': index } as React.CSSProperties}
                    onClick={() => startMatchup(comparison.category, comparison.ids)}
                    className="group ts-card flex flex-col p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">
                      {category && <Icon name={category.icon} size={12} />}
                      {category?.label}
                    </span>
                    <span className="mt-2.5 flex-1 text-[14px] leading-snug font-medium text-ink">
                      {comparison.names.join('  ·  ')}
                    </span>
                    <span className="mt-3 flex items-center gap-1 text-[12px] font-medium text-brand-text">
                      Reopen
                      <Icon
                        name="ArrowRight"
                        size={12}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>
        )}

        {/* -------------------------------------------------- suggestions */}
        {picks.length > 0 && (
          <Section
            title="Worth a look"
            subtitle="Built from what you've actually opened — and it always tells you why."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {picks.map((pick, index) => {
                const category = getCategory(pick.category)
                const products = catalogue
                  .catalogueFor(pick.category)
                  .filter((p) => pick.ids.includes(p.id))
                return (
                  <button
                    key={`${pick.category}-${pick.ids.join(',')}`}
                    type="button"
                    style={{ '--i': index } as React.CSSProperties}
                    onClick={() => startMatchup(pick.category, pick.ids)}
                    className="group ts-card relative overflow-hidden p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div className="flex -space-x-3">
                      {products.slice(0, 4).map((product) => (
                        <span
                          key={product.id}
                          className="h-12 w-10 shrink-0 rounded-lg border border-line bg-surface"
                        >
                          <DeviceGlyph
                            category={product.category}
                            accent={product.accent}
                            glow={false}
                          />
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-4 text-[15px] leading-snug font-semibold text-ink">
                      {pick.title}
                    </h3>
                    <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted">
                      <Icon name="Lightbulb" size={13} className="mt-0.5 shrink-0 text-best" />
                      {pick.reason}
                    </p>
                    <p className="mt-3 text-[11px] font-medium tracking-wide text-faint uppercase">
                      {category?.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </Section>
        )}

        {/* --------------------------------------------------- categories */}
        <Section
          title={hasHistory ? 'Your categories' : 'Choose a category'}
          subtitle={
            hasHistory
              ? 'Ordered by how much you use them.'
              : 'Comparisons stay within a category so every spec is genuinely like-for-like.'
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const devices = catalogue.catalogueFor(category.id)
              const stats = catalogue.statsFor(category.id)
              const used = profile.categoryUse[category.id] ?? 0
              return (
                <button
                  key={category.id}
                  type="button"
                  style={{ '--i': index } as React.CSSProperties}
                  onClick={() => selectCategory(category.id)}
                  className="group ts-card relative overflow-hidden p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div
                    className="pointer-events-none absolute -right-10 -bottom-12 h-36 w-36 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-30"
                    style={{ background: seriesColor(index) }}
                  />
                  <div className="relative flex items-start gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-2 transition-colors group-hover:border-line-strong"
                      style={{ color: seriesColor(index) }}
                    >
                      <Icon name={category.icon} size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15.5px] font-semibold text-ink">{category.label}</h3>
                        {stats.total > 0 && (
                          <Badge tone="brand" icon="Pencil">
                            {stats.total} YOURS
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                        {category.blurb}
                      </p>
                      <p className="tnum mt-3 text-[11.5px] font-medium tracking-wide text-faint uppercase">
                        {devices.length} devices · {category.specs.length} specs
                        {used > 0 && ` · opened ${used}×`}
                      </p>
                    </div>
                    <Icon
                      name="ArrowUpRight"
                      size={16}
                      className="shrink-0 text-faint opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* ----------------------------------------------------- matchups */}
        {!hasHistory && (
          <Section
            title="Popular matchups"
            subtitle="Curated head-to-heads, already loaded and ready to reweight."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED_MATCHUPS.map((matchup, index) => {
                const category = getCategory(matchup.category)
                if (!category) return null
                const products = catalogue
                  .catalogueFor(matchup.category)
                  .filter((p) => matchup.ids.includes(p.id))
                if (products.length < 2) return null
                return (
                  <button
                    key={matchup.title}
                    type="button"
                    style={{ '--i': index } as React.CSSProperties}
                    onClick={() => startMatchup(matchup.category, matchup.ids)}
                    className="group ts-card flex flex-col p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div className="flex -space-x-3">
                      {products.slice(0, 4).map((product) => (
                        <span
                          key={product.id}
                          className="h-12 w-10 shrink-0 rounded-lg border border-line bg-surface"
                        >
                          <DeviceGlyph
                            category={product.category}
                            accent={product.accent}
                            glow={false}
                          />
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold text-ink">{matchup.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {matchup.subtitle}
                    </p>
                    <p className="mt-4 flex items-center gap-1.5 text-[12.5px] font-medium text-brand-text">
                      Open comparison
                      <Icon
                        name="ArrowRight"
                        size={13}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </p>
                  </button>
                )
              })}
            </div>
          </Section>
        )}

        {/* ------------------------------------------------ how it works */}
        <Section title="How it works">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HowCard
              icon="Scale"
              step="01"
              title="Scored against the whole class"
              body="Every spec is 0–100 against all devices in its category, not just the ones you picked. A full bar means class-leading."
            />
            <HowCard
              icon="SlidersHorizontal"
              step="02"
              title="Weighted by you"
              body="Specs roll into pillars, pillars roll up using your sliders. Change one and the winner can change with it."
            />
            <HowCard
              icon="Target"
              step="03"
              title="Auditable to the spec"
              body="Open any pillar to see the specs behind it, their weights and the points each contributed. They always sum."
            />
            <HowCard
              icon="Pencil"
              step="04"
              title="Yours to correct"
              body="Disagree with a number? Change it. Add a device we don't have. Export the whole catalogue as JSON."
            />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="py-7">
      <div className="mb-4 max-w-2xl">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function HowCard({
  icon,
  step,
  title,
  body,
}: {
  icon: string
  step: string
  title: string
  body: string
}) {
  return (
    <div className="ts-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-brand-text">
          <Icon name={icon} size={17} />
        </span>
        <span className="tnum text-[11px] font-semibold tracking-wider text-faint">{step}</span>
      </div>
      <h3 className="mt-4 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{body}</p>
    </div>
  )
}
