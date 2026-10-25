/** GET / POST /api/v1/keys — list or create Score API keys for the signed-in brand's tenant (?brand= for admins). */
import { z } from 'zod'
import { createApiKey, listApiKeys } from '@/lib/veritas/apikeys'
import { brandForUser, requireApiRole } from '@/lib/veritas/authz'
import { fail, ok, zodFail } from '@/lib/veritas/http'

async function tenantFor(req: Request) {
  const u = await requireApiRole(['BRAND', 'ADMIN'])
  if (u instanceof Response) return u
  const brand = await brandForUser(u, new URL(req.url).searchParams.get('brand'))
  if (!brand?.tenantId) return fail(404, 'No brand account found')
  return brand.tenantId
}

export async function GET(req: Request) {
  const t = await tenantFor(req)
  if (t instanceof Response) return t
  return ok(await listApiKeys(t))
}

const body = z.object({ name: z.string().trim().min(1).max(60) })

export async function POST(req: Request) {
  const t = await tenantFor(req)
  if (t instanceof Response) return t
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  const active = (await listApiKeys(t)).filter((k) => !k.revokedAt).length
  if (active >= 10) return fail(400, 'Up to 10 active keys. Revoke one first.')
  // The raw key is in this response only; it is never stored or shown again.
  return ok(await createApiKey(t, parsed.data.name), { status: 201 })
}
