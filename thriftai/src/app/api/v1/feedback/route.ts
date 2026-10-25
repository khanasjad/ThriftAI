/**
 * POST /api/v1/feedback — 👍/👎 (+ optional reason) on a product score or a search answer.
 * One vote per browser session per target; voting again replaces the earlier vote.
 * Feeds the eval report (backend plan §4.6). Reasons are untrusted text: stored, never followed.
 */
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { fail, ok, rateLimit, sessionId, zodFail } from '@/lib/veritas/http'

const schema = z.object({
  targetType: z.enum(['PRODUCT_SCORE', 'SEARCH_TURN']),
  targetId: z.string().min(1).max(64),
  rating: z.union([z.literal(1), z.literal(-1)]),
  reason: z.string().trim().max(500).optional(),
})

export async function POST(req: Request) {
  if (!(await rateLimit('feedback', 30, 60_000))) return fail(429, 'Too many requests. Try again in a minute.')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail(400, 'Body must be JSON')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return zodFail(parsed.error)
  const { targetType, targetId, rating, reason } = parsed.data

  // The target must exist. For PRODUCT_SCORE the id is the product id and the product must be rated.
  if (targetType === 'PRODUCT_SCORE') {
    const score = await prisma.productScore.findUnique({ where: { productId: targetId }, select: { id: true } })
    if (!score) return fail(404, 'This product has no score to give feedback on')
  } else {
    const turn = await prisma.searchTurn.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!turn) return fail(404, 'Search answer not found')
  }

  const sid = await sessionId()
  const existing = await prisma.feedback.findFirst({ where: { targetType, targetId, sessionId: sid }, select: { id: true } })
  const data = { rating, reason: reason || null }
  const saved = existing
    ? await prisma.feedback.update({ where: { id: existing.id }, data })
    : await prisma.feedback.create({ data: { targetType, targetId, sessionId: sid, ...data } })

  return ok({ id: saved.id, rating: saved.rating, updated: !!existing }, { status: existing ? 200 : 201 })
}
