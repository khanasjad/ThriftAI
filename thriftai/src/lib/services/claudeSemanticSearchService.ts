/**
 * Claude-Powered Semantic Search Service
 *
 * 3-Layer Intelligent Search Architecture:
 * 1. Claude Intent Layer: Understands natural language, fixes typos, extracts filters (Haiku 3.5)
 * 2. Semantic Search Layer: Finds products using vector similarity + database filters (OpenAI)
 * 3. Claude Explanation Layer: Analyzes and explains why products match user intent (Haiku 3.5)
 *
 * Flow:
 * User Query → Claude Intent Extraction → Semantic Search → Claude Result Analysis → Explained Results
 *
 * Cost: ~$0.0005 per search (~2000 searches per dollar) using Claude Haiku 3.5
 */

import { claudeIntentExtractor, StructuredIntent } from './claudeIntentExtractor'
import { simpleSemanticSearch } from './simpleSemanticSearch'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ''
})

interface SearchResult {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  imageUrl?: string
  description?: string
  similarity?: number
  matchScore: number
  claudeReasoning?: string
  matchStrength: 'excellent' | 'good' | 'moderate'
}

interface ClaudeSearchResponse {
  query: {
    original: string
    normalized: string
    intent: string
    confidence: number
  }
  results: SearchResult[]
  insights: {
    overallAnalysis: string
    topRecommendation?: string
    priceInsight?: string
    qualityInsight?: string
  }
  metadata: {
    totalResults: number
    processingTime: number
    intentConfidence: number
    searchMethod: 'semantic' | 'hybrid' | 'fallback'
  }
}

export class ClaudeSemanticSearchService {
  /**
   * Layer 1: Claude Intent Understanding
   * Extracts structured intent from natural language query
   */
  private async extractIntent(query: string): Promise<StructuredIntent> {
    try {
      logger.info('Layer 1: Extracting intent with Claude', { query })

      const intent = await claudeIntentExtractor.extractIntent({
        messages: [],
        currentQuery: query
      })

      logger.info('Intent extracted successfully', {
        normalizedQuery: intent.normalizedQuery,
        confidence: intent.confidence,
        hardFilters: intent.hardFilters
      })

      return intent
    } catch (error) {
      logger.error('Intent extraction failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Layer 2: Hybrid Semantic + Database Search
   * Combines semantic similarity with database filters
   */
  private async searchProducts(intent: StructuredIntent, limit: number = 20): Promise<SearchResult[]> {
    try {
      logger.info('Layer 2: Searching products', {
        normalizedQuery: intent.normalizedQuery,
        filters: intent.hardFilters
      })

      // Try semantic search first (if embeddings are available)
      let semanticResults: SearchResult[] = []
      try {
        const results = await simpleSemanticSearch.search({
          query: intent.normalizedQuery,
          limit: limit * 2, // Get more for filtering
          categoryFilter: intent.hardFilters.category,
          priceRange: {
            min: intent.hardFilters.minPrice,
            max: intent.hardFilters.maxPrice
          },
          minSimilarity: 0.5
        })

        semanticResults = results.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          brand: r.brand,
          price: r.price,
          imageUrl: r.imageUrl,
          similarity: r.similarity,
          matchScore: r.similarity * 100,
          matchStrength: r.similarity > 0.8 ? 'excellent' : r.similarity > 0.6 ? 'good' : 'moderate'
        }))

        logger.info('Semantic search completed', { resultsFound: semanticResults.length })
      } catch (semanticError) {
        logger.warn('Semantic search failed, falling back to database search', {
          error: semanticError instanceof Error ? semanticError.message : String(semanticError)
        })
      }

      // If semantic search didn't return enough results, do database search
      if (semanticResults.length < 5) {
        const dbResults = await this.databaseSearch(intent, limit)
        semanticResults = [...semanticResults, ...dbResults].slice(0, limit)
      }

      // Apply soft preference scoring
      const scoredResults = this.applySoftPreferences(semanticResults, intent)

      // Sort by match score
      scoredResults.sort((a, b) => b.matchScore - a.matchScore)

      return scoredResults.slice(0, limit)
    } catch (error) {
      logger.error('Product search failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Fallback database search using Prisma
   */
  private async databaseSearch(intent: StructuredIntent, limit: number): Promise<SearchResult[]> {
    const where: any = {
      isAvailable: true
    }

    // Build search conditions
    const searchTerms = intent.keywords.join(' ')
    if (searchTerms) {
      where.OR = [
        { name: { contains: searchTerms, mode: 'insensitive' } },
        { description: { contains: searchTerms, mode: 'insensitive' } },
        { brand: { contains: searchTerms, mode: 'insensitive' } }
      ]
    }

    // Apply hard filters
    if (intent.hardFilters.category) {
      where.category = intent.hardFilters.category
    }

    if (intent.hardFilters.minPrice !== undefined || intent.hardFilters.maxPrice !== undefined) {
      where.price = {}
      if (intent.hardFilters.minPrice !== undefined) where.price.gte = intent.hardFilters.minPrice
      if (intent.hardFilters.maxPrice !== undefined) where.price.lte = intent.hardFilters.maxPrice
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        price: true,
        imageUrl: true,
        description: true
      },
      take: limit,
      orderBy: [
        { aiScore: 'desc' },
        { popularityScore: 'desc' }
      ]
    })

    return products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand || undefined,
      price: p.price,
      imageUrl: p.imageUrl || undefined,
      description: p.description || undefined,
      matchScore: 70, // Base score for database results
      matchStrength: 'good' as const
    }))
  }

  /**
   * Apply soft preferences to boost scores
   */
  private applySoftPreferences(results: SearchResult[], intent: StructuredIntent): SearchResult[] {
    return results.map(product => {
      let bonusPoints = 0

      // Brand preference bonus
      if (intent.softPreferences.brands && product.brand) {
        const brandMatch = intent.softPreferences.brands.some(
          b => product.brand?.toLowerCase().includes(b.toLowerCase())
        )
        if (brandMatch) bonusPoints += 10
      }

      // Quality preference bonus
      if (intent.softPreferences.quality === 'premium' && product.price > 500) {
        bonusPoints += 5
      } else if (intent.softPreferences.quality === 'budget' && product.price < 100) {
        bonusPoints += 5
      }

      // Update match score
      const newScore = Math.min(100, product.matchScore + bonusPoints)

      return {
        ...product,
        matchScore: newScore,
        matchStrength: newScore > 85 ? 'excellent' : newScore > 70 ? 'good' : 'moderate'
      }
    })
  }

  /**
   * Layer 3: Claude Result Explanation
   * Analyzes products and generates personalized explanations
   */
  private async explainResults(
    query: string,
    intent: StructuredIntent,
    products: SearchResult[]
  ): Promise<{
    productsWithReasonin: SearchResult[]
    insights: ClaudeSearchResponse['insights']
  }> {
    try {
      logger.info('Layer 3: Generating Claude explanations', {
        query,
        productCount: products.length
      })

      if (products.length === 0) {
        return {
          productsWithReasonin: [],
          insights: {
            overallAnalysis: "No products found matching your search criteria. Try broadening your search or adjusting filters.",
            priceInsight: undefined,
            qualityInsight: undefined
          }
        }
      }

      // Prepare product data for Claude
      const productSummaries = products.slice(0, 5).map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        brand: p.brand || 'Unknown',
        price: p.price,
        category: p.category,
        matchScore: p.matchScore
      }))

      const prompt = `You are a shopping assistant analyzing search results for a user.

User's Query: "${query}"
User Intent: ${intent.intent}
Normalized Query: ${intent.normalizedQuery}

Top ${productSummaries.length} Products Found:
${productSummaries.map(p => `${p.rank}. ${p.name} - ${p.brand} - $${p.price} (Match: ${p.matchScore}%)`).join('\n')}

Budget: ${intent.hardFilters.maxPrice ? `Under $${intent.hardFilters.maxPrice}` : 'No limit'}
Preferred Brands: ${intent.softPreferences.brands?.join(', ') || 'Any'}
Quality Preference: ${intent.softPreferences.quality || 'Any'}

Provide:
1. Brief explanation (1-2 sentences) for each of the top 3 products on why it matches the query
2. Overall analysis (2-3 sentences) about the search results
3. Top recommendation (which product is best and why)
4. Price insight (are these good deals?)
5. Quality insight (overall quality of results)

Format your response as JSON:
{
  "productExplanations": [
    {"productRank": 1, "reasoning": "..."},
    {"productRank": 2, "reasoning": "..."},
    {"productRank": 3, "reasoning": "..."}
  ],
  "overallAnalysis": "...",
  "topRecommendation": "...",
  "priceInsight": "...",
  "qualityInsight": "..."
}`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Parse Claude's response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Failed to parse Claude response')
      }

      const explanation = JSON.parse(jsonMatch[0])

      // Add reasoning to products
      const productsWithReasoning = products.map((product, idx) => {
        const reasoning = explanation.productExplanations?.find(
          (e: any) => e.productRank === idx + 1
        )
        return {
          ...product,
          claudeReasoning: reasoning?.reasoning || undefined
        }
      })

      logger.info('Claude explanations generated successfully')

      return {
        productsWithReasonin: productsWithReasoning,
        insights: {
          overallAnalysis: explanation.overallAnalysis || '',
          topRecommendation: explanation.topRecommendation,
          priceInsight: explanation.priceInsight,
          qualityInsight: explanation.qualityInsight
        }
      }
    } catch (error) {
      logger.error('Failed to generate Claude explanations', {
        error: error instanceof Error ? error.message : String(error)
      })

      // Return results without explanations if Claude fails
      return {
        productsWithReasonin: products,
        insights: {
          overallAnalysis: `Found ${products.length} products matching your search.`
        }
      }
    }
  }

  /**
   * Main search method - orchestrates all 3 layers
   */
  async search(query: string, limit: number = 20): Promise<ClaudeSearchResponse> {
    const startTime = Date.now()

    try {
      logger.info('Starting Claude-powered semantic search', { query, limit })

      // Layer 1: Extract intent with Claude
      const intent = await this.extractIntent(query)

      // Layer 2: Search products using semantic search + database
      const products = await this.searchProducts(intent, limit)

      // Layer 3: Generate Claude explanations
      const { productsWithReasonin, insights } = await this.explainResults(query, intent, products)

      const processingTime = Date.now() - startTime

      logger.info('Claude-powered search completed', {
        query,
        resultsFound: productsWithReasonin.length,
        processingTime
      })

      return {
        query: {
          original: query,
          normalized: intent.normalizedQuery,
          intent: intent.intent,
          confidence: intent.confidence
        },
        results: productsWithReasonin,
        insights,
        metadata: {
          totalResults: productsWithReasonin.length,
          processingTime,
          intentConfidence: intent.confidence,
          searchMethod: products.some(p => p.similarity) ? 'semantic' : 'hybrid'
        }
      }
    } catch (error) {
      logger.error('Claude-powered search failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

// Export singleton instance
export const claudeSemanticSearch = new ClaudeSemanticSearchService()
