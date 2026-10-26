/**
 * Brand insights (B7, product plan "What a brand sees"). Pure function over loaded data:
 *  - overview and pillars vs. the catalog (published scores only)
 *  - top problems ranked by estimated return cost
 *  - size-chart fixes from reviewers' fit answers per size
 *  - price position vs. peers in the same subcategory
 *  - launch watch for new products
 * Every number links back to products, so the dashboard can show the evidence behind it.
 */
import type { PillarKey } from '../scoring/v2'

export type InsightProduct = {
  id: string
  slug: string
  name: string
  category: string
  subcategory: string | null
  /** Null when the source has no price. */
  price: number | null
  launchDate: Date | null
  trendTag: string | null
  score: { overall: number; label: string; pillars: Partial<Record<PillarKey, number | null>> } | null
  reviews: { rating: number; fitsAs: string | null; sizePurchased: string | null; date: Date }[]
  returns: { reason: string; sizePurchased: string | null; price: number | null }[]
}

export type PeerProduct = { slug: string; name: string; category: string; subcategory: string | null; price: number | null; overall: number | null; pillars: Partial<Record<PillarKey, number | null>> }

/** Share of an item's price a return costs the brand (shipping, handling, resale loss). Stated assumption, editable per tenant. */
export const DEFAULT_RETURN_COST_SHARE = 0.3

const PROBLEM: Record<string, string> = {
  TOO_SMALL: 'Runs small',
  TOO_LARGE: 'Runs large',
  POOR_FIT: 'Poor fit',
  POOR_QUALITY: 'Poor quality',
  DAMAGE_DEFECT: 'Arrives damaged or defective',
  NOT_AS_DESCRIBED: 'Not as described',
  COLOR_MISMATCH: 'Colour not as pictured',
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null)
const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
const round1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10)
const sameGroup = (a: { category: string; subcategory: string | null }, b: { category: string; subcategory: string | null }) =>
  a.category === b.category && (a.subcategory ?? '') === (b.subcategory ?? '')

function fitCounts(rs: InsightProduct['reviews']) {
  const small = rs.filter((r) => r.fitsAs === 'runs_small').length
  const tts = rs.filter((r) => r.fitsAs === 'true_to_size').length
  const large = rs.filter((r) => r.fitsAs === 'runs_large').length
  const n = small + tts + large
  return { small, tts, large, n, direction: n ? (small - large) / n : null }
}

export function buildBrandInsights(products: InsightProduct[], peers: PeerProduct[], opts: { returnCostShare?: number; now?: Date } = {}) {
  const share = opts.returnCostShare ?? DEFAULT_RETURN_COST_SHARE
  const now = opts.now ?? new Date()
  const rated = products.filter((p) => p.score)
  const allReviews = products.flatMap((p) => p.reviews)
  const allReturns = products.flatMap((p) => p.returns)

  // --- Overview ---
  const labelMix = rated.reduce<Record<string, number>>((acc, p) => ((acc[p.score!.label] = (acc[p.score!.label] ?? 0) + 1), acc), {})
  const overview = {
    products: products.length,
    rated: rated.length,
    avgScore: round1(mean(rated.map((p) => p.score!.overall))),
    labelMix,
    reviews: allReviews.length,
    avgRating: round1(mean(allReviews.map((r) => r.rating))),
    returns: allReturns.length,
  }

  // --- Pillars vs. catalog (published only) ---
  const pillars = (['FIT', 'QUALITY', 'STYLE_VALUE', 'COMFORT'] as PillarKey[]).map((k) => ({
    pillar: k,
    brand: round1(mean(rated.map((p) => p.score!.pillars[k]).filter((v): v is number => typeof v === 'number'))),
    catalog: round1(mean(peers.map((p) => p.pillars[k]).filter((v): v is number => typeof v === 'number'))),
  }))

  // --- Problems by estimated return cost ---
  const byReason = new Map<string, { returns: number; cost: number; products: Map<string, { slug: string; name: string; count: number }> }>()
  for (const p of products)
    for (const r of p.returns) {
      if (!PROBLEM[r.reason]) continue
      const e = byReason.get(r.reason) ?? { returns: 0, cost: 0, products: new Map() }
      e.returns++
      e.cost += (r.price ?? p.price ?? 0) * share // no price known: the return still counts, its cost doesn't
      const pe = e.products.get(p.slug) ?? { slug: p.slug, name: p.name, count: 0 }
      pe.count++
      e.products.set(p.slug, pe)
      byReason.set(r.reason, e)
    }
  const preventable = [...byReason.values()].reduce((s, e) => s + e.returns, 0)
  const problems = [...byReason.entries()]
    .map(([reason, e]) => ({
      reason,
      label: PROBLEM[reason],
      returns: e.returns,
      estCost: Math.round(e.cost),
      shareOfReturns: allReturns.length ? e.returns / allReturns.length : 0,
      products: [...e.products.values()].sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.estCost - a.estCost)

  // --- Size-chart fixes (per size, then per product) ---
  const sizeFixes: { slug: string; name: string; size: string | null; small: number; large: number; n: number; suggestion: string; strength: number }[] = []
  for (const p of products) {
    const sizes = new Map<string, InsightProduct['reviews']>()
    for (const r of p.reviews) if (r.sizePurchased && r.fitsAs) sizes.set(r.sizePurchased, [...(sizes.get(r.sizePurchased) ?? []), r])
    for (const [size, rs] of sizes) {
      const c = fitCounts(rs)
      if (c.n < 3 || c.direction === null || Math.abs(c.direction) < 0.5) continue
      const small = c.direction > 0
      sizeFixes.push({
        slug: p.slug,
        name: p.name,
        size,
        small: c.small,
        large: c.large,
        n: c.n,
        suggestion: `Size ${size} runs ${small ? 'small' : 'large'} (${small ? c.small : c.large} of ${c.n}). Review the ${size} measurements or add "size ${small ? 'up' : 'down'}" guidance.`,
        strength: Math.abs(c.direction) * c.n,
      })
    }
    const c = fitCounts(p.reviews)
    if (c.n >= 5 && c.direction !== null && Math.abs(c.direction) >= 0.4 && !sizeFixes.some((f) => f.slug === p.slug)) {
      const small = c.direction > 0
      sizeFixes.push({
        slug: p.slug,
        name: p.name,
        size: null,
        small: c.small,
        large: c.large,
        n: c.n,
        suggestion: `Runs ${small ? 'small' : 'large'} across sizes (${small ? c.small : c.large} of ${c.n} fit answers). Consider re-grading the size chart.`,
        strength: Math.abs(c.direction) * c.n,
      })
    }
  }
  sizeFixes.sort((a, b) => b.strength - a.strength)

  // --- Price position vs. peers in the same subcategory ---
  // Products without a price (open review data) have no price position.
  const pricePosition = products.flatMap((p) => {
    if (p.price === null) return []
    const group = peers.filter((x) => sameGroup(x, p))
    const medPrice = median(group.map((x) => x.price).filter((v): v is number => v !== null))
    const medScore = median(group.map((x) => x.overall).filter((v): v is number => v !== null))
    const score = p.score?.overall ?? null
    const pricier = medPrice !== null && p.price > medPrice
    const better = score !== null && medScore !== null ? score >= medScore : null
    const quadrant = better === null ? 'not_rated' : better ? (pricier ? 'premium' : 'best_value') : pricier ? 'overpriced' : 'budget'
    return [{ slug: p.slug, name: p.name, price: p.price, score, medianPeerPrice: medPrice, medianPeerScore: medScore, quadrant }]
  })

  // --- Score vs. price index (100 = peer median price): this brand's rated products + other brands' as context ---
  const own = new Set(products.map((p) => p.slug))
  const priceIndex = (x: { category: string; subcategory: string | null; price: number | null }) => {
    const m = median(peers.filter((q) => sameGroup(q, x)).map((q) => q.price).filter((v): v is number => v !== null))
    return m && x.price !== null ? (x.price / m) * 100 : null
  }
  const scatter = [
    ...rated.map((p) => ({ name: p.name, brand: true, priceIndex: priceIndex(p), score: p.score!.overall })),
    ...peers.filter((q) => q.overall !== null && !own.has(q.slug)).map((q) => ({ name: q.name, brand: false, priceIndex: priceIndex(q), score: q.overall! })),
  ].filter((x): x is { name: string; brand: boolean; priceIndex: number; score: number } => x.priceIndex !== null)

  // --- Launch watch: launched in the last 60 days, or labelled new launch ---
  const launchWatch = products
    .filter((p) => (p.launchDate && now.getTime() - p.launchDate.getTime() < 60 * 864e5) || p.score?.label === 'NEW_LAUNCH')
    .map((p) => {
      const c = fitCounts(p.reviews)
      const avgRating = mean(p.reviews.map((r) => r.rating))
      const reasons: string[] = []
      if (p.returns.length >= 3 && p.reviews.length && p.returns.length / p.reviews.length >= 0.4) reasons.push(`${p.returns.length} returns already, against ${p.reviews.length} reviews`)
      if (avgRating !== null && avgRating < 3) reasons.push(`Average rating ${avgRating.toFixed(1)} of 5`)
      if (c.direction !== null && c.n >= 3 && Math.abs(c.direction) >= 0.5) reasons.push(`Early fit answers say it runs ${c.direction > 0 ? 'small' : 'large'} (${c.direction > 0 ? c.small : c.large} of ${c.n})`)
      return {
        slug: p.slug,
        name: p.name,
        launchDate: p.launchDate,
        reviews: p.reviews.length,
        returns: p.returns.length,
        avgRating: round1(avgRating),
        status: reasons.length ? ('watch' as const) : ('ok' as const),
        reasons,
      }
    })
    .sort((a, b) => (a.status === b.status ? b.returns - a.returns : a.status === 'watch' ? -1 : 1))

  // --- Catalog table ---
  const catalog = products
    .map((p) => {
      const c = fitCounts(p.reviews)
      return {
        slug: p.slug,
        name: p.name,
        subcategory: p.subcategory,
        price: p.price,
        score: p.score?.overall ?? null,
        label: p.score?.label ?? null,
        reviews: p.reviews.length,
        returns: p.returns.length,
        avgRating: round1(mean(p.reviews.map((r) => r.rating))),
        fit: c.direction === null || c.n < 3 ? null : c.direction >= 0.3 ? 'runs small' : c.direction <= -0.3 ? 'runs large' : 'true to size',
        trendTag: p.trendTag,
      }
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.reviews - a.reviews)

  return {
    returnCostShare: share,
    overview,
    pillars,
    problems,
    preventableReturns: preventable,
    sizeFixes: sizeFixes.slice(0, 12),
    pricePosition,
    scatter,
    launchWatch,
    catalog,
  }
}

export type BrandInsights = ReturnType<typeof buildBrandInsights>
