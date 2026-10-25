/** GET /api/v1/brands/:slug/insights — brand insights. Brand users: own brands only. Admins: any brand. */
import { brandForUser, requireApiRole } from '@/lib/veritas/authz'
import { fail, ok } from '@/lib/veritas/http'
import { loadBrandInsights } from '@/lib/veritas/insights/load'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const u = await requireApiRole(['BRAND', 'ADMIN'])
  if (u instanceof Response) return u
  const { slug } = await params
  const brand = await brandForUser(u, slug)
  // Same answer for "doesn't exist" and "not yours", so brand slugs can't be probed.
  if (!brand) return fail(404, 'Brand not found')
  return ok(await loadBrandInsights(brand.id))
}
