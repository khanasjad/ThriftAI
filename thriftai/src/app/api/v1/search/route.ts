/**
 * POST /api/v1/search — conversational search → { question?, picks[3], provisional, sessionId }.
 * Body: { message } to start, or { sessionId, answer: { slot, value } } to answer a clarifying question.
 */
import { z } from 'zod'
import { env } from '@/lib/veritas/env'
import { runSearch } from '@/lib/veritas/graph/answer-search'
import { fail, ok, rateLimit, sessionId, zodFail } from '@/lib/veritas/http'

const schema = z.union([
  z.object({ message: z.string().trim().min(1).max(300) }),
  z.object({
    sessionId: z.string().min(1).max(64),
    answer: z.object({ slot: z.enum(['fit', 'maxPrice', 'climate']), value: z.string().min(1).max(20) }),
  }),
])

export async function POST(req: Request) {
  if (!(await rateLimit('search', 30, 60_000))) return fail(429, 'Too many searches. Try again in a minute.')
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  const body = parsed.data
  try {
    const res = await runSearch({
      ...('message' in body ? { message: body.message } : { sessionId: body.sessionId, answer: body.answer }),
      shopperSid: await sessionId(),
      useAgent: env().SEARCH_INTENT_AGENT,
    })
    return ok(res)
  } catch (err) {
    console.error('search failed', err)
    return fail(500, 'Search failed. Try again.')
  }
}
