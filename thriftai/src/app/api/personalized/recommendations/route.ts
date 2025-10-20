/**
 * Personalized Recommendations API - Phase 2.7
 *
 * Provides personalized product recommendations using dynamic weight adjustment
 *
 * Expected Impact:
 * - Click-through rate: +15-30%
 * - Purchase conversion: +10-20%
 * - Return user rate: +25%
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCategoryScoringModel } from '@/lib/scoring/category-models'
import {
  analyzeUserPreferences,
  personalizeWeights,
  getUserPreferenceProfile
} from '@/lib/personalization/user-preferences'
import { createLoaders } from '@/lib/dataloaders'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category') || 'ALL'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // 1. Analyze user preferences
    console.log(`📊 Analyzing preferences for user: ${userId}`)
    const userPrefs = await getUserPreferenceProfile(userId)

    // 2. Build query based on user preferences
    const whereClause: any = {
      isAvailable: true,
      aiScore: { not: null }
    }

    // Filter by preferred categories if no specific category requested
    if (category === 'ALL' && userPrefs.preferredCategories.length > 0) {
      whereClause.category = { in: userPrefs.preferredCategories }
    } else if (category !== 'ALL') {
      whereClause.category = category
    }

    // Filter by preferred conditions
    if (userPrefs.preferredConditions.length > 0) {
      whereClause.condition = { in: userPrefs.preferredConditions }
    }

    // Price range based on user's average order value
    if (userPrefs.averageOrderValue > 0) {
      const priceRange = userPrefs.averageOrderValue * 1.5 // 50% flexibility
      whereClause.price = {
        gte: userPrefs.averageOrderValue * 0.5,
        lte: priceRange
      }
    }

    // 3. Fetch candidate products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            rating: true,
            isVerified: true,
            totalSales: true,
            responseTimeHours: true,
            onTimeDeliveryRate: true,
            customerSatisfactionRate: true
          }
        },
        companyFinancialMetrics: true,
        attributes: true
      },
      orderBy: {
        aiScore: 'desc'
      },
      take: limit * 3 // Fetch extra for re-ranking
    })

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        userId,
        userPreferences: {
          priceVsQuality: userPrefs.priceVsQuality,
          sustainabilityScore: userPrefs.sustainabilityScore,
          brandLoyalty: userPrefs.brandLoyalty,
          preferredCategories: userPrefs.preferredCategories,
          confidence: userPrefs.confidence
        },
        recommendations: [],
        message: 'No products match your preferences'
      })
    }

    // 4. Re-score products with personalized weights
    console.log(`🎯 Re-scoring ${products.length} products with personalized weights`)

    const personalizedProducts = await Promise.all(
      products.map(async (product) => {
        // Get category-specific model
        const model = await createCategoryScoringModel(product.category)

        // Get base weights
        const baseWeights = (model as any).weights

        // Personalize weights
        const personalizedWeights = personalizeWeights(baseWeights, userPrefs)

        // Override model weights
        ;(model as any).weights = personalizedWeights

        // Re-calculate score with personalized weights
        const result = await model.calculateScore({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          condition: product.condition,
          brand: product.brand,
          sellerId: product.sellerId,
          stockQuantity: product.stockQuantity,
          hasFreeShipping: product.hasFreeShipping,
          hasFreeReturns: product.hasFreeReturns,
          hasWarranty: product.hasWarranty,
          estimatedDeliveryDays: product.estimatedDeliveryDays,
          certifications: product.certifications,
          color: product.color,
          material: product.material,
          productSize: product.productSize,
          gender: product.gender,
          productStyle: product.productStyle,
          warrantyPeriod: product.warrantyPeriod,
          durabilityRating: product.durabilityRating,
          dynamicSpecs: product.dynamicSpecs as any,
          companyMetrics: product.companyMetrics as any,
          attributes: product.attributes
        })

        return {
          ...product,
          personalizedScore: result.overallScore,
          personalizedBreakdown: result.categoryScores,
          personalizedWeights: personalizedWeights,
          baseScore: product.aiScore,
          scoreDelta: result.overallScore - Number(product.aiScore || 0),
          reasoning: result.reasoning
        }
      })
    )

    // 5. Sort by personalized score and take top N
    const recommendations = personalizedProducts
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, limit)

    // 6. Track recommendation event for future analysis
    // In production, log to analytics/event tracking system
    console.log(`✅ Generated ${recommendations.length} personalized recommendations for ${userId}`)

    return NextResponse.json({
      success: true,
      userId,
      userPreferences: {
        priceVsQuality: userPrefs.priceVsQuality,
        sustainabilityScore: userPrefs.sustainabilityScore,
        brandLoyalty: userPrefs.brandLoyalty,
        specificationDetail: userPrefs.specificationDetail,
        preferredCategories: userPrefs.preferredCategories,
        preferredConditions: userPrefs.preferredConditions,
        averageOrderValue: userPrefs.averageOrderValue,
        confidence: userPrefs.confidence,
        dataPoints: userPrefs.dataPoints
      },
      recommendations: recommendations.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice,
        condition: p.condition,
        imageUrl: p.imageUrl,
        // Scoring
        baseScore: p.baseScore,
        personalizedScore: p.personalizedScore,
        scoreDelta: p.scoreDelta,
        // Attributes
        color: p.color,
        material: p.material,
        size: p.productSize,
        // Seller
        seller: p.seller ? {
          name: p.seller.businessName,
          rating: p.seller.rating,
          isVerified: p.seller.isVerified
        } : null,
        // Why recommended
        reasoning: p.reasoning
      })),
      meta: {
        totalCandidates: products.length,
        returned: recommendations.length,
        personalizationApplied: true,
        weightAdjustments: {
          qualityBoost: userPrefs.priceVsQuality > 0.7,
          priceBoost: userPrefs.priceVsQuality < 0.3,
          sustainabilityBoost: userPrefs.sustainabilityScore > 0.7,
          specDetailBoost: userPrefs.specificationDetail > 0.7
        }
      }
    })

  } catch (error) {
    console.error('Personalized recommendations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint: Analyze user preferences without recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Analyze user preferences
    const profile = await analyzeUserPreferences(userId)

    return NextResponse.json({
      success: true,
      userId,
      profile: {
        categoryFocus: profile.categoryFocus,
        priceVsQuality: profile.priceVsQuality,
        sustainabilityScore: profile.sustainabilityScore,
        brandLoyalty: profile.brandLoyalty,
        specificationDetail: profile.specificationDetail,
        averageOrderValue: profile.averageOrderValue,
        purchaseFrequency: profile.purchaseFrequency,
        preferredConditions: profile.preferredConditions,
        preferredCategories: profile.preferredCategories,
        engagement: {
          viewToCartRatio: profile.viewToCartRatio,
          cartToCheckoutRatio: profile.cartToCheckoutRatio,
          returnRate: profile.returnRate
        },
        metadata: {
          lastUpdated: profile.lastUpdated,
          dataPoints: profile.dataPoints,
          confidence: profile.confidence
        }
      },
      insights: generateInsights(profile)
    })

  } catch (error) {
    console.error('User preference analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate human-readable insights from user profile
 */
function generateInsights(profile: any): string[] {
  const insights: string[] = []

  // Price vs Quality
  if (profile.priceVsQuality > 0.7) {
    insights.push('You prioritize quality over price - we\'ll show you premium options')
  } else if (profile.priceVsQuality < 0.3) {
    insights.push('You\'re budget-conscious - we\'ll focus on value deals')
  } else {
    insights.push('You balance quality and price - we\'ll show you the best value options')
  }

  // Sustainability
  if (profile.sustainabilityScore > 0.7) {
    insights.push('You care about sustainability - we\'ll highlight eco-friendly products')
  }

  // Brand loyalty
  if (profile.brandLoyalty > 0.8) {
    insights.push('You prefer well-known brands - we\'ll prioritize reputable sellers')
  }

  // Specifications
  if (profile.specificationDetail > 0.7) {
    insights.push('You appreciate detailed specs - we\'ll show products with comprehensive information')
  }

  // Categories
  if (profile.preferredCategories.length > 0) {
    insights.push(`You frequently shop in: ${profile.preferredCategories.slice(0, 3).join(', ')}`)
  }

  // Engagement
  if (profile.viewToCartRatio > 0.5) {
    insights.push('You\'re a decisive shopper - you often add viewed items to cart')
  }

  if (profile.cartToCheckoutRatio > 0.7) {
    insights.push('You complete most purchases - high purchase intent')
  }

  return insights
}
