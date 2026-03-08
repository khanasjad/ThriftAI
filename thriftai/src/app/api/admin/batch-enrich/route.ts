import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { productEnrichmentService } from '@/lib/services/productEnrichmentService'
import { veritasScoreService } from '@/lib/services/veritasScoreService'
import logger from '@/lib/logger'

/**
 * Batch Product Enrichment API
 *
 * This endpoint enriches products with data from multiple sources and recalculates Veritas scores.
 *
 * Data Sources Used:
 * - eBay API (seller trust, market pricing)
 * - Apple Warranty API (authentication for Apple products)
 * - Dell Warranty API (authentication for Dell products)
 * - iFixit API (repairability scores)
 * - Energy Star API (sustainability ratings)
 * - GSMArena (phone specifications via scraping)
 * - Alpha Vantage (company stock data)
 * - Database relationships (seller profiles, company data)
 *
 * Query Parameters:
 * - limit: Number of products to process (default: 10, max: 100)
 * - category: Filter by category (optional)
 * - minPrice: Minimum price filter (optional)
 * - maxPrice: Maximum price filter (optional)
 * - forceRefresh: Skip cache and re-fetch all data (default: false)
 */

interface EnrichmentStats {
  total: number
  successful: number
  failed: number
  skipped: number
  averageScoreChange: number
  processingTimeMs: number
  dataSourcesUsed: {
    [key: string]: number
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    logger.info('🚀 Starting batch product enrichment', {
      limit,
      category,
      minPrice,
      maxPrice,
      forceRefresh
    } as any)

    // Build query filters
    const whereClause: any = {
      isAvailable: true
    }

    if (category) {
      whereClause.category = category
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {}
      if (minPrice !== undefined) whereClause.price.gte = minPrice
      if (maxPrice !== undefined) whereClause.price.lte = maxPrice
    }

    // Fetch products to enrich
    const products = await prisma.product.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { aiScore: 'asc' }, // Prioritize products with lower/missing scores
        { createdAt: 'desc' }
      ]
    })

    logger.info(`📦 Found ${products.length} products to enrich`)

    const stats: EnrichmentStats = {
      total: products.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      averageScoreChange: 0,
      processingTimeMs: 0,
      dataSourcesUsed: {}
    }

    const results = []
    let totalScoreChange = 0

    // Process each product
    for (const product of products) {
      try {
        const productStartTime = Date.now()

        logger.info(`🔄 Processing product: ${product.id} - ${product.name}`)

        // Store old score
        const oldScore = product.aiScore || 0

        // Enrich product with data from multiple sources
        const enrichedProduct = await productEnrichmentService.enrichProduct(
          product.id,
          {
            fetchImages: true,
            fetchSpecs: true,
            fetchMarketData: true,
            overwriteExisting: forceRefresh
          }
        )

        // Calculate new Veritas score with enriched data
        const veritasScore = await veritasScoreService.calculateScore(product.id)

        // Update product in database
        await prisma.product.update({
          where: { id: product.id },
          data: {
            aiScore: veritasScore.overallScore,
            updatedAt: new Date()
          }
        })

        // Track which data sources were used
        if (enrichedProduct.dataSources) {
          enrichedProduct.dataSources.forEach((source: string) => {
            stats.dataSourcesUsed[source] = (stats.dataSourcesUsed[source] || 0) + 1
          })
        }

        const scoreChange = Number(veritasScore.overallScore) - Number(oldScore)
        totalScoreChange += scoreChange

        const processingTime = Date.now() - productStartTime

        // Calculate grade from score
        const grade = veritasScore.overallScore >= 95 ? 'S'
          : veritasScore.overallScore >= 85 ? 'A'
          : veritasScore.overallScore >= 75 ? 'B'
          : veritasScore.overallScore >= 65 ? 'C'
          : veritasScore.overallScore >= 50 ? 'D'
          : 'F'

        results.push({
          productId: product.id,
          productName: product.name,
          oldScore,
          newScore: veritasScore.overallScore,
          scoreChange,
          grade,
          ssn: veritasScore.ssn,
          confidence: veritasScore.confidence,
          processingTimeMs: processingTime,
          dataSources: enrichedProduct.dataSources || []
        })

        stats.successful++

        logger.info(`✅ Enriched product ${product.id}: ${oldScore} → ${veritasScore.overallScore} (${scoreChange >= 0 ? '+' : ''}${scoreChange.toFixed(2)})`)

      } catch (error) {
        logger.error(`❌ Failed to enrich product ${product.id}:`, error)

        results.push({
          productId: product.id,
          productName: product.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          failed: true
        })

        stats.failed++
      }
    }

    stats.averageScoreChange = stats.successful > 0 ? totalScoreChange / stats.successful : 0
    stats.processingTimeMs = Date.now() - startTime

    logger.info('🎉 Batch enrichment completed', {
      stats,
      topImprovers: results
        .filter(r => !r.failed && r.scoreChange)
        .sort((a, b) => (b.scoreChange || 0) - (a.scoreChange || 0))
        .slice(0, 5)
        .map(r => ({ name: r.productName, change: r.scoreChange }))
    } as any)

    return NextResponse.json({
      success: true,
      message: `Enriched ${stats.successful} products successfully`,
      stats,
      results,
      recommendations: generateRecommendations(stats)
    })

  } catch (error) {
    logger.error('❌ Batch enrichment failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

/**
 * Generate recommendations based on enrichment results
 */
function generateRecommendations(stats: EnrichmentStats): string[] {
  const recommendations: string[] = []

  // Success rate recommendations
  const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
  if (successRate < 70) {
    recommendations.push('⚠️ Low success rate detected. Check API keys and data source availability.')
  }

  // Data source diversity
  const sourceCount = Object.keys(stats.dataSourcesUsed).length
  if (sourceCount < 3) {
    recommendations.push('💡 Limited data sources used. Consider adding more API integrations for richer scoring.')
  }

  // Score improvement
  if (stats.averageScoreChange < 5) {
    recommendations.push('📊 Low average score improvement. Products may already be well-enriched or need better data sources.')
  } else if (stats.averageScoreChange > 10) {
    recommendations.push('🚀 Significant score improvements detected! Consider running enrichment on more products.')
  }

  // Processing time
  const avgTimePerProduct = stats.total > 0 ? stats.processingTimeMs / stats.total : 0
  if (avgTimePerProduct > 5000) {
    recommendations.push('⏱️ Slow processing detected. Consider implementing caching or parallel processing.')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Enrichment running optimally!')
  }

  return recommendations
}

/**
 * GET endpoint to check enrichment status
 */
export async function GET(request: NextRequest) {
  try {
    // Get enrichment statistics
    const totalProducts = await prisma.product.count({ where: { isAvailable: true } })
    const enrichedProducts = await prisma.product.count({
      where: {
        isAvailable: true,
        aiScore: { not: null }
      }
    })
    const needsEnrichment = totalProducts - enrichedProducts

    const avgScore = await prisma.product.aggregate({
      where: {
        isAvailable: true,
        aiScore: { not: null }
      },
      _avg: { aiScore: true }
    })

    const scoreDistribution = await prisma.product.groupBy({
      by: ['aiScore'],
      where: {
        isAvailable: true,
        aiScore: { not: null }
      },
      _count: true
    })

    // Calculate grade distribution
    const gradeDistribution = {
      'S (95-100)': 0,
      'A (85-94)': 0,
      'B (75-84)': 0,
      'C (65-74)': 0,
      'D (50-64)': 0,
      'F (0-49)': 0
    }

    scoreDistribution.forEach(item => {
      const score = Number(item.aiScore) || 0
      if (score >= 95) gradeDistribution['S (95-100)'] += item._count
      else if (score >= 85) gradeDistribution['A (85-94)'] += item._count
      else if (score >= 75) gradeDistribution['B (75-84)'] += item._count
      else if (score >= 65) gradeDistribution['C (65-74)'] += item._count
      else if (score >= 50) gradeDistribution['D (50-64)'] += item._count
      else gradeDistribution['F (0-49)'] += item._count
    })

    return NextResponse.json({
      success: true,
      catalog: {
        totalProducts,
        enrichedProducts,
        needsEnrichment,
        enrichmentRate: totalProducts > 0 ? (enrichedProducts / totalProducts * 100).toFixed(1) + '%' : '0%'
      },
      scoring: {
        averageScore: avgScore._avg.aiScore?.toFixed(2) || 'N/A',
        gradeDistribution
      },
      dataSourcesAvailable: [
        'Database (Seller Profiles, Company Data)',
        'eBay API (Market Data, Seller Trust)',
        'Apple Warranty API (Authentication)',
        'Dell Warranty API (Authentication)',
        'iFixit API (Repairability)',
        'Energy Star API (Sustainability)',
        'GSMArena (Phone Specs)',
        'Alpha Vantage (Stock Data)',
        'Yahoo Finance (Company Data)',
        'SSL Labs (Security)',
        'News API (Sentiment)',
        'Google Trends (Popularity)'
      ],
      recommendations: [
        needsEnrichment > 0 ? `🔄 ${needsEnrichment} products need enrichment` : '✅ All products enriched',
        (Number(avgScore._avg.aiScore) || 0) < 70 ? '📊 Consider adding more data sources to improve average score' : '🎯 Good average score across catalog',
        '💡 Use POST /api/admin/batch-enrich to start enrichment'
      ]
    })

  } catch (error) {
    logger.error('Failed to fetch enrichment status:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
