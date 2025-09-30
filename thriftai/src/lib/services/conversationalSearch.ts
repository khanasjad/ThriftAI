import { MarketplaceAggregator } from './marketplaceAggregator'
import { ProductScoringService, ScoredProduct } from './productScoringService'
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
   * Search products based on conversation context
   */
  async searchBasedOnConversation(
    conversation: ConversationMessage[],
    currentMessage: string
  ): Promise<ScoredProduct[]> {
    try {
      logger.info('Starting conversational search', {
        messageCount: conversation.length,
        currentMessage: currentMessage.substring(0, 50)
      })

      // 1. Extract intent from conversation
      const intent = this.extractIntent(conversation, currentMessage)
      logger.info('Extracted intent', { intent })

      // 2. Build search query
      const query = this.buildSearchQuery(intent)
      if (!query) {
        logger.warn('No search query could be built from intent')
        return []
      }

      logger.info('Built search query', { query })

      // 3. Search across marketplaces
      const searchParams = {
        query,
        category: intent.category,
        minPrice: intent.budget?.min,
        maxPrice: intent.budget?.max,
        sources: ['thriftai', 'amazon', 'ebay'] as const
      }

      const results = await this.aggregator.searchAllMarketplaces(searchParams)
      logger.info('Search completed', {
        totalResults: results.results.length,
        sources: results.metadata.sourceStats
      })

      if (results.results.length === 0) {
        return []
      }

      // 4. Score products with conversation context
      const scored = this.scoreWithContext(results.results, intent)

      // 5. Return top 5
      const topProducts = scored.slice(0, 5)
      logger.info('Returning top products', { count: topProducts.length })

      return topProducts
    } catch (error) {
      logger.error('Conversational search failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  /**
   * Score products with conversation context
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