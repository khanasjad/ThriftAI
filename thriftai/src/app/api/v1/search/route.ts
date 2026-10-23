/**
 * Veritas B2B Search API
 *
 * POST /api/v1/search
 *
 * Provides semantic search with Veritas quality ranking for B2B clients
 * - Multi-tenant isolation
 * - Rate limiting per tenant
 * - Hybrid search (vector + SQL)
 * - Quality-based ranking
 * - Qdrant vector search integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, ApiAuthError } from '@/lib/middleware/apiAuth'
import { checkRateLimit, getRateLimitStatus, addRateLimitHeaders, RateLimitError } from '@/lib/middleware/tenantRateLimit'
import { b2bVectorSearchService } from '@/lib/services/b2bVectorSearch'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface SearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  brand?: string
  condition?: string
}

interface SearchRequest {
  query: string
  filters?: SearchFilters
  limit?: number
  offset?: number
  searchMode?: 'keyword' | 'vector' | 'hybrid' // Search strategy
}

interface SearchResult {
  id: string
  name: string
  category: string
  brand?: string | null
  price: number
  imageUrl?: string | null
  description?: string | null
  veritasScore?: number | null
  matchScore: number
  condition?: string | null
}

interface SearchResponse {
  query: {
    original: string
    filters: SearchFilters
  }
  results: SearchResult[]
  metadata: {
    total: number
    limit: number
    offset: number
    processingTime: number
    avgVeritasScore: number
    searchMethod: 'keyword' | 'vector' | 'hybrid' | 'veritas-b2b'
    qdrantLatency?: number
  }
}

/**
 * Perform keyword-based SQL search (fallback/legacy)
 */
async function performKeywordSearch(
  query: string,
  tenantId: string,
  filters: SearchFilters,
  limit: number,
  offset: number
): Promise<{
  query: { original: string; filters: SearchFilters }
  results: SearchResult[]
  metadata: {
    total: number
    limit: number
    offset: number
    avgVeritasScore: number
    searchMethod: 'keyword'
  }
}> {
  const where: any = {
    tenantId,
    isAvailable: true
  }

  // Apply search query - multi-field search
  if (query.trim()) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Apply filters
  if (filters.category) {
    where.category = filters.category
  }

  if (filters.brand) {
    where.brand = { contains: filters.brand, mode: 'insensitive' }
  }

  if (filters.condition) {
    where.condition = filters.condition
  }

  // Price range filtering
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice
    }
  }

  // Execute search
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        price: true,
        imageUrl: true,
        description: true,
        condition: true,
        aiScore: true,
        popularityScore: true,
        veritasScore: {
          select: {
            overallScore: true
          }
        }
      },
      orderBy: [
        { aiScore: 'desc' },
        { popularityScore: 'desc' }
      ],
      take: limit,
      skip: offset
    }),
    prisma.product.count({ where })
  ])

  // Calculate match scores and format results
  const results: SearchResult[] = products.map(product => {
    // Calculate match score based on query relevance
    let matchScore = 50 // Base score

    const queryLower = query.toLowerCase()
    const nameLower = product.name.toLowerCase()
    const descLower = (product.description || '').toLowerCase()
    const brandLower = (product.brand || '').toLowerCase()

    // Word boundary matching for better accuracy
    const wordBoundaryRegex = new RegExp(`\\b${queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')

    if (wordBoundaryRegex.test(nameLower)) {
      matchScore += 30
    } else if (nameLower.includes(queryLower)) {
      matchScore += 15
    }

    if (wordBoundaryRegex.test(descLower)) {
      matchScore += 15
    }

    if (wordBoundaryRegex.test(brandLower)) {
      matchScore += 20
    }

    // Boost for AI score
    if (product.aiScore) {
      matchScore += Number(product.aiScore) / 10
    }

    // Boost for popularity
    if (product.popularityScore) {
      matchScore += product.popularityScore / 20
    }

    // Cap at 100
    matchScore = Math.min(100, matchScore)

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      description: product.description,
      condition: product.condition,
      veritasScore: product.veritasScore?.overallScore
        ? Number(product.veritasScore.overallScore)
        : null,
      matchScore: Math.round(matchScore)
    }
  })

  // Sort by match score
  results.sort((a, b) => b.matchScore - a.matchScore)

  // Calculate average Veritas score
  const veritasScores = results
    .map(r => r.veritasScore)
    .filter((score): score is number => score !== null)

  const avgVeritasScore = veritasScores.length > 0
    ? veritasScores.reduce((sum, score) => sum + score, 0) / veritasScores.length
    : 0

  return {
    query: {
      original: query,
      filters
    },
    results,
    metadata: {
      total: totalCount,
      limit,
      offset,
      avgVeritasScore: Math.round(avgVeritasScore * 100) / 100,
      searchMethod: 'keyword'
    }
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Step 1: Authenticate tenant
    const tenant = await validateApiKey(req)

    // Step 2: Check rate limiting
    await checkRateLimit(tenant)

    // Step 3: Get rate limit status for headers
    const rateLimitStatus = await getRateLimitStatus(tenant.id, tenant.rateLimit)

    // Step 4: Parse request body
    const body: SearchRequest = await req.json()
    const {
      query,
      filters = {},
      limit = 20,
      offset = 0,
      searchMode = 'keyword' // Default to keyword search for backward compatibility
    } = body

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    logger.info('B2B search request', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      query,
      filters,
      limit,
      searchMode
    })

    // Step 5: Execute search based on mode
    let searchResponse: any

    if (searchMode === 'vector' || searchMode === 'hybrid') {
      // Use Qdrant vector search
      const qdrantStartTime = Date.now()

      try {
        searchResponse = await b2bVectorSearchService.search({
          query,
          tenantId: tenant.id,
          limit,
          offset,
          filters: {
            category: filters.category,
            brand: filters.brand,
            condition: filters.condition,
            priceRange: filters.minPrice !== undefined || filters.maxPrice !== undefined
              ? { min: filters.minPrice || 0, max: filters.maxPrice || Number.MAX_SAFE_INTEGER }
              : undefined
          },
          searchMode
        })

        searchResponse.metadata.qdrantLatency = Date.now() - qdrantStartTime

        logger.info('Vector search completed', {
          tenantId: tenant.id,
          query,
          resultsCount: searchResponse.results.length,
          qdrantLatency: searchResponse.metadata.qdrantLatency
        })
      } catch (error) {
        // Fallback to keyword search if vector search fails
        logger.warn('Vector search failed, falling back to keyword search', {
          tenantId: tenant.id,
          error: error instanceof Error ? error.message : String(error)
        })

        searchResponse = await performKeywordSearch(query, tenant.id, filters, limit, offset)
        searchResponse.metadata.searchMethod = 'keyword'
      }
    } else {
      // Use SQL keyword search
      searchResponse = await performKeywordSearch(query, tenant.id, filters, limit, offset)
    }

    const processingTime = Date.now() - startTime

    logger.info('B2B search completed', {
      tenantId: tenant.id,
      query,
      searchMode,
      resultsCount: searchResponse.results.length,
      totalCount: searchResponse.metadata.total,
      processingTime
    })

    // Step 6: Return results with rate limit headers
    const response: SearchResponse = {
      ...searchResponse,
      metadata: {
        ...searchResponse.metadata,
        processingTime
      }
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    addRateLimitHeaders(headers, rateLimitStatus)

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    })

  } catch (error) {
    // Handle authentication errors
    if (error instanceof ApiAuthError) {
      logger.warn('API authentication failed', {
        error: error.message,
        code: error.code
      })

      return NextResponse.json(
        {
          error: error.message,
          code: error.code
        },
        { status: error.statusCode }
      )
    }

    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      logger.warn('Rate limit exceeded', {
        error: error.message,
        limit: error.limit,
        remaining: error.remaining,
        retryAfter: error.retryAfter
      })

      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('X-RateLimit-Limit', error.limit.toString())
      headers.set('X-RateLimit-Remaining', error.remaining.toString())
      headers.set('Retry-After', error.retryAfter.toString())

      return new NextResponse(
        JSON.stringify({
          error: error.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: error.retryAfter
        }),
        {
          status: 429,
          headers
        }
      )
    }

    // Handle other errors
    logger.error('B2B search error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Add OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  })
}
