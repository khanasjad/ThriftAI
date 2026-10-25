/** @jest-environment node */
import { buildBrandInsights, type InsightProduct, type PeerProduct } from '../insights/brand'

const day = 864e5
const now = new Date('2026-10-25')
const rev = (fitsAs: string | null, size: string | null = 'M', rating = 4) => ({ rating, fitsAs, sizePurchased: size, date: now })
const ret = (reason: string, price: number | null = null) => ({ reason, sizePurchased: 'M', price })

function product(over: Partial<InsightProduct> = {}): InsightProduct {
  return { id: 'p', slug: 'p', name: 'P', category: 'TOPS', subcategory: 'tee', price: 40, launchDate: new Date('2025-01-01'), trendTag: null, score: null, reviews: [], returns: [], ...over }
}

describe('brand insights', () => {
  it('ranks problems by estimated return cost (price × cost share) and ignores non-preventable reasons', () => {
    const a = product({ slug: 'a', name: 'A', price: 100, returns: [ret('TOO_SMALL'), ret('TOO_SMALL'), ret('CHANGED_MIND')] })
    const b = product({ slug: 'b', name: 'B', price: 20, returns: [ret('POOR_QUALITY'), ret('POOR_QUALITY'), ret('POOR_QUALITY'), ret('TOO_SMALL', 30)] })
    const x = buildBrandInsights([a, b], [], { now })
    expect(x.problems.map((p) => [p.label, p.returns, p.estCost])).toEqual([
      ['Runs small', 3, 69], // (100 + 100 + 30) × 0.3
      ['Poor quality', 3, 18], // 3 × 20 × 0.3
    ])
    expect(x.problems[0].products.map((p) => [p.slug, p.count])).toEqual([
      ['a', 2],
      ['b', 1],
    ])
    expect(x.preventableReturns).toBe(6)
    expect(x.overview.returns).toBe(7)
  })

  it('uses the tenant’s return cost share when given', () => {
    const x = buildBrandInsights([product({ price: 100, returns: [ret('TOO_LARGE')] })], [], { now, returnCostShare: 0.5 })
    expect(x.problems[0].estCost).toBe(50)
  })

  it('suggests size-chart fixes per size, falling back to a product-wide note', () => {
    const perSize = product({ slug: 'a', name: 'A', reviews: [rev('runs_small', 'M'), rev('runs_small', 'M'), rev('runs_small', 'M'), rev('true_to_size', 'L')] })
    const overall = product({
      slug: 'b',
      name: 'B',
      reviews: [rev('runs_large', 'S'), rev('runs_large', 'M'), rev('runs_large', 'L'), rev('true_to_size', 'XL'), rev('runs_large', 'XS')],
    })
    const x = buildBrandInsights([perSize, overall], [], { now })
    expect(x.sizeFixes.map((f) => [f.slug, f.size])).toEqual([
      ['b', null],
      ['a', 'M'],
    ])
    expect(x.sizeFixes.find((f) => f.slug === 'a')!.suggestion).toMatch(/Size M runs small \(3 of 3\)/)
  })

  it('places products against peer medians, with not_rated when there is no score', () => {
    const peers: PeerProduct[] = [30, 40, 50].map((price, i) => ({ slug: `q${i}`, name: 'Q', category: 'TOPS', subcategory: 'tee', price, overall: 60, pillars: {} }))
    const rated = product({ slug: 'r', price: 30, score: { overall: 75, label: 'MEDIUM', pillars: {} } })
    const x = buildBrandInsights([rated, product({ slug: 'u', price: 55 })], peers, { now })
    expect(x.pricePosition.map((p) => [p.slug, p.quadrant])).toEqual([
      ['r', 'best_value'],
      ['u', 'not_rated'],
    ])
    expect(x.scatter.filter((s) => s.brand)).toHaveLength(1)
    expect(x.scatter.filter((s) => !s.brand)).toHaveLength(3)
  })

  it('flags launches with early warning signs', () => {
    const bad = product({
      slug: 'new',
      name: 'New',
      launchDate: new Date(now.getTime() - 20 * day),
      reviews: [rev('runs_small', 'M', 2), rev('runs_small', 'M', 2), rev('runs_small', 'M', 3)],
      returns: [ret('TOO_SMALL'), ret('TOO_SMALL'), ret('TOO_SMALL')],
    })
    const fine = product({ slug: 'ok', launchDate: new Date(now.getTime() - 10 * day), reviews: [rev('true_to_size')] })
    const old = product({ slug: 'old' })
    const x = buildBrandInsights([bad, fine, old], [], { now })
    expect(x.launchWatch.map((l) => [l.slug, l.status])).toEqual([
      ['new', 'watch'],
      ['ok', 'ok'],
    ])
    expect(x.launchWatch[0].reasons).toEqual(['3 returns already, against 3 reviews', 'Average rating 2.3 of 5', 'Early fit answers say it runs small (3 of 3)'])
  })
})
