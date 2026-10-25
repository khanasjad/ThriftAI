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
  /** Shopkeeper agent on searches (live model call, ~$0.001 per turn). On by default; 0 = code-only questions. */
  SEARCH_AGENT: z
    .string()
    .optional()
    .transform((v) => v !== '0' && v !== 'false'),

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
  if (parsed.data.APP_ENV === 'production' && parsed.data.LLM_MODE !== 'live') {
    throw new Error('LLM_MODE must be "live" in production.')
  }
  cached = parsed.data
  return cached
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
