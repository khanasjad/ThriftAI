# RPI · Phase 1 — Research

**Date:** 2026-10-24 · **Status:** ✅ Complete · **Next:** [Backend plan](02-PLAN-BACKEND.md), [Frontend plan](03-PLAN-FRONTEND.md)

Compares the codebase as it is today with the [product plan](00-PRODUCT-PLAN.md) and the agent-architecture diagram (harness → loop → graph → guardrails → tracing → evals).

Legend: ✅ done and matches the plan · 🟡 partly done or off-plan · ❌ missing

---

## 1. Summary

1. **The scoring core matches the plan.** The 27 factors, the 35/30/20/15/+5 weights and the evidence → factor → pillar → overall maths already exist in `src/lib/agents/{evidence,scoring}`.
2. **The "agents" aren't agentic yet.** Each one is a single Claude call or plain code. There's no tool loop, no harness, no stop conditions, no tracing, no guardrails, no evals and no spend control. The diagram calls for all of these.
3. **The plan's two big user-facing features don't exist:** Personal Match and the 3-pick conversational search.
4. **The brand dashboard is a product list.** It's missing top problems ranked by cost, size-chart fixes, price position and launch watch.
5. **The UI is a template-level marketing site** with false claims ("14-day free trial", a made-up testimonial, "99.9% uptime", "millions of reviews").
6. **There's no clean dev/prod split.** There are 4 local databases, about 150 legacy env vars and a demo seed that skips the real pipeline.
7. **About 60% of the code is legacy** from the ThriftAI consumer app (cart, Stripe, affiliates, voice, 96-parameter scoring, 52 services, ~45 Prisma models). It's safe to delete because git tag `legacy-thriftai` preserves it.

---

## 2. Plan vs. code

### 2.1 Score

| Plan requirement | Status | Where / note |
|---|---|---|
| 27 factors in 5 pillars, plan weights | ✅ | `evidence/factor-taxonomy.ts` (sums to 105) |
| Evidence with quotes per factor | ✅ | `EvidenceTag.quote`; extraction is a single call (`evidence-agent.ts`) |
| Factor → pillar → overall maths | ✅ | `scoring/*` |
| Confidence: High / Medium / Low / **New launch** | 🟡 | H/M/L exist; "new launch" is a boolean flag, not a confidence label |
| **Shrink toward category average** | ❌ | Code applies a flat 50% decay to missing factors instead. Needs Bayesian shrinkage per category |
| Sustainability on/off, other pillars rescale | ❌ | Always added as +5 |
| Per-category weights (coat ≠ tee) | ❌ | Single global weight table |
| Score shows which factors are included | 🟡 | `factorCoverage` is computed but not exposed as a list |
| Trend capped at 3 points, recomputed weekly, separate tag | 🟡 | Weight is 3; no weekly job, no tag |
| No pay-for-score | ✅ (policy) | Needs an audit trail: score version + inputs hash |
| Weights tuned on keep vs. return outcomes | ❌ | No outcome loop |

### 2.2 Personal Match and ranking

| Requirement | Status | Note |
|---|---|---|
| Personal Match 0–100 (size/body, occasion, climate, budget, style, priorities, brands) | ❌ | `ShopperProfile` model exists (height, weight, body type, fit, styles); nothing uses it |
| `final = 0.6 × Product + 0.4 × Match` + diversity rule | ❌ | — |
| Optional, editable, one-click-delete profile | ❌ | — |

### 2.3 Special cases

| Requirement | Status |
|---|---|
| New-launch early score (brand track record, spec, price, early signals) blending into the evidence score | ❌ |
| Launch-watch alert | ❌ |
| Brand reputation earned from evidence, not fame | 🟡 `trends/brand-analyzer.ts` uses hardcoded brand profiles |
| Fake-discount detection, "often cheaper — consider waiting" | ❌ `pricing/*` uses `generateMockPrices()` |

### 2.4 Shopper experience

| Requirement | Status |
|---|---|
| Natural-language search box | 🟡 `/api/v1/search/natural` depends on OpenAI + Qdrant (both unset) |
| Ask at most 1–2 clarifying questions with tap chips, provisional picks meanwhile | 🟡 Query agent detects "clarification needed"; there's no UX for it |
| 3 picks: Best overall / Best value / Wildcard | ❌ |
| Result card: score, match, pillars, size advice, downside, multi-seller price | ❌ |
| Every claim links to its evidence | ❌ |
| **Verifier** checks every sentence against evidence | ❌ |

### 2.5 Brand product

| Requirement | Status |
|---|---|
| Score + pillars per product vs. category peers | 🟡 Scores yes, peer comparison no |
| Top problems ranked by cost | ❌ |
| Size-chart correction suggestions | ❌ |
| Price position vs. competitors | ❌ |
| Launch watch, trend fit | ❌ |
| Score API for site search | 🟡 v1 API exists, no API keys |
| Plans $299 / $799 / $2,000 / Platform | ❌ Old docs say $500 / $2,000; the site shows a "14-day trial" |
| Multi-tenant (brand data private) | 🟡 `Tenant` model + `ClothingProduct.tenantId`; no auth enforcement |

### 2.6 Agents vs. the diagram

| Diagram element | Status | Note |
|---|---|---|
| **Agent = LLM + system prompt + tools** | 🟡 | Prompts exist; **no tools**. Agents return one JSON blob |
| **Harness** (access, tools, limits) | ❌ | No shared runtime; each agent builds its own Anthropic client |
| **Loop engineering** (stop condition, edge cases → exit) | ❌ | No loops |
| **Graph engineering** (agents wired as a DAG) | ❌ | `AgentOrchestrator.ts` / `VeritasOrchestrator.ts` belong to the legacy 96-parameter system |
| **Router / mini LLM** | ❌ | — |
| **Guardrails** | ❌ | Only Zod on API input. No output validation, injection defence, budget or PII handling |
| **OTEL tracing** (Langfuse / Logfire) | ❌ | Only winston logs |
| **Evals, LLM-as-judge, feedback** | ❌ | — |
| Model IDs current | ❌ | `claude-3-5-sonnet-20241022` (retired) in `evidence-agent.ts`; query agent reads a config value |
| Prompt caching | ❌ | The ~4k-token taxonomy prompt is re-sent at full price on every call |

### 2.7 Data and environments

| Item | Today |
|---|---|
| Databases | `thriftai_nextjs_dev`, `thriftai_nextjs_staging`, `thriftai_nextjs` (all local) + a Supabase example |
| Env files | `.env`, `.env.development`, `.env.local`, `.env.staging`, `.env.production` + 2 examples; `.env.local` has ~40 vars, mostly legacy (Amazon, eBay, Stripe, FedEx…) |
| Git safety | `.env*` is gitignored ✅ |
| Demo data | `src/scripts/seed-demo-data.ts`: 103 products, 18,300 template reviews, scores computed **without** the agent pipeline, 5 categories (the plan says start with tees + jeans) |
| Price, trend and seller data | None. Mock generators only |

### 2.8 Frontend

| Item | Today |
|---|---|
| Pages | Home, Dashboard, Product, Pilot, About, API docs, Privacy, Terms + 9 leftover pages |
| Design | Tailwind v4, Inter, violet. Plain sections, no motion system, no dark mode, no design tokens, no component library |
| Data loading | Client-side `fetch` in `useEffect`; no React Server Components or streaming |
| Trust/evidence UI | None |
| False claims on homepage | "14-day free trial", "Cancel anytime", fake testimonial, "99.9% uptime", "millions of reviews" |
| CSS | Old 4.5k-line `legacy.css` isolated in a low-priority layer (fixed 2026-10-24) |

---

## 3. What we keep

- 27-factor taxonomy and its signals (`factor-taxonomy.ts`)
- Scoring maths (factor/pillar/product scorers). Extend it with shrinkage, rescaling and labels
- Prisma clothing models (`Brand`, `ClothingProduct`, `ClothingReview`, `ReturnEvent`, `EvidenceTag`, `PriceSnapshot`, `TrendSignal`, `FactorScore`, `ProductScore`, `ShopperProfile`, `PilotApplication`) and `Tenant`, `User`/auth
- v1 API shapes, the pilot application flow and Resend emails
- `AppLayout`/`NavBar`/`AppFooter` (to be redesigned)

## 4. What we delete (Phase 0 of the backend plan)

- API routes: `cart`, `checkout`, `orders`, `stripe`, `webhooks`, `affiliate`, `tts`, `stt`, `chat`, `v2`, `veritas` (96-parameter), `integrations`, `price-intelligence`, `personalized`, `scrapers`, `ab-testing`, `test`, `csrf-token`, `filters`, `compare`, `reviews`, `products` (non-v1), `categories`, `config`, `docs`, `admin/*` legacy
- Pages: `/compare`, `/sustainability`, `/calculator/*`, `/data-sources`, `/ai-search-demo`, `/admin/products`, `/prod/veritas/*`, `/test/veritas`
- `src/lib/agents/specialized/*`, the old orchestrators, most of `src/lib/services/*` (52 files), legacy components, `legacy.css`
- About 45 legacy Prisma models and unused dependencies (Stripe, Bootstrap, react-tinder-card, VAD/onnx, paapi5, yahoo-finance2, puppeteer, swagger…)

## 5. Constraints

- **Claude budget: $20 for testing.** The pipeline must cost cents per product and enforce a hard cap.
- **One part-time developer** (~15–20 h/week). Prefer small, boring, testable pieces.
- **Dev data is dummy data, but realistic enough that the agents do real work** (messy review text, contradictory signals, fake discounts, new launches).
- **Real data comes later** and must only come from sources whose terms allow it (product plan, data rule).

## 6. Model and cost facts (Oct 2026 price list)

| Model | ID | $ in / out per 1M tokens | Use in Veritas |
|---|---|---|---|
| Claude Opus 5.5 | `claude-opus-5-5` | $4 / $20 (cache read $0.20) | LLM-as-judge; quality comparison runs |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10 | Fallback for the evidence agent if Haiku's quality falls short |
| Claude Haiku 5.5 | `claude-haiku-5-5` | $0.10 / $0.50 (≤ 100K-token prompts) | **Chosen for all rating/search agents** and the router ("mini LLM" in the diagram) |

- Prompt caching cuts the repeated taxonomy prompt to ~5% of its cost. The Batch API halves the price of offline jobs.
- Haiku 5.5: adaptive thinking on by default, effort default `medium` (agents will run `low`); no server-side refusal fallback. Opus 5.5 / Sonnet 5.5 reject forced `tool_choice`, so the harness uses `auto` + `strict: true` everywhere to keep models swappable.
- The cost estimate for the dev dataset is in the [backend plan §8](02-PLAN-BACKEND.md#8-budget).
