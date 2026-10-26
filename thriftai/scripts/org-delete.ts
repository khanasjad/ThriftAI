/**
 * Delete an organisation's data on request (backs the pilot promise "deleted on request"). Works in production.
 *   npm run org:delete -- --slug <org>            # shows what would be deleted
 *   npm run org:delete -- --slug <org> --yes      # deletes: imported products (with reviews, returns, prices,
 *                                                 # scores, evidence, photo readings, ad copy), sellers, upload logs,
 *                                                 # API keys, sign-ins, brand links, and the organisation itself
 * Brands stay (shared names) but are unlinked. Agent traces keep only ids, no review text.
 */
import { prisma } from '../src/lib/prisma'

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const slug = arg('slug')
  if (!slug) throw new Error('Usage: npm run org:delete -- --slug <org> [--yes]')
  const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true } })
  if (!t) throw new Error(`No organisation "${slug}"`)
  const where = { tenantId: t.id }
  const counts = {
    products: await prisma.clothingProduct.count({ where }),
    sellers: await prisma.seller.count({ where }),
    uploads: await prisma.ingestRun.count({ where }),
    apiKeys: await prisma.apiKey.count({ where }),
    users: await prisma.user.count({ where }),
    brands: await prisma.brand.count({ where }),
  }
  console.log(`${t.name} (${slug}): ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
  if (!process.argv.includes('--yes')) return console.log('Nothing deleted. Add --yes to delete.')
  await prisma.$transaction([
    prisma.clothingProduct.deleteMany({ where }), // cascades reviews, returns, prices, scores, evidence, visuals, ad copy
    prisma.seller.deleteMany({ where }),
    prisma.ingestRun.deleteMany({ where }),
    prisma.apiKey.deleteMany({ where }),
    prisma.user.deleteMany({ where }),
    prisma.brand.updateMany({ where, data: { tenantId: null } }),
    prisma.tenant.delete({ where: { id: t.id } }),
  ])
  console.log('Deleted.')
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
