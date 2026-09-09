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
| Auditability | Trust the number | **Open any pillar** and see the specs, weights and points behind it |
| Hard requirements | Filters, at browse time | **Must-haves** that disqualify at decision time, and say why |
| The catalogue | Fixed, take it or leave it | **Yours** — edit any spec, add devices, export as JSON |
| The home screen | Same for everyone | **Adapts to you** — your priorities, history and suggestions |

The engine is the product. `src/lib/scoring.ts` is ~250 lines and fully inspectable — nothing
is hidden behind a proprietary index.

---

## App structure & major screens

```
                    ⌘K command palette  ─────┐
                                             │
Home  ──►  Picker  ──►  Compare              │  (jump anywhere,
 │           │            │                  │   search every device,
 │           │            │                  │   run any action)
 │           │            └── verdict · must-haves · priorities · charts
 │           │                personas · head-to-head · spec sheet · audit
 │           └── search · filters · sort · device grid · editor · compare tray
 └── personalised feed: continue · suggestions · your categories
```

**1. Home** — a feed, not a brochure. A first-time visitor gets the pitch and a way in;
everyone after that gets their own things first: comparisons in progress, devices they viewed
but never decided on, and their categories ordered by actual use.

**2. Picker** — search across name/brand/spec text, brand chips, a dual-thumb price range,
category-specific quick filters ("120Hz+", "Has telephoto", "Dual-band GPS"), six sort modes,
and a sticky tray that always shows five slots so the 2–5 rule needs no instructions. Every
card is editable, and an "add your own" card sits at the end of the grid.

**3. Compare** — the payoff, in deliberate reading order:

| Section | Answers |
|---|---|
| **Verdict panel** | Who wins, why, and where it gives ground |
| **Priority panel** | "…but what if I care about battery instead?" |
| **Radar chart** | Shape of each product's capability across all pillars |
| **Value scatter** | Is it worth the money? (with the Pareto frontier drawn) |
| **Must-haves** | What's disqualified outright, and on which requirement |
| **Score drill-down** | Where did that pillar number actually come from? |
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
│   ├── index.ts                Registry, SEED catalogue, group metadata
│   ├── shared.ts               Cross-category specs (price, release year), brand accents
│   ├── store/                  ★ The catalogue is the user's, not ours
│   │   ├── CatalogueProvider.tsx  Resolves seed + overlay, exposes CRUD
│   │   ├── overlay.ts          Compose seed with edits/additions/removals
│   │   ├── validate.ts         Runtime contract for user-supplied devices
│   │   ├── persistence.ts      localStorage, defensively
│   │   ├── transfer.ts         Import/export JSON with per-device validation
│   │   └── remoteSource.ts     Pluggable API seam (unconfigured by default)
│   └── categories/             One file per category: spec schema + pillars + personas
│       ├── mobiles.ts          16 products · 47 specs · 7 pillars
│       ├── laptops.ts          29 products · 38 specs · 7 pillars
│       ├── tablets.ts           8 products · 32 specs
│       ├── smartwatches.ts      8 products · 34 specs
│       ├── headphones.ts       10 products · 29 specs
│       └── cameras.ts           9 products · 35 specs
├── personalisation/
│   ├── profile.ts              Remembered priorities, history, affinity, suggestions
│   └── ProfileProvider.tsx     Local-only, no account, no network
├── hooks/
│   ├── useAppState.tsx         Provider: selection, priorities, filters, editor, toast
│   └── useMediaQuery.ts        Drives the spec table's layout switch
└── components/
    ├── DeviceGlyph.tsx         Procedural SVG device artwork, tinted per brand
    ├── ui/                     Button · Chip · Badge · Switch · SegmentedControl · Tooltip
    │                           InfoHint · Skeleton · EmptyState · StarRating · DualRange · Icon
    ├── charts/                 RadarChart · SpecBar · LabelledBar · ValueScatter · ScoreRing
    ├── layout/                 AppShell · CommandPalette (⌘K) · CatalogueSettings
    ├── devices/DeviceEditor.tsx  Schema-generated add/edit form
    ├── home/HomeScreen.tsx     Personalised feed
    ├── picker/                 PickerScreen · ProductCard · AddDeviceCard · CompareTray
    └── compare/                CompareScreen · VerdictPanel · PriorityPanel · ProductColumns
                                PersonaGrid · HeadToHead · SpecTable · ExportBar
                                PillarBreakdown · DealBreakers · AddProduct
```

Tests sit next to what they cover (`scoring.test.ts`, `format.test.ts`,
`urlState.test.ts`, `data/catalogue.test.ts`, `data/store/store.test.ts`,
`personalisation/profile.test.ts`), with a synthetic fixture category in
`lib/__fixtures__/`.

★ = the file worth reading first.

**No chart library.** Radar, scatter, bars and rings are hand-drawn SVG — fully themeable,
theme-aware, printable, and worth ~0 KB of dependency weight. Total runtime deps: `react`,
`react-dom`, `lucide-react`.

**No product photos.** `DeviceGlyph` draws a per-category silhouette tinted with the brand
accent. No licensing questions, no broken images, no inconsistent framing.

---

## Your catalogue

The bundled devices are a **seed, not a fixture**. Anything you change is kept as an *overlay*
on top of it — so a future seed update still reaches you: you keep your edits and inherit
corrections to everything you never touched.

```
seed (65 devices)  +  { edits, added, removed }  =  your catalogue
                          ↑ localStorage, per browser
```

- **Edit any spec** on any device. Only the fields that differ are stored, so changing one
  number doesn't persist a copy of the whole device.
- **Add devices** we don't have. The form is generated from the category's own spec schema, so
  it always matches what the engine reads.
- **Hide** built-in devices you don't care about, and restore them later.
- **Export / import** the whole thing as JSON. An import is untrusted input: bad devices are
  rejected individually with a reason, so one typo doesn't cost you the other forty.
- **Reset** per category or entirely.

Everything is validated by the same rules in `store/validate.ts` — the editor, the importer and
the remote adapter all go through it. A device that would silently score as zero, or carry an
enum value the scale doesn't know, is refused with a message you can act on.

`store/remoteSource.ts` is the seam for a real API. Nothing is configured by default because
there is no free, CORS-friendly device-spec API worth depending on; point
`VITE_CATALOGUE_ENDPOINT` at something returning the documented shape and every device flows
through the same validation.

## What it remembers

Local only. No account, no network, no identifier.

- **Priorities per category** — set your phone weights once and they're there next time.
- **History** — recent comparisons and viewed devices, capped so storage can't grow unbounded.
- **Suggestions** — built from what you actually opened, and each one states its reason
  ("You looked at these but never put them side by side"). Brand affinity decays with a
  two-week half-life so a phase last month doesn't outrank yesterday.
- **Category order** — the home screen leads with what you use.

Clear all of it from Settings → Clear history.

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

Any of it can be audited: `explainPillar()` decomposes a pillar into its member
specs, each one's weight, and the points it contributed — and the points always
sum back to the pillar score. The UI exposes this directly, so no number in the
product has to be taken on trust.

Must-haves are applied separately via `applyDealBreakers()`. They reuse the
category's own quick-filter predicates, gate the ranking and every verdict, and
never remove a product from the spec table — seeing *why* something is out
matters as much as the shortlist.

The overall score is a **match score, not a quality grade**. 100 would mean topping every
weighted pillar across the whole category — including price, which flagships never win.

### Data honesty

Specs are compiled from manufacturer listings and published test results. A few metrics are
explicitly editorial and labelled as such in the UI (`Editorial photo score`, `ANC
effectiveness`, `Handling score`, `GPU index`). The `GPU index` is a cross-platform graphics
scale normalised so a laptop RTX 4060 = 100, because 3DMark numbers don't exist for Apple
silicon. Verify against the retailer before buying.

---

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

## Testing

`npm test` runs the Vitest suite. Two kinds of test carry their weight here:

**Engine tests** run against a synthetic fixture category, so adding a phone can
never break them and every expected number is derivable by hand. They pin the
behaviours the product promises — normalisation is against the catalogue not the
selection, lower-is-better inverts, a universally-shared spec never declares a
winner, missing values re-normalise rather than penalise, moving a slider can
change the winner, and a dominated product falls off the value frontier. Several
are regression guards for bugs found in review (a persona explaining itself with
a pillar it barely weights; `2,025` rendered as a year).

**Data-integrity tests** run against all six real catalogues. The realistic
failure mode for hand-authored data is a typo — a pillar weighting a spec key
that no longer exists, an enum value missing from its own ordering, a persona
pointing at a renamed pillar. None of that throws; it silently scores zero and
quietly corrupts a verdict. These make the data validate itself, so a bad edit
fails CI instead of shipping a wrong recommendation.

CI (`.github/workflows/ci.yml`) runs typecheck, tests and a production build on
every push and pull request against `main`.

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build` | Typecheck + tests + production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Design

Deliberately quiet. This is a tool for reading numbers, so the interface recedes: neutral
greys, one accent, standard radii, a single system sans. No display face, no textures, no
glows — the data is the interest.

- **A four-control header.** Where you are, search, the one action that matters now, and a
  menu for everything else. Category navigation lives on the page and in the palette, not in a
  bar that is on screen permanently.
- **Progressive disclosure.** A comparison opens with the verdict, the ranking and your
  priority sliders. Charts, personas, head-to-head and the full spec sheet start collapsed
  behind one-line summaries; print forces every one of them open.
- **⌘K everywhere** — jump to a category, find any device across every catalogue, run an action.
- **Light-first**, with a full dark theme and no flash on load.
- **Five-slot series palette** — every device keeps its colour across the tray, column header,
  radar, scatter, bars and head-to-head.
- **Never colour alone** — radar series also carry dash patterns and marker shapes; a
  best-in-class cell gets an icon and a rule, not just a tint.
- All text tiers pass **WCAG AA** in both themes — measured 5.0 / 6.7 / 17.9 (light) and
  5.8 / 7.1 / 15.2 (dark) for faint / muted / ink, with brand, best and danger all ≥ 5.0.
- `prefers-reduced-motion` honoured; skip link, focus rings, ARIA on charts and dialogs.

