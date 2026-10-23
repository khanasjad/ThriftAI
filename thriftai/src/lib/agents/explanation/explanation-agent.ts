/**
 * Score Explanation Agent
 *
 * Generates natural language explanations for product scores from the 27-factor scoring system.
 * Helps shoppers understand WHY a product scored the way it did.
 */

import { prisma } from '@/lib/prisma'
import { FactorPillar } from '@/lib/agents/evidence/factor-taxonomy'

/**
 * Detail level for explanations
 */
export type ExplanationDetailLevel = 'summary' | 'detailed' | 'full'

/**
 * Score explanation result
 */
export interface ScoreExplanation {
  productId: string
  productName: string
  overallScore: number
  grade: string

  // Summary explanation
  summary: string

  // Pillar explanations
  pillars: PillarExplanation[]

  // Key strengths
  strengths: string[]

  // Key weaknesses
  weaknesses: string[]

  // Recommendations
  recommendations: string[]

  // Evidence highlights
  evidenceHighlights?: EvidenceHighlight[]

  // Detailed breakdown (if requested)
  factorBreakdown?: FactorExplanation[]
}

/**
 * Pillar explanation
 */
export interface PillarExplanation {
  pillar: FactorPillar
  score: number
  percentage: number
  grade: string
  explanation: string
  topFactors: Array<{
    factor: string
    score: number
    impact: 'positive' | 'negative' | 'neutral'
  }>
}

/**
 * Factor explanation
 */
export interface FactorExplanation {
  factor: string
  pillar: FactorPillar
  score: number
  percentage: number
  evidenceCount: number
  explanation: string
  examples: string[]
}

/**
 * Evidence highlight
 */
export interface EvidenceHighlight {
  factor: string
  signal: string
  quote: string
  sentiment: number
  impact: string
}

/**
 * Generate score explanation
 */
export async function explainScore(
  productId: string,
  options: {
    detailLevel?: ExplanationDetailLevel
    focusAreas?: FactorPillar[]
  } = {}
): Promise<ScoreExplanation> {
  const { detailLevel = 'summary', focusAreas } = options

  try {
    // Fetch product with scores
    const product = await prisma.clothingProduct.findUnique({
      where: { id: productId },
      include: {
        productScore: true,
        factorScores: true,
        evidenceTags: {
          orderBy: { confidence: 'desc' },
          take: 20
        }
      }
    })

    if (!product || !product.productScore) {
      throw new Error('Product or score not found')
    }

    const productScore = product.productScore
    const factorScores = product.factorScores

    // Generate summary
    const summary = generateSummary(productScore, product.name)

    // Generate pillar explanations
    const pillars = generatePillarExplanations(
      productScore,
      factorScores,
      focusAreas
    )

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = identifyStrengthsWeaknesses(pillars, factorScores)

    // Generate recommendations
    const recommendations = generateRecommendations(productScore, pillars, weaknesses)

    // Evidence highlights
    const evidenceHighlights = detailLevel !== 'summary'
      ? generateEvidenceHighlights(product.evidenceTags)
      : undefined

    // Factor breakdown
    const factorBreakdown = detailLevel === 'full'
      ? generateFactorBreakdown(factorScores)
      : undefined

    return {
      productId,
      productName: product.name || 'Unknown Product',
      overallScore: parseFloat(productScore.overall.toString()),
      grade: productScore.grade,
      summary,
      pillars,
      strengths,
      weaknesses,
      recommendations,
      evidenceHighlights,
      factorBreakdown
    }
  } catch (error) {
    console.error('Failed to generate score explanation:', error)
    throw error
  }
}

/**
 * Generate overall summary
 */
function generateSummary(productScore: any, productName: string): string {
  const score = parseFloat(productScore.overall.toString())
  const grade = productScore.grade
  const confidence = productScore.confidence

  let summary = `${productName} received an overall score of ${score.toFixed(1)}/100 (Grade ${grade})`

  if (confidence === 'HIGH') {
    summary += ' with high confidence based on substantial evidence.'
  } else if (confidence === 'MEDIUM') {
    summary += ' with moderate confidence. More reviews would improve accuracy.'
  } else {
    summary += ' with low confidence due to limited data.'
  }

  // Add score interpretation
  if (score >= 85) {
    summary += ' This is an excellent product with outstanding quality across most areas.'
  } else if (score >= 75) {
    summary += ' This is a good product with solid performance in key areas.'
  } else if (score >= 65) {
    summary += ' This product has acceptable quality but some notable weaknesses.'
  } else if (score >= 50) {
    summary += ' This product shows mixed results with significant areas for improvement.'
  } else {
    summary += ' This product has substantial quality concerns that should be carefully considered.'
  }

  return summary
}

/**
 * Generate pillar explanations
 */
function generatePillarExplanations(
  productScore: any,
  factorScores: any[],
  focusAreas?: FactorPillar[]
): PillarExplanation[] {
  const pillars: PillarExplanation[] = []

  const pillarData = [
    { pillar: FactorPillar.FIT, key: 'fit' },
    { pillar: FactorPillar.QUALITY, key: 'quality' },
    { pillar: FactorPillar.STYLE_VALUE, key: 'styleValue' },
    { pillar: FactorPillar.COMFORT, key: 'comfort' },
    { pillar: FactorPillar.SUSTAINABILITY, key: 'sustainability' }
  ]

  for (const { pillar, key } of pillarData) {
    // Skip if not in focus areas
    if (focusAreas && !focusAreas.includes(pillar)) continue

    const pillarScore = productScore[key]
    if (!pillarScore) continue

    const percentage = parseFloat(pillarScore.percentage?.toString() || '0')
    const grade = getLetterGrade(percentage)

    // Get top factors for this pillar
    const pillarFactorScores = factorScores.filter(fs =>
      fs.pillar === pillar
    ).sort((a, b) =>
      parseFloat(b.earnedPoints.toString()) - parseFloat(a.earnedPoints.toString())
    ).slice(0, 3)

    const topFactors = pillarFactorScores.map(fs => ({
      factor: fs.factor,
      score: parseFloat(fs.percentage.toString()),
      impact: getImpact(parseFloat(fs.percentage.toString()))
    }))

    const explanation = generatePillarExplanation(pillar, percentage, grade, topFactors)

    pillars.push({
      pillar,
      score: parseFloat(pillarScore.earnedPoints?.toString() || '0'),
      percentage,
      grade,
      explanation,
      topFactors
    })
  }

  return pillars
}

/**
 * Generate explanation for a pillar
 */
function generatePillarExplanation(
  pillar: FactorPillar,
  percentage: number,
  grade: string,
  topFactors: any[]
): string {
  const pillarNames = {
    [FactorPillar.FIT]: 'Fit & Sizing',
    [FactorPillar.QUALITY]: 'Quality & Durability',
    [FactorPillar.STYLE_VALUE]: 'Style & Value',
    [FactorPillar.COMFORT]: 'Comfort',
    [FactorPillar.SUSTAINABILITY]: 'Sustainability'
  }

  let explanation = `${pillarNames[pillar]}: ${percentage.toFixed(1)}% (Grade ${grade}). `

  if (percentage >= 80) {
    explanation += 'Excellent performance in this area.'
  } else if (percentage >= 70) {
    explanation += 'Good performance with minor room for improvement.'
  } else if (percentage >= 60) {
    explanation += 'Acceptable performance but could be better.'
  } else if (percentage >= 50) {
    explanation += 'Below average performance with notable issues.'
  } else {
    explanation += 'Significant concerns in this area.'
  }

  if (topFactors.length > 0) {
    const strongFactors = topFactors.filter(f => f.impact === 'positive')
    const weakFactors = topFactors.filter(f => f.impact === 'negative')

    if (strongFactors.length > 0) {
      explanation += ` Strong points: ${strongFactors.map(f => formatFactorName(f.factor)).join(', ')}.`
    }

    if (weakFactors.length > 0) {
      explanation += ` Weak points: ${weakFactors.map(f => formatFactorName(f.factor)).join(', ')}.`
    }
  }

  return explanation
}

/**
 * Identify strengths and weaknesses
 */
function identifyStrengthsWeaknesses(
  pillars: PillarExplanation[],
  factorScores: any[]
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = []
  const weaknesses: string[] = []

  // Strong pillars
  pillars
    .filter(p => p.percentage >= 80)
    .forEach(p => {
      strengths.push(`Outstanding ${p.pillar.toLowerCase().replace('_', ' ')} (${p.percentage.toFixed(1)}%)`)
    })

  // Weak pillars
  pillars
    .filter(p => p.percentage < 60)
    .forEach(p => {
      weaknesses.push(`Below average ${p.pillar.toLowerCase().replace('_', ' ')} (${p.percentage.toFixed(1)}%)`)
    })

  // Top individual factors
  factorScores
    .filter(fs => parseFloat(fs.percentage.toString()) >= 85)
    .slice(0, 3)
    .forEach(fs => {
      strengths.push(formatFactorName(fs.factor))
    })

  // Weak individual factors
  factorScores
    .filter(fs => parseFloat(fs.percentage.toString()) < 50)
    .slice(0, 3)
    .forEach(fs => {
      weaknesses.push(formatFactorName(fs.factor))
    })

  return { strengths, weaknesses }
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  productScore: any,
  pillars: PillarExplanation[],
  weaknesses: string[]
): string[] {
  const recommendations: string[] = []

  const overallScore = parseFloat(productScore.overall.toString())

  if (overallScore >= 80) {
    recommendations.push('This is a high-quality product worth considering for purchase')
  } else if (overallScore >= 70) {
    recommendations.push('This is a solid choice, especially if it meets your specific needs')
  } else if (overallScore >= 60) {
    recommendations.push('Consider carefully whether the strengths outweigh the weaknesses for your use case')
  } else {
    recommendations.push('Look for alternative products with better overall quality')
  }

  // Pillar-specific recommendations
  const weakPillars = pillars.filter(p => p.percentage < 70)
  if (weakPillars.length > 0) {
    weakPillars.forEach(p => {
      if (p.pillar === FactorPillar.FIT) {
        recommendations.push('Pay close attention to sizing - consider reading detailed fit reviews')
      } else if (p.pillar === FactorPillar.QUALITY) {
        recommendations.push('Be aware of potential durability issues - may not last as long as expected')
      } else if (p.pillar === FactorPillar.COMFORT) {
        recommendations.push('Comfort may be an issue - try on if possible or check return policy')
      }
    })
  }

  // Confidence-based recommendations
  if (productScore.confidence === 'LOW') {
    recommendations.push('Limited review data - consider waiting for more customer feedback')
  }

  return recommendations.slice(0, 5) // Limit to 5 recommendations
}

/**
 * Generate evidence highlights
 */
function generateEvidenceHighlights(evidenceTags: any[]): EvidenceHighlight[] {
  return evidenceTags
    .filter(e => e.quote && Math.abs(parseFloat(e.sentiment.toString())) >= 0.7)
    .slice(0, 10)
    .map(e => ({
      factor: formatFactorName(e.factor),
      signal: e.signal,
      quote: e.quote,
      sentiment: parseFloat(e.sentiment.toString()),
      impact: parseFloat(e.sentiment.toString()) > 0 ? 'Positive' : 'Negative'
    }))
}

/**
 * Generate factor breakdown
 */
function generateFactorBreakdown(factorScores: any[]): FactorExplanation[] {
  return factorScores.map(fs => ({
    factor: formatFactorName(fs.factor),
    pillar: fs.pillar,
    score: parseFloat(fs.earnedPoints.toString()),
    percentage: parseFloat(fs.percentage.toString()),
    evidenceCount: fs.evidenceCount,
    explanation: generateFactorExplanation(fs),
    examples: []
  }))
}

/**
 * Generate factor-level explanation
 */
function generateFactorExplanation(factorScore: any): string {
  const percentage = parseFloat(factorScore.percentage.toString())
  const evidenceCount = factorScore.evidenceCount

  let explanation = `${percentage.toFixed(1)}% based on ${evidenceCount} pieces of evidence. `

  if (percentage >= 85) {
    explanation += 'Excellent performance.'
  } else if (percentage >= 70) {
    explanation += 'Good performance.'
  } else if (percentage >= 50) {
    explanation += 'Mixed results.'
  } else {
    explanation += 'Below expectations.'
  }

  return explanation
}

/**
 * Get letter grade from percentage
 */
function getLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+'
  if (percentage >= 93) return 'A'
  if (percentage >= 90) return 'A-'
  if (percentage >= 87) return 'B+'
  if (percentage >= 83) return 'B'
  if (percentage >= 80) return 'B-'
  if (percentage >= 77) return 'C+'
  if (percentage >= 73) return 'C'
  if (percentage >= 70) return 'C-'
  if (percentage >= 67) return 'D+'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Get impact classification
 */
function getImpact(percentage: number): 'positive' | 'negative' | 'neutral' {
  if (percentage >= 70) return 'positive'
  if (percentage < 60) return 'negative'
  return 'neutral'
}

/**
 * Format factor name for display
 */
function formatFactorName(factor: string): string {
  return factor
    .split('.')
    .pop()!
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Compare two products
 */
export async function compareProducts(
  productIds: string[],
  focusAreas?: FactorPillar[]
): Promise<{
  products: ScoreExplanation[]
  comparison: string
  winner?: string
}> {
  // Get explanations for all products
  const products = await Promise.all(
    productIds.map(id => explainScore(id, { detailLevel: 'detailed', focusAreas }))
  )

  // Generate comparison text
  const comparison = generateComparison(products, focusAreas)

  // Determine winner
  const winner = products.reduce((best, current) =>
    current.overallScore > best.overallScore ? current : best
  ).productId

  return {
    products,
    comparison,
    winner
  }
}

/**
 * Generate comparison text
 */
function generateComparison(products: ScoreExplanation[], focusAreas?: FactorPillar[]): string {
  if (products.length < 2) return 'Need at least 2 products to compare'

  let comparison = `Comparing ${products.length} products:\n\n`

  // Overall scores
  comparison += 'Overall Scores:\n'
  products.forEach(p => {
    comparison += `  • ${p.productName}: ${p.overallScore.toFixed(1)}/100 (${p.grade})\n`
  })

  // Pillar comparison
  if (focusAreas) {
    comparison += '\nFocus Areas:\n'
    focusAreas.forEach(pillar => {
      comparison += `  ${pillar}:\n`
      products.forEach(p => {
        const pillarData = p.pillars.find(pl => pl.pillar === pillar)
        if (pillarData) {
          comparison += `    • ${p.productName}: ${pillarData.percentage.toFixed(1)}% (${pillarData.grade})\n`
        }
      })
    })
  }

  return comparison
}
