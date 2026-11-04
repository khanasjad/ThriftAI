/**
 * POST /api/v1/products/:id/ask — { question } → an answer built only from this product's evidence,
 * every sentence checked by code and the Verifier (B9 product Q&A). ~$0.002 per new question; repeats are cached.
 */
import { z } from 'zod'
import { fail, ok, rateLimit, zodFail } from '@/lib/veritas/http'
import { askProduct } from '@/lib/veritas/read/qa'
import { SpendCapError } from '@/lib/veritas/harness/budget'
import { prisma } from '@/lib/prisma'
import { productScopeForViewer } from '@/lib/veritas/authz'

const schema = z.object({ question: z.string().trim().min(3).max(200) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await rateLimit('ask', 10, 60_000))) return fail(429, 'Too many questions. Try again in a minute.')
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  const { id } = await params
  // Only products this viewer may open (private items stay with their own organisation).
  const visible = await prisma.clothingProduct.findFirst({ where: { AND: [{ OR: [{ id }, { slug: id }] }, await productScopeForViewer()] }, select: { id: true } })
  if (!visible) return fail(404, 'Product not found')
  try {
    const r = await askProduct(visible.id, parsed.data.question)
    if (!r) return fail(404, 'Product not found')
    return ok({ status: r.status, sentences: r.sentences })
  } catch (err) {
    if (err instanceof SpendCapError) return fail(503, 'Questions are paused for now. Try the quick answers above.')
    console.error('ask failed', err)
    return fail(500, 'Could not answer right now. Try again.')
  }
}
