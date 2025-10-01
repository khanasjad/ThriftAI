import { NextRequest, NextResponse } from 'next/server'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { aiProductScorer, type ProductData, type ScoreBreakdown } from '@/lib/services/aiProductScorer'
import { generateOptimizedParams } from '@/lib/services/optimizedScoreParameters'
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

    // Calculate AI insights from scored products in database
    const productsWithAIScores = results.products.filter(p => p.aiScore !== undefined && p.aiScore !== null)
    const averageScore = productsWithAIScores.length > 0
      ? productsWithAIScores.reduce((sum, p) => sum + (p.aiScore || 0), 0) / productsWithAIScores.length
      : undefined
    const highQualityCount = productsWithAIScores.filter(p => p.isHighQuality).length
    const priceIntentDetected = !!(structuredFilters.minPrice || structuredFilters.maxPrice)
    const priceRange = priceIntentDetected ? {
      min: structuredFilters.minPrice || 0,
      max: structuredFilters.maxPrice || Infinity
    } : undefined

    // Calculate AI scores for top products for comparison (legacy compatibility)
    const topProducts = results.products.slice(0, 3)
    const scoredProducts = topProducts.map(p => {
      // Get product price and ID
      const productPrice = p.price?.current || p.price || 0
      const productId = p.id || p.asin || ''
      const productCategory = p.category || structuredFilters.category || 'DEFAULT'

      // Generate optimized parameters based on real database statistics
      const optimizedParams = generateOptimizedParams(
        productId,
        productPrice,
        productCategory,
        p.price?.original || p.originalPrice
      )

      // Convert product to scorer format with optimized parameters
      const productData: ProductData = {
        id: productId,
        name: p.name || p.title || '',
        description: p.description,
        brand: p.brand || p.specifications?.brand,
        category: productCategory,

        // Pricing
        price: productPrice,
        originalPrice: p.price?.original || p.originalPrice,
        currency: p.price?.currency || 'USD',

        // Seller info (from optimized params)
        sellerRating: p.sellerRating || optimizedParams.sellerRating,
        sellerTotalSales: p.sellerTotalSales || optimizedParams.sellerTotalSales,
        sellerResponseTime: optimizedParams.sellerResponseTime,

        // Product quality
        condition: p.condition || p.specifications?.condition || 'good',
        hasWarranty: p.hasWarranty !== undefined ? p.hasWarranty : optimizedParams.hasWarranty,
        isAuthentic: true,
        certifications: p.certifications || [],

        // Reviews (from optimized params based on price tier and category)
        rating: p.rating || p.reviews?.rating || optimizedParams.rating,
        reviewCount: p.reviews?.count || p.reviewCount || optimizedParams.reviewCount,
        recentReviewCount: optimizedParams.recentReviewCount,
        verifiedPurchaseRatio: optimizedParams.verifiedPurchaseRatio,

        // Shipping (from optimized params)
        shippingCost: p.shippingCost || optimizedParams.shippingCost,
        estimatedDeliveryDays: p.estimatedDeliveryDays || optimizedParams.estimatedDeliveryDays,
        hasFreeShipping: p.hasFreeShipping !== undefined ? p.hasFreeShipping : optimizedParams.hasFreeShipping,
        hasFastShipping: optimizedParams.hasFastShipping,
        hasTracking: true,
        returnPeriodDays: optimizedParams.returnPeriodDays,
        hasFreeReturns: p.hasFreeReturns !== undefined ? p.hasFreeReturns : optimizedParams.hasFreeReturns,

        // Availability (from optimized params)
        inStock: p.availability?.inStock !== false,
        stockLevel: p.availability?.quantity || optimizedParams.stockLevel,
        viewsLast24h: optimizedParams.viewsLast24h,
        salesLast7Days: optimizedParams.salesLast7Days,
        cartAdditionsLast24h: optimizedParams.cartAdditionsLast24h,

        // Search relevance (from optimized params)
        searchQuery: query,
        clickThroughRate: optimizedParams.clickThroughRate,
        conversionRate: optimizedParams.conversionRate,
        bounceRate: optimizedParams.bounceRate,

        // External factors
        hasExternalTraffic: false,
        socialMediaMentions: 0,
        sustainability: p.sustainability || false,
        madeInCountry: p.madeInCountry || undefined,

        // Competition (from optimized params - uses category averages)
        marketAveragePrice: optimizedParams.marketAveragePrice
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
          needsClarification: structuredFilters.needsClarification,
          // NEW: Add 96-parameter AI scoring insights
          averageScore,
          highQualityCount,
          priceIntentDetected,
          priceRange,
          totalScored: productsWithAIScores.length
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