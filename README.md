<div align="center">

# ⚖️ TechSpec

### Comparison, weighted your way

**Compare phones, laptops, tablets, smartwatches, headphones and cameras by what matters to *you* —<br/>move a slider, and the scores, the winner and the verdict all recompute instantly.**

<br/>

![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
<br/>
![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white) ![No backend](https://img.shields.io/badge/runs_in-your_browser-111827?style=for-the-badge) ![No tracking](https://img.shields.io/badge/no-account_·_no_tracking-111827?style=for-the-badge)

[![CI](https://github.com/AryanDeshmukh-2711/TechSpec/actions/workflows/ci.yml/badge.svg)](https://github.com/AryanDeshmukh-2711/TechSpec/actions/workflows/ci.yml) ![Tests](https://img.shields.io/badge/tests-277_passing-2EA043) ![Devices](https://img.shields.io/badge/devices-80-C9F31D) ![Specs](https://img.shields.io/badge/specs-215-C9F31D)

</div>

---

## 👋 In 30 seconds

<table>
<tr>
<td width="22%">

😟 **The problem**

</td>
<td>

Comparison sites publish one score and expect you to accept their priorities. A gamer and a traveller want very different phones, yet they're shown the same "winner" — and no one can see how that number was made.

</td>
</tr>
<tr>
<td width="22%">

💡 **The idea**

</td>
<td>

TechSpec asks for **your** priorities first. Every spec is scored against the whole category, rolled up into pillars *you* weight with sliders, and any number can be opened to see exactly where it came from.

</td>
</tr>
<tr>
<td width="22%">

🎯 **Who it's for**

</td>
<td>

Anyone choosing a gadget who wants the reasoning, not just a star rating.

</td>
</tr>
<tr>
<td width="22%">

🚦 **Where it is**

</td>
<td>

Works end to end: **6 categories, 80 devices, 215 specs**, with 277 automated tests. It runs entirely in the browser — no account, no server, no tracking.

</td>
</tr>
</table>

---

## 🧭 How it works

```mermaid
flowchart TB
    subgraph R1[" "]
        direction LR
        A["📂 Pick a<br/>category"] --> B["📱 Choose 2 to 5<br/>devices"] --> C["🎚️ Set what<br/>matters to you"]
    end
    subgraph R2[" "]
        direction LR
        D["🏆 See the winner<br/>and why"] --> E["💸 Check value<br/>for money"] --> F["🔗 Share it, with<br/>your priorities"]
    end
    R1 --> R2

    classDef step fill:#F7FEE7,stroke:#65A30D,stroke-width:2px,color:#1A2E05
    class A,B,C,D,E,F step
    style R1 fill:none,stroke:none
    style R2 fill:none,stroke:none
```

---

## ✨ What it can do

<table>
<tr>
<td width="50%" valign="top">

### 🎚️ Your priorities, not theirs
Each category has 6–7 **pillars** — like performance or battery — and you weight each one with a slider. The ranking, the winner and the verdict update the moment you move it.

</td>
<td width="50%" valign="top">

### 🧾 Every number explained
Open any score to see the specs behind it, each one's weight and the points it added. The points always add back up to the score — nothing has to be taken on trust.

</td>
</tr>
<tr>
<td valign="top">

### 💸 Worth the money?
A **value frontier** marks the devices nothing else beats on both price *and* score, so you can see what's genuinely good value rather than just cheap.

</td>
<td valign="top">

### 👥 Six buyer profiles
Every category has six ready-made buyer personas. One tap loads their priorities, and each device shows who it's actually *for*.

</td>
</tr>
<tr>
<td valign="top">

### 🚫 Must-haves
Mark deal-breakers like "needs a telephoto camera", and TechSpec disqualifies devices at decision time — and tells you exactly which requirement ruled each one out.

</td>
<td valign="top">

### 🏠 A home screen that learns
It remembers your priorities, your recent comparisons and devices you viewed but never compared, then suggests matchups with a stated reason. All of it stays on your device.

</td>
</tr>
<tr>
<td colspan="2" valign="top">

### 🔗 Share links that carry your view
One button shares a link that includes your priority weights, so whoever opens it sees the comparison **you** saw, not a neutral default. Plus a **⌘K** command palette to jump to any device from anywhere.

</td>
</tr>
</table>

---

## 📮 How one verdict is made

```mermaid
sequenceDiagram
    autonumber
    actor You as 👤 You
    participant App as ⚖️ TechSpec
    participant Engine as ⚙️ Scoring engine

    You->>App: Phone A vs Phone B
    App->>Engine: Their specs
    Note over Engine: Each spec scored 0–100<br/>against all 16 phones
    Engine-->>App: Pillar scores
    You->>App: Battery matters more
    App->>Engine: Your new weights
    Engine-->>App: New ranking +<br/>value frontier
    App-->>You: Verdict naming the<br/>specs that decided it
    You->>App: Share
    App-->>You: Link with your weights
```

---

## 🏗️ How it's built

```mermaid
flowchart LR
    Data[("📦 Catalogue<br/>6 categories<br/>80 devices")] --> Engine["⚙️ Scoring engine<br/>one file<br/>fully inspectable"]
    Engine --> UI["⚛️ Screens<br/>Home · Picker<br/>Compare"]
    UI <--> URL["🔗 The URL<br/>is the app state"]
    UI <--> Local["💾 Your browser<br/>priorities & history"]

    classDef core fill:#F7FEE7,stroke:#65A30D,stroke-width:2px,color:#1A2E05
    classDef store fill:#EEF2FF,stroke:#6366F1,stroke-width:2px,color:#1E1B4B
    class Engine,UI core
    class Data,URL,Local store
```

Everything runs in your browser. There's no server to call, which is why it needs no account and sends nothing anywhere.

| Layer | Tool | Why this one |
|---|---|---|
| 🖥️ Interface | **React 19 + TypeScript** | Typed from the data to the screen |
| ⚡ Build | **Vite 6** | Fast development, small production bundle |
| 🎨 Styling | **Tailwind CSS 4** | One consistent design system, light and dark |
| 📊 Charts | **Hand-drawn SVG** | Radar, scatter and bar charts with no chart library at all |
| 🧪 Tests | **Vitest** | Runs the scoring engine and every catalogue on each push |

Only **three** packages ship to the browser: `react`, `react-dom` and `lucide-react` for icons.

---

## 🛡️ Built to be trusted

| | What it means | How it's proven |
|---|---|---|
| 🔍 | **No black-box scores** | Any pillar can be broken down into its specs, weights and points, and the points always sum back to the score. |
| 🧪 | **The maths is pinned down** | The engine is tested against an invented category where every expected number can be worked out by hand, so adding a real phone can never break a test. |
| 📚 | **The data checks itself** | Tests run across all six real catalogues. A typo in a spec name fails the build instead of quietly producing a wrong verdict. |
| 🔒 | **Private by design** | No account, no network requests, no identifier. What it remembers stays in your browser, and one command clears it. |
| ♿ | **Accessible** | Text contrast measured to WCAG AA in both themes, charts never rely on colour alone, and reduced-motion is honoured. |

```mermaid
flowchart LR
    P["📝 Push"] --> T["🔎 Type<br/>check"] --> U["🧪 277<br/>tests"] --> B["🏗️ Production<br/>build"] --> G["✅ Green tick"]
    classDef ok fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    class P,T,U,B,G ok
```

---

<a name="roadmap"></a>

## 🗺️ Roadmap

| Status | Milestone |
|:---:|---|
| ✅ | Six categories: phones, laptops, tablets, smartwatches, headphones, cameras |
| ✅ | Weighted scoring, explained verdicts, the value frontier, buyer personas and must-haves |
| ✅ | A home screen that learns, the ⌘K palette, and share links that carry your priorities |
| ✅ | Light and dark themes, measured to WCAG AA |
| 🔜 | A bigger catalogue, through the ingest pipeline in `scripts/ingest/` |
| 🔜 | Live retailer prices and price-drop alerts *(needs a backend and a price feed)* |
| 🔜 | Accounts, so saved comparisons follow you between devices |
| 🔜 | More languages |

---

## 📁 What's in this repository

```
📦 TechSpec
├── 📂 src/
│   ├── lib/              the engine: scoring, filters, recommendations, URL state
│   ├── data/categories/  one file per category: its specs, pillars, personas and devices
│   ├── personalisation/  what the home screen remembers, on your device only
│   └── components/       screens, hand-drawn charts, and the ⌘K palette
├── 📂 scripts/ingest/    tools to grow the catalogue from public sources
├── 📂 docs/              the developer guide and research notes
└── 📂 .github/workflows/ the checks that run on every push
```

---

## 👩‍💻 For developers

You need **Node.js 22** (the version CI uses).

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:5173>. To run the same checks as GitHub:

```bash
npm run build
```

**The full developer guide is in [`docs/DEVELOPER-GUIDE.md`](docs/DEVELOPER-GUIDE.md):**

| Topic | Jump to |
|---|---|
| ⚙️ How the numbers are worked out | [How the scoring works](docs/DEVELOPER-GUIDE.md#how-the-scoring-works) |
| ➕ Adding a new kind of device | [Adding a category](docs/DEVELOPER-GUIDE.md#adding-a-category) |
| 🧪 What the tests guard | [Testing](docs/DEVELOPER-GUIDE.md#testing) |
| 🎨 The design rules | [Design](docs/DEVELOPER-GUIDE.md#design) |

---

<div align="center">

**Built by [Aryan Deshmukh](https://github.com/AryanDeshmukh-2711)**

</div>
