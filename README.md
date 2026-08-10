# TechSpec

**Comparison, weighted your way.** A technical product comparison engine for phones, laptops,
tablets, smartwatches, headphones and cameras.

Most comparison sites publish one score and ask you to accept their priorities. TechSpec asks
for yours first: you set what matters, and the scores, the ranking, the winner and the verdict
all recompute live — then travel with the share link.

```bash
npm install
npm run dev
```

---

## What makes it different

| | Typical comparison site | TechSpec |
|---|---|---|
| Scoring | One fixed editorial score | Seven weighted pillars you control with sliders |
| Normalisation | Best-of-the-two-you-picked | 0–100 against the **entire category catalogue** |
| Verdict | "X is better" | Names the specs that produced the result, and where the winner gives ground |
| Price | A column in the table | A Pareto **value frontier** — shows what's genuinely worth its price |
| Sharing | A link to a page | A link that carries **your weights**, so the recipient sees your priorities |
| Personas | — | Six independent buyer weightings, one tap to load |

The engine is the product. `src/lib/scoring.ts` is ~250 lines and fully inspectable — nothing
is hidden behind a proprietary index.

---

## App structure & major screens

```
Home  ──►  Picker  ──►  Compare
 │           │            │
 │           │            └── verdict · priorities · charts · personas · head-to-head · spec sheet
 │           └── search · filters · sort · product grid · sticky compare tray (2–5 slots)
 └── category grid · recent comparisons · curated matchups · methodology
```

**1. Home** — category selection (the hard gate that keeps every comparison like-for-like),
recent comparisons restored from `localStorage`, curated matchups that jump straight to a
loaded comparison, and a plain-English explanation of how scoring works.

**2. Picker** — search across name/brand/spec text, brand chips, a dual-thumb price range,
category-specific quick filters ("120Hz+", "Has telephoto", "Dual-band GPS"), six sort modes,
and a sticky tray that always shows five slots so the 2–5 rule needs no instructions.

**3. Compare** — the payoff, in deliberate reading order:

| Section | Answers |
|---|---|
| **Verdict panel** | Who wins, why, and where it gives ground |
| **Priority panel** | "…but what if I care about battery instead?" |
| **Radar chart** | Shape of each product's capability across all pillars |
| **Value scatter** | Is it worth the money? (with the Pareto frontier drawn) |
| **Persona grid** | Who is each of these actually *for*? |
| **Head to head** | Which specs produced each product's lead |
| **Spec sheet** | The full evidence, grouped and highlighted |

---

## UI layout & component breakdown

```
src/
├── types.ts                    Domain model: Category, SpecDef, Pillar, Persona, ScoredProduct
├── lib/
│   ├── scoring.ts              ★ Normalisation, pillars, weighted overall, value index,
│   │                             Pareto frontier, persona verdicts, generated explanations
│   ├── filters.ts              Search scoring, filtering, sorting, cached baseline scores
│   ├── format.ts               Spec/price/delta formatting, series colours
│   ├── urlState.ts             URL ⇄ state (the URL *is* the app state)
│   ├── export.ts               CSV, plain-text summary, clipboard with fallback
│   └── cn.ts                   Class joiner
├── data/
│   ├── index.ts                Registry, hydration, async catalogue loader, group metadata
│   ├── shared.ts               Cross-category specs (price, release year), brand accents
│   └── categories/             One file per category: spec schema + pillars + personas
│       ├── mobiles.ts          16 products · 47 specs · 7 pillars
│       ├── laptops.ts          14 products · 38 specs · 7 pillars
│       ├── tablets.ts           8 products · 32 specs
│       ├── smartwatches.ts      8 products · 34 specs
│       ├── headphones.ts       10 products · 29 specs
│       └── cameras.ts           9 products · 35 specs
├── hooks/
│   ├── useAppState.tsx         Provider: selection, priorities, filters, loading, recents, toast
│   └── useMediaQuery.ts        Drives the spec table's layout switch
└── components/
    ├── DeviceGlyph.tsx         Procedural SVG device artwork, tinted per brand
    ├── ui/                     Button · Chip · Badge · Switch · SegmentedControl · Tooltip
    │                           InfoHint · Skeleton · EmptyState · StarRating · DualRange · Icon
    ├── charts/                 RadarChart · SpecBar · LabelledBar · ValueScatter · ScoreRing
    ├── layout/AppShell.tsx     Header, breadcrumb, theme toggle, toast host, footer
    ├── home/HomeScreen.tsx
    ├── picker/                 PickerScreen · ProductCard (+ skeleton) · CompareTray
    └── compare/                CompareScreen · VerdictPanel · PriorityPanel · ProductColumns
                                PersonaGrid · HeadToHead · SpecTable · ExportBar
```

★ = the file worth reading first.

**No chart library.** Radar, scatter, bars and rings are hand-drawn SVG — fully themeable,
theme-aware, printable, and worth ~0 KB of dependency weight. Total runtime deps: `react`,
`react-dom`, `lucide-react`.

**No product photos.** `DeviceGlyph` draws a per-category silhouette tinted with the brand
accent. No licensing questions, no broken images, no inconsistent framing.

---

## How the scoring works

1. **Normalise.** Every spec becomes 0–100 against the whole category catalogue, inverted for
   lower-is-better specs (weight, price, charge time). Enums rank by position; booleans are
   0/1. A spec every product shares scores 50 rather than inventing a winner.
2. **Roll up into pillars.** Each pillar is a weighted mean of its member specs. Missing
   values are skipped and the remaining weights re-normalised, so a product isn't punished
   for an unreported spec.
3. **Roll up into an overall score** using *your* slider weights (0–10 per pillar).
4. **Value index** = score ÷ √(price ÷ category median). The square root stops a $99 product
   from winning purely by being cheap — it rewards efficiency, not frugality.
5. **Value frontier** = the Pareto-optimal set: products nothing else beats on price *and*
   score.

The overall score is a **match score, not a quality grade**. 100 would mean topping every
weighted pillar across the whole category — including price, which flagships never win.

### Data honesty

Specs are compiled from manufacturer listings and published test results. A few metrics are
explicitly editorial and labelled as such in the UI (`Editorial photo score`, `ANC
effectiveness`, `Handling score`, `GPU index`). The `GPU index` is a cross-platform graphics
scale normalised so a laptop RTX 4060 = 100, because 3DMark numbers don't exist for Apple
silicon. Verify against the retailer before buying.

---

## Design system

Tokens live in `src/index.css` as semantic CSS variables mapped onto Tailwind v4 utilities via
`@theme inline`, so `bg-surface` / `text-muted` / `border-line` flip with the theme.

- **Dark-first**, with a light theme and no flash on load (pre-paint script in `index.html`).
- **Five-slot series palette** — every product keeps its colour across the tray, column
  header, radar, scatter, bars and head-to-head.
- **Never colour alone** — radar series also carry distinct dash patterns and marker shapes;
  best-in-class cells get a check icon and a left rule, not just a green tint.
- **Tabular numerals** everywhere numbers stack in columns.
- All text tiers pass **WCAG AA (≥4.5:1)** in both themes; verified at 5.5/7.4/16.2 (dark) and
  4.6/5.9/18.7 (light) for faint/muted/ink.
- `prefers-reduced-motion` honoured; skip link, focus rings, ARIA roles on charts and meters.

## Responsive behaviour

The spec table is not one layout squeezed down. Above `lg` it's a column grid with a sticky
product header; below `lg` it becomes a stacked per-spec comparison with mini bars, because a
five-column table at 375px is unreadable. One component, one set of grouping logic, two
renderings — driven by `useIsDesktop()`.

## Export & sharing

- **Share** — native share sheet where available, else copies a URL encoding category,
  selection and priority weights.
- **Copy summary** — ranked plain text, the format people actually paste into chat.
- **CSV** — full spec matrix plus pillar scores and persona verdicts.
- **Print / PDF** — a dedicated print stylesheet (`ts-no-print`, `ts-print-block`) forces
  light colours, drops interactive chrome and prevents section splits.

## Adding a category

Add one file under `src/data/categories/`, exporting a `Category` (spec schema, pillars,
personas, quick filters) and a `Product[]`, then register it in `src/data/index.ts`. No
component changes — the picker, scoring engine, charts and spec table are all category-agnostic.

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

Stack: React 19 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 · lucide-react.
