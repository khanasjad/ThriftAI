import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export interface OptimizedQuery {
  searchTerms: string[]  // Best search terms to try in order of priority
  primaryTerm: string     // The single best term to use
  category: string | null
  filters: {
    maxPrice?: number
    minPrice?: number
  }
}

const QUERY_OPTIMIZATION_PROMPT = `You are an expert at optimizing search queries for e-commerce databases.

Your task: Given a user's natural language search query, generate the BEST search terms that will return relevant products from a database.

Rules:
1. Fix typos and normalize spelling ("tshirt" → "t-shirt", "labtop" → "laptop")
2. Remove filler words ("find", "looking for", "show me")
3. Create a prioritized list of search terms from specific to general
4. The PRIMARY term should be the most likely to return relevant results
5. Include variations and synonyms

Return ONLY a JSON object with this structure:
{
  "searchTerms": ["term1", "term2", "term3"],
  "primaryTerm": "term1",
  "category": "ELECTRONICS|CLOTHING|SHOES|ACCESSORIES|HOME|null",
  "filters": {
    "maxPrice": number | null,
    "minPrice": number | null
  }
}

Examples:
Input: "Find vintage designer bags under $200"
Output: {
  "searchTerms": ["designer bags", "bags", "handbags", "purses"],
  "primaryTerm": "designer bags",
  "category": "ACCESSORIES",
  "filters": { "maxPrice": 200 }
}

Input: "looking for tshirt"
Output: {
  "searchTerms": ["t-shirt", "shirt", "tee", "apparel"],
  "primaryTerm": "t-shirt",
  "category": "CLOTHING",
  "filters": {}
}

Input: "cheap laptop for school"
Output: {
  "searchTerms": ["laptop", "computer", "notebook"],
  "primaryTerm": "laptop",
  "category": "ELECTRONICS",
  "filters": { "maxPrice": 500 }
}

Be aggressive with simplification - the goal is to FIND PRODUCTS, even if less specific.`

export class AIQueryOptimizer {
  private anthropic: Anthropic | null = null
  private isAvailable: boolean = false

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (apiKey && !apiKey.includes('demo')) {
      try {
        this.anthropic = new Anthropic({ apiKey })
        this.isAvailable = true
        logger.info('✅ AI Query Optimizer initialized with Claude API')
      } catch (error) {
        logger.error('❌ Failed to initialize AI Query Optimizer', { error })
        this.isAvailable = false
      }
    } else {
      logger.warn('⚠️ Claude API key not configured - using fallback query optimization')
      this.isAvailable = false
    }
  }

  /**
   * Use Claude AI to optimize a search query for best database results
   */
  async optimizeQuery(userQuery: string): Promise<OptimizedQuery> {
    // Always try fallback first for speed, then enhance with AI if available
    const fallbackResult = this.fallbackOptimization(userQuery)

    if (!this.isAvailable || !this.anthropic) {
      logger.info('🔄 Using fallback query optimization (no Claude API)')
      return fallbackResult
    }

    try {
      logger.info('🤖 Optimizing query with Claude AI', { query: userQuery })

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        temperature: 0.1,
        system: QUERY_OPTIMIZATION_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Optimize this search query: "${userQuery}"\n\nReturn ONLY valid JSON, no other text.`
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        logger.warn('⚠️ No JSON found in Claude response, using fallback')
        return fallbackResult
      }

      const optimized = JSON.parse(jsonMatch[0]) as OptimizedQuery

      logger.info('✅ AI Query Optimization successful', {
        original: userQuery,
        primaryTerm: optimized.primaryTerm,
        searchTerms: optimized.searchTerms
      })

      return optimized
    } catch (error) {
      logger.error('❌ AI query optimization failed, using fallback', {
        error: error instanceof Error ? error.message : String(error)
      })
      return fallbackResult
    }
  }

  /**
   * Fallback optimization using regex patterns when Claude is unavailable
   */
  private fallbackOptimization(query: string): OptimizedQuery {
    const normalized = query.toLowerCase().trim()
    const searchTerms: string[] = []

    // Remove filler words
    const fillerWords = ['find', 'looking', 'for', 'show', 'me', 'i', 'want', 'need', 'the', 'a', 'an']
    let cleanQuery = normalized
      .split(/\s+/)
      .filter(word => !fillerWords.includes(word))
      .join(' ')

    // Handle common typos
    const typoFixes: [RegExp, string][] = [
      [/\btshirts?|\bt-?shrt\b/gi, 't-shirt'],
      [/\blabto?ps?\b/gi, 'laptop'],
      [/\bsmartphones?\b/gi, 'phone'],
      [/\bshose?s?\b/gi, 'shoes']
    ]

    for (const [pattern, replacement] of typoFixes) {
      cleanQuery = cleanQuery.replace(pattern, replacement)
    }

    // Extract price filters
    const filters: { maxPrice?: number; minPrice?: number } = {}
    const priceMatch = cleanQuery.match(/under\s+\$?(\d+)/i)
    if (priceMatch) {
      filters.maxPrice = parseInt(priceMatch[1])
      cleanQuery = cleanQuery.replace(/under\s+\$?\d+/gi, '').trim()
    }

    // Remove price mentions
    cleanQuery = cleanQuery.replace(/\$\d+/g, '').trim()

    // Build search terms list
    if (cleanQuery) {
      searchTerms.push(cleanQuery) // Full clean query
    }

    const words = cleanQuery.split(/\s+/)

    // Remove adjectives for broader search
    const adjectives = ['vintage', 'designer', 'luxury', 'premium', 'cheap', 'best', 'new', 'used']
    const withoutAdjectives = words.filter(w => !adjectives.includes(w)).join(' ')
    if (withoutAdjectives && withoutAdjectives !== cleanQuery) {
      searchTerms.push(withoutAdjectives)
    }

    // Extract product type keywords
    const productTypes: { [key: string]: string[] } = {
      'bags': ['bag', 'bags', 'purse', 'handbag'],
      'shirt': ['shirt', 'tshirt', 't-shirt', 'tee', 'top'],
      'shoes': ['shoe', 'shoes', 'sneaker', 'boot'],
      'laptop': ['laptop', 'computer', 'notebook'],
      'phone': ['phone', 'smartphone', 'mobile']
    }

    for (const [canonical, variations] of Object.entries(productTypes)) {
      if (variations.some(v => words.includes(v))) {
        if (!searchTerms.includes(canonical)) {
          searchTerms.push(canonical)
        }
        break
      }
    }

    // If still no terms, use longest word
    if (searchTerms.length === 0 && words.length > 0) {
      const longestWord = words.reduce((a, b) => a.length > b.length ? a : b)
      if (longestWord.length > 2) {
        searchTerms.push(longestWord)
      }
    }

    // Detect category
    let category: string | null = null
    const categoryPatterns: { [key: string]: string[] } = {
      'ELECTRONICS': ['laptop', 'computer', 'phone', 'smartphone', 'tablet', 'electronics'],
      'CLOTHING': ['shirt', 't-shirt', 'pants', 'jeans', 'dress', 'clothing', 'apparel'],
      'SHOES': ['shoe', 'shoes', 'sneaker', 'boot', 'sandal'],
      'ACCESSORIES': ['bag', 'bags', 'purse', 'wallet', 'watch', 'jewelry'],
      'HOME': ['furniture', 'decor', 'home', 'kitchen']
    }

    for (const [cat, keywords] of Object.entries(categoryPatterns)) {
      if (keywords.some(kw => cleanQuery.includes(kw))) {
        category = cat
        break
      }
    }

    const primaryTerm = searchTerms[0] || normalized

    logger.info('🔄 Fallback query optimization', {
      original: query,
      primaryTerm,
      searchTerms,
      category
    })

    return {
      searchTerms: searchTerms.length > 0 ? searchTerms : [normalized],
      primaryTerm,
      category,
      filters
    }
  }

  /**
   * Check if AI optimization is available
   */
  isAIAvailable(): boolean {
    return this.isAvailable
  }
}

// Singleton instance
export const aiQueryOptimizer = new AIQueryOptimizer()