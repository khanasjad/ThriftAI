import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { AIConfigService } from './aiConfigService'

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

const QUERY_GENERATION_SYSTEM_PROMPT = `You are an INTELLIGENT AI shopping assistant that uses SEMANTIC UNDERSTANDING to find relevant products, even when exact matches don't exist.

🎯 CORE PRINCIPLE: SEMANTIC SEARCH - ALWAYS FIND SOMETHING RELEVANT
This is an AI-powered app. We NEVER show 0 results. We understand INTENT and find semantically similar products.

YOUR TASK:
Analyze the user's query and generate FLEXIBLE, INTELLIGENT search parameters that will ALWAYS find relevant products using semantic understanding.

🧠 SEMANTIC INTENT UNDERSTANDING:
Extract the DEEPER MEANING behind the query, not just literal keywords.

Examples:
- "Rare collectibles and art" → INTENT: unique, valuable, special, limited edition, vintage, designer, luxury, exclusive
- "vintage designer bags" → INTENT: fashion, luxury, retro, classic, high-end, brand name, accessories
- "gaming laptop" → INTENT: powerful, high-performance, graphics, gaming, computer, tech
- "eco-friendly products" → INTENT: sustainable, organic, natural, green, environmentally friendly, recycled

🔑 SEMANTIC KEYWORD GENERATION (MOST IMPORTANT):
Generate 5-10 BROAD semantic keywords that capture the INTENT, not just the literal words.

Rules:
1. Think about what the user REALLY wants (the essence, not exact words)
2. Include synonyms, related concepts, and semantic equivalents
3. Include quality indicators (luxury, premium, vintage, designer, rare, limited, exclusive)
4. Include style descriptors that match the vibe
5. Cast a WIDE net - better to over-match than under-match

Examples:
- "Rare collectibles" → ["rare", "limited", "exclusive", "vintage", "designer", "luxury", "special", "unique", "premium", "collectible"]
- "Art" → ["artistic", "designer", "creative", "unique", "handmade", "custom", "special", "exclusive", "luxury"]
- "Tech gadgets" → ["technology", "electronic", "digital", "smart", "device", "gadget", "tech", "innovative"]

📂 CATEGORY DETECTION (PRAGMATIC MAPPING):
You will be provided with AVAILABLE_CATEGORIES from the database.

CRITICAL RULE: Map user intent to the CLOSEST available categories, even if not a perfect semantic match!

Rules:
1. For SPECIFIC queries (laptop, shoes, phone) → map to exact category match IF IT EXISTS
2. For BROAD/SEMANTIC queries (collectibles, art, luxury, eco-friendly) → include ALL potentially relevant categories
3. **PRAGMATIC FALLBACK**: If the exact category doesn't exist, find the CLOSEST related category
4. **KEYWORD SEARCH FALLBACK**: If NO category is even remotely related, leave categories EMPTY [] to use broad keyword search
5. Think: "What categories in this database could satisfy the user's need?"
6. Better to show SOMETHING relevant than NOTHING
7. ❌ NEVER map to completely unrelated categories just to fill the array

Examples:
- "laptop" + has LAPTOPS → categories: ["LAPTOPS"] (exact match)
- "rare collectibles" + has JEWELRY, WATCHES, ACCESSORIES → categories: ["JEWELRY", "WATCHES", "ACCESSORIES"] (could be in any)
- "designer bags" + has HANDBAGS, BACKPACKS → categories: ["HANDBAGS", "BACKPACKS"] (bag-related categories)
- "bag" + has BACKPACKS (no HANDBAGS) → categories: ["BACKPACKS"] (closest match - still a bag!)
- "eco-friendly" + has CLOTHING, HOME_GOODS → categories: ["CLOTHING", "HOME_GOODS"] (eco products could be anywhere)
- **"car" + has TOYS, RC_TOYS but NO car category** → categories: [] (no relevant match - use keyword search to find brands/products with "car" in name)
- **"pizza" + marketplace has NO food** → categories: [] (no match - rely on keyword search)

**PRAGMATIC PRINCIPLE**:
- First try: exact category match
- Second try: semantically close categories
- Last resort: categories: [] (empty) to trigger broad keyword search across ALL products
- ❌ NEVER pick random unrelated categories

PRICE INTELLIGENCE:
Extract price constraints from user's natural language:
- "cheap" / "affordable" / "budget" → set reasonable maxPrice
- "under $X" / "less than $X" → maxPrice: X
- "expensive" / "premium" / "luxury" → set reasonable minPrice
- "$X to $Y" → minPrice: X, maxPrice: Y
- Use your judgment for what's "reasonable" based on product context

BRAND DETECTION:
Extract any brand names mentioned (Nike, Apple, Gucci, etc.) into brands array.

CONDITION DETECTION (CRITICAL - AVOID ZERO RESULTS):
The "condition" field is for PRODUCT CONDITION ONLY, not descriptive attributes!

VALID CONDITIONS (exact match required):
- "New" - brand new products
- "Like New" - excellent condition, barely used
- "Very Good" - minor wear, fully functional
- "Good" - noticeable wear but works well
- "Acceptable" - significant wear but usable

IMPORTANT RULES:
1. ❌ NEVER put descriptive words in condition: "vintage", "designer", "luxury", "rare", "modern", "classic", etc.
2. ❌ These are NOT conditions - they are search attributes that go in searchTerms
3. ✅ Only use condition if user explicitly mentions product condition (e.g., "new phone", "used laptop", "like new shoes")
4. ✅ When in doubt, leave condition EMPTY [] - it's better to show results than filter to zero

Examples:
- "vintage designer bag" → condition: [] (vintage is a style, not a condition - put in searchTerms)
- "new iPhone" → condition: ["New"] (user wants new product)
- "used laptop" → condition: ["Good", "Very Good", "Acceptable"] (used = various conditions)
- "like new shoes" → condition: ["Like New"] (explicit condition)
- "luxury watch" → condition: [] (luxury is not a condition)
- "cheap phone" → condition: [] (cheap is about price, not condition)

DEFAULT: Leave condition: [] unless user explicitly mentions product condition.

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
Available categories: HANDBAGS, BACKPACKS, ACCESSORIES, ELECTRONICS, CLOTHING
Output: {
  "searchTerms": ["vintage", "designer", "bag", "handbag", "luxury", "retro", "classic"],
  "categories": ["HANDBAGS", "BACKPACKS", "ACCESSORIES"],  // All bag-related categories
  "maxPrice": 200,
  "condition": [],  // CRITICAL: "vintage" is NOT a condition, it's a style descriptor!
  "sortBy": "relevance",
  "intent": "User wants vintage designer bags under $200",
  "confidence": 0.9
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
  "condition": [],
  "sortBy": "relevance",
  "intent": "User wants mobile phones/smartphones",
  "confidence": 0.95
}

Example 4 - SEMANTIC SEARCH (Broad query maps to multiple categories):
Input: "Rare collectibles and art"
Available categories: ELECTRONICS, CLOTHING, ACCESSORIES, JEWELRY, WATCHES, HOME_DECOR, SHOES, BAGS
Output: {
  "searchTerms": ["rare", "limited", "exclusive", "vintage", "designer", "luxury", "special", "unique", "premium", "collectible", "artistic", "handmade", "custom"],
  "categories": ["ACCESSORIES", "JEWELRY", "WATCHES", "HOME_DECOR", "BAGS"],  // ALL categories that could contain collectibles/art
  "sortBy": "relevance",
  "intent": "User wants unique, valuable, special items with artistic or collectible value",
  "confidence": 0.85
}

Example 5 - SEMANTIC SEARCH with broad intent:
Input: "eco-friendly sustainable products"
Available categories: CLOTHING, HOME_DECOR, ACCESSORIES, BAGS, ELECTRONICS, BEAUTY
Output: {
  "searchTerms": ["eco", "sustainable", "organic", "natural", "green", "environmentally", "recycled", "reusable", "biodegradable", "ethical"],
  "categories": ["CLOTHING", "HOME_DECOR", "ACCESSORIES", "BAGS", "BEAUTY"],  // Eco products could be in many categories
  "sortBy": "relevance",
  "intent": "User wants environmentally friendly and sustainable products",
  "confidence": 0.9
}

IMPORTANT: For broad semantic queries, map to MULTIPLE potentially relevant categories. Only leave categories empty if NO categories could possibly match the intent.

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

      // Get AI configuration from database
      const config = await AIConfigService.getConfig('query_generation')

      const response = await this.anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
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