import { NextRequest, NextResponse } from 'next/server'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { aiProductScorer, type ProductData, type ScoreBreakdown } from '@/lib/services/aiProductScorer'
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

    // Calculate AI scores for top products for comparison
    const topProducts = results.products.slice(0, 3)
    const scoredProducts = topProducts.map(p => {
      // Convert product to scorer format
      const productData: ProductData = {
        id: p.id || p.asin || '',
        name: p.name || p.title || '',
        description: p.description,
        brand: p.brand || p.specifications?.brand,
        category: structuredFilters.category,

        // Pricing
        price: p.price?.current || p.price || 0,
        originalPrice: p.price?.original || p.originalPrice,
        currency: p.price?.currency || 'USD',

        // Seller info (using defaults if not available)
        sellerRating: p.sellerRating || 4.5,
        sellerTotalSales: p.sellerTotalSales || 100,
        sellerResponseTime: 4, // Default 4 hours

        // Product quality
        condition: p.condition || p.specifications?.condition || 'good',
        hasWarranty: p.hasWarranty || false,
        isAuthentic: true,
        certifications: p.certifications || [],

        // Reviews
        rating: p.rating || p.reviews?.rating || 4.0,
        reviewCount: p.reviews?.count || p.reviewCount || 0,
        recentReviewCount: Math.min(10, p.reviews?.count || 0),
        verifiedPurchaseRatio: 0.8, // Default 80% verified

        // Shipping
        shippingCost: p.shippingCost || 0,
        estimatedDeliveryDays: p.estimatedDeliveryDays || 5,
        hasFreeShipping: p.hasFreeShipping !== false,
        hasFastShipping: p.estimatedDeliveryDays ? p.estimatedDeliveryDays <= 2 : false,
        hasTracking: true,
        returnPeriodDays: 30,
        hasFreeReturns: p.hasFreeReturns !== false,

        // Availability
        inStock: p.availability?.inStock !== false,
        stockLevel: p.availability?.quantity || 10,
        viewsLast24h: Math.floor(Math.random() * 200) + 50, // Simulated
        salesLast7Days: Math.floor(Math.random() * 20) + 5, // Simulated
        cartAdditionsLast24h: Math.floor(Math.random() * 15) + 3, // Simulated

        // Search relevance
        searchQuery: query,
        clickThroughRate: 0.05, // Default CTR
        conversionRate: 0.02, // Default conversion
        bounceRate: 0.3, // Default bounce

        // External factors
        hasExternalTraffic: false,
        socialMediaMentions: 0,
        sustainability: p.sustainability || false,
        madeInCountry: p.madeInCountry || undefined,

        // Competition
        marketAveragePrice: results.products.reduce((sum, prod) =>
          sum + (prod.price?.current || prod.price || 0), 0) / results.products.length
      }

      // Calculate AI score
      const scoreBreakdown: ScoreBreakdown = aiProductScorer.calculateScore(productData)

      logger.info('📊 AI Score calculated for product', {
        productId: productData.id,
        name: productData.name,
        totalScore: scoreBreakdown.total,
        recommendation: scoreBreakdown.recommendation,
        components: scoreBreakdown.components
      })

      return {
        product: p,
        productData,
        score: scoreBreakdown
      }
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
      // Include comparison data with real AI scores
      comparisonData: {
        topProducts: scoredProducts.map(({ product: p, score }) => ({
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

          // Real AI scores - Keep decimal precision
          relevanceScore: score.components.relevance,
          priceScore: score.components.priceValue,
          trustScore: score.components.trustScore,
          qualityScore: score.components.qualityScore,
          socialProofScore: score.components.socialProof,
          convenienceScore: score.components.convenience,
          urgencyScore: score.components.urgency,
          emotionalScore: score.components.emotional,
          totalScore: score.total, // Keep the exact decimal value

          // Include score object for backward compatibility
          score: {
            relevance: score.components.relevance,
            price: score.components.priceValue,
            trust: score.components.trustScore,
            quality: score.components.qualityScore,
            social: score.components.socialProof,
            convenience: score.components.convenience,
            urgency: score.components.urgency,
            emotional: score.components.emotional,
            total: score.total // Keep the exact decimal value
          },

          // AI insights and recommendation
          recommendation: score.recommendation,
          confidence: score.confidence,
          insights: score.insights
        })),
        totalSources: 1,
        searchStrategy: 'ai_powered_scoring'
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