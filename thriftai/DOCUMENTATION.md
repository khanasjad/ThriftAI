# Veritas AI — Project Documentation

> **Heads-up (2026-10-24):** this file describes the system **before** the RPI refactor. For what we're building and in which order, see [docs/rpi/](docs/rpi/): the product plan, research, backend plan and frontend plan. Where they disagree with this file, they win.

> **Single source of truth for this project.** It replaces ~190 separate session reports, plans and summaries that were merged and removed on 2026-10-24.
> Folder-specific READMEs remain next to their code (see [Other docs](#20-other-docs-kept)).

**Last updated:** 2026-10-24

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Current status at a glance](#2-current-status-at-a-glance)
3. [Quick start](#3-quick-start)
4. [Environment variables](#4-environment-variables)
5. [Tech stack](#5-tech-stack)
6. [Project structure](#6-project-structure)
7. [Pages](#7-pages)
8. [API reference](#8-api-reference)
9. [The 27-factor quality score](#9-the-27-factor-quality-score)
10. [AI agents](#10-ai-agents)
11. [Data model](#11-data-model)
12. [Demo data](#12-demo-data)
13. [Pilot program](#13-pilot-program)
14. [Authentication](#14-authentication)
15. [UI and design system](#15-ui-and-design-system)
16. [Deployment](#16-deployment)
17. [Costs](#17-costs)
18. [Known issues and pending work](#18-known-issues-and-pending-work)
19. [Project history](#19-project-history)
20. [Other docs kept](#20-other-docs-kept)

---

## 1. What this project is

**Veritas AI** is a B2B quality-scoring platform for direct-to-consumer (DTC) clothing brands.

It reads customer reviews, return data, prices and brand/trend signals. It then scores each product from **0–100** across **27 quality factors** grouped into **5 pillars** (Fit, Quality, Style & Value, Comfort, Sustainability). Brands use the scores to find quality problems and reduce returns.

- **Pitch:** "Constructor shows you what sells. Veritas shows you what keeps."
- **Target customer:** online-first clothing brands with 50–500 SKUs and 500+ reviews.
- **Headline promise:** 15–25% return reduction.

> The repo, folder and database are still called **ThriftAI** (`thriftai`, `thriftai_nextjs_dev`). That was the original consumer thrift-shopping app. The product was refocused into Veritas AI in October 2026. See [Project history](#19-project-history).

---

## 2. Current status at a glance

| Area | Status |
|---|---|
| Marketing site (home, about, pilot, API docs, privacy, terms) | ✅ Working |
| Quality dashboard (`/dashboard`) and product detail pages | ✅ Working, reads real DB data (demo seed) |
| Pilot application form → database → email | ✅ Working (emails need `RESEND_API_KEY`) |
| v1 REST API: products, product detail, compare, explain, conversation | ✅ Working |
| Natural-language search (`/api/v1/search/natural`) | ⚠️ Returns 500 until `OPENAI_API_KEY` is set and Qdrant is running |
| 27-factor scoring engine + agents (evidence, pricing, trends, query, explanation, conversation) | ✅ Built; pricing/trend agents use mock data |
| Authentication | ⚠️ NextAuth configured, no sign-in UI or protected routes |
| Admin UI for pilot applications | ❌ Not built (use the API or the database) |
| Brand catalog upload (`/api/v1/products/ingest`) | ⚠️ Exists, untested and undocumented |
| Automated tests | ⚠️ 9 Jest test files exist (unit / integration / e2e), all for the legacy app. Nothing tests the new scoring agents or the v1 API |
| Production deployment | ❌ Not deployed yet (guide below) |

**Demo database:** 5 brands, 103 products, 18,300 reviews, 103 product scores, ~2,000 return events.

---

## 3. Quick start

```bash
cd thriftai
npm install

# 1. Configure environment (see section 4)
cp .env.local.example .env.local      # then fill in values

# 2. Create tables and load demo data
npx prisma db push
npx tsx src/scripts/seed-demo-data.ts

# 3. Run
npm run dev                            # http://localhost:3000
```

Optional, for vector search:

```bash
docker run -p 6333:6333 qdrant/qdrant  # or: npm run docker:up
npm run qdrant:init
```

### Useful npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Jest (`test:unit`, `test:integration`, `test:coverage`, `test:ci` also exist) |
| `npm run db:reset` | `prisma db push` + `prisma/seed.ts` (legacy seed; prefer `src/scripts/seed-demo-data.ts`) |
| `npm run qdrant:init` / `qdrant:health` / `qdrant:dashboard` | Qdrant helpers |
| `npm run docker:up` / `docker:down` | docker-compose (Qdrant) |

### Database quick checks

```bash
psql $DATABASE_URL -c 'SELECT COUNT(*) FROM clothing_products;'
psql $DATABASE_URL -c 'SELECT * FROM pilot_applications;'
npx prisma studio
```

---

## 4. Environment variables

Templates: `.env.local.example` (local) and `.env.production.example` (production). The real `.env*` files are not committed.

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (local: `postgresql://<user>@localhost:5432/thriftai_nextjs_dev?schema=public`) |
| `ANTHROPIC_API_KEY` | Claude: evidence extraction, query understanding, explanations, conversation |
| `NEXTAUTH_SECRET` | NextAuth signing key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | e.g. `http://localhost:3000` |

### Feature-specific (optional)

| Variable | Needed for |
|---|---|
| `OPENAI_API_KEY` | Embeddings → natural-language / vector search |
| `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION_NAME` | Vector database (API key not needed locally) |
| `RESEND_API_KEY` | Pilot confirmation + admin notification emails |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in (only enabled when both are set) |
| `DIRECT_URL` | Non-pooled DB URL for Prisma migrations on Supabase |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `SENTRY_DSN` | Error tracking |

The code also reads many legacy variables (Amazon/eBay/Walmart affiliate keys, Stripe, ElevenLabs/Google TTS, shipping carriers, and so on). They belong to the old consumer app and aren't needed for Veritas.

---

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5 (App Router, Turbopack), React, TypeScript |
| Styling | Tailwind CSS v4, Lucide icons, Inter font |
| Database | PostgreSQL + Prisma ORM |
| Vector search | Qdrant (OpenAI embeddings, 1536-dim, cosine) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`, `ai` SDK); OpenAI for embeddings |
| Auth | NextAuth v4 (JWT sessions, credentials + optional Google), bcryptjs |
| Email | Resend |
| Validation | Zod |
| Logging | winston (+ daily rotate) |
| Hosting (planned) | Vercel + Supabase Postgres + Qdrant Cloud |

---

## 6. Project structure

```
thriftai/
├── DOCUMENTATION.md          ← this file
├── prisma/schema.prisma      ← all DB models (legacy + Veritas clothing models)
├── src/
│   ├── app/
│   │   ├── page.tsx          ← homepage
│   │   ├── layout.tsx        ← root layout (fonts, providers, cookie banner)
│   │   ├── globals.css       ← Tailwind entry + layer order + light theme vars
│   │   ├── legacy.css        ← old ThriftAI CSS, low-priority layer (see §15)
│   │   ├── dashboard/  pilot/  products/[id]/  about/  api-docs/ ...
│   │   └── api/
│   │       ├── v1/           ← Veritas production API (see §8)
│   │       └── ...           ← legacy consumer routes
│   ├── components/
│   │   ├── AppLayout.tsx     ← NavBar + page + AppFooter (use on every page)
│   │   ├── NavBar.tsx  AppFooter.tsx  CookieConsent.tsx
│   │   └── ui/               ← small shadcn-style primitives
│   ├── lib/
│   │   ├── agents/           ← evidence, scoring, pricing, trends, query, explanation, conversation
│   │   ├── email/resend.ts   ← email service + templates
│   │   ├── auth.ts           ← NextAuth config
│   │   └── services/         ← many services, mostly from the legacy app
│   └── scripts/seed-demo-data.ts
├── scripts/                  ← scrapers, Qdrant + B2B tenant scripts (see scripts/README.md)
├── ml/                       ← Python ML experiments (see ml/README.md)
└── tests/                    ← Jest tests
```

---

## 7. Pages

**Core Veritas pages** (all wrapped in `AppLayout`):

| Route | Purpose |
|---|---|
| `/` | Marketing homepage (hero, stats, features, "how it works", CTA) |
| `/dashboard` | Quality dashboard: portfolio score, return rate, category filters, product list |
| `/products/[id]` | Product detail: pillar scores, 27-factor breakdown, reviews, return analysis |
| `/pilot` | Pilot program application form → `POST /api/v1/pilot-applications` |
| `/about`, `/api-docs` | Company info and developer docs |
| `/privacy-policy`, `/terms-of-service` | Legal pages |

Next.js `error.tsx`, `global-error.tsx` and `loading.tsx` files exist for the root, dashboard and product pages.

**Leftover pages** (still build, not linked from the nav; candidates for deletion): `/compare`, `/sustainability`, `/calculator`, `/calculator/detailed`, `/data-sources`, `/ai-search-demo`, `/admin/products`, `/prod/veritas`, `/test/veritas`.

---

## 8. API reference

Base URL: `http://localhost:3000/api/v1` (planned production: `https://<domain>/api/v1`).
All endpoints accept and return JSON, validate input with Zod, and send CORS headers.
**No authentication during the pilot.** Planned: `Authorization: Bearer <API_KEY>` with 100 req/min per IP and 1,000 req/hour per key.

### Error format

```json
{ "success": false, "error": "Short message", "details": { } }
```

Status codes: `400` validation, `404` not found or expired, `409` duplicate, `500` server error.

### `GET /products`: list products

Query: `category` (TOPS, BOTTOMS, DRESSES, OUTERWEAR, ACTIVEWEAR, …), `gender`, `minScore`, `maxScore`, `brandId`, `limit` (default 50), `offset`, `sortBy` (`score` | `name` | `price` | `newest`).

```json
{ "success": true, "data": [ ... ], "pagination": { ... }, "filters": { ... } }
```

### `GET /products/:id`: product detail

Returns product info, overall + pillar scores, 27 factor scores, reviews and return analysis. ~150 ms.

### `GET /products/:id/explain`: plain-English score explanation

Query: `detailLevel` = `summary` | `detailed` (default) | `full`; `focusAreas` = comma-separated pillars, e.g. `FIT,QUALITY`.

```json
{
  "success": true,
  "productId": "...",
  "explanation": {
    "productName": "...", "overallScore": 85.4, "grade": "B",
    "summary": "...",
    "pillars": [{ "pillar": "FIT", "percentage": 82.9, "grade": "B", "explanation": "...",
                  "topFactors": [{ "factor": "fit.true_to_size", "score": 95.2, "impact": "positive" }] }],
    "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."],
    "evidenceHighlights": [{ "factor": "Fabric Quality", "signal": "soft_fabric", "quote": "...", "sentiment": 0.85 }]
  }
}
```

### `POST /products/compare`: compare 2–5 products

```json
{ "productIds": ["id1", "id2"], "focusAreas": ["FIT", "QUALITY"] }
```

Returns per-product summaries, strengths/weaknesses, a `comparisonText` and a `winner` id. ~3–5 s (uses Claude).

### `POST /conversation`: multi-turn chat

Start a conversation (optionally with `userId` and `userPreferences`) → `201` with `conversationId` and suggestions.
Send `{ "conversationId": "...", "message": "Show me sustainable jeans" }` → AI reply with `intent`, `data.products` and suggestions. Conversations are kept in memory (last 20 messages, cleaned after 24 h). Expired ID → `404`.

### `POST /search/natural`: natural-language search

```json
{ "query": "sustainable jeans under $100",
  "options": { "includeExplanation": true, "suggestRefinements": true, "limit": 20 } }
```

Returns the understood query + intent, generated filters (e.g. `priceMax: 100`, `sustainabilityRequired: true`), results with `aiScore` and `similarity`, suggestions and clarifications. **Needs `OPENAI_API_KEY` and Qdrant.**

### `POST /pilot-applications`: submit pilot application

```json
{ "companyName": "Example Brand", "firstName": "Jane", "lastName": "Doe",
  "email": "jane@example.com", "website": "...", "phone": "...",
  "productCount": "51-200", "reviewCount": "500-2000" }
```

`201` on success; `409` if the email already applied; `400` on validation errors. Sends emails when Resend is configured; otherwise logs a warning and still saves.

### `GET /pilot-applications` (admin) and `PATCH /pilot-applications` (admin)

List with `status` (`pending` | `approved` | `rejected` | `contacted` | `converted`), `limit`, `offset` → data + `{ total, limit, offset, hasMore }`.
`PATCH` updates `status` and `notes`. **Unprotected right now. Add auth before going public.**

### Other v1 routes

- `GET /search`: original B2B search endpoint.
- `POST /products/ingest`: bulk catalog upload (untested; see §18).

### Legacy routes (old consumer app, not used by Veritas)

`/api/cart`, `/api/checkout`, `/api/orders`, `/api/stripe`, `/api/webhooks/stripe`, `/api/affiliate/*`, `/api/tts`, `/api/stt`, `/api/chat`, `/api/v2/chat`, `/api/integrations/*`, `/api/price-intelligence/*`, `/api/veritas/*` (old 96-parameter scoring), `/api/products/*`, `/api/admin/*`, `/api/test/*` and others. These are candidates for removal.

---

## 9. The 27-factor quality score

### Pillars and factors (105 points = 100 base + 5 sustainability bonus)

Defined in `src/lib/agents/evidence/factor-taxonomy.ts`.

| Pillar | # | Factor key | Points |
|---|---|---|---|
| **Fit & Sizing (35)** | 1 | `fit.true_to_size` | 8 |
| | 2 | `fit.size_consistency` | 8 |
| | 3 | `fit.body_shape_match` | 6 |
| | 4 | `fit.return_rate_fit` | 6 |
| | 5 | `fit.length_proportions` | 4 |
| | 6 | `fit.size_range` | 3 |
| **Quality & Durability (30)** | 7 | `quality.fabric` | 6 |
| | 8 | `quality.construction` | 6 |
| | 9 | `quality.wash_durability` | 6 |
| | 10 | `quality.wear_resistance` (pilling, etc.) | 4 |
| | 11 | `quality.longevity` | 5 |
| | 12 | `quality.return_rate_quality` | 3 |
| **Style & Value (20)** | 13 | `style_value.value_for_money` | 5 |
| | 14 | `style_value.price_fairness` | 3 |
| | 15 | `style_value.brand_reputation` | 3 |
| | 16 | `style_value.looks_as_pictured` | 3 |
| | 17 | `style_value.trend_relevance` | 3 |
| | 18 | `style_value.versatility` | 2 |
| | 19 | `style_value.resale_value` | 1 |
| **Comfort (15)** | 20 | `comfort.softness` | 4 |
| | 21 | `comfort.breathability` | 4 |
| | 22 | `comfort.stretch_mobility` | 3 |
| | 23 | `comfort.skin_friendly` | 2 |
| | 24 | `comfort.easy_care` | 2 |
| **Sustainability (+5 bonus)** | 25 | `sustainability.material_certs` | 2 |
| | 26 | `sustainability.ethical_production` | 2 |
| | 27 | `sustainability.repair_takeback` | 1 |

Each factor has named **signals** with a sentiment from −1.0 to +1.0. Example for `fit.true_to_size`: `true_to_size` (+1.0), `runs_small` / `runs_large` (−0.7), `runs_very_small` / `runs_very_large` (−1.0).

### How a score is calculated

1. **Evidence:** each review is turned into evidence tags (factor, signal, sentiment, confidence 0–1, quote).
2. **Factor score:** confidence-weighted average sentiment → mapped from −1…+1 to 0–100% → × factor points.
3. **Pillar score:** sum of factor points. Factors with no evidence count at **50%** of their maximum (`decayFactor: 0.5`).
4. **Overall score:** sum of pillar points → 0–100, then a letter grade.

### Grade scale

| Grade | Score | Grade | Score | Grade | Score |
|---|---|---|---|---|---|
| A+ | 97–100 | B+ | 87–89 | C+ | 77–79 |
| A | 93–96 | B | 83–86 | C | 73–76 |
| A- | 90–92 | B- | 80–82 | C- | 70–72 |
| D | 60–69 | F | < 60 | | |

### Confidence

- **Levels:** HIGH ≥ 85%, MEDIUM 65–84%, LOW < 65%, NONE.
- **Pillar:** `coverage × 0.5 + avgFactorConfidence × 0.5`.
- **Product:** `factorCoverage × 0.4 + evidenceSufficiency × 0.4 + reviewSufficiency × 0.2`.
- **New launch:** a product with fewer than 10 reviews is flagged "new launch". Fewer than 10 evidence items can't be HIGH confidence.

### Coverage

19 of 27 factors are fully automated from reviews and returns. The other 8 (for example resale value and repair/take-back) rely on brand data or future integrations.

> **Note:** the demo seed computes simplified pillar scores directly. It does not run the full evidence → scoring pipeline.

---

## 10. AI agents

All agents live in `src/lib/agents/`. Each has an `index.ts` and most have a `demo-*.ts` you can run with `npx tsx`.

| Agent | Folder | What it does | Writes to |
|---|---|---|---|
| **Evidence** | `evidence/` | Claude reads reviews and extracts factor evidence (temperature 0, JSON output, validated against the taxonomy) | `EvidenceTag` |
| **Scoring** | `scoring/` | Evidence → factor → pillar → overall score + grade + confidence | `FactorScore`, `ProductScore` |
| **Pricing** | `pricing/` | Compares brand price with competitors → price-fairness evidence (factor 14) | `PriceSnapshot`, `EvidenceTag` |
| **Trends & Brand** | `trends/` | Brand reputation (factor 15) and trend relevance (factor 17) | `EvidenceTag` |
| **Query** | `query/` | Natural language → intent (search, compare, explain, recommend, filter, ask_question) + 10 entity types + filters | — |
| **Explanation** | `explanation/` | Plain-English score explanations (summary / detailed / full) and comparisons | — |
| **Conversation** | `conversation/` | Multi-turn chat; routes each message to the right agent | in-memory |

`specialized/`, `AgentOrchestrator.ts` and `VeritasOrchestrator.ts` come from the older 96-parameter system.

### CLI commands

```bash
# Evidence extraction
npx tsx src/lib/agents/evidence/run-batch-processor.ts                       # all unprocessed reviews
npx tsx src/lib/agents/evidence/run-batch-processor.ts --product <id>
npx tsx src/lib/agents/evidence/run-batch-processor.ts --limit 10 --no-save  # dry run
#   options: --concurrency <n> (default 5), --reprocess

# Scoring
npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product <id>
npx tsx src/lib/agents/scoring/run-scoring-engine.ts --all
npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product <id> --no-save

# Demos
npx tsx src/lib/agents/evidence/demo-evidence-agent.ts
npx tsx src/lib/agents/scoring/demo-scoring-engine.ts
npx tsx src/lib/agents/pricing/demo-pricing-agent.ts
npx tsx src/lib/agents/trends/demo-trend-agent.ts
npx tsx src/lib/agents/demo-week7.ts
```

### Pricing and trend rules

- **Price fairness signals:** `best_price` (+1.0), `fair_price` (+0.4…+0.8), `better_price_elsewhere` (−0.3…−0.7), `overpriced` (−1.0).
- **Brand reputation:** weighted from customer satisfaction (30%), sustainability (20%), ethics (20%), transparency and quality. Ratings: Excellent 85+, Good 70–84, Average 55–69, Poor 40–54.
- **Trend relevance:** 15 tracked trends in 4 phases (EMERGING, PEAK, DECLINING, CLASSIC). Signals: `timeless` (+1.0), `on_trend` (+0.7), `fast_fashion` (−0.5), `dated` (−0.8).
- Pricing and trend agents currently use **built-in mock data**. Real sources (Google Shopping, Google Trends, Trustpilot) are not connected.

---

## 11. Data model

`prisma/schema.prisma` holds ~70 models. The **Veritas clothing models** (bottom of the file) are the ones that matter:

| Model (table) | Purpose |
|---|---|
| `Brand` (`brands`) | Brand profile, reputation, sustainability/ethics ratings, certifications |
| `ClothingProduct` (`clothing_products`) | Product + fit/quality/style/comfort/sustainability attributes; links to `Tenant` for multi-tenancy |
| `ClothingReview` (`clothing_reviews`) | Review text + fit/quality/comfort/style/value ratings, size purchased, height/weight/body type, wear duration, pilling/fading/shrinkage |
| `ReturnEvent` (`return_events`) | Returns with `ReturnReason` and `ReturnCategory` (FIT, QUALITY, STYLE, OTHER) |
| `EvidenceTag` (`evidence_tags`) | Factor → pillar → signal → sentiment → confidence, with source quote |
| `PriceSnapshot` (`price_snapshots`) | Price history per retailer |
| `TrendSignal` (`trend_signals`) | Trend score and phase |
| `FactorScore` (`factor_scores`) | Per-product, per-factor score (versioned) |
| `ProductScore` (`product_scores`) | Overall score, grade, confidence, 5 pillar scores |
| `ShopperProfile` (`shopper_profiles`) | Shopper measurements for personal fit matching |
| `PilotApplication` (`pilot_applications`) | Pilot form submissions (unique email, status, notes) |

**Enums:** `ClothingCategory`, `ClothingGender`, `ReturnReason`, `ReturnCategory`, `EvidenceSource`, `FactorPillar` (FIT, QUALITY, STYLE_VALUE, COMFORT, SUSTAINABILITY), `TrendPhase`, `Confidence`.

Also used: `User`, `Account`, `Session`, `VerificationToken` (NextAuth) and `Tenant` (B2B multi-tenancy).
Everything else (`Product`, `Buyer`, `Seller`, `Order`, `CartItem`, `Affiliate*`, `Swipe*`, `Veritas*` 96-parameter tables, `ab_*`) belongs to the legacy app.

---

## 12. Demo data

`npx tsx src/scripts/seed-demo-data.ts` **clears** the clothing tables and generates:

- **5 brands:** Eco Denim Co (91, A+), Sustainable Basics (88, A), Urban Minimalist (85, B), Premium Streetwear (82, B), Comfort Essentials (76, C+).
- **103 products** across Tops, Bottoms, Dresses, Outerwear and Activewear (women's, men's, unisex), priced $25–$350, sizes XS–3XL.
- **18,300 reviews** (~178 per product). Ratings follow each product's quality tier and include body measurements and quality issues.
- **103 product scores** (overall 40–91, average ~73). Confidence: HIGH 150+ reviews, MEDIUM 75–150, LOW < 75.
- **~2,000 return events** (8–30% return rate depending on score).
- Images are placeholder Unsplash URLs. There are no size/colour variants.

`scripts/b2b/` has tenant tools (`create-tenant.ts`, `list-tenants.ts`, `seed-products.ts`, `index-tenant-products.ts`, `init-qdrant.ts`, `check-qdrant-status.ts`). See `scripts/b2b/README.md`.

---

## 13. Pilot program

### Application flow

1. A brand fills in `/pilot`.
2. `POST /api/v1/pilot-applications` validates the input, rejects duplicate emails and saves to `pilot_applications`.
3. `src/lib/email/resend.ts` sends two emails:
   - **Applicant:** "Your Veritas AI Pilot Application – Next Steps", with a 3-step timeline: review (1–2 business days) → discovery call → pilot launch.
   - **Admin:** "🎯 New Pilot Application: {Company}", with contact details and catalog size.
4. If `RESEND_API_KEY` is missing or sending fails, the application is **still saved** and a warning is logged.

**Email setup:** create a key at resend.com (free tier: 100/day, 3,000/month), set `RESEND_API_KEY`, and restart. For production, verify your domain and update the `from` address in `resend.ts`.

### Pilot offer (business)

- **Duration:** 8 weeks, free.
  - Weeks 1–2: data onboarding.
  - Weeks 3–4: scoring and analysis (initial scorecard at week 4).
  - Weeks 5–6: refinement (prioritized action items at week 6).
  - Weeks 7–8: final report and decision.
- **Ideal partner:** DTC clothing brand, 50–500 SKUs, 500+ reviews, quality-focused, willing to share reviews, returns and pricing.
- **Data needed:**
  - Catalog (CSV/JSON): `product_id`, `name`, `category`, `brand`, `price`, `sku`, plus optional `description` and `images`.
  - Reviews: `review_id`, `product_id`, `rating`, `review_text` (min 10 words), `created_at`, plus optional size, height, weight and body type. Minimum 500; 1,000+ recommended.
  - Optional: return data and competitor prices.
- **Success metrics:**
  - Technical: evidence accuracy > 90%, scores stable within ±5 points, search < 500 ms, explanation rating ≥ 4/5.
  - Business: 10+ issues and 20+ action items per brand, NPS ≥ 4/5, > 50% conversion to paid.
- **Post-pilot pricing:**
  - Self-Service API: $500/month (10k calls, then $0.05 per call).
  - Managed: $2,000/month (unlimited calls, monthly scorecards, QBRs).
  - Enterprise: custom pricing (white-label, custom weights).

---

## 14. Authentication

**What exists:**

- `src/lib/auth.ts`: NextAuth v4 with JWT sessions, a credentials provider (bcrypt, 12 rounds) and Google OAuth when its env vars are set.
- Helpers: `getSession()`, `getCurrentUser()`, `getCurrentBuyer()`.
- `/api/auth/[...nextauth]` is live.
- `src/app/providers.tsx` wraps the app in `SessionProvider`.

**What's missing:**

- `/auth/signin` and `/auth/signup` pages.
- A `POST /api/auth/register` endpoint.
- `middleware.ts` protecting `/dashboard` and `/admin`.
- Email verification, password reset and rate limiting.

**Recommendation:** the pilot doesn't need user accounts. The quickest useful step is admin-only auth: create one admin user, add a sign-in page and protect `/admin/*` and the admin pilot-application API. Full auth is estimated at 5–7 hours.

---

## 15. UI and design system

- **Brand colors:** violet `#7C3AED` → indigo `#4F46E5` (Tailwind `violet-600` / `indigo-600`); neutrals from Tailwind `gray`.
- **Custom colors** (in `tailwind.config.ts`): `constructor-blue` (light blue sections) and `constructor-dark` (black CTA band).
- **Font:** Inter (Google Fonts). **Icons:** Lucide.
- **Layout rule:** every page wraps its content in `<AppLayout>`, which renders `NavBar` (fixed, 64 px, mobile hamburger menu) and `AppFooter`. Don't build page-specific navs or footers.
- **Styling rule:** use Tailwind classes. Don't add new global CSS or CSS-variable theming.

### CSS architecture (important)

The project uses **Tailwind v4**, which behaves differently from v3:

1. **Plain CSS always beats Tailwind classes.** In v4, utilities live in a cascade layer, and any un-layered rule overrides them regardless of specificity. A global `* { margin: 0; padding: 0 }` once wiped out every `p-*`/`m-*` class on the site.
2. **`tailwind.config.ts` is ignored** unless the CSS points to it with `@config`.

So `src/app/globals.css` is deliberately small:

```css
@layer theme, base, legacy, components, utilities;
@import "tailwindcss";
@import "./legacy.css" layer(legacy);
@config "../../tailwind.config.ts";
```

- `legacy.css` holds ~4,500 lines of the old dark ThriftAI design system. It is still used by `ProductCard`, `Pagination`, `HeroSection`, `/compare` and `/sustainability`. Because it sits in the `legacy` layer, it can never override Tailwind utilities. Delete it once those components are removed.
- `globals.css` resets the legacy CSS variables (`--text-primary`, `--bg-primary`, …) to light values.
- Any new global CSS must go inside an `@layer`.

---

## 16. Deployment

Target setup: **Vercel** (app) + **Supabase** (Postgres) + **Qdrant Cloud** (vectors).

1. **Supabase:** create a project. Copy the pooled connection string as `DATABASE_URL` and the direct connection string (port 5432) as `DIRECT_URL`.
2. **Qdrant Cloud:** create a cluster (free tier is fine). Copy `QDRANT_URL` and `QDRANT_API_KEY`.
3. **Keys:** collect `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY` and `NEXTAUTH_SECRET`. Set `NEXTAUTH_URL` to the production URL.
4. **Vercel:**
   ```bash
   npm i -g vercel && vercel login && vercel link
   vercel env add DATABASE_URL production      # repeat for each variable above
   vercel --prod
   ```
5. **Database:**
   ```bash
   npx prisma generate
   DATABASE_URL="<direct-url>" npx prisma migrate deploy   # or: prisma db push
   DATABASE_URL="<direct-url>" npx tsx src/scripts/seed-demo-data.ts   # optional demo data
   ```
6. **Vectors:** `npm run qdrant:init` (collection `products`, 1536-dim, cosine), then generate embeddings.
7. **Verify:** load `/`, `/dashboard` and `/pilot`. Call `GET /api/v1/products`, `POST /api/v1/conversation` and `GET /api/v1/products/<id>/explain`. Watch the Vercel logs.

**Before going public:** protect the admin pilot-application endpoints, add rate limiting (Upstash), and set up error monitoring (Sentry).

---

## 17. Costs

| Phase | Services | Est. monthly |
|---|---|---|
| Local dev | Local Postgres, local Next.js | $0 |
| Pilot (months 1–2) | Vercel Hobby, Supabase Free, Qdrant Free, Resend Free, OpenAI $20–50, Anthropic $0–20 | **$20–70** |
| Production (month 3+) | Vercel Pro $20, Supabase Pro $25, Qdrant $25, OpenAI $50–200, Anthropic $20–100, Resend $20 | **$140–390** |

Embedding 100 products costs about $0.02.

---

## 18. Known issues and pending work

### Bugs and risks

- **Outdated Claude model ID:** `src/lib/agents/evidence/evidence-agent.ts` uses `claude-3-5-sonnet-20241022`. Update it to a current model before running evidence extraction.
- **Admin API is open:** `GET`/`PATCH /api/v1/pilot-applications` have no auth.
- **Natural search fails** without `OPENAI_API_KEY` and a running Qdrant.
- **Mock data:** pricing and trend agents use mock data. The demo seed doesn't run the real evidence → scoring pipeline.
- **In-memory state:** conversations are lost on restart and won't work across multiple server instances.
- **Legacy code:** consumer-app code (cart, checkout, Stripe, affiliates, voice, old 96-parameter Veritas scoring, many services) adds weight and env-var noise.
- **Old README:** the parent `../README.md` still describes the original ThriftAI consumer app.

### Pending work (rough priority)

1. Admin-only auth plus a small admin page to review pilot applications (~4–6 h).
2. Document and test `POST /api/v1/products/ingest` with CSV/JSON (~3 h).
3. Run the full pipeline on real reviews: evidence → scoring, with re-scoring when new reviews arrive (~2 h).
4. Set up Qdrant + OpenAI and generate embeddings (~1 h).
5. Deploy to Vercel/Supabase/Qdrant (~2 h).
6. Add rate limiting and caching: Upstash, or in-memory caches for scores (24 h), searches (1 h) and embeddings (7 days).
7. Write tests for the v1 API and scoring math.
8. Remove leftover consumer pages and routes, then delete `legacy.css`.
9. Add analytics/monitoring (Vercel Analytics, Sentry) and SEO (sitemap, OG images).

### Business tasks

- Pick 3–5 target brands.
- Customize the pilot proposal and prepare an anonymized sample scorecard.
- Draft a pilot agreement/NDA and set up a support channel.

---

## 19. Project history

| When | What happened |
|---|---|
| 2025 – mid 2026 | **ThriftAI**: consumer AI thrift-shopping marketplace with chat search, voice, swipe UI, cart/checkout, affiliate links and a "96-parameter" Veritas score. Many search variants and features accumulated. |
| Sep 2026 | RAG and agentic-AI experiments; "world-class architecture" plans. |
| Oct 20, 2026 | Production roadmap and gap analysis. |
| Oct 22, 2026 | Critical review ("brutal reality check"). Options were: shut down, radically focus, or continue. Chose **radical focus** on clothing quality scoring for DTC brands, cutting the score from 96 to 27 factors. |
| Oct 23, 2026 | **8-week plan executed:** W1 deleted 20 API routes and the swipe/leaderboard/marketplace/buyer features (git tag `legacy-thriftai`) · W2 10 clothing Prisma models · W3 evidence agent · W4 scoring engine · W5 pricing agent · W6 trend & brand agent · W7 query/explanation/conversation agents · W8 v1 REST API + pilot docs. Then Apple-style UI, demo seed, pilot application API. |
| Oct 24, 2026 | Resend emails; dashboard and product pages on real data; shared `AppLayout`. Fixed Tailwind v4 CSS conflicts and the pages that broke after old components were deleted. Merged ~190 docs into this file. |

The legacy consumer code is preserved under the git tag **`legacy-thriftai`**.

---

## 20. Other docs kept

| File | Covers |
|---|---|
| `../CLAUDE.md` | Instructions for Claude Code (partly outdated: mentions the old Spring Boot setup) |
| `scripts/README.md` | Scraper and utility scripts |
| `scripts/b2b/README.md` | B2B tenant and Qdrant scripts |
| `src/lib/agents/evidence/README.md` | Evidence agent details |
| `ml/README.md` | Python ML experiments |
| `public/vad-models/README.md` | Voice-activity-detection model files (legacy voice feature) |

The removed docs can be recovered from git history (`git log --all -- '<file>.md'`). Docs that were never committed are only in the backup archive made during the cleanup.
