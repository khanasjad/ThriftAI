import Anthropic from '@anthropic-ai/sdk'
import { ScoredProduct } from './productScoringService'
import { ConversationMessage, conversationalSearch } from './conversationalSearch'
import { logger } from '@/lib/logger'

const SHOPPING_ADVISOR_SYSTEM_PROMPT = `You are an expert shopping advisor for ThriftAI marketplace. Your role is to help users find the perfect products through natural conversation.

CONVERSATION STYLE:
- Be conversational, friendly, and helpful
- Ask clarifying questions to understand needs better
- Be specific about products - reference actual names, specs, prices
- Explain WHY you recommend each product
- Discuss trade-offs honestly (price vs quality, specs, condition)
- Compare options across marketplaces when relevant
- Help users make informed decisions

IMPORTANT RULES:
- NO generic advice like "check item conditions" or "compare prices"
- Everything must be specific to the products provided and the conversation
- Always explain your reasoning for recommendations
- When comparing products, highlight specific differences
- Be budget-conscious - respect user's price constraints
- If asking follow-up questions, limit to 2-3 questions max
- Keep responses concise but informative (2-4 paragraphs)

PRODUCT RECOMMENDATIONS:
- Recommend 1-5 products maximum per response
- For each product, briefly explain:
  * Why it's a good fit for their needs
  * Key specs or features relevant to their use case
  * How it compares to other options (if applicable)
  * Any trade-offs they should know about
- Format product references as: [Product {index}] in your text
- Products will be displayed as cards alongside your message

RESPONSE FORMAT:
- Start with a conversational response to their question
- Present product recommendations with reasoning
- If needed, ask 1-2 follow-up questions to refine search
- End naturally - no forced closing phrases

Remember: You're having a helpful conversation, not giving generic shopping tips. Focus on the specific products and user's situation.`

export interface ShoppingAdvisorRequest {
  message: string
  conversationHistory: ConversationMessage[]
  searchContext?: {
    query?: string
    products?: any[]
  }
}

export interface ShoppingAdvisorResponse {
  message: string
  products: ScoredProduct[]
  intent?: {
    category?: string
    budget?: { min?: number; max?: number }
  }
}

export class ClaudeShoppingAdvisorService {
  private anthropic: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey })
    } else {
      logger.warn('ANTHROPIC_API_KEY not configured - shopping advisor will use fallback responses')
    }
  }

  isAvailable(): boolean {
    return this.anthropic !== null
  }

  /**
   * Generate conversational response with product recommendations
   */
  async chat(request: ShoppingAdvisorRequest): Promise<ShoppingAdvisorResponse> {
    try {
      // 1. Search for relevant products based on conversation
      const products = await conversationalSearch.searchBasedOnConversation(
        request.conversationHistory,
        request.message
      )

      logger.info('Found products for conversation', { count: products.length })

      // 2. If no Claude API, return fallback
      if (!this.anthropic) {
        return this.generateFallbackResponse(request, products)
      }

      // 3. Build conversation summary
      const conversationSummary = conversationalSearch.summarizeConversation(
        request.conversationHistory
      )

      // 4. Format products for Claude
      const productsContext = this.formatProductsForClaude(products)

      // 5. Build user prompt with context
      const userPrompt = `Current conversation context: ${conversationSummary}

User's message: "${request.message}"

Available products in catalog:
${productsContext}

Please provide a helpful, conversational response that:
1. Addresses the user's message naturally
2. Recommends 1-5 most relevant products with specific reasoning
3. Explains trade-offs and comparisons if relevant
4. Asks clarifying questions if needed (max 2-3)

Reference products as [Product 1], [Product 2], etc. in your response.`

      // 6. Call Claude API
      const messages: Anthropic.MessageParam[] = [
        ...request.conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        })),
        {
          role: 'user' as const,
          content: userPrompt
        }
      ]

      logger.info('Calling Claude API for shopping advice')

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: SHOPPING_ADVISOR_SYSTEM_PROMPT,
        messages
      })

      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : ''

      logger.info('Claude response received', {
        length: assistantMessage.length
      })

      // 7. Parse response and extract recommended products
      const recommendedProducts = this.extractRecommendedProducts(
        assistantMessage,
        products
      )

      return {
        message: assistantMessage,
        products: recommendedProducts
      }

    } catch (error) {
      logger.error('Shopping advisor chat failed', {
        error: error instanceof Error ? error.message : String(error)
      })

      // Fallback to simple response
      const products = await conversationalSearch.searchBasedOnConversation(
        request.conversationHistory,
        request.message
      )

      return this.generateFallbackResponse(request, products)
    }
  }

  /**
   * Format products for Claude context
   */
  private formatProductsForClaude(products: ScoredProduct[]): string {
    if (products.length === 0) {
      return 'No products found matching the criteria.'
    }

    return products.map((p, i) => {
      return `[Product ${i + 1}]
- Title: ${p.title}
- Brand: ${p.brand || 'N/A'}
- Price: $${p.price.toFixed(2)}${p.shippingCost ? ` (+$${p.shippingCost.toFixed(2)} shipping)` : ' (free shipping)'}
- Total Cost: $${p.totalCost.toFixed(2)}
- Condition: ${p.condition || 'N/A'}
- Source: ${p.source}
- Rating: ${p.rating ? `${p.rating}/5` : 'N/A'}
- AI Score: ${p.score.total}/100
- Score Breakdown: Price ${p.score.breakdown.price}, Brand ${p.score.breakdown.brand}, Condition ${p.score.breakdown.condition}
- Why Scored Well: ${p.score.reasoning}
${p.score.badge ? `- Badge: ${p.score.badge}` : ''}`
    }).join('\n\n')
  }

  /**
   * Extract which products Claude referenced in response
   */
  private extractRecommendedProducts(
    message: string,
    allProducts: ScoredProduct[]
  ): ScoredProduct[] {
    const recommended: ScoredProduct[] = []
    const productPattern = /\[Product (\d+)\]/gi
    const matches = message.matchAll(productPattern)

    const indices = new Set<number>()
    for (const match of matches) {
      const index = parseInt(match[1]) - 1
      if (index >= 0 && index < allProducts.length) {
        indices.add(index)
      }
    }

    // Return products in order they were mentioned
    for (const index of Array.from(indices).sort((a, b) => a - b)) {
      recommended.push(allProducts[index])
    }

    // If no products were explicitly mentioned, return top 3
    if (recommended.length === 0 && allProducts.length > 0) {
      return allProducts.slice(0, 3)
    }

    return recommended
  }

  /**
   * Generate fallback response when Claude API is not available
   */
  private generateFallbackResponse(
    request: ShoppingAdvisorRequest,
    products: ScoredProduct[]
  ): ShoppingAdvisorResponse {
    const intent = conversationalSearch.extractIntent(
      request.conversationHistory,
      request.message
    )

    let message = ''

    if (products.length === 0) {
      message = `I'd love to help you find the perfect product! To give you the best recommendations, could you tell me a bit more about what you're looking for?

For example:
• What type of product are you interested in?
• What's your budget range?
• Will this be for personal use, work, or something else?`
    } else {
      const topProducts = products.slice(0, 3)
      message = `I found ${products.length} products that might interest you. Here are my top ${topProducts.length} recommendations:\n\n`

      topProducts.forEach((p, i) => {
        message += `**${i + 1}. ${p.title}**\n`
        message += `• Price: $${p.totalCost.toFixed(2)} (${p.shippingCost && p.shippingCost > 0 ? `+$${p.shippingCost.toFixed(2)} shipping` : 'free shipping'})\n`
        message += `• Source: ${p.source}\n`
        message += `• AI Score: ${p.score.total}/100 - ${p.score.reasoning}\n\n`
      })

      if (intent.budget && intent.budget.max) {
        const withinBudget = topProducts.filter(p => p.totalCost <= intent.budget!.max!)
        if (withinBudget.length > 0) {
          message += `\n💡 ${withinBudget.length} of these options fit your $${intent.budget.max} budget.`
        }
      }

      message += `\n\nWould you like me to explain more about any of these options, or would you like to see different products?`
    }

    return {
      message,
      products: products.slice(0, 3),
      intent: {
        category: intent.category,
        budget: intent.budget
      }
    }
  }
}

export const claudeShoppingAdvisor = new ClaudeShoppingAdvisorService()