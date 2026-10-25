/**
 * GET /api/v1/products/:id — product detail with score, pillars, factors and recent reviews.
 * Unrated products return null scores with `rated: false` (never 0).
 */
import { NextRequest, NextResponse } from 'next/server'
import { scoreApiGate } from '@/lib/veritas/apikeys'
import { prisma } from '@/lib/prisma'
import { tagsForProducts } from '@/lib/veritas/read/tags'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await scoreApiGate()
  if (gate instanceof Response) return gate
  const { id } = await params
  try {
    const product = await prisma.clothingProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        brand: { select: { id: true, name: true, slug: true, description: true, reputationScore: true, website: true } },
        productScore: true,
        factorScores: { orderBy: { factor: 'asc' } },
        reviews: {
          take: 10,
          orderBy: { reviewDate: 'desc' },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            fitRating: true,
            qualityRating: true,
            comfortRating: true,
            styleRating: true,
            valueRating: true,
            sizePurchased: true,
            fitsAs: true,
            heightCm: true,
            bodyType: true,
            wearDuration: true,
            isVerifiedPurchase: true,
            helpfulVotes: true,
            reviewDate: true,
          },
        },
        returns: { select: { returnReason: true, returnCategory: true } },
        _count: { select: { reviews: true, returns: true, evidenceTags: true } },
      },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const returnReasons = product.returns.reduce<Record<string, number>>((acc, r) => {
      acc[r.returnReason] = (acc[r.returnReason] ?? 0) + 1
      return acc
    }, {})
    const score = product.productScore
    const tags = (await tagsForProducts([product.id])).get(product.id) ?? []
    const current = Number(product.currentPrice)
    const original = product.originalPrice ? Number(product.originalPrice) : null

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        currentPrice: current,
        originalPrice: original,
        currency: product.currency,
        discount: original ? Math.round((1 - current / original) * 100) : null,
        sku: product.sku,
        gender: product.gender,
        sizes: product.sizes,
        colors: product.colors,
        materials: product.materials,
        fabricWeightGsm: product.fabricWeightGsm,
        careInstructions: product.careInstructions,
        launchDate: product.launchDate,
        trendTag: product.trendTag,
        isAvailable: product.isAvailable,
        images: product.images,
        primaryImageUrl: product.primaryImageUrl,

        overallScore: score?.overall ?? null,
        overallWithSustainability: score?.overallWithSustainability ?? null,
        grade: score?.grade ?? null,
        fitScore: score?.fit ?? null,
        qualityScore: score?.quality ?? null,
        styleScore: score?.styleValue ?? null,
        comfortScore: score?.comfort ?? null,
        sustainabilityScore: score?.sustainability ?? null,
        confidence: score?.confidence ?? null,
        confidenceLabel: score?.confidenceLabel ?? null,
        factorsIncluded: score?.factorsIncluded ?? [],
        factorsMissing: score?.factorsMissing ?? [],
        summary: score?.verified ? score.summary : null,
        sizeAdvice: score?.verified ? score.sizeAdvice : null,
        downside: score?.verified ? score.downside : null,
        rated: Boolean(score),
        /** Code-built labels with the numbers behind them (B9 enrichment). */
        tags,

        factors: product.factorScores.map((f) => ({
          factor: f.factor,
          pillar: f.pillar,
          value: Number(f.value),
          rawValue: f.rawValue === null ? null : Number(f.rawValue),
          weight: f.weight,
          evidenceCount: f.evidenceCount,
          confidence: f.confidence,
        })),
        evidenceCount: product._count.evidenceTags,

        reviewCount: product._count.reviews,
        returnCount: product._count.returns,
        returnReasons,
        reviews: product.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          text: r.content,
          fitRating: r.fitRating,
          qualityRating: r.qualityRating,
          comfortRating: r.comfortRating,
          styleRating: r.styleRating,
          valueRating: r.valueRating,
          sizePurchased: r.sizePurchased,
          fitsAs: r.fitsAs,
          heightCm: r.heightCm,
          bodyType: r.bodyType,
          wearDuration: r.wearDuration,
          isVerifiedPurchase: r.isVerifiedPurchase,
          helpfulVotes: r.helpfulVotes,
          createdAt: r.reviewDate,
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 })
  }
}
