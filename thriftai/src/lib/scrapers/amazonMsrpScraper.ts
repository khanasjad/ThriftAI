/**
 * Amazon MSRP Scraper
 * FREE - Web scraping with Cheerio
 *
 * Extracts manufacturer suggested retail price from Amazon:
 * - MSRP/List price
 * - Current Amazon price
 * - Discount percentage
 * - Price positioning vs retail
 *
 * Coverage: +4 parameters for Market Value (Price Positioning)
 */

import * as cheerio from 'cheerio'
import { logger } from '@/lib/logger'
import { waitForRateLimit } from '@/lib/utils/rateLimiter'

export interface AmazonPriceData {
  productTitle: string
  asin?: string
  msrp: number | null // List price / MSRP
  currentPrice: number | null // Current Amazon price
  discountPercent: number // % off MSRP
  pricePositioning: 'Premium' | 'Market Rate' | 'Value' | 'Budget'
  isPrimeEligible: boolean
  availability: string
  dealType?: 'Lightning Deal' | 'Limited Time Deal' | 'Regular Price'
  scrapedAt: Date
}

export interface AmazonScraperOptions {
  productName: string
  brand?: string
  category?: string
  maxResults?: number
}

/**
 * Search Amazon and extract MSRP data
 */
export async function scrapeAmazonMSRP(
  options: AmazonScraperOptions
): Promise<{ success: boolean; data?: AmazonPriceData; cached: boolean; error?: string }> {

  const cacheKey = `amazon-msrp:${options.productName}`

  try {
    logger.info('🛒 Scraping Amazon for MSRP data', {
      component: 'AmazonScraper',
      metadata: {
        product: options.productName
      }
    })

    // Build search query
    const searchQuery = buildSearchQuery(options)
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`

    // Fetch search results with rate limiting
    await waitForRateLimit('amazon')
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    })

    if (!response.ok) {
      throw new Error(`Amazon returned ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Find first relevant product
    const firstProduct = $('[data-component-type="s-search-result"]').first()

    if (firstProduct.length === 0) {
      logger.warn('⚠️  No products found on Amazon', {
        component: 'AmazonScraper',
        metadata: { query: searchQuery }
      })

      return {
        success: false,
        cached: false,
        error: 'No products found'
      }
    }

    // Extract product data
    const data = extractProductData($, firstProduct)

    logger.info('✅ Amazon MSRP data scraped', {
      component: 'AmazonScraper',
      metadata: {
        product: data.productTitle,
        msrp: data.msrp,
        currentPrice: data.currentPrice,
        discountPercent: data.discountPercent
      }
    })

    return {
      success: true,
      data,
      cached: false
    }

  } catch (error) {
    logger.error('❌ Amazon MSRP scraping failed', {
      component: 'AmazonScraper',
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Build optimized Amazon search query
 */
function buildSearchQuery(options: AmazonScraperOptions): string {
  const parts: string[] = []

  if (options.brand) {
    parts.push(options.brand)
  }

  parts.push(options.productName)

  // Remove common used/refurb terms for MSRP search
  const query = parts.join(' ')
    .replace(/\b(used|refurbished|renewed|open box|pre-owned)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return query
}

/**
 * Extract product data from Amazon search result
 */
function extractProductData(
  $: cheerio.CheerioAPI,
  productElement: cheerio.Cheerio<cheerio.Element>
): AmazonPriceData {

  // Extract ASIN
  const asin = productElement.attr('data-asin')

  // Extract title
  const titleElement = productElement.find('h2 a span')
  const productTitle = titleElement.text().trim()

  // Extract prices
  let msrp: number | null = null
  let currentPrice: number | null = null

  // Try to find list price (crossed out price)
  const listPriceText = productElement.find('.a-price.a-text-price span.a-offscreen').first().text()
  if (listPriceText) {
    msrp = parsePrice(listPriceText)
  }

  // Try to find current price
  const currentPriceText = productElement.find('.a-price:not(.a-text-price) span.a-offscreen').first().text()
  if (currentPriceText) {
    currentPrice = parsePrice(currentPriceText)
  }

  // If no list price found, current price becomes MSRP
  if (!msrp && currentPrice) {
    msrp = currentPrice
  }

  // Calculate discount
  let discountPercent = 0
  if (msrp && currentPrice && msrp > currentPrice) {
    discountPercent = ((msrp - currentPrice) / msrp) * 100
  }

  // Determine price positioning
  const pricePositioning = determinePricePositioning(msrp, discountPercent)

  // Check Prime eligibility
  const isPrimeEligible = productElement.find('[aria-label*="Prime"]').length > 0

  // Check availability
  let availability = 'In Stock'
  const availabilityText = productElement.find('.a-color-success, .a-color-price').text()
  if (availabilityText.includes('Currently unavailable')) {
    availability = 'Out of Stock'
  } else if (availabilityText.includes('Only') && availabilityText.includes('left')) {
    availability = 'Limited Stock'
  }

  // Check for deals
  let dealType: AmazonPriceData['dealType'] = 'Regular Price'
  if (productElement.find('[data-deal-type="LIGHTNING_DEAL"]').length > 0) {
    dealType = 'Lightning Deal'
  } else if (productElement.find('.a-badge-label:contains("Limited")').length > 0) {
    dealType = 'Limited Time Deal'
  }

  return {
    productTitle,
    asin,
    msrp,
    currentPrice,
    discountPercent: Math.round(discountPercent * 10) / 10,
    pricePositioning,
    isPrimeEligible,
    availability,
    dealType,
    scrapedAt: new Date()
  }
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null

  // Remove currency symbols and extract number
  const match = priceStr.match(/[\d,]+\.?\d*/);
  if (!match) return null

  const cleanPrice = match[0].replace(/,/g, '')
  const price = parseFloat(cleanPrice)

  return isNaN(price) ? null : price
}

/**
 * Determine price positioning based on MSRP and discount
 */
function determinePricePositioning(
  msrp: number | null,
  discountPercent: number
): AmazonPriceData['pricePositioning'] {

  if (!msrp) return 'Market Rate'

  // High MSRP products
  if (msrp >= 500) {
    if (discountPercent < 10) return 'Premium'
    if (discountPercent < 25) return 'Market Rate'
    if (discountPercent < 40) return 'Value'
    return 'Budget'
  }

  // Mid-range MSRP
  if (msrp >= 100) {
    if (discountPercent < 15) return 'Premium'
    if (discountPercent < 30) return 'Market Rate'
    if (discountPercent < 50) return 'Value'
    return 'Budget'
  }

  // Low MSRP products
  if (discountPercent < 20) return 'Premium'
  if (discountPercent < 35) return 'Market Rate'
  if (discountPercent < 55) return 'Value'
  return 'Budget'
}

/**
 * Get fallback MSRP data (estimate based on category)
 */
export function getFallbackMSRP(
  productName: string,
  currentPrice: number,
  category?: string
): AmazonPriceData {

  // Estimate MSRP based on category depreciation rates
  const categoryDepreciation: Record<string, number> = {
    'ELECTRONICS': 0.30,  // Electronics lose 30% value
    'FASHION': 0.50,      // Fashion loses 50% value
    'FURNITURE': 0.40,    // Furniture loses 40% value
    'COLLECTIBLES': -0.20, // Collectibles gain 20% value
    'BOOKS': 0.60,        // Books lose 60% value
    'SPORTS': 0.35        // Sports equipment loses 35%
  }

  const depreciation = categoryDepreciation[category?.toUpperCase() || 'DEFAULT'] || 0.35
  const estimatedMSRP = currentPrice / (1 - depreciation)

  const discountPercent = ((estimatedMSRP - currentPrice) / estimatedMSRP) * 100

  return {
    productTitle: productName,
    msrp: Math.round(estimatedMSRP * 100) / 100,
    currentPrice: Math.round(currentPrice * 100) / 100,
    discountPercent: Math.round(discountPercent),
    pricePositioning: determinePricePositioning(estimatedMSRP, discountPercent),
    isPrimeEligible: false,
    availability: 'Unknown',
    scrapedAt: new Date()
  }
}

/**
 * Calculate price positioning score (0-100)
 */
export function calculatePricePositioningScore(data: AmazonPriceData): number {
  let score = 50 // Base score

  // Discount bonus (0-30 points)
  if (data.discountPercent > 0) {
    score += Math.min(30, (data.discountPercent / 60) * 30)
  }

  // Price positioning bonus (0-20 points)
  const positioningBonus = {
    'Budget': 20,
    'Value': 15,
    'Market Rate': 10,
    'Premium': 5
  }
  score += positioningBonus[data.pricePositioning]

  // Prime eligibility (0-10 points)
  if (data.isPrimeEligible) {
    score += 10
  }

  // Deal type bonus (0-10 points)
  if (data.dealType === 'Lightning Deal') score += 10
  else if (data.dealType === 'Limited Time Deal') score += 5

  // Availability penalty
  if (data.availability === 'Out of Stock') score -= 20
  else if (data.availability === 'Limited Stock') score -= 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Compare product price to Amazon MSRP
 */
export function comparePriceToMSRP(
  productPrice: number,
  msrpData: AmazonPriceData
): {
  vsAmazon: number // Price difference vs current Amazon price
  vsMSRP: number // Price difference vs MSRP
  valueScore: number // 0-100 value score
  recommendation: string
} {

  const vsAmazon = msrpData.currentPrice
    ? ((productPrice - msrpData.currentPrice) / msrpData.currentPrice) * 100
    : 0

  const vsMSRP = msrpData.msrp
    ? ((productPrice - msrpData.msrp) / msrpData.msrp) * 100
    : 0

  // Calculate value score
  let valueScore = 50

  // Bonus for beating Amazon price
  if (vsAmazon < 0) {
    valueScore += Math.min(30, Math.abs(vsAmazon) * 2)
  } else {
    valueScore -= Math.min(30, vsAmazon)
  }

  // Bonus for deep discount vs MSRP
  if (vsMSRP < -20) {
    valueScore += Math.min(20, Math.abs(vsMSRP + 20))
  }

  valueScore = Math.max(0, Math.min(100, valueScore))

  // Generate recommendation
  let recommendation: string
  if (vsAmazon < -10) {
    recommendation = 'Excellent Deal - Cheaper than Amazon!'
  } else if (vsAmazon < 0) {
    recommendation = 'Good Value - Beats Amazon price'
  } else if (vsAmazon < 10) {
    recommendation = 'Competitive - Similar to Amazon'
  } else if (vsAmazon < 25) {
    recommendation = 'Fair - Slightly above Amazon'
  } else {
    recommendation = 'Overpriced - Much higher than Amazon'
  }

  return {
    vsAmazon: Math.round(vsAmazon * 10) / 10,
    vsMSRP: Math.round(vsMSRP * 10) / 10,
    valueScore: Math.round(valueScore),
    recommendation
  }
}
