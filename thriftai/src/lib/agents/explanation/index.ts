/**
 * Score Explanation Agent - Main Exports
 *
 * Generates natural language explanations for product scores.
 */

// Types
export type {
  ExplanationDetailLevel,
  ScoreExplanation,
  PillarExplanation,
  FactorExplanation,
  EvidenceHighlight
} from './explanation-agent'

// Agent functions
export {
  explainScore,
  compareProducts
} from './explanation-agent'
