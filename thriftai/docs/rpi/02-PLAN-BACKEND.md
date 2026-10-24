# RPI · Phase 2 — Backend Plan

**Date:** 2026-10-24 · **Status:** 📝 Awaiting approval · **Inputs:** [Product plan](00-PRODUCT-PLAN.md), [Research](01-RESEARCH.md)

Covers the database, agents, APIs and environments. The UI side is in [03-PLAN-FRONTEND.md](03-PLAN-FRONTEND.md).
Each phase ends with a **gate**: a check that must pass before the next phase starts. Tick the boxes as work lands.

---

## 1. Goals

1. Rate every product on the 27 factors with **real agentic loops**: an LLM with tools, inside a harness with stop conditions, wired as a graph, wrapped in guardrails, fully traced and evaluated.
2. A **dev environment** that works end to end on realistic dummy data with live Claude calls, for **≤ $15 of the $20 test budget**.
3. A **production environment** that never sees dummy data and is ready to take real brand data later.
4. Ship the plan's missing product features: shrinkage, confidence labels, new-launch early scores, Personal Match, 3-pick search, Verifier, and brand insights.

**Out of scope for now:** scraping, real price/trend feeds, billing, vector search (Postgres is enough for ≤ 2,500 products).

---

## 2. Architecture

Mapped from the diagram: **agent = LLM + system prompt + tools**, run by a **harness** with **loop engineering**, composed by **graph engineering**, behind a **router**, inside **guardrails**, emitting **traces** for **evals and LLM-as-judge**.

```
                         ┌──────────────────────── GUARDRAILS ────────────────────────┐
 shopper / brand / cron  │                                                             │
        │                │   OFFLINE: rate-product graph (per product, nightly)        │
        ▼                │   ┌──────────┐   ┌─────────────┐                            │
  ┌───────────┐          │   │ Evidence │──▶│ Price&Value │──┐                         │
  │  Router   │──offline─┼──▶│  agent   │   └─────────────┘  │  ┌─────────┐  ┌───────┐ │
  │ (Haiku)   │          │   │  (loop)  │──▶┌─────────────┐  ├─▶│ Scoring │─▶│Writer+│ │
  └───────────┘          │   └──────────┘   │ Trend&Brand │──┘  │ (code)  │  │Verify │ │
        │                │                  └─────────────┘     └─────────┘  └───────┘ │
        │ online         │                                                             │
        ▼                │   ONLINE: answer-search graph (per message)                 │
  ┌──────────────────┐   │   Conversation agent (loop, tools over stored scores)       │
  │ search / chat    │───┼──▶ → Personal Match + ranking (code) → 3 picks → Verifier   │
  └──────────────────┘   └─────────────────────────────────────────────────────────────┘
            │ every LLM call + tool call
            ▼
   Traces (AgentRun / AgentStep tables, optional OTEL → Langfuse) → Evals: golden set + LLM-as-judge + user feedback
```

**Principles**

- **Offline agents do the reading; online search only reads stored scores.** This keeps search fast and cheap, as the product plan requires.
- **Agents propose and code decides.** Agents record evidence and findings through tools. The score itself is deterministic code, so it's reproducible and auditable.
- **Anything a shopper sees is verified.** The Verifier checks each sentence against stored evidence. Unverified sentences are dropped.
- **Idempotent.** A product is re-rated only when its inputs hash changes (reviews, returns, prices, spec, scoring version).

---

## 3. Code layout (target)

```
src/lib/veritas/
├── env.ts                  # zod-validated env, fail fast; APP_ENV = development | production
├── db.ts                   # Prisma client
├── taxonomy/               # 27 factors + signals (moved from agents/evidence/factor-taxonomy.ts)
├── harness/
│   ├── llm.ts              # Anthropic client, model registry, caching, effort; LLM_MODE live | replay | mock
│   ├── tools.ts            # defineTool(): zod schema → strict tool; runs handler; errors → is_error results
│   ├── agent.ts            # defineAgent({ name, model, system, tools, limits, finishSchema })
│   ├── loop.ts             # runAgent(): the tool loop with stop conditions (§4.2)
│   ├── budget.ts           # price table, per-run cap, global env cap (reads AgentRun totals)
│   ├── guardrails.ts       # untrusted-text wrapping, injection scan, output validators (§4.4)
│   └── telemetry.ts        # AgentRun/AgentStep writes + optional OpenTelemetry export
├── agents/                 # one file per agent: prompt + tools + finish schema
│   ├── router.ts  evidence.ts  price-value.ts  trend-brand.ts
│   ├── writer.ts  verifier.ts  conversation.ts  judge.ts
├── graph/
│   ├── rate-product.ts     # offline DAG
│   └── answer-search.ts    # online DAG
├── scoring/                # factor → pillar → overall, shrinkage, labels, rescale, new-launch blend
├── match/                  # Personal Match + ranking + diversity + 3-pick selection
├── insights/               # brand insights: problems by cost, size-chart fixes, price position, launch watch
└── evals/                  # golden set, judge rubric, runner, report
scripts/
├── dev/generate-dataset.ts # builds prisma/fixtures/dev-dataset.json (deterministic)
├── dev/seed.ts             # loads the fixture into the dev DB (refuses in production)
├── rate.ts                 # npm run rate -- --product <id> | --all | --dry-run
└── eval.ts                 # npm run eval
```

`src/lib/agents/*`, `src/lib/services/*` and the other legacy folders are removed in B0. The useful parts (taxonomy, scorers) move under `src/lib/veritas/`.

---

## 4. Agent harness

### 4.1 Defining an agent

```ts
// src/lib/veritas/agents/evidence.ts  (sketch: final SDK calls are confirmed in B2)
export const evidenceAgent = defineAgent({
  name: 'evidence',
  model: models.agent,                 // claude-haiku-5-5 by default (env-configurable)
  effort: 'low',                       // Haiku 5.5 thinks adaptively by default; effort controls depth and cost
  system: EVIDENCE_SYSTEM_PROMPT,      // taxonomy + rules, cached (stable prefix)
  tools: [getProductSpec, listReviews, listReturns, recordEvidence],
  finish: finishSchema,                // zod: { reviewsRead, evidenceCount, notes }
  limits: { maxIterations: 8, maxCostUsd: 0.40, timeoutMs: 120_000, maxToolErrors: 3 },
});
```

- Tools use `strict: true` schemas generated from zod. Handlers query Prisma and never touch the network.
- The system prompt and tool list are byte-stable, so prompt caching hits. Volatile data goes into messages only.
- `finish` is a tool too. The loop ends when the agent calls it with valid input. The harness uses `tool_choice: auto` + `strict: true` and the prompt says when to call `finish`. This also works on Opus 5.5 / Sonnet 5.5, which reject forced `tool_choice`, so switching models is just an env change.
- Haiku 5.5 has no server-side refusal fallback, so the loop handles `stop_reason: "refusal"` itself (§4.2). Prompts are kept under 100K tokens; Haiku 5.5's price doubles beyond that.

### 4.2 Loop engineering

```
runAgent(agent, input):
  run = telemetry.startRun(agent, input, inputsHash)
  messages = [user(input)]
  for i in 1..maxIterations:
      guard budget: if run.cost + estimate > maxCostUsd or global cap reached → stop("budget")
      res = llm.create(agent, messages)                  # traced step, usage → cost
      switch res.stop_reason:
        "refusal"    → stop("refusal")                   # recorded, product flagged for review
        "max_tokens" → retry once with a larger max_tokens, else stop("truncated")
        "end_turn"   → if finish not called: nudge once ("call finish"), then stop("no_finish")
        "tool_use"   → run every tool_use block (in parallel), validate input with zod,
                       append all tool_results in ONE user message (is_error on failure),
                       toolErrors > maxToolErrors → stop("tool_errors")
                       if finish called with valid input → return ok(finish)
  stop("max_iterations")
```

Every stop reason is stored on `AgentRun.status`. Partial results (evidence already recorded) are kept and the score is marked with lower confidence. One failed product never stops a batch.

**Edge cases handled in the graph (code), not by the LLM:**

| Case | Handling |
|---|---|
| 0 reviews | Skip the evidence agent → new-launch early score path |
| 1–9 reviews | Run; label `NEW_LAUNCH` or `LOW` and blend with the early score |
| > 40 reviews | `listReviews` pages 10 at a time; agent stops at 40 (most recent + most helpful) and notes the sample |
| Non-English review | Agent may translate quotes; the validator checks against the original text |
| Contradictory evidence | Kept; factor maths averages it; confidence drops |
| Inputs unchanged | Skip (idempotent by hash) |

### 4.3 Graphs

**`rate-product`** (offline):

```
load product → hash inputs → (unchanged? exit)
  ├─ reviews > 0 ? evidenceAgent : skip
  ├─ priceValueAgent       (parallel with trendBrandAgent)
  ├─ trendBrandAgent
  → scoring (code): factor → pillar → overall, shrinkage, labels, factorsIncluded
  → writerAgent: summary, size advice, main downside (cites evidence ids)
  → verifierAgent: drops any sentence without supporting evidence
  → save ProductScore (versioned) + FactorScore + trace links
```

**`answer-search`** (online):

```
router (Haiku): intent = search | refine | explain | compare | off_topic
  → conversationAgent (tools: search_products, get_product_scores, get_evidence,
                        ask_clarifying_question, get_profile)
      – asks at most 1 question per turn, 2 per search, only if the answer would change the top pick
  → match + rank (code): final = 0.6·Product + 0.4·Match, then diversity
  → pick 3: Best overall · Best value · Wildcard
  → verifier: every sentence on the cards is checked against stored evidence
  → persist SearchSession / SearchTurn
```

### 4.4 Guardrails

| Layer | Rule |
|---|---|
| Input | Reviews, Q&A and brand text are **untrusted data**: wrapped in `<untrusted_review id=…>` tags; the system prompt says to treat them as content, never as instructions |
| Injection scan | A regex/heuristic flag ("ignore previous", "rate this 100", "system:") → evidence from that review gets confidence × 0.3 and the review is flagged |
| Output schema | Every tool input and finish payload is validated with zod; invalid → `is_error` result so the agent can fix it |
| **Quote grounding** | Each evidence quote must be a substring (after normalisation) of its source review → otherwise rejected. Stops invented evidence |
| Score integrity | Agents can't write scores. Brand-supplied fields can't set factor values. Scores are bounded 0–100 and versioned with the inputs hash (no pay-for-score) |
| Budget | Per-run `maxCostUsd`, per-search cap, global `SPEND_CAP_USD` per environment → harness refuses new runs when reached |
| Shopper output | The Verifier removes unsupported sentences; nothing about health, safety or legal claims; no sponsored items in the top 3 |
| PII | Reviewer names are dropped at ingest; shopper profile is optional and deletable (`DELETE /api/v1/profile`) |
| Data rules | The ingest layer records `source` and `licence` per record; prod rejects sources without one |

### 4.5 Observability

- **Always on:** `AgentRun` and `AgentStep` tables store each LLM call (model, tokens, cache hits, cost, stop reason, latency) and each tool call (input, output, error). The admin trace viewer reads these (frontend plan §5.6).
- **Optional:** OpenTelemetry export to **Langfuse** when `LANGFUSE_*` keys are set (free cloud tier or self-hosted). Same span names, so traces line up.
- Each run links to the score it produced, so any number on the site can be traced back to its prompt, tool calls and evidence.

### 4.6 Evals and feedback

| Piece | What it is |
|---|---|
| Golden set | 15 dev products with hand labels: expected signals per review, expected pillar ordering, expected size advice |
| Deterministic checks | Quote grounding rate = 100%, finish rate, stop-reason mix, cost per product, latency |
| LLM-as-judge | `judgeAgent` (Opus 5.5) scores each writer/verifier output on a rubric: faithful to evidence, useful size advice, honest downside, no hype (1–5 each) |
| Agreement check | Judge vs. hand labels on the golden set; target ≥ 80% agreement before trusting the judge on new data |
| Feedback | `POST /api/v1/feedback` (👍/👎 + reason) on scores and search answers → `Feedback` table → appears in the eval report |
| Report | `npm run eval` writes `evals/report-<date>.md` + a row in `EvalRun` |

---

## 5. Database changes

New database per environment (`veritas_dev`, Supabase for prod), created with a **clean Prisma baseline migration**. The old `thriftai_*` databases are left untouched as archives.

**Keep (with changes):** `Tenant`, `User`/`Account`/`Session`/`VerificationToken`, `Brand`, `ClothingProduct`, `ClothingReview`, `ReturnEvent`, `EvidenceTag`, `PriceSnapshot`, `TrendSignal`, `FactorScore`, `ProductScore`, `ShopperProfile`, `PilotApplication`.

| Model | Change |
|---|---|
| `ProductScore` | + `confidenceLabel` (HIGH, MEDIUM, LOW, NEW_LAUNCH), `factorsIncluded String[]`, `scoreWithSustainability`, `scoreVersion`, `inputsHash`, `summary`, `sizeAdvice`, `downside`, `verified`, `ratedByRunId` |
| `EvidenceTag` | + `runId`, `injectionFlag`, `grounded` |
| `PriceSnapshot` | + `sellerId`, `listPrice`, `isPromo`; fake-discount flag lives on findings |
| `ClothingProduct` | + `launchDate`, `trendTag` (TRENDING, CLASSIC, FADING), spec fields (GSM, composition, elastane %, care) where missing |
| `ShopperProfile` | + occasion defaults, climate, budget, priorities (pillar weights), brand allow/deny lists |

**New models**

| Model | Purpose |
|---|---|
| `Seller` | Who sells the item (fictional in dev) |
| `CategoryBaseline` | Mean and prior strength per category × factor (for shrinkage) |
| `AgentFinding` | Non-review findings (price fairness, fake discount, brand roll-up, trend) with evidence payload |
| `AgentRun`, `AgentStep` | Traces, cost, stop reasons |
| `SearchSession`, `SearchTurn` | Persisted conversations (replaces in-memory state) |
| `Feedback` | Shopper/brand feedback |
| `EvalCase`, `EvalRun`, `EvalResult` | Evals |
| `ApiKey` | Per-tenant Score API keys (B7) |

**Remove:** about 45 legacy models (`Product`, `Buyer`, `Seller` (legacy), `Order*`, `CartItem`, `Affiliate*`, `Swipe*`, `Veritas*` 96-parameter tables, `ab_*`, config tables…).

---

## 6. Scoring v2 (code)

1. **Factor score** = confidence-weighted mean sentiment → 0–100.
2. **Shrinkage:** `shrunk = (n·raw + k·categoryMean) / (n + k)`, with n = evidence count and k from `CategoryBaseline` (start at k = 8). This replaces the flat 50% decay. Factors with no data are **excluded** and listed as "not yet included", not guessed.
3. **Pillar** = weighted mean of included factors. **Overall** = 35/30/20/15 weighted over included pillars. With sustainability on, the result is rescaled so pillars sum to 100 with sustainability at 5%. Both variants are stored.
4. **Labels:** NEW_LAUNCH (< 10 reviews or launched < 30 days ago), otherwise HIGH/MEDIUM/LOW from coverage, evidence count and review count.
5. **New-launch early score** = brand track record for similar items + spec quality + price vs. peers. It blends into the evidence score as reviews arrive: `w = n / (n + 10)`.
6. **Trend** capped at 3 points, recomputed weekly, exposed as `trendTag`.
7. Unit tests cover every rule above. The maths never calls an LLM.

**Personal Match (code, `match/`):** 0–100 from fit evidence from similar builds, occasion/style fit, climate (breathability/warmth), budget (hard filter + value preference), pillar priorities and brand lists. **Ranking:** `0.6 × Product + 0.4 × Match`, then MMR-style diversity (no two picks from the same brand and silhouette). **Picks:** best overall, best value (score per dollar), wildcard (trending, sustainable or promising new launch).

---

## 7. Environments

| | **development** | **production** |
|---|---|---|
| Run with | `npm run dev` | Vercel (`next build` / `next start`) |
| Env files | `.env.development` (committed, no secrets) + `.env.development.local` (secrets, gitignored) | Vercel env vars; `.env.production` (committed, no secrets) |
| Database | Local Postgres `veritas_dev` | Supabase Postgres (`DATABASE_URL` pooled + `DIRECT_URL`) |
| Data | Dummy dataset fixture (fictional brands, sellers, reviews) | Real data only; `seed` scripts refuse to run (`APP_ENV=production`) |
| Claude | Live, `SPEND_CAP_USD=15`; `LLM_MODE=live \| replay \| mock` | Live, `SPEND_CAP_USD` set per month |
| Tracing | DB traces; Langfuse optional | DB traces + Langfuse |
| Test pages / admin | Enabled | Admin behind auth |

**Required variables (validated in `env.ts`):** `APP_ENV`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SPEND_CAP_USD`.
**Optional:** `LLM_MODE`, `VERITAS_MODEL_AGENT` (default `claude-haiku-5-5`), `VERITAS_MODEL_ROUTER` (default `claude-haiku-5-5`), `VERITAS_MODEL_JUDGE` (default `claude-opus-5-5`; a judge should be at least as capable as what it grades), `DIRECT_URL`, `RESEND_API_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`.

**Removed:** `.env`, `.env.staging`, `.env.local` legacy keys (Amazon, eBay, CJ, Stripe, carriers, ElevenLabs, Qdrant, OpenAI…). A new `.env.example` documents everything that's left.

**LLM modes:** `live` calls Claude and records responses to `fixtures/llm/` when `LLM_RECORD=1`. `replay` serves recorded responses, so it's free and deterministic for UI work and demos. `mock` uses canned tool calls for unit tests and CI.

---

## 8. Budget

**Chosen setup (2026-10-24):** all rating, search and verifier agents on **Haiku 5.5** ($0.10 / $0.50 per 1M tokens) at low effort, with cached system prompts and 10-review pages. Judge on Opus 5.5.

| Work | Unit cost (est.) | Volume | Total |
|---|---|---|---|
| Evidence agent | ~$0.003 / product (12 reviews) | 37 products with reviews | ~$0.10 |
| Price & Value + Trend & Brand | ~$0.002 / product | 40 | ~$0.08 |
| Writer + Verifier | ~$0.001 / product | 40 | ~$0.04 |
| Search testing (router + conversation + verifier) | ~$0.001 / search | 200 | ~$0.20 |
| Judge evals (Opus 5.5) | ~$0.03 / case | 15 cases × 3 runs | ~$1.35 |
| **Model comparison:** golden set re-rated with Opus 5.5 to check Haiku's quality | ~$0.20 / product | 15 | ~$3.00 |
| Debugging re-runs (buffer) | | | ~$1.50 |
| **Total** | | | **~$6.30 of $20** |

- **Hard stop:** `SPEND_CAP_USD=15` in dev. The harness refuses new runs past the cap; `npm run spend` prints the running total from `AgentRun`.
- **Measure before scaling:** gate B3 rates 5 products first and checks the real cost per product before rating all 40.
- **Quality check:** gate B6 compares Haiku's evidence and writer output with Opus 5.5 on the golden set. If Haiku misses too much, switch just the evidence agent with `VERITAS_MODEL_AGENT=claude-sonnet-5-5` (~$7–8 for the dev plan); the budget has room.
- Use `LLM_MODE=replay` for UI work so design iterations cost $0.

---

## 9. Dummy dataset (dev)

Generated once by `scripts/dev/generate-dataset.ts` (seeded random, deterministic) and committed as `prisma/fixtures/dev-dataset.json`, so every dev machine gets identical data.

| Entity | Count | Built to exercise |
|---|---|---|
| Brands (fictional) | 6 | Strong/weak sizing consistency, honest vs. inflated photos, sustainability claims with/without certs |
| Products | 40 (20 tees, 20 jeans) | Specs: GSM, composition, elastane %, care label, size range (incl. petite/tall/plus) |
| Reviews | 620, 0–30 per product | Messy text, typos, mixed sentiment, body measurements on ~40%, long-term reviews, 2 non-English, **3 prompt-injection attempts** |
| New launches | 3 | 0–2 reviews, launch date < 30 days |
| Returns | 191 | Reason mix (fit / quality / not as pictured / changed mind) that agrees or clashes with reviews |
| Sellers | 4 (fictional) | 90-day price history; **2 fake markdowns**, 1 item "often cheaper in sales" |
| Trend signals | 8 silhouettes/colours | Trending (wide-leg, boxy tee), classic (straight jean, crew tee), fading (skinny) |
| Shopper profiles | 5 personas | Build, climate, budget and priorities for search tests |

Review text comes from templates with signal phrases and variation. An optional one-time `--llm-text` pass (~$0.50, Haiku) rewrites it to sound natural; the result is committed, so it's never paid for twice. All names are fictional: **no real brands, sellers or people**.

---

## 10. API (v1, after refactor)

| Method & path | Purpose | Auth |
|---|---|---|
| `GET /api/v1/products` | List with filters (category, brand, minScore, label, price), optional `profileId` → adds Match | public |
| `GET /api/v1/products/:id` | Score, pillars, factors (+ included list), label, summary, size advice, downside, price insight, trend tag | public |
| `GET /api/v1/products/:id/evidence?factor=` | Evidence behind a number (quotes, sources, findings) | public |
| `POST /api/v1/search` | Conversational search → `{ question?, chips?, picks[3], provisional, sessionId }` (streams) | public, rate-limited |
| `GET / PUT / DELETE /api/v1/profile` | Shopper profile (one-click delete) | session |
| `GET /api/v1/brands/:id/insights` | Problems by cost, size-chart fixes, price position, launch watch, trend fit | brand / admin |
| `POST /api/v1/feedback` | 👍/👎 + reason | public |
| `POST /api/v1/pilot-applications`, `GET`/`PATCH` | Pilot form; admin list/update | public / **admin** |
| `POST /api/v1/admin/rate` | Run `rate-product` for one or all products | admin |
| `GET /api/v1/admin/runs[/:id]` | Trace list and detail | admin |
| `GET /api/v1/admin/spend` | Spend by env/agent/day vs. cap | admin |
| `POST /api/v1/admin/evals` | Run evals | admin |

All responses: `{ success, data, error? }`, Zod-validated, typed errors.

---

## 11. Phases and gates

Hours assume ~15–20 h/week. Phases B0–B2 come first; B5 runs alongside the frontend's search work.

### B0 · Cleanup and foundation (~8 h) — ✅ done 2026-10-24
- [x] Delete legacy routes, pages, services, agents, components and deps (list in Research §4). Also removed: root `scripts/`, legacy `tests/`, `ml/`, `data/`, root test/HTML/SQL/shell files, voice models, `docker-compose.yml` (Qdrant), 44 npm packages. Kept until B5: `src/lib/agents/{conversation,explanation,query}` + the v1 routes that use them (lint exception scoped in `eslint.config.mjs`)
- [x] `env.ts` + new env files (`.env.development`, `.env.production`, `.env.example` committed; secrets in `.env.development.local`); old `.env`, `.env.local`, `.env.staging` and examples renamed to `*.legacy.bak` (not deleted). `scripts/with-env.mjs` gives Prisma/scripts the same env loading as Next
- [x] Create `veritas_dev`; clean Prisma schema + baseline migration `veritas_init`. **The baseline already includes every §5 model** (AgentRun/Step, AgentFinding, Seller, CategoryBaseline, Search*, Feedback, Eval*, ApiKey, new score fields, `source`/`licence` columns), so later phases don't need schema churn
- [x] Move taxonomy/scorers to `src/lib/veritas/`; model IDs now come from `env.ts`; removed `temperature` (rejected by the current API version)
- [x] Also fixed: product routes rewritten for the new schema (old ones queried fields that didn't exist), Next 15 async `params`, auth rewritten (role + tenant in JWT, no hardcoded secret), Resend response bug, fake homepage testimonial removed
- **Gate:** ✅ `npm run build` passes · `tsc` 0 errors · `eslint` 0 errors (19 warnings in legacy files) · fresh dev server loads `.env.development.local` + `.env.development`, all pages 200, `/api/v1/products` returns valid empty data from `veritas_dev`

### B1 · Dummy dataset (~6 h) — ✅ done 2026-10-24
- [x] Generator (`npm run dataset`, seeded, deterministic) + committed fixture `prisma/fixtures/dev-dataset.json` + `npm run seed` (refuses in prod, on non-local DBs, and when non-fixture rows exist)
- [x] Hidden per-product `_truth` (fit offset, durability, comfort, photo accuracy, notes) kept in the fixture for B6 evals; not loaded into the DB
- **Gate:** ✅ deterministic (identical hash on re-run) · seeded counts match the fixture exactly: 6 brands, 4 sellers, 40 products, **620 reviews** (0–30 per product, 38% with body data), **191 returns**, 1,313 price snapshots, 96 trend signals, 5 personas · edge cases present: 3 new launches (0/1/2 reviews), 3 injection reviews, 1 Spanish + 1 French review, 2 fake markdowns, 1 often-cheaper item, 1 size-inconsistent brand (Velo Thread), 1 runs-small brand (Saltmarsh Co.), 1 runs-large brand (Copper & Chalk) · both guards tested

### B2 · Harness (~10 h) — code done 2026-10-24; live smoke run blocked on API credit
- [x] `llm.ts` (live/replay/mock, caching, effort), `tools.ts`, `agent.ts`, `loop.ts`, `budget.ts`, `guardrails.ts`, `telemetry.ts`
- [x] Decide: **small manual loop**. The Tool Runner can't do a budget check before each call, a trace row per step, or mock/replay modes without wrapping most of it, and it is beta.
- [x] Unit tests in `mock` mode for every stop reason
- [x] `npm run smoke` (asks for `--yes` before live calls; `LLM_RECORD=1` saves the run for `LLM_MODE=replay`) and `npm run spend`
- **Gate:**
  - ✅ Tests pass: 25/25 (`npm test`) covering OK, invalid finish, parallel tools + finish, REFUSAL (no tools run), max_tokens retry, TRUNCATED, nudge, NO_FINISH, MAX_ITERATIONS, TOOL_ERRORS, hidden internal errors, BUDGET (run and global cap), TIMEOUT, ERROR, plus a check that system + tool bytes stay identical across turns (cacheable). Build passes, 0 TS / 0 lint errors.
  - ⏳ Live smoke run: the first attempt reached the API and got `400 credit balance is too low`, so $0 was spent. The harness recorded it as an `ERROR` run with the API message, which is the intended behaviour. Re-run `LLM_RECORD=1 npm run smoke -- --yes` once the account has credit.

Notes from B2:
- SDK pinned to `@anthropic-ai/sdk@0.132.1`. 1.x was released 2026-10-21 (a new major, only 3 days old); revisit after B3.
- Tool schemas come from zod via `zod/v4` `toJSONSchema` plus our own strict converter (`tools.ts`). It keeps `enum`, which the SDK's helper moves into the description. Ranges such as min/max go into the description, and zod still enforces them in the handler.
- Cost is computed per call from `budget.ts` (unknown model → error, never a guess). Global cap = sum of `AgentRun.costUsd` for the env plus the current run. Runs in flight in parallel can overshoot the cap by at most their own `maxCostUsd`.
- Haiku 5.5 caches prefixes of 512+ tokens. Agent system prompts should stay above that, or caching silently does nothing.
- OpenTelemetry / Langfuse export moves to B6 (same `TraceSink` interface).

### B3 · Evidence agent + scoring v2 (~12 h)
- [ ] Evidence agent with tools, quote grounding, injection handling
- [ ] Scoring v2 (§6) with unit tests; `rate-product` graph (evidence → score)
- **Gate:** 5 products rated live · **cost per product measured and ≤ $0.25** · 100% grounded quotes · injection reviews flagged

### B4 · Remaining offline agents (~12 h)
- [ ] Price & Value (fake discounts, "often cheaper"), Trend & Brand (roll-ups, trend tag), new-launch early score
- [ ] Writer + Verifier; full `rate-product` graph
- **Gate:** all 40 products rated · total dev spend ≤ $10 · every shown sentence verified

### B5 · Search, Personal Match, ranking (~14 h)
- [ ] Router, Conversation agent + tools, `match/`, ranking, 3 picks, Verifier, persisted sessions, profile API
- **Gate:** 20 scripted searches (5 personas × 4 needs) · ≤ 2 questions each · 3 distinct picks · no unverified claims

### B6 · Evals and observability (~8 h)
- [ ] Golden set, judge rubric, `npm run eval`, feedback API, trace + spend APIs, optional Langfuse
- **Gate:** eval report generated · judge ≥ 80% agreement with hand labels

### B7 · Brand insights, auth, API keys (~10 h)
- [ ] `insights/` (problems by cost, size-chart fixes, price position, launch watch), admin/brand auth (NextAuth + middleware), `ApiKey`, rate limits
- **Gate:** insights for all 6 brands · admin and brand routes reject anonymous calls

### B8 · Production (~6 h, then the real-data plan)
- [ ] Supabase + Vercel setup, prod migrations, spend cap, Langfuse, smoke tests
- [ ] Real-data plan: CSV/JSON import for pilot brands first (`source` + `licence` required), then licensed feeds
- **Gate:** prod smoke test green · no dummy rows in prod (checked by script)

---

## 12. Decisions to confirm

| # | Decision | Default in this plan |
|---|---|---|
| 1 | Agent model | ✅ **Decided 2026-10-24:** Haiku 5.5 for all rating/search agents and the router; Opus 5.5 for the judge; switchable by env |
| 2 | Vector search | Dropped for now: Postgres filters + full-text search are enough at this size. Revisit (pgvector) after real data |
| 3 | Langfuse | Optional in dev, on in prod |
| 4 | Legacy databases | Left as archives, not migrated |
| 4b | Legacy code | ✅ **Decided 2026-10-24:** delete in B0 (recoverable from git tag `legacy-thriftai`) |
| 5 | Categories | Tees and jeans only until the product plan's gate 1 |
