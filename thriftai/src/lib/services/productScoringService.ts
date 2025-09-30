import { AggregatedProduct } from './marketplaceAggregator'

export interface ScoreBreakdown {
  relevance: number       // 0-40 (MOST IMPORTANT - does it match the search?)
  price: number           // 0-25
  brand: number           // 0-15
  condition: number       // 0-10
  rating: number          // 0-5
  shipping: number        // 0-5
  availability: number    // -10 to +5
}

export interface ProductScore {
  total: number              // 0-100
  breakdown: ScoreBreakdown
  reasoning: string
  badge?: 'best_value' | 'premium' | 'budget'
}

export interface ScoredProduct extends AggregatedProduct {
  score: ProductScore
}

// Brand reputation database
const BRAND_TIERS = {
  premium: {
    score: 25,
    brands: [
      'apple', 'sony', 'samsung', 'lg', 'bose', 'nike', 'adidas',
      'canon', 'nikon', 'dell', 'hp', 'lenovo', 'microsoft',
      'google', 'dyson', 'kitchenaid', 'bosch', 'panasonic'
    ]
  },
  midTier: {
    score: 18,
    brands: [
      'asus', 'acer', 'toshiba', 'philips', 'jbl', 'anker',
      'tp-link', 'netgear', 'corsair', 'logitech', 'razer',
      'seagate', 'western digital', 'sandisk', 'kingston'
    ]
  },
  budget: {
    score: 10,
    brands: [
      'generic', 'onn', 'insignia', 'amazonbasics', 'basics'
    ]
  }
}

export class ProductScoringService {
  /**
   * Score a single product using AI-powered algorithm
   */
  static scoreProduct(product: AggregatedProduct, allProducts: AggregatedProduct[], searchQuery?: string): ScoredProduct {
    const breakdown: ScoreBreakdown = {
      relevance: this.calculateRelevanceScore(product, searchQuery || ''),
      price: this.calculatePriceScore(product, allProducts),
      brand: this.calculateBrandScore(product),
      condition: this.calculateConditionScore(product),
      rating: this.calculateRatingScore(product),
      shipping: this.calculateShippingScore(product),
      availability: this.calculateAvailabilityScore(product)
    }

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0)
    const reasoning = this.generateReasoning(product, breakdown, searchQuery)
    const badge = this.determineBadge(product, breakdown, total)

    console.log('📊 FINAL SCORE BREAKDOWN:')
    console.log('   Relevance:', breakdown.relevance, '/ 40')
    console.log('   Price:', breakdown.price, '/ 25')
    console.log('   Brand:', breakdown.brand, '/ 15')
    console.log('   Condition:', breakdown.condition, '/ 10')
    console.log('   Rating:', breakdown.rating, '/ 5')
    console.log('   Shipping:', breakdown.shipping, '/ 5')
    console.log('   Availability:', breakdown.availability, '/ 5')
    console.log('   🏆 TOTAL SCORE:', Math.round(total * 10) / 10, '/ 100')
    console.log('   Badge:', badge || 'none')
    console.log('   Reasoning:', reasoning)

    return {
      ...product,
      score: {
        total: Math.round(total * 10) / 10, // Round to 1 decimal
        breakdown,
        reasoning,
        badge
      }
    }
  }

  /**
   * Score all products and sort by score
   */
  static scoreAll(products: AggregatedProduct[], searchQuery?: string): ScoredProduct[] {
    if (products.length === 0) return []

    const scoredProducts = products.map(product =>
      this.scoreProduct(product, products, searchQuery)
    )

    // Sort by total score descending
    return scoredProducts.sort((a, b) => b.score.total - a.score.total)
  }

  /**
   * Get top N products by score
   */
  static getTopN(products: AggregatedProduct[], n: number = 5, searchQuery?: string): ScoredProduct[] {
    const scoredProducts = this.scoreAll(products, searchQuery)

    // Filter out products with very low relevance (< 10 points = less than 25% relevance)
    // This removes products that barely match the search query
    const relevantProducts = searchQuery
      ? scoredProducts.filter(p => p.score.breakdown.relevance >= 10)
      : scoredProducts

    return relevantProducts.slice(0, n)
  }

  /**
   * Calculate relevance score (0-40 points) - MOST IMPORTANT
   * How well does the product match the search query?
   */
  private static calculateRelevanceScore(product: AggregatedProduct, searchQuery: string): number {
    if (!searchQuery || searchQuery.trim() === '') return 20 // No query = default mid-score

    const query = searchQuery.toLowerCase().trim()
    const title = (product.title || '').toLowerCase()
    const brand = (product.brand || '').toLowerCase()
    const metadata = JSON.stringify(product.metadata || {}).toLowerCase()

    console.log('\n🎯 RELEVANCE SCORING:', product.title)
    console.log('   Query:', searchQuery)

    // Extract search terms (remove common filler words)
    const fillerWords = ['find', 'show', 'looking', 'want', 'need', 'for', 'the', 'a', 'an', 'me', 'some', 'best', 'under', 'great', 'good', 'quality', 'deals']
    const queryTerms = query
      .split(/\s+/)
      .filter(term => term.length > 2 && !fillerWords.includes(term))

    console.log('   Search Terms:', queryTerms)

    if (queryTerms.length === 0) return 20 // No meaningful terms

    let score = 0
    const maxScore = 40
    const matchDetails: string[] = []

    // Check each query term
    let matchedTerms = 0
    for (const term of queryTerms) {
      // Exact match in title = 15 points per term
      if (title.includes(term)) {
        score += 15
        matchedTerms++
        matchDetails.push(`✅ "${term}" in TITLE (+15)`)
      }
      // Exact match in brand = 10 points per term
      else if (brand.includes(term)) {
        score += 10
        matchedTerms++
        matchDetails.push(`✅ "${term}" in BRAND (+10)`)
      }
      // Match in metadata = 5 points per term
      else if (metadata.includes(term)) {
        score += 5
        matchedTerms++
        matchDetails.push(`✅ "${term}" in METADATA (+5)`)
      } else {
        matchDetails.push(`❌ "${term}" NOT FOUND (-10)`)
      }
    }

    // Penalty for missing terms
    const missedTerms = queryTerms.length - matchedTerms
    score -= (missedTerms * 10) // -10 points per missed term

    console.log('   Match Details:', matchDetails)
    console.log('   Matched:', matchedTerms, '/', queryTerms.length, 'terms')
    console.log('   Raw Score:', score, '(before capping)')

    // Cap at max score
    score = Math.min(score, maxScore)
    score = Math.max(score, 0) // Don't go negative

    console.log('   Final Relevance Score:', score, '/ 40')

    return Math.round(score * 10) / 10
  }

  /**
   * Calculate price score (0-25 points)
   * Lower price relative to max = higher score
   */
  private static calculatePriceScore(product: AggregatedProduct, allProducts: AggregatedProduct[]): number {
    const prices = allProducts.map(p => p.totalCost).filter(p => p > 0)
    if (prices.length === 0) return 12.5 // Default mid-score

    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const range = maxPrice - minPrice

    if (range === 0) return 12.5 // All same price

    // Normalize: lower price = higher score
    const normalizedScore = 1 - ((product.totalCost - minPrice) / range)
    return Math.round(normalizedScore * 25 * 10) / 10
  }

  /**
   * Calculate brand reputation score (0-15 points)
   */
  private static calculateBrandScore(product: AggregatedProduct): number {
    if (!product.brand) return 3 // No brand = minimal score

    const brandLower = product.brand.toLowerCase()

    // Check premium brands
    if (BRAND_TIERS.premium.brands.some(b => brandLower.includes(b))) {
      return 15
    }

    // Check mid-tier brands
    if (BRAND_TIERS.midTier.brands.some(b => brandLower.includes(b))) {
      return 10
    }

    // Check budget brands
    if (BRAND_TIERS.budget.brands.some(b => brandLower.includes(b))) {
      return 6
    }

    // Unknown brand - give moderate score
    return 7
  }

  /**
   * Calculate condition score (0-10 points)
   */
  private static calculateConditionScore(product: AggregatedProduct): number {
    if (!product.condition) return 5 // Default mid-score

    const conditionLower = product.condition.toLowerCase()

    if (conditionLower.includes('new') && !conditionLower.includes('like')) return 10
    if (conditionLower.includes('like new') || conditionLower.includes('mint')) return 8.5
    if (conditionLower.includes('excellent')) return 7.5
    if (conditionLower.includes('very good')) return 6
    if (conditionLower.includes('good')) return 4
    if (conditionLower.includes('fair') || conditionLower.includes('acceptable')) return 2

    return 5 // Default
  }

  /**
   * Calculate rating score (0-5 points)
   */
  private static calculateRatingScore(product: AggregatedProduct): number {
    if (!product.rating) return 2.5 // Default mid-score

    // Rating is typically 0-5 stars
    return Math.round((product.rating / 5) * 5 * 10) / 10
  }

  /**
   * Calculate shipping score (0-5 points)
   */
  private static calculateShippingScore(product: AggregatedProduct): number {
    const shippingCost = product.shippingCost || 0

    if (shippingCost === 0) return 5 // Free shipping
    if (shippingCost < 5) return 4
    if (shippingCost < 10) return 2.5
    if (shippingCost < 20) return 1.5
    return 0
  }

  /**
   * Calculate availability bonus (-10 to +5 points)
   */
  private static calculateAvailabilityScore(product: AggregatedProduct): number {
    if (!product.availability) return -10 // Out of stock penalty

    // In stock bonus
    let score = 3

    // Extra bonus for ThriftAI (local, immediate availability)
    if (product.source === 'thriftai') {
      score += 2
    }

    return score
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(product: AggregatedProduct, breakdown: ScoreBreakdown, searchQuery?: string): string {
    const reasons: string[] = []

    // Relevance reasoning (MOST IMPORTANT)
    if (breakdown.relevance > 30) {
      reasons.push('perfect match')
    } else if (breakdown.relevance > 20) {
      reasons.push('good match')
    } else if (breakdown.relevance > 10) {
      reasons.push('partial match')
    }

    // Price reasoning
    if (breakdown.price > 20) {
      reasons.push('excellent price')
    } else if (breakdown.price > 12) {
      reasons.push('good value')
    }

    // Brand reasoning
    if (breakdown.brand >= 15) {
      reasons.push('premium brand')
    } else if (breakdown.brand >= 10) {
      reasons.push('reputable brand')
    }

    // Condition reasoning
    if (breakdown.condition === 10) {
      reasons.push('brand new')
    } else if (breakdown.condition >= 8.5) {
      reasons.push('like-new condition')
    }

    // Rating reasoning
    if (breakdown.rating > 4) {
      reasons.push('highly rated')
    }

    // Shipping reasoning
    if (breakdown.shipping === 5) {
      reasons.push('free shipping')
    }

    // Availability reasoning
    if (breakdown.availability > 3) {
      reasons.push('immediate availability')
    }

    return reasons.length > 0
      ? reasons.join(', ')
      : 'solid option'
  }

  /**
   * Determine product badge
   */
  private static determineBadge(
    product: AggregatedProduct,
    breakdown: ScoreBreakdown,
    total: number
  ): 'best_value' | 'premium' | 'budget' | undefined {
    // Best value: good score with great price and relevance
    if (breakdown.price > 18 && breakdown.relevance > 25 && total > 70) {
      return 'best_value'
    }

    // Premium: high brand score, excellent condition, and relevant
    if (breakdown.brand >= 15 && breakdown.condition >= 8 && breakdown.relevance > 20) {
      return 'premium'
    }

    // Budget: low price with decent quality and relevance
    if (breakdown.price > 20 && breakdown.relevance > 15 && total > 60) {
      return 'budget'
    }

    return undefined
  }

  /**
   * Calculate comparison insights
   */
  static calculateInsights(scoredProducts: ScoredProduct[]) {
    if (scoredProducts.length === 0) {
      return {
        totalCompared: 0,
        avgScore: 0,
        scoreRange: { min: 0, max: 0 },
        bestSource: 'N/A',
        sourceBreakdown: {}
      }
    }

    const scores = scoredProducts.map(p => p.score.total)
    const sourceCount = scoredProducts.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bestSource = Object.entries(sourceCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

    return {
      totalCompared: scoredProducts.length,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      scoreRange: {
        min: Math.round(Math.min(...scores) * 10) / 10,
        max: Math.round(Math.max(...scores) * 10) / 10
      },
      bestSource,
      sourceBreakdown: sourceCount
    }
  }
}