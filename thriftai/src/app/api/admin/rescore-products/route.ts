/**
 * Admin API - Batch Product Re-scoring
 *
 * Re-calculates Veritas Scores for all products with enriched 96 parameters.
 * This endpoint should be run after:
 * - Database migrations
 * - Algorithm updates
 * - New parameter defaults added
 *
 * POST /api/admin/rescore-products
 * Body: {
 *   productIds?: string[], // Optional: specific products to rescore
 *   forceRefresh?: boolean, // Force re-fetch company metrics (ignore cache)
 *   batchSize?: number      // Number of products per batch (default: 50)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parameterEnrichmentService } from '@/lib/services/parameterEnrichmentService'
import { universalScoringEngine } from '@/lib/services/universalScoringEngine'
import { ProductData } from '@/lib/services/aiProductScorer'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const {
      productIds = null,
      forceRefresh = false,
      batchSize = 50
    } = body

    logger.info('🔄 Starting batch product re-scoring', {
      productIds: productIds ? productIds.length : 'all',
      forceRefresh,
      batchSize
    })

    // STEP 1: Fetch products from database
    const whereClause = productIds && productIds.length > 0
      ? { id: { in: productIds } }
      : {} // Fetch all products

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        brand: true,
        category: true,
        price: true,
        originalPrice: true,
        condition: true,
        rating: true,
        reviewCount: true,
        sellerRating: true,
        sellerTotalSales: true,
        hasWarranty: true,
        certifications: true,
        shippingCost: true,
        estimatedDeliveryDays: true,
        hasFreeShipping: true,
        hasFreeReturns: true,
        inStock: true,
        stockLevel: true,
        sustainability: true,
        madeInCountry: true,
        dynamicSpecs: true,
        companyMetrics: true
      }
    })

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No products found to rescore',
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          processingTimeMs: Date.now() - startTime
        }
      })
    }

    logger.info('📦 Products fetched from database', {
      total: products.length
    })

    // STEP 2: Convert to ProductData format and enrich with 96 parameters
    const productsToEnrich: ProductData[] = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      brand: p.brand || undefined,
      category: p.category || undefined,
      price: p.price,
      originalPrice: p.originalPrice || undefined,
      currency: 'USD',
      condition: (p.condition as 'new' | 'like-new' | 'excellent' | 'good' | 'fair') || 'good',
      hasWarranty: p.hasWarranty || false,
      isAuthentic: true,
      certifications: Array.isArray(p.certifications) ? p.certifications as string[] : [],
      rating: p.rating || undefined,
      reviewCount: p.reviewCount || undefined,
      sellerRating: p.sellerRating || undefined,
      sellerTotalSales: p.sellerTotalSales || undefined,
      shippingCost: p.shippingCost || undefined,
      estimatedDeliveryDays: p.estimatedDeliveryDays || undefined,
      hasFreeShipping: p.hasFreeShipping || false,
      hasFreeReturns: p.hasFreeReturns || false,
      inStock: p.inStock !== false,
      stockLevel: p.stockLevel || undefined,
      sustainability: p.sustainability || false,
      madeInCountry: p.madeInCountry || undefined,
      dynamicSpecs: (p.dynamicSpecs as Record<string, unknown>) || undefined
    }))

    // Clear company metrics cache if forceRefresh
    if (forceRefresh) {
      logger.info('🔄 Clearing company metrics cache (forceRefresh=true)')
      const { companyMetricsService } = await import('@/lib/services/companyMetricsService')
      companyMetricsService.clearCache()
    }

    // Enrich products in batches
    logger.info('🔧 Enriching products with 96 parameters...')
    const enrichedProducts = await parameterEnrichmentService.enrichProducts(
      productsToEnrich,
      10 // Concurrency limit
    )

    const enrichmentStats = parameterEnrichmentService.getBatchStatistics(enrichedProducts)
    logger.info('✅ Products enriched', enrichmentStats)

    // STEP 3: Calculate Veritas Scores for all enriched products
    logger.info('🏆 Calculating Veritas Scores...')
    const scoredProducts = enrichedProducts.map(enrichedProduct => {
      const veritasScore = universalScoringEngine.calculateVeritasScore(enrichedProduct)

      return {
        id: enrichedProduct.id,
        veritasScore: veritasScore.veritasScore,
        confidence: veritasScore.confidence,
        dataCompleteness: veritasScore.dataCompleteness,
        badges: veritasScore.badges,
        recommendation: veritasScore.recommendation,
        insights: veritasScore.insights,
        pillars: {
          productQuality: veritasScore.pillars.productQuality.score,
          valueProposition: veritasScore.pillars.valueProposition.score,
          trustAndSafety: veritasScore.pillars.trustAndSafety.score,
          userExperience: veritasScore.pillars.userExperience.score,
          sustainability: veritasScore.pillars.sustainability.score
        },
        // Store enriched data
        companyMetrics: enrichedProduct.companyMetrics,
        dynamicSpecs: enrichedProduct.dynamicSpecs
      }
    })

    logger.info('✅ Veritas Scores calculated', {
      total: scoredProducts.length,
      avgScore: (scoredProducts.reduce((sum, p) => sum + p.veritasScore, 0) / scoredProducts.length).toFixed(1)
    })

    // STEP 4: Update database in batches
    logger.info('💾 Updating database with new scores...')
    let successCount = 0
    let failCount = 0
    const errors: Array<{ productId: string; error: string }> = []

    for (let i = 0; i < scoredProducts.length; i += batchSize) {
      const batch = scoredProducts.slice(i, i + batchSize)

      const updatePromises = batch.map(async (product) => {
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              // Map Veritas Score to aiScore field
              aiScore: product.veritasScore,
              aiConfidence: product.confidence,
              aiScoreBreakdown: {
                veritasScore: product.veritasScore,
                confidence: product.confidence,
                dataCompleteness: product.dataCompleteness,
                recommendation: product.recommendation,
                insights: product.insights,
                pillars: product.pillars
              },
              // Map badges to leaderboardBadges
              leaderboardBadges: product.badges,
              // Store enriched 96-parameter data
              companyMetrics: product.companyMetrics || null,
              dynamicSpecs: product.dynamicSpecs || null,
              lastScoredAt: new Date()
            }
          })
          successCount++
          return { success: true, productId: product.id }
        } catch (error) {
          failCount++
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push({ productId: product.id, error: errorMsg })
          logger.error('Error updating product score', {
            productId: product.id,
            error: errorMsg
          })
          return { success: false, productId: product.id, error: errorMsg }
        }
      })

      await Promise.all(updatePromises)

      // Log progress
      logger.info(`Progress: ${Math.min(i + batchSize, scoredProducts.length)}/${scoredProducts.length} products updated`)
    }

    const processingTime = Date.now() - startTime

    logger.info('✅ Batch re-scoring completed', {
      total: products.length,
      successful: successCount,
      failed: failCount,
      processingTimeMs: processingTime,
      avgTimePerProduct: (processingTime / products.length).toFixed(0) + 'ms'
    })

    return NextResponse.json({
      success: true,
      message: `Successfully re-scored ${successCount} products`,
      stats: {
        total: products.length,
        successful: successCount,
        failed: failCount,
        enrichmentStats,
        avgVeritasScore: (scoredProducts.reduce((sum, p) => sum + p.veritasScore, 0) / scoredProducts.length).toFixed(1),
        processingTimeMs: processingTime,
        avgTimePerProduct: Math.round(processingTime / products.length)
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    logger.error('❌ Batch re-scoring failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Batch re-scoring failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          processingTimeMs: Date.now() - startTime
        }
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check re-scoring status
export async function GET() {
  try {
    // Get statistics about scored products
    const [
      totalProducts,
      scoredProducts,
      productsWithCompanyMetrics,
      productsWithDynamicSpecs,
      avgAiScore,
      recentlyScored
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          aiScore: { not: null }
        }
      }),
      prisma.product.count({
        where: {
          companyMetrics: { not: null }
        }
      }),
      prisma.product.count({
        where: {
          dynamicSpecs: { not: null }
        }
      }),
      prisma.product.aggregate({
        _avg: {
          aiScore: true
        }
      }),
      prisma.product.findMany({
        where: {
          lastScoredAt: { not: null }
        },
        orderBy: {
          lastScoredAt: 'desc'
        },
        take: 10,
        select: {
          id: true,
          name: true,
          aiScore: true,
          lastScoredAt: true
        }
      })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        scoredProducts,
        unscoredProducts: totalProducts - scoredProducts,
        productsWithCompanyMetrics,
        productsWithDynamicSpecs,
        avgVeritasScore: avgAiScore._avg.aiScore?.toFixed(1) || 'N/A',
        scoringCompleteness: totalProducts > 0
          ? ((scoredProducts / totalProducts) * 100).toFixed(1) + '%'
          : '0%',
        parameterCompleteness: {
          companyMetrics: totalProducts > 0
            ? ((productsWithCompanyMetrics / totalProducts) * 100).toFixed(1) + '%'
            : '0%',
          dynamicSpecs: totalProducts > 0
            ? ((productsWithDynamicSpecs / totalProducts) * 100).toFixed(1) + '%'
            : '0%'
        }
      },
      recentlyScored
    })

  } catch (error) {
    logger.error('Error fetching re-scoring status', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch status'
      },
      { status: 500 }
    )
  }
}
