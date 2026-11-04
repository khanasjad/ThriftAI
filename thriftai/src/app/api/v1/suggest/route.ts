/**
 * GET /api/v1/suggest?q= — autosuggest for the search boxes (B9): query completions from the catalog,
 * up to 4 products (score first) and matching collections. Reads stored data only; no model call.
 */
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { productScopeForViewer } from '@/lib/veritas/authz'
import { fail, ok, rateLimit } from '@/lib/veritas/http'
import { buildVocabulary, suggest, type SuggestProduct } from '@/lib/veritas/match/suggest'
import { COLLECTIONS } from '@/lib/veritas/read/collections'

// The catalog changes rarely; keep each viewer scope's product list (public, an organisation's, all) for a minute.
const cache = new Map<string, { at: number; products: SuggestProduct[]; vocab: Map<string, number> }>()
const TTL_MS = 60_000

async function catalog(scope: Prisma.ClothingProductWhereInput) {
  const key = JSON.stringify(scope)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit
  const rows = await prisma.clothingProduct.findMany({
    where: { AND: [scope], isAvailable: true },
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
    price: r.currentPrice === null ? null : Number(r.currentPrice),
    score: r.productScore?.overall ?? null,
  }))
  const entry = { at: Date.now(), products, vocab: buildVocabulary(products) }
  cache.set(key, entry)
  return entry
}

export async function GET(req: Request) {
  if (!(await rateLimit('suggest', 240, 60_000))) return fail(429, 'Too many requests')
  const q = (new URL(req.url).searchParams.get('q') ?? '').slice(0, 80)
  const c = await catalog(await productScopeForViewer())
  return ok(suggest(q, c.products, COLLECTIONS.map((x) => ({ slug: x.slug, title: x.title })), c.vocab))
}
