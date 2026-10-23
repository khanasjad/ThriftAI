/**
 * Factor Scorer
 *
 * Aggregates evidence into individual factor scores (0-100%)
 */

import { FACTOR_TAXONOMY, Factor, getFactorByKey } from '../evidence/factor-taxonomy'
import { FactorScore, Confidence, ScoringConfig, DEFAULT_SCORING_CONFIG } from './scoring-types'

/**
 * Evidence data from database
 */
export interface EvidenceData {
  factor: string
  signal: string
  sentiment: number    // -1.0 to +1.0
  confidence: number   // 0.0 to 1.0
  quote?: string
}

/**
 * Calculate score for a single factor from evidence
 */
export function calculateFactorScore(
  factor: Factor,
  evidence: EvidenceData[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): FactorScore {
  // Filter evidence for this factor
  const factorEvidence = evidence.filter(e => e.factor === factor.key)

  if (factorEvidence.length === 0) {
    // No evidence - return neutral score with NONE confidence
    return {
      factor: factor.key,
      pillar: factor.pillar,
      maxPoints: factor.weight,
      earnedPoints: 0,
      percentage: 0,
      evidenceCount: 0,
      confidence: Confidence.NONE,
      breakdown: {
        positiveEvidence: 0,
        negativeEvidence: 0,
        averageSentiment: 0,
        averageConfidence: 0
      }
    }
  }

  // Calculate weighted sentiment average
  // Evidence with higher confidence weights more
  let weightedSentimentSum = 0
  let totalWeight = 0
  let positiveCount = 0
  let negativeCount = 0
  let confidenceSum = 0

  for (const ev of factorEvidence) {
    const weight = ev.confidence
    weightedSentimentSum += ev.sentiment * weight
    totalWeight += weight

    if (ev.sentiment > 0.2) positiveCount++
    if (ev.sentiment < -0.2) negativeCount++

    confidenceSum += ev.confidence
  }

  const averageSentiment = totalWeight > 0 ? weightedSentimentSum / totalWeight : 0
  const averageConfidence = factorEvidence.length > 0 ? confidenceSum / factorEvidence.length : 0

  // Convert sentiment (-1 to +1) to percentage (0 to 100)
  // -1.0 = 0%, 0.0 = 50%, +1.0 = 100%
  const percentage = ((averageSentiment + 1) / 2) * 100

  // Calculate earned points
  const earnedPoints = (percentage / 100) * factor.weight

  // Determine confidence level based on evidence count and average confidence
  const confidence = determineConfidence(factorEvidence.length, averageConfidence, config)

  return {
    factor: factor.key,
    pillar: factor.pillar,
    maxPoints: factor.weight,
    earnedPoints: Math.round(earnedPoints * 100) / 100, // Round to 2 decimals
    percentage: Math.round(percentage * 100) / 100,
    evidenceCount: factorEvidence.length,
    confidence,
    breakdown: {
      positiveEvidence: positiveCount,
      negativeEvidence: negativeCount,
      averageSentiment: Math.round(averageSentiment * 100) / 100,
      averageConfidence: Math.round(averageConfidence * 100) / 100
    }
  }
}

/**
 * Calculate scores for all factors
 */
export function calculateAllFactorScores(
  evidence: EvidenceData[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): FactorScore[] {
  return FACTOR_TAXONOMY.map(factor =>
    calculateFactorScore(factor, evidence, config)
  )
}

/**
 * Calculate scores for factors with evidence
 */
export function calculateFactorScoresWithEvidence(
  evidence: EvidenceData[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): FactorScore[] {
  // Get unique factors from evidence
  const factorsWithEvidence = new Set(evidence.map(e => e.factor))

  return Array.from(factorsWithEvidence).map(factorKey => {
    const factor = getFactorByKey(factorKey)
    if (!factor) {
      throw new Error(`Unknown factor in evidence: ${factorKey}`)
    }
    return calculateFactorScore(factor, evidence, config)
  })
}

/**
 * Determine confidence level based on evidence
 */
function determineConfidence(
  evidenceCount: number,
  averageConfidence: number,
  config: ScoringConfig
): Confidence {
  if (evidenceCount === 0) {
    return Confidence.NONE
  }

  // Combine evidence count and average confidence
  // High confidence requires both sufficient evidence AND high-confidence extraction
  const evidenceScore = Math.min(evidenceCount / config.minimumEvidenceThreshold, 1.0)
  const combinedScore = (evidenceScore * 0.6) + (averageConfidence * 0.4)

  if (combinedScore >= 0.85) {
    return Confidence.HIGH
  } else if (combinedScore >= 0.65) {
    return Confidence.MEDIUM
  } else {
    return Confidence.LOW
  }
}

/**
 * Get factor scores grouped by pillar
 */
export function groupFactorScoresByPillar(
  factorScores: FactorScore[]
): Map<string, FactorScore[]> {
  const grouped = new Map<string, FactorScore[]>()

  for (const score of factorScores) {
    const pillarScores = grouped.get(score.pillar) || []
    pillarScores.push(score)
    grouped.set(score.pillar, pillarScores)
  }

  return grouped
}

/**
 * Get summary statistics for factor scores
 */
export function getFactorScoreSummary(factorScores: FactorScore[]) {
  const totalFactors = FACTOR_TAXONOMY.length
  const factorsWithEvidence = factorScores.filter(s => s.evidenceCount > 0).length
  const totalEvidence = factorScores.reduce((sum, s) => sum + s.evidenceCount, 0)
  const averageConfidence = factorScores.length > 0
    ? factorScores.reduce((sum, s) => sum + s.breakdown.averageConfidence, 0) / factorScores.length
    : 0

  return {
    totalFactors,
    factorsWithEvidence,
    factorsMissing: totalFactors - factorsWithEvidence,
    totalEvidence,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    coveragePercentage: Math.round((factorsWithEvidence / totalFactors) * 100)
  }
}
