/**
 * POST /api/v1/search — one turn of the shopkeeper conversation.
 * Body: { message } to start · { sessionId, message } to answer or refine · { sessionId, action: "show" } for "Just show me".
 */
import { z } from 'zod'
import { env } from '@/lib/veritas/env'
import { runSearch } from '@/lib/veritas/graph/answer-search'
import { fail, ok, rateLimit, sessionId, zodFail } from '@/lib/veritas/http'
import { warmVisual } from '@/lib/veritas/visual/store'

/** GET: warm-up ping from the search box (loads the fashion model on this instance; no search, nothing stored). */
export async function GET() {
  return ok({ visual: warmVisual() })
}

const schema = z.union([
  z.object({ message: z.string().trim().min(1).max(300), sessionId: z.string().min(1).max(64).optional() }),
  z.object({ sessionId: z.string().min(1).max(64), action: z.literal('show') }),
])

export async function POST(req: Request) {
  if (!(await rateLimit('search', 40, 60_000))) return fail(429, 'Too many messages. Try again in a minute.')
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  const b = parsed.data
  try {
    return ok(
      await runSearch({
        ...('action' in b ? { sessionId: b.sessionId, action: 'show' as const } : { message: b.message, sessionId: b.sessionId }),
        shopperSid: await sessionId(),
        useAgent: env().SEARCH_AGENT,
      }),
    )
  } catch (err) {
    console.error('search failed', err)
    return fail(500, 'Search failed. Try again.')
  }
}
