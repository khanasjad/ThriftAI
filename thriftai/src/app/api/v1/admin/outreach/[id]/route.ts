/** PATCH/DELETE /api/v1/admin/outreach/:id — update status, notes, next step, scorecard sent; or remove. Admins only. */
import { prisma } from '@/lib/prisma'
import { fail, ok, zodFail } from '@/lib/veritas/http'
import { requireApiRole } from '@/lib/veritas/authz'
import { outreachUpdate } from '@/lib/veritas/outreach'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(['ADMIN'])
  if (auth instanceof Response) return auth
  const { id } = await params
  const parsed = outreachUpdate.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  if (!(await prisma.outreachTarget.findUnique({ where: { id }, select: { id: true } }))) return fail(404, 'Not found')
  const { scorecardSent, ...rest } = parsed.data
  return ok(await prisma.outreachTarget.update({ where: { id }, data: { ...rest, ...(scorecardSent !== undefined && { scorecardSentAt: scorecardSent ? new Date() : null }) } }))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(['ADMIN'])
  if (auth instanceof Response) return auth
  const { id } = await params
  await prisma.outreachTarget.deleteMany({ where: { id } })
  return ok({ id })
}
