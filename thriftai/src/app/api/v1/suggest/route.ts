/**
 * GET /api/v1/suggest?q= — autosuggest for the search boxes (B9): query completions from the catalog,
 * up to 4 products (score first) and matching collections. Reads stored data only; no model call.
 */
import { prisma } from '@/lib/prisma'
import { PUBLIC_PRODUCTS } from '@/lib/veritas/scope'
import { fail, ok, rateLimit } from '@/lib/veritas/http'
import { buildVocabulary, suggest, type SuggestProduct } from '@/lib/veritas/match/suggest'
import { COLLECTIONS } from '@/lib/veritas/read/collections'

// The catalog changes rarely; keep the product list for a minute per server instance.
let cache: { at: number; products: SuggestProduct[]; vocab: Map<string, number> } | null = null
const TTL_MS = 60_000

async function catalog() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache
  const rows = await prisma.clothingProduct.findMany({
    where: { isAvailable: true, ...PUBLIC_PRODUCTS },
    select: { slug: true, name: true, category: true, subcategory: true, silhouette: true, fitType: true, colors: true, currentPrice: true, brand: { select: { name: true } }, productScore: { select: { overall: true } } },
  })
  const products: SuggestProduct[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    brand: r.brand.name,
    category: r.category,
    subcategory: r.subcategory,
    silhouette: r.silhouette,
    fitType: r.fitType,
    colors: r.colors,
    price: Number(r.currentPrice),
    score: r.productScore?.overall ?? null,
  }))
  cache = { at: Date.now(), products, vocab: buildVocabulary(products) }
  return cache
}

export async function GET(req: Request) {
  if (!(await rateLimit('suggest', 240, 60_000))) return fail(429, 'Too many requests')
  const q = (new URL(req.url).searchParams.get('q') ?? '').slice(0, 80)
  const c = await catalog()
  return ok(suggest(q, c.products, COLLECTIONS.map((x) => ({ slug: x.slug, title: x.title })), c.vocab))
}
