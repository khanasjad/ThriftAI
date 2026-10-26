/** GET /api/v1/admin/runs?status=&agent=&limit= — agent run list (traces). Admins only. */
import type { AgentRunStatus } from '@/generated/prisma/client'
import { z } from 'zod'
import { requireApiRole } from '@/lib/veritas/authz'
import { ok, zodFail } from '@/lib/veritas/http'
import { listRuns } from '@/lib/veritas/read/runs'

const STATUSES = ['RUNNING', 'OK', 'SKIPPED', 'BUDGET', 'MAX_ITERATIONS', 'REFUSAL', 'TRUNCATED', 'NO_FINISH', 'TOOL_ERRORS', 'TIMEOUT', 'ERROR'] as const
const q = z.object({ status: z.enum(STATUSES).optional(), agent: z.string().max(40).optional(), limit: z.coerce.number().int().min(1).max(500).default(100) })

export async function GET(req: Request) {
  const u = await requireApiRole(['ADMIN'])
  if (u instanceof Response) return u
  const parsed = q.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return zodFail(parsed.error)
  return ok(await listRuns({ ...parsed.data, status: parsed.data.status as AgentRunStatus | undefined }))
}
