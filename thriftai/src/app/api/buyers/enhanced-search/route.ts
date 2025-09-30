import { NextRequest, NextResponse } from 'next/server'
import { mockAmazonService } from '@/lib/services/mockAmazonService'
import { AIService } from '@/lib/services/aiService'
import { MarketplaceAggregator } from '@/lib/services/marketplaceAggregator'
import { ProductScoringService } from '@/lib/services/productScoringService'
import { claudeIntentExtractor } from '@/lib/services/claudeIntentExtractor'
import { intelligentQueryOptimizer } from '@/lib/services/intelligentQueryOptimizer'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query = '',
      filters = {},
      pagination = { page: 1, limit: 20 },
      sorting = { field: 'relevance', direction: 'desc' },
      includeMetadata = true,
      budget = null
    } = body

    logger.info('🔍 Enhanced search request', {
      query,
      filters,
      pagination
    })

    // ✨ INTELLIGENT INTENT EXTRACTION: Parse budget and constraints from query text
    logger.info('🎯 Starting intent extraction for query:', query)
    const intent = await claudeIntentExtractor.extractIntent({
      messages: [],
      currentQuery: query
    })
    logger.info('🎯 Intent extraction completed')

    logger.info('✅ Intent extracted from query', {
      originalQuery: query,
      normalizedQuery: intent.normalizedQuery,
      maxPrice: intent.hardFilters.maxPrice,
      minPrice: intent.hardFilters.minPrice,
      category: intent.hardFilters.category,
      keywords: intent.keywords
    })

    // Use normalized query if available (fixes typos and variations)
    const searchQuery = intent.normalizedQuery || query

    if (intent.normalizedQuery && intent.normalizedQuery !== query.toLowerCase()) {
      logger.info('🔄 Using normalized query', {
        original: query,
        normalized: intent.normalizedQuery
      })
    }

    // Merge extracted intent with explicit filters (explicit filters take precedence)
    const mergedFilters = {
      ...filters,
      priceRange: {
        min: filters.minPrice || intent.hardFilters.minPrice || filters.priceRange?.min,
        max: filters.maxPrice || intent.hardFilters.maxPrice || filters.priceRange?.max
      },
      categories: filters.categories || (intent.hardFilters.category ? [intent.hardFilters.category] : undefined),
      brands: filters.brands || intent.softPreferences.brands,
      condition: filters.condition || intent.hardFilters.condition
    }

    // Use the enhanced search method with NORMALIZED query and merged filters
    const searchResults = await mockAmazonService.searchProductsEnhanced(searchQuery, {
      filters: mergedFilters,
      pagination,
      sorting,
      includeMetadata
    })

    logger.info('✅ Enhanced search completed', {
      totalResults: searchResults.metadata.total,
      page: searchResults.metadata.page,
      resultsReturned: searchResults.products.length
    })

    // MARKETPLACE COMPARISON: Aggregate products from all sources with HARD FILTERS
    let comparisonData = null
    try {
      const aggregator = new MarketplaceAggregator()
      const aggregatedResults = await aggregator.searchAllMarketplaces({
        query: searchQuery,  // Use normalized query
        category: mergedFilters.categories?.[0],
        minPrice: mergedFilters.priceRange?.min,
        maxPrice: mergedFilters.priceRange?.max,
        sources: ['thriftai', 'amazon', 'ebay'],
        limit: 20  // Limit per source
      })

      // Score all products and get top 5
      const topProducts = ProductScoringService.getTopN(aggregatedResults.results, 5)
      const insights = ProductScoringService.calculateInsights(topProducts)

      comparisonData = {
        topProducts,
        insights,
        intentUsed: {
          maxPrice: mergedFilters.priceRange?.max,
          minPrice: mergedFilters.priceRange?.min,
          category: mergedFilters.categories?.[0]
        }
      }

      logger.info('✅ Marketplace comparison completed', {
        totalCompared: aggregatedResults.results.length,
        topScore: topProducts[0]?.score.total,
        sources: Object.keys(insights.sourceBreakdown),
        appliedFilters: {
          maxPrice: mergedFilters.priceRange?.max,
          minPrice: mergedFilters.priceRange?.min
        }
      })
    } catch (error) {
      logger.error('❌ Marketplace comparison failed', { error: error.message })
      // Continue without comparison data - it's optional
    }

    // Add Claude AI integration
    let claudeResponse = ''
    let sustainabilityInsights = null

    if (searchResults.products.length > 0 && AIService.isClaudeAvailable()) {
      try {
        logger.info('Generating Claude AI response for query:', searchQuery)
        const claudeSearchResult = await AIService.claudeSearch(searchQuery, budget, { sorting })
        claudeResponse = claudeSearchResult.aiResponse || ''
        sustainabilityInsights = claudeSearchResult.sustainabilityInsights || null
      } catch (error) {
        logger.error('Claude AI generation failed', { error: error.message })
      }
    } else if (searchResults.products.length > 0) {
      // Fallback AI response when Claude is unavailable
      const avgPrice = searchResults.products.reduce((sum, p) => sum + p.price.current, 0) / searchResults.products.length
      const topBrands = [...new Set(searchResults.products.slice(0, 5).map(p => p.brand))].join(', ')

      claudeResponse = `🛍️ **Smart Shopping Analysis for "${query}"**

📊 **Product Highlights:**
• Found ${searchResults.products.length} relevant items
• Average price: $${avgPrice.toFixed(2)}
• Top brands: ${topBrands}
• Best deals: Up to ${Math.max(...searchResults.products.map(p => p.price.discountPercentage || 0))}% off

💡 **Value Analysis:**
These thrift finds offer incredible value compared to retail prices. You're shopping sustainably while saving money on quality pre-owned items.

🌱 **Sustainability Impact:**
By choosing thrift shopping, you're:
• Reducing textile waste
• Supporting circular economy
• Lowering your carbon footprint
• Giving items a second life

💰 **Shopping Tips:**
• Check item conditions carefully
• Compare prices across similar items
• Look for items with authenticity guarantees
• Consider shipping costs in your budget

*Note: Add your ANTHROPIC_API_KEY to .env to unlock full Claude AI-powered shopping advice and personalized recommendations.*`

      sustainabilityInsights = {
        carbonFootprintReduced: Math.round(searchResults.products.length * 2.5) + " kg",
        itemsGivenSecondLife: searchResults.products.length,
        equivalentNewItemsAvoided: searchResults.products.length,
        sustainabilityScore: 85
      }
    }

    // Enhanced response with AI fields AND comparison data
    const enhancedResponse = {
      ...searchResults,
      aiResponse: claudeResponse,
      sustainabilityInsights: sustainabilityInsights,
      claudeAvailable: AIService.isClaudeAvailable(),
      comparisonData: comparisonData  // Add marketplace comparison data
    }

    return NextResponse.json(enhancedResponse)

  } catch (error) {
    logger.error('Enhanced search API error', { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}