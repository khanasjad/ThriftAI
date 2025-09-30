import { MarketplaceAggregator } from './marketplaceAggregator'
import { ProductScoringService, ScoredProduct } from './productScoringService'
import { claudeIntentExtractor, StructuredIntent } from './claudeIntentExtractor'
import { intelligentQueryOptimizer } from './intelligentQueryOptimizer'
import { logger } from '@/lib/logger'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  products?: ScoredProduct[]
}

export interface SearchIntent {
  category?: string
  keywords: string[]
  budget?: { min?: number; max?: number }
  brands?: string[]
  conditions?: string[]
  useCase?: string
  priorities?: string[]  // e.g., ["price", "quality", "brand"]
}

export class ConversationalSearchService {
  private aggregator: MarketplaceAggregator

  constructor() {
    this.aggregator = new MarketplaceAggregator()
  }

  /**
   * Extract search intent from conversation history
   */
  extractIntent(conversation: ConversationMessage[], currentMessage: string): SearchIntent {
    const allMessages = [...conversation, { role: 'user' as const, content: currentMessage }]
    const userMessages = allMessages.filter(m => m.role === 'user').map(m => m.content.toLowerCase())
    const fullText = userMessages.join(' ')

    const intent: SearchIntent = {
      keywords: [],
      priorities: []
    }

    // Extract product categories
    const categoryPatterns = {
      'laptop': ['laptop', 'notebook', 'computer'],
      'phone': ['phone', 'smartphone', 'iphone', 'android'],
      'tablet': ['tablet', 'ipad'],
      'headphones': ['headphone', 'earphone', 'earbuds', 'airpods'],
      'watch': ['watch', 'smartwatch'],
      'camera': ['camera', 'dslr'],
      'shoes': ['shoe', 'sneaker', 'boot'],
      'clothing': ['shirt', 'pants', 'jeans', 'jacket', 'dress']
    }

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(p => fullText.includes(p))) {
        intent.category = category
        break
      }
    }

    // Extract budget constraints
    const budgetPatterns = [
      /under ?\$?(\d+)/i,
      /below ?\$?(\d+)/i,
      /less than ?\$?(\d+)/i,
      /max(?:imum)? ?\$?(\d+)/i,
      /budget (?:is |of )?\$?(\d+)/i,
      /around ?\$?(\d+)/i,
      /\$(\d+)(?:\s*(?:budget|max|maximum))?/i,
      /between ?\$?(\d+) (?:and|to|-) ?\$?(\d+)/i
    ]

    for (const pattern of budgetPatterns) {
      const match = fullText.match(pattern)
      if (match) {
        if (match[2]) {
          // Range: between $X and $Y
          intent.budget = {
            min: parseInt(match[1]),
            max: parseInt(match[2])
          }
        } else {
          // Single value: under $X
          intent.budget = { max: parseInt(match[1]) }
        }
        break
      }
    }

    // Extract brand preferences
    const brandPatterns = {
      'apple': ['apple', 'macbook', 'iphone', 'ipad', 'airpods'],
      'samsung': ['samsung', 'galaxy'],
      'dell': ['dell', 'xps', 'inspiron'],
      'hp': ['hp', 'hewlett'],
      'lenovo': ['lenovo', 'thinkpad'],
      'microsoft': ['microsoft', 'surface'],
      'sony': ['sony'],
      'nike': ['nike'],
      'adidas': ['adidas']
    }

    for (const [brand, patterns] of Object.entries(brandPatterns)) {
      if (patterns.some(p => fullText.includes(p))) {
        if (!intent.brands) intent.brands = []
        intent.brands.push(brand)
      }
    }

    // Extract condition preferences
    if (fullText.includes('new') && !fullText.includes('like new')) {
      intent.conditions = ['new']
    } else if (fullText.includes('like new') || fullText.includes('mint')) {
      intent.conditions = ['like-new', 'new']
    } else if (fullText.includes('refurbished')) {
      intent.conditions = ['refurbished']
    } else if (fullText.includes('used')) {
      intent.conditions = ['used', 'good', 'very-good']
    }

    // Extract use case
    const useCasePatterns = {
      'gaming': ['gaming', 'games', 'gamer'],
      'work': ['work', 'office', 'business', 'professional'],
      'school': ['school', 'college', 'student', 'studying'],
      'coding': ['coding', 'programming', 'developer', 'software'],
      'creative': ['photo', 'video', 'editing', 'design', 'creative'],
      'casual': ['casual', 'browsing', 'web', 'email']
    }

    for (const [useCase, patterns] of Object.entries(useCasePatterns)) {
      if (patterns.some(p => fullText.includes(p))) {
        intent.useCase = useCase
        break
      }
    }

    // Extract priorities
    if (fullText.includes('cheap') || fullText.includes('affordable') || fullText.includes('budget')) {
      intent.priorities?.push('price')
    }
    if (fullText.includes('quality') || fullText.includes('premium') || fullText.includes('best')) {
      intent.priorities?.push('quality')
    }
    if (fullText.includes('fast shipping') || fullText.includes('quick delivery')) {
      intent.priorities?.push('shipping')
    }
    if (fullText.includes('brand') || fullText.includes('reliable')) {
      intent.priorities?.push('brand')
    }

    // Build keywords from category, use case, and brands
    if (intent.category) {
      intent.keywords.push(intent.category)
    }
    if (intent.useCase) {
      intent.keywords.push(intent.useCase)
    }
    if (intent.brands) {
      intent.keywords.push(...intent.brands)
    }

    // Extract additional keywords from last user message
    const lastMessage = currentMessage.toLowerCase()
    const words = lastMessage.split(/\s+/)
    const importantWords = words.filter(w =>
      w.length > 3 &&
      !['what', 'when', 'where', 'which', 'need', 'want', 'looking', 'find', 'show', 'help'].includes(w)
    )
    intent.keywords.push(...importantWords.slice(0, 3))

    return intent
  }

  /**
   * Build search query from intent
   */
  buildSearchQuery(intent: SearchIntent): string {
    const parts: string[] = []

    if (intent.category) {
      parts.push(intent.category)
    }

    if (intent.brands && intent.brands.length > 0) {
      parts.push(intent.brands[0])
    }

    if (intent.useCase) {
      parts.push(intent.useCase)
    }

    // Fallback to keywords
    if (parts.length === 0 && intent.keywords.length > 0) {
      parts.push(...intent.keywords.slice(0, 2))
    }

    return parts.join(' ')
  }

  /**
   * Search products based on conversation context using intelligent 5-phase pipeline
   */
  async searchBasedOnConversation(
    conversation: ConversationMessage[],
    currentMessage: string
  ): Promise<{
    products: ScoredProduct[]
    intent: StructuredIntent
    queryMetadata: any
  }> {
    try {
      logger.info('🚀 Starting intelligent conversational search', {
        messageCount: conversation.length,
        currentMessage: currentMessage.substring(0, 50)
      })

      // PHASE 1: Extract structured intent with Claude API
      const structuredIntent = await claudeIntentExtractor.extractIntent({
        messages: conversation.map(m => ({ role: m.role, content: m.content })),
        currentQuery: currentMessage
      })

      logger.info('✅ Phase 1: Structured intent extracted', {
        hardFilters: structuredIntent.hardFilters,
        keywords: structuredIntent.keywords,
        confidence: structuredIntent.confidence
      })

      // PHASE 2: Optimize query from structured intent
      const optimizedQuery = intelligentQueryOptimizer.optimizeQuery(structuredIntent)

      // Validate query
      const validation = intelligentQueryOptimizer.validateQuery(optimizedQuery)
      if (!validation.valid) {
        logger.warn('Query validation failed', { reason: validation.reason })
        return { products: [], intent: structuredIntent, queryMetadata: {} }
      }

      logger.info('✅ Phase 2: Query optimized', {
        hasHardFilters: optimizedQuery.metadata.hasHardFilters,
        estimatedResults: optimizedQuery.metadata.estimatedResults,
        perSourceLimit: optimizedQuery.limits.perSource
      })

      // PHASE 3: Search across marketplaces with hard filters
      const searchParams = {
        ...optimizedQuery.searchParams,
        sources: ['thriftai', 'amazon', 'ebay'] as const,
        limit: optimizedQuery.limits.perSource
      }

      let results = await this.aggregator.searchAllMarketplaces(searchParams)

      logger.info('✅ Phase 3: Multi-source search completed', {
        totalResults: results.results.length,
        sources: Object.keys(results.insights.sourceBreakdown)
      })

      // If no results, try relaxing filters progressively
      let relaxIteration = 0
      while (results.results.length === 0 && relaxIteration < 3) {
        relaxIteration++
        logger.info(`🔄 No results found, relaxing filters (iteration ${relaxIteration})`)

        const relaxedIntent = intelligentQueryOptimizer.relaxFilters(structuredIntent, relaxIteration)
        const relaxedQuery = intelligentQueryOptimizer.optimizeQuery(relaxedIntent)

        results = await this.aggregator.searchAllMarketplaces({
          ...relaxedQuery.searchParams,
          sources: ['thriftai', 'amazon', 'ebay'] as const,
          limit: relaxedQuery.limits.perSource
        })

        if (results.results.length > 0) {
          logger.info(`✅ Found results after relaxing filters (${results.results.length} products)`)
          break
        }
      }

      if (results.results.length === 0) {
        logger.warn('No products found even after filter relaxation')
        return { products: [], intent: structuredIntent, queryMetadata: optimizedQuery.metadata }
      }

      // PHASE 4: Score products with context boosts
      const scored = this.scoreWithStructuredContext(results.results, structuredIntent)

      logger.info('✅ Phase 4: Products scored with context', {
        totalScored: scored.length,
        topScore: scored[0]?.score.total,
        avgScore: (scored.reduce((sum, p) => sum + p.score.total, 0) / scored.length).toFixed(1)
      })

      // PHASE 5: Return top products (Claude will explain these)
      const topProducts = scored.slice(0, 5)

      logger.info('✅ Phase 5: Pipeline complete - returning top products', {
        count: topProducts.length,
        priceRange: topProducts.length > 0 ? {
          min: Math.min(...topProducts.map(p => p.price)),
          max: Math.max(...topProducts.map(p => p.price))
        } : null
      })

      return {
        products: topProducts,
        intent: structuredIntent,
        queryMetadata: optimizedQuery.metadata
      }
    } catch (error) {
      logger.error('❌ Conversational search pipeline failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })

      // Fallback to legacy search
      logger.info('Falling back to legacy search method')
      return this.legacySearch(conversation, currentMessage)
    }
  }

  /**
   * Legacy search method (fallback)
   */
  private async legacySearch(
    conversation: ConversationMessage[],
    currentMessage: string
  ): Promise<{ products: ScoredProduct[]; intent: any; queryMetadata: any }> {
    try {
      const intent = this.extractIntent(conversation, currentMessage)
      const query = this.buildSearchQuery(intent)

      if (!query) {
        return { products: [], intent: {}, queryMetadata: {} }
      }

      const searchParams = {
        query,
        category: intent.category,
        minPrice: intent.budget?.min,
        maxPrice: intent.budget?.max,
        sources: ['thriftai', 'amazon', 'ebay'] as const,
        limit: 20
      }

      const results = await this.aggregator.searchAllMarketplaces(searchParams)
      const scored = this.scoreWithContext(results.results, intent)
      const topProducts = scored.slice(0, 5)

      return {
        products: topProducts,
        intent,
        queryMetadata: { fallback: true }
      }
    } catch (error) {
      logger.error('Legacy search also failed', { error })
      return { products: [], intent: {}, queryMetadata: { fallback: true, error: true } }
    }
  }

  /**
   * Score products with structured context (new method)
   */
  private scoreWithStructuredContext(
    products: any[],
    intent: StructuredIntent
  ): ScoredProduct[] {
    // Use existing scoring service
    const scored = ProductScoringService.scoreAll(products)

    // Boost scores based on structured context
    return scored.map(product => {
      let contextBoost = 0

      // Hard filter compliance bonuses
      if (intent.hardFilters.maxPrice && product.totalCost <= intent.hardFilters.maxPrice) {
        contextBoost += 10 // Strong bonus for staying within budget
      }

      if (intent.hardFilters.category && product.source === 'thriftai') {
        // Bonus for matching category from ThriftAI (we know the mapping is accurate)
        contextBoost += 5
      }

      // Soft preference bonuses
      if (intent.softPreferences.brands && product.brand) {
        const brandLower = product.brand.toLowerCase()
        if (intent.softPreferences.brands.some(b => brandLower.includes(b.toLowerCase()))) {
          contextBoost += 10 // Brand match bonus
        }
      }

      // Quality tier bonuses
      if (intent.softPreferences.quality === 'premium') {
        if (product.score.breakdown.brand >= 25 && product.score.breakdown.condition >= 17) {
          contextBoost += 8
        }
      } else if (intent.softPreferences.quality === 'budget') {
        if (product.score.breakdown.price > 25) {
          contextBoost += 8 // Reward lowest prices for budget shoppers
        }
      }

      // Shipping speed priority
      if (intent.softPreferences.shippingSpeed === 'fast') {
        if (product.shippingCost === 0) {
          contextBoost += 5 // Free shipping bonus for fast shipping preference
        }
      }

      // Priority factor bonuses
      const priorities = intent.softPreferences.priorityFactors || []
      if (priorities.includes('price') && product.score.breakdown.price > 20) {
        contextBoost += 5
      }
      if (priorities.includes('quality') && product.score.breakdown.condition > 15) {
        contextBoost += 5
      }
      if (priorities.includes('brand') && product.score.breakdown.brand > 20) {
        contextBoost += 5
      }
      if (priorities.includes('shipping') && product.score.breakdown.shipping > 8) {
        contextBoost += 5
      }

      return {
        ...product,
        score: {
          ...product.score,
          total: Math.min(100, product.score.total + contextBoost)
        }
      }
    }).sort((a, b) => b.score.total - a.score.total)
  }

  /**
   * Score products with conversation context (legacy method)
   */
  private scoreWithContext(
    products: any[],
    intent: SearchIntent
  ): ScoredProduct[] {
    // Use existing scoring service
    const scored = ProductScoringService.scoreAll(products)

    // Boost scores based on conversation priorities
    return scored.map(product => {
      let contextBoost = 0

      // Budget match
      if (intent.budget?.max && product.totalCost <= intent.budget.max) {
        contextBoost += 5
      }

      // Brand match
      if (intent.brands && product.brand) {
        const brandLower = product.brand.toLowerCase()
        if (intent.brands.some(b => brandLower.includes(b))) {
          contextBoost += 10
        }
      }

      // Condition match
      if (intent.conditions && product.condition) {
        const conditionLower = product.condition.toLowerCase()
        if (intent.conditions.some(c => conditionLower.includes(c))) {
          contextBoost += 5
        }
      }

      // Priority boosts
      if (intent.priorities?.includes('price') && product.score.breakdown.price > 20) {
        contextBoost += 5
      }
      if (intent.priorities?.includes('quality') && product.score.breakdown.condition > 15) {
        contextBoost += 5
      }
      if (intent.priorities?.includes('brand') && product.score.breakdown.brand > 20) {
        contextBoost += 5
      }

      return {
        ...product,
        score: {
          ...product.score,
          total: Math.min(100, product.score.total + contextBoost)
        }
      }
    }).sort((a, b) => b.score.total - a.score.total)
  }

  /**
   * Summarize conversation for context
   */
  summarizeConversation(conversation: ConversationMessage[]): string {
    if (conversation.length === 0) {
      return 'New conversation - no previous context'
    }

    const intent = this.extractIntent(conversation, '')
    const parts: string[] = []

    if (intent.category) {
      parts.push(`Looking for: ${intent.category}`)
    }
    if (intent.budget) {
      if (intent.budget.min && intent.budget.max) {
        parts.push(`Budget: $${intent.budget.min}-$${intent.budget.max}`)
      } else if (intent.budget.max) {
        parts.push(`Budget: Under $${intent.budget.max}`)
      }
    }
    if (intent.brands && intent.brands.length > 0) {
      parts.push(`Brands: ${intent.brands.join(', ')}`)
    }
    if (intent.useCase) {
      parts.push(`Use case: ${intent.useCase}`)
    }
    if (intent.priorities && intent.priorities.length > 0) {
      parts.push(`Priorities: ${intent.priorities.join(', ')}`)
    }

    return parts.join(' | ') || 'General shopping inquiry'
  }
}

export const conversationalSearch = new ConversationalSearchService()