/**
 * GET /api/cron/nightly — called by Vercel cron (vercel.json) with "Authorization: Bearer $CRON_SECRET".
 * Reads new product photos and re-rates changed products within the function's time limit.
 */
import { timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/veritas/env'
import { fail, ok } from '@/lib/veritas/http'
import { runNightly } from '@/lib/veritas/graph/nightly'

// Vercel Hobby allows up to 60 s per function; Pro allows more (raise both together).
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function authorised(req: Request) {
  const secret = env().CRON_SECRET
  if (!secret) return false
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export async function GET(req: Request) {
  if (!authorised(req)) return fail(401, 'Unauthorised')
  try {
    return ok(await runNightly({ budgetMs: (maxDuration - 5) * 1000 }))
  } catch (err) {
    console.error('nightly failed', err)
    return fail(500, 'Nightly job failed')
  }
}
