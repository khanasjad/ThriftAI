/**
 * Price Intelligence System
 * Tracks price changes, analyzes trends, and detects deals
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export type PriceTrend = 'Rising' | 'Falling' | 'Stable'
export type DealQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor'

export interface PriceHistoryData {
  productId: string
  productName: string
  currentPrice: number
  prices: Array<{
    price: number
    source: string
    recordedAt: Date
    changeType?: string
    changePct?: number
  }>
  lowestPrice: number
  highestPrice: number
  averagePrice: number
  priceChange30d: number
  priceChange90d: number
  trend: PriceTrend
  dealQuality: DealQuality
  dealScore: number // 0-100
  bestTimeToBuy: string
  pricePercentile: number // Where current price sits (0-100)
  volatility: number // Price stability metric
}

export interface PriceIntelligenceResult {
  success: boolean
  data?: PriceHistoryData
  error?: string
}

/**
 * Record a price change for a product
 */
export async function recordPriceChange(
  productId: string,
  price: number,
  source: string = 'Internal',
  metadata?: any
): Promise<void> {
  try {
    // Get previous price
    const previousRecord = await prisma.priceHistory.findFirst({
      where: { productId },
      orderBy: { recordedAt: 'desc' }
    })

    let changeType: string | undefined
    let changePct: number | undefined

    if (previousRecord) {
      const priceDiff = price - previousRecord.price
      const pctChange = (priceDiff / previousRecord.price) * 100

      if (pctChange > 0.5) {
        changeType = 'increase'
      } else if (pctChange < -0.5) {
        changeType = 'decrease'
      } else {
        changeType = 'stable'
      }

      changePct = pctChange
    }

    // Record the new price
    await prisma.priceHistory.create({
      data: {
        productId,
        price,
        source,
        changeType,
        changePct,
        metadata
      }
    })

    logger.info('💰 Price recorded', {
      component: 'PriceIntelligence',
      metadata: {
        productId,
        price,
        changeType,
        changePct: changePct?.toFixed(2)
      }
    })
  } catch (error) {
    logger.error('❌ Failed to record price', {
      component: 'PriceIntelligence',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Analyze price history for a product
 */
export async function analyzePriceHistory(
  productId: string
): Promise<PriceIntelligenceResult> {
  try {
    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return {
        success: false,
        error: 'Product not found'
      }
    }

    // Get price history (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const priceRecords = await prisma.priceHistory.findMany({
      where: {
        productId,
        recordedAt: { gte: ninetyDaysAgo }
      },
      orderBy: { recordedAt: 'desc' }
    })

    if (priceRecords.length === 0) {
      // No history, record current price
      await recordPriceChange(productId, product.price)

      return {
        success: true,
        data: {
          productId,
          productName: product.name,
          currentPrice: product.price,
          prices: [],
          lowestPrice: product.price,
          highestPrice: product.price,
          averagePrice: product.price,
          priceChange30d: 0,
          priceChange90d: 0,
          trend: 'Stable',
          dealQuality: 'Fair',
          dealScore: 50,
          bestTimeToBuy: 'Now',
          pricePercentile: 50,
          volatility: 0
        }
      }
    }

    // Calculate statistics
    const prices = priceRecords.map(r => r.price)
    const currentPrice = product.price
    const lowestPrice = Math.min(...prices)
    const highestPrice = Math.max(...prices)
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length

    // Calculate price changes
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const price30dAgo = priceRecords.find(
      r => r.recordedAt <= thirtyDaysAgo
    )?.price || currentPrice

    const price90dAgo = priceRecords[priceRecords.length - 1]?.price || currentPrice

    const priceChange30d = ((currentPrice - price30dAgo) / price30dAgo) * 100
    const priceChange90d = ((currentPrice - price90dAgo) / price90dAgo) * 100

    // Determine trend
    const trend = calculateTrend(priceChange30d, priceChange90d)

    // Calculate deal quality
    const dealScore = calculateDealScore(currentPrice, lowestPrice, highestPrice, averagePrice)
    const dealQuality = getDealQuality(dealScore)

    // Calculate price percentile (where current price sits in range)
    const pricePercentile = ((currentPrice - lowestPrice) / (highestPrice - lowestPrice)) * 100

    // Calculate volatility
    const volatility = calculateVolatility(prices)

    // Determine best time to buy
    const bestTimeToBuy = determineBestTimeToBuy(trend, dealScore, pricePercentile)

    logger.info('📊 Price analysis complete', {
      component: 'PriceIntelligence',
      metadata: {
        productId,
        currentPrice,
        trend,
        dealQuality,
        dealScore
      }
    })

    return {
      success: true,
      data: {
        productId,
        productName: product.name,
        currentPrice,
        prices: priceRecords.map(r => ({
          price: r.price,
          source: r.source,
          recordedAt: r.recordedAt,
          changeType: r.changeType || undefined,
          changePct: r.changePct || undefined
        })),
        lowestPrice,
        highestPrice,
        averagePrice,
        priceChange30d,
        priceChange90d,
        trend,
        dealQuality,
        dealScore,
        bestTimeToBuy,
        pricePercentile,
        volatility
      }
    }
  } catch (error) {
    logger.error('❌ Price analysis failed', {
      component: 'PriceIntelligence',
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate price trend
 */
function calculateTrend(
  change30d: number,
  change90d: number
): PriceTrend {
  // Rising if both 30d and 90d show increase > 5%
  if (change30d > 5 && change90d > 5) return 'Rising'

  // Falling if both show decrease > 5%
  if (change30d < -5 && change90d < -5) return 'Falling'

  // Otherwise stable
  return 'Stable'
}

/**
 * Calculate deal score (0-100)
 * 100 = current price at lowest historical
 * 0 = current price at highest historical
 */
function calculateDealScore(
  currentPrice: number,
  lowestPrice: number,
  highestPrice: number,
  averagePrice: number
): number {
  // If price is at or below lowest, perfect score
  if (currentPrice <= lowestPrice) return 100

  // If price is at or above highest, worst score
  if (currentPrice >= highestPrice) return 0

  // Score based on how close to lowest vs highest
  const range = highestPrice - lowestPrice
  const distanceFromLowest = currentPrice - lowestPrice
  const score = 100 - (distanceFromLowest / range) * 100

  // Bonus if below average
  if (currentPrice < averagePrice) {
    const belowAvgBonus = ((averagePrice - currentPrice) / averagePrice) * 10
    return Math.min(100, score + belowAvgBonus)
  }

  return Math.max(0, Math.round(score))
}

/**
 * Get deal quality label from score
 */
function getDealQuality(score: number): DealQuality {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

/**
 * Calculate price volatility (0-100)
 * Higher = more volatile
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0

  // Calculate standard deviation
  const mean = prices.reduce((a, b) => a + b) / prices.length
  const squaredDiffs = prices.map(p => Math.pow(p - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b) / prices.length
  const stdDev = Math.sqrt(variance)

  // Normalize to 0-100 scale (coefficient of variation * 100)
  const volatility = (stdDev / mean) * 100

  return Math.min(100, Math.round(volatility))
}

/**
 * Determine best time to buy
 */
function determineBestTimeToBuy(
  trend: PriceTrend,
  dealScore: number,
  pricePercentile: number
): string {
  // Excellent deal - buy now!
  if (dealScore >= 80) {
    return 'NOW - Excellent deal!'
  }

  // Rising trend - buy now before it gets more expensive
  if (trend === 'Rising') {
    if (dealScore >= 60) {
      return 'NOW - Price is rising, good deal while it lasts'
    }
    return 'Consider waiting - price is rising but not a great deal yet'
  }

  // Falling trend - wait for better price
  if (trend === 'Falling') {
    if (dealScore < 40) {
      return 'WAIT - Price is falling, better deals coming'
    }
    return 'SOON - Price is falling but already a decent deal'
  }

  // Stable trend
  if (dealScore >= 60) {
    return 'NOW - Good stable price'
  }

  if (pricePercentile > 70) {
    return 'WAIT - Price is near historical high'
  }

  return 'MONITOR - Wait for a better opportunity'
}

/**
 * Track price for external marketplace products
 */
export async function trackExternalPrice(
  productId: string,
  source: 'Amazon' | 'eBay',
  price: number,
  metadata?: any
): Promise<void> {
  await recordPriceChange(productId, price, source, metadata)
}

/**
 * Get products with best deals (lowest prices in their history)
 */
export async function getBestDeals(limit: number = 20) {
  try {
    // Get all products with price history
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 90
        }
      },
      take: 1000 // Analyze top 1000 products
    })

    const deals = []

    for (const product of products) {
      if (product.priceHistory.length < 3) continue

      const prices = product.priceHistory.map(h => h.price)
      const currentPrice = product.price
      const lowestPrice = Math.min(...prices)
      const highestPrice = Math.max(...prices)
      const averagePrice = prices.reduce((a, b) => a + b) / prices.length

      const dealScore = calculateDealScore(currentPrice, lowestPrice, highestPrice, averagePrice)

      if (dealScore >= 70) {
        deals.push({
          product,
          dealScore,
          currentPrice,
          lowestPrice,
          savings: ((lowestPrice - currentPrice) / lowestPrice) * 100
        })
      }
    }

    // Sort by deal score
    deals.sort((a, b) => b.dealScore - a.dealScore)

    return deals.slice(0, limit)
  } catch (error) {
    logger.error('❌ Failed to get best deals', {
      component: 'PriceIntelligence',
      error: error instanceof Error ? error.message : String(error)
    })
    return []
  }
}
