/**
 * Photo fingerprints in the database (B18): save at upload, read for search and "looks similar".
 * Similarity is computed in code over the candidate pool (fine for thousands of products).
 */
import { createHash } from 'node:crypto'
import { after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '../env'
import { PUBLIC_PRODUCTS } from '../scope'
import { imageEmbedding, textEmbedding, textModelLoading, visualModelVersion } from './fashion-model'
import { cosine, lookAlike, lookPhrase } from './look-alike'

export const visualSearchOn = () => env().VISUAL_SEARCH

/** Fingerprints a product photo unless the same image was already done with the same model. $0. */
export async function embedProduct(productId: string, bytes: Buffer): Promise<'embedded' | 'unchanged' | 'off'> {
  if (!visualSearchOn()) return 'off'
  const imageHash = createHash('sha256').update(bytes).digest('hex')
  const model = visualModelVersion()
  const have = await prisma.productEmbedding.findUnique({ where: { productId }, select: { imageHash: true, model: true } })
  if (have?.imageHash === imageHash && have.model === model) return 'unchanged'
  const vector = await imageEmbedding(bytes)
  await prisma.productEmbedding.upsert({ where: { productId }, update: { model, imageHash, vector }, create: { productId, model, imageHash, vector } })
  return 'embedded'
}

async function vectorsFor(ids: string[]) {
  const rows = await prisma.productEmbedding.findMany({ where: { productId: { in: ids }, model: visualModelVersion() }, select: { productId: true, vector: true } })
  return new Map(rows.map((r) => [r.productId, r.vector]))
}

/**
 * Products in `poolIds` whose photo looks like the shopper's words, e.g. ["automobile"] → the car tees.
 * Null when visual search is off, there are no words, or the model isn't ready yet (search then uses labels only).
 */
export async function lookAlikeIds(poolIds: string[], kind: string | undefined, words: string[]): Promise<{ words: string[]; ids: string[] } | null> {
  if (!visualSearchOn() || !words.length || !poolIds.length) return null
  const q = await textEmbedding(lookPhrase(kind, words))
  if (!q) {
    keepAliveWhileLoading()
    return null
  }
  const vecs = await vectorsFor(poolIds)
  if (!vecs.size) return null
  const sims = new Map([...vecs].map(([id, v]) => [id, cosine(q, v)]))
  return { words, ids: lookAlike(sims) }
}

/**
 * Serverless functions pause once they respond, which would stop a cold model download half-way. `after()` keeps
 * this instance running until the model is ready, so the next search on it matches by look. No-op outside a request.
 */
function keepAliveWhileLoading() {
  const loading = textModelLoading()
  if (!loading) return
  try {
    after(() => loading.catch(() => {}))
  } catch {
    // Not inside a request (CLI scripts): nothing to keep alive.
  }
}

/**
 * Minimum photo-to-photo similarity for "looks similar". Dev images (2026-10-26): items with the same print or
 * pattern score 0.835–0.96 with each other; each car tee's two nearest neighbours are the other car tees.
 */
export const SIMILAR_MIN = 0.8

/** Up to `limit` public products of the same type whose photo looks most like this one's. */
export async function similarLooking(productId: string, limit = 3): Promise<{ id: string; similarity: number }[]> {
  if (!visualSearchOn()) return []
  const me = await prisma.productEmbedding.findUnique({ where: { productId }, select: { vector: true, model: true, product: { select: { category: true, subcategory: true } } } })
  if (!me || me.model !== visualModelVersion()) return []
  const others = await prisma.productEmbedding.findMany({
    where: { model: me.model, productId: { not: productId }, product: { ...PUBLIC_PRODUCTS, isAvailable: true, category: me.product.category, ...(me.product.subcategory && { subcategory: me.product.subcategory }) } },
    select: { productId: true, vector: true },
  })
  return others
    .map((o) => ({ id: o.productId, similarity: cosine(me.vector, o.vector) }))
    .filter((o) => o.similarity >= SIMILAR_MIN)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
