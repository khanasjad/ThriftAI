/**
 * Target Scraper
 * Scrapes product data from Target.com (RedSky API alternative)
 *
 * Target doesn't offer a public API, so we scrape their website
 * to get product information, pricing, and availability.
 */

import { BaseScraper } from './BaseScraper'
import { logger } from '@/lib/logger'
import type { ScraperResult, MarketplaceProduct } from './types'

export class TargetScraper extends BaseScraper {
  constructor() {
    super({
      name: 'TargetScraper',
      baseUrl: 'https://www.target.com',
      rateLimit: {
        requestsPerSecond: 0.25, // 1 request every 4 seconds (conservative)
        delayMs: 4000,
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
   * Scrape product data
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
      logger.error('Target scraping failed', {
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
    const url = `${this.config.baseUrl}/p/-/A-${productId}`

    logger.info('Scraping Target product', {
      component: this.config.name,
      metadata: { productId, url },
    })

    const html = await this.fetchHtmlWithBrowser(url)
    const $ = this.parseHtml(html)

    const product: MarketplaceProduct = {
      id: productId,
      name: $('h1[data-test="product-title"]').text().trim() || $('h1').first().text().trim(),
      price: this.extractPrice($),
      currency: 'USD',
      availability: this.checkAvailability($),
      rating: this.extractRating($),
      reviewCount: this.extractReviewCount($),
      imageUrl: $('img[data-test="product-image"]').attr('src') || $('picture img').first().attr('src'),
      productUrl: url,
      brand: $('[data-test="product-brand"]').text().trim(),
      specifications: this.extractSpecifications($),
    }

    logger.info('Successfully scraped Target product', {
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
    const url = `${this.config.baseUrl}/s?searchTerm=${encodeURIComponent(query)}`

    logger.info('Scraping Target search results', {
      component: this.config.name,
      metadata: { query, url },
    })

    const html = await this.fetchHtmlWithBrowser(url)
    const $ = this.parseHtml(html)

    const products: MarketplaceProduct[] = []

    // Extract product cards
    $('[data-test="product-grid"] [data-test*="@web/ProductCard"]').each((_, el) => {
      const $el = $(el)

      // Extract product ID from link
      const productLink = $el.find('a[href*="/p/"]').attr('href') || ''
      const idMatch = productLink.match(/A-(\d+)/)
      if (!idMatch) return

      const productId = idMatch[1]
      const name = $el.find('a[data-test="product-title"]').text().trim()
      const priceText = $el.find('[data-test="current-price"]').text().trim()

      if (!productId || !name) return

      const product: MarketplaceProduct = {
        id: productId,
        name,
        price: this.parsePrice(priceText),
        currency: 'USD',
        availability: true, // Assume available in search results
        imageUrl: $el.find('img').first().attr('src'),
        productUrl: `${this.config.baseUrl}${productLink}`,
        specifications: {},
      }

      // Extract rating
      const ratingText = $el.find('[data-test="ratings"]').text()
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/)
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

    logger.info('Successfully scraped Target search results', {
      component: this.config.name,
      metadata: { query, productCount: products.length },
    })

    return products
  }

  /**
   * Extract price from page
   */
  private extractPrice($: cheerio.CheerioAPI): number {
    const priceText =
      $('[data-test="product-price"]').text() ||
      $('[data-test="current-price"]').text() ||
      $('.h-text-red').first().text()

    return this.parsePrice(priceText)
  }

  /**
   * Check product availability
   */
  private checkAvailability($: cheerio.CheerioAPI): boolean {
    const availText = $('[data-test="availability"]').text().toLowerCase()
    return !availText.includes('out of stock') && !availText.includes('unavailable')
  }

  /**
   * Extract rating
   */
  private extractRating($: cheerio.CheerioAPI): number | undefined {
    const ratingText = $('[data-test="ratings"]').text() || $('[data-test="rating"]').attr('aria-label')
    const match = ratingText?.match(/(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : undefined
  }

  /**
   * Extract review count
   */
  private extractReviewCount($: cheerio.CheerioAPI): number | undefined {
    const reviewText = $('[data-test="ratings"]').text()
    const match = reviewText?.match(/\((\d+)\)/)
    return match ? parseInt(match[1]) : undefined
  }

  /**
   * Extract product specifications
   */
  private extractSpecifications($: cheerio.CheerioAPI): Record<string, string> {
    const specs: Record<string, string> = {}

    $('[data-test="item-details-specifications"] dl').each((_, dl) => {
      $(dl)
        .find('dt')
        .each((i, dt) => {
          const label = $(dt).text().trim()
          const value = $(dl).find('dd').eq(i).text().trim()
          if (label && value) {
            specs[label] = value
          }
        })
    })

    return specs
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
 * Helper function to search Target products
 */
export async function searchTargetProducts(query: string): Promise<ScraperResult<MarketplaceProduct[]>> {
  const scraper = new TargetScraper()
  try {
    return await scraper.scrape(query, false)
  } finally {
    await scraper.cleanup()
  }
}

/**
 * Helper function to get Target product details
 */
export async function getTargetProduct(productId: string): Promise<MarketplaceProduct | null> {
  const scraper = new TargetScraper()
  try {
    const result = await scraper.scrape(productId, true)
    return result.success && result.data && result.data.length > 0 ? result.data[0] : null
  } finally {
    await scraper.cleanup()
  }
}
