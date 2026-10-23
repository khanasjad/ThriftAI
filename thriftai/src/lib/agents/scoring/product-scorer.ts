/**
 * Product Scorer
 *
 * Calculates overall product score, letter grade, and confidence
 */

import { FactorPillar } from '../evidence/factor-taxonomy'
import {
  ProductScore,
  PillarScore,
  FactorScore,
  Grade,
  Confidence,
  ScoringConfig,
  DEFAULT_SCORING_CONFIG
} from './scoring-types'
import { calculateAllFactorScores } from './factor-scorer'
import { calculateAllPillarScores, getPillarScoreSummary } from './pillar-scorer'
import type { EvidenceData } from './factor-scorer'

/**
 * Calculate complete product score from evidence
 */
export function calculateProductScore(
  productId: string,
  evidence: EvidenceData[],
  reviewCount: number = 0,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ProductScore {
  // Step 1: Calculate all factor scores
  const factorScores = calculateAllFactorScores(evidence, config)

  // Step 2: Calculate all pillar scores
  const pillarScores = calculateAllPillarScores(factorScores, config)

  // Step 3: Calculate overall score (0-100)
  const pillarSummary = getPillarScoreSummary(pillarScores)
  const overall = Math.min(100, Math.max(0, pillarSummary.overallPercentage))

  // Step 4: Assign letter grade
  const grade = calculateGrade(overall)

  // Step 5: Calculate confidence
  const totalEvidence = evidence.length
  const factorsCovered = factorScores.filter(fs => fs.evidenceCount > 0).length
  const factorsMissing = factorScores.length - factorsCovered
  const averageConfidence = evidence.length > 0
    ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
    : 0

  const confidence = calculateOverallConfidence(
    factorsCovered,
    factorScores.length,
    totalEvidence,
    reviewCount,
    config
  )

  // Step 6: Build pillar breakdown
  const fit = pillarScores.find(ps => ps.pillar === FactorPillar.FIT)
  const quality = pillarScores.find(ps => ps.pillar === FactorPillar.QUALITY)
  const styleValue = pillarScores.find(ps => ps.pillar === FactorPillar.STYLE_VALUE)
  const comfort = pillarScores.find(ps => ps.pillar === FactorPillar.COMFORT)
  const sustainability = pillarScores.find(ps => ps.pillar === FactorPillar.SUSTAINABILITY)

  // Step 7: Build final product score
  return {
    productId,
    overall: Math.round(overall * 100) / 100,
    grade,
    confidence,
    pillars: {
      fit,
      quality,
      styleValue,
      comfort,
      sustainability
    },
    summary: {
      totalEvidence,
      factorsCovered,
      factorsMissing,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      isNewLaunch: reviewCount < config.newLaunchReviewThreshold
    },
    calculatedAt: new Date(),
    version: config.version
  }
}

/**
 * Calculate letter grade from overall score
 */
export function calculateGrade(score: number): Grade {
  if (score >= 97) return Grade.A_PLUS
  if (score >= 93) return Grade.A
  if (score >= 90) return Grade.A_MINUS
  if (score >= 87) return Grade.B_PLUS
  if (score >= 83) return Grade.B
  if (score >= 80) return Grade.B_MINUS
  if (score >= 77) return Grade.C_PLUS
  if (score >= 73) return Grade.C
  if (score >= 70) return Grade.C_MINUS
  if (score >= 60) return Grade.D
  return Grade.F
}

/**
 * Calculate overall confidence for product score
 */
export function calculateOverallConfidence(
  factorsCovered: number,
  totalFactors: number,
  totalEvidence: number,
  reviewCount: number,
  config: ScoringConfig
): Confidence {
  // Factor coverage ratio
  const coverageRatio = factorsCovered / totalFactors

  // Evidence sufficiency (relative to minimum threshold)
  const evidenceSufficiency = Math.min(totalEvidence / config.minimumEvidenceThreshold, 1.0)

  // Review count sufficiency
  const reviewSufficiency = Math.min(reviewCount / config.newLaunchReviewThreshold, 1.0)

  // Combine metrics (weighted)
  const combinedScore =
    (coverageRatio * 0.4) +         // 40% - How many factors covered
    (evidenceSufficiency * 0.4) +   // 40% - How much evidence
    (reviewSufficiency * 0.2)       // 20% - How many reviews

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
 * Get grade color for UI display
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case Grade.A_PLUS:
    case Grade.A:
      return 'green'
    case Grade.A_MINUS:
    case Grade.B_PLUS:
      return 'lime'
    case Grade.B:
    case Grade.B_MINUS:
      return 'yellow'
    case Grade.C_PLUS:
    case Grade.C:
      return 'orange'
    case Grade.C_MINUS:
    case Grade.D:
      return 'red-orange'
    case Grade.F:
      return 'red'
  }
}

/**
 * Get confidence badge text
 */
export function getConfidenceBadge(confidence: Confidence): string {
  switch (confidence) {
    case Confidence.HIGH:
      return 'High Confidence'
    case Confidence.MEDIUM:
      return 'Medium Confidence'
    case Confidence.LOW:
      return 'Low Confidence'
    case Confidence.NONE:
      return 'Insufficient Data'
  }
}

/**
 * Format product score for display
 */
export function formatProductScore(score: ProductScore): string {
  const lines = [
    `Product: ${score.productId}`,
    `Overall Score: ${score.overall}/100 (${score.grade})`,
    `Confidence: ${getConfidenceBadge(score.confidence)}`,
    ``,
    `Pillar Scores:`,
  ]

  if (score.pillars.fit) {
    lines.push(`  Fit: ${score.pillars.fit.percentage.toFixed(1)}% (${score.pillars.fit.factorsCovered}/${score.pillars.fit.factorCount} factors)`)
  }
  if (score.pillars.quality) {
    lines.push(`  Quality: ${score.pillars.quality.percentage.toFixed(1)}% (${score.pillars.quality.factorsCovered}/${score.pillars.quality.factorCount} factors)`)
  }
  if (score.pillars.styleValue) {
    lines.push(`  Style & Value: ${score.pillars.styleValue.percentage.toFixed(1)}% (${score.pillars.styleValue.factorsCovered}/${score.pillars.styleValue.factorCount} factors)`)
  }
  if (score.pillars.comfort) {
    lines.push(`  Comfort: ${score.pillars.comfort.percentage.toFixed(1)}% (${score.pillars.comfort.factorsCovered}/${score.pillars.comfort.factorCount} factors)`)
  }
  if (score.pillars.sustainability) {
    lines.push(`  Sustainability: ${score.pillars.sustainability.percentage.toFixed(1)}% (${score.pillars.sustainability.factorsCovered}/${score.pillars.sustainability.factorCount} factors)`)
  }

  lines.push(``)
  lines.push(`Summary:`)
  lines.push(`  Total Evidence: ${score.summary.totalEvidence}`)
  lines.push(`  Factors Covered: ${score.summary.factorsCovered}/27`)
  lines.push(`  Average Confidence: ${(score.summary.averageConfidence * 100).toFixed(1)}%`)
  lines.push(`  New Launch: ${score.summary.isNewLaunch ? 'Yes' : 'No'}`)

  return lines.join('\n')
}
