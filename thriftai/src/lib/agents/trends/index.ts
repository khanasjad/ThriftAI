/**
 * Trend & Brand Agent - Main Exports
 *
 * This module provides trend analysis and brand reputation assessment
 * to generate evidence for Factors 15 (Brand Reputation) and 17 (Trend Relevance).
 */

// Types
export {
  TrendPhase,
  TrendSource,
  ReputationSource,
  DEFAULT_TREND_CONFIG
} from './trend-types'

export type {
  TrendSignal,
  BrandReputation,
  TrendRelevance,
  BrandReputationEvidence,
  TrendRelevanceEvidence,
  TrendConfig
} from './trend-types'

// Brand Analyzer
export {
  analyzeBrandReputation,
  generateBrandReputationEvidence,
  formatBrandReputation
} from './brand-analyzer'

// Trend Analyzer
export {
  analyzeTrendRelevance,
  generateTrendRelevanceEvidence,
  formatTrendRelevance
} from './trend-analyzer'
