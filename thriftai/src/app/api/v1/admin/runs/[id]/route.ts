/** GET /api/v1/admin/runs/:id — one run with every step (inputs, outputs, tokens, cost). Admins only. */
import { requireApiRole } from '@/lib/veritas/authz'
import { fail, ok } from '@/lib/veritas/http'
import { getRun } from '@/lib/veritas/read/runs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireApiRole(['ADMIN'])
  if (u instanceof Response) return u
  const run = await getRun((await params).id)
  return run ? ok(run) : fail(404, 'Run not found')
}
