// ThriftAI - Search Query Optimizer with Claude AI
// Intelligent query enhancement for superior product discovery

import Anthropic from '@anthropic-ai/sdk'
import type {
  QueryOptimization,
  SearchIntent,
  UserProfile,
  ContextHints
} from '../types/scoring'

export class SearchOptimizer {
  private anthropic: Anthropic
  private readonly MAX_RETRIES = 3
  private readonly TIMEOUT_MS = 10000

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey
    })
  }

  async optimizeWithClaude(
    query: string,
    userProfile?: UserProfile,
    contextHints?: ContextHints
  ): Promise<QueryOptimization> {
    const startTime = Date.now()

    try {
      // Pre-process the query
      const cleanQuery = this.preprocessQuery(query)

      // Extract basic attributes
      const basicAttributes = this.extractProductAttributes(cleanQuery)

      // Classify initial intent
      const preliminaryIntent = this.inferUserIntent(cleanQuery)

      // Use Claude for advanced optimization
      const claudeOptimization = await this.optimizeQueryWithClaude(
        cleanQuery,
        userProfile,
        contextHints,
        basicAttributes,
        preliminaryIntent
      )

      // Combine Claude's response with our analysis
      const finalOptimization = this.combineOptimizations(
        cleanQuery,
        claudeOptimization,
        basicAttributes,
        preliminaryIntent
      )

      const processingTime = Date.now() - startTime

      return {
        originalQuery: query,
        optimizedQuery: finalOptimization.optimizedQuery,
        enhancements: finalOptimization.enhancements,
        confidence: finalOptimization.confidence,
        reasoning: finalOptimization.reasoning,
        processingTime
      }

    } catch (error) {
      console.error('Error optimizing query with Claude:', error)

      // Fallback to basic optimization
      return this.getFallbackOptimization(query, Date.now() - startTime)
    }
  }

  private async optimizeQueryWithClaude(
    query: string,
    userProfile?: UserProfile,
    contextHints?: ContextHints,
    basicAttributes?: any,
    preliminaryIntent?: SearchIntent['type']
  ): Promise<any> {
    const prompt = this.buildClaudePrompt(query, userProfile, contextHints, basicAttributes, preliminaryIntent)

    const message = await this.anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent results
      messages: [{
        role: "user",
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return this.parseClaudeResponse(responseText)
  }

  private buildClaudePrompt(
    query: string,
    userProfile?: UserProfile,
    contextHints?: ContextHints,
    basicAttributes?: any,
    preliminaryIntent?: SearchIntent['type']
  ): string {
    let prompt = `You are an expert e-commerce search optimization assistant for ThriftAI, a sustainable thrift shopping platform. Your task is to optimize search queries to help users find the best second-hand products.

**User Query:** "${query}"

**Context Information:**
`

    if (userProfile) {
      prompt += `
**User Profile:**
- Preferred categories: ${userProfile.preferences.categories.join(', ')}
- Preferred brands: ${userProfile.preferences.brands.join(', ')}
- Preferred styles: ${userProfile.preferences.styles.join(', ')}
- Price range: $${userProfile.preferences.priceRange.min} - $${userProfile.preferences.priceRange.max}
- Sustainability focus: ${userProfile.preferences.sustainability}
- Quality preference: ${userProfile.preferences.quality}
`
    }

    if (contextHints) {
      prompt += `
**Context Hints:**
- Season: ${contextHints.season || 'Not specified'}
- Occasion: ${contextHints.occasion || 'Not specified'}
- Gift recipient: ${contextHints.giftRecipient || 'Not specified'}
- Replacement item: ${contextHints.replacementItem ? 'Yes' : 'No'}
- Specific need: ${contextHints.specificNeed || 'Not specified'}
`
    }

    if (preliminaryIntent) {
      prompt += `
**Preliminary Intent:** ${preliminaryIntent}
`
    }

    prompt += `
**Your Task:**
Analyze the user's query "${query}" and provide optimized search parameters specifically for this query. Extract information directly from the user's input and generate appropriate search terms and filters.

Return your response in the following JSON format:
{
  "primaryTerms": ["extract", "most", "important", "terms"],
  "secondaryTerms": ["add", "relevant", "synonyms"],
  "searchFilters": {
    "brands": ["extract_brand_if_mentioned"],
    "categories": ["map_to_CLOTHING_SHOES_ACCESSORIES_ELECTRONICS"],
    "sizes": ["extract_if_mentioned"],
    "colors": ["extract_if_mentioned"],
    "styles": ["extract_style_keywords"],
    "priceRange": null
  },
  "enhancements": {
    "synonyms": ["relevant_synonyms_for_this_query"],
    "brandNormalization": ["normalized_brand_names"],
    "sizeExtraction": ["sizes_from_query"],
    "colorExtraction": ["colors_from_query"],
    "intentClassification": "browse|buy|compare|research|gift|replace",
    "budgetInference": null,
    "styleInference": ["style_terms_from_query"],
    "categoryInference": ["categories_from_query"]
  },
  "confidence": 85,
  "reasoning": "Explain what you extracted from THIS specific query and why"
}

**Optimization Guidelines for "${query}":**
1. **primaryTerms**: Extract the core words from "${query}" that products MUST contain
2. **secondaryTerms**: Add synonyms only for the terms found in "${query}"
3. **searchFilters**: Extract ONLY what is explicitly mentioned in "${query}":
   - brands: Only if brand name appears in "${query}" (Nike, Apple, Adidas, etc.)
   - categories: Map product type to: CLOTHING, SHOES, ACCESSORIES, ELECTRONICS
   - sizes: Only if size is mentioned in "${query}" (XL, 10, medium, etc.)
   - colors: Only if color is mentioned in "${query}" (red, blue, black, etc.)
   - styles: Only style words from "${query}" (vintage, modern, casual, etc.)
   - priceRange: Only if budget words in "${query}" (cheap, expensive, under $X)
4. DO NOT add filters that aren't in the user's query
5. Focus on what the user actually said, not assumptions
6. Be precise and specific to this query

**Critical Rule:**
ONLY extract what is explicitly mentioned in "${query}". Do not add brands, categories, or attributes that the user didn't mention.

Respond with only the JSON object, no additional text.`

    return prompt
  }

  private parseClaudeResponse(responseText: string): any {
    try {
      // Clean the response text
      const cleanedResponse = responseText.trim()

      // Extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }

      const jsonStr = jsonMatch[0]
      const parsed = JSON.parse(jsonStr)

      // Validate the response structure
      if (!parsed.primaryTerms || !parsed.searchFilters || !parsed.enhancements || !parsed.confidence) {
        throw new Error('Invalid response structure from Claude')
      }

      return parsed

    } catch (error) {
      console.error('Error parsing Claude response:', error)
      console.log('Raw response:', responseText)

      // Return a basic fallback structure
      const basicTerms = responseText.slice(0, 50).split(' ').filter(t => t.length > 2).slice(0, 3)
      return {
        primaryTerms: basicTerms,
        secondaryTerms: [],
        searchFilters: {
          brands: [],
          categories: [],
          sizes: [],
          colors: [],
          styles: [],
          priceRange: null
        },
        enhancements: {
          synonyms: [],
          brandNormalization: [],
          sizeExtraction: [],
          colorExtraction: [],
          intentClassification: 'browse',
          budgetInference: null,
          styleInference: [],
          categoryInference: []
        },
        confidence: 30,
        reasoning: 'Fallback optimization due to parsing error'
      }
    }
  }

  private combineOptimizations(
    originalQuery: string,
    claudeResponse: any,
    basicAttributes: any,
    preliminaryIntent: SearchIntent['type']
  ): any {
    // Merge Claude's optimization with our basic analysis
    const combinedEnhancements = {
      synonyms: [...new Set([
        ...claudeResponse.enhancements.synonyms,
        ...this.expandSynonyms(originalQuery)
      ])],
      brandNormalization: [...new Set([
        ...claudeResponse.enhancements.brandNormalization,
        ...this.normalizeBrands(originalQuery)
      ])],
      sizeExtraction: [...new Set([
        ...claudeResponse.enhancements.sizeExtraction,
        ...basicAttributes.sizes
      ])],
      colorExtraction: [...new Set([
        ...claudeResponse.enhancements.colorExtraction,
        ...basicAttributes.colors
      ])],
      intentClassification: claudeResponse.enhancements.intentClassification || preliminaryIntent,
      budgetInference: claudeResponse.enhancements.budgetInference,
      styleInference: claudeResponse.enhancements.styleInference || [],
      categoryInference: [...new Set([
        ...claudeResponse.enhancements.categoryInference,
        ...basicAttributes.categories
      ])]
    }

    // Combine search filters with fallbacks from basic analysis
    const combinedFilters = {
      brands: [...new Set([
        ...claudeResponse.searchFilters.brands,
        ...basicAttributes.brands
      ])],
      categories: [...new Set([
        ...claudeResponse.searchFilters.categories,
        ...basicAttributes.categories
      ])],
      sizes: [...new Set([
        ...claudeResponse.searchFilters.sizes,
        ...basicAttributes.sizes
      ])],
      colors: [...new Set([
        ...claudeResponse.searchFilters.colors,
        ...basicAttributes.colors
      ])],
      styles: [...new Set([
        ...claudeResponse.searchFilters.styles,
        ...basicAttributes.styles
      ])],
      priceRange: claudeResponse.searchFilters.priceRange
    }

    // Calculate combined confidence
    const confidence = Math.min(100, Math.max(50, claudeResponse.confidence))

    // Enhanced reasoning
    const reasoning = claudeResponse.reasoning || 'Query optimized with AI assistance for better product discovery'

    // Generate backward-compatible optimizedQuery for existing code
    const optimizedQuery = [
      ...claudeResponse.primaryTerms,
      ...claudeResponse.secondaryTerms.slice(0, 3) // Limit to avoid overly long strings
    ].join(' ')

    return {
      primaryTerms: claudeResponse.primaryTerms || originalQuery.split(' '),
      secondaryTerms: claudeResponse.secondaryTerms || [],
      searchFilters: combinedFilters,
      optimizedQuery, // Backward compatibility
      enhancements: combinedEnhancements,
      confidence,
      reasoning
    }
  }

  private preprocessQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-']/g, ' ') // Remove special characters except hyphens and apostrophes
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim()
  }

  private extractProductAttributes(query: string): any {
    const attributes = {
      brands: this.extractBrands(query),
      sizes: this.extractSizes(query),
      colors: this.extractColors(query),
      categories: this.extractCategories(query),
      materials: this.extractMaterials(query),
      styles: this.extractStyles(query)
    }

    return attributes
  }

  private extractBrands(query: string): string[] {
    const knownBrands = [
      'nike', 'adidas', 'apple', 'samsung', 'sony', 'levi\'s', 'levis',
      'gap', 'h&m', 'hm', 'zara', 'uniqlo', 'gucci', 'prada', 'coach',
      'michael kors', 'calvin klein', 'tommy hilfiger', 'polo ralph lauren',
      'patagonia', 'north face', 'columbia', 'under armour', 'puma',
      'converse', 'vans', 'new balance', 'asics', 'reebok'
    ]

    const queryLower = query.toLowerCase()
    return knownBrands.filter(brand => queryLower.includes(brand))
  }

  private extractSizes(query: string): string[] {
    const sizePatterns = [
      /\b(xs|extra small)\b/i,
      /\b(s|small)\b/i,
      /\b(m|medium)\b/i,
      /\b(l|large)\b/i,
      /\b(xl|extra large)\b/i,
      /\b(xxl|2xl)\b/i,
      /\b(xxxl|3xl)\b/i,
      /\bsize\s*(\d+(?:\.\d+)?)\b/i,
      /\b(\d+(?:\.\d+)?)\s*inch\b/i,
      /\b(\d{1,2})\s*(?:us|uk)?\b/i // Shoe sizes
    ]

    const sizes: string[] = []
    sizePatterns.forEach(pattern => {
      const match = query.match(pattern)
      if (match) {
        sizes.push(match[1] || match[0])
      }
    })

    return sizes
  }

  private extractColors(query: string): string[] {
    const colors = [
      'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
      'pink', 'brown', 'gray', 'grey', 'navy', 'beige', 'tan', 'khaki',
      'olive', 'burgundy', 'maroon', 'teal', 'turquoise', 'gold', 'silver',
      'rose', 'coral', 'mint', 'cream', 'ivory'
    ]

    const queryLower = query.toLowerCase()
    return colors.filter(color => queryLower.includes(color))
  }

  private extractCategories(query: string): string[] {
    const categoryKeywords = {
      'CLOTHING': ['shirt', 'pants', 'dress', 'jacket', 'top', 'bottom', 'sweater', 'hoodie', 'jeans', 'skirt', 'blouse'],
      'SHOES': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'athletic shoes', 'running shoes'],
      'ACCESSORIES': ['bag', 'purse', 'wallet', 'belt', 'watch', 'jewelry', 'necklace', 'bracelet', 'earrings', 'sunglasses'],
      'ELECTRONICS': ['phone', 'laptop', 'tablet', 'headphones', 'speaker', 'camera', 'smartwatch', 'computer']
    }

    const queryLower = query.toLowerCase()
    const matchedCategories: string[] = []

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        matchedCategories.push(category)
      }
    })

    return matchedCategories
  }

  private extractMaterials(query: string): string[] {
    const materials = [
      'cotton', 'polyester', 'wool', 'silk', 'linen', 'denim', 'leather',
      'suede', 'canvas', 'cashmere', 'alpaca', 'bamboo', 'hemp', 'organic'
    ]

    const queryLower = query.toLowerCase()
    return materials.filter(material => queryLower.includes(material))
  }

  private extractStyles(query: string): string[] {
    const styles = [
      'vintage', 'retro', 'classic', 'modern', 'casual', 'formal', 'business',
      'sporty', 'athletic', 'bohemian', 'minimalist', 'elegant', 'edgy',
      'trendy', 'timeless', 'designer', 'luxury', 'premium'
    ]

    const queryLower = query.toLowerCase()
    return styles.filter(style => queryLower.includes(style))
  }

  private inferUserIntent(query: string): SearchIntent['type'] {
    const queryLower = query.toLowerCase()

    // Intent indicators
    const intentKeywords = {
      'buy': ['buy', 'purchase', 'order', 'get', 'need', 'want'],
      'compare': ['compare', 'vs', 'versus', 'difference', 'better', 'best'],
      'research': ['review', 'information', 'about', 'details', 'specs', 'features'],
      'gift': ['gift', 'present', 'for her', 'for him', 'for mom', 'for dad'],
      'replace': ['replace', 'replacement', 'broken', 'lost', 'damaged']
    }

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return intent as SearchIntent['type']
      }
    }

    // Default intent based on query structure
    if (queryLower.length < 10) {
      return 'browse' // Short queries are usually browsing
    }

    return 'buy' // Longer, specific queries usually indicate purchase intent
  }

  private expandSynonyms(query: string): string[] {
    const synonymMappings = {
      'shoes': ['footwear', 'sneakers', 'kicks'],
      'jacket': ['coat', 'outerwear', 'blazer'],
      'pants': ['trousers', 'bottoms', 'slacks'],
      'shirt': ['top', 'blouse', 'tee'],
      'bag': ['purse', 'handbag', 'tote'],
      'phone': ['smartphone', 'mobile', 'cell phone'],
      'laptop': ['computer', 'notebook', 'pc'],
      'vintage': ['retro', 'classic', 'antique'],
      'cheap': ['affordable', 'budget', 'inexpensive', 'low cost'],
      'expensive': ['premium', 'luxury', 'high-end'],
      'good': ['quality', 'excellent', 'great'],
      'old': ['vintage', 'antique', 'classic']
    }

    const queryLower = query.toLowerCase()
    const synonyms: string[] = []

    Object.entries(synonymMappings).forEach(([word, syns]) => {
      if (queryLower.includes(word)) {
        synonyms.push(...syns)
      }
    })

    return synonyms
  }

  private normalizeBrands(query: string): string[] {
    const brandNormalizations = {
      'levis': 'Levi\'s',
      'hm': 'H&M',
      'h&m': 'H&M',
      'nike': 'Nike',
      'adidas': 'Adidas',
      'apple': 'Apple',
      'samsung': 'Samsung',
      'sony': 'Sony',
      'michaelkors': 'Michael Kors',
      'michael kors': 'Michael Kors',
      'calvinklein': 'Calvin Klein',
      'calvin klein': 'Calvin Klein',
      'tommyhilfiger': 'Tommy Hilfiger',
      'tommy hilfiger': 'Tommy Hilfiger',
      'ralphlauren': 'Ralph Lauren',
      'polo ralph lauren': 'Ralph Lauren'
    }

    const queryLower = query.toLowerCase()
    const normalized: string[] = []

    Object.entries(brandNormalizations).forEach(([variation, official]) => {
      if (queryLower.includes(variation)) {
        normalized.push(official)
      }
    })

    return normalized
  }

  private getFallbackOptimization(originalQuery: string, processingTime: number): QueryOptimization {
    // Basic fallback optimization without Claude
    const basicAttributes = this.extractProductAttributes(originalQuery)
    const intent = this.inferUserIntent(originalQuery)
    const synonyms = this.expandSynonyms(originalQuery)
    const brands = this.normalizeBrands(originalQuery)

    // Extract primary terms from original query
    const primaryTerms = originalQuery.toLowerCase().split(' ').filter(term => term.length > 2)

    // Simple query enhancement for backward compatibility
    const enhancedTerms = [
      originalQuery,
      ...synonyms.slice(0, 3), // Limit synonyms
      ...brands
    ].join(' ')

    return {
      originalQuery,
      primaryTerms,
      secondaryTerms: synonyms.slice(0, 5),
      searchFilters: {
        brands,
        categories: basicAttributes.categories,
        sizes: basicAttributes.sizes,
        colors: basicAttributes.colors,
        styles: basicAttributes.styles,
        priceRange: null
      },
      optimizedQuery: enhancedTerms, // Backward compatibility
      enhancements: {
        synonyms: synonyms.slice(0, 5),
        brandNormalization: brands,
        sizeExtraction: basicAttributes.sizes,
        colorExtraction: basicAttributes.colors,
        intentClassification: intent,
        budgetInference: null,
        styleInference: basicAttributes.styles,
        categoryInference: basicAttributes.categories
      },
      confidence: 60, // Lower confidence for fallback
      reasoning: 'Fallback optimization using basic keyword analysis',
      processingTime
    }
  }

  // Additional utility methods
  async optimizeMultipleQueries(queries: string[]): Promise<QueryOptimization[]> {
    const optimizations = await Promise.all(
      queries.map(query => this.optimizeWithClaude(query))
    )

    return optimizations
  }

  extractSearchFilters(optimization: QueryOptimization) {
    const enhancements = optimization.enhancements

    return {
      categories: enhancements.categoryInference,
      brands: enhancements.brandNormalization,
      sizes: enhancements.sizeExtraction,
      colors: enhancements.colorExtraction,
      priceRange: enhancements.budgetInference
        ? { min: 0, max: enhancements.budgetInference }
        : undefined,
      styles: enhancements.styleInference
    }
  }

  // Health check method
  async isServiceHealthy(): Promise<boolean> {
    try {
      const testQuery = "test"
      const optimization = await this.optimizeWithClaude(testQuery)
      return optimization.confidence > 0
    } catch (error) {
      console.error('Search optimizer health check failed:', error)
      return false
    }
  }

  // Performance metrics
  getOptimizationMetrics(optimizations: QueryOptimization[]) {
    if (optimizations.length === 0) return null

    const avgProcessingTime = optimizations.reduce((sum, opt) => sum + opt.processingTime, 0) / optimizations.length
    const avgConfidence = optimizations.reduce((sum, opt) => sum + opt.confidence, 0) / optimizations.length
    const successRate = optimizations.filter(opt => opt.confidence > 50).length / optimizations.length

    return {
      averageProcessingTime: Math.round(avgProcessingTime),
      averageConfidence: Math.round(avgConfidence),
      successRate: Math.round(successRate * 100),
      totalOptimizations: optimizations.length
    }
  }
}

// Export singleton instance
export const searchOptimizer = new SearchOptimizer()
export default SearchOptimizer