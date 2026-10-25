import 'server-only'
/**
 * Brand scorecard (product plan: the free pilot offer). Pulls together what we already compute, nothing new is
 * estimated: insights (problems, size fixes, price position), the three drivers, tags, ad eligibility and the
 * per-product "why this score" losses, summed into the brand's top fixes.
 */
import { prisma } from '@/lib/prisma'
import { adEligibility } from '../ads/rules'
import { driversForProducts } from '../read/drivers'
import { tagsForProducts } from '../read/tags'
import { FIXES } from './why'
import { loadBrandInsights, loadWhy } from './load'

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => typeof x === 'number')
  return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null
}

export async function loadScorecard(brandId: string) {
  const base = await loadBrandInsights(brandId)
  if (!base) return null
  const { insights: x } = base
  const products = await prisma.clothingProduct.findMany({
    where: { brandId, slug: { in: x.catalog.map((c) => c.slug) } },
    select: { id: true, slug: true, name: true, source: true, productScore: { select: { overall: true, confidenceLabel: true } }, _count: { select: { reviews: true, returns: true } } },
  })
  const ids = products.map((p) => p.id)
  const [drivers, tags, sellers] = await Promise.all([
    driversForProducts(ids),
    tagsForProducts(ids),
    prisma.priceSnapshot.findMany({ where: { productId: { in: ids } }, distinct: ['sellerId'], select: { sellerId: true } }),
  ])

  // Top fixes: points lost per factor, summed across the brand's rated products.
  const lost = new Map<string, { name: string; points: number; products: Set<string> }>()
  for (const p of products.filter((q) => q.productScore)) {
    const why = await loadWhy(p.id)
    for (const l of why?.losses ?? []) {
      const e = lost.get(l.factor) ?? { name: l.name, points: 0, products: new Set<string>() }
      e.points += -l.points
      e.products.add(p.name)
      lost.set(l.factor, e)
    }
  }
  const fixes = [...lost.entries()]
    .map(([factor, e]) => ({ factor, name: e.name, points: Math.round(e.points * 10) / 10, products: [...e.products], fix: FIXES[factor] ?? null }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)

  const rows = products.map((p) => {
    const t = tags.get(p.id) ?? []
    return {
      slug: p.slug,
      name: p.name,
      score: p.productScore?.overall ?? null,
      label: p.productScore?.confidenceLabel ?? null,
      drivers: drivers.get(p.id) ?? null,
      warnings: t.filter((g) => g.tone === 'warn').map((g) => g.label),
      adEligible: adEligibility({ score: p.productScore?.overall ?? null, label: p.productScore?.confidenceLabel ?? null, tags: t }).eligible,
    }
  })
  const rated = rows.filter((r) => r.score !== null).sort((a, b) => b.score! - a.score!)
  const quadrants = x.pricePosition.reduce<Record<string, number>>((m, p) => ((m[p.quadrant] = (m[p.quadrant] ?? 0) + 1), m), {})

  return {
    brand: base.brand,
    isTestData: products.some((p) => p.source === 'dev-fixture'),
    generatedAt: new Date(),
    inputs: { products: products.length, rated: rated.length, reviews: products.reduce((s, p) => s + p._count.reviews, 0), returns: products.reduce((s, p) => s + p._count.returns, 0), sellers: sellers.length },
    headline: {
      avgScore: avg(rated.map((r) => r.score)),
      quality: avg(rated.map((r) => r.drivers?.quality.value ?? null)),
      price: avg(rated.map((r) => r.drivers?.price.value ?? null)),
      brand: avg(rated.map((r) => r.drivers?.brand.value ?? null)),
      adEligible: rows.filter((r) => r.adEligible).length,
      preventableReturns: x.preventableReturns,
      returnCost: x.problems.reduce((s, p) => s + p.estCost, 0),
      returnCostShare: x.returnCostShare,
    },
    problems: x.problems.slice(0, 3),
    fixes,
    sizeFixes: x.sizeFixes.slice(0, 3),
    best: rated.slice(0, 3),
    worst: rated.length > 3 ? rated.slice(-3).reverse() : [],
    priceWarnings: rows.filter((r) => r.warnings.some((w) => /sale price|Often cheaper/.test(w))).length,
    quadrants,
  }
}
export type Scorecard = NonNullable<Awaited<ReturnType<typeof loadScorecard>>>
