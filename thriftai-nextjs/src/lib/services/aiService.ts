import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../prisma'

export interface SearchResult {
  id: string
  name: string
  price: number
  originalPrice: number
  brand?: string
  category: string
  condition?: string
  imageUrl?: string
  seller?: {
    businessName: string
    rating: number
  }
}

export interface AISearchResponse {
  query: string
  aiResponse: string
  recommendations: Recommendation[]
  products: SearchResult[]
  totalFound: number
  searchInsights?: any
}

export interface Recommendation {
  id: string
  name: string
  price: number
  originalPrice: number
  savings: string
  condition?: string
  seller?: string
  recommendation: string
  valueScore?: string
  reason?: string
}

export class AIService {
  private static openai: OpenAI | null = null
  private static anthropic: Anthropic | null = null

  static {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
  }

  /**
   * ChatGPT Search with intelligent product recommendations
   */
  static async chatGPTSearch(query: string, preferences: any = {}): Promise<AISearchResponse> {
    try {
      // Get products from database
      const products = await this.searchProducts(query)

      let aiResponse = ''
      let recommendations: Recommendation[] = []

      if (this.openai && products.length > 0) {
        try {
          const productSummary = products.slice(0, 5).map(p =>
            `${p.name} by ${p.brand || 'Unknown'} - $${p.price} (${p.condition || 'Used'})`
          ).join(', ')

          const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful shopping assistant for a thrift/secondhand marketplace. Provide personalized product recommendations and shopping advice. Focus on value, sustainability, and quality."
              },
              {
                role: "user",
                content: `I'm looking for: ${query}. Here are some available products: ${productSummary}.
                Budget considerations: ${preferences.budget || 'flexible'}.
                Please provide helpful shopping advice and explain why these items are good choices.`
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })

          aiResponse = completion.choices[0]?.message?.content || ''
        } catch (error) {
          console.warn('OpenAI API error:', error)
        }
      }

      // Generate fallback response if AI is unavailable
      if (!aiResponse) {
        aiResponse = this.generateFallbackResponse(query, products)
      }

      // Generate recommendations
      recommendations = this.generateRecommendations(products.slice(0, 3))

      return {
        query,
        aiResponse,
        recommendations,
        products: products.slice(0, 10),
        totalFound: products.length,
        searchInsights: this.generateSearchInsights(products)
      }
    } catch (error) {
      console.error('ChatGPT search error:', error)
      throw new Error('Search failed')
    }
  }

  /**
   * Claude AI Search with sustainability focus
   */
  static async claudeSearch(query: string, budget?: number, preferences: any = {}): Promise<AISearchResponse & { sustainabilityInsights?: any }> {
    try {
      // Enhanced product search with budget filtering
      const products = await this.searchProducts(query, budget)

      let aiResponse = ''
      let sustainabilityInsights: any = null

      if (this.anthropic && products.length > 0) {
        try {
          const productData = products.slice(0, 5).map(p => ({
            name: p.name,
            brand: p.brand,
            price: p.price,
            originalPrice: p.originalPrice,
            condition: p.condition,
            category: p.category
          }))

          const message = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 600,
            messages: [{
              role: "user",
              content: `As an expert thrift shopping advisor, analyze this search: "${query}" with budget: $${budget || 'unlimited'}.

Available products: ${JSON.stringify(productData, null, 2)}

Please provide:
1. Smart shopping advice for this search
2. Sustainability benefits of buying these secondhand items
3. Value assessment of the available options
4. Tips for evaluating condition and seller reputation

Keep response under 400 words and focus on actionable insights.`
            }]
          })

          aiResponse = message.content[0]?.text || ''

          // Generate sustainability insights
          sustainabilityInsights = this.generateSustainabilityInsights(products)

        } catch (error) {
          console.warn('Claude API error:', error)
        }
      }

      // Generate fallback response if AI is unavailable
      if (!aiResponse) {
        aiResponse = this.generateFallbackResponse(query, products, budget)
        sustainabilityInsights = this.generateSustainabilityInsights(products)
      }

      const recommendations = this.generateAdvancedRecommendations(products.slice(0, 4))

      return {
        query,
        aiResponse,
        recommendations,
        products: products.slice(0, 12),
        totalFound: products.length,
        sustainabilityInsights,
        searchInsights: this.generateSearchInsights(products)
      }
    } catch (error) {
      console.error('Claude search error:', error)
      throw new Error('Search failed')
    }
  }

  /**
   * Search products in database
   */
  private static async searchProducts(query: string, budget?: number): Promise<SearchResult[]> {
    const where: any = {
      isAvailable: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (budget) {
      where.price = { lte: budget }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        }
      },
      take: 20,
      orderBy: [
        { price: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      brand: p.brand || undefined,
      category: p.category,
      condition: p.condition || undefined,
      imageUrl: p.imageUrl || undefined,
      seller: p.seller ? {
        businessName: p.seller.businessName,
        rating: p.seller.rating
      } : undefined
    }))
  }

  /**
   * Generate basic recommendations
   */
  private static generateRecommendations(products: SearchResult[]): Recommendation[] {
    return products.map(product => {
      const savings = product.originalPrice > 0
        ? ((product.originalPrice - product.price) / product.originalPrice * 100)
        : 0

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        savings: `${savings.toFixed(0)}%`,
        condition: product.condition,
        seller: product.seller?.businessName,
        recommendation: `Great ${product.condition?.toLowerCase()} condition ${product.brand || ''} ${product.name}`
      }
    })
  }

  /**
   * Generate advanced recommendations with value scoring
   */
  private static generateAdvancedRecommendations(products: SearchResult[]): Recommendation[] {
    return products.map(product => {
      const savings = product.originalPrice > 0
        ? ((product.originalPrice - product.price) / product.originalPrice * 100)
        : 0

      const valueScore = savings > 50 ? 'Excellent' : savings > 25 ? 'Good' : 'Fair'
      const reason = savings > 50
        ? `Outstanding ${savings.toFixed(0)}% savings!`
        : `Good quality ${product.condition?.toLowerCase()} item`

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        savings: `${savings.toFixed(0)}%`,
        condition: product.condition,
        seller: product.seller?.businessName,
        valueScore,
        reason,
        recommendation: reason
      }
    })
  }

  /**
   * Generate sustainability insights
   */
  private static generateSustainabilityInsights(products: SearchResult[]) {
    const totalSavings = products.reduce((sum, p) => {
      return sum + (p.originalPrice > 0 ? p.originalPrice - p.price : 0)
    }, 0)

    return {
      totalSavings: totalSavings.toFixed(2),
      environmentalImpact: 'By choosing secondhand, you\'re helping reduce textile waste and carbon footprint.',
      itemsKeptFromLandfill: products.length,
      estimatedCO2Saved: `${(products.length * 2.5).toFixed(1)} kg`,
      waterSaved: `${(products.length * 700).toFixed(0)} gallons`,
      textileWasteReduced: `${(products.length * 1.2).toFixed(1)} lbs`
    }
  }

  /**
   * Generate search insights
   */
  private static generateSearchInsights(products: SearchResult[]) {
    if (products.length === 0) {
      return {
        avgPrice: 0,
        avgSavings: 0,
        categories: [],
        brands: [],
        verifiedSellers: 0
      }
    }

    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length
    const avgSavings = products.reduce((sum, p) => {
      return sum + (p.originalPrice > 0 ? ((p.originalPrice - p.price) / p.originalPrice) * 100 : 0)
    }, 0) / products.length

    return {
      avgPrice: Number(avgPrice.toFixed(2)),
      avgSavings: Number(avgSavings.toFixed(1)),
      categories: [...new Set(products.map(p => p.category))],
      brands: [...new Set(products.map(p => p.brand).filter(Boolean))],
      verifiedSellers: products.filter(p => p.seller).length
    }
  }

  /**
   * Generate fallback response when AI APIs are unavailable
   */
  private static generateFallbackResponse(query: string, products: SearchResult[], budget?: number): string {
    if (products.length === 0) {
      return `No items found for "${query}". Try broadening your search terms or check back later for new arrivals.`
    }

    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length
    const avgSavings = products.reduce((sum, p) => {
      return sum + (p.originalPrice > 0 ? ((p.originalPrice - p.price) / p.originalPrice) * 100 : 0)
    }, 0) / products.length

    const budgetText = budget ? ` within your $${budget} budget` : ''

    return `I found ${products.length} items matching "${query}"${budgetText}. The average price is $${avgPrice.toFixed(2)} with average savings of ${avgSavings.toFixed(0)}% off retail prices. When shopping secondhand, check item condition, seller ratings, and compare prices. Look for verified sellers and detailed descriptions. Buying secondhand is a great way to save money and help the environment!`
  }

  /**
   * Visual search using AI (placeholder for future implementation)
   */
  static async visualSearch(imageFile: File): Promise<AISearchResponse> {
    // This would integrate with computer vision APIs to identify products in images
    throw new Error('Visual search not yet implemented')
  }

  /**
   * Get AI-powered price recommendations
   */
  static async getPriceRecommendation(productName: string, category: string, condition: string): Promise<{ suggestedPrice: number, confidence: number, reasoning: string }> {
    try {
      // Get similar products for price comparison
      const similarProducts = await prisma.product.findMany({
        where: {
          category,
          isAvailable: true,
          OR: [
            { name: { contains: productName, mode: 'insensitive' } },
            { description: { contains: productName, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      if (similarProducts.length === 0) {
        return {
          suggestedPrice: 0,
          confidence: 0,
          reasoning: 'No similar products found for comparison'
        }
      }

      const avgPrice = similarProducts.reduce((sum, p) => sum + p.price, 0) / similarProducts.length
      const conditionMultiplier = this.getConditionMultiplier(condition)
      const suggestedPrice = avgPrice * conditionMultiplier

      return {
        suggestedPrice: Number(suggestedPrice.toFixed(2)),
        confidence: Math.min(90, similarProducts.length * 10),
        reasoning: `Based on ${similarProducts.length} similar items in ${category} category. Adjusted for ${condition} condition.`
      }
    } catch (error) {
      console.error('Price recommendation error:', error)
      return {
        suggestedPrice: 0,
        confidence: 0,
        reasoning: 'Unable to generate price recommendation'
      }
    }
  }

  private static getConditionMultiplier(condition: string): number {
    switch (condition.toLowerCase()) {
      case 'new':
      case 'like new':
        return 1.0
      case 'excellent':
        return 0.85
      case 'good':
        return 0.7
      case 'fair':
        return 0.55
      case 'poor':
        return 0.4
      default:
        return 0.7
    }
  }
}