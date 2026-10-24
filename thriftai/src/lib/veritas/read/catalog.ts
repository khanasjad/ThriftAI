import 'server-only'
import { Prisma, type ClothingCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { scanInjection } from '../harness/guardrails'

/**
 * Read-only queries for shopper pages. Everything here is either a stored score
 * (written by the rate-product graph) or a plain fact counted from the data.
 * Nothing here estimates a score.
 */

const num = (d: Prisma.Decimal | null | undefined) => (d == null ? null : Number(d))

export type CatalogItem = {
  slug: string
  name: string
  brand: string
  category: ClothingCategory
  subcategory: string | null
  price: number
  currency: string
  reviewCount: number
  score: number | null
  confidenceLabel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW_LAUNCH' | null
  isNewLaunch: boolean
}

export type CatalogQuery = {
  q?: string
  category?: ClothingCategory
  sort?: 'score' | 'price_asc' | 'price_desc' | 'reviews' | 'newest'
  limit?: number
}

const NEW_LAUNCH_DAYS = 30 // backend plan §6: launched < 30 days ago

const STOPWORDS = new Set(
  'a an and the for with that dont don’t doesnt won’t wont will not under over below less than me my i want need looking something some to of in on is it its are be by from or very really good nice best great one ones which who what out up get go goes'.split(' '),
)
const CATEGORY_WORDS: Record<string, ClothingCategory> = {
  tee: 'TOPS', tees: 'TOPS', 't-shirt': 'TOPS', tshirt: 'TOPS', shirt: 'TOPS', top: 'TOPS', tops: 'TOPS',
  jeans: 'BOTTOMS', jean: 'BOTTOMS', denim: 'BOTTOMS', pants: 'BOTTOMS', trousers: 'BOTTOMS',
}

export type Interpretation = { category?: ClothingCategory; maxPrice?: number; terms: string[]; matchedAny: boolean }

/** Turns a free-text query into a category, a price ceiling and search terms. Shown to the user as-is. */
export function interpretQuery(q: string): Omit<Interpretation, 'matchedAny'> {
  let text = q.toLowerCase()
  let maxPrice: number | undefined
  const price = text.match(/(?:under|below|less than|max|<)\s*\$?\s*(\d{1,4})/)
  if (price) {
    maxPrice = Number(price[1])
    text = text.replace(price[0], ' ')
  }
  let category: ClothingCategory | undefined
  const terms: string[] = []
  for (const raw of text.split(/[\s,]+/)) {
    const w = raw.replace(/[^\p{L}\p{N}-]/gu, '')
    if (w.length < 2 || STOPWORDS.has(w)) continue
    if (CATEGORY_WORDS[w]) {
      category ??= CATEGORY_WORDS[w]
      continue
    }
    terms.push(w.replace(/-/g, ' '))
  }
  return { category, maxPrice, terms: [...new Set(terms)].slice(0, 6) }
}

/**
 * Interim keyword search (replaced by the answer-search graph in B5).
 * Ranks by how many query terms appear in the product's own fields (×3) or in its reviews (×1).
 */
export async function searchCatalog({ q, category, sort = 'score', limit = 48 }: CatalogQuery = {}): Promise<{ items: CatalogItem[]; interpreted: Interpretation }> {
  const parsed = interpretQuery(q ?? '')
  const cat = category ?? parsed.category

  const rows = await prisma.clothingProduct.findMany({
    where: { isAvailable: true, ...(cat && { category: cat }), ...(parsed.maxPrice && { currentPrice: { lte: parsed.maxPrice } }) },
    select: {
      slug: true,
      name: true,
      category: true,
      subcategory: true,
      description: true,
      fitType: true,
      silhouette: true,
      colors: true,
      materials: true,
      currentPrice: true,
      currency: true,
      launchDate: true,
      brand: { select: { name: true } },
      productScore: { select: { overall: true, confidenceLabel: true } },
      reviews: parsed.terms.length ? { select: { content: true } } : false,
      _count: { select: { reviews: true } },
    },
  })

  const cutoff = Date.now() - NEW_LAUNCH_DAYS * 864e5
  let scored = rows.map((r) => {
    const own = [r.name, r.subcategory, r.description, r.fitType, r.silhouette, r.brand.name, ...r.colors, ...Object.keys((r.materials ?? {}) as object)]
      .join(' ')
      .toLowerCase()
    const reviewText = (r.reviews || []).map((x) => x.content.toLowerCase())
    let relevance = 0
    for (const t of parsed.terms) {
      if (own.includes(t)) relevance += 3
      else if (reviewText.some((x) => x.includes(t))) relevance += 1
    }
    const item: CatalogItem = {
      slug: r.slug,
      name: r.name,
      brand: r.brand.name,
      category: r.category,
      subcategory: r.subcategory,
      price: Number(r.currentPrice),
      currency: r.currency,
      reviewCount: r._count.reviews,
      score: r.productScore?.overall ?? null,
      confidenceLabel: r.productScore?.confidenceLabel ?? null,
      isNewLaunch: !!r.launchDate && r.launchDate.getTime() > cutoff,
    }
    return { item, relevance, launch: r.launchDate?.getTime() ?? 0 }
  })

  const matchedAny = parsed.terms.length === 0 || scored.some((x) => x.relevance > 0)
  if (parsed.terms.length && matchedAny) scored = scored.filter((x) => x.relevance > 0)

  const cmp: Record<NonNullable<CatalogQuery['sort']>, (a: (typeof scored)[number], b: (typeof scored)[number]) => number> = {
    score: (a, b) => (b.item.score ?? -1) - (a.item.score ?? -1) || b.item.reviewCount - a.item.reviewCount,
    reviews: (a, b) => b.item.reviewCount - a.item.reviewCount,
    price_asc: (a, b) => a.item.price - b.item.price,
    price_desc: (a, b) => b.item.price - a.item.price,
    newest: (a, b) => b.launch - a.launch,
  }
  scored.sort((a, b) => (parsed.terms.length ? b.relevance - a.relevance : 0) || cmp[sort](a, b) || a.item.slug.localeCompare(b.item.slug))

  return {
    items: scored.slice(0, Math.min(limit, 100)).map((x) => x.item),
    interpreted: { ...parsed, category: cat, matchedAny },
  }
}

export async function catalogStats() {
  const [products, reviews, returns, prices, brands, sellers, rated] = await Promise.all([
    prisma.clothingProduct.count(),
    prisma.clothingReview.count(),
    prisma.returnEvent.count(),
    prisma.priceSnapshot.count(),
    prisma.brand.count(),
    prisma.seller.count(),
    prisma.productScore.count(),
  ])
  return { products, reviews, returns, prices, brands, sellers, rated }
}

// ---------------------------------------------------------------------------
// Product page
// ---------------------------------------------------------------------------

export type ProductReview = {
  id: string
  rating: number
  title: string | null
  content: string
  language: string
  date: string
  verified: boolean
  sizePurchased: string | null
  fitsAs: string | null
  heightCm: number | null
  bodyType: string | null
  /** Heuristic guardrail flag: text looks like an attempt to manipulate an AI. */
  flagged: boolean
}

export type PriceFacts = {
  lowest: { price: number; seller: string; date: string } | null
  current: { price: number; seller: string }[]
  /** A "was" price that no seller actually charged in the window. */
  fakeDiscount: { listPrice: number; highestCharged: number } | null
  /** Today's lowest price is well above the 90-day low. */
  oftenCheaper: { lowest: number; nowLowest: number } | null
  days: number
}

const FITS_AS = ['runs_small', 'true_to_size', 'runs_large'] as const

/** Accepts a slug or an id (old /products/:id links redirect here). */
export async function getProductPage(slugOrId: string) {
  const p = await prisma.clothingProduct.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: {
      brand: true,
      productScore: true,
      factorScores: { where: { version: 'v2' } },
      reviews: { orderBy: [{ helpfulVotes: 'desc' }, { reviewDate: 'desc' }] },
      returns: { select: { returnReason: true, returnCategory: true } },
      priceSnapshots: { include: { seller: { select: { name: true } } }, orderBy: { observedAt: 'asc' } },
    },
  })
  if (!p) return null

  // Evidence the agents recorded (empty until B3 runs).
  const evidence = await prisma.evidenceTag.findMany({
    where: { productId: p.id, grounded: true },
    include: { review: { select: { reviewDate: true, isVerifiedPurchase: true } } },
    orderBy: { confidence: 'desc' },
  })

  const reviews: ProductReview[] = p.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    language: r.language,
    date: r.reviewDate.toISOString(),
    verified: r.isVerifiedPurchase,
    sizePurchased: r.sizePurchased,
    fitsAs: r.fitsAs,
    heightCm: r.heightCm,
    bodyType: r.bodyType,
    flagged: r.injectionFlag || scanInjection(`${r.title ?? ''}\n${r.content}`).flagged,
  }))

  // What reviewers reported in structured fields (counts, not scores).
  const fit = Object.fromEntries(FITS_AS.map((k) => [k, p.reviews.filter((r) => r.fitsAs === k).length])) as Record<(typeof FITS_AS)[number], number>
  // null = the reviewer wasn't asked; only count reviews where the field was recorded.
  const issue = (k: 'pillingObserved' | 'colorFading' | 'shrinkage') => ({
    yes: p.reviews.filter((r) => r[k] === true).length,
    recorded: p.reviews.filter((r) => r[k] !== null).length,
  })
  const issues = { pilling: issue('pillingObserved'), fading: issue('colorFading'), shrinkage: issue('shrinkage') }
  const ratingAvg = p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null

  const returnReasons = Object.entries(
    p.returns.reduce<Record<string, number>>((acc, r) => {
      acc[r.returnReason] = (acc[r.returnReason] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  // Price series per seller (fixed order by first appearance → stable colours).
  const bySeller = new Map<string, { seller: string; points: { date: string; price: number; listPrice: number | null; isPromo: boolean }[] }>()
  for (const s of p.priceSnapshots) {
    const name = s.seller?.name ?? `${p.brand.name} store`
    if (!bySeller.has(name)) bySeller.set(name, { seller: name, points: [] })
    bySeller.get(name)!.points.push({ date: s.observedAt.toISOString().slice(0, 10), price: Number(s.price), listPrice: num(s.listPrice), isPromo: s.isPromo })
  }
  const series = [...bySeller.values()].slice(0, 4)
  const priceFacts = computePriceFacts(series)

  return {
    product: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      subcategory: p.subcategory,
      gender: p.gender,
      price: Number(p.currentPrice),
      originalPrice: num(p.originalPrice),
      currency: p.currency,
      sizes: p.sizes,
      colors: p.colors,
      materials: (p.materials ?? {}) as Record<string, number>,
      fabricWeightGsm: p.fabricWeightGsm,
      elastanePct: p.elastanePct,
      fitType: p.fitType,
      silhouette: p.silhouette,
      careInstructions: p.careInstructions,
      hasPetite: p.hasPetite,
      hasTall: p.hasTall,
      hasPlus: p.hasPlus,
      recycledContent: p.recycledContent,
      certifications: p.certifications,
      launchDate: p.launchDate?.toISOString() ?? null,
      trendTag: p.trendTag,
      source: p.source,
      licence: p.licence,
    },
    brand: { name: p.brand.name, slug: p.brand.slug, description: p.brand.description },
    score: p.productScore
      ? {
          overall: p.productScore.overall,
          overallWithSustainability: p.productScore.overallWithSustainability,
          pillars: {
            FIT: p.productScore.fit,
            QUALITY: p.productScore.quality,
            STYLE_VALUE: p.productScore.styleValue,
            COMFORT: p.productScore.comfort,
            SUSTAINABILITY: p.productScore.sustainability,
          },
          confidenceLabel: p.productScore.confidenceLabel,
          reviewCount: p.productScore.reviewCount,
          factorsIncluded: p.productScore.factorsIncluded,
          factorsMissing: p.productScore.factorsMissing,
          summary: p.productScore.verified ? p.productScore.summary : null,
          sizeAdvice: p.productScore.verified ? p.productScore.sizeAdvice : null,
          downside: p.productScore.verified ? p.productScore.downside : null,
          ratedByRunId: p.productScore.ratedByRunId,
          calculatedAt: p.productScore.calculatedAt.toISOString(),
        }
      : null,
    factors: p.factorScores.map((f) => ({ factor: f.factor, value: Number(f.value), evidenceCount: f.evidenceCount })),
    evidence: evidence.map((e) => ({
      id: e.id,
      factor: e.factor,
      sourceType: e.sourceType,
      signal: e.signal,
      sentiment: Number(e.sentiment),
      quote: e.quote,
      injectionFlag: e.injectionFlag,
      date: e.review?.reviewDate.toISOString() ?? e.createdAt.toISOString(),
      verified: e.review?.isVerifiedPurchase ?? false,
    })),
    reviews,
    reported: { fit, issues, ratingAvg, reviewCount: p.reviews.length },
    returns: { total: p.returns.length, reasons: returnReasons },
    prices: { series, facts: priceFacts },
  }
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof getProductPage>>>

const OFTEN_CHEAPER_GAP = 0.12

function computePriceFacts(series: { seller: string; points: { date: string; price: number; listPrice: number | null; isPromo: boolean }[] }[]): PriceFacts {
  const all = series.flatMap((s) => s.points.map((pt) => ({ ...pt, seller: s.seller })))
  if (all.length === 0) return { lowest: null, current: [], fakeDiscount: null, oftenCheaper: null, days: 0 }

  const dates = all.map((x) => x.date).sort()
  const days = Math.round((new Date(dates.at(-1)!).getTime() - new Date(dates[0]).getTime()) / 864e5)
  const lowest = all.reduce((a, b) => (b.price < a.price ? b : a))
  const current = series
    .map((s) => ({ seller: s.seller, price: s.points.at(-1)!.price }))
    .sort((a, b) => a.price - b.price)

  const highestCharged = Math.max(...all.map((x) => x.price))
  const listPrices = all.filter((x) => x.isPromo && x.listPrice != null).map((x) => x.listPrice!)
  const maxList = listPrices.length ? Math.max(...listPrices) : null
  const fakeDiscount = maxList !== null && maxList > highestCharged * 1.05 ? { listPrice: maxList, highestCharged } : null

  const nowLowest = current[0]?.price ?? lowest.price
  const oftenCheaper = nowLowest > lowest.price * (1 + OFTEN_CHEAPER_GAP) ? { lowest: lowest.price, nowLowest } : null

  return { lowest: { price: lowest.price, seller: lowest.seller, date: lowest.date }, current, fakeDiscount, oftenCheaper, days }
}

export async function listProductSlugs() {
  return prisma.clothingProduct.findMany({ select: { slug: true, id: true } })
}

// ---------------------------------------------------------------------------
// Home and brand pages: plain counts from the data (no scores)
// ---------------------------------------------------------------------------

export async function returnReasonSummary(brandSlug?: string) {
  const where = brandSlug ? { product: { brand: { slug: brandSlug } } } : {}
  const [grouped, total] = await Promise.all([
    prisma.returnEvent.groupBy({ by: ['returnReason'], where, _count: { _all: true } }),
    prisma.returnEvent.count({ where }),
  ])
  const perProduct = await prisma.returnEvent.groupBy({ by: ['returnReason', 'productId'], where })
  const productsBy = perProduct.reduce<Record<string, number>>((acc, r) => {
    acc[r.returnReason] = (acc[r.returnReason] ?? 0) + 1
    return acc
  }, {})
  return {
    total,
    reasons: grouped
      .map((g) => ({ reason: g.returnReason, count: g._count._all, products: productsBy[g.returnReason] ?? 0 }))
      .sort((a, b) => b.count - a.count),
  }
}

/** The product whose reviewers most often say it runs small, with one real quote. */
export async function fitSpotlight() {
  const rows = await prisma.clothingReview.groupBy({ by: ['productId', 'fitsAs'], _count: { _all: true } })
  const byProduct = new Map<string, { small: number; total: number }>()
  for (const r of rows) {
    const e = byProduct.get(r.productId) ?? { small: 0, total: 0 }
    e.total += r._count._all
    if (r.fitsAs === 'runs_small') e.small += r._count._all
    byProduct.set(r.productId, e)
  }
  const best = [...byProduct.entries()].filter(([, v]) => v.total >= 10).sort((a, b) => b[1].small / b[1].total - a[1].small / a[1].total)[0]
  if (!best) return null
  const [productId, counts] = best
  const product = await prisma.clothingProduct.findUnique({
    where: { id: productId },
    select: {
      slug: true,
      name: true,
      category: true,
      subcategory: true,
      brand: { select: { name: true } },
      reviews: {
        where: { fitsAs: 'runs_small', content: { contains: 'small', mode: 'insensitive' } },
        orderBy: { helpfulVotes: 'desc' },
        take: 5,
        select: { content: true, reviewDate: true, isVerifiedPurchase: true, title: true },
      },
    },
  })
  if (!product) return null
  const review = product.reviews.find((r) => !scanInjection(r.content).flagged && r.content.length < 220)
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand.name,
    category: product.category,
    subcategory: product.subcategory,
    runsSmall: counts.small,
    total: counts.total,
    quote: review ? { text: review.content, date: review.reviewDate.toISOString(), verified: review.isVerifiedPurchase } : null,
  }
}

export async function listBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    select: { slug: true, name: true, description: true, _count: { select: { products: true } } },
  })
  return brands.map((b) => ({ slug: b.slug, name: b.name, description: b.description, products: b._count.products }))
}
