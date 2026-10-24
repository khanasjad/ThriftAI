/**
 * Pillar Scorer
 *
 * Combines factor scores into pillar scores (Fit, Quality, Style & Value, Comfort, Sustainability)
 */

import { FactorPillar, getFactorsByPillar, getPillarTotalPoints } from '../taxonomy/factor-taxonomy'
import { FactorScore, PillarScore, Confidence, ScoringConfig, DEFAULT_SCORING_CONFIG } from './scoring-types'

/**
 * Calculate score for a single pillar from factor scores
 */
export function calculatePillarScore(
  pillar: FactorPillar,
  factorScores: FactorScore[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PillarScore {
  // Get all factors for this pillar
  const pillarFactors = getFactorsByPillar(pillar)
  const pillarFactorKeys = new Set(pillarFactors.map(f => f.key))

  // Filter factor scores for this pillar
  const pillarFactorScores = factorScores.filter(fs =>
    pillarFactorKeys.has(fs.factor)
  )

  // Maximum possible points for this pillar
  const maxPoints = getPillarTotalPoints(pillar)

  // Count factors with evidence
  const factorsCovered = pillarFactorScores.filter(fs => fs.evidenceCount > 0).length

  if (factorsCovered === 0) {
    // No evidence for this pillar
    return {
      pillar,
      maxPoints,
      earnedPoints: 0,
      percentage: 0,
      factorCount: pillarFactors.length,
      factorsCovered: 0,
      confidence: Confidence.NONE,
      factors: pillarFactorScores
    }
  }

  // Sum up earned points from all factors
  let earnedPoints = 0
  let confidenceSum = 0
  let factorsWithEvidence = 0

  for (const factorScore of pillarFactorScores) {
    if (factorScore.evidenceCount > 0) {
      // Factor has evidence - use earned points
      earnedPoints += factorScore.earnedPoints
      confidenceSum += getConfidenceValue(factorScore.confidence)
      factorsWithEvidence++
    } else {
      // Factor has no evidence - apply decay factor
      // Missing factors count as 50% of max points by default
      earnedPoints += factorScore.maxPoints * config.decayFactor
    }
  }

  // Calculate percentage (0-100)
  const percentage = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0

  // Determine pillar confidence based on factor coverage and confidence
  const coverageRatio = factorsCovered / pillarFactors.length
  const averageFactorConfidence = factorsWithEvidence > 0
    ? confidenceSum / factorsWithEvidence
    : 0

  const confidence = determinePillarConfidence(coverageRatio, averageFactorConfidence)

  return {
    pillar,
    maxPoints,
    earnedPoints: Math.round(earnedPoints * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    factorCount: pillarFactors.length,
    factorsCovered,
    confidence,
    factors: pillarFactorScores
  }
}

/**
 * Calculate scores for all pillars
 */
export function calculateAllPillarScores(
  factorScores: FactorScore[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PillarScore[] {
  return [
    calculatePillarScore(FactorPillar.FIT, factorScores, config),
    calculatePillarScore(FactorPillar.QUALITY, factorScores, config),
    calculatePillarScore(FactorPillar.STYLE_VALUE, factorScores, config),
    calculatePillarScore(FactorPillar.COMFORT, factorScores, config),
    calculatePillarScore(FactorPillar.SUSTAINABILITY, factorScores, config)
  ]
}

/**
 * Calculate scores for pillars with evidence
 */
export function calculatePillarScoresWithEvidence(
  factorScores: FactorScore[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PillarScore[] {
  return calculateAllPillarScores(factorScores, config)
    .filter(ps => ps.factorsCovered > 0)
}

/**
 * Convert confidence enum to numeric value for averaging
 */
function getConfidenceValue(confidence: Confidence): number {
  switch (confidence) {
    case Confidence.HIGH:
      return 1.0
    case Confidence.MEDIUM:
      return 0.75
    case Confidence.LOW:
      return 0.5
    case Confidence.NONE:
      return 0.0
  }
}

/**
 * Determine pillar confidence based on coverage and factor confidence
 */
function determinePillarConfidence(
  coverageRatio: number,
  averageFactorConfidence: number
): Confidence {
  // Combine coverage (how many factors) and quality (confidence of those factors)
  const combinedScore = (coverageRatio * 0.5) + (averageFactorConfidence * 0.5)

  if (combinedScore >= 0.85) {
    return Confidence.HIGH
  } else if (combinedScore >= 0.65) {
    return Confidence.MEDIUM
  } else if (combinedScore > 0) {
    return Confidence.LOW
  } else {
    return Confidence.NONE
  }
}

/**
 * Get summary statistics for pillar scores
 */
export function getPillarScoreSummary(pillarScores: PillarScore[]) {
  const totalMaxPoints = pillarScores.reduce((sum, ps) => sum + ps.maxPoints, 0)
  const totalEarnedPoints = pillarScores.reduce((sum, ps) => sum + ps.earnedPoints, 0)
  const pillarsWithEvidence = pillarScores.filter(ps => ps.factorsCovered > 0).length
  const totalFactorsCovered = pillarScores.reduce((sum, ps) => sum + ps.factorsCovered, 0)
  const totalFactors = pillarScores.reduce((sum, ps) => sum + ps.factorCount, 0)

  return {
    totalPillars: pillarScores.length,
    pillarsWithEvidence,
    totalMaxPoints,
    totalEarnedPoints,
    overallPercentage: totalMaxPoints > 0
      ? Math.round((totalEarnedPoints / totalMaxPoints) * 100 * 100) / 100
      : 0,
    totalFactors,
    totalFactorsCovered,
    coveragePercentage: totalFactors > 0
      ? Math.round((totalFactorsCovered / totalFactors) * 100)
      : 0
  }
}

/**
 * Get pillar score by pillar enum
 */
export function getPillarScoreByPillar(
  pillarScores: PillarScore[],
  pillar: FactorPillar
): PillarScore | undefined {
  return pillarScores.find(ps => ps.pillar === pillar)
}
