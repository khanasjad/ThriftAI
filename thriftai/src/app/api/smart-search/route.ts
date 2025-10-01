/**
 * Smart Search API Endpoint
 *
 * Integrates all AI-powered search features:
 * - Price intent detection ("$20 shirt" → searches $15-$25)
 * - Vector semantic search
 * - Hybrid search (vector + keyword + AI score)
 * - Category and brand detection
 * - Price proximity scoring
 * - AI score filtering
 *
 * Example queries:
 * - "$20 comfortable shirt" → detects price, searches semantically
 * - "around $50 Nike running shoes" → flexible price, brand filter
 * - "laptop under $1000" → price ceiling, category detection
 */

import { NextRequest, NextResponse } from 'next/server'
import { priceIntentDetector, calculatePriceProximity } from '@/lib/services/priceIntentDetector'
import { vectorSearchService } from '@/lib/services/vectorSearchService'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const searchMethod = searchParams.get('method') || 'hybrid' // 'vector', 'hybrid', 'keyword'
    const minAiScore = parseFloat(searchParams.get('minScore') || '0')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    logger.info('Smart search request', { query, limit, searchMethod })

    // ===== STEP 1: Parse query with price intent =====
    const parsed = priceIntentDetector.parseQuery(query)

    logger.info('Query parsed', {
      original: parsed.originalQuery,
      product: parsed.productQuery,
      priceDetected: parsed.priceIntent.detected,
      priceRange: parsed.priceIntent.detected ? parsed.priceIntent.range : null,
      category: parsed.categoryIntent,
      brands: parsed.brandIntent
    })

    // ===== STEP 2: Perform search based on method =====
    let searchResults

    if (searchMethod === 'hybrid') {
      // Hybrid search: vector + keyword + AI score
      searchResults = await vectorSearchService.hybridSearch({
        query: parsed.productQuery,
        limit: limit * 2, // Get more for re-ranking
        offset,
        categoryFilter: parsed.categoryIntent ? [parsed.categoryIntent] : undefined,
        priceRange: parsed.priceIntent.detected ? parsed.priceIntent.range : undefined,
        minAiScore: minAiScore > 0 ? minAiScore : undefined,
        weights: {
          vector: 0.5,    // Semantic similarity
          keyword: 0.3,   // Text match
          aiScore: 0.2    // Quality score
        }
      })
    } else if (searchMethod === 'vector') {
      // Pure vector search
      searchResults = await vectorSearchService.search({
        query: parsed.productQuery,
        limit,
        offset,
        categoryFilter: parsed.categoryIntent ? [parsed.categoryIntent] : undefined,
        priceRange: parsed.priceIntent.detected ? parsed.priceIntent.range : undefined,
        minAiScore: minAiScore > 0 ? minAiScore : undefined
      })
    } else {
      // Fallback to simpler search if vector search fails
      return NextResponse.json(
        { error: 'Invalid search method. Use "vector" or "hybrid"' },
        { status: 400 }
      )
    }

    // ===== STEP 3: Apply price proximity scoring =====
    let rankedResults = searchResults.results.map(product => {
      let priceProximityScore = 0
      let priceProximityBonus = 0

      if (parsed.priceIntent.detected) {
        priceProximityScore = calculatePriceProximity(
          product.price,
          parsed.priceIntent.targetPrice,
          parsed.priceIntent.range
        )

        // Bonus points (0-10) for being close to target price
        priceProximityBonus = priceProximityScore * 10
      }

      return {
        ...product,
        priceProximityScore,
        finalScore: product.aiScore * 0.6 +             // 60% from AI quality score
                    product.similarity * 100 * 0.3 +     // 30% from semantic similarity
                    priceProximityBonus                  // 10% from price proximity
      }
    })

    // ===== STEP 4: Sort by final score and limit results =====
    rankedResults.sort((a, b) => b.finalScore - a.finalScore)
    rankedResults = rankedResults.slice(0, limit)

    // ===== STEP 5: Build response =====
    const processingTime = Date.now() - startTime

    const response = {
      query: {
        original: parsed.originalQuery,
        processed: parsed.productQuery,
        priceIntent: parsed.priceIntent.detected ? {
          targetPrice: parsed.priceIntent.targetPrice,
          range: parsed.priceIntent.range,
          flexibility: parsed.priceIntent.flexibility,
          confidence: parsed.priceIntent.confidence
        } : null,
        categoryIntent: parsed.categoryIntent,
        brandIntent: parsed.brandIntent
      },
      results: rankedResults.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.price,
        thumbnail: product.thumbnail,
        aiScore: product.aiScore,
        similarity: product.similarity,
        priceProximityScore: product.priceProximityScore,
        finalScore: product.finalScore,
        // Add helpful indicators
        isInPriceRange: parsed.priceIntent.detected
          ? product.price >= parsed.priceIntent.range.min && product.price <= parsed.priceIntent.range.max
          : true,
        isHighQuality: product.aiScore >= 80,
        isGoodValue: product.aiScore >= 70 && product.priceProximityScore > 0.7
      })),
      metadata: {
        totalFound: rankedResults.length,
        limit,
        offset,
        processingTime,
        searchMethod,
        filters: {
          priceRange: parsed.priceIntent.detected ? parsed.priceIntent.range : null,
          category: parsed.categoryIntent,
          brands: parsed.brandIntent,
          minAiScore: minAiScore > 0 ? minAiScore : null
        }
      },
      insights: generateSearchInsights(parsed, rankedResults)
    }

    logger.info('Smart search completed', {
      query: parsed.originalQuery,
      resultsFound: rankedResults.length,
      processingTime
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Smart search error', {
      query: request.nextUrl.searchParams.get('q'),
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate helpful insights about the search results
 */
function generateSearchInsights(parsed: any, results: any[]): string[] {
  const insights: string[] = []

  // Price insights
  if (parsed.priceIntent.detected) {
    const inRange = results.filter(r => r.isInPriceRange).length
    const percentage = ((inRange / results.length) * 100).toFixed(0)
    insights.push(`${percentage}% of results are within your price range ($${parsed.priceIntent.range.min}-$${parsed.priceIntent.range.max})`)

    if (parsed.priceIntent.flexibility === 'flexible') {
      insights.push('Using flexible price matching - results may vary from your target price')
    }
  }

  // Quality insights
  const highQuality = results.filter(r => r.isHighQuality).length
  if (highQuality > 0) {
    insights.push(`${highQuality} products have excellent AI quality scores (80+)`)
  }

  // Value insights
  const goodValue = results.filter(r => r.isGoodValue).length
  if (goodValue > 0) {
    insights.push(`${goodValue} products offer great value (high quality + good price)`)
  }

  // Category insights
  if (parsed.categoryIntent) {
    insights.push(`Filtered to ${parsed.categoryIntent} category`)
  }

  // Brand insights
  if (parsed.brandIntent && parsed.brandIntent.length > 0) {
    insights.push(`Showing products from: ${parsed.brandIntent.join(', ')}`)
  }

  // Recommendation
  if (results.length === 0) {
    insights.push('Try broadening your search or adjusting your price range')
  } else if (results.length < 5) {
    insights.push('Limited results found - consider trying a more general search')
  }

  return insights
}

/**
 * POST method for advanced searches with filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      filters = {},
      weights = { vector: 0.5, keyword: 0.3, aiScore: 0.2 },
      limit = 50,
      offset = 0
    } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Parse query
    const parsed = priceIntentDetector.parseQuery(query)

    // Merge parsed filters with provided filters
    const finalFilters = {
      categoryFilter: filters.categories || (parsed.categoryIntent ? [parsed.categoryIntent] : undefined),
      priceRange: filters.priceRange || (parsed.priceIntent.detected ? parsed.priceIntent.range : undefined),
      minAiScore: filters.minAiScore || undefined,
      similarityThreshold: filters.similarityThreshold || 0.5
    }

    // Perform hybrid search
    const searchResults = await vectorSearchService.hybridSearch({
      query: parsed.productQuery,
      limit,
      offset,
      ...finalFilters,
      weights
    })

    // Apply price proximity scoring
    const rankedResults = searchResults.results.map(product => ({
      ...product,
      priceProximityScore: parsed.priceIntent.detected
        ? calculatePriceProximity(product.price, parsed.priceIntent.targetPrice, parsed.priceIntent.range)
        : 1,
      finalScore: product.aiScore * 0.6 + product.similarity * 100 * 0.4
    }))

    return NextResponse.json({
      query: {
        original: parsed.originalQuery,
        processed: parsed.productQuery,
        priceIntent: parsed.priceIntent
      },
      results: rankedResults,
      metadata: {
        totalFound: rankedResults.length,
        limit,
        offset,
        filters: finalFilters,
        weights
      }
    })
  } catch (error) {
    logger.error('Smart search POST error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
