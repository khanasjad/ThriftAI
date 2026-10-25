/**
 * Load a feed file for a tenant:
 *   npm run ingest -- --tenant <slug> --kind catalog|reviews|returns --file feed.csv|feed.json --source "<who sent it>" [--licence "<terms>"] [--dry-run]
 * Same engine and report as POST /api/v1/ingest/:kind. Scores are not recomputed: run `npm run rate` afterwards.
 */
import { readFileSync } from 'node:fs'
import { prisma } from '../src/lib/prisma'
import { parseCsv } from '../src/lib/veritas/ingest/csv'
import { ingest } from '../src/lib/veritas/ingest/run'
import type { FeedKind } from '../src/lib/veritas/ingest/contract'

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const tenantSlug = arg('tenant')
  const kind = arg('kind') as FeedKind | undefined
  const file = arg('file')
  const source = arg('source')
  if (!tenantSlug || !kind || !file || !source || !['catalog', 'reviews', 'returns'].includes(kind)) {
    console.error('Usage: npm run ingest -- --tenant <slug> --kind catalog|reviews|returns --file <csv|json> --source "<who sent it>" [--licence "<terms>"] [--dry-run]')
    process.exit(1)
  }
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) throw new Error(`Unknown tenant ${tenantSlug}`)
  const text = readFileSync(file, 'utf8')
  const rows = file.endsWith('.json') ? (JSON.parse(text) as unknown[]) : parseCsv(text)
  const r = await ingest({ tenantId: tenant.id, kind, rows, source, licence: arg('licence'), dryRun: process.argv.includes('--dry-run') })
  console.log(`${r.dryRun ? 'DRY RUN · ' : ''}${kind}: ${r.rows} rows · accepted ${r.accepted} · rejected ${r.rejected} · created ${r.created} · updated ${r.updated} · unchanged ${r.unchanged} · products changed ${r.productsChanged}`)
  for (const e of r.errors.slice(0, 15)) console.log(`  row ${e.row}${e.field ? ` [${e.field}]` : ''}: ${e.message}`)
  if (r.errors.length > 15) console.log(`  … ${r.errors.length - 15} more in the report (ingest run ${r.runId})`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
