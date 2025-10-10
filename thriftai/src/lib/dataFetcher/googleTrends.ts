/**
 * Google Trends Integration
 * FREE - No API key required
 *
 * Tracks product demand and market dynamics:
 * - Interest over time (demand trend)
 * - Seasonal patterns
 * - Market demand score (0-100)
 * - Supply level estimation
 *
 * Coverage: +3 parameters for Market Value category
 */

import googleTrends from 'google-trends-api'
import { logger } from '@/lib/logger'

export interface TrendsData {
  keyword: string
  averageInterest: number // 0-100
  demandScore: number // 0-100
  trend: 'Rising' | 'Stable' | 'Falling'
  seasonalPattern: 'Peak' | 'Normal' | 'Off-Season'
  supplyLevel: 'Scarce' | 'Limited' | 'Normal' | 'Abundant'
  interestOverTime: Array<{ time: string; value: number }>
}

export interface TrendsOptions {
  keyword: string
  category?: number
  timeRange?: string // e.g., 'today 3-m', 'today 12-m'
}

/**
 * Get Google Trends data for a product
 */
export async function getProductTrends(
  options: TrendsOptions
): Promise<{ success: boolean; data?: TrendsData; cached: boolean; error?: string }> {

  const cacheKey = `google-trends:${options.keyword}`

  try {
    logger.info('📈 Fetching Google Trends data', {
      component: 'GoogleTrends',
      metadata: {
        keyword: options.keyword,
        timeRange: options.timeRange || 'today 3-m'
      }
    })

    // Fetch interest over time
    const result = await googleTrends.interestOverTime({
      keyword: options.keyword,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      category: options.category || 0,
    })

    const parsedResult = JSON.parse(result)
    const timelineData = parsedResult.default?.timelineData || []

    if (timelineData.length === 0) {
      throw new Error('No trends data available')
    }

    // Extract interest values
    const interestValues = timelineData.map((item: any) => ({
      time: item.formattedTime,
      value: item.value?.[0] || 0
    }))

    // Calculate average interest
    const values = interestValues.map((item: any) => item.value)
    const averageInterest = values.reduce((sum: number, val: number) => sum + val, 0) / values.length

    // Determine trend (compare first half to second half)
    const midpoint = Math.floor(values.length / 2)
    const firstHalfAvg = values.slice(0, midpoint).reduce((sum: number, val: number) => sum + val, 0) / midpoint
    const secondHalfAvg = values.slice(midpoint).reduce((sum: number, val: number) => sum + val, 0) / (values.length - midpoint)

    let trend: TrendsData['trend']
    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

    if (changePercent > 10) {
      trend = 'Rising'
    } else if (changePercent < -10) {
      trend = 'Falling'
    } else {
      trend = 'Stable'
    }

    // Determine seasonal pattern (look for peaks)
    const maxValue = Math.max(...values)
    const currentValue = values[values.length - 1]
    const isNearPeak = currentValue > maxValue * 0.8

    let seasonalPattern: TrendsData['seasonalPattern']
    if (isNearPeak) {
      seasonalPattern = 'Peak'
    } else if (currentValue < maxValue * 0.5) {
      seasonalPattern = 'Off-Season'
    } else {
      seasonalPattern = 'Normal'
    }

    // Calculate demand score (0-100 based on average interest and trend)
    let demandScore = averageInterest

    // Boost for rising trend
    if (trend === 'Rising') {
      demandScore = Math.min(100, demandScore * 1.2)
    } else if (trend === 'Falling') {
      demandScore = demandScore * 0.8
    }

    // Estimate supply level (inverse of demand)
    let supplyLevel: TrendsData['supplyLevel']
    if (demandScore > 80) {
      supplyLevel = 'Scarce' // High demand = low supply
    } else if (demandScore > 60) {
      supplyLevel = 'Limited'
    } else if (demandScore > 40) {
      supplyLevel = 'Normal'
    } else {
      supplyLevel = 'Abundant' // Low demand = high supply
    }

    const data: TrendsData = {
      keyword: options.keyword,
      averageInterest: Math.round(averageInterest),
      demandScore: Math.round(demandScore),
      trend,
      seasonalPattern,
      supplyLevel,
      interestOverTime: interestValues
    }

    logger.info('✅ Google Trends data fetched', {
      component: 'GoogleTrends',
      metadata: {
        keyword: options.keyword,
        demandScore: data.demandScore,
        trend: data.trend
      }
    })

    return {
      success: true,
      data,
      cached: false
    }

  } catch (error) {
    logger.error('❌ Google Trends fetch failed', {
      component: 'GoogleTrends',
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        keyword: options.keyword
      }
    })

    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get fallback trends data
 */
export function getFallbackTrends(keyword: string): TrendsData {
  return {
    keyword,
    averageInterest: 50,
    demandScore: 50,
    trend: 'Stable',
    seasonalPattern: 'Normal',
    supplyLevel: 'Normal',
    interestOverTime: []
  }
}

/**
 * Calculate market dynamics score based on trends
 */
export function calculateMarketDynamicsScore(data: TrendsData): number {
  let score = data.demandScore

  // Adjust for trend
  if (data.trend === 'Rising') {
    score += 10
  } else if (data.trend === 'Falling') {
    score -= 10
  }

  // Adjust for seasonality
  if (data.seasonalPattern === 'Peak') {
    score += 5
  } else if (data.seasonalPattern === 'Off-Season') {
    score -= 5
  }

  return Math.max(0, Math.min(100, score))
}
