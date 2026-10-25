/**
 * Generate verified ad copy (B11):
 *   npm run ads -- --product <slug> [--yes]
 *   npm run ads -- --eligible [--limit N] [--yes]     # only products that may be advertised
 * Prints an estimate first; without --yes it stops there. Unchanged products are skipped at $0.
 */
import { prisma } from '../src/lib/prisma'
import { generateAdCopy } from '../src/lib/veritas/ads/copy'
import { loadAdRows } from '../src/lib/veritas/ads/feeds'
import { PUBLIC_PRODUCTS } from '../src/lib/veritas/scope'

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const EST_PER_PRODUCT = 0.002

async function main() {
  const one = arg('product')
  const limit = Number(arg('limit') ?? 1000)
  const slugs = one ? [one] : process.argv.includes('--eligible') ? (await loadAdRows(PUBLIC_PRODUCTS, { eligibleOnly: true })).map((r) => r.slug).slice(0, limit) : []
  if (!slugs.length) {
    console.error('Usage: npm run ads -- --product <slug> | --eligible [--limit N] [--yes]')
    process.exit(1)
  }
  console.log(`${slugs.length} product(s) · estimate ≤ $${(slugs.length * EST_PER_PRODUCT).toFixed(3)} (unchanged ones cost $0)`)
  if (!process.argv.includes('--yes')) return console.log('Add --yes to run.')
  let total = 0
  for (const s of slugs) {
    const r = await generateAdCopy(s)
    total += r.costUsd
    console.log(`${r.status.padEnd(13)} ${s.padEnd(46)} $${r.costUsd.toFixed(4)}${r.headline ? `\n              “${r.headline}” — ${r.body}` : ''}${r.reason ? `  (${r.reason})` : ''}`)
  }
  console.log(`\nTotal model cost $${total.toFixed(4)}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
