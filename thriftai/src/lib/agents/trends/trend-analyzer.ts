/**
 * Trend Analyzer
 *
 * Analyzes fashion trends and assesses product trend relevance
 * for Factor 17 (Trend Relevance)
 */

import {
  TrendSignal,
  TrendPhase,
  TrendSource,
  TrendRelevance,
  TrendRelevanceEvidence
} from './trend-types'

/**
 * Current fashion trends (mock data for demo)
 */
const CURRENT_TRENDS: Record<string, {phase: TrendPhase, score: number}> = {
  'wide leg jeans': { phase: TrendPhase.PEAK, score: 92 },
  'oversized blazer': { phase: TrendPhase.PEAK, score: 88 },
  'maxi dress': { phase: TrendPhase.CLASSIC, score: 75 },
  'crop top': { phase: TrendPhase.DECLINING, score: 65 },
  'skinny jeans': { phase: TrendPhase.DECLINING, score: 45 },
  'pleated skirt': { phase: TrendPhase.EMERGING, score: 72 },
  'cargo pants': { phase: TrendPhase.PEAK, score: 85 },
  'platform shoes': { phase: TrendPhase.EMERGING, score: 78 },
  'basic tee': { phase: TrendPhase.CLASSIC, score: 95 },
  'white sneakers': { phase: TrendPhase.CLASSIC, score: 90 },
  'denim jacket': { phase: TrendPhase.CLASSIC, score: 88 },
  'leather jacket': { phase: TrendPhase.CLASSIC, score: 85 },
  'mom jeans': { phase: TrendPhase.DECLINING, score: 60 },
  'slip dress': { phase: TrendPhase.PEAK, score: 80 },
  'chunky knit': { phase: TrendPhase.EMERGING, score: 70 }
}

/**
 * Analyze trend relevance for a product
 */
export function analyzeTrendRelevance(
  productId: string,
  productCategory: string,
  productStyle: string,
  useMockData: boolean = true
): TrendRelevance {
  // Find matching trends for this product
  const matchingTrends = findMatchingTrends(productCategory, productStyle)

  // Calculate overall trend score
  const trendScore = calculateTrendScore(matchingTrends)

  // Assign trend rating
  const trendRating = getTrendRating(trendScore, matchingTrends)

  // Calculate longevity score (will it be stylish in 2 years?)
  const longevityScore = calculateLongevityScore(matchingTrends)

  return {
    productId,
    productCategory,
    productStyle,
    matchingTrends,
    trendScore,
    trendRating,
    longevityScore
  }
}

/**
 * Generate evidence from trend relevance analysis
 */
export function generateTrendRelevanceEvidence(
  productId: string,
  relevance: TrendRelevance
): TrendRelevanceEvidence {
  const { trendScore, trendRating, matchingTrends, longevityScore } = relevance

  // Determine signal and sentiment
  const { signal, sentiment, quote } = determineSignalAndSentiment(
    trendScore,
    trendRating,
    matchingTrends,
    longevityScore
  )

  // Calculate confidence based on trend data
  const confidence = calculateConfidence(matchingTrends)

  // Get dominant trend phase
  const phase = matchingTrends.length > 0
    ? matchingTrends[0].phase
    : TrendPhase.CLASSIC

  return {
    productId,
    factor: 'style_value.trend_relevance',
    signal,
    sentiment,
    confidence,
    quote,
    metadata: {
      trendScore,
      matchingTrends: matchingTrends.map(t => t.keyword),
      phase,
      longevityScore
    }
  }
}

/**
 * Find trends that match product
 */
function findMatchingTrends(
  category: string,
  style: string
): Array<{keyword: string, phase: TrendPhase, score: number, relevanceScore: number}> {
  const matches: Array<{keyword: string, phase: TrendPhase, score: number, relevanceScore: number}> = []

  // Normalize inputs
  const normalizedStyle = style.toLowerCase()
  const normalizedCategory = category.toLowerCase()

  // Check each trend for matches
  for (const [keyword, trendData] of Object.entries(CURRENT_TRENDS)) {
    const relevanceScore = calculateRelevanceScore(
      keyword,
      normalizedStyle,
      normalizedCategory
    )

    if (relevanceScore > 0) {
      matches.push({
        keyword,
        phase: trendData.phase,
        score: trendData.score,
        relevanceScore
      })
    }
  }

  // Sort by relevance score (highest first)
  return matches.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Calculate how relevant a trend is to the product
 */
function calculateRelevanceScore(
  trendKeyword: string,
  productStyle: string,
  productCategory: string
): number {
  let score = 0

  // Direct keyword match in style
  if (productStyle.includes(trendKeyword)) {
    score += 100
  }

  // Partial keyword match
  const trendWords = trendKeyword.split(' ')
  const matchedWords = trendWords.filter(word =>
    productStyle.includes(word) || productCategory.includes(word)
  )

  if (matchedWords.length > 0) {
    score += (matchedWords.length / trendWords.length) * 70
  }

  // Category-specific matches
  if (trendKeyword.includes(productCategory)) {
    score += 50
  }

  return Math.min(100, Math.round(score))
}

/**
 * Calculate overall trend score from matching trends
 */
function calculateTrendScore(matchingTrends: any[]): number {
  if (matchingTrends.length === 0) {
    return 50  // Neutral if no trends matched
  }

  // Weight by relevance and trend score
  const weightedScore = matchingTrends.reduce((sum, trend) => {
    const weight = trend.relevanceScore / 100
    return sum + (trend.score * weight)
  }, 0)

  const totalWeight = matchingTrends.reduce((sum, trend) =>
    sum + (trend.relevanceScore / 100), 0
  )

  return Math.round(totalWeight > 0 ? weightedScore / totalWeight : 50)
}

/**
 * Get trend rating from score and trends
 */
function getTrendRating(
  score: number,
  matchingTrends: any[]
): 'on_trend' | 'timeless' | 'dated' | 'fast_fashion' {
  if (matchingTrends.length === 0) {
    return 'timeless'  // No strong trends = classic piece
  }

  const dominantPhase = matchingTrends[0]?.phase

  // Check for classic/timeless trends
  const classicTrends = matchingTrends.filter(t => t.phase === TrendPhase.CLASSIC)
  if (classicTrends.length > 0 && score >= 75) {
    return 'timeless'
  }

  // Check for peak/emerging trends
  if (dominantPhase === TrendPhase.PEAK || dominantPhase === TrendPhase.EMERGING) {
    if (score >= 75) {
      return 'on_trend'
    } else {
      return 'fast_fashion'  // Trendy but low quality
    }
  }

  // Declining trends
  if (dominantPhase === TrendPhase.DECLINING) {
    return 'dated'
  }

  return 'timeless'
}

/**
 * Calculate longevity score (will it be stylish in 2 years?)
 */
function calculateLongevityScore(matchingTrends: any[]): number {
  if (matchingTrends.length === 0) {
    return 80  // No trends = likely classic/timeless
  }

  let longevityScore = 50  // Base score

  matchingTrends.forEach(trend => {
    const weight = trend.relevanceScore / 100

    // Classic trends add to longevity
    if (trend.phase === TrendPhase.CLASSIC) {
      longevityScore += 30 * weight
    }

    // Peak trends neutral to longevity
    if (trend.phase === TrendPhase.PEAK) {
      longevityScore += 10 * weight
    }

    // Emerging trends slightly reduce longevity (unproven)
    if (trend.phase === TrendPhase.EMERGING) {
      longevityScore -= 5 * weight
    }

    // Declining trends reduce longevity
    if (trend.phase === TrendPhase.DECLINING) {
      longevityScore -= 25 * weight
    }
  })

  return Math.round(Math.max(0, Math.min(100, longevityScore)))
}

/**
 * Determine signal and sentiment for trend relevance
 */
function determineSignalAndSentiment(
  trendScore: number,
  trendRating: string,
  matchingTrends: any[],
  longevityScore: number
): {
  signal: 'on_trend' | 'timeless' | 'dated' | 'fast_fashion'
  sentiment: number
  quote: string
} {
  const signal = trendRating as any

  let sentiment = 0
  let quote = ''

  switch (trendRating) {
    case 'timeless':
      sentiment = 1.0
      quote = `Classic, timeless style (${trendScore}/100 trend score, ${longevityScore}/100 longevity)`
      if (matchingTrends.length > 0) {
        quote += ` - matches classic trends: ${matchingTrends.slice(0, 2).map(t => t.keyword).join(', ')}`
      }
      break

    case 'on_trend':
      sentiment = 0.7
      quote = `On-trend and current (${trendScore}/100 trend score) - matches: ${matchingTrends.slice(0, 2).map(t => t.keyword).join(', ')}`
      break

    case 'fast_fashion':
      sentiment = -0.5
      quote = `Trendy but may not last (${trendScore}/100 trend score, ${longevityScore}/100 longevity)`
      break

    case 'dated':
      sentiment = -0.8
      quote = `Style is declining in popularity (${trendScore}/100 trend score) - matches declining trends`
      break
  }

  return { signal, sentiment, quote }
}

/**
 * Calculate confidence for trend evidence
 */
function calculateConfidence(matchingTrends: any[]): number {
  // More trends matched = higher confidence
  const trendCountScore = Math.min(matchingTrends.length / 3, 1.0) * 0.5

  // Higher relevance scores = higher confidence
  const avgRelevance = matchingTrends.length > 0
    ? matchingTrends.reduce((sum, t) => sum + t.relevanceScore, 0) / matchingTrends.length / 100
    : 0.5

  const relevanceScore = avgRelevance * 0.5

  return Math.min(1.0, trendCountScore + relevanceScore)
}

/**
 * Format trend relevance for display
 */
export function formatTrendRelevance(relevance: TrendRelevance): string {
  const lines = [
    `Product: ${relevance.productId}`,
    `Category: ${relevance.productCategory}`,
    `Style: ${relevance.productStyle}`,
    ``,
    `Trend Assessment:`,
    `  Score: ${relevance.trendScore}/100`,
    `  Rating: ${relevance.trendRating.toUpperCase()}`,
    `  Longevity: ${relevance.longevityScore}/100`,
    ``
  ]

  if (relevance.matchingTrends.length > 0) {
    lines.push(`Matching Trends:`)
    relevance.matchingTrends.slice(0, 5).forEach(trend => {
      lines.push(`  • ${trend.keyword} (${trend.phase}, ${trend.score}/100, ${trend.relevanceScore}% match)`)
    })
  } else {
    lines.push(`No strong trend matches - likely a classic/timeless piece`)
  }

  return lines.join('\n')
}
