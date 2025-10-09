/**
 * Semantic Search API Endpoint
 *
 * Provides semantic search using OpenAI embeddings stored as JSON
 * Works without pgvector extension
 */

import { NextRequest, NextResponse } from 'next/server'
import { simpleSemanticSearch } from '@/lib/services/simpleSemanticSearch'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/semantic-search
 *
 * Query parameters:
 * - q: Search query (required)
 * - limit: Number of results (default: 20, max: 100)
 * - category: Filter by category
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - minSimilarity: Minimum similarity score (0-1, default: 0.5)
 *
 * Example: /api/semantic-search?q=laptop for gaming&limit=10&maxPrice=1000
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const category = searchParams.get('category') || undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.5')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    logger.info('Semantic search request', { query, limit, category })

    // Perform semantic search
    const results = await simpleSemanticSearch.search({
      query,
      limit,
      categoryFilter: category,
      priceRange: { min: minPrice, max: maxPrice },
      minSimilarity
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      query: {
        original: query,
        limit,
        filters: {
          category,
          priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
          minSimilarity
        }
      },
      results: results.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        brand: r.brand,
        price: r.price,
        imageUrl: r.imageUrl,
        similarity: Math.round(r.similarity * 100) / 100, // Round to 2 decimals
        relevancePercentage: Math.round(r.similarity * 100) // 0-100%
      })),
      metadata: {
        totalResults: results.length,
        processingTime,
        searchMethod: 'semantic',
        embeddingModel: 'text-embedding-3-large',
        topSimilarity: results[0] ? Math.round(results[0].similarity * 100) / 100 : null,
        avgSimilarity: results.length > 0
          ? Math.round((results.reduce((sum, r) => sum + r.similarity, 0) / results.length) * 100) / 100
          : null
      },
      insights: generateInsights(results, minSimilarity)
    })
  } catch (error) {
    logger.error('Semantic search error', {
      query: request.nextUrl.searchParams.get('q'),
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Semantic search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'Try using the standard search API instead'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate helpful insights about search results
 */
function generateInsights(results: any[], minSimilarity: number): string[] {
  const insights: string[] = []

  if (results.length === 0) {
    insights.push('No products found matching your search')
    insights.push('Try using broader search terms or reducing the minimum similarity threshold')
    return insights
  }

  // Similarity insights
  const topSimilarity = results[0].similarity
  if (topSimilarity > 0.9) {
    insights.push('Excellent matches found - top results are highly relevant')
  } else if (topSimilarity > 0.7) {
    insights.push('Good matches found - results are relevant to your search')
  } else if (topSimilarity > 0.5) {
    insights.push('Moderate matches found - consider refining your search')
  } else {
    insights.push('Limited matches found - try different search terms')
  }

  // Category diversity
  const categories = new Set(results.map(r => r.category))
  if (categories.size > 1) {
    insights.push(`Results span ${categories.size} categories: ${Array.from(categories).slice(0, 3).join(', ')}`)
  }

  // Price range
  const prices = results.map(r => r.price)
  const minPriceResult = Math.min(...prices)
  const maxPriceResult = Math.max(...prices)
  insights.push(`Price range: $${minPriceResult.toFixed(2)} - $${maxPriceResult.toFixed(2)}`)

  return insights
}

/**
 * POST /api/semantic-search/generate
 *
 * Generate embeddings for products
 * Body: { productIds?: string[], limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, limit = 10 } = body

    logger.info('Embedding generation request', {
      productIds: productIds?.length,
      limit
    })

    const result = await simpleSemanticSearch.generateBatchEmbeddings(productIds, limit)

    return NextResponse.json({
      success: true,
      result: {
        successful: result.successful,
        failed: result.failed,
        errors: result.errors.slice(0, 10) // Limit error messages
      }
    })
  } catch (error) {
    logger.error('Embedding generation error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Embedding generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
