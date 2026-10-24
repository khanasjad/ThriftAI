/**
 * Loads prisma/fixtures/dev-dataset.json into the development database.
 *
 *   npm run seed            # wipe fixture data and reload
 *
 * Guards (in order):
 *   1. Refuses when APP_ENV=production.
 *   2. Refuses when DATABASE_URL is not a local database.
 *   3. Refuses when the catalog contains any row that didn't come from the fixture (real data).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient, Prisma } from '@prisma/client'

const FIXTURE_SOURCE = 'dev-fixture'

function fail(msg: string): never {
  console.error(`✖ seed refused: ${msg}`)
  process.exit(1)
}

async function main() {
  if (process.env.APP_ENV === 'production') fail('APP_ENV=production. Dummy data never goes to production.')
  const url = process.env.DATABASE_URL ?? ''
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) fail('DATABASE_URL is not a local database.')

  const prisma = new PrismaClient()
  try {
    const foreign = await prisma.clothingProduct.count({ where: { source: { not: FIXTURE_SOURCE } } })
    const foreignBrands = await prisma.brand.count({ where: { source: { not: FIXTURE_SOURCE } } })
    if (foreign + foreignBrands > 0) fail(`found ${foreign} products / ${foreignBrands} brands not from the fixture.`)

    const d = JSON.parse(readFileSync(join(process.cwd(), 'prisma/fixtures/dev-dataset.json'), 'utf8'))
    console.log(`Seeding ${d.meta.counts.products} products, ${d.meta.counts.reviews} reviews…`)

    // Wipe derived + fixture data (children first). Agent traces are kept unless they point at products.
    await prisma.$transaction([
      prisma.feedback.deleteMany(),
      prisma.searchTurn.deleteMany(),
      prisma.searchSession.deleteMany(),
      prisma.shopperProfile.deleteMany({ where: { sessionId: { startsWith: 'persona:' } } }),
      prisma.evidenceTag.deleteMany(),
      prisma.agentFinding.deleteMany(),
      prisma.factorScore.deleteMany(),
      prisma.productScore.deleteMany(),
      prisma.priceSnapshot.deleteMany(),
      prisma.returnEvent.deleteMany(),
      prisma.clothingReview.deleteMany(),
      prisma.trendSignal.deleteMany(),
      prisma.clothingProduct.deleteMany(),
      prisma.seller.deleteMany(),
      prisma.brand.deleteMany(),
    ])

    const strip = <T extends Record<string, unknown>>(o: T) =>
      Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_'))) as T

    await prisma.brand.createMany({ data: d.brands.map(strip) })
    await prisma.seller.createMany({ data: d.sellers.map(strip) })
    const brandId = Object.fromEntries((await prisma.brand.findMany()).map((b) => [b.slug, b.id]))
    const sellerId = Object.fromEntries((await prisma.seller.findMany()).map((s) => [s.slug, s.id]))

    await prisma.clothingProduct.createMany({
      data: d.products.map((p: Record<string, unknown>) => {
        const { brandSlug, ...rest } = strip(p)
        return { ...rest, brandId: brandId[brandSlug as string] } as Prisma.ClothingProductCreateManyInput
      }),
    })
    const productId = Object.fromEntries((await prisma.clothingProduct.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]))

    const withProduct = (rows: Record<string, unknown>[]) =>
      rows.map((r) => {
        const { productSlug, ...rest } = strip(r)
        return { ...rest, productId: productId[productSlug as string] }
      })

    await prisma.clothingReview.createMany({ data: withProduct(d.reviews) as Prisma.ClothingReviewCreateManyInput[] })
    await prisma.returnEvent.createMany({ data: withProduct(d.returns) as Prisma.ReturnEventCreateManyInput[] })
    await prisma.priceSnapshot.createMany({
      data: withProduct(d.prices).map((r) => {
        const { sellerSlug, ...rest } = r as Record<string, unknown>
        return { ...rest, sellerId: sellerId[sellerSlug as string] } as Prisma.PriceSnapshotCreateManyInput
      }),
    })
    await prisma.trendSignal.createMany({ data: d.trends })
    await prisma.shopperProfile.createMany({
      data: d.personas.map(({ key, ...p }: Record<string, unknown>) => ({
        ...p,
        priorities: p.priorities ?? Prisma.JsonNull,
        sessionId: `persona:${key}`,
      })) as Prisma.ShopperProfileCreateManyInput[],
    })

    const counts = {
      brands: await prisma.brand.count(),
      sellers: await prisma.seller.count(),
      products: await prisma.clothingProduct.count(),
      reviews: await prisma.clothingReview.count(),
      returns: await prisma.returnEvent.count(),
      prices: await prisma.priceSnapshot.count(),
      trends: await prisma.trendSignal.count(),
      personas: await prisma.shopperProfile.count({ where: { sessionId: { startsWith: 'persona:' } } }),
    }
    console.table(counts)
    const expected = d.meta.counts
    const mismatch = Object.entries(counts).filter(([k, v]) => expected[k] !== v)
    if (mismatch.length) fail(`count mismatch: ${JSON.stringify(mismatch)}`)
    console.log('✓ Dev data loaded. Products are unrated until the rating agents run (B3+).')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
