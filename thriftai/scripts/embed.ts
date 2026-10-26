/**
 * Photo fingerprints for "looks like" search and "looks similar" (B18). $0: the open-source fashion model runs
 * on this machine. New uploads are fingerprinted automatically; this backfills existing products.
 *   npm run embed -- --all            # every product with a photo (unchanged photos are skipped)
 *   npm run embed -- --product <slug>
 */
import { prisma } from '../src/lib/prisma'
import { imageSource } from '../src/lib/veritas/graph/describe-image'
import { embedProduct, visualSearchOn } from '../src/lib/veritas/visual/store'

async function main() {
  if (!visualSearchOn()) throw new Error('VISUAL_SEARCH is off')
  const slug = process.argv[process.argv.indexOf('--product') + 1]
  const where = process.argv.includes('--all') ? {} : process.argv.includes('--product') ? { slug } : null
  if (!where) return console.log('Use --all or --product <slug>.')
  const rows = await prisma.clothingProduct.findMany({ where: { ...where, primaryImageUrl: { not: null } }, select: { id: true, slug: true, primaryImageUrl: true }, orderBy: { slug: 'asc' } })
  const t0 = Date.now()
  const out = { embedded: 0, unchanged: 0, no_image: 0, error: 0 }
  for (const r of rows) {
    const src = await imageSource(r.primaryImageUrl!).catch(() => null)
    if (!src) {
      out.no_image++
      continue
    }
    const res = await embedProduct(r.id, Buffer.from((src.block.source as { data: string }).data, 'base64')).catch((e) => {
      console.error(`✗ ${r.slug}: ${e instanceof Error ? e.message : e}`)
      return 'error' as const
    })
    if (res !== 'off') out[res]++
  }
  console.log(`${rows.length} products: ${out.embedded} fingerprinted, ${out.unchanged} unchanged, ${out.no_image} without a readable photo, ${out.error} errors · ${((Date.now() - t0) / 1000).toFixed(1)} s · $0`)
}
main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
