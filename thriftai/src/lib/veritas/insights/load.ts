import 'server-only'
import { prisma } from '@/lib/prisma'
import { visibleProducts } from '../scope'
import { explainScore } from './why'
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
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, slug: true, name: true, tenantId: true, tenant: { select: { settings: true, plan: true } } } })
  if (!brand) return null
  // A brand sees the shared catalog plus its own tenant's imports, never another platform's private data.
  const pool = visibleProducts(brand.tenantId)
  const [rows, peerRows] = await Promise.all([
    prisma.clothingProduct.findMany({
      where: { AND: [{ brandId }, pool] },
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
    prisma.clothingProduct.findMany({ where: pool, select: { slug: true, name: true, category: true, subcategory: true, currentPrice: true, productScore: true } }),
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

/** "Why this score" for one product vs. its category's published peers. Callers must authorize the brand first. */
export async function loadWhy(productId: string) {
  const product = await prisma.clothingProduct.findUnique({
    where: { id: productId },
    select: { id: true, tenantId: true, category: true, productScore: { select: { overall: true, ratedByRunId: true } }, factorScores: { where: { version: 'v2' }, select: { factor: true, value: true, evidenceCount: true } } },
  })
  if (!product) return null
  const peers = await prisma.clothingProduct.findMany({
    where: { AND: [{ category: product.category, id: { not: product.id }, productScore: { isNot: null } }, visibleProducts(product.tenantId)] },
    select: { productScore: { select: { overall: true } }, factorScores: { where: { version: 'v2' }, select: { factor: true, value: true } } },
  })
  // Most common negative signal per factor, from the evidence behind the current score only.
  const run = product.productScore?.ratedByRunId
    ? await prisma.agentRun.findUnique({ where: { id: product.productScore.ratedByRunId }, select: { finishPayload: true } })
    : null
  const runIds = ((run?.finishPayload as { evidenceRunIds?: string[] } | null)?.evidenceRunIds ?? []).filter(Boolean)
  const neg = runIds.length
    ? await prisma.evidenceTag.groupBy({ by: ['factor', 'signal'], where: { productId, runId: { in: runIds }, sentiment: { lt: 0 } }, _count: { _all: true } })
    : []
  const issues: Record<string, { signal: string; count: number }> = {}
  for (const g of neg) if (!issues[g.factor] || issues[g.factor].count < g._count._all) issues[g.factor] = { signal: g.signal, count: g._count._all }

  return explainScore({
    overall: product.productScore?.overall ?? null,
    factors: product.factorScores.map((f) => ({ factor: f.factor, value: Number(f.value), evidenceCount: f.evidenceCount })),
    peers: peers.map((p) => ({ overall: p.productScore!.overall, factors: p.factorScores.map((f) => ({ factor: f.factor, value: Number(f.value) })) })),
    issues,
  })
}
