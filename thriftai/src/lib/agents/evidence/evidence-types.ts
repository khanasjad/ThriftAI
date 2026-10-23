/**
 * TypeScript types for Evidence Extraction
 */

import { FactorPillar } from './factor-taxonomy'

/**
 * Confidence level for extracted evidence
 */
export enum ConfidenceLevel {
  HIGH = 'HIGH',       // 85%+ - Very clear, explicit evidence
  MEDIUM = 'MEDIUM',   // 65-84% - Somewhat clear, implicit evidence
  LOW = 'LOW',         // <65% - Weak or ambiguous evidence
  NONE = 'NONE'        // No relevant evidence found
}

/**
 * Source of evidence
 */
export enum EvidenceSource {
  REVIEW = 'REVIEW',
  RETURN = 'RETURN',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EXPERT_REVIEW = 'EXPERT_REVIEW',
  MANUAL = 'MANUAL'
}

/**
 * Extracted evidence tag
 */
export interface ExtractedEvidence {
  factor: string            // e.g., "fit.true_to_size"
  pillar: FactorPillar
  signal: string            // e.g., "runs_small"
  sentiment: number         // -1.0 to +1.0
  confidence: number        // 0.0 to 1.0
  quote: string             // Original text snippet from review
  explanation?: string      // Why this evidence was extracted
}

/**
 * Input for evidence extraction
 */
export interface EvidenceExtractionInput {
  reviewText: string
  productId?: string
  reviewId?: string
  metadata?: {
    sizePurchased?: string
    height?: string
    weight?: string
    bodyType?: string
  }
}

/**
 * Output from evidence extraction
 */
export interface EvidenceExtractionOutput {
  evidence: ExtractedEvidence[]
  summary: {
    totalEvidence: number
    factorsCovered: string[]
    pillarsCovered: FactorPillar[]
    averageConfidence: number
  }
  processingTime: number  // milliseconds
}

/**
 * Batch extraction result
 */
export interface BatchExtractionResult {
  productId: string
  totalReviews: number
  totalEvidence: number
  evidenceByPillar: Record<FactorPillar, number>
  evidenceByFactor: Record<string, number>
  averageConfidence: number
  processingTime: number
}
