import 'server-only'
import { PUBLIC_PRODUCTS } from '@/lib/veritas/scope'
import { prisma } from '@/lib/prisma'
import { alternativesFor } from '../match/alternatives'
import { thumbPattern } from '@/components/veritas/thumb-pattern'
import { tagsForProducts } from './tags'
import { similarLooking } from '../visual/store'
import type { CatalogItem } from './catalog'

const NEW_LAUNCH_DAYS = 30

const CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  subcategory: true,
  silhouette: true,
  gender: true,
  colors: true,
  currentPrice: true,
  currency: true,
  launchDate: true,
  brand: { select: { name: true } },
  visual: { select: { attributes: true } },
  productScore: { select: { overall: true, confidenceLabel: true, fit: true, quality: true, styleValue: true, comfort: true } },
  _count: { select: { reviews: true } },
} as const

/**
 * "Looks similar" (B18): up to 3 products of the same type whose photo looks most like this one's (open fashion
 * model), as catalog cards. Ordered by look; each card still shows its own score first.
 */
export async function loadSimilarLooking(productId: string): Promise<CatalogItem[]> {
  const near = await similarLooking(productId, 3).catch(() => [])
  if (!near.length) return []
  const rows = await prisma.clothingProduct.findMany({ where: { id: { in: near.map((n) => n.id) }, isAvailable: true, ...PUBLIC_PRODUCTS }, select: CARD_SELECT })
  const tags = await tagsForProducts(rows.map((r) => r.id))
  const byId = new Map(rows.map((r) => [r.id, r]))
  return near.flatMap((n) => (byId.has(n.id) ? [toCard(byId.get(n.id)!, tags.get(n.id) ?? [])] : []))
}

type CardRow = Awaited<ReturnType<typeof prisma.clothingProduct.findMany<{ select: typeof CARD_SELECT }>>>[number]

function toCard(r: CardRow, tags: CatalogItem['tags']): CatalogItem {
  const cutoff = Date.now() - NEW_LAUNCH_DAYS * 864e5
  return {
    slug: r.slug,
    name: r.name,
    brand: r.brand.name,
    category: r.category,
    subcategory: r.subcategory,
    silhouette: r.silhouette,
    color: r.colors[0] ?? null,
    pattern: thumbPattern(r.visual?.attributes as Parameters<typeof thumbPattern>[0]),
    price: Number(r.currentPrice),
    currency: r.currency,
    reviewCount: r._count.reviews,
    score: r.productScore?.overall ?? null,
    confidenceLabel: r.productScore?.confidenceLabel ?? null,
    isNewLaunch: !!r.launchDate && r.launchDate.getTime() > cutoff,
    tags,
  }
}

/** Up to 3 better-scoring alternatives for a product page, as catalog cards with a one-line reason. */
export async function loadAlternatives(productId: string): Promise<{ item: CatalogItem; reason: string }[]> {
  const rows = await prisma.clothingProduct.findMany({
    where: { isAvailable: true, ...PUBLIC_PRODUCTS },
    select: CARD_SELECT,
  })
  const toAlt = (r: (typeof rows)[number]) => ({
    id: r.id,
    category: r.category,
    gender: r.gender,
    price: Number(r.currentPrice),
    score: r.productScore?.overall ?? null,
    pillars: {
      FIT: r.productScore?.fit ?? null,
      QUALITY: r.productScore?.quality ?? null,
      STYLE_VALUE: r.productScore?.styleValue ?? null,
      COMFORT: r.productScore?.comfort ?? null,
    },
    row: r,
  })
  const target = rows.find((r) => r.id === productId)
  if (!target) return []
  const alts = alternativesFor(toAlt(target), rows.map(toAlt))
  const tags = await tagsForProducts(alts.map((a) => a.item.id))
  return alts.map(({ item: { row: r }, reason }) => ({ reason, item: toCard(r, tags.get(r.id) ?? []) }))
}
