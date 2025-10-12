/**
 * AI-Powered Product Scoring Algorithm
 *
 * Based on comprehensive research of:
 * - Consumer psychology research (2024)
 * - Amazon A9/A10 algorithm factors
 * - eBay Cassini algorithm
 * - Behavioral economics principles
 *
 * This algorithm calculates a holistic product score (0-100) that predicts
 * purchase likelihood and product quality from a consumer perspective.
 */

import { logger } from '@/lib/logger'

export interface ProductData {
  // Basic Information
  id: string
  name: string
  description?: string
  brand?: string
  category?: string

  // Pricing
  price: number
  originalPrice?: number
  currency?: string

  // Seller Information
  sellerId?: string
  sellerRating?: number
  sellerResponseTime?: number // hours
  sellerTotalSales?: number
  sellerAge?: number // days on platform

  // Product Quality
  condition?: 'new' | 'like-new' | 'excellent' | 'good' | 'fair'
  hasWarranty?: boolean
  isAuthentic?: boolean
  certifications?: string[]

  // Reviews & Social Proof
  rating?: number // 0-5
  reviewCount?: number
  recentReviewCount?: number // last 30 days
  verifiedPurchaseRatio?: number // % of verified purchases

  // Shipping & Fulfillment
  shippingCost?: number
  estimatedDeliveryDays?: number
  hasFreeShipping?: boolean
  hasFastShipping?: boolean // <2 days
  hasTracking?: boolean
  returnPeriodDays?: number
  hasFreeReturns?: boolean

  // Availability & Urgency
  inStock?: boolean
  stockLevel?: number
  viewsLast24h?: number
  salesLast7Days?: number
  cartAdditionsLast24h?: number

  // Search & Relevance
  searchQuery?: string
  clickThroughRate?: number
  conversionRate?: number
  bounceRate?: number

  // External Factors
  hasExternalTraffic?: boolean
  socialMediaMentions?: number
  sustainability?: boolean
  madeInCountry?: string

  // Competition
  competitorPrices?: number[]
  marketAveragePrice?: number

  // Dynamic Specifications (category-specific)
  dynamicSpecs?: Record<string, any>
}

export interface ScoreBreakdown {
  total: number // 0-100
  components: {
    priceValue: number // Price competitiveness
    trustScore: number // Seller & product trust
    qualityScore: number // Product quality indicators
    socialProof: number // Reviews & social validation
    convenience: number // Shipping & returns
    urgency: number // Stock & demand signals
    relevance: number // Search match quality
    emotional: number // Brand & sustainability appeal
    specsQuality: number // Dynamic specifications completeness
  }
  confidence: number // 0-1, how confident we are in the score
  insights: string[] // Human-readable insights
  recommendation: 'strong-buy' | 'buy' | 'consider' | 'wait' | 'avoid'
}

/**
 * Advanced Product Scoring Algorithm
 * Implements multi-factor scoring based on consumer psychology research
 */
export class AIProductScorer {
  /**
   * Calculate comprehensive product score
   */
  calculateScore(product: ProductData): ScoreBreakdown {
    const components = {
      priceValue: this.calculatePriceValue(product),
      trustScore: this.calculateTrustScore(product),
      qualityScore: this.calculateQualityScore(product),
      socialProof: this.calculateSocialProof(product),
      convenience: this.calculateConvenience(product),
      urgency: this.calculateUrgency(product),
      relevance: this.calculateRelevance(product),
      emotional: this.calculateEmotionalAppeal(product),
      specsQuality: this.calculateSpecsQuality(product)
    }

    // Weight factors based on consumer psychology research
    // Research shows price (25%), trust (20%), and social proof (15%) are top factors
    const weights = {
      priceValue: 0.23,    // Price is #1 factor for most consumers
      trustScore: 0.18,    // Trust crucial for online purchases
      socialProof: 0.14,   // 93% influenced by reviews
      qualityScore: 0.12,  // Product quality assessment
      convenience: 0.10,   // Shipping & returns matter
      specsQuality: 0.10,  // Product specifications completeness
      relevance: 0.07,     // Search relevance
      urgency: 0.04,       // FOMO and scarcity
      emotional: 0.02      // Brand appeal & sustainability
    }

    // Calculate weighted total
    let total = 0
    let maxPossible = 0
    let actualWeight = 0

    for (const [key, value] of Object.entries(components)) {
      const weight = weights[key as keyof typeof weights]
      if (value !== null) {
        total += value * weight
        actualWeight += weight
      }
      maxPossible += weight
    }

    // The weighted sum is already in 0-100 range since components are 0-100
    // and weights sum to 1.0. Only normalize if we have missing components.
    if (actualWeight > 0 && actualWeight < maxPossible) {
      // Scale up if some components are missing
      total = total * (maxPossible / actualWeight)
    }

    // Calculate confidence based on data completeness
    const confidence = actualWeight / maxPossible

    // Generate insights
    const insights = this.generateInsights(product, components)

    // Determine recommendation
    const recommendation = this.getRecommendation(total, components, confidence)

    logger.info('🎯 Product score calculated', {
      productId: product.id,
      name: product.name,
      total: total.toFixed(3),
      components: {
        priceValue: components.priceValue.toFixed(1),
        trustScore: components.trustScore.toFixed(1),
        socialProof: components.socialProof.toFixed(1),
        qualityScore: components.qualityScore.toFixed(1),
        convenience: components.convenience.toFixed(1),
        relevance: components.relevance.toFixed(1),
        urgency: components.urgency.toFixed(1),
        emotional: components.emotional.toFixed(1)
      },
      weights: {
        actualWeight: actualWeight.toFixed(3),
        maxPossible: maxPossible.toFixed(3)
      },
      confidence: confidence.toFixed(3),
      recommendation
    })

    return {
      total,
      components,
      confidence,
      insights,
      recommendation
    }
  }

  /**
   * Price Value Score (0-100)
   * Uses psychological pricing principles and competitive analysis
   */
  private calculatePriceValue(product: ProductData): number {
    let score = 0 // ✅ AUTHENTIC DATA ONLY - Start at 0

    // Discount impact (loss aversion psychology) - ONLY if we have real originalPrice
    if (product.originalPrice && product.originalPrice > product.price) {
      score = 50 // Base score only when we have discount data
      const discountPercent = ((product.originalPrice - product.price) / product.originalPrice) * 100

      // Psychological thresholds: 20%, 30%, 50% discounts
      if (discountPercent >= 50) score += 30
      else if (discountPercent >= 30) score += 20
      else if (discountPercent >= 20) score += 15
      else score += discountPercent * 0.3
    }

    // Competitive pricing
    if (product.marketAveragePrice) {
      const priceRatio = product.price / product.marketAveragePrice
      if (priceRatio < 0.7) score += 20  // Significantly below market
      else if (priceRatio < 0.9) score += 10  // Below market
      else if (priceRatio > 1.3) score -= 20  // Above market
      else if (priceRatio > 1.1) score -= 10  // Slightly above
    }

    // Free shipping bonus (major decision factor)
    if (product.hasFreeShipping) score += 10

    // Price ending psychology (charm pricing)
    const priceStr = product.price.toString()
    if (priceStr.endsWith('.99') || priceStr.endsWith('.95')) {
      score += 2 // Slight bonus for psychological pricing
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Trust Score (0-100)
   * Based on seller reputation and product authenticity
   */
  private calculateTrustScore(product: ProductData): number {
    let score = 0 // ✅ AUTHENTIC DATA ONLY - Start at 0

    // Seller rating (critical factor) - ONLY add score if we have real data
    if (product.sellerRating) {
      score += (product.sellerRating / 5) * 60 // Increased weight since it's the primary trust indicator
    }

    // Seller history
    if (product.sellerTotalSales) {
      if (product.sellerTotalSales > 10000) score += 15
      else if (product.sellerTotalSales > 1000) score += 10
      else if (product.sellerTotalSales > 100) score += 5
    }

    // Response time (customer service indicator)
    if (product.sellerResponseTime) {
      if (product.sellerResponseTime <= 1) score += 10
      else if (product.sellerResponseTime <= 4) score += 5
      else if (product.sellerResponseTime > 24) score -= 10
    }

    // Authenticity and warranty
    if (product.isAuthentic) score += 10
    if (product.hasWarranty) score += 5

    // Return policy (risk reduction)
    if (product.hasFreeReturns) score += 10
    if (product.returnPeriodDays && product.returnPeriodDays >= 30) score += 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Quality Score (0-100)
   * Product condition and specifications
   */
  private calculateQualityScore(product: ProductData): number {
    let score = 0

    // Condition scoring - ONLY if we have real condition data
    const conditionScores = {
      'new': 100,
      'like-new': 85,
      'excellent': 70,
      'good': 50,
      'fair': 30
    }

    if (product.condition) {
      score = conditionScores[product.condition] || 0 // ✅ 0 for unknown, not 50
    }
    // ✅ REMOVED: No fake 50 for unknown condition

    // ❌ REMOVED: Brand premium discrimination
    // NO automatic bonuses for Apple/Nike/etc - all brands treated equally
    // Quality should be based on CONDITION and SPECS only, not brand name

    // Certifications
    if (product.certifications && product.certifications.length > 0) {
      score = Math.min(100, score + 5 * product.certifications.length)
    }

    // Dynamic Specifications Bonus
    // Products with detailed specs are more transparent and trustworthy
    if (product.dynamicSpecs && Object.keys(product.dynamicSpecs).length > 0) {
      const specsCount = Object.keys(product.dynamicSpecs).length
      // Award up to 10 points for complete specifications
      // More specs = better product transparency
      const specsBonus = Math.min(10, specsCount * 2)
      score = Math.min(100, score + specsBonus)
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Social Proof Score (0-100)
   * Reviews and social validation metrics
   */
  private calculateSocialProof(product: ProductData): number {
    let score = 0

    // Rating impact (non-linear, as per research)
    if (product.rating) {
      if (product.rating >= 4.5) score += 40
      else if (product.rating >= 4.0) score += 30
      else if (product.rating >= 3.5) score += 20
      else if (product.rating >= 3.0) score += 10
      else score += 5
    }

    // Review volume (credibility)
    if (product.reviewCount) {
      if (product.reviewCount >= 1000) score += 30
      else if (product.reviewCount >= 100) score += 20
      else if (product.reviewCount >= 10) score += 10
      else if (product.reviewCount > 0) score += 5
    }

    // Recent activity (freshness)
    if (product.recentReviewCount && product.recentReviewCount > 0) {
      score += Math.min(15, product.recentReviewCount)
    }

    // Verified purchase ratio
    if (product.verifiedPurchaseRatio) {
      score += product.verifiedPurchaseRatio * 15
    }

    // Social media buzz
    if (product.socialMediaMentions && product.socialMediaMentions > 100) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Convenience Score (0-100)
   * Shipping, delivery, and purchase ease
   */
  private calculateConvenience(product: ProductData): number {
    let score = 0 // ✅ AUTHENTIC DATA ONLY - Start at 0

    // Shipping speed (major factor) - ONLY if we have real delivery data
    if (product.estimatedDeliveryDays !== undefined && product.estimatedDeliveryDays !== null) {
      if (product.estimatedDeliveryDays <= 2) score += 40
      else if (product.estimatedDeliveryDays <= 5) score += 30
      else if (product.estimatedDeliveryDays <= 7) score += 20
      else if (product.estimatedDeliveryDays <= 14) score += 10
      // No penalty, just no bonus for slow shipping
    }

    // Free shipping
    if (product.hasFreeShipping) score += 15

    // Fast shipping availability
    if (product.hasFastShipping) score += 10

    // Tracking
    if (product.hasTracking) score += 5

    // Stock availability
    if (product.inStock) {
      score += 10
    } else {
      score -= 30 // Big penalty for out of stock
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Urgency Score (0-100)
   * Scarcity and FOMO factors
   */
  private calculateUrgency(product: ProductData): number {
    let score = 0 // ✅ AUTHENTIC DATA ONLY - Start at 0

    // Low stock creates urgency - ONLY if we have real stock data
    if (product.stockLevel !== undefined && product.stockLevel !== null) {
      if (product.stockLevel <= 5) score += 50
      else if (product.stockLevel <= 10) score += 35
      else if (product.stockLevel <= 20) score += 20
      else score += 5 // Still in stock, slight bonus
    }

    // High recent activity
    if (product.viewsLast24h && product.viewsLast24h > 100) {
      score += 20
    }

    // Recent sales velocity
    if (product.salesLast7Days) {
      if (product.salesLast7Days > 50) score += 20
      else if (product.salesLast7Days > 20) score += 10
      else if (product.salesLast7Days > 5) score += 5
    }

    // Cart additions (intent signal)
    if (product.cartAdditionsLast24h && product.cartAdditionsLast24h > 10) {
      score += 15
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Relevance Score (0-100)
   * How well the product matches search intent
   */
  private calculateRelevance(product: ProductData): number {
    let score = 0 // ✅ AUTHENTIC DATA ONLY - Start at 0

    // If no search-related data exists, return 0
    const hasSearchData = product.clickThroughRate || product.conversionRate || product.bounceRate
    if (!hasSearchData) {
      return 0
    }

    // Give base score only if we have some search metrics
    score = 30

    // Click-through rate (strong signal)
    if (product.clickThroughRate) {
      if (product.clickThroughRate > 0.1) score += 30
      else if (product.clickThroughRate > 0.05) score += 20
      else if (product.clickThroughRate > 0.02) score += 10
    }

    // Conversion rate (ultimate relevance signal)
    if (product.conversionRate) {
      if (product.conversionRate > 0.05) score += 30
      else if (product.conversionRate > 0.02) score += 20
      else if (product.conversionRate > 0.01) score += 10
    }

    // Low bounce rate
    if (product.bounceRate) {
      if (product.bounceRate < 0.3) score += 10
      else if (product.bounceRate > 0.7) score -= 20
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Emotional Appeal Score (0-100)
   * Brand value, sustainability, and emotional factors
   */
  private calculateEmotionalAppeal(product: ProductData): number {
    let score = 0 // ✅ AUTHENTIC DATA ONLY - Start at 0

    // ❌ REMOVED: No fake +20 just for having a brand name
    // Brand alone means nothing without real brand metrics from company data

    // Sustainability (growing importance in 2024) - ONLY if explicitly marked
    if (product.sustainability) {
      score += 50 // Increased since it's a real sustainability indicator
    }

    // Country of origin preferences
    if (product.madeInCountry) {
      // Simplified - could be personalized based on user location
      const preferredCountries = ['USA', 'Germany', 'Japan', 'Italy', 'France']
      if (preferredCountries.includes(product.madeInCountry)) {
        score += 20
      }
    }

    // External validation
    if (product.hasExternalTraffic) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Specs Quality Score (0-100)
   * Product specifications completeness and detail level
   */
  private calculateSpecsQuality(product: ProductData): number {
    // Products with detailed specifications score higher
    if (!product.dynamicSpecs || Object.keys(product.dynamicSpecs).length === 0) {
      return 0 // No specs = 0 score
    }

    const specsCount = Object.keys(product.dynamicSpecs).length

    // Score based on number of specifications
    // 1-2 specs = 40 points (basic info)
    // 3-4 specs = 70 points (good detail)
    // 5+ specs = 100 points (excellent detail)

    if (specsCount >= 5) {
      return 100
    } else if (specsCount === 4) {
      return 80
    } else if (specsCount === 3) {
      return 60
    } else if (specsCount === 2) {
      return 40
    } else {
      return 20
    }
  }

  /**
   * Generate human-readable insights
   */
  private generateInsights(product: ProductData, components: ScoreBreakdown['components']): string[] {
    const insights: string[] = []

    // Price insights
    if (components.priceValue > 70) {
      insights.push('💰 Excellent value for money')
    } else if (components.priceValue < 30) {
      insights.push('⚠️ Price may be high compared to alternatives')
    }

    // Trust insights
    if (components.trustScore > 80) {
      insights.push('✅ Highly trusted seller with excellent reputation')
    } else if (components.trustScore < 40) {
      insights.push('⚠️ Limited seller history or reviews')
    }

    // Social proof insights
    if (product.reviewCount && product.reviewCount > 100 && product.rating && product.rating >= 4) {
      insights.push('⭐ Highly rated by many customers')
    }

    // Urgency insights
    if (product.stockLevel && product.stockLevel <= 5) {
      insights.push('🔥 Low stock - only ' + product.stockLevel + ' left')
    }

    // Shipping insights
    if (product.hasFreeShipping && product.estimatedDeliveryDays && product.estimatedDeliveryDays <= 2) {
      insights.push('🚚 Free fast shipping available')
    }

    // Quality insights
    if (product.condition === 'new' && product.hasWarranty) {
      insights.push('🛡️ Brand new with warranty protection')
    }

    return insights
  }

  /**
   * Get purchase recommendation based on scores
   */
  private getRecommendation(
    total: number,
    components: ScoreBreakdown['components'],
    confidence: number
  ): ScoreBreakdown['recommendation'] {
    // Low confidence means limited data
    if (confidence < 0.5) {
      return total > 60 ? 'consider' : 'wait'
    }

    // High total score
    if (total >= 80) {
      return 'strong-buy'
    } else if (total >= 65) {
      // Check for any red flags
      if (components.trustScore < 30 || components.qualityScore < 30) {
        return 'consider'
      }
      return 'buy'
    } else if (total >= 50) {
      return 'consider'
    } else if (total >= 35) {
      return 'wait'
    } else {
      return 'avoid'
    }
  }

  /**
   * Compare multiple products and rank them
   */
  compareProducts(products: ProductData[]): Array<ProductData & { score: ScoreBreakdown }> {
    const scoredProducts = products.map(product => ({
      ...product,
      score: this.calculateScore(product)
    }))

    // Sort by total score descending
    scoredProducts.sort((a, b) => b.score.total - a.score.total)

    return scoredProducts
  }

  /**
   * Get personalized score adjustments based on user preferences
   */
  personalizeScore(
    baseScore: ScoreBreakdown,
    userPreferences: {
      priceSensitive?: boolean
      brandLoyal?: boolean
      ecoConscious?: boolean
      speedPriority?: boolean
    }
  ): ScoreBreakdown {
    const adjustedComponents = { ...baseScore.components }
    let adjustment = 0

    if (userPreferences.priceSensitive) {
      adjustment += (adjustedComponents.priceValue - 50) * 0.2
    }

    if (userPreferences.brandLoyal) {
      adjustment += (adjustedComponents.emotional - 50) * 0.15
    }

    if (userPreferences.ecoConscious) {
      adjustment += (adjustedComponents.emotional - 50) * 0.2
    }

    if (userPreferences.speedPriority) {
      adjustment += (adjustedComponents.convenience - 50) * 0.15
    }

    const adjustedTotal = Math.max(0, Math.min(100, baseScore.total + adjustment))

    return {
      ...baseScore,
      total: adjustedTotal
    }
  }
}

// Export singleton instance
export const aiProductScorer = new AIProductScorer()