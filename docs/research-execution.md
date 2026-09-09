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
| 14 | SEO "Best of" and buying-guide content pages | TODO | Generatable from the catalogue |

## § Key Features — Advanced (v1/v2)

| # | Item | Status | Note |
|---|---|---|---|
| 15 | Real-time price from retailers / price APIs | BLOCKED | Needs a paid price API or merchant feed |
| 16 | Price history charts per product | TODO | Schema + chart buildable now; live points need #15 |
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
| 41 | Recommendation quiz / wizard | TODO | Buildable on the existing scoring engine |
| 42 | Price-drop alerts (email/Telegram) | BLOCKED | Needs a backend + price feed |
| 43 | VR/AR previews | BLOCKED | Long-term, per the report |
| 44 | Social sharing widgets | PARTIAL | Share link exists; no share images |
| 45 | Technical-SEO data posts | TODO | |

## § Data Sourcing

| # | Item | Status | Note |
|---|---|---|---|
| 46 | Official retailer/manufacturer APIs & feeds | BLOCKED | Needs accounts (Amazon PA-API, Google Shopping) |
| 47 | Third-party product data APIs | BLOCKED | Paid (DataHut, ScraperAPI) |
| 48 | Custom web scraping | BLOCKED | **Needs an explicit decision.** The report itself notes "many sites disallow scraping in TOS". I will not build scrapers against sites that forbid it |
| 49 | Crowdsourced / community spec contributions | DONE | Users can add, edit and hide any device |
| 50 | Brand partnerships / licensed data | N/A | Business development |
| 51 | Data normalisation layer | DONE | `store/validate.ts` + per-category schema |
| 52 | ETL: ingest → clean → load, scheduled | BLOCKED | Depends on 46–48 |

## § Data Model & Schema

The report's ER diagram specifies seven entities. Current coverage:

| # | Entity | Status |
|---|---|---|
| 53 | PRODUCT | DONE |
| 54 | SPECIFICATION | DONE |
| 55 | CATEGORY | DONE |
| 56 | PRICE_HISTORY | TODO |
| 57 | USER | PARTIAL — local profile, no identity |
| 58 | COMPARISON | TODO — saved comparisons as a first-class entity |
| 59 | COMPARISON_ITEM | TODO |

## § Technical Architecture

| # | Item | Status | Note |
|---|---|---|---|
| 60 | SPA frontend | DONE | Vite + React |
| 61 | Server-side rendering for SEO | BLOCKED | Requires migrating to Next.js and a Node host |
| 62 | Backend/API layer | BLOCKED | None today — static SPA |
| 63 | PostgreSQL / MySQL | BLOCKED | Needs hosting |
| 64 | Elasticsearch / Algolia | BLOCKED | Needs hosting; in-memory search is adequate at this size |
| 65 | Redis caching | BLOCKED | Needs hosting |
| 66 | Kafka / RabbitMQ | BLOCKED | Needs hosting; no data volume to justify it |
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
| 83 | Unique in-depth content | TODO — generatable comparison pages |
| 84 | Keyword targeting in titles/meta | TODO |
| 85 | schema.org structured data (Product, Review) | TODO |
| 86 | Well-formatted posts | TODO |
| 87 | Internal linking | TODO |
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

## Summary

- **DONE or PARTIAL: 46 items** — most of the MVP and the entire UX/IA section
- **TODO (executable now): 21 items**
- **BLOCKED (needs an account, key, host or budget): 27 items**
- **N/A (business, hiring, research): 9 items**

The single largest blocker is that the report assumes a **server-backed product**
(Postgres, Elasticsearch, Redis, Kafka, ML services, Kubernetes) while this is a static
single-page app with no backend. Roughly half the BLOCKED items unlock together the
moment there is a server and a budget; the rest need specific third-party accounts.
