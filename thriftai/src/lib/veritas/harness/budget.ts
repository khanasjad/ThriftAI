/**
 * Price table and spend checks. Prices are USD per 1M tokens (claude-api skill, 2026-10-24).
 * Cache writes (5-minute TTL) cost 1.25x base input; cache reads use the per-model read price.
 */

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

type Price = { input: number; output: number; cacheRead: number }

const PRICES: Record<string, Price> = {
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
}

// Haiku 5.5 bills prompts over 100K tokens at $0.50 / $2.50.
const HAIKU_LONG: Price = { input: 0.5, output: 2.5, cacheRead: 0.05 }
const LONG_PROMPT_TOKENS = 100_000
const CACHE_WRITE_MULTIPLIER = 1.25

export class UnknownModelPriceError extends Error {
  constructor(model: string) {
    super(`No price for model "${model}". Add it to harness/budget.ts before using it.`)
  }
}

export function priceFor(model: string, promptTokens = 0): Price {
  const p = PRICES[model]
  if (!p) throw new UnknownModelPriceError(model)
  if (model === 'claude-haiku-5-5' && promptTokens > LONG_PROMPT_TOKENS) return HAIKU_LONG
  return p
}

export function promptTokens(u: Usage) {
  return u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
}

/** Cost of one call in USD. */
export function costOf(model: string, u: Usage): number {
  const p = priceFor(model, promptTokens(u))
  const write = u.cache_creation_input_tokens ?? 0
  const read = u.cache_read_input_tokens ?? 0
  return (
    (u.input_tokens * p.input + write * p.input * CACHE_WRITE_MULTIPLIER + read * p.cacheRead + u.output_tokens * p.output) /
    1_000_000
  )
}

export class SpendCapError extends Error {
  constructor(
    public spentUsd: number,
    public capUsd: number,
  ) {
    super(`Spend cap reached: $${spentUsd.toFixed(4)} of $${capUsd.toFixed(2)} (SPEND_CAP_USD). Not raising it automatically.`)
  }
}
