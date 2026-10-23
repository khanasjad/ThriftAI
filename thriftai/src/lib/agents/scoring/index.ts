/**
 * Scoring Engine - Main Exports
 *
 * This module provides scoring capabilities that aggregate evidence
 * into factor scores, pillar scores, and overall product scores.
 */

// Types
export {
  Confidence,
  Grade,
  DEFAULT_SCORING_CONFIG
} from './scoring-types'

export type {
  FactorScore,
  PillarScore,
  ProductScore,
  ScoringConfig
} from './scoring-types'

// Factor Scorer
export {
  calculateFactorScore,
  calculateAllFactorScores,
  calculateFactorScoresWithEvidence,
  groupFactorScoresByPillar,
  getFactorScoreSummary
} from './factor-scorer'

export type {
  EvidenceData
} from './factor-scorer'

// Pillar Scorer
export {
  calculatePillarScore,
  calculateAllPillarScores,
  calculatePillarScoresWithEvidence,
  getPillarScoreSummary,
  getPillarScoreByPillar
} from './pillar-scorer'

// Product Scorer
export {
  calculateProductScore,
  calculateGrade,
  calculateOverallConfidence,
  getGradeColor,
  getConfidenceBadge,
  formatProductScore
} from './product-scorer'

// Scoring Engine (Database Integration)
export {
  scoreProduct,
  scoreAllProducts,
  getProductScore
} from './scoring-engine'

export type {
  ScoringEngineOptions,
  ScoringEngineResult
} from './scoring-engine'
