/**
 * Query Understanding Agent - Main Exports
 *
 * Provides natural language query understanding and structured search generation.
 */

// Types
export {
  QueryIntent,
  ClothingCategory,
  DEFAULT_QUERY_CONFIG
} from './query-types'

export type {
  SearchFilters,
  ExtractedEntities,
  QueryUnderstanding,
  QueryUnderstandingRequest,
  QueryUnderstandingConfig,
  UserPreferences,
  ConversationMessage,
  QueryRewrite,
  ComparisonRequest,
  ExplanationRequest
} from './query-types'

// Agent functions
export {
  understandQuery,
  simplifyQuery,
  extractPriceRange
} from './query-agent'
