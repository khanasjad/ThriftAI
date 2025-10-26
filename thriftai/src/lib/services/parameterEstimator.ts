/**
 * Parameter Estimator Service
 * Provides smart fallback estimates when APIs and scrapers fail
 *
 * Uses brand reputation, category averages, condition, and age to estimate:
 * - Product Quality
 * - Sustainability
 * - Repairability
 * - ESG Scores
 * - Specifications
 *
 * All estimations are documented with confidence scores (0-1)
 */

import { logger } from '@/lib/logger'

export interface EstimatedParameter {
  value: number
  confidence: number // 0-1, where 1 = high confidence
  estimationMethod: string
  reasoning: string
}

export interface ProductContext {
  name: string
  brand?: string | null
  category: string
  price?: number | null
  condition?: string | null
  releaseYear?: number | null
}

/**
 * Brand reputation scores (0-100)
 * Based on industry standards, reviews, and market reputation
 */
const BRAND_REPUTATION: Record<string, number> = {
  // Premium Electronics
  apple: 92,
  samsung: 85,
  sony: 82,
  canon: 84,
  nikon: 83,
  bose: 86,
  'beats by dre': 78,
  dell: 80,
  hp: 75,
  lenovo: 78,
  microsoft: 84,
  google: 85,
  lg: 77,
  panasonic: 76,

  // Fashion & Apparel
  nike: 88,
  adidas: 86,
  'under armour': 78,
  puma: 75,
  reebok: 72,
  'the north face': 85,
  patagonia: 90,
  levi: 80,
  'calvin klein': 78,
  'tommy hilfiger': 76,

  // Home & Appliances
  dyson: 88,
  kitchenaid: 84,
  'instant pot': 82,
  roomba: 85,
  nest: 83,
  ring: 79,
  philips: 80,
  bosch: 84,

  // Beauty
  'dyson (beauty)': 88,
  philips: 79,
  braun: 77,

  // Default for unknown brands
  default: 60,
}

/**
 * Category baseline quality scores (0-100)
 */
const CATEGORY_QUALITY_BASELINE: Record<string, number> = {
  ELECTRONICS: 70,
  CLOTHING: 65,
  SHOES: 68,
  ACCESSORIES: 62,
  HOME: 72,
  BEAUTY: 70,
  SPORTS: 68,
  TOYS: 60,
  BOOKS: 75,
  DEFAULT: 65,
}

/**
 * Category sustainability scores (0-100)
 * Higher = more sustainable category
 */
const CATEGORY_SUSTAINABILITY: Record<string, number> = {
  // Electronics (new has impact, refurb is great)
  ELECTRONICS: 45, // New electronics have high carbon footprint
  ELECTRONICS_REFURB: 88, // Refurb saves 80% emissions
  ELECTRONICS_USED: 92, // Used saves even more

  // Clothing
  CLOTHING: 50, // Fast fashion impact
  CLOTHING_USED: 90, // Huge savings from reuse

  // Shoes
  SHOES: 48,
  SHOES_USED: 88,

  // Accessories
  ACCESSORIES: 52,
  ACCESSORIES_USED: 85,

  // Home
  HOME: 55,
  HOME_USED: 87,

  // Beauty
  BEAUTY: 58,

  // Sports
  SPORTS: 54,
  SPORTS_USED: 86,

  // Toys
  TOYS: 50,
  TOYS_USED: 89,

  DEFAULT: 60,
  DEFAULT_USED: 85,
}

/**
 * Category repairability scores (0-10 scale)
 * Based on iFixit teardowns and industry standards
 */
const CATEGORY_REPAIRABILITY: Record<string, number> = {
  // Electronics
  ELECTRONICS_LAPTOP: 6,
  ELECTRONICS_PHONE: 4,
  ELECTRONICS_TABLET: 3,
  ELECTRONICS_WATCH: 2,
  ELECTRONICS_HEADPHONES: 3,
  ELECTRONICS_CAMERA: 5,
  ELECTRONICS: 4, // Average

  // Clothing
  CLOTHING_DENIM: 8,
  CLOTHING_COTTON: 7,
  CLOTHING_SYNTHETIC: 3,
  CLOTHING: 6,

  // Shoes
  SHOES_LEATHER: 7,
  SHOES_SNEAKERS: 4,
  SHOES_ATHLETIC: 3,
  SHOES: 5,

  // Accessories
  ACCESSORIES_WATCH: 5,
  ACCESSORIES_BAG: 6,
  ACCESSORIES: 5,

  // Home
  HOME_APPLIANCE: 7,
  HOME_FURNITURE: 8,
  HOME: 7,

  // Sports
  SPORTS_EQUIPMENT: 6,
  SPORTS: 6,

  // Toys
  TOYS: 4,

  DEFAULT: 5,
}

/**
 * Condition impact multipliers (0-1)
 * Applied to quality scores
 */
const CONDITION_MULTIPLIER: Record<string, number> = {
  new: 1.0,
  'like new': 0.95,
  excellent: 0.92,
  'very good': 0.85,
  good: 0.78,
  fair: 0.65,
  poor: 0.45,
  'for parts': 0.25,
  default: 0.8,
}

/**
 * Age depreciation curves by category
 * Annual depreciation rate (%)
 */
const AGE_DEPRECIATION: Record<string, number> = {
  ELECTRONICS: 0.15, // 15% per year
  CLOTHING: 0.10, // 10% per year
  SHOES: 0.12,
  ACCESSORIES: 0.08,
  HOME: 0.07,
  BEAUTY: 0.20, // Beauty products age quickly
  SPORTS: 0.12,
  TOYS: 0.15,
  DEFAULT: 0.12,
}

/**
 * ESG scores by brand
 * Based on public ESG reports and ratings
 */
const BRAND_ESG_SCORE: Record<string, number> = {
  // Tech companies with strong ESG
  apple: 82,
  microsoft: 85,
  google: 84,
  samsung: 75,
  dell: 78,

  // Fashion with sustainability focus
  patagonia: 95,
  'the north face': 82,
  nike: 78,
  adidas: 80,

  // Home brands
  dyson: 76,
  philips: 77,

  default: 50, // Unknown brands get neutral score
}

export class ParameterEstimator {
  /**
   * Estimate product quality score (0-100)
   */
  estimateProductQuality(context: ProductContext): EstimatedParameter {
    const categoryKey = context.category.toUpperCase()
    const categoryBaseline = CATEGORY_QUALITY_BASELINE[categoryKey] || CATEGORY_QUALITY_BASELINE.DEFAULT

    // Get brand reputation
    const brandKey = (context.brand || 'default').toLowerCase()
    const brandScore = BRAND_REPUTATION[brandKey] || BRAND_REPUTATION.default

    // Weighted combination: 60% brand, 40% category
    let qualityScore = brandScore * 0.6 + categoryBaseline * 0.4

    // Apply condition multiplier
    const conditionKey = (context.condition || 'default').toLowerCase()
    const conditionMult = CONDITION_MULTIPLIER[conditionKey] || CONDITION_MULTIPLIER.default
    qualityScore *= conditionMult

    // Apply age depreciation if available
    if (context.releaseYear) {
      const currentYear = new Date().getFullYear()
      const age = currentYear - context.releaseYear
      const depreciationRate = AGE_DEPRECIATION[categoryKey] || AGE_DEPRECIATION.DEFAULT
      const ageMultiplier = Math.max(0.4, 1 - age * depreciationRate) // Min 40% value
      qualityScore *= ageMultiplier
    }

    // Cap at 100
    qualityScore = Math.min(100, Math.max(0, qualityScore))

    const confidence = this.calculateConfidence([
      context.brand ? 0.8 : 0.4, // High confidence if brand known
      context.condition ? 0.7 : 0.5,
      context.releaseYear ? 0.6 : 0.4,
    ])

    const reasoning = this.buildQualityReasoning(context, brandScore, categoryBaseline, conditionMult)

    logger.info('Product quality estimated', {
      component: 'ParameterEstimator',
      metadata: {
        product: context.name,
        score: qualityScore.toFixed(1),
        confidence: (confidence * 100).toFixed(0) + '%',
      },
    })

    return {
      value: qualityScore,
      confidence,
      estimationMethod: 'brand_category_condition_age',
      reasoning,
    }
  }

  /**
   * Estimate sustainability score (0-100)
   */
  estimateSustainability(context: ProductContext): EstimatedParameter {
    const categoryKey = context.category.toUpperCase()
    const isUsedOrRefurb = this.isUsedProduct(context)

    // Get base sustainability
    let sustainabilityScore: number

    if (isUsedOrRefurb) {
      // Used/refurb products have MUCH better sustainability
      sustainabilityScore = CATEGORY_SUSTAINABILITY[`${categoryKey}_USED`] || CATEGORY_SUSTAINABILITY.DEFAULT_USED
    } else {
      sustainabilityScore = CATEGORY_SUSTAINABILITY[categoryKey] || CATEGORY_SUSTAINABILITY.DEFAULT
    }

    // Brand bonus for sustainable brands
    const brandKey = (context.brand || '').toLowerCase()
    if (brandKey === 'patagonia') sustainabilityScore += 10
    else if (brandKey === 'apple') sustainabilityScore += 5
    else if (brandKey === 'fairphone') sustainabilityScore += 15

    sustainabilityScore = Math.min(100, sustainabilityScore)

    const confidence = this.calculateConfidence([
      isUsedOrRefurb ? 0.85 : 0.6, // High confidence for used = sustainable
      context.brand && ['patagonia', 'apple', 'fairphone'].includes(brandKey) ? 0.75 : 0.5,
    ])

    const reasoning = this.buildSustainabilityReasoning(context, isUsedOrRefurb, sustainabilityScore)

    logger.info('Sustainability estimated', {
      component: 'ParameterEstimator',
      metadata: {
        product: context.name,
        score: sustainabilityScore.toFixed(1),
        isUsed: isUsedOrRefurb,
        confidence: (confidence * 100).toFixed(0) + '%',
      },
    })

    return {
      value: sustainabilityScore,
      confidence,
      estimationMethod: 'category_condition_brand',
      reasoning,
    }
  }

  /**
   * Estimate repairability score (0-10)
   */
  estimateRepairability(context: ProductContext): EstimatedParameter {
    const categoryKey = context.category.toUpperCase()
    const productName = context.name.toLowerCase()

    // Get category baseline
    let repairabilityScore: number

    // More specific category matching
    if (categoryKey === 'ELECTRONICS') {
      if (productName.includes('laptop') || productName.includes('macbook')) {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS_LAPTOP
      } else if (productName.includes('phone') || productName.includes('iphone')) {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS_PHONE
      } else if (productName.includes('tablet') || productName.includes('ipad')) {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS_TABLET
      } else if (productName.includes('watch')) {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS_WATCH
      } else if (productName.includes('headphone') || productName.includes('airpod')) {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS_HEADPHONES
      } else if (productName.includes('camera')) {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS_CAMERA
      } else {
        repairabilityScore = CATEGORY_REPAIRABILITY.ELECTRONICS
      }
    } else {
      repairabilityScore = CATEGORY_REPAIRABILITY[categoryKey] || CATEGORY_REPAIRABILITY.DEFAULT
    }

    // Brand adjustments
    const brandKey = (context.brand || '').toLowerCase()
    if (brandKey === 'fairphone') repairabilityScore = Math.min(10, repairabilityScore + 3)
    else if (brandKey === 'framework') repairabilityScore = Math.min(10, repairabilityScore + 2)
    else if (brandKey === 'apple' && categoryKey === 'ELECTRONICS') repairabilityScore = Math.max(1, repairabilityScore - 2) // Apple products hard to repair

    const confidence = this.calculateConfidence([0.6, productName.includes('laptop') || productName.includes('phone') ? 0.7 : 0.5])

    const reasoning = this.buildRepairabilityReasoning(context, repairabilityScore)

    return {
      value: repairabilityScore,
      confidence,
      estimationMethod: 'category_product_type_brand',
      reasoning,
    }
  }

  /**
   * Estimate ESG score (0-100)
   */
  estimateESGScore(context: ProductContext): EstimatedParameter {
    const brandKey = (context.brand || 'default').toLowerCase()
    let esgScore = BRAND_ESG_SCORE[brandKey] || BRAND_ESG_SCORE.default

    // Used products get a small ESG bonus (circular economy)
    if (this.isUsedProduct(context)) {
      esgScore = Math.min(100, esgScore + 8)
    }

    const confidence = this.calculateConfidence([context.brand ? 0.65 : 0.35])

    const reasoning = `ESG score estimated based on ${context.brand ? `${context.brand}'s corporate ESG ratings` : 'industry average'}. ${this.isUsedProduct(context) ? 'Bonus for circular economy (used product). ' : ''}Source: Public ESG reports and sustainability ratings.`

    return {
      value: esgScore,
      confidence,
      estimationMethod: 'brand_esg_circular_economy',
      reasoning,
    }
  }

  /**
   * Estimate carbon footprint (kg CO2e)
   */
  estimateCarbonFootprint(context: ProductContext): EstimatedParameter {
    const categoryKey = context.category.toUpperCase()

    // Average carbon footprints by category (kg CO2e)
    const categoryFootprints: Record<string, number> = {
      ELECTRONICS: 85, // Average for electronics
      CLOTHING: 22, // Average garment
      SHOES: 14,
      ACCESSORIES: 8,
      HOME: 120, // Appliances
      BEAUTY: 5,
      SPORTS: 18,
      TOYS: 12,
      DEFAULT: 25,
    }

    let carbonFootprint = categoryFootprints[categoryKey] || categoryFootprints.DEFAULT

    // If used/refurb, significantly reduce (buying used saves 80% emissions)
    if (this.isUsedProduct(context)) {
      carbonFootprint *= 0.2 // 80% savings
    }

    const confidence = this.calculateConfidence([0.5, this.isUsedProduct(context) ? 0.7 : 0.4])

    const reasoning = `Carbon footprint estimated based on category average. ${this.isUsedProduct(context) ? 'Used product saves ~80% of emissions vs. new.' : 'New product full lifecycle emissions.'}`

    return {
      value: carbonFootprint,
      confidence,
      estimationMethod: 'category_lifecycle_analysis',
      reasoning,
    }
  }

  /**
   * Check if product is used/refurbished
   */
  private isUsedProduct(context: ProductContext): boolean {
    const condition = (context.condition || '').toLowerCase()
    const name = context.name.toLowerCase()

    return (
      condition.includes('used') ||
      condition.includes('refurb') ||
      condition.includes('pre-owned') ||
      condition.includes('open box') ||
      name.includes('refurb') ||
      name.includes('used') ||
      name.includes('pre-owned')
    )
  }

  /**
   * Calculate overall confidence from multiple factors
   */
  private calculateConfidence(factors: number[]): number {
    if (factors.length === 0) return 0.3 // Default low confidence

    // Average of factors
    const avg = factors.reduce((sum, f) => sum + f, 0) / factors.length
    return Math.min(0.9, Math.max(0.3, avg)) // Cap between 0.3 and 0.9
  }

  /**
   * Build quality reasoning explanation
   */
  private buildQualityReasoning(
    context: ProductContext,
    brandScore: number,
    categoryBaseline: number,
    conditionMult: number
  ): string {
    const parts: string[] = []

    if (context.brand) {
      parts.push(`Brand ${context.brand} reputation score: ${brandScore}/100`)
    } else {
      parts.push('Unknown brand - using industry average')
    }

    parts.push(`Category ${context.category} baseline: ${categoryBaseline}/100`)

    if (context.condition) {
      parts.push(`Condition "${context.condition}" multiplier: ${(conditionMult * 100).toFixed(0)}%`)
    }

    if (context.releaseYear) {
      const age = new Date().getFullYear() - context.releaseYear
      parts.push(`Age depreciation: ${age} years old`)
    }

    return parts.join('. ') + '. Estimated using brand reputation + category baseline + condition + age.'
  }

  /**
   * Build sustainability reasoning
   */
  private buildSustainabilityReasoning(context: ProductContext, isUsed: boolean, score: number): string {
    if (isUsed) {
      return `Used/refurbished product saves ~80% emissions vs. new. Category ${context.category} used score: ${score}/100. Source: Lifecycle analysis and circular economy principles.`
    } else {
      return `New ${context.category} product. Category baseline: ${score}/100. Based on average lifecycle carbon footprint and manufacturing impact.`
    }
  }

  /**
   * Build repairability reasoning
   */
  private buildRepairabilityReasoning(context: ProductContext, score: number): string {
    const categoryKey = context.category.toUpperCase()
    const productType = context.name.toLowerCase().includes('laptop')
      ? 'Laptop'
      : context.name.toLowerCase().includes('phone')
        ? 'Phone'
        : context.category

    return `${productType} repairability estimated: ${score}/10. Based on iFixit teardown averages for ${categoryKey} category${context.brand ? ` and ${context.brand} design practices` : ''}.`
  }
}

// Singleton instance
export const parameterEstimator = new ParameterEstimator()
