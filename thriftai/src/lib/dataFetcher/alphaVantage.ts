/**
 * Alpha Vantage Stock API Integration
 * FREE API (500 calls/day) - Requires free API key
 * Provides stock market data for company performance
 */

import { StockInfo, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'

const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query'

// Stock symbol mapping for common brands
const BRAND_TO_SYMBOL: Record<string, string> = {
  'Apple': 'AAPL',
  'Microsoft': 'MSFT',
  'Amazon': 'AMZN',
  'Google': 'GOOGL',
  'Meta': 'META',
  'Facebook': 'META',
  'Samsung': '005930.KS',
  'Sony': 'SONY',
  'Dell': 'DELL',
  'HP': 'HPQ',
  'Lenovo': '0992.HK',
  'Nike': 'NKE',
  'Adidas': 'ADS.DE',
}

/**
 * Get stock information by brand name
 */
export async function getStockByBrand(
  brandName: string
): Promise<DataSourceResult<StockInfo>> {
  const symbol = BRAND_TO_SYMBOL[brandName]

  if (!symbol) {
    return {
      success: false,
      error: `No stock symbol found for brand: ${brandName}`,
      source: 'ALPHA_VANTAGE',
      timestamp: new Date(),
      cached: false,
    }
  }

  return getStockInfo(symbol)
}

/**
 * Get stock information by symbol
 */
export async function getStockInfo(
  symbol: string
): Promise<DataSourceResult<StockInfo>> {
  const source = 'ALPHA_VANTAGE'
  const cacheKey = generateCacheKey(source, symbol)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.STOCK_DATA,
      async () => {
        return await withRateLimit('ALPHA_VANTAGE', async () => {
          return await fetchStockInfo(symbol)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Fetch stock data from Alpha Vantage
 */
async function fetchStockInfo(symbol: string): Promise<StockInfo> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY

  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY environment variable not set')
  }

  const params = new URLSearchParams({
    function: 'GLOBAL_QUOTE',
    symbol,
    apikey: apiKey,
  })

  const url = `${ALPHA_VANTAGE_API}?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ThriftAI-VeritasScore/1.0',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`)
  }

  const data = await response.json()

  if (data['Error Message']) {
    throw new Error(`Invalid symbol: ${symbol}`)
  }

  if (data['Note']) {
    // Rate limit message
    throw new Error('Alpha Vantage API rate limit exceeded')
  }

  const quote = data['Global Quote']

  if (!quote || Object.keys(quote).length === 0) {
    throw new Error(`No data available for symbol: ${symbol}`)
  }

  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume']),
    lastUpdate: new Date(quote['07. latest trading day']),
  }
}

/**
 * Calculate company performance score from stock data
 */
export function calculateStockPerformanceScore(stock: StockInfo): number {
  let score = 70 // Base score for publicly traded companies

  // Positive change in last trading day
  if (stock.changePercent > 0) {
    score += Math.min(15, stock.changePercent * 3)
  } else if (stock.changePercent < 0) {
    score += Math.max(-15, stock.changePercent * 3)
  }

  // High trading volume indicates strong market interest
  if (stock.volume && stock.volume > 10000000) {
    score += 10
  } else if (stock.volume && stock.volume > 1000000) {
    score += 5
  }

  // Cap between 0 and 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Get stock symbol for a brand (helper function)
 */
export function getStockSymbol(brandName: string): string | null {
  return BRAND_TO_SYMBOL[brandName] || null
}

/**
 * Check if a brand is publicly traded
 */
export function isPubliclyTraded(brandName: string): boolean {
  return brandName in BRAND_TO_SYMBOL
}
