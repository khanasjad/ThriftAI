/**
 * Read product photos into style attributes (B12):
 *   npm run vision -- --product <slug> [--yes]      |   npm run vision -- --all [--limit N] [--yes] [--force]
 * Prints an estimate first; unchanged images cost $0. With --check, compares dev images with their known pattern.
 */
import { readFileSync } from 'node:fs'
import { prisma } from '../src/lib/prisma'
import { describeProduct } from '../src/lib/veritas/graph/describe-image'

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const EST = 0.0004

async function main() {
  const one = arg('product')
  const limit = Number(arg('limit') ?? 10_000)
  const slugs = one ? [one] : process.argv.includes('--all') ? (await prisma.clothingProduct.findMany({ where: { primaryImageUrl: { not: null } }, select: { slug: true }, orderBy: { slug: 'asc' } })).map((p) => p.slug).slice(0, limit) : []
  if (!slugs.length) {
    console.error('Usage: npm run vision -- --product <slug> | --all [--limit N] [--yes] [--force] [--check]')
    process.exit(1)
  }
  console.log(`${slugs.length} image(s) · estimate ≤ $${(slugs.length * EST).toFixed(4)} (unchanged ones cost $0)`)
  if (!process.argv.includes('--yes')) return console.log('Add --yes to run.')
  let cost = 0
  for (const s of slugs) {
    const r = await describeProduct(s, { force: process.argv.includes('--force') })
    cost += r.costUsd
    const a = r.attributes
    console.log(`${r.status.padEnd(11)} ${s.padEnd(46)} ${a ? `${a.pattern.padEnd(9)} ${a.colors.map((c) => c.name).join('/').padEnd(22)} ${a.shape} · ${a.style_tags.join(', ')}` : r.error ?? ''}`)
  }
  console.log(`\nModel cost $${cost.toFixed(4)}`)

  if (process.argv.includes('--check')) {
    // Dev images only: the fixture holds each product's known pattern and catalog colours.
    const fixture = JSON.parse(readFileSync('prisma/fixtures/dev-dataset.json', 'utf8')) as { products: { slug: string; colors: string[]; _truth: { pattern: string; print?: string | null } }[] }
    const rows = await prisma.productVisual.findMany({ where: { product: { slug: { in: fixture.products.map((p) => p.slug) } } }, select: { attributes: true, product: { select: { slug: true } } } })
    const FAMILY: Record<string, string> = { black: 'black', white: 'white', ecru: 'beige', oatmeal: 'beige', 'heather grey': 'grey', navy: 'blue', sage: 'green', 'washed red': 'red', 'light vintage': 'blue', 'mid wash': 'blue', 'indigo rinse': 'blue', 'light blue': 'blue' }
    let pat = 0
    let col = 0
    let prints = 0
    let printOk = 0
    const PRINT_WORDS: Record<string, RegExp> = { car: /\bcar|vehicle/, 'palm-tree': /palm/, guitar: /guitar/, 'football-crest': /crest|shield|badge|\bfc\b/, 'sun-mountains': /mountain|sun/ }
    const misses: string[] = []
    for (const r of rows) {
      const f = fixture.products.find((p) => p.slug === r.product.slug)!
      const a = r.attributes as { pattern: string; colors: { family: string }[]; motifs?: { label: string }[]; print_text?: string }
      if (f._truth.print) {
        prints++
        const seen = [...(a.motifs ?? []).map((m) => m.label), a.print_text ?? ''].join(' ').toLowerCase()
        if (PRINT_WORDS[f._truth.print]?.test(seen)) printOk++
        else misses.push(`${r.product.slug}: print truth ${f._truth.print}, read ${seen || 'nothing'}`)
      }
      const okP = a.pattern === f._truth.pattern
      const okC = a.colors[0]?.family === FAMILY[f.colors[0].toLowerCase()]
      pat += okP ? 1 : 0
      col += okC ? 1 : 0
      if (!okP || !okC) misses.push(`${r.product.slug}: pattern ${a.pattern} (truth ${f._truth.pattern}), colour ${a.colors[0]?.family} (truth ${FAMILY[f.colors[0].toLowerCase()]})`)
    }
    console.log(`\nAgreement on ${rows.length} dev images: pattern ${Math.round((100 * pat) / rows.length)}% · main colour family ${Math.round((100 * col) / rows.length)}% · prints ${prints ? `${Math.round((100 * printOk) / prints)}% (${printOk}/${prints})` : 'n/a'}`)
    for (const m of misses) console.log(`  ✗ ${m}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
