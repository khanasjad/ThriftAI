/**
 * GET /api/v1/products — list products with scores.
 * Query: category, subcategory, gender, brandId, minScore, maxScore, label, limit (≤100), offset,
 *        sortBy = score | name | price | newest
 */
import { NextRequest, NextResponse } from 'next/server'
import { visibleProducts } from '@/lib/veritas/scope'
import { scoreApiGate } from '@/lib/veritas/apikeys'
import { z } from 'zod'
import { Prisma, ClothingCategory, ClothingGender, ConfidenceLabel } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { tagsForProducts } from '@/lib/veritas/read/tags'
import { driversForProducts } from '@/lib/veritas/read/drivers'

const querySchema = z.object({
  category: z.nativeEnum(ClothingCategory).optional(),
  subcategory: z.string().optional(),
  gender: z.nativeEnum(ClothingGender).optional(),
  brandId: z.string().optional(),
  label: z.nativeEnum(ConfidenceLabel).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['score', 'name', 'price', 'newest']).default('score'),
})

export async function GET(req: NextRequest) {
  const gate = await scoreApiGate()
  if (gate instanceof Response) return gate
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }
  const q = parsed.data

  const scoreFilter: Prisma.ProductScoreWhereInput = {}
  if (q.minScore !== undefined || q.maxScore !== undefined) {
    scoreFilter.overall = { gte: q.minScore, lte: q.maxScore }
  }
  if (q.label) scoreFilter.confidenceLabel = q.label

  const where: Prisma.ClothingProductWhereInput = {
    isAvailable: true,
    ...visibleProducts(gate.tenantId),
    category: q.category,
    subcategory: q.subcategory,
    gender: q.gender,
    brandId: q.brandId,
    ...(Object.keys(scoreFilter).length ? { productScore: { is: scoreFilter } } : {}),
  }

  const orderBy: Prisma.ClothingProductOrderByWithRelationInput =
    q.sortBy === 'score'
      ? { productScore: { overall: 'desc' } }
      : q.sortBy === 'price'
        ? { currentPrice: 'asc' }
        : q.sortBy === 'newest'
          ? { createdAt: 'desc' }
          : { name: 'asc' }

  try {
    const [products, total] = await Promise.all([
      prisma.clothingProduct.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true, slug: true, reputationScore: true } },
          productScore: true,
          _count: { select: { reviews: true, returns: true } },
        },
        take: q.limit,
        skip: q.offset,
        orderBy,
      }),
      prisma.clothingProduct.count({ where }),
    ])

    const [tags, drivers] = await Promise.all([tagsForProducts(products.map((p) => p.id)), driversForProducts(products.map((p) => p.id))])
    const data = products.map((p) => {
      const s = p.productScore
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand,
        currentPrice: p.currentPrice === null ? null : Number(p.currentPrice),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        currency: p.currency,
        images: p.images,
        primaryImageUrl: p.primaryImageUrl,
        gender: p.gender,
        sizes: p.sizes,
        colors: p.colors,
        trendTag: p.trendTag,
        isAvailable: p.isAvailable,
        rated: Boolean(s),
        overallScore: s?.overall ?? null,
        grade: s?.grade ?? null,
        fitScore: s?.fit ?? null,
        qualityScore: s?.quality ?? null,
        styleScore: s?.styleValue ?? null,
        comfortScore: s?.comfort ?? null,
        sustainabilityScore: s?.sustainability ?? null,
        confidence: s?.confidence ?? null,
        confidenceLabel: s?.confidenceLabel ?? null,
        tags: tags.get(p.id) ?? [],
        drivers: s ? drivers.get(p.id) ?? null : null,
        reviewCount: p._count.reviews,
        returnCount: p._count.returns,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }
    })

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, limit: q.limit, offset: q.offset, hasMore: q.offset + data.length < total },
      filters: q,
    })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
  }
}
