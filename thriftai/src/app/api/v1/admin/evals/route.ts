/** GET /api/v1/admin/evals — recent eval runs with summaries; ?id= for one run's per-case results. Admins only. */
import { prisma } from '@/lib/prisma'
import { requireApiRole } from '@/lib/veritas/authz'
import { fail, ok } from '@/lib/veritas/http'

export async function GET(req: Request) {
  const u = await requireApiRole(['ADMIN'])
  if (u instanceof Response) return u
  const id = new URL(req.url).searchParams.get('id')
  if (id) {
    const run = await prisma.evalRun.findUnique({ where: { id }, include: { results: { include: { evalCase: { select: { name: true, expected: true } } } } } })
    return run ? ok(run) : fail(404, 'Eval run not found')
  }
  return ok(await prisma.evalRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20, select: { id: true, model: true, judgeModel: true, summary: true, costUsd: true, startedAt: true, endedAt: true } }))
}
