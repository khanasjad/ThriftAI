import 'server-only'
import { prisma } from '@/lib/prisma'
import { DEFAULT_RETURN_COST_SHARE, buildBrandInsights, type InsightProduct, type PeerProduct } from './brand'

const pillarsOf = (s: { fit: number | null; quality: number | null; styleValue: number | null; comfort: number | null; sustainability: number | null }) => ({
  FIT: s.fit,
  QUALITY: s.quality,
  STYLE_VALUE: s.styleValue,
  COMFORT: s.comfort,
  SUSTAINABILITY: s.sustainability,
})

/** Loads everything insights need for one brand plus catalog peers. Callers must authorize the brand first. */
export async function loadBrandInsights(brandId: string) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, slug: true, name: true, tenant: { select: { settings: true, plan: true } } } })
  if (!brand) return null
  const [rows, peerRows] = await Promise.all([
    prisma.clothingProduct.findMany({
      where: { brandId },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        subcategory: true,
        currentPrice: true,
        launchDate: true,
        trendTag: true,
        productScore: true,
        reviews: { select: { rating: true, fitsAs: true, sizePurchased: true, reviewDate: true } },
        returns: { select: { returnReason: true, sizePurchased: true, purchasePrice: true } },
      },
    }),
    prisma.clothingProduct.findMany({ select: { slug: true, name: true, category: true, subcategory: true, currentPrice: true, productScore: true } }),
  ])
  const products: InsightProduct[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    price: Number(r.currentPrice),
    launchDate: r.launchDate,
    trendTag: r.trendTag,
    score: r.productScore ? { overall: r.productScore.overall, label: r.productScore.confidenceLabel, pillars: pillarsOf(r.productScore) } : null,
    reviews: r.reviews.map((x) => ({ rating: x.rating, fitsAs: x.fitsAs, sizePurchased: x.sizePurchased, date: x.reviewDate })),
    returns: r.returns.map((x) => ({ reason: x.returnReason, sizePurchased: x.sizePurchased, price: x.purchasePrice == null ? null : Number(x.purchasePrice) })),
  }))
  const peers: PeerProduct[] = peerRows.map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    price: Number(r.currentPrice),
    overall: r.productScore?.overall ?? null,
    pillars: r.productScore ? pillarsOf(r.productScore) : {},
  }))
  const settings = (brand.tenant?.settings ?? {}) as { returnCostShare?: number }
  const share = typeof settings.returnCostShare === 'number' && settings.returnCostShare > 0 && settings.returnCostShare <= 1 ? settings.returnCostShare : DEFAULT_RETURN_COST_SHARE
  return { brand: { id: brand.id, slug: brand.slug, name: brand.name, plan: brand.tenant?.plan ?? null }, insights: buildBrandInsights(products, peers, { returnCostShare: share }) }
}
