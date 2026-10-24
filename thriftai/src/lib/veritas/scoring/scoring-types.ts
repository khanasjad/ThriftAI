/**
 * TypeScript types for Scoring Engine
 */

import { FactorPillar } from '../taxonomy/factor-taxonomy'

/**
 * Confidence levels for scores
 */
export enum Confidence {
  HIGH = 'HIGH',       // 85%+ evidence coverage
  MEDIUM = 'MEDIUM',   // 65-84% evidence coverage
  LOW = 'LOW',         // <65% evidence coverage
  NONE = 'NONE'        // No evidence available
}

/**
 * Letter grades for products
 */
export enum Grade {
  A_PLUS = 'A+',   // 97-100
  A = 'A',         // 93-96
  A_MINUS = 'A-',  // 90-92
  B_PLUS = 'B+',   // 87-89
  B = 'B',         // 83-86
  B_MINUS = 'B-',  // 80-82
  C_PLUS = 'C+',   // 77-79
  C = 'C',         // 73-76
  C_MINUS = 'C-',  // 70-72
  D = 'D',         // 60-69
  F = 'F'          // <60
}

/**
 * Individual factor score
 */
export interface FactorScore {
  factor: string              // e.g., "fit.true_to_size"
  pillar: FactorPillar
  maxPoints: number           // Maximum points for this factor
  earnedPoints: number        // Actual points earned (0 to maxPoints)
  percentage: number          // 0-100
  evidenceCount: number       // Number of evidence pieces
  confidence: Confidence
  breakdown: {
    positiveEvidence: number  // Count of positive evidence
    negativeEvidence: number  // Count of negative evidence
    averageSentiment: number  // -1.0 to +1.0
    averageConfidence: number // 0.0 to 1.0
  }
}

/**
 * Pillar score (aggregated from factors)
 */
export interface PillarScore {
  pillar: FactorPillar
  maxPoints: number           // Maximum points for this pillar
  earnedPoints: number        // Actual points earned
  percentage: number          // 0-100
  factorCount: number         // Number of factors in this pillar
  factorsCovered: number      // Number of factors with evidence
  confidence: Confidence
  factors: FactorScore[]      // Individual factor scores
}

/**
 * Overall product score
 */
export interface ProductScore {
  productId: string
  overall: number             // 0-100
  grade: Grade
  confidence: Confidence

  // Pillar breakdown
  pillars: {
    fit?: PillarScore
    quality?: PillarScore
    styleValue?: PillarScore
    comfort?: PillarScore
    sustainability?: PillarScore
  }

  // Summary stats
  summary: {
    totalEvidence: number
    factorsCovered: number    // Out of 27
    factorsMissing: number
    averageConfidence: number
    isNewLaunch: boolean      // < 10 reviews
  }

  // Metadata
  calculatedAt: Date
  version: string             // Scoring algorithm version
}

/**
 * Scoring configuration
 */
export interface ScoringConfig {
  version: string
  minimumEvidenceThreshold: number  // Min evidence pieces for HIGH confidence
  newLaunchReviewThreshold: number  // Reviews needed to not be "new launch"
  decayFactor: number              // How much to penalize missing factors
}

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  version: 'v1.0',
  minimumEvidenceThreshold: 10,
  newLaunchReviewThreshold: 10,
  decayFactor: 0.5  // Missing factors count as 50% of max points
}
