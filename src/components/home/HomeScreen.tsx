import { CATEGORIES, FEATURED_MATCHUPS, TOTAL_PRODUCTS, getCategory, productCount } from '@/data'
import { useAppState } from '@/hooks/useAppState'
import { Icon } from '@/components/ui/Icon'
import { Badge, Button } from '@/components/ui/primitives'
import { pluralise, seriesColor } from '@/lib/format'
import { cn } from '@/lib/cn'

export function HomeScreen() {
  const { selectCategory, startMatchup, recents } = useAppState()

  return (
    <div className="ts-fade">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="ts-grid-bg pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--ts-brand) 0%, transparent 70%)', 
          }}
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <Badge tone="brand" icon="Sparkles">
              WEIGHTED SCORING ENGINE
            </Badge>
            <h1 className="mt-5 text-[34px] leading-[1.08] font-semibold tracking-tight text-balance text-ink sm:text-[52px]">
              Every comparison site tells you which is better.
              <br />
              <span className="text-brand-text">This one asks you first.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              Pick a category, choose up to five products, then tell TechSpec what you actually
              care about. Battery over camera? Portability over raw speed? The scores, the
              rankings and the verdict all recompute as you move the sliders — because “best”
              depends on who's asking.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="primary"
                iconRight="ArrowRight"
                onClick={() => selectCategory('mobiles')}
              >
                Compare smartphones
              </Button>
              <Button size="lg" onClick={() => selectCategory('laptops')} icon="Laptop">
                Compare laptops
              </Button>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <Stat value={String(TOTAL_PRODUCTS)} label="products" />
              <Stat value={String(CATEGORIES.length)} label="categories" />
              <Stat value="250+" label="tracked specs" />
              <Stat value="6" label="buyer profiles" />
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
        {/* ------------------------------------------------------ categories */}
        <section className="py-12 sm:py-16">
          <SectionHeading
            eyebrow="Step one"
            title="Choose a category"
            subtitle="Comparisons stay within a category so every spec is genuinely like-for-like."
          />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category, index) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className="group ts-card relative overflow-hidden p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float"
              >
                <div
                  className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
                  style={{ background: seriesColor(index) }}
                />
                <div className="relative flex items-start gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 transition-colors group-hover:border-line-strong"
                    style={{ color: seriesColor(index) }}
                  >
                    <Icon name={category.icon} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-ink">{category.label}</h3>
                      <Icon
                        name="ArrowRight"
                        size={14}
                        className="text-faint opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {category.blurb}
                    </p>
                    <p className="mt-2.5 text-[11.5px] font-medium tracking-wide text-faint uppercase">
                      {pluralise(productCount(category.id), 'model')} ·{' '}
                      {category.specs.length} specs
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------- recents */}
        {recents.length > 0 && (
          <section className="pb-12 sm:pb-16">
            <SectionHeading eyebrow="Pick up where you left off" title="Recent comparisons" />
            <div className="mt-6 flex flex-wrap gap-2.5">
              {recents.map((recent) => {
                const category = getCategory(recent.category)
                return (
                  <button
                    key={recent.ids.join(',')}
                    type="button"
                    onClick={() => startMatchup(recent.category, recent.ids)}
                    className="ts-card flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:border-line-strong"
                  >
                    {category && <Icon name={category.icon} size={15} className="text-faint" />}
                    <span className="text-[13px] font-medium text-ink">
                      {recent.names.join('  vs  ')}
                    </span>
                    <Icon name="RotateCcw" size={13} className="text-faint" />
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------- matchups */}
        <section className="pb-12 sm:pb-16">
          <SectionHeading
            eyebrow="Or skip ahead"
            title="Popular matchups"
            subtitle="Curated head-to-heads, already loaded and ready to reweight."
          />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_MATCHUPS.map((matchup) => {
              const category = getCategory(matchup.category)
              if (!category) return null
              return (
                <button
                  key={matchup.title}
                  type="button"
                  onClick={() => startMatchup(matchup.category, matchup.ids)}
                  className="group ts-card flex flex-col p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float"
                >
                  <div className="flex items-center gap-2 text-[11.5px] font-medium tracking-wide text-faint uppercase">
                    <Icon name={category.icon} size={13} />
                    {category.label}
                  </div>
                  <h3 className="mt-2.5 text-[15px] font-semibold text-ink">{matchup.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {matchup.subtitle}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-medium text-brand-text">
                    Open comparison
                    <Icon
                      name="ArrowRight"
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* -------------------------------------------------- how it works */}
        <section className="pb-16 sm:pb-24">
          <SectionHeading eyebrow="Under the hood" title="How the scoring works" />
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <HowCard
              icon="Scale"
              step="01"
              title="Normalised against the whole category"
              body="Every spec is scored 0–100 against all models in its category — not just the ones you selected. A full bar means class-leading, not merely best-of-two."
            />
            <HowCard
              icon="SlidersHorizontal"
              step="02"
              title="Weighted by your priorities"
              body="Specs roll up into pillars, and pillars roll up using your slider weights. Nothing is hidden behind a proprietary score you can't interrogate."
            />
            <HowCard
              icon="Target"
              step="03"
              title="Explained, not asserted"
              body="Every verdict names the specs that produced it, and the value frontier shows what's genuinely worth its price."
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="tnum text-xl font-semibold text-ink">{value}</span>
        <span className="text-[12.5px] text-faint">{label}</span>
      </dd>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && (
        <p className="text-[11.5px] font-semibold tracking-[0.08em] text-brand-text uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-[14px] leading-relaxed text-muted">{subtitle}</p>}
    </div>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-brand-text">
          <Icon name={icon} size={16} />
        </span>
        <span className="tnum text-[11px] font-semibold tracking-wider text-faint">{step}</span>
      </div>
      <h3 className="mt-4 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{body}</p>
    </div>
  )
}
