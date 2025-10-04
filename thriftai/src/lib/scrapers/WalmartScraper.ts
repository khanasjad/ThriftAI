/**
 * Walmart Scraper
 * Scrapes product data from Walmart.com
 *
 * Since Walmart doesn't have a public API, we scrape their website
 * to get product information, pricing, ratings, and specifications.
 */

import { BaseScraper } from './BaseScraper'
import { logger } from '@/lib/logger'
import type { ScraperResult, MarketplaceProduct } from './types'

export class WalmartScraper extends BaseScraper {
  constructor() {
    super({
      name: 'WalmartScraper',
      baseUrl: 'https://www.walmart.com',
      rateLimit: {
        requestsPerSecond: 0.33, // 1 request every 3 seconds
        delayMs: 3000,
        maxConcurrent: 1,
      },
      retry: {
        maxAttempts: 3,
        backoffMs: 5000,
      },
      cache: {
        enabled: true,
        ttlSeconds: 24 * 60 * 60, // 24 hours cache
      },
      antiDetection: {
        randomUserAgent: true,
        randomDelay: true,
        headless: true,
      },
    })
  }

  /**
   * Scrape product data by product ID or search query
   */
  async scrape(query: string, isProductId: boolean = false): Promise<ScraperResult<MarketplaceProduct[]>> {
    const cacheKey = this.getCacheKey(isProductId ? 'product' : 'search', query)

    try {
      const { data, cached } = await this.fetchWithCache(cacheKey, async () => {
        if (isProductId) {
          const product = await this.scrapeProduct(query)
          return product ? [product] : []
        } else {
          return await this.scrapeSearch(query)
        }
      })

      return {
        success: true,
        data,
        source: this.config.name,
        timestamp: new Date(),
        cached,
      }
    } catch (error) {
      logger.error('Walmart scraping failed', {
        component: this.config.name,
        metadata: { query, error: error instanceof Error ? error.message : 'Unknown' },
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
   * Scrape single product page
   */
  private async scrapeProduct(productId: string): Promise<MarketplaceProduct | null> {
    const url = `${this.config.baseUrl}/ip/${productId}`

    logger.info('Scraping Walmart product', {
      component: this.config.name,
      metadata: { productId, url },
    })

    const html = await this.fetchHtmlWithBrowser(url)
    const $ = this.parseHtml(html)

    // Extract product data
    const product: MarketplaceProduct = {
      id: productId,
      name: $('h1[itemprop="name"]').text().trim() || $('h1').first().text().trim(),
      price: this.parsePrice($('[itemprop="price"]').attr('content') || $('.price-characteristic').first().text()),
      currency: 'USD',
      availability: $('[itemprop="availability"]').attr('content') !== 'OutOfStock',
      rating: parseFloat($('[itemprop="ratingValue"]').attr('content') || '0'),
      reviewCount: parseInt($('[itemprop="reviewCount"]').attr('content') || '0'),
      imageUrl: $('[itemprop="image"]').attr('src') || $('img[data-testid="product-image"]').attr('src'),
      productUrl: url,
      specifications: {},
    }

    // Extract brand
    product.brand = $('[itemprop="brand"]').attr('content') || $('a[href*="/brand/"]').first().text().trim()

    // Extract specifications
    $('.specification-list .specification-item').each((_, el) => {
      const label = $(el).find('.specification-label').text().trim()
      const value = $(el).find('.specification-value').text().trim()
      if (label && value) {
        product.specifications![label] = value
      }
    })

    logger.info('Successfully scraped Walmart product', {
      component: this.config.name,
      metadata: {
        productId,
        name: product.name,
        price: product.price,
        availability: product.availability,
      },
    })

    return product
  }

  /**
   * Scrape search results
   */
  private async scrapeSearch(query: string): Promise<MarketplaceProduct[]> {
    const url = `${this.config.baseUrl}/search?q=${encodeURIComponent(query)}`

    logger.info('Scraping Walmart search results', {
      component: this.config.name,
      metadata: { query, url },
    })

    const html = await this.fetchHtmlWithBrowser(url)
    const $ = this.parseHtml(html)

    const products: MarketplaceProduct[] = []

    // Extract product cards
    $('[data-testid="list-view"] [data-item-id]').each((_, el) => {
      const $el = $(el)

      const productId = $el.attr('data-item-id') || ''
      const name = $el.find('[data-automation-id="product-title"]').text().trim()
      const priceText = $el.find('.price-characteristic').first().text().trim()

      if (!productId || !name) return

      const product: MarketplaceProduct = {
        id: productId,
        name,
        price: this.parsePrice(priceText),
        currency: 'USD',
        availability: true, // Assume available in search results
        imageUrl: $el.find('img').first().attr('src'),
        productUrl: `${this.config.baseUrl}/ip/${productId}`,
        specifications: {},
      }

      // Extract rating
      const ratingText = $el.find('[data-testid="product-ratings"]').text()
      const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*out of/)
      if (ratingMatch) {
        product.rating = parseFloat(ratingMatch[1])
      }

      // Extract review count
      const reviewMatch = ratingText.match(/\((\d+)\)/)
      if (reviewMatch) {
        product.reviewCount = parseInt(reviewMatch[1])
      }

      products.push(product)
    })

    logger.info('Successfully scraped Walmart search results', {
      component: this.config.name,
      metadata: { query, productCount: products.length },
    })

    return products
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string | undefined): number {
    if (!priceText) return 0

    const cleanPrice = priceText.replace(/[$,]/g, '').trim()
    const price = parseFloat(cleanPrice)

    return isNaN(price) ? 0 : price
  }
}

/**
 * Helper function to search Walmart products
 */
export async function searchWalmartProducts(query: string): Promise<ScraperResult<MarketplaceProduct[]>> {
  const scraper = new WalmartScraper()
  try {
    return await scraper.scrape(query, false)
  } finally {
    await scraper.cleanup()
  }
}

/**
 * Helper function to get Walmart product details
 */
export async function getWalmartProduct(productId: string): Promise<MarketplaceProduct | null> {
  const scraper = new WalmartScraper()
  try {
    const result = await scraper.scrape(productId, true)
    return result.success && result.data && result.data.length > 0 ? result.data[0] : null
  } finally {
    await scraper.cleanup()
  }
}
