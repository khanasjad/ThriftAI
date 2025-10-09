/**
 * Intelligent Search Lite API Endpoint
 *
 * Smart search with typo correction and semantic understanding
 * WITHOUT requiring any API calls or embeddings
 *
 * Features:
 * - Typo correction: "tshrt" → "t-shirt"
 * - Price extraction: "under $500" → maxPrice filter
 * - Multi-field search (name, description, brand)
 * - 100% local processing
 *
 * POST /api/intelligent-search-lite
 * Body: { query: string, limit?: number }
 *
 * Cost: $0 per search | No rate limits | Fast (<100ms)
 */

import { NextRequest, NextResponse } from 'next/server'
import { intelligentSearchLite } from '@/lib/services/intelligentSearchLite'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/intelligent-search-lite
 *
 * Request Body:
 * {
 *   "query": "looking for tshrt under $50",
 *   "limit": 20
 * }
 *
 * Response:
 * {
 *   "query": {
 *     "original": "looking for tshrt under $50",
 *     "corrected": "t-shirt under $50",
 *     "appliedFilters": {
 *       "priceRange": { "max": 50 }
 *     }
 *   },
 *   "results": [...],
 *   "insights": {
 *     "totalFound": 150,
 *     "typosCorrected": ["tshrt" → "t-shirt"],
 *     "searchedFields": ["name", "description", "brand"]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { query, limit = 20 } = body

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Query parameter is required and must be a string',
          example: { query: 'looking for laptop under $500', limit: 20 }
        },
        { status: 400 }
      )
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty query', message: 'Query cannot be empty' },
        { status: 400 }
      )
    }

    logger.info('Intelligent search lite request received', { query, limit })

    // Perform intelligent search (local, no API calls)
    const response = await intelligentSearchLite.search(query, Math.min(limit, 100))

    const processingTime = Date.now() - startTime

    logger.info('Intelligent search lite completed successfully', {
      query,
      resultsFound: response.results.length,
      typosCorrected: response.insights.typosCorrected.length,
      processingTime
    })

    return NextResponse.json({
      ...response,
      metadata: {
        ...response.metadata,
        processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error('Intelligent search lite failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    })

    // Generic error response
    return NextResponse.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      debug: process.env.NODE_ENV === 'development' ? {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 })
  }
}

/**
 * GET /api/intelligent-search-lite/status
 *
 * Check system status
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ready',
      service: 'intelligent-search-lite',
      features: {
        typoCorrection: 'enabled',
        semanticSearch: 'multi-field',
        priceExtraction: 'enabled',
        categoryDetection: 'enabled'
      },
      requirements: {
        apiKeys: 'none',
        embeddings: 'none',
        rateLimits: 'none'
      },
      performance: {
        averageResponseTime: '<100ms',
        costPerSearch: '$0'
      },
      capabilities: [
        'Typo correction (tshrt → t-shirt)',
        'Price extraction (under $500)',
        'Category detection from keywords',
        'Multi-field search (name, description, brand)',
        'Smart scoring and ranking'
      ]
    })
  } catch (error) {
    logger.error('Status check failed', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json({
      status: 'error',
      error: 'Failed to check status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
