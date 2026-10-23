/**
 * Price Comparison Engine
 *
 * Analyzes price points from multiple retailers and calculates fairness metrics
 */

import {
  PricePoint,
  PriceComparison,
  Retailer
} from './pricing-types'

/**
 * Compare prices across retailers
 */
export function comparePrices(
  productId: string,
  brandDirectPrice: number,
  competitorPrices: PricePoint[]
): PriceComparison {
  // Combine all prices for statistics
  const allPrices = [
    brandDirectPrice,
    ...competitorPrices.filter(p => p.availability === 'in_stock').map(p => p.price)
  ]

  // Calculate statistics
  const lowestPrice = Math.min(...allPrices)
  const highestPrice = Math.max(...allPrices)
  const averagePrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length
  const medianPrice = calculateMedian(allPrices)

  // Calculate brand's price position
  const pricePosition = calculatePricePosition(brandDirectPrice, allPrices)
  const percentileRank = calculatePercentileRank(brandDirectPrice, allPrices)

  // Calculate savings
  const savingsVsAverage = averagePrice - brandDirectPrice
  const savingsVsLowest = brandDirectPrice - lowestPrice

  // Calculate fairness score (0-100)
  const fairnessScore = calculateFairnessScore(
    brandDirectPrice,
    lowestPrice,
    averagePrice,
    highestPrice
  )

  // Assign fairness rating
  const fairnessRating = getFairnessRating(fairnessScore)

  return {
    productId,
    brandDirectPrice,
    competitorPrices,
    lowestPrice,
    highestPrice,
    averagePrice: Math.round(averagePrice * 100) / 100,
    medianPrice: Math.round(medianPrice * 100) / 100,
    pricePosition,
    percentileRank: Math.round(percentileRank * 100) / 100,
    savingsVsAverage: Math.round(savingsVsAverage * 100) / 100,
    savingsVsLowest: Math.round(savingsVsLowest * 100) / 100,
    fairnessScore: Math.round(fairnessScore * 100) / 100,
    fairnessRating,
    comparisonDate: new Date(),
    totalComparisons: allPrices.length
  }
}

/**
 * Calculate median price
 */
function calculateMedian(prices: number[]): number {
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  } else {
    return sorted[mid]
  }
}

/**
 * Calculate price position relative to market
 */
function calculatePricePosition(
  brandPrice: number,
  allPrices: number[]
): 'lowest' | 'below_average' | 'average' | 'above_average' | 'highest' {
  const lowest = Math.min(...allPrices)
  const highest = Math.max(...allPrices)
  const average = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length

  if (brandPrice === lowest) {
    return 'lowest'
  } else if (brandPrice === highest) {
    return 'highest'
  } else if (brandPrice < average * 0.95) {
    return 'below_average'
  } else if (brandPrice > average * 1.05) {
    return 'above_average'
  } else {
    return 'average'
  }
}

/**
 * Calculate percentile rank (0 = cheapest, 100 = most expensive)
 */
function calculatePercentileRank(brandPrice: number, allPrices: number[]): number {
  const sorted = [...allPrices].sort((a, b) => a - b)
  const rank = sorted.findIndex(p => p >= brandPrice)

  if (rank === -1) {
    return 100  // More expensive than all
  }

  return (rank / sorted.length) * 100
}

/**
 * Calculate fairness score (0-100)
 *
 * Algorithm:
 * - 100 = Lowest price in market (best value)
 * - 90-99 = Within 5% of lowest price (excellent value)
 * - 75-89 = Within 10% of average price (good value)
 * - 50-74 = Within 25% of average price (fair value)
 * - 25-49 = Within 50% of average price (expensive)
 * - 0-24 = More than 50% above average (overpriced)
 */
function calculateFairnessScore(
  brandPrice: number,
  lowestPrice: number,
  averagePrice: number,
  highestPrice: number
): number {
  // If brand has the lowest price, perfect score
  if (brandPrice === lowestPrice) {
    return 100
  }

  // Calculate how far brand price is from lowest
  const premiumVsLowest = (brandPrice - lowestPrice) / lowestPrice

  // Calculate how far brand price is from average
  const premiumVsAverage = (brandPrice - averagePrice) / averagePrice

  // Scoring logic
  if (premiumVsLowest <= 0.05) {
    // Within 5% of lowest → 90-99
    return 100 - (premiumVsLowest * 200)  // Maps 0-5% to 100-90
  } else if (Math.abs(premiumVsAverage) <= 0.10) {
    // Within 10% of average → 75-89
    return 82 - (Math.abs(premiumVsAverage) * 70)
  } else if (Math.abs(premiumVsAverage) <= 0.25) {
    // Within 25% of average → 50-74
    return 62 - (Math.abs(premiumVsAverage) * 48)
  } else if (premiumVsAverage <= 0.50) {
    // Within 50% of average → 25-49
    return 37 - (premiumVsAverage * 24)
  } else {
    // More than 50% above average → 0-24
    return Math.max(0, 25 - ((premiumVsAverage - 0.5) * 25))
  }
}

/**
 * Get fairness rating from score
 */
function getFairnessRating(
  score: number
): 'excellent' | 'good' | 'fair' | 'expensive' | 'overpriced' {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 50) return 'fair'
  if (score >= 25) return 'expensive'
  return 'overpriced'
}

/**
 * Generate mock competitor prices for testing
 */
export function generateMockPrices(
  basePrice: number,
  count: number = 4
): PricePoint[] {
  const retailers: Retailer[] = [
    Retailer.AMAZON,
    Retailer.NORDSTROM,
    Retailer.ZAPPOS,
    Retailer.TARGET,
    Retailer.MACYS
  ]

  const mockPrices: PricePoint[] = []

  for (let i = 0; i < Math.min(count, retailers.length); i++) {
    // Generate price variation: ±20% of base price
    const variation = (Math.random() - 0.5) * 0.4  // -20% to +20%
    const price = Math.round(basePrice * (1 + variation) * 100) / 100

    // Occasionally mark as on sale
    const isOnSale = Math.random() > 0.7
    const originalPrice = isOnSale
      ? Math.round(price * 1.2 * 100) / 100
      : undefined

    mockPrices.push({
      retailer: retailers[i],
      price,
      originalPrice,
      currency: 'USD',
      isOnSale,
      discountPercentage: isOnSale
        ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
        : undefined,
      availability: Math.random() > 0.1 ? 'in_stock' : 'out_of_stock',
      scrapedAt: new Date()
    })
  }

  return mockPrices
}

/**
 * Format price comparison for display
 */
export function formatPriceComparison(comparison: PriceComparison): string {
  const lines = [
    `Price Comparison: ${comparison.productId}`,
    ``,
    `Brand Direct Price: $${comparison.brandDirectPrice.toFixed(2)}`,
    ``,
    `Market Statistics:`,
    `  Lowest Price: $${comparison.lowestPrice.toFixed(2)}`,
    `  Average Price: $${comparison.averagePrice.toFixed(2)}`,
    `  Median Price: $${comparison.medianPrice.toFixed(2)}`,
    `  Highest Price: $${comparison.highestPrice.toFixed(2)}`,
    ``,
    `Position Analysis:`,
    `  Market Position: ${comparison.pricePosition}`,
    `  Percentile Rank: ${comparison.percentileRank.toFixed(1)}th`,
    `  Savings vs Average: ${comparison.savingsVsAverage >= 0 ? '+' : ''}$${comparison.savingsVsAverage.toFixed(2)}`,
    `  Premium vs Lowest: +$${comparison.savingsVsLowest.toFixed(2)}`,
    ``,
    `Fairness Assessment:`,
    `  Score: ${comparison.fairnessScore}/100`,
    `  Rating: ${comparison.fairnessRating.toUpperCase()}`,
    ``
  ]

  if (comparison.competitorPrices.length > 0) {
    lines.push(`Competitor Prices:`)
    comparison.competitorPrices.forEach(cp => {
      const saleText = cp.isOnSale ? ` (${cp.discountPercentage}% off)` : ''
      const stockText = cp.availability !== 'in_stock' ? ` [${cp.availability}]` : ''
      lines.push(`  ${cp.retailer}: $${cp.price.toFixed(2)}${saleText}${stockText}`)
    })
  }

  return lines.join('\n')
}
