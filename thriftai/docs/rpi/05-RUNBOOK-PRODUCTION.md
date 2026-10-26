# Production runbook

How to take Veritas live and keep it running. Written 2026-10-25 (B8a). Every command below exists and is tested in development; production-only steps are marked.

## Hosted development (do this first, production stays on hold)

A shared dev site on the internet with the same **fictional** data as local development: Vercel **Preview** deployments + a separate Supabase project. It is still `APP_ENV=development` (robots block indexing, test pages and the demo store are on, fictional data only). Never point it at the production database.

1. **Supabase:** create a project named `veritas-dev` (separate from production). Copy `.env.hosted.example` to `.env.hosted.local` and fill in its pooled `DATABASE_URL` and direct `DIRECT_URL`.
2. **Database:** `DEV_TARGET=hosted npm run db:deploy` (creates the tables), then either
   - `npm run dev:hosted:copy -- --yes`: copies the local dev database there, ratings included ($0), or
   - `DEV_TARGET=hosted npm run seed` then `DEV_TARGET=hosted npm run rate -- --all --mode full --yes` (re-rates, ~$0.45).
   Then `DEV_TARGET=hosted npm run seed:accounts` for dev sign-ins (passwords go to `.veritas/dev-accounts.json`, never printed).
3. **Vercel:** import the repository (root directory `thriftai`). In **Settings → Environment Variables → Preview**, set:
   `APP_ENV=development`, `DATABASE_URL` and `DIRECT_URL` (the dev project's), `ANTHROPIC_API_KEY` (a dev key), `NEXTAUTH_SECRET` (`openssl rand -base64 48`), `SPEND_CAP_USD=3`. Leave `NEXTAUTH_URL` empty for previews: the login library uses Vercel's preview address. Every push to a non-main branch deploys a preview; builds run migrations on the dev database (`vercel-build`).
4. Check a preview: `DEV_TARGET=hosted npm run smoke:hosted -- --url https://<preview>.vercel.app` (expect the 3 development differences: dev UI on, demo store on, robots block all).

**Set up 2026-10-25:** Supabase project `veritas-dev` (ref `kaulkgbjvgjcmigdzsqh`, us-east-1, separate from "khanasjad's Project"); Vercel project `veritas-dev` (team `veritas-c5a5`, root directory `thriftai`, GitHub `khanasjad/ThriftAI` connected, Preview variables set). Notes:
- **Previews are protected** by Vercel login (only you can open them). Scripts use an automation bypass secret stored in `.env.hosted.local` (`VERCEL_AUTOMATION_BYPASS_SECRET`), sent as the `x-vercel-protection-bypass` header.
- **Production builds are skipped** while production is on hold (project "Ignored Build Step" exits early when `VERCEL_ENV=production`). Remove that setting when going live.
- **Deploy the working copy** (uncommitted changes) as a preview from the repo root: `npx vercel deploy --target=preview` (`.vercelignore` keeps other folders, dependencies and every `.env*.local` out of the upload). Pushing a branch to GitHub also builds a preview.
- Dev sign-ins for the hosted database are in `.veritas/dev-accounts.hosted.json` (separate from local).

Any command can target the hosted dev database with `DEV_TARGET=hosted` in front (it loads `.env.hosted.local`; seeding a non-local database is allowed only there, and never in production).

## 0. What you need

| Account | Used for | Notes |
|---|---|---|
| Supabase (Postgres) | Production database | Region close to Vercel `iad1` (US East). Paid plan for daily backups / point-in-time restore. |
| Vercel | Hosting, nightly cron | Hobby works (60 s functions); Pro allows longer nightly runs. |
| Anthropic | Claude API key for production | A separate key from development. Set a monthly limit in the console as a second safety net. |
| Domain (optional) | `https://your-domain` | Vercel provides `*.vercel.app` until then. |

## 1. Database (Supabase)

1. Create the project. In **Project settings → Database → Connection string**:
   - **Pooled** (port 6543, transaction mode) → `DATABASE_URL`, and append `?pgbouncer=true&connection_limit=1`
   - **Direct** (port 5432) → `DIRECT_URL` (used only by migrations)
2. Nothing else: migrations run on deploy (`vercel-build`).

## 2. Hosting (Vercel)

1. Import the repository; root directory `thriftai`. Vercel runs `npm run vercel-build` (= `prisma generate && prisma migrate deploy && next build`).
2. **Environment variables → Production** (secrets only here, never in the repo):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase pooled URL (step 1) |
| `DIRECT_URL` | Supabase direct URL (step 1) |
| `ANTHROPIC_API_KEY` | Production key |
| `NEXTAUTH_SECRET` | `openssl rand -base64 48` |
| `NEXTAUTH_URL` | `https://your-domain` (or the `.vercel.app` URL) |
| `NEXT_PUBLIC_APP_URL` | same as `NEXTAUTH_URL` |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` | optional tracing |

Non-secret defaults come from the committed `.env.production`: `APP_ENV=production`, `LLM_MODE=live`, models, `SPEND_CAP_USD=25`, `SPEND_CAP_WINDOW=month`. The app refuses to start in production if a required variable is missing or weak (`env.ts`, `productionProblems`).

3. Deploy. The nightly cron (`vercel.json`, 03:00 UTC) starts automatically.

## 3. After the first deploy (production)

Pull the production variables to your machine (`vercel env pull .env.production.local`), then:

```bash
APP_ENV=production npm run prod:check                          # must print "Ready." (config, no dev data, migrations)
APP_ENV=production ADMIN_PASSWORD='…' npm run admin:create -- --email you@company.com
npm run smoke:prod -- --url https://your-domain                # public pages, API, auth walls, headers, dev pages off
```

Delete `.env.production.local` when done, or keep it only on an encrypted disk.

## 4. Onboard a pilot customer (production)

To delete a customer's data on request: `APP_ENV=production npm run org:delete -- --slug <org>` (shows what will go), then add `--yes`.


```bash
APP_ENV=production ORG_PASSWORD='…' npm run org:create -- --name "Their Company" --email ops@their.com --plan pilot [--brand "Their Brand"]
```

They sign in, open **Dashboard → Data and ads**, and either upload CSV/JSON files (dry run first) or create an API key and push feeds to `POST /api/v1/ingest/{catalog|reviews|returns}`. Imported data is private to their organisation. Every upload records `source` and `licence`.

## 5. First scores (production)

The first full rating is a batch job; run it from your machine, not the nightly job:

```bash
APP_ENV=production npm run vision -- --all            # prints an estimate (~$0.0003 per photo); add --yes
APP_ENV=production npm run rate -- --all --mode full  # prints an estimate (~$0.01 per product); add --yes
APP_ENV=production npm run rate -- --all --baselines  # $0: category baselines, then re-score
APP_ENV=production npm run ads -- --eligible          # verified ad copy (~$0.001 per product); add --yes
APP_ENV=production npm run spend                      # this month's spend vs. the cap
```

Run 1–5 products first (`--product <slug>`), check the product page, then the rest.

## 6. Every day after that (automatic)

Product photos are read automatically: right after each catalog upload (new or changed photo links, within the upload's time budget), and by the nightly job for anything left. Our server downloads the vendor's image (https, public hosts, ≤ 5 MB) and only re-reads a photo when its bytes change.

`/api/cron/nightly` reads photos of new products and re-rates products whose reviews, prices, returns or details changed. Unchanged review text reuses earlier evidence (no model call), so daily price feeds cost almost nothing. On Hobby (60 s) it handles a few paid re-ratings per night and continues the next night; for large daily changes use Pro (raise `maxDuration` in `src/app/api/cron/nightly/route.ts`) or run `npm run rate -- --all --mode full` yourself.

## 7. Money

- `SPEND_CAP_USD` (production: per calendar month, UTC) stops every model call once reached; nothing raises it automatically. Check with `npm run spend`.
- Rough costs (Haiku 5.5, measured in development): rating $0.005–0.012 per product, photo $0.0003, ad copy $0.0008, product Q&A $0.0007 per new question, shopkeeper ~$0.0004 per message.

## 8. If something goes wrong

| Problem | Do this |
|---|---|
| Bad deploy | Vercel → Deployments → previous → Promote (instant rollback). Migrations are additive, so older code still runs. |
| App won't start: "Production configuration is incomplete" | The message lists the missing variables (never their values). Fix them in Vercel and redeploy. |
| Spend cap reached | Model features pause (search falls back to code questions, ratings stop). Wait for next month or raise `SPEND_CAP_USD` deliberately in Vercel. |
| A customer's file is wrong | They re-send a corrected file; uploads are matched by their own ids, so nothing duplicates. |
| Data restore | Supabase backups / point-in-time restore (paid plan). |

## 9. Known gaps (planned)

- Rate limits count in Postgres in production (shared by all server instances; a database outage fails open). At high traffic, move them to Redis.
- Content-Security-Policy is on: scripts only from our own site or inline with the per-request nonce (Next adds it); styles still allow inline (score bars and swatches use style attributes).
- Next.js is on 16.4.3 (upgraded 2026-10-25, e2e re-run green).
