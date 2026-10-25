/**
 * GET /api/v1/feeds/ads?format=csv|json&eligible=1 — the ad feed (B11): catalog rows in the standard catalog-feed
 * shape plus Veritas labels (custom_label_0 score tier, 1 top highlight, 2 price status, 3 confidence, 4 ad ok/hold)
 * and verified ad copy. With an API key: public products plus the tenant's own catalog.
 */
import { scoreApiGate } from '@/lib/veritas/apikeys'
import { ok } from '@/lib/veritas/http'
import { AD_FEED_COLUMNS, loadAdRows } from '@/lib/veritas/ads/feeds'
import { toCsv } from '@/lib/veritas/ingest/csv'
import { visibleProducts } from '@/lib/veritas/scope'

export async function GET(req: Request) {
  const gate = await scoreApiGate()
  if (gate instanceof Response) return gate
  const url = new URL(req.url)
  const rows = await loadAdRows(visibleProducts(gate.tenantId), { eligibleOnly: /^(1|true)$/.test(url.searchParams.get('eligible') ?? '') })
  if (url.searchParams.get('format') === 'csv')
    return new Response(toCsv(rows.map((r) => r.feed), [...AD_FEED_COLUMNS]), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="veritas-ad-feed.csv"', 'Cache-Control': 'no-store' },
    })
  return ok({ columns: AD_FEED_COLUMNS, count: rows.length, eligible: rows.filter((r) => r.eligible).length, rows: rows.map((r) => r.feed) })
}
