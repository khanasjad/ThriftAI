import 'server-only'
import { PUBLIC_PRODUCTS } from '@/lib/veritas/scope'
import { prisma } from '@/lib/prisma'
import { alternativesFor } from '../match/alternatives'
import { tagsForProducts } from './tags'
import type { CatalogItem } from './catalog'

const NEW_LAUNCH_DAYS = 30

/** Up to 3 better-scoring alternatives for a product page, as catalog cards with a one-line reason. */
export async function loadAlternatives(productId: string): Promise<{ item: CatalogItem; reason: string }[]> {
  const rows = await prisma.clothingProduct.findMany({
    where: { isAvailable: true, ...PUBLIC_PRODUCTS },
    select: {
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
    },
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
  const cutoff = Date.now() - NEW_LAUNCH_DAYS * 864e5
  return alts.map(({ item: { row: r }, reason }) => ({
    reason,
    item: {
      slug: r.slug,
      name: r.name,
      brand: r.brand.name,
      category: r.category,
      subcategory: r.subcategory,
      silhouette: r.silhouette,
      color: r.colors[0] ?? null,
      pattern: ((r.visual?.attributes as { pattern?: string } | undefined)?.pattern ?? null),
      price: Number(r.currentPrice),
      currency: r.currency,
      reviewCount: r._count.reviews,
      score: r.productScore?.overall ?? null,
      confidenceLabel: r.productScore?.confidenceLabel ?? null,
      isNewLaunch: !!r.launchDate && r.launchDate.getTime() > cutoff,
      tags: tags.get(r.id) ?? [],
    },
  }))
}
