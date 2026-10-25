/** GET /api/v1/feeds/social?n=5 — "Top rated this week" posts per category, verified copy, tracked links (B11). */
import { scoreApiGate } from '@/lib/veritas/apikeys'
import { ok } from '@/lib/veritas/http'
import { socialPack } from '@/lib/veritas/ads/feeds'
import { visibleProducts } from '@/lib/veritas/scope'

export async function GET(req: Request) {
  const gate = await scoreApiGate()
  if (gate instanceof Response) return gate
  const n = Math.min(10, Math.max(1, Number(new URL(req.url).searchParams.get('n') ?? 5) || 5))
  return ok(await socialPack(visibleProducts(gate.tenantId), n))
}
