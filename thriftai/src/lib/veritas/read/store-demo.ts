/**
 * Data for the Score API demo store (/demo/store): a fictional marketplace that shows each listing's
 * Veritas Score next to the store's own star rating, the way a platform would through the Score API.
 *
 * Everything shown is read from stored data. The "heads-up" lines are templates filled with counts
 * (like the pick-card reasons), never generated text.
 */
import { prisma } from '@/lib/prisma'
import { PUBLIC_PRODUCTS } from '@/lib/veritas/scope'
import { computePriceFacts, type SellerSeries } from '../price/facts'
import { FACTOR_TAXONOMY } from '../taxonomy/factor-taxonomy'
import { RETURN_BENCHMARK as BENCH } from '../evidence/structured'
import { driversForProducts } from './drivers'
import { tagsForProducts } from './tags'
import type { Tag } from '../enrich/tags'

export const DEMO_STORE = 'Cartwheel Marketplace'

const FIT_REASONS = new Set(['TOO_SMALL', 'TOO_LARGE', 'POOR_FIT'])
const QUALITY_REASONS = new Set(['POOR_QUALITY', 'DAMAGE_DEFECT'])

export type HeadsUp = { tone: 'good' | 'warn'; text: string }

export type StoreListing = {
  id: string
  slug: string
  brandSlug: string
  tags: Tag[]
  name: string
  brand: string
  category: 'TOPS' | 'BOTTOMS'
  subcategory: string | null
  silhouette: string | null
  colors: string[]
  pattern: string | null
  gender: string
  stars: number | null
  reviewCount: number
  price: number
  listPrice: number | null
  sellerCount: number
  score: number | null
  label: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW_LAUNCH' | null
  pillars: { FIT: number | null; QUALITY: number | null; STYLE_VALUE: number | null; COMFORT: number | null; SUSTAINABILITY: number | null }
  factorsIncluded: number
  headsUp: HeadsUp[]
}

type Row = Awaited<ReturnType<typeof loadRows>>[number]

function loadRows(where: { slug?: string; category?: 'TOPS' | 'BOTTOMS' }) {
  return prisma.clothingProduct.findMany({
    where: { isAvailable: true, ...PUBLIC_PRODUCTS, ...where },
    include: {
      brand: { select: { name: true, slug: true } },
      visual: { select: { attributes: true } },
      productScore: true,
      reviews: { select: { rating: true, fitsAs: true } },
      returns: { select: { returnReason: true } },
      priceSnapshots: { include: { seller: { select: { name: true } } }, orderBy: { observedAt: 'asc' } },
    },
  })
}

const pct = (x: number) => `${Math.round(x * 100)}%`

function headsUpFor(r: Row, series: SellerSeries[]): HeadsUp[] {
  const out: HeadsUp[] = []
  const answered = r.reviews.filter((x) => x.fitsAs)
  const small = answered.filter((x) => x.fitsAs === 'runs_small').length
  const large = answered.filter((x) => x.fitsAs === 'runs_large').length
  const tts = answered.filter((x) => x.fitsAs === 'true_to_size').length
  if (answered.length >= 5) {
    if (small / answered.length >= 0.4) out.push({ tone: 'warn', text: `Runs small: ${small} of ${answered.length} owners say so` })
    else if (large / answered.length >= 0.4) out.push({ tone: 'warn', text: `Runs large: ${large} of ${answered.length} owners say so` })
    else if (tts / answered.length >= 0.6) out.push({ tone: 'good', text: `True to size for ${tts} of ${answered.length} owners` })
  }

  const facts = computePriceFacts(series)
  if (facts.fakeDiscount) out.push({ tone: 'warn', text: `The “was” price of $${Math.round(facts.fakeDiscount.listPrice)} was never charged in 90 days` })
  else if (facts.oftenCheaper) out.push({ tone: 'warn', text: `Was $${Math.round(facts.oftenCheaper.lowest)} in the last 90 days; often goes on sale` })

  const bench = BENCH[r.category === 'BOTTOMS' ? 'BOTTOMS' : 'TOPS']
  if (r.unitsSold && r.unitsSold >= 50) {
    const fit = r.returns.filter((x) => FIT_REASONS.has(x.returnReason)).length / r.unitsSold
    const quality = r.returns.filter((x) => QUALITY_REASONS.has(x.returnReason)).length / r.unitsSold
    if (fit >= bench.fit * 1.5) out.push({ tone: 'warn', text: `${pct(fit)} of orders sent back for fit (typical ${pct(bench.fit)})` })
    else if (fit <= bench.fit * 0.6) out.push({ tone: 'good', text: `Only ${pct(fit)} sent back for fit (typical ${pct(bench.fit)})` })
    if (quality >= bench.quality * 1.4) out.push({ tone: 'warn', text: `${pct(quality)} returned for quality or defects (typical ${pct(bench.quality)})` })
  }
  // Warnings first: they are what a star rating hides.
  return out.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'warn' ? -1 : 1)).slice(0, 3)
}

function toListing(r: Row): StoreListing {
  const bySeller = new Map<string, SellerSeries>()
  for (const s of r.priceSnapshots) {
    const name = s.seller?.name ?? `${r.brand.name} store`
    if (!bySeller.has(name)) bySeller.set(name, { seller: name, points: [] })
    bySeller.get(name)!.points.push({ date: s.observedAt.toISOString().slice(0, 10), price: Number(s.price), listPrice: s.listPrice == null ? null : Number(s.listPrice), isPromo: s.isPromo })
  }
  const series = [...bySeller.values()]
  const offers = series.map((s) => s.points.at(-1)!).sort((a, b) => a.price - b.price)
  const best = offers[0]
  const ps = r.productScore
  const published = ps && ps.overall !== null ? ps : null
  return {
    id: r.id,
    slug: r.slug,
    brandSlug: r.brand.slug,
    tags: [],
    name: r.name,
    brand: r.brand.name,
    category: r.category === 'BOTTOMS' ? 'BOTTOMS' : 'TOPS',
    subcategory: r.subcategory,
    silhouette: r.silhouette,
    colors: r.colors,
    pattern: ((r.visual?.attributes as { pattern?: string } | undefined)?.pattern ?? null),
    gender: r.gender,
    stars: r.reviews.length ? r.reviews.reduce((s, x) => s + x.rating, 0) / r.reviews.length : null,
    reviewCount: r.reviews.length,
    price: best?.price ?? Number(r.currentPrice),
    listPrice: best?.isPromo && best.listPrice ? best.listPrice : null,
    sellerCount: offers.length,
    score: published?.overall ?? null,
    label: published?.confidenceLabel ?? null,
    pillars: {
      FIT: published?.fit ?? null,
      QUALITY: published?.quality ?? null,
      STYLE_VALUE: published?.styleValue ?? null,
      COMFORT: published?.comfort ?? null,
      SUSTAINABILITY: published?.sustainability ?? null,
    },
    factorsIncluded: published?.factorsIncluded.length ?? 0,
    headsUp: headsUpFor(r, series),
  }
}

export type StoreSort = 'featured' | 'veritas' | 'price'

/** Rough query reading for the demo search box: category and colour words only. */
export function readStoreQuery(q: string) {
  const t = q.toLowerCase()
  const category: 'TOPS' | 'BOTTOMS' | undefined = /jean|denim|trouser|pant/.test(t) ? 'BOTTOMS' : /tee|t-shirt|tshirt|shirt|top/.test(t) ? 'TOPS' : undefined
  const gender = /\b(women|womens|women's|ladies|her)\b/.test(t) ? 'WOMENS' : /\b(men|mens|men's|him|guy)\b/.test(t) ? 'MENS' : undefined
  return { category, gender, words: t.split(/[^a-z]+/).filter((w) => w.length > 2) }
}

export async function storeSearch(q: string, sort: StoreSort) {
  const { category, gender, words } = readStoreQuery(q)
  const rows = await loadRows(category ? { category } : {})
  const tagMap = await tagsForProducts(rows.map((r) => r.id))
  let items = rows.map((r) => ({ ...toListing(r), tags: tagMap.get(r.id) ?? [] })).filter((x) => !gender || x.gender === gender || x.gender === 'UNISEX')
  const wanted = (c: string) => c.toLowerCase().split(' ').every((w) => words.includes(w))
  const colourHit = items.filter((x) => x.colors.some(wanted))
  // Show the colourway the shopper asked for first, so the picture matches the search.
  if (colourHit.length >= 3) items = colourHit.map((x) => ({ ...x, colors: [...x.colors.filter(wanted), ...x.colors.filter((c) => !wanted(c))] }))
  // "Featured" imitates a typical store default: star rating, then number of reviews.
  const featured = (a: StoreListing, b: StoreListing) => (b.stars ?? 0) - (a.stars ?? 0) || b.reviewCount - a.reviewCount
  items.sort(
    sort === 'veritas'
      ? (a, b) => (b.score ?? -1) - (a.score ?? -1) || featured(a, b)
      : sort === 'price'
        ? (a, b) => a.price - b.price
        : featured,
  )
  return { items, category, gender }
}

export async function storeProduct(slug: string) {
  const [row] = await loadRows({ slug })
  if (!row) return null
  const listing = toListing(row)
  const factorRows = await prisma.factorScore.findMany({ where: { productId: row.id, version: 'v2' }, select: { factor: true, value: true, evidenceCount: true } })
  const byKey = new Map(factorRows.map((f) => [f.factor, f]))
  const factors = FACTOR_TAXONOMY.map((f) => {
    const v = byKey.get(f.key)
    return { key: f.key, name: f.name, pillar: f.pillar as string, weight: f.weight, value: v ? Number(v.value) : null, evidenceCount: v?.evidenceCount ?? 0 }
  })
  const ps = row.productScore
  const reviews = await prisma.clothingReview.findMany({
    where: { productId: row.id, injectionFlag: false },
    orderBy: [{ helpfulVotes: 'desc' }, { id: 'asc' }],
    take: 3,
    select: { id: true, title: true, content: true, rating: true, isVerifiedPurchase: true },
  })
  const drivers = ps ? (await driversForProducts([row.id])).get(row.id) ?? null : null
  return {
    listing,
    drivers,
    sizes: row.sizes,
    materials: (row.materials ?? {}) as Record<string, number>,
    care: row.careInstructions,
    text: ps?.verified ? { summary: ps.summary, sizeAdvice: ps.sizeAdvice, downside: ps.downside } : null,
    factors,
    reviews,
  }
}
