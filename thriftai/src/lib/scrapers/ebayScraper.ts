/**
 * eBay Sold Listings Scraper
 * FREE - No API key required
 *
 * Scrapes eBay sold/completed listings to get:
 * - Average competitor price
 * - Competitor count
 * - Lowest price
 * - Highest price
 * - Price stability score
 * - Whether current price is best in market
 *
 * Coverage: +6 parameters for Market Value category
 */

import puppeteer from 'puppeteer'
import { logger } from '@/lib/logger'

export interface EbayPriceData {
  averagePrice: number
  competitorCount: number
  lowestPrice: number
  highestPrice: number
  priceStabilityScore: number // 0-100, lower variance = higher score
  isBestPrice: boolean
  prices: number[]
}

export interface EbayScraperOptions {
  productName: string
  currentPrice?: number
  maxResults?: number
}

/**
 * Scrape eBay sold listings to get competitor pricing data
 */
export async function scrapeEbayPrices(
  options: EbayScraperOptions
): Promise<{ success: boolean; data?: EbayPriceData; cached: boolean; error?: string }> {

  const cacheKey = `ebay-prices:${options.productName}`
  const maxResults = options.maxResults || 20

  try {
    logger.info('🛒 Scraping eBay sold listings', {
      component: 'EbayScraper',
      metadata: {
        product: options.productName,
        maxResults
      }
    })

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    // Build eBay sold items search URL
    const searchQuery = encodeURIComponent(options.productName)
    const url = `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&LH_Sold=1&LH_Complete=1&_sop=13`

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Extract prices from sold listings
    const prices = await page.$$eval('.s-item__price', elements =>
      elements
        .map(el => {
          const text = el.textContent?.trim() || ''
          // Handle "to" ranges like "$10.00 to $20.00"
          if (text.includes(' to ')) {
            const parts = text.split(' to ')
            const price = parseFloat(parts[0].replace(/[^0-9.]/g, ''))
            return isNaN(price) ? null : price
          }
          const price = parseFloat(text.replace(/[^0-9.]/g, ''))
          return isNaN(price) ? null : price
        })
        .filter((p): p is number => p !== null && p > 0)
        .slice(0, maxResults) // Limit results
    )

    await browser.close()

    if (prices.length === 0) {
      logger.warn('⚠️ No eBay prices found', {
        component: 'EbayScraper',
        metadata: { product: options.productName }
      })

      return {
        success: false,
        cached: false,
        error: 'No sold listings found'
      }
    }

    // Calculate statistics
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const lowestPrice = Math.min(...prices)
    const highestPrice = Math.max(...prices)

    // Calculate price variance for stability score
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - averagePrice, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = (stdDev / averagePrice) * 100
    const priceStabilityScore = Math.max(0, Math.min(100, 100 - coefficientOfVariation))

    // Check if current price is best
    const isBestPrice = options.currentPrice ? options.currentPrice <= lowestPrice : false

    const data: EbayPriceData = {
      averagePrice: Math.round(averagePrice * 100) / 100,
      competitorCount: prices.length,
      lowestPrice: Math.round(lowestPrice * 100) / 100,
      highestPrice: Math.round(highestPrice * 100) / 100,
      priceStabilityScore: Math.round(priceStabilityScore),
      isBestPrice,
      prices
    }

    logger.info('✅ eBay scraping completed', {
      component: 'EbayScraper',
      metadata: {
        product: options.productName,
        averagePrice: data.averagePrice,
        competitorCount: data.competitorCount
      }
    })

    return {
      success: true,
      data,
      cached: false
    }

  } catch (error) {
    logger.error('❌ eBay scraping failed', {
      component: 'EbayScraper',
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        product: options.productName
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
 * Get fallback price data if scraping fails
 */
export function getFallbackPriceData(currentPrice?: number): EbayPriceData {
  const basePrice = currentPrice || 100

  return {
    averagePrice: basePrice * 1.1, // Assume 10% above current price
    competitorCount: 0,
    lowestPrice: basePrice * 0.9,
    highestPrice: basePrice * 1.3,
    priceStabilityScore: 70, // Default moderate stability
    isBestPrice: false,
    prices: []
  }
}
