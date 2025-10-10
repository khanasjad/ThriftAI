/**
 * Internal Price Analysis Calculator
 * FREE - Pure calculation formulas
 *
 * Comprehensive price analytics without external APIs:
 * - Price percentile calculation
 * - Value-for-money scoring
 * - Price competitiveness analysis
 * - Market positioning metrics
 * - Deal quality assessment
 * - Price trend indicators
 *
 * Coverage: +12 parameters for Market Value category
 */

import { logger } from '@/lib/logger'

export interface PriceAnalysisData {
  productPrice: number
  originalPrice?: number
  category: string
  condition: string

  // Price Metrics (4 params)
  pricePercentile: number // 0-100 (where does this price fall in market)
  discountFromOriginal: number // % discount if originalPrice exists
  pricePerQualityPoint: number // Price divided by condition quality
  relativePriceScore: number // 0-100 (how good is this price)

  // Value Metrics (4 params)
  valueForMoneyScore: number // 0-100 overall value
  priceCompetitiveness: number // 0-100 how competitive
  dealQualityRating: 'Exceptional' | 'Great' | 'Good' | 'Fair' | 'Poor'
  expectedSavings: number // Estimated savings vs buying new

  // Market Position (4 params)
  marketPosition: 'Budget' | 'Value' | 'Mid-Range' | 'Premium' | 'Luxury'
  priceTier: 'Entry' | 'Standard' | 'Premium' | 'Luxury'
  affordabilityIndex: number // 0-100 (how affordable)
  priceStability: number // 0-100 (how stable is this pricing)
}

export interface MarketPriceContext {
  averagePrice?: number
  lowestPrice?: number
  highestPrice?: number
  priceHistory?: number[] // Historical prices
  competitorCount?: number
}

/**
 * Perform comprehensive price analysis
 */
export function analyzePricing(
  productPrice: number,
  options: {
    originalPrice?: number
    category: string
    condition: string
    marketContext?: MarketPriceContext
  }
): PriceAnalysisData {

  try {
    logger.info('💰 Analyzing product pricing', {
      component: 'PriceAnalyzer',
      metadata: {
        price: productPrice,
        category: options.category,
        condition: options.condition
      }
    })

    // Get condition quality multiplier
    const conditionQuality = getConditionQuality(options.condition)

    // Calculate price percentile
    const pricePercentile = calculatePricePercentile(
      productPrice,
      options.marketContext
    )

    // Calculate discount from original
    const discountFromOriginal = options.originalPrice
      ? ((options.originalPrice - productPrice) / options.originalPrice) * 100
      : 0

    // Price per quality point
    const pricePerQualityPoint = productPrice / (conditionQuality * 100)

    // Relative price score
    const relativePriceScore = calculateRelativePriceScore(
      productPrice,
      options.category,
      options.condition,
      options.marketContext
    )

    // Value for money score
    const valueForMoneyScore = calculateValueForMoney(
      productPrice,
      conditionQuality,
      discountFromOriginal,
      pricePercentile
    )

    // Price competitiveness
    const priceCompetitiveness = calculatePriceCompetitiveness(
      productPrice,
      options.marketContext
    )

    // Deal quality rating
    const dealQualityRating = determineDealQuality(valueForMoneyScore)

    // Expected savings vs new
    const expectedSavings = calculateExpectedSavings(
      productPrice,
      options.category,
      options.condition,
      options.originalPrice
    )

    // Market position
    const marketPosition = determineMarketPosition(
      productPrice,
      options.category
    )

    // Price tier
    const priceTier = determinePriceTier(productPrice)

    // Affordability index
    const affordabilityIndex = calculateAffordabilityIndex(
      productPrice,
      options.category
    )

    // Price stability
    const priceStability = calculatePriceStability(
      options.marketContext?.priceHistory
    )

    const result: PriceAnalysisData = {
      productPrice,
      originalPrice: options.originalPrice,
      category: options.category,
      condition: options.condition,

      // Price Metrics
      pricePercentile: Math.round(pricePercentile),
      discountFromOriginal: Math.round(discountFromOriginal),
      pricePerQualityPoint: Math.round(pricePerQualityPoint * 100) / 100,
      relativePriceScore: Math.round(relativePriceScore),

      // Value Metrics
      valueForMoneyScore: Math.round(valueForMoneyScore),
      priceCompetitiveness: Math.round(priceCompetitiveness),
      dealQualityRating,
      expectedSavings: Math.round(expectedSavings * 100) / 100,

      // Market Position
      marketPosition,
      priceTier,
      affordabilityIndex: Math.round(affordabilityIndex),
      priceStability: Math.round(priceStability)
    }

    logger.info('✅ Price analysis complete', {
      component: 'PriceAnalyzer',
      metadata: {
        valueScore: result.valueForMoneyScore,
        dealQuality: result.dealQualityRating
      }
    })

    return result

  } catch (error) {
    logger.error('❌ Price analysis failed', {
      component: 'PriceAnalyzer',
      error: error instanceof Error ? error.message : String(error)
    })

    // Return safe defaults
    return getDefaultPriceAnalysis(productPrice, options.category, options.condition)
  }
}

/**
 * Get condition quality multiplier (0-1)
 */
function getConditionQuality(condition: string): number {
  const qualityMap: Record<string, number> = {
    'New': 1.0,
    'Like New': 0.95,
    'Excellent': 0.90,
    'Good': 0.80,
    'Fair': 0.65,
    'Poor': 0.45,
    'Acceptable': 0.70
  }

  return qualityMap[condition] || 0.75
}

/**
 * Calculate price percentile (0-100)
 */
function calculatePricePercentile(
  price: number,
  marketContext?: MarketPriceContext
): number {

  if (!marketContext || !marketContext.lowestPrice || !marketContext.highestPrice) {
    return 50 // Default to median
  }

  const { lowestPrice, highestPrice } = marketContext
  const range = highestPrice - lowestPrice

  if (range === 0) return 50

  const percentile = ((price - lowestPrice) / range) * 100

  return Math.max(0, Math.min(100, percentile))
}

/**
 * Calculate relative price score (0-100)
 * Lower prices = higher score
 */
function calculateRelativePriceScore(
  price: number,
  category: string,
  condition: string,
  marketContext?: MarketPriceContext
): number {

  let score = 50 // Base score

  // Compare to market average
  if (marketContext?.averagePrice) {
    const vsAverage = ((marketContext.averagePrice - price) / marketContext.averagePrice) * 100

    // Bonus for beating average
    if (vsAverage > 0) {
      score += Math.min(30, vsAverage * 2)
    } else {
      score -= Math.min(30, Math.abs(vsAverage))
    }
  }

  // Condition adjustment
  const conditionQuality = getConditionQuality(condition)
  score += (conditionQuality - 0.75) * 40

  // Category price expectations
  const categoryPremium = getCategoryPriceExpectation(category)
  if (price < categoryPremium.low) score += 15
  else if (price > categoryPremium.high) score -= 15

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate value for money score
 */
function calculateValueForMoney(
  price: number,
  conditionQuality: number,
  discountPercent: number,
  pricePercentile: number
): number {

  let score = 0

  // Quality-to-price ratio (0-40 points)
  const qualityPriceRatio = conditionQuality * (100 - pricePercentile) / 100
  score += qualityPriceRatio * 40

  // Discount bonus (0-30 points)
  if (discountPercent > 0) {
    score += Math.min(30, (discountPercent / 60) * 30)
  }

  // Price position bonus (0-30 points)
  if (pricePercentile < 25) {
    score += 30 // Bottom quartile = excellent value
  } else if (pricePercentile < 50) {
    score += 20
  } else if (pricePercentile < 75) {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate price competitiveness
 */
function calculatePriceCompetitiveness(
  price: number,
  marketContext?: MarketPriceContext
): number {

  if (!marketContext) return 50

  let score = 50

  // Compare to lowest competitor
  if (marketContext.lowestPrice) {
    const vsLowest = ((marketContext.lowestPrice - price) / marketContext.lowestPrice) * 100

    if (vsLowest >= 0) {
      // We're at or below lowest
      score = 100
    } else if (vsLowest > -10) {
      score = 85 // Within 10% of lowest
    } else if (vsLowest > -25) {
      score = 70
    } else {
      score = 50
    }
  }

  // Competitor count bonus
  if (marketContext.competitorCount) {
    if (marketContext.competitorCount > 50) score += 10
    else if (marketContext.competitorCount > 20) score += 5
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Determine deal quality rating
 */
function determineDealQuality(valueScore: number): PriceAnalysisData['dealQualityRating'] {
  if (valueScore >= 85) return 'Exceptional'
  if (valueScore >= 70) return 'Great'
  if (valueScore >= 55) return 'Good'
  if (valueScore >= 40) return 'Fair'
  return 'Poor'
}

/**
 * Calculate expected savings vs buying new
 */
function calculateExpectedSavings(
  price: number,
  category: string,
  condition: string,
  originalPrice?: number
): number {

  // If original price provided, use it
  if (originalPrice) {
    return originalPrice - price
  }

  // Otherwise, estimate based on category and condition
  const categoryMSRP = getCategoryPriceExpectation(category)
  const estimatedNew = (categoryMSRP.low + categoryMSRP.high) / 2

  const conditionDepreciation = {
    'New': 0.0,
    'Like New': 0.10,
    'Excellent': 0.20,
    'Good': 0.35,
    'Fair': 0.50,
    'Poor': 0.65,
    'Acceptable': 0.40
  }

  const depreciation = conditionDepreciation[condition as keyof typeof conditionDepreciation] || 0.35
  const expectedUsedPrice = estimatedNew * (1 - depreciation)

  return Math.max(0, expectedUsedPrice - price)
}

/**
 * Determine market position
 */
function determineMarketPosition(
  price: number,
  category: string
): PriceAnalysisData['marketPosition'] {

  const categoryRanges = getCategoryPriceExpectation(category)

  if (price < categoryRanges.low * 0.5) return 'Budget'
  if (price < categoryRanges.low) return 'Value'
  if (price < categoryRanges.high) return 'Mid-Range'
  if (price < categoryRanges.high * 1.5) return 'Premium'
  return 'Luxury'
}

/**
 * Determine price tier
 */
function determinePriceTier(price: number): PriceAnalysisData['priceTier'] {
  if (price < 50) return 'Entry'
  if (price < 200) return 'Standard'
  if (price < 500) return 'Premium'
  return 'Luxury'
}

/**
 * Calculate affordability index
 */
function calculateAffordabilityIndex(
  price: number,
  category: string
): number {

  const categoryMax = getCategoryPriceExpectation(category).high

  // Inverse of price relative to category max
  const affordability = (1 - (price / categoryMax)) * 100

  return Math.max(0, Math.min(100, affordability))
}

/**
 * Calculate price stability from history
 */
function calculatePriceStability(priceHistory?: number[]): number {
  if (!priceHistory || priceHistory.length < 2) {
    return 70 // Default moderate stability
  }

  // Calculate coefficient of variation
  const mean = priceHistory.reduce((sum, p) => sum + p, 0) / priceHistory.length
  const variance = priceHistory.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priceHistory.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = (stdDev / mean) * 100

  // Lower CV = higher stability
  const stability = Math.max(0, 100 - (coefficientOfVariation * 2))

  return Math.min(100, stability)
}

/**
 * Get category price expectations
 */
function getCategoryPriceExpectation(category: string): {
  low: number
  high: number
  average: number
} {
  const categoryRanges: Record<string, { low: number; high: number }> = {
    'ELECTRONICS': { low: 100, high: 1500 },
    'FASHION': { low: 20, high: 300 },
    'ACCESSORIES': { low: 15, high: 250 },
    'FURNITURE': { low: 50, high: 2000 },
    'COLLECTIBLES': { low: 10, high: 5000 },
    'SPORTS': { low: 30, high: 800 },
    'BOOKS': { low: 5, high: 50 }
  }

  const range = categoryRanges[category.toUpperCase()] || { low: 20, high: 500 }

  return {
    low: range.low,
    high: range.high,
    average: (range.low + range.high) / 2
  }
}

/**
 * Get default price analysis (fallback)
 */
function getDefaultPriceAnalysis(
  price: number,
  category: string,
  condition: string
): PriceAnalysisData {

  const conditionQuality = getConditionQuality(condition)

  return {
    productPrice: price,
    category,
    condition,
    pricePercentile: 50,
    discountFromOriginal: 0,
    pricePerQualityPoint: price / (conditionQuality * 100),
    relativePriceScore: 60,
    valueForMoneyScore: 65,
    priceCompetitiveness: 60,
    dealQualityRating: 'Good',
    expectedSavings: price * 0.25,
    marketPosition: 'Mid-Range',
    priceTier: 'Standard',
    affordabilityIndex: 60,
    priceStability: 70
  }
}

/**
 * Generate price analysis summary
 */
export function getPriceAnalysisSummary(data: PriceAnalysisData): string {
  const parts: string[] = []

  // Value assessment
  parts.push(`${data.dealQualityRating} deal at $${data.productPrice}`)

  // Market position
  parts.push(`${data.marketPosition} market position`)

  // Competitiveness
  if (data.priceCompetitiveness >= 80) {
    parts.push('highly competitive pricing')
  } else if (data.priceCompetitiveness >= 60) {
    parts.push('competitive pricing')
  }

  // Savings
  if (data.expectedSavings > 0) {
    parts.push(`saves ~$${Math.round(data.expectedSavings)}`)
  }

  return parts.join(', ') + '.'
}
