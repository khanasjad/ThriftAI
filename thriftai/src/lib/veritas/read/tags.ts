/** Loads enrichment tags for many products in a handful of queries (cards, collections, API). */
import { prisma } from '@/lib/prisma'
import { computePriceFacts, type SellerSeries } from '../price/facts'
import { buildTags, type Tag } from '../enrich/tags'

const FIT_REASONS = ['TOO_SMALL', 'TOO_LARGE', 'POOR_FIT']
const QUALITY_REASONS = ['POOR_QUALITY', 'DAMAGE_DEFECT']

export async function tagsForProducts(ids: string[]): Promise<Map<string, Tag[]>> {
  if (ids.length === 0) return new Map()
  const [products, factors, fits, returns, prices] = await Promise.all([
    prisma.clothingProduct.findMany({ where: { id: { in: ids } }, select: { id: true, category: true, unitsSold: true } }),
    prisma.factorScore.findMany({ where: { productId: { in: ids }, version: 'v2' }, select: { productId: true, factor: true, value: true, evidenceCount: true } }),
    prisma.clothingReview.groupBy({ by: ['productId', 'fitsAs'], where: { productId: { in: ids }, fitsAs: { not: null } }, _count: { _all: true } }),
    prisma.returnEvent.groupBy({ by: ['productId', 'returnReason'], where: { productId: { in: ids } }, _count: { _all: true } }),
    prisma.priceSnapshot.findMany({
      where: { productId: { in: ids } },
      select: { productId: true, price: true, listPrice: true, isPromo: true, observedAt: true, sellerId: true },
      orderBy: { observedAt: 'asc' },
    }),
  ])

  const out = new Map<string, Tag[]>()
  for (const p of products) {
    const fit = { small: 0, large: 0, tts: 0, total: 0 }
    for (const f of fits.filter((x) => x.productId === p.id)) {
      fit.total += f._count._all
      if (f.fitsAs === 'runs_small') fit.small += f._count._all
      if (f.fitsAs === 'runs_large') fit.large += f._count._all
      if (f.fitsAs === 'true_to_size') fit.tts += f._count._all
    }
    const rs = returns.filter((x) => x.productId === p.id)
    const count = (reasons: string[]) => rs.filter((x) => reasons.includes(x.returnReason)).reduce((s, x) => s + x._count._all, 0)

    const bySeller = new Map<string, SellerSeries>()
    for (const s of prices.filter((x) => x.productId === p.id)) {
      const k = s.sellerId ?? 'brand'
      if (!bySeller.has(k)) bySeller.set(k, { seller: k, points: [] })
      bySeller.get(k)!.points.push({ date: s.observedAt.toISOString().slice(0, 10), price: Number(s.price), listPrice: s.listPrice == null ? null : Number(s.listPrice), isPromo: s.isPromo })
    }
    const facts = computePriceFacts([...bySeller.values()])

    out.set(
      p.id,
      buildTags({
        category: p.category,
        factors: factors.filter((f) => f.productId === p.id).map((f) => ({ factor: f.factor, value: Number(f.value), evidenceCount: f.evidenceCount })),
        fit,
        returns: { fit: count(FIT_REASONS), quality: count(QUALITY_REASONS), units: p.unitsSold },
        price: { fakeDiscount: !!facts.fakeDiscount, oftenCheaper: !!facts.oftenCheaper },
      }),
    )
  }
  return out
}
