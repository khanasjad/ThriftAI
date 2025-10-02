import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category') || 'ALL'
    const minPrice = Number(searchParams.get('minPrice')) || 0
    const maxPrice = Number(searchParams.get('maxPrice')) || 999999
    const condition = searchParams.get('condition') || 'ALL'
    const limit = Number(searchParams.get('limit')) || 20

    logger.info('🏆 Leaderboard request', {
      category,
      minPrice,
      maxPrice,
      condition,
      limit
    })

    // Build where clause
    const whereClause: any = {
      isAvailable: true,
      aiScore: { not: null },
      price: {
        gte: minPrice,
        lte: maxPrice
      }
    }

    // Add category filter
    if (category !== 'ALL') {
      whereClause.category = category
    }

    // Add condition filter
    if (condition !== 'ALL') {
      whereClause.condition = condition
    }

    // Fetch top products
    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true,
        originalPrice: true,
        condition: true,
        aiScore: true,
        aiConfidence: true,
        aiScoreBreakdown: true,
        stockQuantity: true,
        shippingCost: true,
        hasFreeShipping: true,
        estimatedDeliveryDays: true,
        hasFreeReturns: true,
        companyMetrics: true,
        dynamicSpecs: true
      },
      orderBy: {
        aiScore: 'desc'
      },
      take: limit
    })

    // Helper: Calculate specsQuality from product.dynamicSpecs if breakdown doesn't have it
    const calculateFallbackSpecsQuality = (product: any): number => {
      const specs = product.dynamicSpecs as Record<string, any> | null
      if (!specs || typeof specs !== 'object') return 50 // Neutral default

      const specsCount = Object.keys(specs).length
      if (specsCount === 0) return 50 // Neutral default for categories without spec mappings

      // Score based on number of specs (similar to aiScoringEngine logic)
      // 1-2 specs = 25, 3-5 specs = 50, 6-8 specs = 75, 9+ specs = 100
      if (specsCount >= 9) return 100
      if (specsCount >= 6) return 75
      if (specsCount >= 3) return 50
      return 25
    }

    // Transform breakdown to UI-compatible format (0-10 scale)
    const transformedProducts = products.map(product => {
      const breakdown = product.aiScoreBreakdown as any

      // Get specsQuality from breakdown or calculate fallback from dynamicSpecs
      const getSpecsQualityScore = (): number => {
        // Try to get from breakdown.dynamicProductSpecs
        if (breakdown?.dynamicProductSpecs?.score !== undefined) {
          return breakdown.dynamicProductSpecs.score
        }
        // Try to get from breakdown.components.specsQuality (already in 0-100 scale)
        if (breakdown?.components?.specsQuality !== undefined) {
          return breakdown.components.specsQuality
        }
        // Fallback: calculate from product.dynamicSpecs
        return calculateFallbackSpecsQuality(product)
      }

      // If components already exist (format: { components: { relevance: 100, ... } })
      if (breakdown?.components) {
        const components = {
          relevance: (breakdown.components.relevance || 0) / 10,
          priceValue: (breakdown.components.priceValue || 0) / 10,
          trustScore: (breakdown.components.trustScore || 0) / 10,
          qualityScore: (breakdown.components.qualityScore || 0) / 10,
          socialProof: (breakdown.components.socialProof || 0) / 10,
          convenience: (breakdown.components.convenience || 0) / 10,
          urgency: (breakdown.components.urgency || 0) / 10,
          emotional: (breakdown.components.emotional || 0) / 10,
          specsQuality: getSpecsQualityScore() / 10
        }

        return {
          ...product,
          aiScoreBreakdown: {
            ...breakdown,
            components
          }
        }
      }

      // Handle format: { relevance: { score: 100 }, priceValue: { score: 80 }, ... }
      if (breakdown?.relevance?.score !== undefined) {
        const components = {
          relevance: (breakdown.relevance.score || 0) / 10,
          priceValue: (breakdown.priceValue.score || 0) / 10,
          trustScore: (breakdown.trustScore.score || 0) / 10,
          qualityScore: (breakdown.qualityScore.score || 0) / 10,
          socialProof: (breakdown.socialProof.score || 0) / 10,
          convenience: (breakdown.convenience.score || 0) / 10,
          urgency: (breakdown.urgency.score || 0) / 10,
          emotional: (breakdown.emotional.score || 0) / 10,
          specsQuality: getSpecsQualityScore() / 10
        }

        return {
          ...product,
          aiScoreBreakdown: {
            ...breakdown,
            components
          }
        }
      }

      // Handle format: { relevance: 100, priceValue: 80, urgency: 50, ... } (direct scores)
      const components = {
        relevance: (breakdown?.relevance || 0) / 10,
        priceValue: (breakdown?.priceValue || 0) / 10,
        trustScore: (breakdown?.trustScore || 0) / 10,
        qualityScore: (breakdown?.qualityScore || 0) / 10,
        socialProof: (breakdown?.socialProof || 0) / 10,
        convenience: (breakdown?.convenience || 0) / 10,
        urgency: (breakdown?.urgency || 0) / 10,
        emotional: (breakdown?.emotional || 0) / 10,
        specsQuality: getSpecsQualityScore() / 10
      }

      return {
        ...product,
        aiScoreBreakdown: {
          ...breakdown,
          components
        }
      }
    })

    logger.info('✅ Leaderboard results', {
      productsFound: transformedProducts.length,
      topScore: transformedProducts[0]?.aiScore,
      lowestScore: transformedProducts[transformedProducts.length - 1]?.aiScore
    })

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      filters: {
        category,
        minPrice,
        maxPrice,
        condition
      },
      totalResults: transformedProducts.length
    })

  } catch (error) {
    logger.error('❌ Leaderboard error', { error })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard',
        products: []
      },
      { status: 500 }
    )
  }
}
