# RPI · Phase 2 — Frontend Plan

**Date:** 2026-10-24 · **Status:** 📝 Awaiting approval · **Inputs:** [Product plan](00-PRODUCT-PLAN.md), [Research](01-RESEARCH.md), [Backend plan](02-PLAN-BACKEND.md)

Turns today's template-level marketing site into a product that feels like a 2026 top-tier website (Linear, Stripe, Vercel, Perplexity level) and serves the plan's three audiences: **shoppers, brands and platforms**.

---

## 1. Goals

1. **Score and evidence first.** Every number is clickable down to the reviews, prices or data behind it (product plan design principles).
2. **One search box that ends with 3 good picks**, not 300 results.
3. **A brand dashboard** that shows why products get returned and what to fix first.
4. **Top-tier quality:** fast, accessible, responsive, dark mode, purposeful motion, no layout shift.
5. **Honest copy only.** Remove every claim we can't back (see §7).

---

## 2. Quality bar (definition of done for every page)

| Area | Target |
|---|---|
| Performance | LCP < 2.0 s, INP < 200 ms, CLS < 0.05 on mid-range mobile; Lighthouse ≥ 95 (performance, accessibility, best practices, SEO) |
| Accessibility | WCAG 2.2 AA; full keyboard use; visible focus; colour never the only signal (scores always show number + label); `prefers-reduced-motion` honoured |
| Responsive | 360 px → 1920 px; no horizontal scroll; touch targets ≥ 44 px |
| Theming | Light and dark from the same tokens; follows system setting with a manual toggle |
| States | Every data view has loading (skeleton), empty, error and "not enough evidence" states |
| Rendering | React Server Components for data pages; streaming with Suspense; client components only where interactive |
| SEO / sharing | Metadata per page, dynamic OG images for products, sitemap, robots |
| Testing | Playwright smoke tests for each main flow; visual check of each page in both themes |

---

## 3. Design direction

**"Calm, editorial, data-forward."** A quiet neutral canvas, big confident type, one brand accent and a score colour scale that carries meaning. Think Stripe's clarity, Linear's precision and Apple's product pages, applied to a trust product.

| Element | Decision |
|---|---|
| Canvas | Near-white `#FAFAF9` / near-black `#0B0B0F`; surfaces one step up; hairline borders |
| Accent | Violet (brand), used sparingly: primary actions, focus, links |
| Score scale | 5-step, colour-blind-safe scale (poor → excellent), always paired with the number and a word ("Excellent 86") |
| Type | Inter via `next/font` (variable, self-hosted). Display sizes with tight tracking; fluid sizes using `clamp()` |
| Layout | 12-column grid, max 1200 px content, generous section spacing; bento grids for feature sections |
| Motion | `framer-motion` for meaningful moments: score ring fill, pick cards entering, drawer open. 150–250 ms, ease-out, all disabled under reduced motion |
| Imagery | Real product photos only (dev: neutral generated placeholders); no stock "happy shopper" photos |
| Icons | Lucide, 1.5 px stroke |
| Charts | Hand-built SVG (price history sparkline, pillar bars, scatter) following the dataviz skill; no chart.js |

---

## 4. Design system (F0)

Tailwind v4 tokens in `globals.css` (`@theme`) as the single source: colours, radii, shadows, spacing, type scale and motion durations. The old `legacy.css` and legacy components are deleted.

**Primitives** (shadcn/ui pattern on Radix, which is already installed): Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Badge, Card, Tabs, Accordion, Dialog, Sheet/Drawer, Popover, Tooltip, Toast, Skeleton, Table, Command (⌘K).

**Veritas components**

| Component | What it shows |
|---|---|
| `ScoreRing` | 0–100 with animated fill, label word, confidence underneath |
| `ConfidenceBadge` | High / Medium / Low / New launch, with a tooltip explaining why |
| `PillarBars` | 5 pillars, weight shown, click → factor list |
| `FactorRow` | Factor name, score, evidence count, "not yet included" state, opens the evidence drawer |
| `EvidenceDrawer` | Quotes with source and date, highlighted signal phrase, price/trend findings, "flagged review" marker |
| `MatchMeter` | Personal Match 0–100 with the top 2 reasons |
| `PickCard` | Best overall / Best value / Wildcard: score, match, pillars, size advice, downside, prices from several sellers |
| `PriceHistory` | 90-day sparkline per seller, fake-discount marker, "often cheaper — consider waiting" |
| `TrendTag` | Trending / Classic / Fading |
| `ClarifyChips` | One question with tap-to-answer chips |
| `TraceTimeline` | Agent loop steps (LLM call, tool call, guardrail), tokens, cost, stop reason |

A dev-only `/dev/ui` page shows every component in both themes (a lightweight stand-in for Storybook).

---

## 5. Information architecture and pages

```
Shoppers           Brands               Platforms        Admin (auth, dev first)
/                  /brands              /developers      /admin/runs
/search            /brands/pricing                       /admin/runs/[id]
/p/[slug]          /pilot                                /admin/spend
/profile           /dashboard  (app)                     /admin/evals
/how-it-works      /dashboard/products/[id]              /admin/pilots
                   /dashboard/insights
Legal: /about /privacy-policy /terms-of-service
```

Nav: **Search · How it works · For brands · Developers**, with a ⌘K command palette and a theme toggle. Brand app and admin get a sidebar layout.

### 5.1 Home `/`
- Hero: "Is it worth buying? Ask Veritas." with a **live search box** and example chips ("jeans that don't stretch out", "white tee that won't go see-through").
- Animated sample `PickCard`, using real dev data in replay mode.
- "How the score works": 5 pillars as a bento grid with weights; link to the methodology.
- Trust strip: evidence on every number · no pay-for-score · confidence on every score.
- Two audience blocks: **For brands** (dashboard preview) and **For platforms** (API snippet).

### 5.2 Search `/search`
- Conversational layout: input pinned, answers stream in.
- If needed, **one clarifying question** with chips, while **provisional picks** already show underneath.
- Result: **3 `PickCard`s**, then a "why these" explanation (verified sentences only) and refinement chips.
- Optional "Add your fit profile for better matches" prompt (never required).

### 5.3 Product `/p/[slug]`
- Gallery, name, brand (brand shown last per the plan), price range across sellers.
- `ScoreRing` + `ConfidenceBadge` + "includes 22 of 27 factors" with a list of the missing ones.
- Sustainability toggle (rescales the score live).
- `PillarBars` → `FactorRow`s → `EvidenceDrawer`.
- Size advice, main downside, `PriceHistory`, `TrendTag`, `MatchMeter` (if profile).
- 👍/👎 feedback on the score.

### 5.4 Profile `/profile`
Height, build, usual sizes, climate, budget, style, pillar priorities, brand allow/deny lists. **Delete everything** in one click. Stored server-side for signed-in users, or per browser session otherwise.

### 5.5 Brands
- `/brands`: the pitch ("Sales data shows you what sells. Veritas shows you what's worth buying."), what a brand sees, dashboard screenshots, free pilot scorecard CTA.
- `/brands/pricing`: Starter $299 · Growth $799 · Pro $2,000 · Platform (annual contract), exactly as in the product plan.
- `/pilot`: existing form, restyled.
- `/dashboard` (brand app):
  - Overview: catalog score, label mix, return-driving problems.
  - **Top problems ranked by cost** (e.g. "runs small: 14 products, est. 9% of returns").
  - Catalog table: sortable, filters, peer comparison.
  - Product drill-down: same evidence views as `/p/[slug]` plus **size-chart suggestions**.
  - **Price position** scatter (value vs. price vs. peers).
  - **Launch watch** list with alerts.
  - Trend fit.

### 5.6 Admin (dev first)
- `/admin/runs`: table of agent runs (graph, agent, product, status, iterations, cost, duration).
- `/admin/runs/[id]`: **`TraceTimeline`**, step by step through the loop: prompt summary, tool calls with inputs and outputs, guardrail hits, stop reason. This makes the harness and loop visible and debuggable.
- `/admin/spend`: spend vs. cap by agent and day.
- `/admin/evals`: latest eval report, judge scores, feedback.
- `/admin/pilots`: pilot applications with status and notes.

### 5.7 Developers `/developers`
API overview, auth (API keys), endpoints with copyable examples, response shapes, rate limits, the score methodology link and an MCP note.
- **Demo store `/demo/store` (added 2026-10-25, user request):** a fictional marketplace ("cartwheel.", one of the fictional dev sellers) that shows the Veritas Score next to the store's star rating, the way a platform would through the Score API. Search results can be sorted by stars, Veritas Score or price; each listing shows code-built heads-ups (runs small: n of m owners, fake "was" price, fit/quality return rate vs. the category benchmark). The product page has a store buy box (disabled) plus an embedded Veritas panel: score, verified size advice and summary, pillars and all 27 factors. Banner on every page: "Demo, nothing is sold here". No real store's name, branding or data, and `noindex`.

---

## 6. Data and state

- Server Components fetch directly through `src/lib/veritas/*` server functions for SSR pages. Public JSON goes through `/api/v1/*` for external clients.
- TanStack Query (already installed) only for interactive client views: search session, dashboard filters, admin tables.
- Search streams through a route handler (Server-Sent Events). The UI renders the clarifying question, provisional picks, final picks and verified text as each arrives.
- In dev the UI can run against `LLM_MODE=replay`, so design work costs $0.

---

## 7. Content cleanup (copy that must go)

| Current claim | Action |
|---|---|
| "14-day free trial", "No credit card required", "Cancel anytime" | Replace with "Free pilot scorecard" |
| Testimonial "helped us reduce returns by 23% in just 8 weeks — Leading DTC Fashion Brand" | **Delete** (not real) |
| "99.9% uptime guarantee", "trained on millions of reviews", "<2s API" as fact | Delete until measured |
| "Reduce returns by 25%" headline | Reword as the problem: "Up to 1 in 4 clothing orders gets returned. Most returns are a question answered wrong." |
| Old pricing ($500 / $2,000) anywhere | Use the plan's tiers |

---

## 8. Phases and gates

Frontend phases follow the backend phases that supply their data.

| Phase | Scope | Depends on | Est. | Gate |
|---|---|---|---|---|
| **F0** Design system ✅ 2026-10-24 | Tokens, theming, `next/font`, primitives, Veritas components, `/dev/ui`; delete `legacy.css` + legacy components | B0 | ~10 h | ✅ All components in both themes; axe (WCAG 2.2 AA tags): **0 violations** in light and dark at 1280 px and 390 px; no horizontal scroll at 390 px; `npm run build` passes |
| **F1** Shell + marketing ✅ 2026-10-24 | Nav, ⌘K, footer, Home, How it works, Brands, Pricing, Pilot, Developers, legal; copy cleanup (§7) | F0 | ~10 h | ✅ Lighthouse 13.4.1 (mobile, production build) ≥ 95 in all four categories on all 10 public pages: performance 96–100, accessibility / best practices / SEO 100, CLS 0 · ✅ no unbacked claims · ✅ axe 0 violations on 15 pages (light + dark) · ✅ no horizontal scroll at 360/390 px |
| **F2** Product page — built 2026-10-24 incl. feedback; waits on B3 scores | `/p/[slug]` with evidence drawer, price history, sustainability toggle, feedback | B3–B4 | ~10 h | 5 dev products fully explorable down to quotes |
| **F3** Search — built 2026-10-25; real check waits on published scores | `/search`, streaming, clarify chips, provisional + final picks, profile page | B5 | ~12 h | 20 scripted searches render correctly on mobile and desktop. Verified with temporary scores: question → answer → picks, axe 0, no overflow at 390 px. Re-check on real scores after B3 live |
| **F4** Brand dashboard ✅ 2026-10-25 | Overview, problems by cost, catalog table, drill-down, size-chart tips, price scatter, launch watch | B4, B7 | ~14 h | ✅ All 6 dev brands explorable (admin switcher) · ✅ brand A can't see brand B (browser e2e) · ✅ axe 0 on dashboard and drill-down. Scores, pillars-vs-catalog and the score/price scatter fill in once products are rated |
| **F5** Admin ✅ 2026-10-25 — runs, spend, evals, pilots | Runs + trace timeline, spend, evals, pilots | B2, B6 | ~8 h | Any score on the site traceable to its run in ≤ 2 clicks (product page links to its run once scores exist) |
| **F6** Polish ✅ 2026-10-25 (real-data recheck after B3 live) | Motion pass, OG images, empty/error states, mobile QA, Playwright smoke tests | all | ~8 h | ✅ `npm run test:e2e`: 54/54 (11 pages × light/dark × desktop/phone: 200, heading, axe 0, no horizontal scroll, no page errors; plus search, ⌘K, product evidence + reviews paging, pilot form, profile save/delete, anonymous rejection, brand-only dashboard, admin) · ✅ Lighthouse ≥ 95 (F1) · ✅ OG images, sitemap, robots, manifest |

---

### F0 notes (2026-10-24)

- **Tokens:** `src/app/globals.css` (`@theme inline` over CSS variables; dark via `data-theme`, set before paint in `layout.tsx`). `tailwind.config.ts` and `legacy.css` deleted.
- **Validated data-viz colours** (dataviz skill validator): score bands are an ordinal one-hue blue ramp (passes monotone L, ΔL ≥ 0.06, light-end ≥ 2:1 in both themes); seller series slots 1–4 pass CVD ΔE ≥ 8.4 and normal-vision ΔE ≥ 19.8. Light slots 3–4 are < 3:1 on white, so `PriceHistory` always ships a legend, direct end labels and a table view. All text tokens ≥ 4.5:1.
- **Primitives** (`src/components/ui`): Button, Badge, Card, Input, Textarea, Label, Skeleton, Kbd, Table, Dialog, Sheet, Tooltip, Popover, Tabs, Accordion, Switch, Checkbox, Select, Command (⌘K), Toast; `ThemeToggle`.
- **Veritas components** (`src/components/veritas`): ScoreRing, ConfidenceBadge, TrendTag, PillarBars, FactorRow, MatchMeter, StatTile, EvidenceDrawer, PriceHistory (crosshair + keyboard), PickCard, ClarifyChips, TraceTimeline.
- **Default theme is light** until F1 rebuilds the legacy pages for dark mode (they hardcode white sections). F1 switches the default to the system setting.
- Interim honesty fix: the legacy dashboard now shows "Not rated yet" / "—" instead of a red 0, and the made-up "+5 from last month" deltas are gone. The legacy product page still shows 0 for unrated products until F2.

### F1 / F2 / F5 notes (2026-10-24)

**Built, all reading the dev DB through `src/lib/veritas/read/` (server-only):**
- **Shell:** `src/components/site/` (sticky header with active states, ⌘K palette with pages, admin links in dev, theme and every product; mobile sheet menu; footer). `AppLayout` now re-exports `SiteShell`. Theme follows the system setting by default. The cookie banner was removed: the site sets no analytics or tracking cookies.
- **Pages:** `/` (live "evidence preview" and return-reason counts from the test catalog, no invented numbers), `/how-it-works` (factor tables read from `FACTOR_TAXONOMY`, scoring rules from backend plan §6), `/brands` (preventable-return example from real counts), `/brands/pricing` (plan tiers verbatim), `/pilot` (same API; "$10,000+ value" claim removed), `/developers` (endpoints match the routes), `/about` (rewritten; the old page described the thrift product), legal pages and the legacy `/dashboard` moved to tokens (F4 still rebuilds the dashboard), branded 404.
- **`/search` (interim, until B5):** keyword search that reads "tee/jeans" and "under $N", drops filler words, matches product fields (×3) and review text (×1), and shows the user how the query was read. Clearly labelled as the stand-in for conversational search.
- **`/p/[slug]`:** score panel (unrated → honest "Not rated yet" with the input counts; rated → ring, confidence, sustainability toggle, pillar → factor → evidence drawer, link to the agent trace), reviewers' fit answers (diverging bar + legend), price history with code-computed facts (90-day low, inflated "was" price, often cheaper), return reasons, reviews with the prompt-injection flag, spec, data source. On phones the score comes before the image. Accepts an id or a slug; `/products/:id` and `/api-docs` are real 308s in `next.config.ts`.
- **Admin (dev only, 404 in production):** `/admin/runs`, `/admin/runs/[id]` (TraceTimeline, cache share, cost, finish payload, outputs), `/admin/spend` (cap meter, by agent, by day, by status).
- **API honesty fixes:** `/api/v1/products` and `/api/v1/products/:id` return `null` scores (not 0) for unrated products, and the bogus "returnRate" (returns ÷ reviews) is gone.
- Product images are neutral generated silhouettes marked "Test item"; the fixture's random picsum photos aren't shown.

**Found while building:** the fixture never fills `pillingObserved` / `colorFading` / `shrinkage` (0 of 620 reviews), so the "wear and wash" block hides itself until structured answers exist; the evidence agent (B3) extracts these from review text. `trendTag` is null for every product until B4.

**Added later the same day:**
- **Feedback:** `FeedbackButtons` (👍/👎, with optional reason chips on 👎) on the rated score panel → `POST /api/v1/feedback`. Tested end-to-end against a temporary score row, which was then deleted.
- **`/admin/pilots`:** filter by status, change status inline, notes. Backed by `PATCH /api/v1/admin/pilot-applications/:id`.
- **Reviews paging:** the product page renders the 5 most helpful reviews; "Show more" loads 20 at a time from `GET /api/v1/products/:id/reviews`.
- **Performance pass (F1 gate):**
  - Removed the unused NextAuth `SessionProvider`, which fetched `/api/auth/session` on every page.
  - Split `ui/controls.tsx` into one file per control; tooltips carry their own provider.
  - The ⌘K palette, mobile menu and evidence drawer load on first use.
  - Replaced framer-motion with CSS keyframes (`animate-ring-fill`, `animate-bar-grow`, `animate-rise-in`) and uninstalled it.
  - Review stars are text, not SVG.
  - Result: shared JS 229 → 160 kB; product page HTML 294 → ~120 kB (27 kB gzipped).
- **SEO:** `htmlLimitedBots: /.*/` in `next.config.ts`, so metadata is in the initial `<head>` on dynamic pages (meta-description audit 0 → 100).
- **Fixes:**
  - `FactorRow` grid placement put the bar before the name; now stacked.
  - `/dashboard` still averaged the removed `returnRate`; it now shows the returns count.

**Quality-bar gap:** §2 asks for LCP < 2.0 s on mid-range mobile. Lighthouse's simulated slow-4G LCP is 1.8–2.8 s. Re-measure on real devices after deploy (F6).

**F3 (2026-10-25):** `/search` runs conversational search above the keyword grid ("All matching products"). It shows how the query was read, one clarifying question as chips (provisional picks underneath), then up to 3 `PickCard`s with fact-based match reasons, verified summary, size advice, downside, an "Over budget" label when stretched, and an honest empty state when nothing matching is rated. `/profile` is an optional fit profile (height, sizes, build, fit, climate, budget, priorities, brands to leave out, sustainability) with one-click delete. `PickCard` now uses the placeholder silhouette instead of a photo. No streaming: search is code-only and returns in one response.

**F4 (2026-10-25):** `/dashboard` (brand users: their brand; admins: brand switcher) shows overview tiles, top problems by estimated return cost (bars + affected products), size-chart fixes, launch watch, price position, pillars vs. catalog, the catalog table and Score API keys. Price position is a dot plot of price vs. peer median, which works before rating; once ≥ 3 of the brand's products are rated it becomes a score-vs-price scatter against other brands, with legend and tooltips (dataviz rules: ≥ 8 px dots, 2 px surface ring, one hue per series). `/dashboard/products/[slug]` shows fit answers and returns by size, plus return reasons. `/sign-in` serves brand teams and admins; admin pages now need an admin sign-in in every environment.

**F5 evals (2026-10-25):** `/admin/evals` shows the latest eval run: check agreement and coverage, judge agreement and rubric (once run), quote acceptance, checks by label, agent health (finish rate, how runs ended, cost, median time, cache share), shopper feedback, every golden product's checks (expandable), and earlier runs. Admin pages and APIs need an admin sign-in.

**F6 (2026-10-25):**
- **Error and loading states:** token-styled `error.tsx` (keeps the site chrome, retry, reference id, no internals), `global-error.tsx` (self-contained inline styles, light + dark), page-shaped `loading.tsx` skeleton. Legacy white versions removed.
- **SEO and sharing:** `sitemap.ts` (public pages + every product), `robots.ts` (index nothing outside production; in production, block admin, dashboard, API, sign-in, profile and dev), `manifest.ts`. Dynamic Open Graph images for the site and each product: score ring, or "Not rated yet" plus the clearest fit fact. Never a made-up number. The stale `public/robots.txt` (allowed everything) and `public/manifest.json` (old app's routes and missing icons) were deleted.
- **Smoke tests:** `@playwright/test` 1.56.0 on system Chrome (`playwright.config.ts`, `tests/e2e/`). Desktop runs everything; phone (Pixel 7) runs the page sweep. The pilot form is tested with the API mocked; the profile test deletes what it creates; a global teardown removes the run's anonymous search sessions (local DB only).
- **Motion:** all entrance motion is CSS keyframes (`animate-ring-fill`, `animate-bar-grow`, `animate-rise-in`) under the global `prefers-reduced-motion` rule; no JS animation library remains.

**Shopkeeper chat (2026-10-25):** `/search` is now a conversation: message bubbles, the current question with chips from stock, a free-text box that's always available ("cheaper", "not black"), "Just show me", a "Question n of 4" counter, a "Looking for" summary, and picks below that update after every message ("Best so far" while questions are open). e2e covers question → chip → free-text refinement → final picks and "Just show me" with canned turns.

**Question card (2026-10-25, user feedback: "make it like a flash card"):** each shopkeeper question pops up as a card (`search/question-card.tsx`): a progress bar ("Question 2 of 4"), a large question, and big option tiles showing how many products each choice leaves ("Men · 12 products"), colour swatches for colours, dashed tiles for "No preference" / "No limit", options with 0 matches disabled, number keys 1–9, "Just show me", and the free-text box right below. The API returns `question.options` with counts computed by applying each choice to the current filters.

**Product illustrations (2026-10-25, user request "add some images"):** `ProductThumb` draws each product from its own data: the cut (crew, v-neck, boxy, longline tee; straight, wide-leg, skinny, slim-taper, bootcut jean) in its catalog colour, labelled "Illustration" so it's never mistaken for a photo. The product page gets colour swatches that switch the illustration (`product-gallery.tsx`).

**All frontend phases are built.** Pages that depend on scores (search picks, score panels, dashboard scores and the scatter) are verified with temporary data and fill in when products are rated live (B3).

### F7 · Discovery and insights (with B9, 2026-10-25)
- [x] Autosuggest dropdown on the search boxes (combobox pattern: arrow keys, Enter, Escape; groups: searches, products with score, collections)
- [x] Filter bar on the catalog (gender, colour swatches, fit, "score 70+", price), URL-driven so results stay shareable and server-rendered
- [x] Tags on product cards and the product page, each with a tooltip giving the numbers
- [x] "Better-scoring alternatives" on the product page
- [x] `/collections` index and `/collections/[slug]` pages
- [x] "Ask about this product" on the product page: instant-answer chips + a question box; answers cite their evidence
- [x] Brand dashboard product page: "Why this score" with points lost per factor and top fixes
- **Gate:** see B9.

### F8 · Platform UI (with B10/B11, 2026-10-25) — ✅ done
- [x] `/dashboard/ads` "Data and ads": feed upload with dry run and inline validation report, recent uploads, ad previews with verified evidence, "not advertised and why", eligible/full ad-feed CSV downloads, social posts with copy buttons
- [x] Three drivers (`DriverTiles`) on product pages and the demo store panel; `drivers` in the Score API
- [x] Demo store: rule-based "Sponsored" slot (labelled, never top 3, explains why it's shown)
- [x] Developers page: ingest and feeds sections
- **Gate:** ✅ `tests/e2e/b2b.spec.ts` 2/2 (dry-run upload report incl. rejected row reason; sponsored slot never in the top 3); full e2e 78/78; build passes.

### Brand scorecard (product plan pilot offer, 2026-10-25) — ✅ done
- [x] `/dashboard/scorecard` (brand or admin): one printable page per brand: average score and three drivers, preventable returns and their estimated cost, ad readiness, price warnings, top 3 fixes (points lost vs. the category median, summed across products, with the fix), costliest return reasons, size-chart fixes, strongest and weakest products, price-vs-quality position. "Print or save as PDF"; a fictional-data banner on test data; pricing in the footer matches the product plan.
- **Gate:** ✅ e2e (scorecard renders with all sections and plan pricing); sample PDF rendered for Hollow Pine Supply (fictional).

## Known issues (saved for later)

| Date | Issue | Likely cause | Planned fix |
|---|---|---|---|
| 2026-10-24 | Dev overlay: `Console TypeError: Failed to fetch` in `fetchServerResponse` / `navigateReducer` (Next 15.5.4, Turbopack) on client navigation | The client router can't reach the dev server. The user's `npm run dev` (port 3000) shares `.next/` with the `npm run build` checks run during B0–B2, and each build overwrote the running server's output. A server restart after `npm install` has the same effect. | Restart `npm run dev`. Build checks now use `NEXT_DIST_DIR=.next-check` (see `next.config.ts`), so they no longer touch `.next/`. If it still happens after a clean restart, look at the request in the Network tab (failing route + status) and check for a server error in the terminal. Next 15.5.4 is flagged "outdated"; upgrading Next is a separate, deliberate change. |

| 2026-10-25 | Next 16 dev server once kept serving an old version of a shared component (`product-thumb.tsx`) after an edit; the dev image renderer then drew t-shirts for shirts. | Turbopack dev cache missed the change. | Restart `npm run dev`; `npm run dev:images` should run on a freshly started server. Watch if it recurs. |
| 2026-10-24 (✅ fixed 2026-10-25) | `notFound()` on dynamic routes (`/p/[slug]`, `/admin/runs/[id]`) returns HTTP 200 with the not-found page and `noindex`, instead of 404. Unknown URLs correctly return 404. Cause found: the root `loading.tsx` Suspense boundary; it now lives only under `/search`. | Next 15.5 starts streaming the response before the page throws, even with `htmlLimitedBots` and `notFound()` in `generateMetadata`. | Look at again when upgrading Next. Crawlers already see `noindex`. Fallback: check the slug in middleware against a cached slug list. |

## 9. Decisions to confirm

| # | Decision | Default |
|---|---|---|
| 1 | Component approach | shadcn/ui pattern (copied into `src/components/ui`), Radix underneath |
| 2 | Dark mode | Yes, from day one |
| 3 | Product URLs | `/p/[slug]` (old `/products/[id]` redirects) |
| 4 | Brand app access | Behind NextAuth sign-in (built in B7); the demo brand is viewable without login in dev |
