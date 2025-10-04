/**
 * CamelCamelCamel Scraper
 * Scrapes Amazon price history data from CamelCamelCamel
 *
 * Since CamelCamelCamel doesn't have a public API, we scrape their website
 * to get historical pricing data for Amazon products.
 *
 * Features:
 * - Price history (30/60/90 days, all time)
 * - Lowest/highest/average prices
 * - Price drop alerts
 * - Amazon, Third-party, and Warehouse deals tracking
 */

import { BaseScraper } from './BaseScraper'
import { logger } from '@/lib/logger'
import type { ScraperResult, ProductPriceData, PriceHistory } from './types'

export class CamelCamelCamelScraper extends BaseScraper {
  constructor() {
    super({
      name: 'CamelCamelCamelScraper',
      baseUrl: 'https://camelcamelcamel.com',
      rateLimit: {
        requestsPerSecond: 0.5, // 1 request every 2 seconds
        delayMs: 2000,
        maxConcurrent: 1,
      },
      retry: {
        maxAttempts: 3,
        backoffMs: 5000,
      },
      cache: {
        enabled: true,
        ttlSeconds: 6 * 60 * 60, // 6 hours cache
      },
      antiDetection: {
        randomUserAgent: true,
        randomDelay: true,
        headless: true,
      },
    })
  }

  /**
   * Scrape price history for an Amazon ASIN
   */
  async scrape(asin: string, productName?: string): Promise<ScraperResult<ProductPriceData>> {
    const cacheKey = this.getCacheKey(asin)

    try {
      const { data, cached } = await this.fetchWithCache(cacheKey, async () => {
        return await this.fetchPriceHistory(asin, productName)
      })

      return {
        success: true,
        data,
        source: this.config.name,
        timestamp: new Date(),
        cached,
      }
    } catch (error) {
      logger.error('CamelCamelCamel scraping failed', {
        component: this.config.name,
        metadata: { asin, error: error instanceof Error ? error.message : 'Unknown' },
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: this.config.name,
        timestamp: new Date(),
        cached: false,
      }
    }
  }

  /**
   * Fetch price history from CamelCamelCamel
   */
  private async fetchPriceHistory(
    asin: string,
    productName?: string
  ): Promise<ProductPriceData> {
    const url = `${this.config.baseUrl}/product/${asin}`

    logger.info('Fetching price history from CamelCamelCamel', {
      component: this.config.name,
      metadata: { asin, url },
    })

    // Use browser for JavaScript-rendered content
    const html = await this.fetchHtmlWithBrowser(url)
    const $ = this.parseHtml(html)

    // Extract product name if not provided
    if (!productName) {
      productName = $('h1.product_name').text().trim() || `Amazon Product ${asin}`
    }

    // Extract price data
    const priceData: ProductPriceData = {
      asin,
      productName,
      priceHistory: [],
      lastUpdated: new Date(),
    }

    // Parse Amazon price (new)
    const amazonPrice = this.parsePrice($('.product_pane .amazon .price_info .price').text())
    if (amazonPrice !== null) {
      priceData.currentPrice = amazonPrice
    }

    // Parse lowest/highest prices
    const lowestPriceText = $('.lowest_price .price').text()
    const lowestPrice = this.parsePrice(lowestPriceText)
    if (lowestPrice !== null) {
      priceData.lowestPrice = lowestPrice
    }

    const highestPriceText = $('.highest_price .price').text()
    const highestPrice = this.parsePrice(highestPriceText)
    if (highestPrice !== null) {
      priceData.highestPrice = highestPrice
    }

    // Calculate average (approximate from chart data if available)
    if (priceData.lowestPrice && priceData.highestPrice) {
      priceData.averagePrice = (priceData.lowestPrice + priceData.highestPrice) / 2
    }

    // Extract historical price points from chart data
    // CamelCamelCamel embeds price history in JavaScript
    const scriptContent = $('script:contains("var product_panes")').html() || ''

    const priceHistory = this.extractPriceHistoryFromScript(scriptContent, asin)
    priceData.priceHistory = priceHistory

    logger.info('Successfully scraped CamelCamelCamel data', {
      component: this.config.name,
      metadata: {
        asin,
        currentPrice: priceData.currentPrice,
        lowestPrice: priceData.lowestPrice,
        highestPrice: priceData.highestPrice,
        dataPoints: priceData.priceHistory.length,
      },
    })

    return priceData
  }

  /**
   * Extract price history from embedded JavaScript
   */
  private extractPriceHistoryFromScript(scriptContent: string, asin: string): PriceHistory[] {
    const history: PriceHistory[] = []

    try {
      // CamelCamelCamel embeds data in this format:
      // var product_panes = {"asin_B08...": {"amazon": [[timestamp, price], ...]}}

      // Extract Amazon price data
      const amazonDataMatch = scriptContent.match(/"amazon":\s*\[(.*?)\]/s)
      if (amazonDataMatch) {
        const dataPoints = amazonDataMatch[1]
          .split(/\],\s*\[/)
          .map((point) => point.replace(/[\[\]]/g, ''))

        for (const point of dataPoints) {
          const [timestamp, price] = point.split(',').map((v) => parseFloat(v.trim()))

          if (!isNaN(timestamp) && !isNaN(price) && price > 0) {
            history.push({
              date: new Date(timestamp * 1000), // Convert Unix timestamp to Date
              price,
              currency: 'USD',
              source: 'Amazon',
            })
          }
        }
      }

      // Extract third-party data if available
      const thirdPartyMatch = scriptContent.match(/"new":\s*\[(.*?)\]/s)
      if (thirdPartyMatch) {
        const dataPoints = thirdPartyMatch[1]
          .split(/\],\s*\[/)
          .map((point) => point.replace(/[\[\]]/g, ''))

        for (const point of dataPoints) {
          const [timestamp, price] = point.split(',').map((v) => parseFloat(v.trim()))

          if (!isNaN(timestamp) && !isNaN(price) && price > 0) {
            history.push({
              date: new Date(timestamp * 1000),
              price,
              currency: 'USD',
              source: 'Third-Party',
            })
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to parse price history from script', {
        component: this.config.name,
        metadata: { asin, error: error instanceof Error ? error.message : 'Unknown' },
      })
    }

    // Sort by date
    return history.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  /**
   * Parse price string to number
   */
  private parsePrice(priceText: string): number | null {
    if (!priceText) return null

    // Remove currency symbols and commas
    const cleanPrice = priceText.replace(/[$,]/g, '').trim()
    const price = parseFloat(cleanPrice)

    return isNaN(price) ? null : price
  }
}

/**
 * Helper function to scrape Amazon price history
 */
export async function getAmazonPriceHistory(
  asin: string,
  productName?: string
): Promise<ScraperResult<ProductPriceData>> {
  const scraper = new CamelCamelCamelScraper()
  try {
    return await scraper.scrape(asin, productName)
  } finally {
    await scraper.cleanup()
  }
}

/**
 * Helper function to get price statistics
 */
export async function getAmazonPriceStats(asin: string): Promise<{
  current?: number
  lowest?: number
  highest?: number
  average?: number
  savings?: number
  savingsPercent?: number
}> {
  const result = await getAmazonPriceHistory(asin)

  if (!result.success || !result.data) {
    return {}
  }

  const stats: any = {
    current: result.data.currentPrice,
    lowest: result.data.lowestPrice,
    highest: result.data.highestPrice,
    average: result.data.averagePrice,
  }

  // Calculate savings
  if (stats.current && stats.highest) {
    stats.savings = stats.highest - stats.current
    stats.savingsPercent = (stats.savings / stats.highest) * 100
  }

  return stats
}
