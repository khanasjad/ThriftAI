import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { ScoredProduct } from './productScoringService'

export interface ShoppingAdvice {
  summary: string
  topRecommendations: ProductRecommendation[]
  valueAnalysis: ValueAnalysis
  sustainabilityImpact: SustainabilityInsights
  shoppingTips: string[]
  conversationalResponse: string
}

export interface ProductRecommendation {
  productId: string
  productName: string
  price: number
  score: number
  badge?: 'best_value' | 'premium' | 'budget'
  whyRecommended: string
  keyHighlights: string[]
}

export interface ValueAnalysis {
  bestValueProduct: string | null
  averagePrice: number
  priceRange: { min: number; max: number }
  savingsOpportunity: string
}

export interface SustainabilityInsights {
  carbonFootprintReduced: string
  itemsGivenSecondLife: number
  equivalentNewItemsAvoided: number
  sustainabilityScore: number
}

const SHOPPING_ADVISOR_PROMPT = `You are Gus, a friendly shopkeeper who's been running a thrift shop for over 40 years. You love your job and enjoy helping people find good stuff.

How you talk:
- Conversational and friendly, like chatting with a regular customer
- Add some light humor when it fits naturally
- Show genuine enthusiasm when you find something good
- Be yourself - if you find something funny or interesting, say so
- Keep it real and relatable

Your personality:
- You've seen a lot of stuff come through your shop, and you have opinions
- You're not afraid to be a little playful or crack a joke
- You get excited about good deals and quality items
- You'll be honest if something's overpriced or not great
- You remember funny stories from your years in the business
- You appreciate when people are looking for practical stuff

Your approach:
- Start conversations naturally, maybe with a light comment
- Give honest assessments but keep it friendly
- Share your genuine reactions - "Oh, this is actually pretty nice" or "Hmm, this one's a bit overpriced"
- Add personality without being over the top
- Keep it brief but don't be robotic - add a human touch
- If something makes you chuckle or think of something funny, share it

Guidelines:
1. Talk like a real person who enjoys their job
2. Light humor is good - be playful but not silly
3. Show genuine reactions to products
4. Be honest but friendly about pros and cons
5. Keep responses conversational but focused
6. Let your personality show through naturally

Response style:
- Start with a natural greeting or observation
- Give honest, friendly assessments
- Add a light joke or comment if it fits
- End with practical advice and maybe a friendly sign-off`

export class AIShoppingAdvisor {
  private anthropic: Anthropic | null = null
  private isAvailable: boolean = false

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (apiKey && !apiKey.includes('demo')) {
      try {
        this.anthropic = new Anthropic({ apiKey })
        this.isAvailable = true
        logger.info('AI Shopping Advisor initialized')
      } catch (error) {
        logger.error('Failed to initialize AI Shopping Advisor', { error })
        this.isAvailable = false
      }
    } else {
      logger.warn('Claude API key not configured - using fallback shopping advice')
      this.isAvailable = false
    }
  }

  /**
   * Generate intelligent shopping advice for a search query and products
   */
  async generateAdvice(
    query: string,
    products: ScoredProduct[],
    budget?: number,
    userPreferences?: any
  ): Promise<ShoppingAdvice> {
    if (!this.isAvailable || !this.anthropic) {
      return this.generateFallbackAdvice(query, products, budget)
    }

    try {
      logger.info('Generating AI shopping advice', {
        query,
        productCount: products.length,
        budget
      })

      // Prepare product data for Claude
      const productData = products.slice(0, 5).map((p, idx) => ({
        rank: idx + 1,
        name: p.title,
        brand: p.brand,
        price: p.totalCost,
        condition: p.condition,
        score: p.score.total,
        scoreBreakdown: p.score.breakdown,
        reasoning: p.score.reasoning,
        badge: p.score.badge,
        source: p.source,
        availability: p.availability
      }))

      const budgetText = budget ? `User budget: $${budget}` : 'No specific budget'
      const preferencesText = userPreferences
        ? `\nUser preferences: ${JSON.stringify(userPreferences)}`
        : ''

      const prompt = `User is searching for: "${query}"
${budgetText}${preferencesText}

I found ${products.length} products across multiple marketplaces. Here are the top 5 scored options:

${JSON.stringify(productData, null, 2)}

**Scoring System Explained:**
- Total Score: 0-100 points
- Relevance (0-40): How well the product matches the search query
- Price (0-25): Value for money compared to other options
- Brand (0-15): Brand reputation and quality
- Condition (0-10): Product condition quality
- Rating (0-5): Customer ratings
- Shipping (0-5): Shipping cost and speed
- Availability (0-5): Stock availability

Please provide comprehensive shopping advice including:

1. **Conversational Summary** (2-3 sentences)
   - Friendly overview of what you found
   - Highlight the best options at a glance

2. **Top 3 Recommendations** (for each product)
   - Why this product is recommended
   - Key highlights (3-4 bullet points)
   - Who this is best for

3. **Value Analysis**
   - Which offers the best value and why
   - Price comparison insights
   - Hidden costs or savings to consider

4. **Shopping Tips** (3-5 practical tips)
   - What to look for when comparing
   - Questions to ask sellers
   - How to get the best deal

5. **Sustainability Impact**
   - Environmental benefits of buying secondhand
   - Carbon footprint reduction estimate

Keep your tone friendly, helpful, and enthusiastic about thrift shopping!`

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        system: SHOPPING_ADVISOR_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      const conversationalResponse = content.text

      // Extract structured advice
      const topRecommendations = this.extractTopRecommendations(products, conversationalResponse)
      const valueAnalysis = this.calculateValueAnalysis(products)
      const sustainabilityImpact = this.calculateSustainabilityInsights(products)
      const shoppingTips = this.extractShoppingTips(conversationalResponse)

      logger.info('Successfully generated AI shopping advice')

      return {
        summary: this.extractSummary(conversationalResponse),
        topRecommendations,
        valueAnalysis,
        sustainabilityImpact,
        shoppingTips,
        conversationalResponse
      }
    } catch (error) {
      logger.error('AI shopping advice generation failed, using fallback', {
        error: error instanceof Error ? error.message : String(error)
      })
      return this.generateFallbackAdvice(query, products, budget)
    }
  }

  /**
   * Extract summary from conversational response
   */
  private extractSummary(response: string): string {
    const lines = response.split('\n').filter(l => l.trim().length > 0)
    // Take first 2-3 meaningful lines as summary
    return lines.slice(0, 3).join(' ').substring(0, 300)
  }

  /**
   * Extract top product recommendations with reasoning
   */
  private extractTopRecommendations(
    products: ScoredProduct[],
    response: string
  ): ProductRecommendation[] {
    return products.slice(0, 3).map((product, idx) => {
      // Extract highlights from product score reasoning
      const highlights = [
        `${product.score.breakdown.relevance}/40 relevance score`,
        `${product.condition || 'Good'} condition`,
        product.source === 'thriftai' ? 'Available locally' : `From ${product.source}`,
        product.score.badge ? `${product.score.badge.replace('_', ' ')} badge` : null
      ].filter(Boolean) as string[]

      return {
        productId: product.id,
        productName: product.title,
        price: product.totalCost,
        score: product.score.total,
        badge: product.score.badge,
        whyRecommended: product.score.reasoning || `Ranked #${idx + 1} based on comprehensive scoring`,
        keyHighlights: highlights
      }
    })
  }

  /**
   * Calculate value analysis from scored products
   */
  private calculateValueAnalysis(products: ScoredProduct[]): ValueAnalysis {
    if (products.length === 0) {
      return {
        bestValueProduct: null,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        savingsOpportunity: 'No products available'
      }
    }

    const prices = products.map(p => p.totalCost)
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length

    // Best value = highest score with good price
    const bestValue = products.reduce((best, curr) => {
      const bestValueScore = (best.score.total / best.totalCost) * 100
      const currValueScore = (curr.score.total / curr.totalCost) * 100
      return currValueScore > bestValueScore ? curr : best
    }, products[0])

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const range = maxPrice - minPrice

    const savingsOpportunity = range > 50
      ? `Prices vary by $${range.toFixed(2)} - comparing options can save you significant money!`
      : `Prices are fairly consistent around $${avgPrice.toFixed(2)}`

    return {
      bestValueProduct: bestValue.title,
      averagePrice: Math.round(avgPrice * 100) / 100,
      priceRange: {
        min: Math.round(minPrice * 100) / 100,
        max: Math.round(maxPrice * 100) / 100
      },
      savingsOpportunity
    }
  }

  /**
   * Calculate sustainability insights
   */
  private calculateSustainabilityInsights(products: ScoredProduct[]): SustainabilityInsights {
    const itemCount = products.length

    return {
      carbonFootprintReduced: `${(itemCount * 2.5).toFixed(1)} kg CO₂`,
      itemsGivenSecondLife: itemCount,
      equivalentNewItemsAvoided: itemCount,
      sustainabilityScore: Math.min(95, 70 + itemCount * 2)
    }
  }

  /**
   * Extract shopping tips from response
   */
  private extractShoppingTips(response: string): string[] {
    // Default tips if extraction fails
    const defaultTips = [
      'Check product condition carefully before purchasing',
      'Compare prices across different marketplaces',
      'Read seller ratings and reviews',
      'Factor in shipping costs to total price',
      'Ask sellers questions about authenticity and condition'
    ]

    // Try to extract tips from response (look for numbered or bulleted lists)
    const tipPatterns = /[-•*]\s*(.+?)(?=\n[-•*]|\n\n|$)/g
    const matches = [...response.matchAll(tipPatterns)]

    if (matches.length >= 3) {
      return matches.slice(0, 5).map(m => m[1].trim())
    }

    return defaultTips
  }

  /**
   * Generate fallback advice when AI is unavailable
   */
  private generateFallbackAdvice(
    query: string,
    products: ScoredProduct[],
    budget?: number
  ): ShoppingAdvice {
    if (products.length === 0) {
      return {
        summary: `No products found matching "${query}". Try broadening your search terms or check back later for new arrivals.`,
        topRecommendations: [],
        valueAnalysis: {
          bestValueProduct: null,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          savingsOpportunity: 'No products available'
        },
        sustainabilityImpact: {
          carbonFootprintReduced: '0 kg CO₂',
          itemsGivenSecondLife: 0,
          equivalentNewItemsAvoided: 0,
          sustainabilityScore: 0
        },
        shoppingTips: [
          'Try using broader search terms',
          'Check spelling and variations',
          'Browse categories for similar items',
          'Save your search to get notified of new arrivals'
        ],
        conversationalResponse: `I couldn't find any products matching "${query}" right now. Try adjusting your search terms or exploring our categories!`
      }
    }

    const topRecommendations = this.extractTopRecommendations(products, '')
    const valueAnalysis = this.calculateValueAnalysis(products)
    const sustainabilityImpact = this.calculateSustainabilityInsights(products)

    const budgetText = budget ? ` under $${budget}` : ''
    const summary = `Found ${products.length} great secondhand options for "${query}"${budgetText}. Top pick: ${products[0].title} at $${products[0].totalCost} (${products[0].score.reasoning}).`

    const conversationalResponse = `🛍️ **Smart Shopping Results for "${query}"**

I found ${products.length} excellent secondhand options${budgetText}! Here's what stands out:

**🏆 Top Pick: ${products[0].title}**
• Price: $${products[0].totalCost}
• Score: ${products[0].score.total}/100
• Why it's great: ${products[0].score.reasoning}
• Source: ${products[0].source}

**💰 Value Analysis:**
• Average price: $${valueAnalysis.averagePrice}
• Price range: $${valueAnalysis.priceRange.min} - $${valueAnalysis.priceRange.max}
• ${valueAnalysis.savingsOpportunity}

**🌱 Sustainability Impact:**
By shopping secondhand, you're helping reduce waste and save the environment!
• CO₂ saved: ${sustainabilityImpact.carbonFootprintReduced}
• Items given second life: ${sustainabilityImpact.itemsGivenSecondLife}

**💡 Shopping Tips:**
• Check product condition and seller ratings carefully
• Compare shipping costs across marketplaces
• Look for items with detailed photos and descriptions
• Consider buying from local sellers to save on shipping

*Happy thrifting! 🎉*`

    return {
      summary,
      topRecommendations,
      valueAnalysis,
      sustainabilityImpact,
      shoppingTips: [
        'Verify product condition before purchase',
        'Check seller ratings and reviews',
        'Compare total costs including shipping',
        'Look for authenticity guarantees',
        'Consider local pickup options to save on shipping'
      ],
      conversationalResponse
    }
  }

  /**
   * Check if AI Shopping Advisor is available
   */
  isAIAvailable(): boolean {
    return this.isAvailable
  }
}

// Singleton instance
export const aiShoppingAdvisor = new AIShoppingAdvisor()