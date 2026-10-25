/** GET /api/v1/products/:id/reviews?offset=&limit= — reviews, most helpful first. `:id` may be an id or a slug. */
import { z } from 'zod'
import { scoreApiGate } from '@/lib/veritas/apikeys'
import { listProductReviews } from '@/lib/veritas/read/catalog'
import { fail, ok, zodFail } from '@/lib/veritas/http'

const query = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await scoreApiGate()
  if (gate instanceof Response) return gate
  const { id } = await params
  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return zodFail(parsed.error)
  const page = await listProductReviews(id, parsed.data.offset, parsed.data.limit)
  if (!page) return fail(404, 'Product not found')
  return ok(page)
}
