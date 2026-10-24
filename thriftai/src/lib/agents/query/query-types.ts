/**
 * Query Understanding Agent - Types
 *
 * Defines types for natural language query understanding and structured search generation.
 */

import { FactorPillar } from '@/lib/veritas/taxonomy/factor-taxonomy'
import { models } from '@/lib/veritas/env'

/**
 * Intent classification for user queries
 */
export enum QueryIntent {
  SEARCH = 'search',                    // Find products matching criteria
  COMPARE = 'compare',                  // Compare multiple products
  EXPLAIN = 'explain',                  // Explain a product score
  RECOMMEND = 'recommend',              // Get recommendations
  FILTER = 'filter',                    // Apply specific filters
  ASK_QUESTION = 'ask_question'         // General question about products/system
}

/**
 * Clothing categories from Prisma schema
 */
export enum ClothingCategory {
  TOPS = 'TOPS',
  BOTTOMS = 'BOTTOMS',
  DRESSES = 'DRESSES',
  OUTERWEAR = 'OUTERWEAR',
  SHOES = 'SHOES',
  ACCESSORIES = 'ACCESSORIES',
  ACTIVEWEAR = 'ACTIVEWEAR',
  SWIMWEAR = 'SWIMWEAR',
  UNDERWEAR = 'UNDERWEAR',
  SLEEPWEAR = 'SLEEPWEAR'
}

/**
 * Search filter extracted from natural language
 */
export interface SearchFilters {
  // Category filters
  categories?: ClothingCategory[]

  // Price filters
  priceMin?: number
  priceMax?: number
  priceBudget?: string  // e.g., "under $50", "budget-friendly"

  // Brand filters
  brands?: string[]

  // Quality/scoring filters
  minOverallScore?: number
  minPillarScores?: Partial<Record<FactorPillar, number>>

  // Fit filters
  fitPreferences?: {
    size?: string
    bodyType?: string
    heightRange?: string
    trueToSize?: boolean
  }

  // Style filters
  styles?: string[]
  colors?: string[]
  materials?: string[]
  occasions?: string[]

  // Sustainability filters
  sustainabilityRequired?: boolean
  certifications?: string[]

  // Trend filters
  trendRelevance?: 'timeless' | 'on_trend' | 'classic'

  // Sorting
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'score_high' | 'newest'

  // Pagination
  limit?: number
  offset?: number
}

/**
 * Extracted entities from query
 */
export interface ExtractedEntities {
  productTypes: string[]      // e.g., ["jeans", "jacket"]
  brands: string[]             // e.g., ["Everlane", "Patagonia"]
  colors: string[]             // e.g., ["blue", "black"]
  materials: string[]          // e.g., ["denim", "cotton"]
  styles: string[]             // e.g., ["wide leg", "classic"]
  occasions: string[]          // e.g., ["casual", "work"]
  pricePoints: string[]        // e.g., ["under $100", "budget"]
  qualitySignals: string[]     // e.g., ["durable", "high quality"]
  fitSignals: string[]         // e.g., ["true to size", "runs small"]
  sustainabilitySignals: string[]  // e.g., ["sustainable", "organic"]
}

/**
 * Query understanding result
 */
export interface QueryUnderstanding {
  // Original query
  originalQuery: string

  // Detected intent
  intent: QueryIntent
  confidence: number  // 0.0 - 1.0

  // Extracted filters
  filters: SearchFilters

  // Extracted entities
  entities: ExtractedEntities

  // Semantic query for vector search
  semanticQuery: string

  // Clarification questions (if query is ambiguous)
  clarificationNeeded?: string[]

  // Suggested refinements
  suggestedRefinements?: string[]

  // Metadata
  processingTime: number
  model: string
}

/**
 * Query understanding request
 */
export interface QueryUnderstandingRequest {
  query: string
  context?: {
    conversationHistory?: ConversationMessage[]
    userPreferences?: UserPreferences
    previousSearches?: string[]
  }
  options?: {
    includeExplanation?: boolean
    suggestRefinements?: boolean
  }
}

/**
 * User preferences for personalization
 */
export interface UserPreferences {
  favoriteCategories?: ClothingCategory[]
  favoriteBrands?: string[]
  budgetRange?: { min: number; max: number }
  sizeInfo?: {
    size: string
    heightCm?: number
    weightKg?: number
    bodyType?: string
  }
  sustainabilityPreference?: 'required' | 'preferred' | 'neutral'
  stylePreferences?: string[]
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    intent?: QueryIntent
    productsShown?: string[]
    filters?: SearchFilters
  }
}

/**
 * Query understanding configuration
 */
export interface QueryUnderstandingConfig {
  model: string
  maxTokens: number
  timeout: number

  // Feature flags
  enableEntityExtraction: boolean
  enableIntentClassification: boolean
  enableClarification: boolean
  enableRefinementSuggestions: boolean

  // Thresholds
  confidenceThreshold: number
  ambiguityThreshold: number
}

/**
 * Default configuration
 */
export const DEFAULT_QUERY_CONFIG: QueryUnderstandingConfig = {
  get model() {
    return models.agent
  },
  maxTokens: 2048,
  timeout: 10000,

  enableEntityExtraction: true,
  enableIntentClassification: true,
  enableClarification: true,
  enableRefinementSuggestions: true,

  confidenceThreshold: 0.7,
  ambiguityThreshold: 0.5
}

/**
 * Query rewriting result (for complex queries)
 */
export interface QueryRewrite {
  original: string
  rewritten: string
  reason: string
  improvements: string[]
}

/**
 * Multi-product comparison request
 */
export interface ComparisonRequest {
  productIds: string[]
  focusAreas?: FactorPillar[]  // Which pillars to focus on
  includeFullBreakdown?: boolean
}

/**
 * Score explanation request
 */
export interface ExplanationRequest {
  productId: string
  focusAreas?: FactorPillar[]
  detailLevel?: 'summary' | 'detailed' | 'full'
}
