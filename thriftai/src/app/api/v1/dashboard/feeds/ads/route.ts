/** GET /api/v1/dashboard/feeds/ads — the signed-in user's ad feed as CSV (their own tenant's products). */
import { requireApiRole } from '@/lib/veritas/authz'
import { AD_FEED_COLUMNS, loadAdRows } from '@/lib/veritas/ads/feeds'
import { toCsv } from '@/lib/veritas/ingest/csv'
import { ownProducts } from '@/lib/veritas/scope'

export async function GET(req: Request) {
  const user = await requireApiRole(['BRAND', 'ADMIN'])
  if (user instanceof Response) return user
  const eligibleOnly = /^(1|true)$/.test(new URL(req.url).searchParams.get('eligible') ?? '')
  const rows = await loadAdRows(ownProducts(user.tenantId), { eligibleOnly })
  return new Response(toCsv(rows.map((r) => r.feed), [...AD_FEED_COLUMNS]), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="veritas-ad-feed${eligibleOnly ? '-eligible' : ''}.csv"`, 'Cache-Control': 'no-store' },
  })
}
