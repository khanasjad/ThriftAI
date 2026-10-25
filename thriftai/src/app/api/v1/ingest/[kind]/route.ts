/**
 * POST /api/v1/ingest/{catalog|reviews|returns} — push a feed (B10). Requires the tenant's API key.
 * Body: JSON { source, licence?, rows: [...] }  or  CSV (Content-Type: text/csv) with ?source=…&licence=…
 * Add ?dryRun=1 to validate without writing. Returns the validation report. Max 5,000 rows per request.
 */
import { z } from 'zod'
import { scoreApiGate } from '@/lib/veritas/apikeys'
import { fail, ok, zodFail } from '@/lib/veritas/http'
import { parseCsv } from '@/lib/veritas/ingest/csv'
import { FEEDS, type FeedKind } from '@/lib/veritas/ingest/contract'
import { MAX_ROWS, ingest } from '@/lib/veritas/ingest/run'

const meta = z.object({ source: z.string().trim().min(2).max(120), licence: z.string().trim().max(200).optional() })
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const gate = await scoreApiGate()
  if (gate instanceof Response) return gate
  if (!gate.tenantId) return fail(401, 'Ingest needs an API key: Authorization: Bearer vk_…')
  const { kind } = await params
  if (!(kind in FEEDS)) return fail(404, 'Unknown feed. Use catalog, reviews or returns.')
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) return fail(413, 'Payload too large (10 MB max). Split the file.')

  const url = new URL(req.url)
  const dryRun = /^(1|true)$/.test(url.searchParams.get('dryRun') ?? '')
  let rows: unknown[]
  let m: z.infer<typeof meta>
  if ((req.headers.get('content-type') ?? '').includes('text/csv')) {
    const parsed = meta.safeParse({ source: url.searchParams.get('source') ?? undefined, licence: url.searchParams.get('licence') ?? undefined })
    if (!parsed.success) return zodFail(parsed.error)
    m = parsed.data
    rows = parseCsv(await req.text())
  } else {
    const body = await req.json().catch(() => null)
    const parsed = meta.extend({ rows: z.array(z.record(z.unknown())).max(MAX_ROWS) }).safeParse(body)
    if (!parsed.success) return zodFail(parsed.error)
    m = parsed.data
    rows = parsed.data.rows
  }
  if (rows.length === 0) return fail(400, 'No rows found')
  if (rows.length > MAX_ROWS) return fail(413, `Too many rows (max ${MAX_ROWS} per request). Split the file.`)

  try {
    return ok(await ingest({ tenantId: gate.tenantId, kind: kind as FeedKind, rows, source: m.source, licence: m.licence, dryRun }))
  } catch (err) {
    console.error('ingest failed', err)
    return fail(500, 'Ingest failed part-way. Rows before the error were saved; re-sending the whole file is safe (nothing is duplicated).')
  }
}
