/** GET /api/v1/admin/spend — spend vs. SPEND_CAP_USD by agent, day and status. Admins only. */
import { env } from '@/lib/veritas/env'
import { requireApiRole } from '@/lib/veritas/authz'
import { ok } from '@/lib/veritas/http'
import { spendSummary } from '@/lib/veritas/read/runs'

export async function GET() {
  const u = await requireApiRole(['ADMIN'])
  if (u instanceof Response) return u
  const e = env()
  return ok({ env: e.APP_ENV, capUsd: e.SPEND_CAP_USD, ...(await spendSummary(e.APP_ENV)) })
}
