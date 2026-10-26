import 'server-only'
import { prisma } from '@/lib/prisma'
import { computeDrivers, type Drivers } from '../scoring/drivers'

/** Three drivers for many products in three queries. Brand averages use the same pool (shared or same tenant). */
export async function driversForProducts(ids: string[]): Promise<Map<string, Drivers>> {
  if (!ids.length) return new Map()
  const products = await prisma.clothingProduct.findMany({
    where: { id: { in: ids } },
    select: { id: true, brandId: true, tenantId: true, isPrivate: true, currentPrice: true, productScore: { select: { fit: true, quality: true, comfort: true, reviewCount: true } } },
  })
  const [factors, brandRows] = await Promise.all([
    prisma.factorScore.findMany({ where: { productId: { in: ids }, version: 'v2', factor: { in: ['style_value.price_fairness', 'style_value.value_for_money'] } }, select: { productId: true, factor: true, value: true } }),
    prisma.clothingProduct.findMany({
      where: { brandId: { in: [...new Set(products.map((p) => p.brandId))] }, productScore: { isNot: null } },
      select: { id: true, brandId: true, tenantId: true, isPrivate: true, productScore: { select: { overall: true } } },
    }),
  ])
  const out = new Map<string, Drivers>()
  for (const p of products) {
    const s = p.productScore
    out.set(
      p.id,
      computeDrivers({
        pillars: { FIT: s?.fit ?? null, QUALITY: s?.quality ?? null, COMFORT: s?.comfort ?? null },
        factors: Object.fromEntries(factors.filter((f) => f.productId === p.id).map((f) => [f.factor, Number(f.value)])),
        reviewCount: s?.reviewCount ?? 0,
        priceKnown: p.currentPrice !== null,
        brandScores: brandRows.filter((b) => b.brandId === p.brandId && b.id !== p.id && (!b.isPrivate || b.tenantId === p.tenantId)).map((b) => b.productScore!.overall),
      }),
    )
  }
  return out
}
