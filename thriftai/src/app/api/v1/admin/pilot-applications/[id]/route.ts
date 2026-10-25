/** PATCH /api/v1/admin/pilot-applications/:id — update status and notes. Admins only. */
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { fail, ok, zodFail } from '@/lib/veritas/http'
import { requireApiRole } from '@/lib/veritas/authz'
import { PILOT_STATUSES } from '@/lib/veritas/pilots'

const schema = z
  .object({ status: z.enum(PILOT_STATUSES).optional(), notes: z.string().max(2000).nullable().optional() })
  .refine((v) => v.status !== undefined || v.notes !== undefined, 'Nothing to update')

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(['ADMIN'])
  if (auth instanceof Response) return auth
  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  const exists = await prisma.pilotApplication.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return fail(404, 'Application not found')
  const saved = await prisma.pilotApplication.update({ where: { id }, data: parsed.data })
  return ok({ id: saved.id, status: saved.status, notes: saved.notes, updatedAt: saved.updatedAt })
}
