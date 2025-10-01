import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

/**
 * Structured query filters that Claude generates
 * These are SAFE to use in parameterized database queries
 */
export interface StructuredQueryFilters {
  // Text search
  searchTerms: string[]  // Keywords to search for

  // Filters - dynamically typed based on database configuration
  categories?: string[]  // CHANGED: Now array of categories for broader matching
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
   - "best tech deals" → Primary: tech/electronics (laptops, phones, tablets, headphones, etc.)

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
You will be provided with AVAILABLE_CATEGORIES from the database.
Your task is to intelligently map the user's query to the most relevant categories.

Rules:
1. Return categories as ARRAY: "categories": ["CATEGORY1", "CATEGORY2", ...]
2. Use semantic understanding to match user intent to category names
3. Consider product type, context, and modifiers to select the RIGHT categories
4. For broad queries (like "tech", "bags", "shoes"), include ALL relevant sub-categories
5. For specific queries (like "designer handbag", "running shoes"), be more selective
6. Pay attention to context clues: "designer bags" likely means fashion accessories, not hiking backpacks
7. ONLY use categories from the provided AVAILABLE_CATEGORIES list
8. When in doubt, include multiple related categories rather than being too restrictive

PRICE INTELLIGENCE:
Extract price constraints from user's natural language:
- "cheap" / "affordable" / "budget" → set reasonable maxPrice
- "under $X" / "less than $X" → maxPrice: X
- "expensive" / "premium" / "luxury" → set reasonable minPrice
- "$X to $Y" → minPrice: X, maxPrice: Y
- Use your judgment for what's "reasonable" based on product context

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
  "searchTerms": ["keyword1", "keyword2", "synonym1"],
  "categories": ["CATEGORY_FROM_AVAILABLE_LIST"],
  "minPrice": null,
  "maxPrice": null,
  "brands": [],
  "condition": [],
  "sortBy": "relevance",
  "sortDirection": "desc",
  "limit": 20,
  "intent": "Clear description of what user wants",
  "confidence": 0.0-1.0
}

If query is too vague or ambiguous:
{
  "searchTerms": [],
  "intent": "User wants something but not specific",
  "confidence": 0.4,
  "needsClarification": "What type of product are you looking for? For example, electronics, clothing, or home goods?"
}

Examples:

Example 1 - Specific product with price:
Input: "Find me vintage designer bags under $200"
Output: {
  "searchTerms": ["vintage", "designer", "handbag", "purse", "luxury"],
  "categories": ["WOMENS_ACCESSORIES", "MENS_ACCESSORIES"],  // Based on AVAILABLE_CATEGORIES
  "maxPrice": 200,
  "sortBy": "relevance",
  "intent": "User wants vintage designer bags under $200",
  "confidence": 0.95
}

Example 2 - Broad category query:
Input: "Best tech deals under $100"
Output: {
  "searchTerms": ["tech", "electronics"],
  "categories": ["LAPTOPS", "SMARTPHONES", "TABLETS", "SMARTWATCHES", "HEADPHONES", "CAMERAS", "GAMING_CONSOLES", "KEYBOARDS", "MICE", "MONITORS"],  // ALL tech categories from AVAILABLE_CATEGORIES
  "maxPrice": 100,
  "sortBy": "price",
  "sortDirection": "asc",
  "intent": "User wants affordable tech/electronics under $100",
  "confidence": 0.9
}

Example 3 - Specific product type:
Input: "mobile"
Output: {
  "searchTerms": ["phone", "smartphone", "mobile", "cell"],
  "categories": ["SMARTPHONES"],  // ONLY smartphones, NOT laptops or other electronics
  "sortBy": "relevance",
  "intent": "User wants mobile phones/smartphones",
  "confidence": 0.95
}

IMPORTANT: For broad queries (tech, electronics, shoes, bags, clothing), include ALL relevant sub-categories from AVAILABLE_CATEGORIES. For SPECIFIC product types (mobile, laptop, dress), be precise and only include the exact matching category. Don't arbitrarily exclude categories.

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
  private categoriesCache: string[] = []
  private categoriesCacheTime: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
   * Get available categories from database (with caching)
   */
  async getAvailableCategories(prisma: any): Promise<string[]> {
    const now = Date.now()

    // Return cached if still valid
    if (this.categoriesCache.length > 0 && (now - this.categoriesCacheTime) < this.CACHE_TTL) {
      return this.categoriesCache
    }

    try {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: { category: true }
      })

      this.categoriesCache = categories.map((c: any) => c.category)
      this.categoriesCacheTime = now

      logger.info(`📊 Fetched ${this.categoriesCache.length} categories from database`)
      return this.categoriesCache
    } catch (error) {
      logger.error('Error fetching categories', { error })
      return []
    }
  }

  /**
   * Generate structured query filters from natural language
   */
  async generateQuery(
    userMessage: string,
    prisma: any,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<StructuredQueryFilters> {
    if (!this.isAvailable || !this.anthropic) {
      logger.info('🔄 Using fallback query generation (no Claude API)')
      return await this.fallbackGeneration(userMessage)
    }

    try {
      // Get available categories dynamically
      const availableCategories = await this.getAvailableCategories(prisma)

      logger.info('🤖 Generating structured query with Claude', {
        message: userMessage,
        categoriesCount: availableCategories.length
      })

      // Build conversation context
      const messages: Anthropic.MessageParam[] = []

      if (conversationHistory) {
        messages.push(...conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        })))
      }

      // Inject available categories into the prompt
      messages.push({
        role: 'user',
        content: `Generate structured database filters for this query: "${userMessage}"

AVAILABLE_CATEGORIES in the database:
${availableCategories.join(', ')}

Return ONLY valid JSON, no other text.`
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
        categories: filters.categories,
        categoriesCount: filters.categories?.length || 0,
        confidence: filters.confidence,
        rawClaudeResponse: jsonMatch[0]
      })

      // No post-processing - trust Claude AI completely
      // All intelligence comes from the system prompt and available categories from database

      return filters
    } catch (error) {
      logger.error('❌ Structured query generation failed, using fallback', {
        error: error instanceof Error ? error.message : String(error)
      })
      return this.fallbackGeneration(userMessage)
    }
  }

  /**
   * Minimal fallback when Claude is unavailable
   * NO HARDCODING - just extract basic words and let database handle the rest
   */
  private async fallbackGeneration(message: string): Promise<StructuredQueryFilters> {
    const normalized = message.toLowerCase().trim()

    logger.warn('⚠️ Using minimal fallback (Claude API not configured)', { query: message })

    // Remove common filler words only
    const fillerWords = ['find', 'looking', 'for', 'show', 'me', 'i', 'want', 'need', 'the', 'a', 'an', 'some', 'get', 'buy']
    const words = normalized.split(/\s+/).filter(w => w.length > 2 && !fillerWords.includes(w))

    // Extract price constraint if present
    let maxPrice: number | undefined
    const priceMatch = normalized.match(/under\s+\$?(\d+)|less\s+than\s+\$?(\d+)|max\s+\$?(\d+)/)
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    }

    // Use words as search terms - database will match against name, description, brand, category
    const searchTerms = words.slice(0, 5) // Limit to 5 most important words

    logger.info('📝 Minimal fallback query', {
      searchTerms,
      maxPrice,
      wordCount: words.length
    })

    return {
      searchTerms,
      categories: undefined, // Let database search across ALL categories
      maxPrice,
      sortBy: 'relevance',
      limit: 20,
      intent: message,
      confidence: 0.3, // Low confidence - no AI understanding
      needsClarification: "Consider using Claude AI for better search results."
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