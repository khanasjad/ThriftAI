/**
 * Price Intent Detector
 *
 * Detects price intent from user search queries and automatically expands
 * the search to include reasonable price ranges.
 *
 * Examples:
 * - "$20 shirt" → searches $15-$25 (±25% flexibility)
 * - "around $50 headphones" → searches $30-$70 (±40% flexible)
 * - "exactly $100 shoes" → searches $95-$105 (±5% strict)
 * - "under $30 jeans" → searches $0-$30 (upper bound)
 */

import { PriceIntent, SmartSearchQuery } from '@/lib/types/aiScoring96'
import { logger } from '@/lib/logger'

// ========================================
// PRICE INTENT DETECTOR SERVICE
// ========================================

export class PriceIntentDetector {
  // Price patterns to match in queries
  private pricePatterns = [
    { pattern: /\$(\d+(?:\.\d{2})?)/g, type: 'dollar' },           // $20, $20.50
    { pattern: /(\d+)\s*dollars?/gi, type: 'word_dollar' },        // 20 dollars
    { pattern: /(\d+)\s*bucks?/gi, type: 'slang' },                // 20 bucks
    { pattern: /under\s*\$?(\d+)/gi, type: 'under' },              // under $20, under 20
    { pattern: /below\s*\$?(\d+)/gi, type: 'below' },              // below 20
    { pattern: /around\s*\$?(\d+)/gi, type: 'around' },            // around $20
    { pattern: /about\s*\$?(\d+)/gi, type: 'about' },              // about 20
    { pattern: /roughly\s*\$?(\d+)/gi, type: 'roughly' },          // roughly 20
    { pattern: /approximately\s*\$?(\d+)/gi, type: 'approx' },     // approximately 20
    { pattern: /(\d+)\s*dollar\s*range/gi, type: 'range' },        // 20 dollar range
    { pattern: /between\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/gi, type: 'between' }, // between $20 and $30
    { pattern: /exactly\s*\$?(\d+)/gi, type: 'exactly' },          // exactly $20
    { pattern: /precisely\s*\$?(\d+)/gi, type: 'precisely' }       // precisely 20
  ]

  // Flexibility keywords
  private flexibilityKeywords = {
    strict: ['exactly', 'precise', 'precisely', 'specific'],
    flexible: ['around', 'about', 'roughly', 'approximately', 'roughly']
  }

  /**
   * Detect price intent from a search query
   */
  detect(query: string): PriceIntent {
    try {
      logger.info('Detecting price intent', { query })

      const matches: Array<{ price: number; type: string }> = []

      // Extract all price mentions
      for (const { pattern, type } of this.pricePatterns) {
        const found = Array.from(query.matchAll(pattern))

        for (const match of found) {
          if (type === 'between') {
            // Handle range queries specially
            const min = parseInt(match[1])
            const max = parseInt(match[2])
            if (min > 0 && max > min && max < 100000) {
              return {
                detected: true,
                targetPrice: (min + max) / 2,
                range: { min, max },
                flexibility: 'strict',
                confidence: 1.0
              }
            }
          } else {
            const price = parseInt(match[1])
            if (price > 0 && price < 100000) { // Sanity check
              matches.push({ price, type })
            }
          }
        }
      }

      // No price found
      if (matches.length === 0) {
        return {
          detected: false,
          targetPrice: 0,
          range: { min: 0, max: 999999 },
          flexibility: 'flexible',
          confidence: 0
        }
      }

      // Calculate target price (average if multiple mentions)
      const targetPrice = matches.reduce((sum, m) => sum + m.price, 0) / matches.length

      // Determine flexibility based on keywords and patterns
      const flexibility = this.determineFlexibility(query, matches)

      // Calculate price range based on flexibility
      const range = this.calculateRange(targetPrice, flexibility, matches)

      // Calculate confidence
      const confidence = this.calculateConfidence(query, matches, flexibility)

      logger.info('Price intent detected', {
        query,
        targetPrice,
        range,
        flexibility,
        confidence
      })

      return {
        detected: true,
        targetPrice,
        range,
        flexibility,
        confidence
      }
    } catch (error) {
      logger.error('Error detecting price intent', {
        query,
        error: error instanceof Error ? error.message : String(error)
      })

      // Return no price intent on error
      return {
        detected: false,
        targetPrice: 0,
        range: { min: 0, max: 999999 },
        flexibility: 'flexible',
        confidence: 0
      }
    }
  }

  /**
   * Parse complete search query into structured format
   */
  parseQuery(query: string): SmartSearchQuery {
    const priceIntent = this.detect(query)

    // Remove price-related words to get product query
    const productQuery = this.extractProductQuery(query)

    // Try to detect category intent
    const categoryIntent = this.detectCategoryIntent(query)

    // Try to detect brand intent
    const brandIntent = this.detectBrandIntent(query)

    return {
      originalQuery: query,
      productQuery,
      priceIntent,
      categoryIntent,
      brandIntent
    }
  }

  /**
   * Extract product query by removing price-related words
   */
  private extractProductQuery(query: string): string {
    let cleaned = query

    // Remove price patterns
    cleaned = cleaned.replace(/\$\d+(?:\.\d{2})?/g, '')
    cleaned = cleaned.replace(/\d+\s*dollars?/gi, '')
    cleaned = cleaned.replace(/\d+\s*bucks?/gi, '')
    cleaned = cleaned.replace(/under|below|around|about|roughly|approximately|exactly|precisely/gi, '')
    cleaned = cleaned.replace(/between\s*\$?\d+\s*(?:and|to|-)\s*\$?\d+/gi, '')
    cleaned = cleaned.replace(/\d+\s*dollar\s*range/gi, '')

    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    return cleaned || query // Fallback to original if everything was removed
  }

  /**
   * Detect category from query
   */
  private detectCategoryIntent(query: string): string | undefined {
    const categoryKeywords: Record<string, string[]> = {
      ELECTRONICS: ['phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker', 'tv', 'monitor', 'camera'],
      CLOTHING: ['shirt', 't-shirt', 'pants', 'jeans', 'dress', 'jacket', 'coat', 'sweater', 'hoodie'],
      SHOES: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'],
      ACCESSORIES: ['bag', 'purse', 'wallet', 'watch', 'sunglasses', 'jewelry', 'belt', 'hat', 'scarf'],
      HOME: ['furniture', 'lamp', 'rug', 'pillow', 'blanket', 'curtain', 'plate', 'cup', 'bowl'],
      SPORTS: ['bike', 'fitness', 'exercise', 'yoga', 'gym', 'sports', 'outdoor']
    }

    const lowerQuery = query.toLowerCase()

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return category
      }
    }

    return undefined
  }

  /**
   * Detect brands from query
   */
  private detectBrandIntent(query: string): string[] | undefined {
    const commonBrands = [
      'Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo',
      'Microsoft', 'Google', 'Amazon', 'Walmart', 'Target', 'IKEA', 'Zara', 'H&M',
      'Uniqlo', 'Gap', 'Levi', 'Calvin Klein', 'Tommy Hilfiger', 'Ralph Lauren'
    ]

    const lowerQuery = query.toLowerCase()
    const detected = commonBrands.filter(brand =>
      lowerQuery.includes(brand.toLowerCase())
    )

    return detected.length > 0 ? detected : undefined
  }

  /**
   * Determine flexibility level based on query context
   */
  private determineFlexibility(
    query: string,
    matches: Array<{ price: number; type: string }>
  ): 'strict' | 'moderate' | 'flexible' {
    const lowerQuery = query.toLowerCase()

    // Check for strict keywords
    if (this.flexibilityKeywords.strict.some(kw => lowerQuery.includes(kw))) {
      return 'strict'
    }

    // Check for flexible keywords
    if (this.flexibilityKeywords.flexible.some(kw => lowerQuery.includes(kw))) {
      return 'flexible'
    }

    // Check pattern types
    const hasUnderOrBelow = matches.some(m => m.type === 'under' || m.type === 'below')
    const hasAround = matches.some(m => m.type === 'around' || m.type === 'about')

    if (hasUnderOrBelow) return 'strict' // "under $20" is pretty specific
    if (hasAround) return 'flexible' // "around $20" has more wiggle room

    // Default to moderate
    return 'moderate'
  }

  /**
   * Calculate price range based on target price and flexibility
   */
  private calculateRange(
    targetPrice: number,
    flexibility: 'strict' | 'moderate' | 'flexible',
    matches: Array<{ price: number; type: string }>
  ): { min: number; max: number } {
    // Check for "under" or "below" patterns
    const hasUnder = matches.some(m => m.type === 'under' || m.type === 'below')
    if (hasUnder) {
      return { min: 0, max: targetPrice }
    }

    // Determine percentage range based on flexibility
    let percentage: number
    switch (flexibility) {
      case 'strict':
        percentage = 0.05 // ±5%
        break
      case 'moderate':
        percentage = 0.25 // ±25%
        break
      case 'flexible':
        percentage = 0.40 // ±40%
        break
    }

    // Calculate absolute amounts (with minimum thresholds)
    const minDelta = Math.max(5, targetPrice * percentage) // At least $5 range
    const maxDelta = Math.max(5, targetPrice * percentage)

    return {
      min: Math.max(0, Math.round(targetPrice - minDelta)),
      max: Math.round(targetPrice + maxDelta)
    }
  }

  /**
   * Calculate confidence in price detection
   */
  private calculateConfidence(
    query: string,
    matches: Array<{ price: number; type: string }>,
    flexibility: 'strict' | 'moderate' | 'flexible'
  ): number {
    let confidence = 0.5 // Base confidence

    // More matches = higher confidence (up to +0.3)
    confidence += Math.min(0.3, matches.length * 0.15)

    // Dollar sign present = higher confidence (+0.1)
    if (query.includes('$')) {
      confidence += 0.1
    }

    // Specific keywords increase confidence
    if (flexibility === 'strict') {
      confidence += 0.1
    }

    // Multiple prices reduce confidence slightly (conflicting intent)
    if (matches.length > 2) {
      confidence -= 0.1
    }

    return Math.max(0, Math.min(1.0, confidence))
  }

  /**
   * Validate price range
   */
  validateRange(range: { min: number; max: number }): boolean {
    return range.min >= 0 && range.max > range.min && range.max < 1000000
  }

  /**
   * Expand price range (for broader search)
   */
  expandRange(range: { min: number; max: number }, factor: number = 1.5): { min: number; max: number } {
    const center = (range.min + range.max) / 2
    const halfRange = (range.max - range.min) / 2
    const newHalfRange = halfRange * factor

    return {
      min: Math.max(0, Math.round(center - newHalfRange)),
      max: Math.round(center + newHalfRange)
    }
  }

  /**
   * Get price tier label for a price
   */
  getPriceTier(price: number): 'budget' | 'mid' | 'premium' | 'luxury' {
    if (price < 50) return 'budget'
    if (price < 200) return 'mid'
    if (price < 1000) return 'premium'
    return 'luxury'
  }
}

// Export singleton instance
export const priceIntentDetector = new PriceIntentDetector()

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format price range for display
 */
export function formatPriceRange(range: { min: number; max: number }): string {
  if (range.min === 0) {
    return `Under $${range.max}`
  }
  return `$${range.min} - $${range.max}`
}

/**
 * Check if product price is in range
 */
export function isPriceInRange(price: number, range: { min: number; max: number }): boolean {
  return price >= range.min && price <= range.max
}

/**
 * Calculate price proximity score (0-1)
 * Higher score = closer to target
 */
export function calculatePriceProximity(price: number, targetPrice: number, range: { min: number; max: number }): number {
  if (!isPriceInRange(price, range)) {
    return 0
  }

  const maxDistance = Math.max(targetPrice - range.min, range.max - targetPrice)
  if (maxDistance === 0) return 1

  const distance = Math.abs(price - targetPrice)
  return 1 - (distance / maxDistance)
}
