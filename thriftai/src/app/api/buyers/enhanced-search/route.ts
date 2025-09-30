import { NextRequest, NextResponse } from 'next/server'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { logger } from '@/lib/logger'

/**
 * ENHANCED SEARCH - NEW ARCHITECTURE
 *
 * Natural Language → Claude JSON Filters → Safe DB Query → Results
 *
 * This replaces the old complex search with a simpler, safer approach:
 * 1. User types natural language query (e.g., "Find vintage designer bags under $200")
 * 2. Claude generates structured JSON filters (searchTerms, category, priceRange, etc.)
 * 3. Safe parameterized Prisma query executes (NO SQL injection possible)
 * 4. Return products with metadata
 *
 * Benefits:
 * - Much simpler codebase (1 file vs 10+ services)
 * - More secure (parameterized queries only)
 * - Better intent understanding (Claude Haiku)
 * - Fallback to marketplace if DB is empty
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query = '',
      filters = {},
      pagination = { page: 1, limit: 20 },
      sorting = { field: 'relevance', direction: 'desc' },
      includeMetadata = true
    } = body

    logger.info('🔍 Enhanced search request (NEW ARCHITECTURE)', {
      query,
      filters,
      pagination
    })

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Query is required',
          products: [],
          metadata: { total: 0, page: 1, totalPages: 0, limit: 20 }
        },
        { status: 400 }
      )
    }

    // STEP 1: Generate structured query from natural language using Claude
    logger.info('📝 Generating structured query with Claude...')
    const structuredFilters = await structuredQueryGenerator.generateQuery(query)

    logger.info('✅ Structured query generated', {
      searchTerms: structuredFilters.searchTerms,
      category: structuredFilters.category,
      confidence: structuredFilters.confidence,
      intent: structuredFilters.intent,
      needsClarification: !!structuredFilters.needsClarification
    })

    // Merge with any manual filters from UI
    if (filters.category) structuredFilters.category = filters.category
    if (filters.minPrice !== undefined) structuredFilters.minPrice = filters.minPrice
    if (filters.maxPrice !== undefined) structuredFilters.maxPrice = filters.maxPrice
    if (filters.brands && Array.isArray(filters.brands)) {
      structuredFilters.brands = filters.brands
    }
    if (filters.condition && Array.isArray(filters.condition)) {
      structuredFilters.condition = filters.condition
    }

    // Apply pagination
    const limit = pagination.limit || 20
    const page = pagination.page || 1
    structuredFilters.limit = limit
    structuredFilters.offset = (page - 1) * limit

    // Apply sorting
    const sortingField = sorting.field || 'relevance'
    const sortingDirection = sorting.direction || 'desc'

    if (sortingField === 'price') {
      structuredFilters.sortBy = 'price'
      structuredFilters.sortDirection = sortingDirection as 'asc' | 'desc'
    } else if (sortingField === 'date') {
      structuredFilters.sortBy = 'date'
      structuredFilters.sortDirection = sortingDirection as 'asc' | 'desc'
    } else if (sortingField === 'rating') {
      structuredFilters.sortBy = 'rating'
      structuredFilters.sortDirection = sortingDirection as 'asc' | 'desc'
    } else {
      structuredFilters.sortBy = 'relevance'
    }

    // STEP 2: Execute safe parameterized query (with marketplace fallback)
    logger.info('🔒 Executing safe query...')
    const results = await safeQueryExecutor.executeWithMarketplace(structuredFilters)

    logger.info('✅ Search completed', {
      productsFound: results.products.length,
      total: results.total,
      page: results.page,
      totalPages: results.totalPages
    })

    // Return results in format compatible with existing frontend
    return NextResponse.json({
      products: results.products,
      metadata: {
        total: results.total,
        page: results.page,
        totalPages: results.totalPages,
        limit: limit,
        query: query,
        appliedFilters: {
          searchTerms: structuredFilters.searchTerms,
          category: structuredFilters.category,
          priceRange: {
            min: structuredFilters.minPrice,
            max: structuredFilters.maxPrice
          },
          brands: structuredFilters.brands,
          condition: structuredFilters.condition
        },
        aiInsights: {
          intent: structuredFilters.intent,
          confidence: structuredFilters.confidence,
          needsClarification: structuredFilters.needsClarification
        },
        sorting: {
          field: structuredFilters.sortBy,
          direction: structuredFilters.sortDirection
        }
      },
      // Include comparison data for backward compatibility with existing UI
      comparisonData: {
        topProducts: results.products.slice(0, 3).map(p => ({
          id: p.id || p.asin,
          asin: p.asin || p.id,
          title: p.name || p.title,
          name: p.name || p.title,
          brand: p.brand || p.specifications?.brand,
          price: p.price?.current || p.price || 0,
          totalCost: p.price?.current || p.price || 0,
          condition: p.condition || p.specifications?.condition,
          rating: p.rating || p.reviews?.rating || 0,
          source: 'ThriftAI',
          relevanceScore: 40,
          priceScore: 25,
          totalScore: 65,
          score: {
            relevance: 40,
            price: 25,
            total: 65
          }
        })),
        totalSources: 1,
        searchStrategy: 'structured_query_generation'
      }
    })

  } catch (error) {
    logger.error('❌ Search error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        products: [],
        metadata: {
          total: 0,
          page: 1,
          totalPages: 0,
          limit: 20,
          query: '',
          appliedFilters: {},
          aiInsights: {
            intent: 'search_error',
            confidence: 0
          }
        },
        comparisonData: {
          topProducts: [],
          totalSources: 0,
          searchStrategy: 'error'
        }
      },
      { status: 500 }
    )
  }
}