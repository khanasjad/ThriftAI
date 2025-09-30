import { NextRequest, NextResponse } from 'next/server'
import { mockAmazonService } from '@/lib/services/mockAmazonService'
import { AIService } from '@/lib/services/aiService'
import { MarketplaceAggregator } from '@/lib/services/marketplaceAggregator'
import { ProductScoringService } from '@/lib/services/productScoringService'
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

    logger.info('Enhanced search request', {
      query,
      filters,
      pagination,
      sorting,
      includeMetadata
    })

    // Use the enhanced search method
    const searchResults = await mockAmazonService.searchProductsEnhanced(query, {
      filters,
      pagination,
      sorting,
      includeMetadata
    })

    logger.info('Enhanced search completed', {
      totalResults: searchResults.metadata.total,
      page: searchResults.metadata.page,
      resultsReturned: searchResults.products.length
    })

    // MARKETPLACE COMPARISON: Aggregate products from all sources
    let comparisonData = null
    try {
      const aggregator = new MarketplaceAggregator()
      const aggregatedResults = await aggregator.searchAllMarketplaces({
        query,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sources: ['thriftai', 'amazon', 'ebay']  // Can be made configurable
      })

      // Score all products and get top 5
      const topProducts = ProductScoringService.getTopN(aggregatedResults.results, 5)
      const insights = ProductScoringService.calculateInsights(topProducts)

      comparisonData = {
        topProducts,
        insights
      }

      logger.info('Marketplace comparison completed', {
        totalCompared: aggregatedResults.results.length,
        topScore: topProducts[0]?.score.total,
        sources: Object.keys(insights.sourceBreakdown)
      })
    } catch (error) {
      logger.error('Marketplace comparison failed', { error: error.message })
      // Continue without comparison data - it's optional
    }

    // Add Claude AI integration
    let claudeResponse = ''
    let sustainabilityInsights = null

    if (searchResults.products.length > 0 && AIService.isClaudeAvailable()) {
      try {
        logger.info('Generating Claude AI response for query:', query)
        const claudeSearchResult = await AIService.claudeSearch(query, budget, { sorting })
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