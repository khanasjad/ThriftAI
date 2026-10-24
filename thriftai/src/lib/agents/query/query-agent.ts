/**
 * Query Understanding Agent
 *
 * Uses Claude to understand natural language queries and convert them into
 * structured search filters compatible with our 27-factor scoring system.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  QueryIntent,
  QueryUnderstanding,
  QueryUnderstandingRequest,
  QueryUnderstandingConfig,
  DEFAULT_QUERY_CONFIG,
  SearchFilters,
  ExtractedEntities,
  ClothingCategory
} from './query-types'
import { FactorPillar } from '@/lib/veritas/taxonomy/factor-taxonomy'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

/**
 * Main query understanding function
 */
export async function understandQuery(
  request: QueryUnderstandingRequest,
  config: QueryUnderstandingConfig = DEFAULT_QUERY_CONFIG
): Promise<QueryUnderstanding> {
  const startTime = Date.now()

  try {
    const systemPrompt = buildSystemPrompt(config)
    const userPrompt = buildUserPrompt(request)

    // Call Claude API
    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    // Extract response text
    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Parse the structured response
    const understanding = parseQueryResponse(
      request.query,
      responseText,
      config
    )

    understanding.processingTime = Date.now() - startTime
    understanding.model = config.model

    return understanding
  } catch (error) {
    console.error('Query understanding failed:', error)

    // Fallback to basic keyword extraction
    return createFallbackUnderstanding(request.query, Date.now() - startTime)
  }
}

/**
 * Build system prompt for query understanding
 */
function buildSystemPrompt(config: QueryUnderstandingConfig): string {
  return `You are a query understanding assistant for ThriftAI, a clothing quality scoring platform.

Your job is to analyze natural language queries and extract structured information for product search.

ThriftAI uses a 27-factor scoring system across 5 pillars:
1. FIT (35 points): True-to-size, size consistency, fit by body shape, fit-related returns, length/proportions, size inclusivity
2. QUALITY (30 points): Fabric quality, construction, wash durability, wear resistance, longevity, quality returns
3. STYLE_VALUE (20 points): Value for money, price fairness, brand reputation, looks as pictured, trend relevance, versatility, resale value
4. COMFORT (15 points): Fabric feel, breathability, ease of movement, no irritation, all-day comfort
5. SUSTAINABILITY (5 points): Material sustainability, production ethics, longevity/circularity

Clothing categories: TOPS, BOTTOMS, DRESSES, OUTERWEAR, SHOES, ACCESSORIES, ACTIVEWEAR, SWIMWEAR, UNDERWEAR, SLEEPWEAR

For each query, you must:
1. Classify the INTENT (search, compare, explain, recommend, filter, ask_question)
2. Extract ENTITIES (product types, brands, colors, materials, styles, occasions, price points, quality signals, fit signals, sustainability signals)
3. Generate FILTERS (categories, price range, brands, min scores, fit preferences, styles, colors, occasions, sustainability)
4. Create a SEMANTIC QUERY for vector search (concise, focused on product attributes)
5. Assess CONFIDENCE (0.0-1.0)
6. Identify if CLARIFICATION is needed
7. Suggest REFINEMENTS if helpful

Respond ONLY with valid JSON in this exact format:
{
  "intent": "search|compare|explain|recommend|filter|ask_question",
  "confidence": 0.95,
  "entities": {
    "productTypes": ["jeans", "jacket"],
    "brands": ["Everlane"],
    "colors": ["blue"],
    "materials": ["denim"],
    "styles": ["wide leg"],
    "occasions": ["casual"],
    "pricePoints": ["under $100"],
    "qualitySignals": ["durable"],
    "fitSignals": ["true to size"],
    "sustainabilitySignals": ["organic"]
  },
  "filters": {
    "categories": ["BOTTOMS"],
    "priceMin": 0,
    "priceMax": 100,
    "brands": ["Everlane"],
    "minOverallScore": 70,
    "minPillarScores": {
      "FIT": 80
    },
    "styles": ["wide leg"],
    "colors": ["blue"],
    "sustainabilityRequired": false,
    "sortBy": "score_high",
    "limit": 20
  },
  "semanticQuery": "wide leg jeans from Everlane with great fit and durability",
  "clarificationNeeded": [],
  "suggestedRefinements": ["Try filtering by specific fit type", "Consider price range"]
}

Important:
- Extract ALL relevant information from the query
- Be generous with entity extraction (capture everything mentioned)
- Use semantic understanding for implicit requirements (e.g., "quality jeans" → minOverallScore: 70, minPillarScores: {QUALITY: 80})
- Map common terms to our taxonomy (e.g., "eco-friendly" → sustainabilityRequired: true)
- For ambiguous queries, add clarificationNeeded questions
- Keep semanticQuery concise but descriptive
- Set realistic confidence scores
- Return ONLY valid JSON, no other text`
}

/**
 * Build user prompt
 */
function buildUserPrompt(request: QueryUnderstandingRequest): string {
  let prompt = `Query: "${request.query}"`

  // Add conversation context if available
  if (request.context?.conversationHistory && request.context.conversationHistory.length > 0) {
    const recentMessages = request.context.conversationHistory.slice(-3)
    prompt += `\n\nConversation Context:\n${recentMessages.map(m =>
      `${m.role}: ${m.content}`
    ).join('\n')}`
  }

  // Add user preferences if available
  if (request.context?.userPreferences) {
    const prefs = request.context.userPreferences
    const prefSummary = []

    if (prefs.favoriteCategories) prefSummary.push(`Favorite categories: ${prefs.favoriteCategories.join(', ')}`)
    if (prefs.favoriteBrands) prefSummary.push(`Favorite brands: ${prefs.favoriteBrands.join(', ')}`)
    if (prefs.budgetRange) prefSummary.push(`Budget: $${prefs.budgetRange.min}-$${prefs.budgetRange.max}`)
    if (prefs.sustainabilityPreference) prefSummary.push(`Sustainability: ${prefs.sustainabilityPreference}`)

    if (prefSummary.length > 0) {
      prompt += `\n\nUser Preferences:\n${prefSummary.join('\n')}`
    }
  }

  prompt += `\n\nAnalyze this query and return structured JSON as specified.`

  return prompt
}

/**
 * Parse Claude's response into QueryUnderstanding
 */
function parseQueryResponse(
  originalQuery: string,
  responseText: string,
  config: QueryUnderstandingConfig
): QueryUnderstanding {
  try {
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Map to our types
    const understanding: QueryUnderstanding = {
      originalQuery,
      intent: parsed.intent as QueryIntent,
      confidence: parsed.confidence || 0.5,
      filters: parseFilters(parsed.filters || {}),
      entities: parseEntities(parsed.entities || {}),
      semanticQuery: parsed.semanticQuery || originalQuery,
      clarificationNeeded: parsed.clarificationNeeded || undefined,
      suggestedRefinements: parsed.suggestedRefinements || undefined,
      processingTime: 0,
      model: config.model
    }

    // Validate confidence threshold
    if (understanding.confidence < config.confidenceThreshold) {
      understanding.clarificationNeeded = understanding.clarificationNeeded || []
      understanding.clarificationNeeded.push(
        'I\'m not entirely sure what you\'re looking for. Could you provide more details?'
      )
    }

    return understanding
  } catch (error) {
    console.error('Failed to parse query response:', error)
    throw error
  }
}

/**
 * Parse filters from Claude response
 */
function parseFilters(rawFilters: any): SearchFilters {
  const filters: SearchFilters = {}

  if (rawFilters.categories) {
    filters.categories = rawFilters.categories.map((c: string) =>
      c.toUpperCase() as ClothingCategory
    )
  }

  if (rawFilters.priceMin !== undefined) filters.priceMin = rawFilters.priceMin
  if (rawFilters.priceMax !== undefined) filters.priceMax = rawFilters.priceMax
  if (rawFilters.priceBudget) filters.priceBudget = rawFilters.priceBudget

  if (rawFilters.brands) filters.brands = rawFilters.brands
  if (rawFilters.minOverallScore) filters.minOverallScore = rawFilters.minOverallScore
  if (rawFilters.minPillarScores) {
    filters.minPillarScores = {}
    for (const [pillar, score] of Object.entries(rawFilters.minPillarScores)) {
      filters.minPillarScores[pillar.toUpperCase() as FactorPillar] = score as number
    }
  }

  if (rawFilters.fitPreferences) filters.fitPreferences = rawFilters.fitPreferences
  if (rawFilters.styles) filters.styles = rawFilters.styles
  if (rawFilters.colors) filters.colors = rawFilters.colors
  if (rawFilters.materials) filters.materials = rawFilters.materials
  if (rawFilters.occasions) filters.occasions = rawFilters.occasions

  if (rawFilters.sustainabilityRequired !== undefined) {
    filters.sustainabilityRequired = rawFilters.sustainabilityRequired
  }
  if (rawFilters.certifications) filters.certifications = rawFilters.certifications
  if (rawFilters.trendRelevance) filters.trendRelevance = rawFilters.trendRelevance

  if (rawFilters.sortBy) filters.sortBy = rawFilters.sortBy
  if (rawFilters.limit) filters.limit = rawFilters.limit
  if (rawFilters.offset) filters.offset = rawFilters.offset

  return filters
}

/**
 * Parse entities from Claude response
 */
function parseEntities(rawEntities: any): ExtractedEntities {
  return {
    productTypes: rawEntities.productTypes || [],
    brands: rawEntities.brands || [],
    colors: rawEntities.colors || [],
    materials: rawEntities.materials || [],
    styles: rawEntities.styles || [],
    occasions: rawEntities.occasions || [],
    pricePoints: rawEntities.pricePoints || [],
    qualitySignals: rawEntities.qualitySignals || [],
    fitSignals: rawEntities.fitSignals || [],
    sustainabilitySignals: rawEntities.sustainabilitySignals || []
  }
}

/**
 * Create fallback understanding when Claude API fails
 */
function createFallbackUnderstanding(
  query: string,
  processingTime: number
): QueryUnderstanding {
  // Simple keyword extraction
  const lowercaseQuery = query.toLowerCase()

  const entities: ExtractedEntities = {
    productTypes: extractKeywords(lowercaseQuery, [
      'jeans', 'jacket', 'dress', 'shirt', 'pants', 'shoes', 'sweater', 'coat', 'skirt', 'top'
    ]),
    brands: [],
    colors: extractKeywords(lowercaseQuery, [
      'black', 'white', 'blue', 'red', 'green', 'gray', 'brown', 'navy', 'beige'
    ]),
    materials: extractKeywords(lowercaseQuery, [
      'denim', 'cotton', 'leather', 'wool', 'silk', 'polyester', 'linen'
    ]),
    styles: [],
    occasions: extractKeywords(lowercaseQuery, [
      'casual', 'formal', 'work', 'party', 'athletic', 'outdoor'
    ]),
    pricePoints: [],
    qualitySignals: extractKeywords(lowercaseQuery, [
      'quality', 'durable', 'well-made', 'premium', 'high-end'
    ]),
    fitSignals: extractKeywords(lowercaseQuery, [
      'true to size', 'runs small', 'runs large', 'comfortable fit'
    ]),
    sustainabilitySignals: extractKeywords(lowercaseQuery, [
      'sustainable', 'eco-friendly', 'organic', 'ethical', 'green'
    ])
  }

  return {
    originalQuery: query,
    intent: QueryIntent.SEARCH,
    confidence: 0.3,
    filters: {
      sortBy: 'relevance',
      limit: 20
    },
    entities,
    semanticQuery: query,
    clarificationNeeded: [
      'I\'m having trouble understanding your request. Could you rephrase?'
    ],
    processingTime,
    model: 'fallback'
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter(keyword => text.includes(keyword))
}

/**
 * Simplify query (remove filler words, normalize)
 */
export function simplifyQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/\b(show me|find|looking for|want|need|i'm|i am|can you|please)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract price range from text
 */
export function extractPriceRange(text: string): { min?: number; max?: number } | null {
  // Match patterns like "under $100", "$50-$100", "between $30 and $70"
  const patterns = [
    /under \$?(\d+)/i,
    /less than \$?(\d+)/i,
    /below \$?(\d+)/i,
    /\$?(\d+)\s*-\s*\$?(\d+)/,
    /between \$?(\d+) and \$?(\d+)/i,
    /over \$?(\d+)/i,
    /more than \$?(\d+)/i,
    /above \$?(\d+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (pattern.source.includes('under') || pattern.source.includes('less') || pattern.source.includes('below')) {
        return { max: parseInt(match[1]) }
      } else if (pattern.source.includes('over') || pattern.source.includes('more') || pattern.source.includes('above')) {
        return { min: parseInt(match[1]) }
      } else if (match[2]) {
        return { min: parseInt(match[1]), max: parseInt(match[2]) }
      }
    }
  }

  return null
}
