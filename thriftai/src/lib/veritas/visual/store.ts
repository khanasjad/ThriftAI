/**
 * Photo fingerprints in the database (B18): save at upload, read for search and "looks similar".
 * Stored as pgvector vector(768); similarity is computed by Postgres (cosine), "looks similar" uses the HNSW index.
 * Raw SQL with bound parameters only (Prisma can't map the vector type).
 */
import { createHash } from 'node:crypto'
import { after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '../env'
import { imageEmbedding, textEmbedding, textModelLoading, textModelReady, visualModelVersion, warmTextModel } from './fashion-model'
import { lookAlike, lookPhrase } from './look-alike'

/** pgvector text form of a vector: "[0.1,0.2,…]". */
const toVector = (v: number[]) => `[${v.map((x) => (Number.isFinite(x) ? x : 0)).join(',')}]`

export const visualSearchOn = () => env().VISUAL_SEARCH

/** Fingerprints a product photo unless the same image was already done with the same model. $0. */
export async function embedProduct(productId: string, bytes: Buffer): Promise<'embedded' | 'unchanged' | 'off'> {
  if (!visualSearchOn()) return 'off'
  const imageHash = createHash('sha256').update(bytes).digest('hex')
  const model = visualModelVersion()
  const have = await prisma.productEmbedding.findUnique({ where: { productId }, select: { imageHash: true, model: true } })
  if (have?.imageHash === imageHash && have.model === model) return 'unchanged'
  const vec = toVector(await imageEmbedding(bytes))
  await prisma.$executeRaw`
    INSERT INTO product_embeddings ("productId", model, "imageHash", embedding, "createdAt", "updatedAt")
    VALUES (${productId}, ${model}, ${imageHash}, ${vec}::vector, now(), now())
    ON CONFLICT ("productId") DO UPDATE SET model = EXCLUDED.model, "imageHash" = EXCLUDED."imageHash", embedding = EXCLUDED.embedding, "updatedAt" = now()`
  return 'embedded'
}

/** Cosine similarity of each pool product's photo to a query vector, computed by Postgres. */
async function similaritiesTo(q: number[], ids: string[]) {
  const rows = await prisma.$queryRaw<{ productId: string; sim: number }[]>`
    SELECT "productId", 1 - (embedding <=> ${toVector(q)}::vector) AS sim
    FROM product_embeddings
    WHERE model = ${visualModelVersion()} AND embedding IS NOT NULL AND "productId" = ANY(${ids}::text[])`
  return new Map(rows.map((r) => [r.productId, Number(r.sim)]))
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
  const sims = await similaritiesTo(q, poolIds)
  if (!sims.size) return null
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
 * Warm-up (B18): starts loading the text model on this server instance so the shopper's first "looks like" search
 * doesn't fall back to labels. Called when someone focuses a search box. Cheap: no model call, nothing written.
 */
export function warmVisual(): 'off' | 'loading' | 'ready' {
  if (!visualSearchOn()) return 'off'
  if (textModelReady()) return 'ready'
  warmTextModel().catch(() => {})
  keepAliveWhileLoading()
  return 'loading'
}

/**
 * Minimum photo-to-photo similarity for "looks similar". Dev images (2026-10-26): items with the same print or
 * pattern score 0.835–0.96 with each other; each car tee's two nearest neighbours are the other car tees.
 */
export const SIMILAR_MIN = 0.8

/**
 * Up to `limit` public, available products of the same type whose photo looks most like this one's.
 * Nearest neighbours by cosine distance (HNSW index); public = not private (same rule as scope.ts PUBLIC_PRODUCTS).
 */
export async function similarLooking(productId: string, limit = 3): Promise<{ id: string; similarity: number }[]> {
  if (!visualSearchOn()) return []
  const rows = await prisma.$queryRaw<{ id: string; sim: number }[]>`
    WITH me AS (
      SELECT e.embedding, p.category, p.subcategory FROM product_embeddings e JOIN clothing_products p ON p.id = e."productId"
      WHERE e."productId" = ${productId} AND e.model = ${visualModelVersion()} AND e.embedding IS NOT NULL
    )
    SELECT e."productId" AS id, 1 - (e.embedding <=> me.embedding) AS sim
    FROM product_embeddings e JOIN clothing_products p ON p.id = e."productId", me
    WHERE e."productId" <> ${productId} AND e.model = ${visualModelVersion()} AND e.embedding IS NOT NULL
      AND p."isPrivate" = false AND p."isAvailable" = true AND p.category = me.category
      AND (me.subcategory IS NULL OR p.subcategory = me.subcategory)
    ORDER BY e.embedding <=> me.embedding
    LIMIT ${limit}`
  return rows.map((r) => ({ id: r.id, similarity: Number(r.sim) })).filter((r) => r.similarity >= SIMILAR_MIN)
}
