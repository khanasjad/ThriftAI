/**
 * npm run rate -- --product <slug> | --all  [options]
 *
 *   --mode structured   code-only evidence + the last stored agent evidence. No model calls, $0. (default)
 *   --mode full         also runs the evidence agent (live Claude). Needs --yes; prints a cost estimate first.
 *   --force             re-rate even when inputs are unchanged
 *   --dry-run           compute and print, write nothing
 *   --limit N           only the first N products (with --all)
 *   --baselines         after rating: recompute category baselines, then re-score everything (structured, $0)
 */
import { prisma } from '../src/lib/prisma'
import { env, models } from '../src/lib/veritas/env'
import { prismaSink } from '../src/lib/veritas/harness/telemetry'
import { rateProduct, refreshBaselines, type RateMode, type RateResult } from '../src/lib/veritas/graph/rate-product'
import { loadPeerStats } from '../src/lib/veritas/graph/data'

// Measured per-product cost for the evidence agent is recorded in the backend plan once B3 runs live.
const EST_COST_PER_PRODUCT_USD = 0.01

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : (process.argv[i + 1] ?? '')
}
const flag = (name: string) => process.argv.includes(`--${name}`)

async function main() {
  const e = env()
  if (e.APP_ENV === 'production' && !flag('yes')) throw new Error('Rating in production needs --yes.')
  const mode = (arg('mode') ?? 'structured') as RateMode
  if (!['structured', 'full'].includes(mode)) throw new Error('--mode must be structured or full')
  const force = flag('force')
  const dryRun = flag('dry-run')
  const limit = arg('limit') ? Number(arg('limit')) : undefined

  let slugs: string[]
  if (arg('product')) slugs = [arg('product')!]
  else if (flag('all')) slugs = (await prisma.clothingProduct.findMany({ orderBy: { slug: 'asc' }, select: { slug: true }, take: limit })).map((p) => p.slug)
  else {
    console.log('Usage: npm run rate -- --product <slug> | --all [--mode structured|full] [--force] [--dry-run] [--limit N] [--baselines] [--yes]')
    return
  }

  if (mode === 'full' && !dryRun) {
    const withReviews = await prisma.clothingProduct.count({ where: { slug: { in: slugs }, reviews: { some: {} } } })
    const spent = await prismaSink.spentUsd(e.APP_ENV)
    const est = withReviews * EST_COST_PER_PRODUCT_USD
    console.log(`Live run: evidence agent on ${withReviews} products with ${models.agent}. Estimated ≤ $${est.toFixed(2)}. Spent so far $${spent.toFixed(4)} of $${e.SPEND_CAP_USD}.`)
    if (!flag('yes')) {
      console.log('Re-run with --yes to proceed. Rate 1–5 products first and check the measured cost.')
      return
    }
  }

  const print = (r: RateResult) => {
    const s = r.score
    console.log(
      `${r.status.padEnd(20)} ${r.slug.padEnd(46)} ${s ? `score=${String(s.overall ?? '—').padStart(3)} ${s.label.padEnd(10)} coverage=${(s.coverage * 100).toFixed(0).padStart(3)}% factors=${s.factors} evidence=${s.evidenceCount}${s.early !== null ? ` early=${s.early}` : ''}` : ''}${r.agent ? ` agent=${r.agent.status} +${r.agent.accepted}/-${r.agent.rejected}` : ''}${r.text ? ` text=${r.text.verified ? 'verified' : 'none'} kept=${r.text.kept} dropped=${r.text.dropped}` : ''}${r.costUsd ? ` $${r.costUsd.toFixed(4)}` : ''}${r.error ? ` ${r.error}` : ''}`,
    )
  }

  const results: RateResult[] = []
  let peers = await loadPeerStats()
  for (const slug of slugs) {
    const r = await rateProduct(slug, { mode, force, dryRun, peers })
    results.push(r)
    print(r)
  }

  // Second pass ($0): roll-ups and early scores read other products' published scores, which the first pass
  // may have changed. Only products whose roll-up inputs changed are re-rated; the rest are skipped.
  if (flag('all') && !dryRun) {
    peers = await loadPeerStats()
    const second: RateResult[] = []
    for (const slug of slugs) second.push(await rateProduct(slug, { mode: 'structured', peers }))
    const changed = second.filter((r) => r.status !== 'SKIPPED')
    console.log(`\nRoll-up pass: ${changed.length} product(s) updated from peer changes.`)
    changed.forEach(print)
  }

  if (flag('baselines') && !dryRun) {
    const b = await refreshBaselines()
    console.log(`\nBaselines: ${b.length} category factor means stored. Re-scoring with baselines…`)
    const peersAfter = await loadPeerStats()
    for (const slug of slugs) {
      const r = await rateProduct(slug, { mode: 'structured', force: true, peers: peersAfter })
      console.log(`${r.status.padEnd(20)} ${slug.padEnd(46)} score=${String(r.score?.overall ?? '—').padStart(3)} ${r.score?.label ?? ''}`)
    }
  }

  const by = (st: RateResult['status']) => results.filter((r) => r.status === st).length
  const cost = results.reduce((s, r) => s + r.costUsd, 0)
  console.log(
    `\n${results.length} products · rated ${by('RATED')} · not enough evidence ${by('NOT_ENOUGH_EVIDENCE')} · skipped ${by('SKIPPED')} · errors ${by('ERROR')} · model cost $${cost.toFixed(4)}${dryRun ? ' · DRY RUN (nothing written)' : ''}`,
  )
  if (by('ERROR')) process.exitCode = 1
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
