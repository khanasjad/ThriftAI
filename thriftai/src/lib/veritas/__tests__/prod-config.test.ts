/** @jest-environment node */
import { productionProblems, type Env } from '../env'

const good: Env = {
  APP_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db.example.supabase.co:6543/postgres', DIRECT_URL: 'postgresql://u:p@db.example.supabase.co:5432/postgres',
  ANTHROPIC_API_KEY: 'sk-test', NEXTAUTH_SECRET: 'x'.repeat(40), NEXTAUTH_URL: 'https://veritas.example', CRON_SECRET: 'y'.repeat(32),
  LLM_MODE: 'live', LLM_RECORD: false, VERITAS_MODEL_AGENT: 'claude-haiku-5-5', VERITAS_MODEL_ROUTER: 'claude-haiku-5-5', VERITAS_MODEL_JUDGE: 'claude-opus-5-5',
  SPEND_CAP_USD: 25, SPEND_CAP_WINDOW: 'month', SEARCH_AGENT: true, DEMO_STORE: false, VISUAL_SEARCH: true, VISUAL_MODEL: 'Marqo/marqo-fashionSigLIP',
}

describe('production config', () => {
  it('passes a complete configuration', () => expect(productionProblems(good)).toEqual([]))
  it('names what is missing or weak, never the values', () => {
    const p = productionProblems({ ...good, ANTHROPIC_API_KEY: undefined, NEXTAUTH_SECRET: 'short', NEXTAUTH_URL: 'http://x', DIRECT_URL: undefined, CRON_SECRET: undefined, LLM_MODE: 'mock', DATABASE_URL: 'postgresql://localhost:5432/veritas_dev' })
    expect(p).toHaveLength(7)
    expect(p.join(' ')).not.toContain('short')
  })
})
