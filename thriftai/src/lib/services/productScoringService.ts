import { AggregatedProduct } from './marketplaceAggregator'

export interface ScoreBreakdown {
  price: number           // 0-30
  brand: number           // 0-25
  condition: number       // 0-20
  rating: number          // 0-15
  shipping: number        // 0-10
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
  static scoreProduct(product: AggregatedProduct, allProducts: AggregatedProduct[]): ScoredProduct {
    const breakdown: ScoreBreakdown = {
      price: this.calculatePriceScore(product, allProducts),
      brand: this.calculateBrandScore(product),
      condition: this.calculateConditionScore(product),
      rating: this.calculateRatingScore(product),
      shipping: this.calculateShippingScore(product),
      availability: this.calculateAvailabilityScore(product)
    }

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0)
    const reasoning = this.generateReasoning(product, breakdown)
    const badge = this.determineBadge(product, breakdown, total)

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
  static scoreAll(products: AggregatedProduct[]): ScoredProduct[] {
    if (products.length === 0) return []

    const scoredProducts = products.map(product =>
      this.scoreProduct(product, products)
    )

    // Sort by total score descending
    return scoredProducts.sort((a, b) => b.score.total - a.score.total)
  }

  /**
   * Get top N products by score
   */
  static getTopN(products: AggregatedProduct[], n: number = 5): ScoredProduct[] {
    const scoredProducts = this.scoreAll(products)
    return scoredProducts.slice(0, n)
  }

  /**
   * Calculate price score (0-30 points)
   * Lower price relative to max = higher score
   */
  private static calculatePriceScore(product: AggregatedProduct, allProducts: AggregatedProduct[]): number {
    const prices = allProducts.map(p => p.totalCost).filter(p => p > 0)
    if (prices.length === 0) return 15 // Default mid-score

    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const range = maxPrice - minPrice

    if (range === 0) return 15 // All same price

    // Normalize: lower price = higher score
    const normalizedScore = 1 - ((product.totalCost - minPrice) / range)
    return Math.round(normalizedScore * 30 * 10) / 10
  }

  /**
   * Calculate brand reputation score (0-25 points)
   */
  private static calculateBrandScore(product: AggregatedProduct): number {
    if (!product.brand) return 5 // No brand = minimal score

    const brandLower = product.brand.toLowerCase()

    // Check premium brands
    if (BRAND_TIERS.premium.brands.some(b => brandLower.includes(b))) {
      return BRAND_TIERS.premium.score
    }

    // Check mid-tier brands
    if (BRAND_TIERS.midTier.brands.some(b => brandLower.includes(b))) {
      return BRAND_TIERS.midTier.score
    }

    // Check budget brands
    if (BRAND_TIERS.budget.brands.some(b => brandLower.includes(b))) {
      return BRAND_TIERS.budget.score
    }

    // Unknown brand - give moderate score
    return 12
  }

  /**
   * Calculate condition score (0-20 points)
   */
  private static calculateConditionScore(product: AggregatedProduct): number {
    if (!product.condition) return 10 // Default mid-score

    const conditionLower = product.condition.toLowerCase()

    if (conditionLower.includes('new') && !conditionLower.includes('like')) return 20
    if (conditionLower.includes('like new') || conditionLower.includes('mint')) return 17
    if (conditionLower.includes('excellent')) return 15
    if (conditionLower.includes('very good')) return 12
    if (conditionLower.includes('good')) return 8
    if (conditionLower.includes('fair') || conditionLower.includes('acceptable')) return 4

    return 10 // Default
  }

  /**
   * Calculate rating score (0-15 points)
   */
  private static calculateRatingScore(product: AggregatedProduct): number {
    if (!product.rating) return 7.5 // Default mid-score

    // Rating is typically 0-5 stars
    return Math.round((product.rating / 5) * 15 * 10) / 10
  }

  /**
   * Calculate shipping score (0-10 points)
   */
  private static calculateShippingScore(product: AggregatedProduct): number {
    const shippingCost = product.shippingCost || 0

    if (shippingCost === 0) return 10 // Free shipping
    if (shippingCost < 5) return 8
    if (shippingCost < 10) return 5
    if (shippingCost < 20) return 3
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
  private static generateReasoning(product: AggregatedProduct, breakdown: ScoreBreakdown): string {
    const reasons: string[] = []

    // Price reasoning
    if (breakdown.price > 20) {
      reasons.push('excellent price')
    } else if (breakdown.price > 15) {
      reasons.push('good value')
    }

    // Brand reasoning
    if (breakdown.brand >= 25) {
      reasons.push('premium brand')
    } else if (breakdown.brand >= 18) {
      reasons.push('reputable brand')
    }

    // Condition reasoning
    if (breakdown.condition >= 17) {
      reasons.push('like-new condition')
    } else if (breakdown.condition === 20) {
      reasons.push('brand new')
    }

    // Rating reasoning
    if (breakdown.rating > 12) {
      reasons.push('highly rated')
    }

    // Shipping reasoning
    if (breakdown.shipping === 10) {
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
    // Best value: good score with great price
    if (breakdown.price > 20 && total > 70) {
      return 'best_value'
    }

    // Premium: high brand score, excellent condition
    if (breakdown.brand >= 25 && breakdown.condition >= 17) {
      return 'premium'
    }

    // Budget: low price with decent quality
    if (breakdown.price > 25 && total > 60) {
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