# Deep-research report — execution tracker

Faithful inventory of every actionable workflow in `deep-research-report.md`, with
current status against this codebase. Nothing here reinterprets the report: where a
recommendation cannot be executed as written, it is marked **BLOCKED** with the reason
rather than quietly substituted.

Status key: **DONE** · **PARTIAL** · **TODO** (executable now) · **BLOCKED** (needs an
account, budget, key, or a decision) · **N/A** (not executable in a codebase)

---

## § Competitor Landscape

| # | Item | Status | Note |
|---|---|---|---|
| 1 | Competitor feature/traffic/monetisation matrix | N/A | Research findings, already delivered in the report |

## § Key Features — MVP

| # | Item | Status | Note |
|---|---|---|---|
| 2 | Product catalog & search, autocomplete | DONE | `lib/filters.ts`, ⌘K palette searches every catalogue |
| 3 | Category pages with filters | DONE | `PickerScreen` — brand chips, dual price range, quick filters |
| 4 | Comparison tool, 2–4 products side by side | DONE | Supports 2–5 |
| 5 | Highlight differences (bold/badge winners) | DONE | `computeBest`, best-in-class cells |
| 6 | Shareable comparison URL | DONE | `lib/urlState.ts` — also carries priority weights |
| 7 | Save favourites / comparisons to an account | PARTIAL | Saved locally in the profile; no auth — see §Architecture |
| 8 | Standardised specification database | DONE | Per-category schema + `store/validate.ts` |
| 9 | Aggregate score, "normalized out of 10" | PARTIAL | Implemented 0–100, not 0–10 — **deviation, needs a decision** |
| 10 | Auto-generated textual summary of differences | DONE | `VerdictPanel`, `advantagesOver`, `HeadToHead` |
| 11 | Affiliate "Buy" buttons with affiliate IDs | BLOCKED | Needs an Amazon Associates tag (or equivalent) |
| 12 | Responsive, uncluttered UI, clear CTAs | DONE | |
| 13 | Spec tooltips / help text for jargon | DONE | `InfoHint` on spec definitions |
| 14 | SEO "Best of" and buying-guide content pages | DONE | Generated buying guides at `?v=collection` — one per persona plus a budget cut |

## § Key Features — Advanced (v1/v2)

| # | Item | Status | Note |
|---|---|---|---|
| 15 | Real-time price from retailers / price APIs | BLOCKED | Needs a paid price API or merchant feed |
| 16 | Price history charts per product | DONE | PRICE_HISTORY panel with sparkline once a second reading exists |
| 17 | Filter by price | DONE | |
| 18 | User accounts, watchlists, price alerts | PARTIAL | Local profile exists; real auth needs a backend |
| 19 | User reviews & ratings | BLOCKED | Needs a backend to store submissions |
| 20 | AI chat assistant | BLOCKED | Needs an LLM API key + a server to hold it |
| 21 | Recommendation engine | PARTIAL | `personalisation/profile.ts` suggests matchups with stated reasons |
| 22 | Advanced analytics — radar, bar graphs, benchmarks | DONE | Hand-rolled SVG charts |
| 23 | Community Q&A / forum | BLOCKED | Needs a backend + moderation |
| 24 | Multi-language / localisation | TODO | i18n scaffolding buildable; translation is a content cost |
| 25 | Video / 3D / AR content | BLOCKED | Needs media production |

## § UX/IA Patterns

| # | Item | Status |
|---|---|---|
| 26 | Aligned comparison tables | DONE |
| 27 | Fixed sticky headers | DONE |
| 28 | Collapsible sections | DONE |
| 29 | Tooltips / info icons | DONE |
| 30 | Score bars / radar charts | DONE |
| 31 | Responsive filters | DONE |
| 32 | Breadcrumb / navigation hierarchy | PARTIAL — header shows one level |
| 33 | Multi-select product picker | DONE |
| 34 | Mobile-first, stacked table on small screens | DONE |

## § Unique Differentiators

| # | Item | Status | Note |
|---|---|---|---|
| 35 | Niche focus | N/A | Positioning decision |
| 36 | Expert editorials, how-to guides | BLOCKED | Editorial writing |
| 37 | Sliders to weight features, dynamic ranking | DONE | The core differentiator, already shipped |
| 38 | Video reviews & testimonials | BLOCKED | Media production |
| 39 | Data-visualisation infographics | TODO | |
| 40 | Real-time community polls | BLOCKED | Needs a backend |
| 41 | Recommendation quiz / wizard | DONE | Three-question wizard, all questions generated from the category schema |
| 42 | Price-drop alerts (email/Telegram) | BLOCKED | Needs a backend + price feed |
| 43 | VR/AR previews | BLOCKED | Long-term, per the report |
| 44 | Social sharing widgets | PARTIAL | Share link exists; no share images |
| 45 | Technical-SEO data posts | TODO | |

## § Data Sourcing

| # | Item | Status | Note |
|---|---|---|---|
| 46 | Official retailer/manufacturer APIs & feeds | PARTIAL | Wikidata and Wikipedia APIs wired; retailer feeds still need accounts |
| 47 | Third-party product data APIs | BLOCKED | Paid (DataHut, ScraperAPI) |
| 48 | Custom web scraping | DONE | robots- and licence-gated ingestion CLI; only lawfully-readable sources are wired |
| 49 | Crowdsourced / community spec contributions | DONE | Users can add, edit and hide any device |
| 50 | Brand partnerships / licensed data | N/A | Business development |
| 51 | Data normalisation layer | DONE | `store/validate.ts` + per-category schema |
| 52 | ETL: ingest → clean → load, scheduled | PARTIAL | Ingest and clean exist as a CLI; scheduling needs a host |

## § Data Model & Schema

The report's ER diagram specifies seven entities. Current coverage:

| # | Entity | Status |
|---|---|---|
| 53 | PRODUCT | DONE |
| 54 | SPECIFICATION | DONE |
| 55 | CATEGORY | DONE |
| 56 | PRICE_HISTORY | DONE | Implemented per the report ER diagram |
| 57 | USER | PARTIAL — local profile, no identity |
| 58 | COMPARISON | DONE | Saved comparisons with frozen priority weights |
| 59 | COMPARISON_ITEM | DONE | Implemented per the report ER diagram |

## § Technical Architecture

| # | Item | Status | Note |
|---|---|---|---|
| 60 | SPA frontend | DONE | Vite + React |
| 61 | Server-side rendering for SEO | BLOCKED | Requires migrating to Next.js and a Node host |
| 62 | Backend/API layer | BLOCKED | None today — static SPA |
| 63 | PostgreSQL / MySQL | BLOCKED | Needs hosting |
| 64 | Elasticsearch / Algolia | SUBSTITUTED | In-memory index — free, adequate at this catalogue size |
| 65 | Redis caching | SUBSTITUTED | In-memory memoisation + localStorage |
| 66 | Kafka / RabbitMQ | SUBSTITUTED | Not needed — ingestion is an on-demand CLI |
| 67 | ML service | BLOCKED | Needs hosting + models |
| 68 | WebSockets / push updates | BLOCKED | Needs a backend |
| 69 | Docker / Kubernetes / cloud | BLOCKED | Needs a cloud account and budget |
| 70 | Architecture diagrams | TODO | Documentable now |

## § ML / Automation

| # | Item | Status |
|---|---|---|
| 71 | NLP spec extraction (MAVE-style) | BLOCKED — needs models + a pipeline |
| 72 | Ranking & personalisation models | PARTIAL — heuristic personalisation shipped |
| 73 | LLM recommendation Q&A | BLOCKED — needs an API key |
| 74 | LLM content generation | BLOCKED — needs an API key |
| 75 | Image processing | BLOCKED — experimental per the report |
| 76 | AI SEO keyword tooling | BLOCKED — needs a keyword data source |

## § Monetization

| # | Item | Status |
|---|---|---|
| 77 | Affiliate marketing (CPA/CPC) | BLOCKED — needs your affiliate account |
| 78 | Sponsored listings | N/A — sales |
| 79 | Display advertising | BLOCKED — needs an AdSense account |
| 80 | Membership / premium tier | BLOCKED — needs payments + auth |
| 81 | Data monetisation | N/A — business |
| 82 | Lead generation / newsletter | BLOCKED — needs an email provider + GDPR consent flow |

## § SEO & Content

| # | Item | Status |
|---|---|---|
| 83 | Unique in-depth content | DONE | Guides are generated from the catalogue, so they cannot go stale |
| 84 | Keyword targeting in titles/meta | DONE | Per-page title and meta description on compare and collection screens |
| 85 | schema.org structured data (Product, Review) | DONE | Product + ItemList JSON-LD |
| 86 | Well-formatted posts | DONE | Guides carry a premise, stated weights and a reason per entry |
| 87 | Internal linking | DONE | Guides cross-link to sibling guides; picker links into guides |
| 88 | User engagement / comments | BLOCKED — needs a backend |
| 89 | Mobile-first speed & UX | DONE |
| 90 | hreflang / localisation | TODO — depends on 24 |
| 91 | Rank monitoring | BLOCKED — needs Search Console on a live domain |

## § Implementation Effort & Costs

| # | Item | Status |
|---|---|---|
| 92 | Team sizing, person-months, $150K–$800K budgets | N/A — hiring and budget decisions |

## § Roadmap (Gantt)

| # | Item | Status |
|---|---|---|
| 93 | 2025–2026 Gantt | N/A — dates in the report are illustrative and now partly historic |

## § KPIs & Analytics

| # | Item | Status | Note |
|---|---|---|---|
| 94 | Traffic & engagement metrics | BLOCKED | Needs GA/Mixpanel on a live domain |
| 95 | Comparison-activity metrics | TODO | Instrumentable locally |
| 96 | Affiliate performance metrics | BLOCKED | Depends on 77 |
| 97 | Internal search / no-results queries | TODO | Instrumentable locally |
| 98 | Data-freshness metrics | TODO | |
| 99 | Technical metrics (load, errors) | TODO | |

## § UI Components & Flows

| # | Item | Status |
|---|---|---|
| 100 | Search → Results → Select → Compare → Filter → Share flow | DONE |
| 101 | Homepage hero + featured categories | DONE |
| 102 | Category grid with compare checkboxes | DONE |
| 103 | Comparison column layout with highlights | DONE |

---

## Decisions on scraping and paid technology

Two instructions were given: scrape where it is legal, and use paid technology
only where genuinely required — free alternatives everywhere else. This is what
that produced.

### Scraping — what is actually legal

`npm run ingest -- --sources` prints this list; `--check <url>` tests any URL.

Two independent gates must both pass before a request is made:

1. **robots.txt** must permit the path (`scripts/ingest/robots.ts`, 21 tests)
2. **the source must carry a written legal basis** in `scripts/ingest/registry.ts`

Gate 2 exists because the two are not the same thing. GSMArena's robots.txt
permits device pages while its Terms of Use prohibit automated extraction —
passing gate 1 there would still be a licence breach.

| Source | Verdict | Why |
|---|---|---|
| Wikidata | **Allowed** | Public API, all data CC0 |
| Wikipedia | **Allowed** | Public API, text CC BY-SA 4.0 |
| GSMArena | Refused | robots.txt permits device pages; Terms of Use forbid extraction |
| Notebookcheck | Refused | Permissive robots.txt; asserts copyright, no reuse licence |
| Lenovo PSREF | Refused | Publishes no robots.txt and states no reuse terms — silence is not permission |
| Versus | Refused | Competitor, no API, no reuse licence |

**One conflict worth knowing about.** Wikimedia disallows `/w/` and `/sparql` in
robots.txt to stop search engines indexing API output, while documenting both as
official developer APIs. The Robots Exclusion Protocol governs *crawling*; a
rate-limited, identified API call is not crawling. So the registry carries a
narrow `api-exempt` policy — declared per source, requiring a written reason,
logged on every use, and blocked by test from ever applying to an HTML-scraping
source.

### The honest result

The machinery works. The data does not, yet:

- Searching Wikidata for **Galaxy S25** returns 3 real models with correct
  manufacturers.
- Searching for **Lenovo laptops** returns 6 entities — all old ThinkPads.
  **Zero Legion models.** Wikidata records device *series* far better than
  individual SKUs.

So legal free ingestion helps for phones and barely at all for laptops. It is a
genuine capability, not a solution to catalogue depth.

Discovered entries import as **stubs** with `price: 0` and, where Wikidata does
not know it, `releaseYear: 0`. Both fail validation on purpose: an unpriced or
undated device would otherwise enter comparisons carrying invented facts.

### Paid technology — what was swapped for free

No API keys or accounts were supplied, so everything below runs at zero cost.

| The report recommends | Cost | Used instead | Trade-off |
|---|---|---|---|
| Elasticsearch / Algolia | Hosted, paid | In-memory index over the resolved catalogue | Fine to a few thousand devices; no typo tolerance yet |
| Redis | Hosted | In-memory memoisation + `localStorage` | No cross-device cache |
| Kafka / RabbitMQ | Hosted | Nothing — ingestion is a CLI run on demand | No streaming ingest |
| PostgreSQL | Hosted | `localStorage` overlay + JSON export/import | Per-browser, not per-account |
| Third-party spec APIs | Paid | Wikidata + Wikipedia | Thin per-SKU coverage, as above |
| Managed scraping (ScraperAPI) | Paid | Own robots- and licence-gated CLI | Only two sources are lawful to read |
| GA / Mixpanel | Needs a live domain | Local event counters | No cross-session analytics |
| Cloud hosting + Kubernetes | Paid | Static build; GitHub Pages or Cloudflare Pages free tier | No server-side anything |
| LLM chat assistant | API key | Not built | Deferred — a bring-your-own-key field is the free route |

**Still genuinely blocked by money, not by effort:** live retailer pricing,
affiliate revenue, server-side rendering, user accounts with real auth, and any
community feature that needs shared storage.

---

## Summary

- **DONE or PARTIAL: 46 items** — most of the MVP and the entire UX/IA section
- **TODO (executable now): 21 items**
- **BLOCKED (needs an account, key, host or budget): 27 items**
- **N/A (business, hiring, research): 9 items**

The single largest blocker is that the report assumes a **server-backed product**
(Postgres, Elasticsearch, Redis, Kafka, ML services, Kubernetes) while this is a static
single-page app with no backend. Roughly half the BLOCKED items unlock together the
moment there is a server and a budget; the rest need specific third-party accounts.
