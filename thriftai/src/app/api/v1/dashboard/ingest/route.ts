/**
 * POST /api/v1/dashboard/ingest — upload a feed file from the dashboard (signed-in platform or brand user).
 * multipart/form-data: kind (catalog|reviews|returns), source, licence?, dryRun ("on"), file (.csv or .json).
 * Same engine and report as the API-key ingest endpoint; data goes into the user's own tenant.
 */
import { after } from 'next/server'
import { z } from 'zod'
import { describeMany } from '@/lib/veritas/graph/describe-image'
import { requireApiRole } from '@/lib/veritas/authz'
import { fail, ok, rateLimit, zodFail } from '@/lib/veritas/http'
import { parseCsv } from '@/lib/veritas/ingest/csv'
import { MAX_ROWS, ingest } from '@/lib/veritas/ingest/run'

const meta = z.object({ kind: z.enum(['catalog', 'reviews', 'returns']), source: z.string().trim().min(2).max(120), licence: z.string().trim().max(200).optional() })
export const maxDuration = 60
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request) {
  const user = await requireApiRole(['BRAND', 'ADMIN'])
  if (user instanceof Response) return user
  if (!user.tenantId) return fail(400, 'This account has no organisation to import into.')
  if (!(await rateLimit('dashboard-ingest', 20, 60_000))) return fail(429, 'Too many uploads. Try again in a minute.')
  const form = await req.formData().catch(() => null)
  if (!form) return fail(400, 'Send the file as multipart/form-data')
  const parsed = meta.safeParse({ kind: form.get('kind'), source: form.get('source'), licence: form.get('licence') || undefined })
  if (!parsed.success) return zodFail(parsed.error)
  const file = form.get('file')
  if (!(file instanceof File)) return fail(400, 'Choose a .csv or .json file')
  if (file.size > MAX_BYTES) return fail(413, 'File too large (10 MB max). Split it.')
  const text = await file.text()
  let rows: unknown[]
  try {
    rows = file.name.toLowerCase().endsWith('.json') ? JSON.parse(text) : parseCsv(text)
  } catch {
    return fail(400, 'Could not read the file. Use CSV with a header row, or a JSON array.')
  }
  if (!Array.isArray(rows) || rows.length === 0) return fail(400, 'No rows found')
  if (rows.length > MAX_ROWS) return fail(413, `Too many rows (max ${MAX_ROWS}). Split the file.`)
  try {
    const { photoProductIds, ...report } = await ingest({ tenantId: user.tenantId, kind: parsed.data.kind, rows, source: parsed.data.source, licence: parsed.data.licence, dryRun: form.get('dryRun') === 'on' })
    // Read new or changed product photos right after responding (vision agent, within this function's time); the nightly job finishes the rest.
    if (!report.dryRun && photoProductIds.length) after(() => describeMany(photoProductIds, { budgetMs: (maxDuration - 8) * 1000 }).then((r) => console.log('photos read after upload', r)).catch((e) => console.error('photo reading after upload failed', e)))
    return ok(report)
  } catch (err) {
    console.error('dashboard ingest failed', err)
    return fail(500, 'Import failed part-way. Rows before the error were saved; uploading the same file again is safe.')
  }
}
