/**
 * Nightly job (B8): keeps scores fresh without anyone running scripts.
 *   1. Read photos of products that have an image but no reading yet (vision agent, ~$0.0003 each).
 *   2. Re-rate products whose inputs changed since their last rating (new reviews, prices, returns, edits).
 *      The rating graph itself skips unchanged inputs and reuses review evidence when the text is unchanged.
 * Stops at the time budget; the next night continues. The global spend cap applies to every model call.
 */
import { prisma } from '@/lib/prisma'
import { describeProduct } from './describe-image'
import { loadPeerStats } from './data'
import { rateProduct } from './rate-product'

export type NightlyReport = { photos: number; rated: number; skipped: number; notEnough: number; errors: number; costUsd: number; stoppedEarly: boolean; ms: number }

/** Products whose reviews, prices, returns or own fields changed after their last published rating (or never rated). */
export async function changedProductIds(limit = 500): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id FROM clothing_products p
    LEFT JOIN product_scores s ON s."productId" = p.id
    WHERE p."isAvailable" = true AND (
      s.id IS NULL
      OR p."updatedAt" > s."calculatedAt"
      OR EXISTS (SELECT 1 FROM clothing_reviews r WHERE r."productId" = p.id AND r."createdAt" > s."calculatedAt")
      OR EXISTS (SELECT 1 FROM price_snapshots x WHERE x."productId" = p.id AND x."observedAt" > s."calculatedAt")
      OR EXISTS (SELECT 1 FROM return_events e WHERE e."productId" = p.id AND e."createdAt" > s."calculatedAt")
    )
    ORDER BY s."calculatedAt" ASC NULLS FIRST
    LIMIT ${limit}`
  return rows.map((r) => r.id)
}

export async function runNightly(opts: { budgetMs: number }): Promise<NightlyReport> {
  const t0 = Date.now()
  const timeLeft = () => opts.budgetMs - (Date.now() - t0)
  const r: NightlyReport = { photos: 0, rated: 0, skipped: 0, notEnough: 0, errors: 0, costUsd: 0, stoppedEarly: false, ms: 0 }

  const unread = await prisma.clothingProduct.findMany({ where: { isAvailable: true, primaryImageUrl: { not: null }, visual: null }, select: { id: true }, take: 200 })
  for (const p of unread) {
    if (timeLeft() < 15_000) {
      r.stoppedEarly = true
      break
    }
    const d = await describeProduct(p.id)
    r.costUsd += d.costUsd
    if (d.status === 'described') r.photos++
    else if (d.status === 'error') r.errors++
  }

  const peers = await loadPeerStats()
  for (const id of await changedProductIds()) {
    if (timeLeft() < 20_000) {
      r.stoppedEarly = true
      break
    }
    const res = await rateProduct(id, { mode: 'full', peers })
    r.costUsd += res.costUsd
    if (res.status === 'RATED') r.rated++
    else if (res.status === 'SKIPPED') r.skipped++
    else if (res.status === 'NOT_ENOUGH_EVIDENCE') r.notEnough++
    else r.errors++
    // The spend cap stops model calls with an error result; no point continuing tonight.
    if (res.status === 'ERROR' && /Spend cap/i.test(res.error ?? '')) {
      r.stoppedEarly = true
      break
    }
  }
  // Housekeeping: rate-limit windows older than a day.
  await prisma.rateLimitHit.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 864e5) } } })
  r.ms = Date.now() - t0
  return r
}
