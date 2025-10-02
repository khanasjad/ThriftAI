import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

/**
 * INTELLIGENT PRODUCT RANKER
 *
 * Uses Claude Haiku to analyze products and rank them intelligently based on user intent.
 * This goes beyond simple filtering - Claude understands context, quality, and suitability.
 *
 * Example:
 * Query: "best laptop for coding under $700"
 * - Claude understands: needs good CPU, RAM, not just any laptop under $700
 * - Ranks products by actual suitability for coding
 * - Explains why each product is recommended
 */

export interface ProductForRanking {
  id: string
  name: string
  title?: string
  brand?: string
  category?: string
  price: number
  originalPrice?: number
  description?: string
  condition?: string
  specifications?: any
  dynamicSpecs?: any
  reviews?: {
    rating?: number
    count?: number
  }
  aiScore?: number
}

export interface RankedProduct extends ProductForRanking {
  intelligenceScore: number  // 0-100: How well it matches user's intent
  reasoning: string          // Why Claude recommends this product
  pros: string[]            // Key advantages
  cons: string[]            // Potential drawbacks
  bestFor: string           // Who/what this product is ideal for
  rank: number              // Final ranking position
}

export interface IntelligenceAnalysis {
  rankedProducts: RankedProduct[]
  overallInsight: string    // General advice about the search results
  queryUnderstanding: string // How Claude understood the query
  recommendations: string[]  // General shopping tips for this query
}

class IntelligentProductRanker {
  private client: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY not configured')
    }
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Analyze and rank products using Claude Haiku's intelligence
   */
  async rankProducts(
    products: ProductForRanking[],
    userQuery: string,
    topN: number = 20
  ): Promise<IntelligenceAnalysis> {
    try {
      logger.info('🧠 Starting intelligent product ranking', {
        productCount: products.length,
        query: userQuery,
        topN
      })

      // If no products, return empty
      if (products.length === 0) {
        return {
          rankedProducts: [],
          overallInsight: 'No products available to analyze.',
          queryUnderstanding: userQuery,
          recommendations: []
        }
      }

      // Prepare product summaries for Claude (keep it concise for cost)
      const productSummaries = products.slice(0, 50).map((p, idx) => {
        const price = p.price || 0
        const originalPrice = p.originalPrice || price
        const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

        return {
          index: idx,
          id: p.id,
          name: p.name || p.title || 'Unknown',
          brand: p.brand || 'Generic',
          category: p.category || 'General',
          price: `$${price.toFixed(2)}`,
          discount: discount > 0 ? `${discount}% off` : 'no discount',
          condition: p.condition || 'used',
          rating: p.reviews?.rating || p.aiScore || 0,
          specs: this.extractKeySpecs(p),
          description: p.description?.substring(0, 150) || 'No description'
        }
      })

      const prompt = `You are an expert shopping advisor analyzing products for a customer.

USER QUERY: "${userQuery}"

AVAILABLE PRODUCTS (${productSummaries.length} products):
${JSON.stringify(productSummaries, null, 2)}

YOUR TASK:
Analyze each product and determine how well it matches the user's needs. Consider:
1. **Direct Match**: Does it match what they're looking for?
2. **Quality**: Based on specs, price, rating, condition
3. **Value**: Is the price fair for what you get?
4. **Suitability**: Will this actually solve their problem?
5. **Context Clues**: "for coding" = needs good specs, "cheap" = prioritize price, "best" = prioritize quality

Rank the TOP ${topN} products and explain your reasoning.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "queryUnderstanding": "Brief explanation of what the user is looking for",
  "overallInsight": "1-2 sentence overview of the available options",
  "recommendations": ["General tip 1", "General tip 2"],
  "rankedProducts": [
    {
      "index": 0,
      "intelligenceScore": 95,
      "reasoning": "Brief explanation why this is ranked here",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "bestFor": "Who should buy this"
    }
  ]
}

IMPORTANT:
- intelligenceScore: 0-100 (how well it matches user intent, NOT just price)
- Include only top ${topN} products
- Be honest about cons
- Focus on actual suitability, not just specs
- Use the product index to identify products
`

      logger.info('🤖 Calling Claude Haiku for intelligent analysis...')

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        temperature: 0.3,
        system: 'You are an expert shopping advisor. Provide honest, helpful product analysis in valid JSON format.',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const textContent = response.content.find(c => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude')
      }

      // Parse Claude's response
      let analysis: any
      try {
        // Extract JSON from potential markdown code blocks
        const text = textContent.text.trim()
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text
        analysis = JSON.parse(jsonText)
      } catch (e) {
        logger.error('❌ Failed to parse Claude response', { error: e })
        throw new Error('Failed to parse AI analysis')
      }

      // Map analysis back to full product objects
      const rankedProducts: RankedProduct[] = analysis.rankedProducts.map((ranked: any, rank: number) => {
        const originalProduct = products[ranked.index]
        return {
          ...originalProduct,
          intelligenceScore: ranked.intelligenceScore || 50,
          reasoning: ranked.reasoning || 'No reasoning provided',
          pros: ranked.pros || [],
          cons: ranked.cons || [],
          bestFor: ranked.bestFor || 'General use',
          rank: rank + 1
        }
      })

      logger.info('✅ Intelligent ranking completed', {
        rankedCount: rankedProducts.length,
        topScore: rankedProducts[0]?.intelligenceScore
      })

      return {
        rankedProducts,
        overallInsight: analysis.overallInsight || 'Analysis complete',
        queryUnderstanding: analysis.queryUnderstanding || userQuery,
        recommendations: analysis.recommendations || []
      }

    } catch (error) {
      logger.error('❌ Intelligent ranking failed', { error })

      // Fallback: return products with basic scoring
      return {
        rankedProducts: products.slice(0, topN).map((p, idx) => ({
          ...p,
          intelligenceScore: p.aiScore || 50,
          reasoning: 'AI analysis unavailable - showing based on basic scoring',
          pros: ['Available product'],
          cons: ['Limited analysis'],
          bestFor: 'General use',
          rank: idx + 1
        })),
        overallInsight: 'AI analysis temporarily unavailable. Showing results based on basic scoring.',
        queryUnderstanding: userQuery,
        recommendations: []
      }
    }
  }

  /**
   * Extract key specs for analysis
   */
  private extractKeySpecs(product: ProductForRanking): string {
    const specs = product.specifications || product.dynamicSpecs || {}
    const keySpecs = ['size', 'color', 'material', 'ram', 'storage', 'cpu', 'screen', 'battery', 'weight']

    const relevant = keySpecs
      .filter(key => specs[key])
      .map(key => `${key}: ${specs[key]}`)
      .join(', ')

    return relevant || 'No detailed specs'
  }
}

// Export singleton instance
export const intelligentProductRanker = new IntelligentProductRanker()
