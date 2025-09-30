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

const QUERY_GENERATION_SYSTEM_PROMPT = `You are an advanced AI shopping assistant that understands natural language queries and converts them into optimal database search parameters.

CORE PRINCIPLE: NO HARDCODING - Understand ANY product query dynamically using your knowledge.

YOUR TASK:
Analyze the user's search query and generate intelligent, flexible search parameters that will find the most relevant products.

INTELLIGENT QUERY UNDERSTANDING:
1. Extract the PRIMARY product type (what they're actually looking for)
   - "Find vintage designer bags" → Primary: bags/handbag/purse
   - "red nike shoes" → Primary: shoe/sneaker
   - "gaming laptop under 1000" → Primary: laptop/computer

2. Extract MODIFIERS (attributes they care about)
   - Style: vintage, modern, classic, retro
   - Quality: designer, luxury, premium, cheap, affordable
   - Brand: Nike, Gucci, Apple, etc.
   - Color, size, material, features

3. Extract CONSTRAINTS
   - Price: "under $X", "cheap", "expensive"
   - Condition: new, used, like-new
   - Urgency: need, want, looking for

SMART SEARCH TERM GENERATION:
- Generate 1-3 core terms for the PRODUCT TYPE (with synonyms)
  Example: "bags" → ["bag", "handbag", "purse", "backpack", "tote"]
- Include modifiers as SEPARATE terms only if they're critical for matching
  Example: "vintage designer bags" → ["bag", "handbag", "vintage", "designer"]
- Use your knowledge of products to include relevant synonyms
- DON'T include filler words (find, looking, for, the, a, an, some)

CATEGORY DETECTION:
Intelligently map to ONE of these categories based on product type:
- ELECTRONICS (phones, laptops, tablets, cameras, headphones, gaming, tech)
- CLOTHING (shirts, pants, jackets, dresses, sweaters, hoodies, tops)
- SHOES (sneakers, boots, sandals, heels, loafers, athletic)
- ACCESSORIES (bags, purses, wallets, watches, jewelry, sunglasses, belts, hats)
- HOME (furniture, decor, kitchen, bedding, appliances)
- BOOKS (novels, textbooks, ebooks, magazines)
- SPORTS (fitness, gym, athletic, outdoor, exercise equipment)
- TOYS (games, puzzles, action figures, dolls)
- BEAUTY (makeup, skincare, perfume, cosmetics)
- AUTOMOTIVE (car parts, accessories, tools)

If unsure, omit category - let database search all categories.

PRICE INTELLIGENCE:
- "cheap" / "affordable" / "budget" → maxPrice: 100
- "under $X" → maxPrice: X
- "expensive" / "premium" / "luxury" → minPrice: 200
- Specific price mentioned → Use that as constraint

BRAND DETECTION:
Extract any brand names mentioned (Nike, Apple, Gucci, etc.) into brands array.

CONFIDENCE SCORING:
- 0.9+: Crystal clear what they want (product type + details)
- 0.7-0.9: Clear product type, some ambiguity in details
- 0.5-0.7: Vague product type but workable
- <0.5: Too vague, request clarification

SORT INTELLIGENCE:
- Default: "relevance"
- If price constraint: "price" (asc if budget, desc if premium)
- If "best" / "top rated": "rating" desc
- If "new" / "latest": "date" desc
- If "popular" / "trending": "popularity" desc

RESPONSE FORMAT (JSON only, no other text):
{
  "searchTerms": ["bag", "handbag", "purse", "vintage", "designer"],
  "category": "ACCESSORIES",
  "minPrice": null,
  "maxPrice": null,
  "brands": [],
  "condition": [],
  "sortBy": "relevance",
  "sortDirection": "desc",
  "limit": 20,
  "intent": "User wants vintage designer bags",
  "confidence": 0.95
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
   * Fallback query generation using smart pattern matching when Claude is unavailable
   * Mimics Claude's intelligence with basic NLP
   */
  private async fallbackGeneration(message: string): Promise<StructuredQueryFilters> {
    const normalized = message.toLowerCase().trim()
    const searchTerms: string[] = []

    logger.warn('⚠️ Using fallback query generation (Claude API not configured)', { query: message })

    // Remove filler words
    const fillerWords = ['find', 'looking', 'for', 'show', 'me', 'i', 'want', 'need', 'the', 'a', 'an', 'some', 'get', 'buy']
    const words = normalized.split(/\s+/).filter(w => w.length > 2 && !fillerWords.includes(w))

    // Product type detection (basic patterns)
    const productTypePatterns: Record<string, { keywords: string[]; category: string; synonyms: string[] }> = {
      'bag': { keywords: ['bag', 'bags', 'handbag', 'handbags', 'purse', 'purses', 'backpack', 'tote'], category: 'ACCESSORIES', synonyms: ['bag', 'handbag', 'purse'] },
      'shoe': { keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots'], category: 'SHOES', synonyms: ['shoe', 'sneaker'] },
      'shirt': { keywords: ['shirt', 'shirts', 'tshirt', 't-shirt', 'top'], category: 'CLOTHING', synonyms: ['shirt'] },
      'jeans': { keywords: ['jeans', 'denim'], category: 'CLOTHING', synonyms: ['jeans'] },
      'phone': { keywords: ['phone', 'phones', 'iphone', 'smartphone'], category: 'ELECTRONICS', synonyms: ['phone'] },
      'laptop': { keywords: ['laptop', 'laptops', 'computer', 'macbook'], category: 'ELECTRONICS', synonyms: ['laptop'] },
      'watch': { keywords: ['watch', 'watches'], category: 'ACCESSORIES', synonyms: ['watch'] },
      'car': { keywords: ['car', 'cars', 'vehicle', 'auto'], category: 'AUTOMOTIVE', synonyms: ['car'] },
    }

    // Detect product type
    let detectedProduct: { category: string; synonyms: string[] } | null = null
    for (const [, pattern] of Object.entries(productTypePatterns)) {
      if (pattern.keywords.some(kw => normalized.includes(kw))) {
        detectedProduct = pattern
        // Add product type synonyms to search terms
        searchTerms.push(...pattern.synonyms)
        break
      }
    }

    // Extract modifiers (quality, style, etc.) - add as additional search terms
    const modifiers: string[] = []
    const modifierPatterns = ['vintage', 'designer', 'luxury', 'premium', 'cheap', 'affordable', 'new', 'used', 'classic', 'modern']
    for (const modifier of modifierPatterns) {
      if (normalized.includes(modifier)) {
        modifiers.push(modifier)
      }
    }

    // Add modifiers to search terms
    searchTerms.push(...modifiers)

    // Extract price
    let maxPrice: number | undefined
    const priceMatch = normalized.match(/under\s+\$?(\d+)|less\s+than\s+\$?(\d+)|max\s+\$?(\d+)/)
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    }

    // Cheap/affordable → maxPrice
    if (normalized.match(/\b(cheap|affordable|budget)\b/)) {
      maxPrice = 100
    }

    // Category from detected product or try config
    let category: string | undefined = detectedProduct?.category
    if (!category) {
      try {
        category = await productConfig.findCategoryByKeyword(normalized)
      } catch (error) {
        logger.warn('Failed to load categories for fallback', { error })
      }
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

    // If no search terms yet, use all meaningful words
    if (searchTerms.length === 0) {
      searchTerms.push(...words.slice(0, 5))
    }

    const confidence = (detectedProduct && searchTerms.length > 0) ? 0.7 : 0.4
    const needsClarification = confidence < 0.5
      ? "Could you be more specific about what you're looking for?"
      : undefined

    logger.info('📝 Fallback generated query', {
      searchTerms,
      category,
      modifiers,
      maxPrice,
      confidence
    })

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