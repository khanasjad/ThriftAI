/**
 * Production readiness check (B8 gate): run against the production database before and after go-live.
 *   APP_ENV=production npm run prod:check
 * Fails (exit 1) on: incomplete production config, any fictional/dev rows, dev accounts, gate tenants,
 * unapplied migrations. Warns on records without a licence. Never prints secret values.
 * Run it on development and it should fail: that's the dummy data it exists to keep out of production.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../src/lib/prisma'
import { env, productionProblems } from '../src/lib/veritas/env'

let failures = 0
let warnings = 0
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const warn = (name: string, detail: string) => {
  console.log(`! ${name} — ${detail}`)
  warnings++
}

async function main() {
  const e = env()
  console.log(`Checking APP_ENV=${e.APP_ENV} (database host: ${new URL(e.DATABASE_URL).hostname})\n`)

  // 1. Configuration
  const problems = productionProblems(e)
  check('production configuration complete', e.APP_ENV === 'production' && problems.length === 0, e.APP_ENV !== 'production' ? 'APP_ENV is not production' : problems.join('; '))
  check('spend cap is monthly', e.SPEND_CAP_WINDOW === 'month', `window=${e.SPEND_CAP_WINDOW}, cap=$${e.SPEND_CAP_USD}`)

  // 2. No fictional or dev data
  const dev = { source: 'dev-fixture' }
  const [products, reviews, returns, prices, brands, sellers, devUsers, gateTenants] = await Promise.all([
    prisma.clothingProduct.count({ where: dev }),
    prisma.clothingReview.count({ where: dev }),
    prisma.returnEvent.count({ where: dev }),
    prisma.priceSnapshot.count({ where: dev }),
    prisma.brand.count({ where: dev }),
    prisma.seller.count({ where: dev }),
    prisma.user.count({ where: { email: { endsWith: '@veritas.test' } } }),
    prisma.tenant.count({ where: { slug: { startsWith: 'gate-' } } }),
  ])
  check('no dev-fixture rows', products + reviews + returns + prices + brands + sellers === 0, `${products} products, ${reviews} reviews, ${returns} returns, ${prices} prices, ${brands} brands, ${sellers} sellers`)
  check('no dev accounts', devUsers === 0, `${devUsers} @veritas.test users`)
  check('no test-gate tenants', gateTenants === 0, `${gateTenants}`)
  const fixture = join(process.cwd(), 'prisma/fixtures/dev-dataset.json')
  if (existsSync(fixture)) {
    const names = (JSON.parse(readFileSync(fixture, 'utf8')) as { brands: { name: string }[] }).brands.map((b) => b.name)
    const fictional = await prisma.brand.count({ where: { name: { in: names } } })
    check('no fictional dev brands (by name)', fictional === 0, `${fictional} found`)
  }
  const visualsFromDev = await prisma.productVisual.count({ where: { imageUrl: { startsWith: '/dev-images/' } } })
  check('no dev images', visualsFromDev === 0, `${visualsFromDev} photo readings point at /dev-images`)

  // 3. Provenance
  const noLicence = await prisma.clothingProduct.count({ where: { licence: null } })
  if (noLicence) warn('products without a licence', `${noLicence} (record the terms each source allows)`)

  // 4. Migrations
  const folders = readdirSync(join(process.cwd(), 'prisma/migrations')).filter((f) => /^\d{14}_/.test(f))
  const applied = await prisma.$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`
  const missing = folders.filter((f) => !applied.some((a) => a.migration_name === f))
  check('all migrations applied', missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : `${folders.length} applied`)

  console.log(failures ? `\n${failures} check(s) failed${warnings ? `, ${warnings} warning(s)` : ''}. Not ready.` : `\nReady${warnings ? ` (${warnings} warning(s))` : ''}.`)
  process.exit(failures ? 1 : 0)
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
