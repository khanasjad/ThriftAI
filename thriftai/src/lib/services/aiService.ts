import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../prisma'
import { logger } from '@/lib/logger'
import { isOpenAIAvailable, isAnthropicAvailable, getAiConfig } from '@/config/api.config'
import { ConfigurationService } from './configurationService'

export interface SearchResult {
  id: string
  name: string
  price: number
  originalPrice: number
  brand?: string
  category: string
  condition?: string
  imageUrl?: string
  dynamicSpecs?: any  // ✅ Include database specifications
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
    try {
      const aiConfig = getAiConfig()

      // Initialize OpenAI if API key is available
      if (isOpenAIAvailable()) {
        this.openai = new OpenAI({
          apiKey: aiConfig.openai.apiKey!,
          baseURL: aiConfig.openai.baseUrl,
          timeout: aiConfig.openai.timeout,
          maxRetries: aiConfig.openai.retries,
        })
        logger.info('OpenAI client initialized successfully', {
          component: 'AIService',
          metadata: { model: aiConfig.openai.model }
        })
      } else {
        logger.warn('OpenAI API key not configured', { component: 'AIService' })
      }

      // Initialize Claude/Anthropic if API key is available
      if (isAnthropicAvailable()) {
        this.anthropic = new Anthropic({
          apiKey: aiConfig.anthropic.apiKey!,
          baseURL: aiConfig.anthropic.baseUrl,
          timeout: aiConfig.anthropic.timeout,
          maxRetries: aiConfig.anthropic.retries,
        })
        logger.info('Anthropic client initialized successfully', {
          component: 'AIService',
          metadata: { model: aiConfig.anthropic.model }
        })
      } else {
        logger.warn('Anthropic API key not configured', { component: 'AIService' })
      }
    } catch (error) {
      logger.error('Failed to initialize AI services', error, { component: 'AIService' })
    }
  }

  /**
   * Check if Claude AI is available
   */
  static isClaudeAvailable(): boolean {
    return !!this.anthropic
  }

  /**
   * Check if OpenAI is available
   */
  static isOpenAIAvailable(): boolean {
    return !!this.openai
  }

  /**
   * ChatGPT Search with intelligent product recommendations
   */
  static async chatGPTSearch(query: string, preferences: any = {}): Promise<AISearchResponse> {
    try {
      // Use Claude AI to build smart search query
      const products = await this.searchProductsWithIntent(query)

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
      // Enhanced product search with budget filtering using configuration
      const sorting = preferences.sorting || { field: 'relevance', direction: 'desc' }
      const products = await this.searchProductsEnhanced(query, budget, sorting)

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

          console.log(`🔍 Claude Search: query="${query}", found ${products.length} products:`, productData)

          const message = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            temperature: 0.7,
            messages: [{
              role: "user",
              content: `As an expert thrift shopping advisor, analyze this search: "${query}" with budget: $${budget || 'unlimited'}.

I found ${products.length} actual secondhand products in our store. Here are the available items:

${JSON.stringify(productData, null, 2)}

IMPORTANT: Only discuss the products I've provided above. Do NOT mention any products that aren't in this list.

Please provide guidance on:

1. **Smart Shopping Analysis**: Which of these actual products offer the best value and why?
2. **Sustainability Impact**: Environmental benefits of choosing these specific secondhand items
3. **Quality Assessment**: Evaluation of condition, brand reputation, and longevity for these items
4. **Negotiation Tips**: Advice for getting the best deals on these specific products
5. **Style Recommendations**: How to style these actual pieces

Focus only on the products I've provided. Be enthusiastic about thrift shopping while providing practical advice about these specific items.`
            }]
          })

          aiResponse = message.content[0]?.text || ''

          // Generate sustainability insights
          sustainabilityInsights = this.generateSustainabilityInsights(products)

        } catch (error: any) {
          console.warn('Claude API error:', error?.message || error)

          // Retry logic for rate limiting
          if (error?.status === 429) {
            console.log('Rate limited, retrying in 2 seconds...')
            await new Promise(resolve => setTimeout(resolve, 2000))

            try {
              const retryMessage = await this.anthropic.messages.create({
                model: "claude-3-haiku-20240307", // Fallback to faster model
                max_tokens: 600,
                messages: [{
                  role: "user",
                  content: `Brief thrift shopping advice for "${query}" with budget: $${budget || 'unlimited'}. Available items: ${productData.slice(0, 2).map(p => `${p.name} - $${p.price}`).join(', ')}`
                }]
              })
              aiResponse = retryMessage.content[0]?.text || ''
            } catch (retryError) {
              console.warn('Claude retry failed:', retryError)
            }
          }
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
  static async searchProducts(query: string, budget?: number): Promise<SearchResult[]> {
    console.log('🔍 Search query:', query)

    // Extract meaningful keywords from the query (remove filler words)
    const extractedKeywords = this.extractKeywords(query)
    console.log('🔑 Extracted keywords:', extractedKeywords)

    // HOTFIX: Disable category detection - it's too strict and excludes valid results
    // Categories like "MENS_SNEAKERS" don't match when searching for "sneakers"
    const categoryFilter = null // this.detectCategoryFromQuery(query)
    console.log('🎯 Category filter detected (disabled):', categoryFilter)

    // First try exact word boundary matches using PostgreSQL word boundary operators
    const escapedQuery = query.replace(/'/g, "''") // Escape single quotes for SQL
    const categoryCondition = categoryFilter ? `AND "category" = '${categoryFilter}'` : ''
    const wordBoundarySQL = `
      SELECT "id", "name", "price", "originalPrice", "brand", "category", "condition", "imageUrl", "sellerId", "isAvailable"
      FROM "products"
      WHERE "isAvailable" = true
      AND (
        "name" ~* '\\m${escapedQuery}\\M' OR
        "description" ~* '\\m${escapedQuery}\\M' OR
        "brand" ~* '\\m${escapedQuery}\\M' OR
        "category" ~* '\\m${escapedQuery}\\M'
      )
      ${categoryCondition}
      ${budget ? `AND "price" <= ${budget}` : ''}
      ORDER BY "price" ASC, "createdAt" DESC
      LIMIT 20
    `

    // HOTFIX: Disable PostgreSQL word boundary search - it's not finding results
    // Skip directly to the fallback contains search which works better
    console.log(`🎯 Skipping word boundary search, using contains search for: ${query}`)

    /* Original word boundary search - disabled
    try {
      // Try word boundary search first
      console.log(`🎯 Attempting word boundary search for: ${query}`)
      const exactMatches = await prisma.$queryRawUnsafe(wordBoundarySQL) as any[]
      console.log(`🎯 Word boundary search found ${exactMatches.length} exact matches`)

      if (exactMatches.length > 0) {
        // Get seller information for exact matches
        const productsWithSellers = await Promise.all(
          exactMatches.map(async (product) => {
            const seller = await prisma.seller.findUnique({
              where: { id: product.sellerId },
              select: { businessName: true, rating: true }
            })
            return { ...product, seller }
          })
        )

        console.log(`🎯 Returning ${productsWithSellers.length} word boundary matches`)
        return productsWithSellers.map(p => ({
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
    } catch (error) {
      console.warn('🎯 Word boundary search failed, falling back to contains:', error)
    }
    */

    // Fallback to contains search if no exact matches or if word boundary search fails
    // Build OR conditions for each keyword
    const orConditions: any[] = []

    extractedKeywords.forEach(keyword => {
      orConditions.push(
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { brand: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } }
      )
    })

    const where: any = {
      isAvailable: true,
      OR: orConditions
    }

    // Apply category filter if detected
    if (categoryFilter) {
      where.category = categoryFilter
    }

    if (budget) {
      where.price = { lte: budget }
    }

    console.log('🔍 Prisma where clause:', JSON.stringify(where, null, 2))

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        brand: true,
        category: true,
        condition: true,
        imageUrl: true,
        dynamicSpecs: true,  // ✅ Include database specifications
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

    console.log(`🔍 Fallback search returned ${products.length} products`)
    if (products.length > 0) {
      console.log(`🔍 Sample products:`, products.slice(0, 3).map(p => ({ id: p.id, name: p.name, brand: p.brand, category: p.category })))
    }

    // HOTFIX: Disable strict word boundary filtering - it's filtering out valid results
    // The word boundary check was too strict and excluded products with underscores in categories
    // Just return all products from the database query since Prisma already filtered correctly
    const filteredProducts = products

    /* Original strict filtering - disabled
    const filteredProducts = products.filter(product => {
      const queryLower = query.toLowerCase().trim()
      const productName = product.name.toLowerCase()
      const productDescription = (product.description || '').toLowerCase()
      const productBrand = (product.brand || '').toLowerCase()
      const productCategory = product.category.toLowerCase()

      // Check if the query appears as a whole word in any field
      const fields = [productName, productDescription, productBrand, productCategory]
      const hasWordMatch = fields.some(field => {
        // Use word boundary regex to check if query appears as complete word
        const wordBoundaryRegex = new RegExp(`\\b${queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
        return wordBoundaryRegex.test(field)
      })

      if (!hasWordMatch) {
        console.log(`🚫 Filtering out "${product.name}" - no word boundary match for "${query}"`)
      }

      return hasWordMatch
    })
    */

    console.log(`🔍 After filtering false positives: ${filteredProducts.length} products remain`)

    return filteredProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      brand: p.brand || undefined,
      category: p.category,
      condition: p.condition || undefined,
      imageUrl: p.imageUrl || undefined,
      dynamicSpecs: p.dynamicSpecs || undefined,  // ✅ Include specifications from database
      seller: p.seller ? {
        businessName: p.seller.businessName,
        rating: p.seller.rating
      } : undefined
    }))
  }

  /**
   * Detect category from search query
   * Maps query keywords to specific product categories
   */
  /**
   * Extract meaningful keywords from search query
   * Remove filler words and split into searchable terms
   */
  /**
   * Search products using Claude AI to understand intent
   */
  private static async searchProductsWithIntent(query: string): Promise<SearchResult[]> {
    console.log('🤖 Using Claude AI to understand search intent:', query)

    // Use Claude to extract intent
    const intent = await this.extractSearchIntent(query)
    console.log('🎯 Search intent:', intent)

    // Build smart query based on intent
    const andConditions: any[] = []

    // Required terms - at least ONE must match (OR logic within the group)
    if (intent.requiredTerms.length > 0) {
      const requiredOr: any[] = []
      intent.requiredTerms.forEach(term => {
        requiredOr.push(
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } }
        )
      })
      andConditions.push({ OR: requiredOr })
    }

    // Optional terms are NOT added to the query - they're only used for intent understanding
    // Products are filtered based on required terms only, making optional terms truly optional

    const where: any = {
      isAvailable: true
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    console.log('🔍 Smart where clause:', JSON.stringify(where, null, 2))

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        brand: true,
        category: true,
        condition: true,
        imageUrl: true,
        dynamicSpecs: true,  // ✅ Include database specifications
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

    console.log(`🎯 Smart search found ${products.length} products`)

    return products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      brand: p.brand || undefined,
      category: p.category,
      condition: p.condition || undefined,
      imageUrl: p.imageUrl || undefined,
      dynamicSpecs: p.dynamicSpecs || undefined,  // ✅ Include specifications from database
      seller: p.seller ? {
        businessName: p.seller.businessName,
        rating: p.seller.rating
      } : undefined
    }))
  }

  /**
   * Use Claude AI to extract search intent
   */
  private static async extractSearchIntent(query: string): Promise<{
    requiredTerms: string[]
    optionalTerms: string[]
    category?: string
  }> {
    // If no Claude, fall back to simple extraction
    if (!this.anthropic) {
      return {
        requiredTerms: [],
        optionalTerms: this.extractKeywords(query)
      }
    }

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Analyze this search query and extract:
1. REQUIRED terms (core nouns: what the user is looking for - like "bag", "phone", "laptop")
2. OPTIONAL terms (qualifiers: vintage, designer, cheap, etc.)

Query: "${query}"

Respond ONLY with JSON:
{
  "requiredTerms": ["array of required terms with synonyms"],
  "optionalTerms": ["array of optional qualifier terms"]
}

Example:
Query: "Find vintage designer bags"
Response: {"requiredTerms": ["bag", "handbag", "purse", "tote"], "optionalTerms": ["vintage", "designer"]}

Query: "Best tech deals under $100"
Response: {"requiredTerms": ["electronics", "tech", "gadget", "device"], "optionalTerms": []}`
        }]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const intent = JSON.parse(jsonMatch[0])
          console.log('🤖 Claude extracted intent:', intent)
          return intent
        }
      }
    } catch (error) {
      console.warn('Claude intent extraction failed, using fallback:', error)
    }

    // Fallback to simple extraction
    return {
      requiredTerms: [],
      optionalTerms: this.extractKeywords(query)
    }
  }

  private static extractKeywords(query: string): string[] {
    // Filler words to remove
    const fillerWords = [
      'find', 'get', 'show', 'me', 'search', 'for', 'looking', 'want', 'need',
      'buy', 'purchase', 'shop', 'browse', 'the', 'a', 'an', 'some', 'any',
      'best', 'good', 'great', 'top', 'cheap', 'affordable', 'under', 'deals'
    ]

    // Category/keyword mappings to expand search terms
    const categoryMappings: Record<string, string[]> = {
      'tech': ['tech', 'electronics', 'gadget', 'device'],
      'phone': ['phone', 'iphone', 'samsung', 'mobile'],
      'laptop': ['laptop', 'macbook', 'computer', 'notebook'],
      'bag': ['bag', 'handbag', 'purse', 'tote'],
      'bags': ['bag', 'handbag', 'purse', 'tote'],
      'shoe': ['shoe', 'sneaker', 'boot', 'footwear'],
      'shoes': ['shoe', 'sneaker', 'boot', 'footwear'],
      'watch': ['watch', 'timepiece'],
      'jacket': ['jacket', 'coat', 'outerwear'],
    }

    // Split query into words and filter out filler words
    let words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => {
        // Remove empty strings and filler words
        return word.length > 0 && !fillerWords.includes(word)
      })
      .filter(word => {
        // Remove $ symbols and numbers like "$100"
        return !/^\$?\d+$/.test(word)
      })

    // Expand keywords using category mappings
    const expandedWords: string[] = []
    words.forEach(word => {
      if (categoryMappings[word]) {
        // Add all mapped terms
        expandedWords.push(...categoryMappings[word])
      } else {
        // Keep the original word
        expandedWords.push(word)
      }
    })

    // Remove duplicates
    const uniqueWords = [...new Set(expandedWords)]

    // If no keywords extracted, use the original query
    if (uniqueWords.length === 0) {
      return [query]
    }

    console.log('🔍 Keywords extracted from query:', uniqueWords)
    return uniqueWords
  }

  private static detectCategoryFromQuery(query: string): string | null {
    const queryLower = query.toLowerCase().trim()

    // Category keyword mappings
    const categoryMappings: Record<string, string[]> = {
      'SMARTPHONES': ['mobile', 'phone', 'smartphone', 'cellphone', 'mobile phone', 'cell phone', 'iphone', 'android phone'],
      'LAPTOPS': ['laptop', 'notebook', 'macbook', 'chromebook'],
      'TABLETS': ['tablet', 'ipad'],
      'SMARTWATCHES': ['smartwatch', 'smart watch', 'apple watch', 'watch'],
      'HEADPHONES': ['headphones', 'headset', 'earbuds', 'earphones', 'airpods'],
      'CAMERAS': ['camera', 'dslr', 'mirrorless'],
      'MENS_SHIRTS': ['mens shirt', 'men shirt', 'mens shirts'],
      'MENS_JEANS': ['mens jeans', 'men jeans'],
      'MENS_PANTS': ['mens pants', 'men pants'],
      'WOMENS_TOPS': ['womens top', 'women top', 'womens tops'],
      'WOMENS_JEANS': ['womens jeans', 'women jeans'],
      'WOMENS_DRESSES': ['dress', 'womens dress', 'women dress', 'dresses'],
      'BASKETBALL_SHOES': ['basketball shoes', 'basketball shoe', 'basketball sneakers'],
      'RUNNING_SHOES': ['running shoes', 'running shoe', 'runners'],
    }

    // Check for exact matches or keyword matches
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      for (const keyword of keywords) {
        if (queryLower === keyword || queryLower.includes(keyword)) {
          return category
        }
      }
    }

    return null
  }

  /**
   * Normalize search query to handle common variations
   * Converts "tshirt" → "shirt", "smartphone" → "phone", etc.
   */
  private static normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim()

    // Common product name variations
    const substitutions: [RegExp, string][] = [
      [/\btshirts?\b/gi, 'shirt'],  // tshirt/tshirts → shirt
      [/\bsmartphones?\b/gi, 'phone'],
      [/\bcellphones?\b/gi, 'phone'],
      [/\bmobilephones?\b/gi, 'phone'],
    ]

    // Apply substitutions
    for (const [pattern, replacement] of substitutions) {
      normalized = normalized.replace(pattern, replacement)
    }

    return normalized
  }

  /**
   * Enhanced search products using database-driven configuration
   */
  static async searchProductsEnhanced(
    query: string,
    budget?: number,
    sorting?: { field: string; direction: string }
  ): Promise<SearchResult[]> {
    console.log('🔍 Enhanced search query:', query)

    // Normalize query to handle common variations (tshirt → t-shirt)
    const normalizedQuery = this.normalizeQuery(query)
    if (normalizedQuery !== query.toLowerCase()) {
      console.log('🔄 Normalized query:', query, '→', normalizedQuery)
    }

    try {
      // Get relevant categories and exclusions from configuration
      const [relevantCategories, excludedCategories, keywordMapping] = await Promise.all([
        ConfigurationService.getRelevantCategoriesForIntent(normalizedQuery),
        ConfigurationService.getExcludedCategoriesForIntent(normalizedQuery),
        ConfigurationService.getCategoryKeywordsMapping()
      ])

      console.log('🎯 Configuration-driven search:', {
        query: normalizedQuery,
        relevantCategories: relevantCategories.slice(0, 5),
        excludedCategories,
        keywordMappingSize: keywordMapping.size
      })

      // Enhanced search logic using configuration
      const searchTerms = this.extractSearchTerms(normalizedQuery, keywordMapping)
      console.log('🔑 Extracted search terms:', searchTerms)

      // Build intelligent search query
      const where: any = {
        isAvailable: true,
        AND: [
          // Include products from relevant categories
          relevantCategories.length > 0 ? {
            category: { in: relevantCategories }
          } : {},

          // Exclude unwanted categories
          excludedCategories.length > 0 ? {
            category: { notIn: excludedCategories }
          } : {},

          // Apply budget filter if provided
          budget ? { price: { lte: budget } } : {},

          // Enhanced search across multiple fields with weighted scoring
          {
            OR: [
              // High priority: Exact phrase match in product name
              { name: { contains: normalizedQuery, mode: 'insensitive' } },

              // High priority: Individual word matches in product name
              ...searchTerms.words.flatMap(word => [
                { name: { contains: word, mode: 'insensitive' } },
                { brand: { contains: word, mode: 'insensitive' } },
                { description: { contains: word, mode: 'insensitive' } }
              ]),

              // Enhanced: Search using keyword mapping
              ...this.buildKeywordSearchConditions(searchTerms, keywordMapping),

              // Category matches (with configuration weighting)
              { category: { in: searchTerms.categories } }
            ]
          }
        ].filter(condition => Object.keys(condition).length > 0)
      }

      console.log('🔍 Built search where clause:', JSON.stringify(where, null, 2))

      // Execute search with enhanced ordering
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          brand: true,
          category: true,
          condition: true,
          imageUrl: true,
          description: true,
          dynamicSpecs: true,  // ✅ Include database specifications
          seller: {
            select: {
              businessName: true,
              rating: true
            }
          }
        },
        take: 30, // Increased to account for filtering
        orderBy: this.buildOrderByClause(sorting)
      })

      console.log(`🎯 Configuration-enhanced search found ${products.length} initial products`)

      // Skip strict post-filtering if we have relevant categories
      // The database query already filtered correctly
      const filteredProducts = relevantCategories.length > 0
        ? products // Trust the database query when we have category filters
        : await this.applyIntelligentFiltering(
            products,
            normalizedQuery,
            searchTerms,
            excludedCategories
          )

      console.log(`🔍 After intelligent filtering: ${filteredProducts.length} products remain`)

      // Score and rank results
      const scoredProducts = this.scoreSearchResults(filteredProducts, normalizedQuery, searchTerms)

      // Return top 20 scored results
      return scoredProducts.slice(0, 20).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        brand: p.brand || undefined,
        category: p.category,
        condition: p.condition || undefined,
        imageUrl: p.imageUrl || undefined,
        dynamicSpecs: p.dynamicSpecs || undefined,  // ✅ Include specifications from database
        seller: p.seller ? {
          businessName: p.seller.businessName,
          rating: p.seller.rating
        } : undefined
      }))

    } catch (error) {
      console.error('🚫 Configuration-enhanced search failed, falling back to basic search:', error)
      return this.fallbackBasicSearch(query, budget)
    }
  }

  /**
   * Extract search terms and identify relevant categories using configuration
   */
  private static extractSearchTerms(query: string, keywordMapping: Map<string, string[]>) {
    const queryLower = query.toLowerCase().trim()
    const words = queryLower.split(/\s+/)

    const searchTerms = {
      original: query,
      words,
      categories: new Set<string>(),
      brands: new Set<string>(),
      keywords: new Set<string>()
    }

    // Check each word against keyword mapping
    words.forEach(word => {
      const categories = keywordMapping.get(word)
      if (categories) {
        categories.forEach(cat => searchTerms.categories.add(cat))
        searchTerms.keywords.add(word)
      }
    })

    // Check full query against keyword mapping
    const fullQueryCategories = keywordMapping.get(queryLower)
    if (fullQueryCategories) {
      fullQueryCategories.forEach(cat => searchTerms.categories.add(cat))
      searchTerms.keywords.add(queryLower)
    }

    return {
      ...searchTerms,
      categories: Array.from(searchTerms.categories),
      brands: Array.from(searchTerms.brands),
      keywords: Array.from(searchTerms.keywords)
    }
  }

  /**
   * Build search conditions based on keyword mapping
   */
  private static buildKeywordSearchConditions(searchTerms: any, keywordMapping: Map<string, string[]>) {
    const conditions: any[] = []

    // Add conditions for identified keywords
    searchTerms.keywords.forEach((keyword: string) => {
      conditions.push(
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } }
      )
    })

    return conditions
  }

  /**
   * Apply intelligent filtering using configuration exclusions
   */
  private static async applyIntelligentFiltering(
    products: any[],
    query: string,
    searchTerms: any,
    excludedCategories: string[]
  ) {
    return products.filter(product => {
      // Apply exclusion rules
      if (excludedCategories.includes(product.category)) {
        console.log(`🚫 Excluding ${product.name} - category ${product.category} is excluded`)
        return false
      }

      // Get configuration stop words
      const stopWords = ['find', 'search', 'get', 'buy', 'shop', 'looking', 'for', 'the', 'and', 'or', 'a', 'an', 'with', 'in', 'on', 'options', 'items']

      // Apply word boundary filtering for better precision
      const queryLower = query.toLowerCase().trim()
      const productName = product.name.toLowerCase()
      const productDescription = (product.description || '').toLowerCase()
      const productBrand = (product.brand || '').toLowerCase()
      const productCategory = product.category

      // If product is already in a relevant category from the search, be more lenient
      if (searchTerms.categories.length > 0 && searchTerms.categories.includes(productCategory)) {
        // Product is in a relevant category, so it's a valid match
        return true
      }

      // Check if the query appears as a meaningful match
      const fields = [productName, productDescription, productBrand]

      // Filter out stop words from query for matching
      const meaningfulWords = queryLower.split(/\s+/).filter(word =>
        word.length > 2 && !stopWords.includes(word)
      )

      const hasRelevantMatch = fields.some(field => {
        // More lenient matching for configured keywords
        if (searchTerms.keywords.length > 0) {
          if (searchTerms.keywords.some((keyword: string) => field.includes(keyword))) {
            return true
          }
        }

        // Check if any meaningful word matches
        if (meaningfulWords.length === 0) {
          // No meaningful words, accept based on category match
          return true
        }

        return meaningfulWords.some(word => {
          if (word.length <= 2) return field.includes(word) // Allow short words
          const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
          return wordBoundaryRegex.test(field)
        })
      })

      if (!hasRelevantMatch) {
        console.log(`🚫 Filtering out "${product.name}" - no relevant match for "${query}"`)
      }

      return hasRelevantMatch
    })
  }

  /**
   * Score search results for better ranking
   */
  private static scoreSearchResults(products: any[], query: string, searchTerms: any) {
    const queryLower = query.toLowerCase()

    return products.map(product => {
      let score = 0
      const productName = product.name.toLowerCase()
      const productBrand = (product.brand || '').toLowerCase()
      const productCategory = product.category.toLowerCase()

      // Exact name match gets highest score
      if (productName.includes(queryLower)) {
        score += 100
      }

      // Brand match gets high score
      if (productBrand.includes(queryLower)) {
        score += 80
      }

      // Category relevance from configuration
      if (searchTerms.categories.includes(product.category)) {
        score += 60
      }

      // Keyword matches from configuration
      searchTerms.keywords.forEach((keyword: string) => {
        if (productName.includes(keyword)) score += 40
        if (productBrand.includes(keyword)) score += 30
      })

      // Boost for good condition
      if (product.condition === 'Excellent') score += 10
      if (product.condition === 'Good') score += 5

      // Boost for verified sellers
      if (product.seller) score += 5

      return { ...product, searchScore: score }
    }).sort((a, b) => b.searchScore - a.searchScore)
  }

  /**
   * Build orderBy clause based on sorting parameters
   */
  private static buildOrderByClause(sorting?: { field: string; direction: string }) {
    if (!sorting) {
      // Default sorting: prioritize exact name matches, then by price, then by recency
      return [
        { name: 'asc' },
        { price: 'asc' },
        { createdAt: 'desc' }
      ]
    }

    const { field, direction } = sorting
    const sortDirection = direction === 'asc' ? 'asc' : 'desc'

    switch (field) {
      case 'price':
        return direction === 'asc'
          ? [{ price: 'asc' }, { createdAt: 'desc' }]
          : [{ price: 'desc' }, { createdAt: 'desc' }]

      case 'name':
        return [{ name: sortDirection }, { price: 'asc' }]

      case 'createdAt':
        return [{ createdAt: sortDirection }, { price: 'asc' }]

      case 'brand':
        return [{ brand: sortDirection }, { name: 'asc' }, { price: 'asc' }]

      case 'relevance':
      default:
        // For relevance, use default smart ordering
        return [
          { name: 'asc' },
          { price: 'asc' },
          { createdAt: 'desc' }
        ]
    }
  }

  /**
   * Fallback to basic search if configuration-enhanced search fails
   */
  private static async fallbackBasicSearch(query: string, budget?: number): Promise<SearchResult[]> {
    console.log('🔄 Using fallback basic search')

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
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        brand: true,
        category: true,
        condition: true,
        imageUrl: true,
        dynamicSpecs: true,  // ✅ Include database specifications
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
      dynamicSpecs: p.dynamicSpecs || undefined,  // ✅ Include specifications from database
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
      // Suggest related searches based on the query
      const suggestions = this.generateSearchSuggestions(query)
      const suggestionText = suggestions.length > 0
        ? ` Try searching for: ${suggestions.join(', ')}.`
        : ' Try using broader terms or check back later for new arrivals.'

      return `No items found for "${query}".${suggestionText} Our thrift store specializes in secondhand electronics, clothing, shoes, and accessories. Browse our categories to discover amazing sustainable finds!`
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

  /**
   * Generate search suggestions based on query
   */
  private static generateSearchSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase()
    const suggestions: string[] = []

    // Car-related suggestions
    if (lowerQuery.includes('car') || lowerQuery.includes('auto') || lowerQuery.includes('vehicle')) {
      suggestions.push('phone holder', 'charger', 'bluetooth', 'accessories')
    }

    // Electronics suggestions
    if (lowerQuery.includes('phone') || lowerQuery.includes('computer') || lowerQuery.includes('laptop')) {
      suggestions.push('iPhone', 'Samsung', 'MacBook', 'electronics')
    }

    // Clothing suggestions
    if (lowerQuery.includes('clothing') || lowerQuery.includes('fashion') || lowerQuery.includes('style')) {
      suggestions.push('jacket', 'hoodie', 't-shirt', 'jeans')
    }

    // Shoes suggestions
    if (lowerQuery.includes('shoe') || lowerQuery.includes('sneaker') || lowerQuery.includes('boot')) {
      suggestions.push('Nike', 'Adidas', 'sneakers', 'boots')
    }

    // Generic fallback suggestions
    if (suggestions.length === 0) {
      suggestions.push('Nike', 'iPhone', 'jacket', 'accessories')
    }

    return suggestions.slice(0, 4) // Limit to 4 suggestions
  }
}