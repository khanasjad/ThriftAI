import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { productConfig } from '@/config/productConfig'

export interface StructuredIntent {
  // IMPORTANT: Corrected and normalized query (fixes typos, variations)
  normalizedQuery: string

  hardFilters: {
    maxPrice?: number
    minPrice?: number
    category?: string
    availability?: boolean
    condition?: string[]
  }
  softPreferences: {
    brands?: string[]
    quality?: 'budget' | 'good' | 'premium'
    shippingSpeed?: 'standard' | 'fast' | 'any'
    priorityFactors?: ('price' | 'quality' | 'brand' | 'shipping')[]
  }
  keywords: string[]
  excludeKeywords?: string[] // Keywords to EXCLUDE from results (e.g., "headphone" when searching for "phone")
  useCase?: string
  intent: string
  confidence: number
}

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  currentQuery: string
}

const INTENT_EXTRACTION_PROMPT = `You are an expert at understanding shopping queries, fixing typos, and extracting structured search intent.

Your task is to:
1. FIX TYPOS and normalize the query (e.g., "tshrt" → "t-shirt", "labtop" → "laptop")
2. Handle variations (e.g., "tshirt", "t-shirt", "tee" all mean t-shirt)
3. Remove filler words like "looking for", "I want", "show me"
4. Extract structured filters and preferences
5. DISTINGUISH similar products (phone ≠ headphone, bag ≠ handbag, watch ≠ smartwatch)

Return a JSON object with this EXACT structure:

{
  "normalizedQuery": "corrected search query (fixes typos, removes filler)",
  "hardFilters": {
    "maxPrice": number | null,
    "minPrice": number | null,
    "category": "ELECTRONICS" | "CLOTHING" | "SHOES" | "ACCESSORIES" | "HOME" | null,
    "availability": true,
    "condition": ["new", "like-new", "excellent"] | null
  },
  "softPreferences": {
    "brands": ["brand1", "brand2"] | null,
    "quality": "budget" | "good" | "premium" | null,
    "shippingSpeed": "standard" | "fast" | "any",
    "priorityFactors": ["price", "quality", "brand", "shipping"]
  },
  "keywords": ["keyword1", "keyword2"],
  "excludeKeywords": ["term1", "term2"],
  "useCase": "gaming" | "work" | "school" | "casual" | null,
  "intent": "brief description of what user wants",
  "confidence": 0.0 to 1.0
}

CRITICAL RULES:
1. normalizedQuery: Fix ALL typos and normalize variations
   - "tshirt", "t-shrt", "tshrt", "tee" → "t-shirt"
   - "labtop", "laptoop" → "laptop"
   - "shose", "sheos" → "shoes"
   - "iphone", "i phone", "i-phone" → "iphone"
   - Remove filler: "looking for tshirt" → "t-shirt"

2. DISTINGUISH similar products - use excludeKeywords to exclude confusing matches:
   - "phone" → keywords: ["phone", "smartphone", "mobile"], excludeKeywords: ["headphone", "earphone"]
   - "headphone" → keywords: ["headphone", "earphone", "headset"], excludeKeywords: []
   - "bag" → keywords: ["bag", "backpack"], excludeKeywords: ["handbag"] (unless user wants handbag)
   - "watch" → keywords: ["watch", "timepiece"], excludeKeywords: ["smartwatch"] (unless user wants smartwatch)

3. hardFilters are STRICT - products MUST match these
4. softPreferences are nice-to-have - boost scoring but not required

5. Extract budget from patterns like:
   - "under $100" → maxPrice: 100
   - "between $50 and $200" → minPrice: 50, maxPrice: 200
   - "around $500" → minPrice: 400, maxPrice: 600

6. Map categories correctly:
   - tech, laptop, phone, electronics → ELECTRONICS
   - clothes, shirt, pants, dress → CLOTHING
   - shoes, sneakers, boots → SHOES
   - bags, watch, jewelry → ACCESSORIES

7. Extract brands from the query (Apple, Nike, Samsung, etc.)
8. Determine quality tier from words like "cheap/budget", "good/decent", "premium/best"
9. Keywords should be the main product types (not stop words)

EXAMPLES:
- Query: "phone" → keywords: ["phone", "smartphone", "mobile", "iphone", "android"], excludeKeywords: ["headphone", "earphone"]
- Query: "headphone" → keywords: ["headphone", "earphone", "headset", "earbud"], excludeKeywords: []
- Query: "iphone" → keywords: ["iphone", "iphone 15", "iphone 14", "iphone 13"], excludeKeywords: ["headphone"]

Be intelligent about typos and variations. Users often misspell or use different formats.`

export class ClaudeIntentExtractor {
  private anthropic: Anthropic | null = null
  private isAvailable: boolean = false

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (apiKey && !apiKey.includes('demo')) {
      try {
        this.anthropic = new Anthropic({ apiKey })
        this.isAvailable = true
        logger.info('Claude Intent Extractor initialized')
      } catch (error) {
        logger.error('Failed to initialize Claude Intent Extractor', { error })
        this.isAvailable = false
      }
    } else {
      logger.warn('Claude API key not configured - using fallback intent extraction')
      this.isAvailable = false
    }
  }

  async extractIntent(context: ConversationContext): Promise<StructuredIntent> {
    if (!this.isAvailable || !this.anthropic) {
      logger.info('Using fallback intent extraction (no Claude API)')
      return await this.fallbackExtraction(context)
    }

    try {
      logger.info('Extracting intent with Claude API', {
        messageCount: context.messages.length,
        query: context.currentQuery
      })

      // Build conversation history for Claude
      const conversationText = context.messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')

      const fullContext = conversationText
        ? `${conversationText}\nUser: ${context.currentQuery}`
        : `User: ${context.currentQuery}`

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Using Haiku 3.5 for fast, cost-effective intent extraction
        max_tokens: 1024,
        temperature: 0.1, // Low temperature for consistent extraction
        system: INTENT_EXTRACTION_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extract search intent from this conversation:\n\n${fullContext}\n\nReturn ONLY valid JSON, no other text.`
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
        logger.warn('No JSON found in Claude response, using fallback')
        return await this.fallbackExtraction(context)
      }

      const intent = JSON.parse(jsonMatch[0]) as StructuredIntent

      logger.info('Successfully extracted intent with Claude', {
        hardFilters: intent.hardFilters,
        keywords: intent.keywords,
        confidence: intent.confidence
      })

      return intent
    } catch (error) {
      logger.error('Claude intent extraction failed, using fallback', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined,
        apiKeyConfigured: !!this.anthropic
      })
      return await this.fallbackExtraction(context)
    }
  }

  /**
   * Fallback extraction using regex patterns when Claude API is unavailable
   */
  private async fallbackExtraction(context: ConversationContext): Promise<StructuredIntent> {
    const allText = [
      ...context.messages.filter(m => m.role === 'user').map(m => m.content),
      context.currentQuery
    ].join(' ').toLowerCase()

    // Basic normalization when Claude API is not available
    let normalizedQuery = context.currentQuery.toLowerCase().trim()

    // Handle common typos and variations
    const normalizations: [RegExp, string][] = [
      [/\btshirts?\b/gi, 't-shirt'],
      [/\bt-?shrt\b/gi, 't-shirt'],
      [/\btees?\b/gi, 't-shirt'],
      [/\blabt?o?ps?\b/gi, 'laptop'],
      [/\bsmartphones?\b/gi, 'phone'],
      [/\bcellphones?\b/gi, 'phone'],
      [/\bshose?s?\b/gi, 'shoes'],
      [/\bsheos\b/gi, 'shoes'],
      [/\blooking\s+for\s+/gi, ''],
      [/\bi\s+want\s+/gi, ''],
      [/\bshow\s+me\s+/gi, ''],
      [/\bfind\s+me\s+/gi, ''],
    ]

    for (const [pattern, replacement] of normalizations) {
      normalizedQuery = normalizedQuery.replace(pattern, replacement)
    }

    normalizedQuery = normalizedQuery.trim()

    const intent: StructuredIntent = {
      normalizedQuery,
      hardFilters: {
        availability: true
      },
      softPreferences: {
        shippingSpeed: 'any',
        priorityFactors: []
      },
      keywords: [],
      intent: context.currentQuery,
      confidence: 0.6
    }

    // Extract budget
    const budgetPatterns = [
      /under\s+\$?(\d+)/i,
      /below\s+\$?(\d+)/i,
      /less\s+than\s+\$?(\d+)/i,
      /max(?:imum)?\s+\$?(\d+)/i,
      /between\s+\$?(\d+)\s+(?:and|to|-)\s+\$?(\d+)/i,
      /around\s+\$?(\d+)/i,
      /\$(\d+)\s+(?:budget|max|maximum)/i
    ]

    for (const pattern of budgetPatterns) {
      const match = allText.match(pattern)
      if (match) {
        if (match[2]) {
          // Range: between $X and $Y
          intent.hardFilters.minPrice = parseInt(match[1])
          intent.hardFilters.maxPrice = parseInt(match[2])
        } else if (allText.includes('around')) {
          // Around $X → X * 0.8 to X * 1.2
          const price = parseInt(match[1])
          intent.hardFilters.minPrice = Math.floor(price * 0.8)
          intent.hardFilters.maxPrice = Math.ceil(price * 1.2)
        } else {
          // Under $X
          intent.hardFilters.maxPrice = parseInt(match[1])
        }
        break
      }
    }

    // Extract category dynamically from configuration
    try {
      const categories = await productConfig.getCategories()
      for (const categoryConfig of categories) {
        if (categoryConfig.keywords.some(kw => allText.includes(kw))) {
          intent.hardFilters.category = categoryConfig.name
          intent.keywords.push(...categoryConfig.keywords.filter(kw => allText.includes(kw)))
          break
        }
      }
    } catch (error) {
      logger.warn('Failed to load categories in fallback extraction', { error })
    }

    // Extract brands dynamically from configuration
    try {
      const brands = await productConfig.getBrands()
      const detectedBrands: string[] = []

      for (const brand of brands) {
        const patterns = [brand.name.toLowerCase(), ...(brand.alternateNames || [])]
        if (patterns.some(p => allText.includes(p))) {
          detectedBrands.push(brand.name)
        }
      }

      if (detectedBrands.length > 0) {
        intent.softPreferences.brands = detectedBrands
      }
    } catch (error) {
      logger.warn('Failed to load brands in fallback extraction', { error })
    }

    // Extract quality tier
    if (allText.match(/cheap|budget|affordable|inexpensive/)) {
      intent.softPreferences.quality = 'budget'
      intent.softPreferences.priorityFactors?.push('price')
    } else if (allText.match(/premium|best|high[- ]quality|luxury|top/)) {
      intent.softPreferences.quality = 'premium'
      intent.softPreferences.priorityFactors?.push('quality', 'brand')
    } else if (allText.match(/good|decent|reliable|solid/)) {
      intent.softPreferences.quality = 'good'
    }

    // Extract condition
    if (allText.includes('new') && !allText.includes('like new')) {
      intent.hardFilters.condition = ['new']
    } else if (allText.match(/like new|mint|excellent/)) {
      intent.hardFilters.condition = ['like-new', 'excellent', 'new']
    }

    // Extract use case
    const useCasePatterns = {
      'gaming': ['gaming', 'games', 'gamer'],
      'work': ['work', 'office', 'business', 'professional'],
      'school': ['school', 'college', 'student', 'studying'],
      'casual': ['casual', 'everyday', 'daily']
    }

    for (const [useCase, patterns] of Object.entries(useCasePatterns)) {
      if (patterns.some(p => allText.includes(p))) {
        intent.useCase = useCase
        break
      }
    }

    // Extract keywords if none found
    if (intent.keywords.length === 0) {
      const words = context.currentQuery.toLowerCase().split(/\s+/)
      const stopWords = ['find', 'show', 'looking', 'want', 'need', 'for', 'the', 'a', 'an', 'me', 'some', 'best', 'good', 'deal', 'deals']
      intent.keywords = words.filter(w => w.length > 2 && !stopWords.includes(w)).slice(0, 5)
    }

    // Shipping speed
    if (allText.match(/fast|quick|express|expedited|immediate/)) {
      intent.softPreferences.shippingSpeed = 'fast'
      intent.softPreferences.priorityFactors?.push('shipping')
    }

    logger.info('Fallback intent extraction completed', {
      hardFilters: intent.hardFilters,
      keywords: intent.keywords
    })

    return intent
  }

  /**
   * Check if Claude API is available
   */
  isClaudeAvailable(): boolean {
    return this.isAvailable
  }
}

// Singleton instance
export const claudeIntentExtractor = new ClaudeIntentExtractor()