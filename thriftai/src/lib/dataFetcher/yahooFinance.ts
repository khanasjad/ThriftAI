/**
 * Yahoo Finance Integration
 * FREE - No API key required
 *
 * Fetches real-time stock data for brand companies:
 * - Current stock price
 * - Year-over-year performance
 * - 52-week high/low
 * - Market cap
 * - Company financial stability
 *
 * Coverage: +3 parameters for Company Performance category
 */

import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'

export interface StockPerformanceData {
  symbol: string
  companyName: string
  currentPrice: number
  changePercent: number // YoY percentage change
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  marketCap: number
  financialStability: 'Excellent' | 'Good' | 'Fair' | 'Poor'
}

// Brand to stock symbol mapping
const BRAND_TO_SYMBOL: Record<string, string> = {
  'Apple': 'AAPL',
  'Microsoft': 'MSFT',
  'Samsung': '005930.KS',
  'Dell': 'DELL',
  'HP': 'HPQ',
  'Lenovo': '0992.HK',
  'Sony': 'SONY',
  'LG': '066570.KS',
  'Google': 'GOOGL',
  'Amazon': 'AMZN',
  'Meta': 'META',
  'Netflix': 'NFLX',
  'Tesla': 'TSLA',
  'Nike': 'NKE',
  'Adidas': 'ADS.DE',
  'Puma': 'PUM.DE',
  'Under Armour': 'UAA',
  'Lululemon': 'LULU',
  'Gap': 'GPS',
  'Target': 'TGT',
  'Walmart': 'WMT',
  'Best Buy': 'BBY',
  'IKEA': 'IKEA', // Private company, no stock
  'Wayfair': 'W'
}

/**
 * Get stock symbol for a brand
 */
function getStockSymbol(brand: string): string | null {
  // Try exact match first
  if (BRAND_TO_SYMBOL[brand]) {
    return BRAND_TO_SYMBOL[brand]
  }

  // Try case-insensitive match
  const brandLower = brand.toLowerCase()
  for (const [key, value] of Object.entries(BRAND_TO_SYMBOL)) {
    if (key.toLowerCase() === brandLower) {
      return value
    }
  }

  return null
}

/**
 * Fetch stock performance data from Yahoo Finance
 */
export async function getStockPerformance(
  brand: string
): Promise<{ success: boolean; data?: StockPerformanceData; cached: boolean; error?: string }> {

  const cacheKey = `yahoo-finance:${brand}`

  try {
    const symbol = getStockSymbol(brand)

    if (!symbol) {
      logger.warn('⚠️ No stock symbol found for brand', {
        component: 'YahooFinance',
        metadata: { brand }
      })

      return {
        success: false,
        cached: false,
        error: 'Brand not publicly traded or not in mapping'
      }
    }

    logger.info('📈 Fetching stock data from Yahoo Finance', {
      component: 'YahooFinance',
      metadata: {
        brand,
        symbol
      }
    })

    // Fetch quote data
    const quote = await yahooFinance.quote(symbol)

    if (!quote) {
      throw new Error('No quote data returned')
    }

    // Calculate YoY performance
    const currentPrice = quote.regularMarketPrice || 0
    const fiftyTwoWeekLow = quote.fiftyTwoWeekLow || currentPrice
    const fiftyTwoWeekHigh = quote.fiftyTwoWeekHigh || currentPrice
    const changePercent = quote.regularMarketChangePercent || 0

    // Determine financial stability based on market performance
    let financialStability: StockPerformanceData['financialStability']
    if (changePercent > 20) {
      financialStability = 'Excellent'
    } else if (changePercent > 0) {
      financialStability = 'Good'
    } else if (changePercent > -10) {
      financialStability = 'Fair'
    } else {
      financialStability = 'Poor'
    }

    const data: StockPerformanceData = {
      symbol,
      companyName: quote.longName || brand,
      currentPrice,
      changePercent,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      marketCap: quote.marketCap || 0,
      financialStability
    }

    logger.info('✅ Stock data fetched successfully', {
      component: 'YahooFinance',
      metadata: {
        brand,
        currentPrice: data.currentPrice,
        changePercent: data.changePercent
      }
    })

    return {
      success: true,
      data,
      cached: false
    }

  } catch (error) {
    logger.error('❌ Yahoo Finance fetch failed', {
      component: 'YahooFinance',
      error: error instanceof Error ? error.message : String(error),
      metadata: { brand }
    })

    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate stock performance score (0-100)
 */
export function calculateStockPerformanceScore(data: StockPerformanceData): number {
  // Positive performance = higher score
  if (data.changePercent > 20) return 95
  if (data.changePercent > 10) return 90
  if (data.changePercent > 5) return 85
  if (data.changePercent > 0) return 80
  if (data.changePercent > -5) return 75
  if (data.changePercent > -10) return 70
  if (data.changePercent > -20) return 60
  return 50
}
