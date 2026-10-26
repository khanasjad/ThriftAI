import { z } from 'zod'

/**
 * Validated server-side configuration. Fails fast with a clear message on bad config.
 * Read with `env()` (lazy, so `next build` doesn't need runtime secrets).
 * Add every new variable here and to `.env.example`.
 */
const schema = z.object({
  APP_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),

  LLM_MODE: z.enum(['live', 'replay', 'mock']).default('live'),
  LLM_RECORD: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true'),
  VERITAS_MODEL_AGENT: z.string().default('claude-haiku-5-5'),
  VERITAS_MODEL_ROUTER: z.string().default('claude-haiku-5-5'),
  VERITAS_MODEL_JUDGE: z.string().default('claude-opus-5-5'),
  SPEND_CAP_USD: z.coerce.number().positive().default(15),
  /** 'total' = all-time spend (development); 'month' = spend since the 1st of this month, UTC (production). */
  SPEND_CAP_WINDOW: z.enum(['total', 'month']).default('total'),
  DIRECT_URL: z.string().optional(),
  /** Bearer secret Vercel cron sends to /api/cron/*. Required in production. */
  CRON_SECRET: z.string().optional(),
  /** Show the fictional demo store in production (off by default: it would show real products under a fictional store name). */
  DEMO_STORE: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true'),
  /** Shopkeeper agent on searches (live model call, ~$0.001 per turn). On by default; 0 = code-only questions. */
  SEARCH_AGENT: z
    .string()
    .optional()
    .transform((v) => v !== '0' && v !== 'false'),
  /** Open-source fashion model for "looks like" search and "looks similar" (B18, $0, runs on our server). 0 = off. */
  VISUAL_SEARCH: z
    .string()
    .optional()
    .transform((v) => v !== '0' && v !== 'false'),
  /** Hugging Face model id for photo fingerprints (Apache-2.0). Changing it means re-running `npm run embed -- --all`. */
  VISUAL_MODEL: z.string().default('Marqo/marqo-fashionSigLIP'),

  RESEND_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().optional(),
})

export type Env = z.infer<typeof schema>

let cached: Env | null = null

export function env(): Env {
  if (cached) return cached
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`)
  }
  if (parsed.data.APP_ENV === 'production') {
    const problems = productionProblems(parsed.data)
    if (problems.length) throw new Error(`Production configuration is incomplete:\n${problems.map((p) => `  - ${p}`).join('\n')}\nSee docs/rpi/05-RUNBOOK-PRODUCTION.md.`)
  }
  cached = parsed.data
  return cached
}

/** What production needs before it may start. Values are never printed, only which ones are missing or weak. */
export function productionProblems(e: Env): string[] {
  const out: string[] = []
  if (e.LLM_MODE !== 'live') out.push('LLM_MODE must be "live"')
  if (!e.ANTHROPIC_API_KEY) out.push('ANTHROPIC_API_KEY is missing')
  if (!e.NEXTAUTH_SECRET || e.NEXTAUTH_SECRET.length < 32) out.push('NEXTAUTH_SECRET must be at least 32 characters')
  if (!e.NEXTAUTH_URL?.startsWith('https://')) out.push('NEXTAUTH_URL must be the https site address')
  if (!e.DIRECT_URL) out.push('DIRECT_URL (direct database connection, for migrations) is missing')
  if (!e.CRON_SECRET || e.CRON_SECRET.length < 24) out.push('CRON_SECRET must be at least 24 characters')
  if (/localhost|127\.0\.0\.1/.test(e.DATABASE_URL)) out.push('DATABASE_URL points at a local database')
  return out
}

export const isProduction = () => env().APP_ENV === 'production'

/** Model IDs come only from here; never hardcode them elsewhere. */
export const models = {
  get agent() {
    return env().VERITAS_MODEL_AGENT
  },
  get router() {
    return env().VERITAS_MODEL_ROUTER
  },
  get judge() {
    return env().VERITAS_MODEL_JUDGE
  },
}
