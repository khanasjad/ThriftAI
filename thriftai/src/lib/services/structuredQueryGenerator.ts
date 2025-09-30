import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { productConfig } from '@/lib/config/productConfig'

/**
 * Structured query filters that Claude generates
 * These are SAFE to use in parameterized database queries
 */
export interface StructuredQueryFilters {
  // Text search
  searchTerms: string[]  // Keywords to search for

  // Filters - dynamically typed based on database configuration
  category?: string  // Dynamic categories from configuration
  minPrice?: number
  maxPrice?: number
  brands?: string[]
  condition?: string[]  // Dynamic conditions from configuration

  // Sorting
  sortBy?: 'price' | 'relevance' | 'rating' | 'date' | 'popularity'
  sortDirection?: 'asc' | 'desc'

  // Pagination
  limit?: number
  offset?: number

  // Metadata
  intent: string  // What user wants (for logging/analytics)
  confidence: number  // 0-1 confidence in interpretation
  needsClarification?: string  // If query is ambiguous, ask this
}

const QUERY_GENERATION_SYSTEM_PROMPT = `You are an expert at converting natural language shopping queries into structured database filters for an e-commerce marketplace.

Your task: Generate intelligent JSON filters that maximize relevant product matches.

INTELLIGENT SEARCH TERM GENERATION:
1. Return ONLY valid JSON - no other text
2. Generate 2-4 STRATEGIC search terms that balance precision and recall
3. Understand product name patterns in databases:
   - "bags" → try "handbag", "purse", or "bag" (product names vary)
   - "phone" → try "phone", "smartphone", or brand names
   - "shoes" → try "shoe", "sneaker", "boot" based on context
   - "clothes" → extract specific type: "shirt", "pants", "dress"

SMART MAPPING STRATEGIES:
- "designer/luxury" → Include "luxury", "premium", or brand names (Coach, Gucci, Prada)
- "vintage/retro" → Keep "vintage" as primary term
- "cheap/affordable" → Set low maxPrice (< $100) instead of search term
- "expensive/premium" → Set high minPrice (> $500) or add "luxury"
- "eco/sustainable" → Add "sustainable", "eco", "recycled", "organic"
- "gaming" → Add relevant specs: "gaming", "rgb", "high-performance"

CONFIDENCE SCORING:
- 0.9+: Clear product type + specific requirements
- 0.7-0.9: Clear intent but some ambiguity
- 0.5-0.7: Vague but workable query
- <0.5: Too vague, needs clarification

SEARCH TERM RULES:
- Products must match ALL terms (AND logic)
- Balance specificity with database reality
- Consider synonyms but don't overload
- 2-4 terms maximum for best results

CATEGORIES (use exact values):
- ELECTRONICS (laptops, phones, tablets, cameras, etc.)
- CLOTHING (shirts, pants, jackets, etc.)
- SHOES (sneakers, boots, sandals, etc.)
- ACCESSORIES (bags, watches, jewelry, etc.)
- HOME (furniture, decor, kitchenware, etc.)
- BOOKS

CONDITIONS:
- new, like-new, excellent, good, fair

SORT OPTIONS:
- price, relevance, rating, date, popularity

Response format:
{
  "searchTerms": ["laptop", "gaming"],
  "category": "ELECTRONICS",
  "minPrice": 500,
  "maxPrice": 1000,
  "brands": ["Dell", "HP"],
  "condition": ["new", "like-new"],
  "sortBy": "price",
  "sortDirection": "asc",
  "limit": 20,
  "intent": "User wants a gaming laptop under $1000",
  "confidence": 0.9
}

If query is too vague or ambiguous:
{
  "searchTerms": [],
  "intent": "User wants something but not specific",
  "confidence": 0.4,
  "needsClarification": "What type of product are you looking for? For example, electronics, clothing, or home goods?"
}

Examples:

Input: "Find me vintage designer bags under $200"
Output: {
  "searchTerms": ["vintage", "handbag", "luxury"],
  "category": "ACCESSORIES",
  "maxPrice": 200,
  "sortBy": "relevance",
  "limit": 20,
  "intent": "User wants vintage designer bags under $200",
  "confidence": 0.95
}

Input: "I need a laptop for coding under $700"
Output: {
  "searchTerms": ["laptop", "coding", "programming"],
  "category": "ELECTRONICS",
  "maxPrice": 700,
  "sortBy": "relevance",
  "limit": 20,
  "intent": "User needs a programming laptop under $700",
  "confidence": 0.9
}

Input: "cheap"
Output: {
  "searchTerms": [],
  "intent": "User wants something cheap but not specific",
  "confidence": 0.3,
  "needsClarification": "What type of product are you looking for that's budget-friendly?"
}

Be intelligent and extract as much structured data as possible from the user's message!`

export class StructuredQueryGenerator {
  private anthropic: Anthropic | null = null
  private isAvailable: boolean = false

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (apiKey && !apiKey.includes('demo')) {
      try {
        this.anthropic = new Anthropic({ apiKey })
        this.isAvailable = true
        logger.info('✅ Structured Query Generator initialized with Claude API')
      } catch (error) {
        logger.error('❌ Failed to initialize Structured Query Generator', { error })
        this.isAvailable = false
      }
    } else {
      logger.warn('⚠️ Claude API key not configured - using fallback query generation')
      this.isAvailable = false
    }
  }

  /**
   * Generate structured query filters from natural language
   */
  async generateQuery(
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<StructuredQueryFilters> {
    if (!this.isAvailable || !this.anthropic) {
      logger.info('🔄 Using fallback query generation (no Claude API)')
      return await this.fallbackGeneration(userMessage)
    }

    try {
      logger.info('🤖 Generating structured query with Claude', { message: userMessage })

      // Build conversation context
      const messages: Anthropic.MessageParam[] = []

      if (conversationHistory) {
        messages.push(...conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        })))
      }

      messages.push({
        role: 'user',
        content: `Generate structured database filters for this query: "${userMessage}"\n\nReturn ONLY valid JSON, no other text.`
      })

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        temperature: 0.1,  // Low temperature for consistent extraction
        system: QUERY_GENERATION_SYSTEM_PROMPT,
        messages
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        logger.warn('⚠️ No JSON found in Claude response, using fallback')
        return await this.fallbackGeneration(userMessage)
      }

      const filters = JSON.parse(jsonMatch[0]) as StructuredQueryFilters

      logger.info('✅ Structured query generated successfully', {
        searchTerms: filters.searchTerms,
        category: filters.category,
        confidence: filters.confidence
      })

      return filters
    } catch (error) {
      logger.error('❌ Structured query generation failed, using fallback', {
        error: error instanceof Error ? error.message : String(error)
      })
      return this.fallbackGeneration(userMessage)
    }
  }

  /**
   * Fallback query generation using regex when Claude is unavailable
   */
  private async fallbackGeneration(message: string): Promise<StructuredQueryFilters> {
    const normalized = message.toLowerCase().trim()
    const searchTerms: string[] = []

    // Remove filler words
    const fillerWords = ['find', 'looking', 'for', 'show', 'me', 'i', 'want', 'need', 'the', 'a', 'an', 'some']
    const words = normalized.split(/\s+/).filter(w => w.length > 2 && !fillerWords.includes(w))

    // Extract price
    let maxPrice: number | undefined
    const priceMatch = normalized.match(/under\s+\$?(\d+)|less\s+than\s+\$?(\d+)|max\s+\$?(\d+)/)
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    }

    // Extract category dynamically from configuration
    let category: string | undefined
    try {
      category = await productConfig.findCategoryByKeyword(normalized)
    } catch (error) {
      logger.warn('Failed to load categories for fallback', { error })
    }

    // Extract brands dynamically from configuration
    const brands: string[] = []
    try {
      const brandList = await productConfig.getBrandNames()
      brandList.forEach(brandName => {
        if (normalized.includes(brandName.toLowerCase())) {
          brands.push(brandName)
        }
      })
    } catch (error) {
      logger.warn('Failed to load brands for fallback', { error })
    }

    // Use remaining words as search terms
    searchTerms.push(...words.slice(0, 5))

    const confidence = searchTerms.length > 0 || category ? 0.6 : 0.3
    const needsClarification = confidence < 0.5
      ? "Could you be more specific about what you're looking for?"
      : undefined

    return {
      searchTerms,
      category,
      maxPrice,
      brands: brands.length > 0 ? brands : undefined,
      sortBy: 'relevance',
      limit: 20,
      intent: message,
      confidence,
      needsClarification
    }
  }

  /**
   * Check if Claude API is available
   */
  isClaudeAvailable(): boolean {
    return this.isAvailable
  }
}

// Singleton instance
export const structuredQueryGenerator = new StructuredQueryGenerator()