/** GET/POST /api/v1/admin/outreach — list or add outreach targets. Admins only. */
import { prisma } from '@/lib/prisma'
import { ok, zodFail } from '@/lib/veritas/http'
import { requireApiRole } from '@/lib/veritas/authz'
import { outreachCreate } from '@/lib/veritas/outreach'

export async function GET() {
  const auth = await requireApiRole(['ADMIN'])
  if (auth instanceof Response) return auth
  return ok(await prisma.outreachTarget.findMany({ orderBy: [{ updatedAt: 'desc' }] }))
}

export async function POST(req: Request) {
  const auth = await requireApiRole(['ADMIN'])
  if (auth instanceof Response) return auth
  const parsed = outreachCreate.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  return ok(await prisma.outreachTarget.create({ data: { ...parsed.data, website: parsed.data.website ?? null } }), { status: 201 })
}
