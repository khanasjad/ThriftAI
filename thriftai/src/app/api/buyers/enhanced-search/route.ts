import { NextRequest, NextResponse } from 'next/server'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { aiProductScorer, type ProductData, type ScoreBreakdown } from '@/lib/services/aiProductScorer'
import { generateOptimizedParams } from '@/lib/services/optimizedScoreParameters'
import { intelligentProductRanker, type ProductForRanking } from '@/lib/services/intelligentProductRanker'
import { universalScoringEngine, type VeritasScoreInput, type VeritasScore } from '@/lib/services/universalScoringEngine'
import { parameterEnrichmentService } from '@/lib/services/parameterEnrichmentService'
import { logger } from '@/lib/logger'
import { getPaginationConfig, getProductsConfig } from '@/config/search.config'

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
    // Load search configuration
    const paginationConfig = getPaginationConfig()
    const productsConfig = getProductsConfig()

    const body = await request.json()
    const {
      query = '',
      filters = {},
      pagination = { page: paginationConfig.defaultPage, limit: paginationConfig.defaultLimit },
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
          metadata: { total: 0, page: paginationConfig.defaultPage, totalPages: 0, limit: paginationConfig.defaultLimit }
        },
        { status: 400 }
      )
    }

    // STEP 1: Generate structured query from natural language using Claude
    logger.info('📝 Generating structured query with Claude...')
    logger.info(query)

    // Import prisma for dynamic category fetching
    const { prisma } = await import('@/lib/prisma')
    const structuredFilters = await structuredQueryGenerator.generateQuery(query, prisma)

    logger.info('✅ Structured query generated', {
      searchTerms: structuredFilters.searchTerms,
      categories: structuredFilters.categories,
      confidence: structuredFilters.confidence,
      intent: structuredFilters.intent,
      needsClarification: !!structuredFilters.needsClarification
    })

    // Merge with any manual filters from UI
    if (filters.category) structuredFilters.categories = [filters.category]
    if (filters.minPrice !== undefined) structuredFilters.minPrice = filters.minPrice
    if (filters.maxPrice !== undefined) structuredFilters.maxPrice = filters.maxPrice
    if (filters.brands && Array.isArray(filters.brands)) {
      structuredFilters.brands = filters.brands
    }
    if (filters.condition && Array.isArray(filters.condition)) {
      structuredFilters.condition = filters.condition
    }

    // Apply pagination (with config validation)
    const limit = Math.min(pagination.limit || paginationConfig.defaultLimit, paginationConfig.maxLimit)
    const page = Math.min(Math.max(pagination.page || paginationConfig.defaultPage, 1), paginationConfig.maxPage)
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

    // Generate available filters from results
    const availableFilters = {
      availableCategories: [] as Array<{ value: string; label: string; count: number }>,
      availableBrands: [] as Array<{ value: string; label: string; count: number }>,
      availableConditions: [] as Array<{ value: string; label: string; count: number }>,
      availableSizes: [] as Array<{ value: string; label: string; count: number }>,
      priceRange: { min: 0, max: 1000 }
    }

    // Extract unique values and counts
    const categoryMap = new Map<string, number>()
    const brandMap = new Map<string, number>()
    const conditionMap = new Map<string, number>()
    const sizeMap = new Map<string, number>()
    let minPrice = Infinity
    let maxPrice = 0

    results.products.forEach(p => {
      // Categories
      const category = p.category || 'Other'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)

      // Brands
      const brand = p.brand || p.specifications?.brand
      if (brand) {
        brandMap.set(brand, (brandMap.get(brand) || 0) + 1)
      }

      // Conditions
      const condition = p.condition || p.specifications?.condition
      if (condition) {
        conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1)
      }

      // Sizes
      const size = p.specifications?.size
      if (size) {
        sizeMap.set(size, (sizeMap.get(size) || 0) + 1)
      }

      // Price range
      const price = p.price?.current || p.price || 0
      if (price > 0) {
        minPrice = Math.min(minPrice, price)
        maxPrice = Math.max(maxPrice, price)
      }
    })

    // Convert to filter format
    availableFilters.availableCategories = Array.from(categoryMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    availableFilters.availableBrands = Array.from(brandMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    availableFilters.availableConditions = Array.from(conditionMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    availableFilters.availableSizes = Array.from(sizeMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    availableFilters.priceRange = {
      min: minPrice === Infinity ? 0 : Math.floor(minPrice),
      max: maxPrice === 0 ? 1000 : Math.ceil(maxPrice)
    }

    logger.info('📊 Available filters generated', {
      categories: availableFilters.availableCategories.length,
      brands: availableFilters.availableBrands.length,
      conditions: availableFilters.availableConditions.length,
      sizes: availableFilters.availableSizes.length,
      priceRange: availableFilters.priceRange
    })

    // STEP 3: Apply intelligent ranking using Claude Haiku
    logger.info('🧠 Applying intelligent ranking...')
    let intelligenceAnalysis = null
    let rerankedProducts = results.products

    try {
      // Prepare products for ranking
      const productsForRanking: ProductForRanking[] = results.products.map(p => ({
        id: p.id || p.asin || '',
        name: p.name || p.title || '',
        title: p.title || p.name,
        brand: p.brand,
        category: p.category,
        price: p.price?.current || p.price || 0,
        originalPrice: p.price?.original || p.originalPrice,
        description: p.description,
        condition: p.condition || p.specifications?.condition,
        specifications: p.specifications,
        dynamicSpecs: p.dynamicSpecs,
        reviews: p.reviews,
        aiScore: p.aiScore  // DB field stores Veritas Score™ (96-parameter scoring)
      }))

      // Get intelligent ranking from Claude
      intelligenceAnalysis = await intelligentProductRanker.rankProducts(
        productsForRanking,
        query,
        productsConfig.intelligentRankingLimit
      )

      // Re-order products based on intelligence ranking
      if (intelligenceAnalysis.rankedProducts.length > 0) {
        const rankedProductsMap = new Map(
          intelligenceAnalysis.rankedProducts.map(rp => [rp.id, rp])
        )

        // Add intelligence metadata to products (preserve original product structure)
        rerankedProducts = intelligenceAnalysis.rankedProducts.map(rp => {
          const originalProduct = results.products.find(p => (p.id || p.asin) === rp.id)
          if (!originalProduct) return null

          // IMPORTANT: Spread originalProduct first, then add ONLY intelligence fields
          // Do NOT spread rp as it has incompatible price structure
          return {
            ...originalProduct,
            intelligenceScore: rp.intelligenceScore,
            reasoning: rp.reasoning,
            pros: rp.pros,
            cons: rp.cons,
            bestFor: rp.bestFor,
            intelligenceRank: rp.rank
          }
        }).filter(Boolean)

        logger.info('✅ Intelligent ranking applied', {
          rerankedCount: rerankedProducts.length,
          topProduct: rerankedProducts[0]?.name,
          topScore: rerankedProducts[0]?.intelligenceScore
        })
      }
    } catch (error) {
      logger.error('⚠️  Intelligent ranking failed, using default order', { error })
      // Continue with original products if intelligence fails
      rerankedProducts = results.products
    }

    // STEP 4: Calculate Veritas Score™ for ALL products
    logger.info('🏆 Calculating Veritas Scores for all products...')

    // First, enrich all products with 96 parameters in batch
    const productsToEnrich = rerankedProducts.map(p => {
      const productPrice = p.price?.current || p.price || 0
      const productId = p.id || p.asin || ''
      const productCategory = p.category || structuredFilters.categories?.[0] || 'DEFAULT'

      const optimizedParams = generateOptimizedParams(
        productId,
        productPrice,
        productCategory,
        p.price?.original || p.originalPrice
      )

      const productData: ProductData = {
        id: productId,
        name: p.name || p.title || '',
        description: p.description,
        brand: p.brand || p.specifications?.brand,
        category: productCategory,
        price: productPrice,
        originalPrice: p.price?.original || p.originalPrice,
        currency: p.price?.currency || 'USD',
        sellerRating: p.sellerRating || optimizedParams.sellerRating,
        sellerTotalSales: p.sellerTotalSales || optimizedParams.sellerTotalSales,
        sellerResponseTime: optimizedParams.sellerResponseTime,
        condition: p.condition || p.specifications?.condition || 'good',
        hasWarranty: p.hasWarranty !== undefined ? p.hasWarranty : optimizedParams.hasWarranty,
        isAuthentic: true,
        certifications: p.certifications || [],
        rating: p.rating || p.reviews?.rating || optimizedParams.rating,
        reviewCount: p.reviews?.count || p.reviewCount || optimizedParams.reviewCount,
        recentReviewCount: optimizedParams.recentReviewCount,
        verifiedPurchaseRatio: optimizedParams.verifiedPurchaseRatio,
        shippingCost: p.shippingCost || optimizedParams.shippingCost,
        estimatedDeliveryDays: p.estimatedDeliveryDays || optimizedParams.estimatedDeliveryDays,
        hasFreeShipping: p.hasFreeShipping !== undefined ? p.hasFreeShipping : optimizedParams.hasFreeShipping,
        hasFastShipping: optimizedParams.hasFastShipping,
        hasTracking: true,
        returnPeriodDays: optimizedParams.returnPeriodDays,
        hasFreeReturns: p.hasFreeReturns !== undefined ? p.hasFreeReturns : optimizedParams.hasFreeReturns,
        inStock: p.availability?.inStock !== false,
        stockLevel: p.availability?.quantity || optimizedParams.stockLevel,
        viewsLast24h: optimizedParams.viewsLast24h,
        salesLast7Days: optimizedParams.salesLast7Days,
        cartAdditionsLast24h: optimizedParams.cartAdditionsLast24h,
        searchQuery: query,
        clickThroughRate: optimizedParams.clickThroughRate,
        conversionRate: optimizedParams.conversionRate,
        bounceRate: optimizedParams.bounceRate,
        hasExternalTraffic: false,
        socialMediaMentions: 0,
        sustainability: p.sustainability || false,
        madeInCountry: p.madeInCountry || undefined,
        marketAveragePrice: optimizedParams.marketAveragePrice,
        dynamicSpecs: p.dynamicSpecs // Include existing dynamicSpecs if available
      }

      return productData
    })

    // Enrich all products with 96 parameters (batch processing)
    logger.info('🔧 Enriching products with 96 parameters...')
    const enrichedProducts = await parameterEnrichmentService.enrichProducts(productsToEnrich, productsConfig.enrichmentBatchSize)
    logger.info('✅ Products enriched', {
      total: enrichedProducts.length,
      stats: parameterEnrichmentService.getBatchStatistics(enrichedProducts)
    })

    // Calculate Veritas Scores - USE DATABASE SCORES IF AVAILABLE
    rerankedProducts = await Promise.all(rerankedProducts.map(async (p, index) => {
      const enrichedProduct = enrichedProducts[index]

      // ✅ USE DATABASE aiScore IF AVAILABLE (already calculated with new formula)
      // Only recalculate if product doesn't have a score in database
      let veritasData: any

      if (p.aiScore && typeof p.aiScore === 'number') {
        // Use existing database score
        logger.info('📊 Using database aiScore for product', {
          productId: p.id,
          aiScore: p.aiScore
        })

        veritasData = {
          veritasScore: p.aiScore,
          veritasBadges: [],
          veritasRecommendation: p.aiScore >= 80 ? 'strong-buy' : p.aiScore >= 65 ? 'buy' : p.aiScore >= 50 ? 'consider' : 'wait',
          veritasConfidence: p.aiConfidence || 0.85,
          veritasInsights: [],
          veritasDataCompleteness: 0.90,
          veritasPillars: p.aiScoreBreakdown ? {
            quality: p.aiScoreBreakdown.qualityScore?.score || 0,
            value: p.aiScoreBreakdown.priceValue?.score || 0,
            trust: p.aiScoreBreakdown.trustScore?.score || 0,
            ux: (() => {
              // Calculate UX score from convenience properties if no score exists
              const conv = p.aiScoreBreakdown.convenience;
              if (!conv) return 0;
              if (typeof conv.score === 'number') return conv.score;
              // Calculate from properties
              let score = 0;
              if (conv.inStock) score += 30;
              if (conv.hasFreeShipping) score += 25;
              if (conv.hasFastShipping) score += 20;
              if (conv.hasTracking) score += 15;
              if (conv.estimatedDeliveryDays <= 3) score += 10;
              return score;
            })(),
            sustainability: p.aiScoreBreakdown.emotional?.score || 0
          } : {
            quality: 0,
            value: 0,
            trust: 0,
            ux: 0,
            sustainability: 0
          }
        }
      } else {
        // Calculate fresh score if not in database
        logger.info('🔄 Calculating fresh Veritas Score for product', {
          productId: p.id
        })

        const veritasScore = await universalScoringEngine.calculateVeritasScore(enrichedProduct)
        veritasData = {
          veritasScore: veritasScore.veritasScore,
          veritasBadges: veritasScore.badges,
          veritasRecommendation: veritasScore.recommendation,
          veritasConfidence: veritasScore.confidence,
          veritasInsights: veritasScore.insights,
          veritasDataCompleteness: veritasScore.dataCompleteness,
          veritasPillars: {
            quality: veritasScore.pillars.productQuality.score,
            value: veritasScore.pillars.valueProposition.score,
            trust: veritasScore.pillars.trustAndSafety.score,
            ux: veritasScore.pillars.userExperience.score,
            sustainability: veritasScore.pillars.sustainability.score
          }
        }
      }

      return {
        ...p,
        ...veritasData,
        // ✅ Prefer database dynamicSpecs over enriched specs
        dynamicSpecs: p.dynamicSpecs || enrichedProduct.dynamicSpecs,
        companyMetrics: enrichedProduct.companyMetrics
      }
    }))

    // 🔍 DEBUG: Log dynamicSpecs for first product
    if (rerankedProducts.length > 0) {
      logger.info('🔍 First product dynamicSpecs check', {
        productName: rerankedProducts[0].name,
        hasDynamicSpecs: !!rerankedProducts[0].dynamicSpecs,
        dynamicSpecsKeys: rerankedProducts[0].dynamicSpecs ? Object.keys(rerankedProducts[0].dynamicSpecs) : [],
        dynamicSpecsCount: rerankedProducts[0].dynamicSpecs ? Object.keys(rerankedProducts[0].dynamicSpecs).length : 0
      })
    }

    logger.info('✅ Veritas Scores calculated for all products', {
      count: rerankedProducts.length,
      avgScore: (rerankedProducts.reduce((sum, p) => sum + (p.veritasScore || 0), 0) / rerankedProducts.length).toFixed(1)
    })

    // STEP 5: Final sorting by Veritas Score™ (primary ranking)
    // This ensures ALL views (grid, list, leaderboard) show consistent order
    // Veritas Score™ uses 96-parameter universal scoring with category-specific algorithms
    rerankedProducts.sort((a, b) => {
      const scoreA = a.veritasScore || 0
      const scoreB = b.veritasScore || 0
      return scoreB - scoreA
    })

    logger.info('✅ Products sorted by Veritas Score', {
      topProduct: rerankedProducts[0]?.name,
      topScore: rerankedProducts[0]?.veritasScore?.toFixed(1),
      lastProduct: rerankedProducts[rerankedProducts.length - 1]?.name,
      lastScore: rerankedProducts[rerankedProducts.length - 1]?.veritasScore?.toFixed(1)
    })

    // Calculate Veritas Score™ insights from scored products
    const productsWithVeritasScores = rerankedProducts.filter(p => p.veritasScore !== undefined && p.veritasScore !== null)
    const averageScore = productsWithVeritasScores.length > 0
      ? productsWithVeritasScores.reduce((sum, p) => sum + (p.veritasScore || 0), 0) / productsWithVeritasScores.length
      : undefined
    const highQualityCount = productsWithVeritasScores.filter(p => p.isHighQuality).length
    const priceIntentDetected = !!(structuredFilters.minPrice || structuredFilters.maxPrice)
    const priceRange = priceIntentDetected ? {
      min: structuredFilters.minPrice || 0,
      max: structuredFilters.maxPrice || Infinity
    } : undefined

    // Calculate AI scores for top products for comparison (legacy compatibility)
    // Use rerankedProducts (Veritas-sorted) instead of results.products (original order)
    const topProducts = rerankedProducts.slice(0, productsConfig.comparisonProductsCount)
    const scoredProducts = topProducts.map(p => {
      // Get product price and ID
      const productPrice = p.price?.current || p.price || 0
      const productId = p.id || p.asin || ''
      const productCategory = p.category || structuredFilters.categories?.[0] || 'DEFAULT'

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

      // Calculate legacy AI score (for backward compatibility)
      const scoreBreakdown: ScoreBreakdown = aiProductScorer.calculateScore(productData)

      // Use existing Veritas Score™ from product (already calculated in STEP 4)
      // This ensures consistency across all views
      return {
        product: p,
        productData,
        score: scoreBreakdown,
        veritasScore: p.veritasScore, // Use existing score, don't recalculate
        veritasBadges: p.veritasBadges,
        veritasRecommendation: p.veritasRecommendation,
        veritasPillars: p.veritasPillars,
        veritasInsights: p.veritasInsights,
        veritasConfidence: p.veritasConfidence,
        veritasDataCompleteness: p.veritasDataCompleteness
      }
    })

    // Parse imageUrl JSON strings into arrays for carousel
    const productsWithImages = rerankedProducts.map(product => {
      let images: string[] = []

      // Try to parse imageUrl as JSON array
      if (product.imageUrl) {
        try {
          const parsed = JSON.parse(product.imageUrl)
          images = Array.isArray(parsed) ? parsed : [product.imageUrl]
        } catch {
          // If parsing fails, treat as single image
          images = [product.imageUrl]
        }
      }

      return {
        ...product,
        images
      }
    })

    // Return results in format compatible with existing frontend
    return NextResponse.json({
      products: productsWithImages,
      metadata: {
        total: results.total,
        page: results.page,
        totalPages: results.totalPages,
        limit: limit,
        query: query,
        appliedFilters: {
          searchTerms: structuredFilters.searchTerms,
          categories: structuredFilters.categories,
          priceRange: {
            min: structuredFilters.minPrice,
            max: structuredFilters.maxPrice
          },
          brands: structuredFilters.brands,
          condition: structuredFilters.condition
        },
        // Add available filters for UI
        filters: {
          categories: availableFilters.availableCategories,
          brands: availableFilters.availableBrands,
          conditions: availableFilters.availableConditions,
          sizes: availableFilters.availableSizes,
          priceRange: availableFilters.priceRange
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
          totalScored: productsWithVeritasScores.length,
          // NEW: Intelligence layer insights
          intelligenceApplied: !!intelligenceAnalysis,
          queryUnderstanding: intelligenceAnalysis?.queryUnderstanding,
          overallInsight: intelligenceAnalysis?.overallInsight,
          recommendations: intelligenceAnalysis?.recommendations
        },
        sorting: {
          field: structuredFilters.sortBy,
          direction: structuredFilters.sortDirection
        }
      },
      // Include comparison data with real AI scores AND Veritas Scores
      comparisonData: {
        topProducts: scoredProducts.map(({ product: p, score, veritasScore, veritasBadges, veritasRecommendation, veritasPillars, veritasInsights, veritasConfidence, veritasDataCompleteness }) => {
          // Get dynamicSpecs and companyMetrics from product
          const dynamicSpecs = p.dynamicSpecs
          const companyMetrics = p.companyMetrics

          return {
          id: p.id || p.asin,
          asin: p.asin || p.id,
          title: p.name || p.title,
          name: p.name || p.title,
          brand: p.brand || p.specifications?.brand,
          price: p.price?.current || p.price || 0,
          totalCost: p.price?.current || p.price || 0,
          condition: p.condition || p.specifications?.condition,
          rating: p.rating || p.reviews?.rating || 0,
          source: 'Veritas.ai',

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

          // AI insights and recommendation (legacy)
          recommendation: score.recommendation,
          confidence: score.confidence,
          insights: score.insights,

          // NEW: Veritas Score™ data (use existing scores from product)
          veritasScore: veritasScore,
          veritasBadges: veritasBadges || [],
          veritasRecommendation: veritasRecommendation,
          veritasInsights: veritasInsights || [],
          veritasPillars: veritasPillars,
          veritasConfidence: veritasConfidence,
          veritasDataCompleteness: veritasDataCompleteness,

          // Include enriched 96-parameter data
          dynamicSpecs: dynamicSpecs,
          companyMetrics: companyMetrics
        }
        }),
        totalSources: 1,
        searchStrategy: 'veritas_96_parameter_scoring' // Updated strategy name
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
          filters: {
            categories: [],
            brands: [],
            conditions: [],
            sizes: [],
            priceRange: { min: 0, max: 1000 }
          },
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