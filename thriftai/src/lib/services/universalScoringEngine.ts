/**
 * VERITAS SCORE™ - Universal Product Scoring Engine
 *
 * The "IMDB of Products" - A trusted, universal scoring system (0-100)
 * that works across ALL product categories.
 *
 * Integrates 96 parameters:
 * - 46 existing parameters (quality, price, seller, reviews, etc.)
 * - 25 company parameters (financial health, ESG, growth metrics)
 * - 25 dynamic parameters (category-specific specs)
 *
 * 5-Pillar Architecture:
 * 1. Product Quality (30%) - Existing quality + dynamic specs + company reputation
 * 2. Value Proposition (25%) - Price competitiveness + ROI + total cost
 * 3. Trust & Safety (20%) - Seller trust + review authenticity + warranties
 * 4. User Experience (15%) - Shipping + returns + ease of purchase
 * 5. Sustainability (10%) - Environmental impact + ethical sourcing
 */

import { logger } from '@/lib/logger'
import { aiProductScorer, ProductData, ScoreBreakdown } from './aiProductScorer'
import { CompanyMetrics } from '@/lib/types/aiScoring96'

export interface VeritasScoreInput extends ProductData {
  // Company metrics (25 parameters)
  companyMetrics?: CompanyMetrics

  // Dynamic specs already in ProductData.dynamicSpecs
}

export interface VeritasPillarScores {
  productQuality: {
    score: number
    weight: number
    contributors: {
      baseQuality: number // From existing scorer
      specsCompleteness: number // From dynamic specs
      companyReputation: number // From company metrics
    }
  }
  valueProposition: {
    score: number
    weight: number
    contributors: {
      priceCompetitiveness: number // From existing scorer
      roi: number // Calculated
      totalCostOfOwnership: number // Price + shipping + fees
    }
  }
  trustAndSafety: {
    score: number
    weight: number
    contributors: {
      sellerTrust: number // From existing scorer
      reviewAuthenticity: number // From social proof
      warranties: number // From quality score
      companyLegal: number // From company metrics
    }
  }
  userExperience: {
    score: number
    weight: number
    contributors: {
      shippingSpeed: number // From convenience
      returns: number // From convenience
      easeOfPurchase: number // From availability
    }
  }
  sustainability: {
    score: number
    weight: number
    contributors: {
      environmentalImpact: number // From emotional + company ESG
      ethicalSourcing: number // From company metrics
      circularEconomy: number // From sustainability field
    }
  }
}

export interface VeritasScore {
  // The main Veritas Score (0-100)
  veritasScore: number

  // 5 Pillar breakdown
  pillars: VeritasPillarScores

  // Confidence level (0-1)
  confidence: number

  // Data completeness (% of 96 parameters available)
  dataCompleteness: number

  // Category of product
  category: string

  // Certification badges
  badges: string[]

  // Human-readable insights
  insights: string[]

  // Purchase recommendation
  recommendation: 'veritas-certified' | 'strong-buy' | 'buy' | 'consider' | 'wait' | 'avoid'

  // Original component scores for backward compatibility
  legacyScores: ScoreBreakdown
}

/**
 * Category-specific weight configurations
 * Adapts the 5-pillar weights based on product category
 */
const CATEGORY_WEIGHTS = {
  ELECTRONICS: {
    productQuality: 0.35, // ↑ Quality critical for electronics
    valueProposition: 0.25,
    trustAndSafety: 0.25, // ↑ Trust important for expensive items
    userExperience: 0.10, // ↓ Less important than quality
    sustainability: 0.05   // ↓ Less prioritized
  },
  CLOTHING: {
    productQuality: 0.20, // ↓ Less technical quality factors
    valueProposition: 0.35, // ↑ Price-sensitive category
    trustAndSafety: 0.15, // ↓ Lower risk purchases
    userExperience: 0.20, // ↑ Fit and returns matter
    sustainability: 0.10
  },
  SHOES: {
    productQuality: 0.30,
    valueProposition: 0.25,
    trustAndSafety: 0.20,
    userExperience: 0.15,
    sustainability: 0.10
  },
  ACCESSORIES: {
    productQuality: 0.25,
    valueProposition: 0.30,
    trustAndSafety: 0.20,
    userExperience: 0.15,
    sustainability: 0.10
  },
  HOME: {
    productQuality: 0.35, // ↑ Safety and durability critical
    valueProposition: 0.20,
    trustAndSafety: 0.25, // ↑ Safety certifications matter
    userExperience: 0.10,
    sustainability: 0.10
  },
  SPORTS: {
    productQuality: 0.30,
    valueProposition: 0.25,
    trustAndSafety: 0.20,
    userExperience: 0.15,
    sustainability: 0.10
  },
  DEFAULT: {
    productQuality: 0.30,
    valueProposition: 0.25,
    trustAndSafety: 0.20,
    userExperience: 0.15,
    sustainability: 0.10
  }
}

/**
 * Universal Scoring Engine
 * Combines all 96 parameters into Veritas Score™
 */
export class UniversalScoringEngine {
  /**
   * Calculate Veritas Score for a product
   */
  calculateVeritasScore(input: VeritasScoreInput): VeritasScore {
    const category = (input.category || 'DEFAULT').toUpperCase()

    // Get category-specific weights
    const weights = CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS] || CATEGORY_WEIGHTS.DEFAULT

    // Calculate legacy scores first (existing 46 parameters)
    const legacyScores = aiProductScorer.calculateScore(input)

    // Calculate 5 pillar scores
    const pillars = this.calculate5Pillars(input, legacyScores, weights)

    // Calculate weighted Veritas Score
    const veritasScore = this.calculateWeightedScore(pillars)

    // Calculate confidence and data completeness
    const { confidence, dataCompleteness } = this.calculateConfidence(input, legacyScores)

    // Generate badges
    const badges = this.generateBadges(veritasScore, pillars, input)

    // Generate insights
    const insights = this.generateInsights(veritasScore, pillars, input, legacyScores)

    // Determine recommendation
    const recommendation = this.getRecommendation(veritasScore, pillars, confidence)

    logger.info('🏆 Veritas Score calculated', {
      productId: input.id,
      veritasScore: veritasScore.toFixed(2),
      category,
      pillars: {
        quality: pillars.productQuality.score.toFixed(1),
        value: pillars.valueProposition.score.toFixed(1),
        trust: pillars.trustAndSafety.score.toFixed(1),
        ux: pillars.userExperience.score.toFixed(1),
        sustainability: pillars.sustainability.score.toFixed(1)
      },
      confidence: confidence.toFixed(2),
      dataCompleteness: `${(dataCompleteness * 100).toFixed(0)}%`,
      badges,
      recommendation
    })

    return {
      veritasScore,
      pillars,
      confidence,
      dataCompleteness,
      category,
      badges,
      insights,
      recommendation,
      legacyScores
    }
  }

  /**
   * Calculate all 5 pillar scores
   */
  private calculate5Pillars(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown,
    weights: typeof CATEGORY_WEIGHTS.DEFAULT
  ): VeritasPillarScores {
    return {
      productQuality: this.calculateProductQuality(input, legacyScores, weights.productQuality),
      valueProposition: this.calculateValueProposition(input, legacyScores, weights.valueProposition),
      trustAndSafety: this.calculateTrustAndSafety(input, legacyScores, weights.trustAndSafety),
      userExperience: this.calculateUserExperience(input, legacyScores, weights.userExperience),
      sustainability: this.calculateSustainability(input, legacyScores, weights.sustainability)
    }
  }

  /**
   * Pillar 1: Product Quality (30%)
   * Combines base quality + specs + company reputation
   */
  private calculateProductQuality(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown,
    weight: number
  ) {
    // Base quality from existing scorer
    const baseQuality = legacyScores.components.qualityScore

    // Specs completeness from dynamic parameters
    const specsCompleteness = legacyScores.components.specsQuality

    // Company reputation from company metrics
    let companyReputation = 50 // Default
    if (input.companyMetrics) {
      companyReputation = this.calculateCompanyReputation(input.companyMetrics)
    }

    // Weighted average of components
    const score = (baseQuality * 0.5) + (specsCompleteness * 0.25) + (companyReputation * 0.25)

    return {
      score,
      weight,
      contributors: {
        baseQuality,
        specsCompleteness,
        companyReputation
      }
    }
  }

  /**
   * Pillar 2: Value Proposition (25%)
   * Price competitiveness + ROI + total cost
   */
  private calculateValueProposition(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown,
    weight: number
  ) {
    // Price competitiveness from existing scorer
    const priceCompetitiveness = legacyScores.components.priceValue

    // ROI calculation (quality per dollar)
    const roi = this.calculateROI(input, legacyScores)

    // Total cost of ownership
    const totalCost = input.price + (input.shippingCost || 0)
    const totalCostScore = input.hasFreeShipping ? 80 : 50

    const score = (priceCompetitiveness * 0.5) + (roi * 0.3) + (totalCostScore * 0.2)

    return {
      score,
      weight,
      contributors: {
        priceCompetitiveness,
        roi,
        totalCostOfOwnership: totalCostScore
      }
    }
  }

  /**
   * Pillar 3: Trust & Safety (20%)
   * Seller trust + review authenticity + warranties + company legal
   */
  private calculateTrustAndSafety(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown,
    weight: number
  ) {
    // Seller trust from existing scorer
    const sellerTrust = legacyScores.components.trustScore

    // Review authenticity from social proof
    const reviewAuthenticity = legacyScores.components.socialProof

    // Warranties (from quality score components)
    const warranties = (input.hasWarranty ? 80 : 20) + (input.hasFreeReturns ? 20 : 0)

    // Company legal compliance
    let companyLegal = 75 // Default
    if (input.companyMetrics) {
      companyLegal = this.calculateCompanyLegal(input.companyMetrics)
    }

    const score = (sellerTrust * 0.4) + (reviewAuthenticity * 0.3) + (warranties * 0.15) + (companyLegal * 0.15)

    return {
      score,
      weight,
      contributors: {
        sellerTrust,
        reviewAuthenticity,
        warranties,
        companyLegal
      }
    }
  }

  /**
   * Pillar 4: User Experience (15%)
   * Shipping + returns + ease of purchase
   */
  private calculateUserExperience(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown,
    weight: number
  ) {
    // Convenience includes shipping speed
    const shippingSpeed = legacyScores.components.convenience

    // Returns policy
    const returns = (input.hasFreeReturns ? 60 : 20) + ((input.returnPeriodDays || 0) >= 30 ? 40 : 0)

    // Ease of purchase (in stock + quick checkout)
    const easeOfPurchase = input.inStock ? 80 : 20

    const score = (shippingSpeed * 0.5) + (returns * 0.3) + (easeOfPurchase * 0.2)

    return {
      score,
      weight,
      contributors: {
        shippingSpeed,
        returns,
        easeOfPurchase
      }
    }
  }

  /**
   * Pillar 5: Sustainability (10%)
   * Environmental + ethical + circular economy
   */
  private calculateSustainability(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown,
    weight: number
  ) {
    // Base sustainability from emotional score
    const environmentalImpact = legacyScores.components.emotional

    // Ethical sourcing from company metrics
    let ethicalSourcing = 50 // Default
    if (input.companyMetrics) {
      ethicalSourcing = this.calculateEthicalSourcing(input.companyMetrics)
    }

    // Circular economy (second-hand nature of thrift)
    const circularEconomy = input.sustainability ? 80 : 40

    const score = (environmentalImpact * 0.4) + (ethicalSourcing * 0.35) + (circularEconomy * 0.25)

    return {
      score,
      weight,
      contributors: {
        environmentalImpact,
        ethicalSourcing,
        circularEconomy
      }
    }
  }

  /**
   * Calculate company reputation from company metrics
   */
  private calculateCompanyReputation(metrics: CompanyMetrics): number {
    let score = 50

    // Market cap indicates stability
    if (metrics.marketCap) {
      if (metrics.marketCap > 1000) score += 25 // > $1T
      else if (metrics.marketCap > 100) score += 20 // > $100B
      else if (metrics.marketCap > 10) score += 10 // > $10B
    }

    // R&D investment shows innovation
    if (metrics.rdInvestmentPercent) {
      if (metrics.rdInvestmentPercent > 15) score += 15
      else if (metrics.rdInvestmentPercent > 10) score += 10
    }

    // Patent count shows IP strength
    if (metrics.patentCount) {
      if (metrics.patentCount > 10000) score += 10
      else if (metrics.patentCount > 1000) score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Calculate company legal compliance
   */
  private calculateCompanyLegal(metrics: CompanyMetrics): number {
    let score = 90 // Start high

    // Deduct for legal violations
    if (metrics.legalViolationsCount) {
      if (metrics.legalViolationsCount > 5) score -= 40
      else if (metrics.legalViolationsCount > 2) score -= 20
      else score -= metrics.legalViolationsCount * 10
    }

    // Deduct for recalls
    if (metrics.productRecallRate) {
      if (metrics.productRecallRate > 0.03) score -= 30 // >3%
      else if (metrics.productRecallRate > 0.01) score -= 15 // >1%
    }

    return Math.max(0, score)
  }

  /**
   * Calculate ethical sourcing score
   */
  private calculateEthicalSourcing(metrics: CompanyMetrics): number {
    let score = 50

    // Fair labor practices
    if (metrics.fairLaborScore) {
      score = metrics.fairLaborScore
    }

    // Diversity & inclusion
    if (metrics.diversityScore && metrics.diversityScore > 70) {
      score += 10
    }

    // Community investment
    if (metrics.communityInvestmentPercent) {
      if (metrics.communityInvestmentPercent > 5) score += 15
      else if (metrics.communityInvestmentPercent > 2) score += 10
    }

    return Math.min(100, score)
  }

  /**
   * Calculate ROI (quality per dollar)
   */
  private calculateROI(input: VeritasScoreInput, legacyScores: ScoreBreakdown): number {
    const qualityScore = legacyScores.components.qualityScore
    const price = input.price

    // Higher quality at lower price = better ROI
    // Normalize to 0-100 scale
    const roi = (qualityScore / price) * 100

    // Cap at 100
    return Math.min(100, roi)
  }

  /**
   * Calculate weighted Veritas Score from pillars
   */
  private calculateWeightedScore(pillars: VeritasPillarScores): number {
    const total =
      (pillars.productQuality.score * pillars.productQuality.weight) +
      (pillars.valueProposition.score * pillars.valueProposition.weight) +
      (pillars.trustAndSafety.score * pillars.trustAndSafety.weight) +
      (pillars.userExperience.score * pillars.userExperience.weight) +
      (pillars.sustainability.score * pillars.sustainability.weight)

    return Math.round(total * 10) / 10 // Round to 1 decimal
  }

  /**
   * Calculate confidence and data completeness
   */
  private calculateConfidence(
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown
  ): { confidence: number; dataCompleteness: number } {
    let availableParams = 0
    const totalParams = 96

    // Count available parameters from each source
    // Existing 46 parameters (use legacy confidence as proxy)
    availableParams += Math.floor(legacyScores.confidence * 46)

    // Company metrics (25 parameters)
    if (input.companyMetrics) {
      const companyFieldsAvailable = Object.values(input.companyMetrics).filter(v => v !== null && v !== undefined).length
      availableParams += companyFieldsAvailable
    }

    // Dynamic specs (25 parameters)
    if (input.dynamicSpecs) {
      const specsAvailable = Object.keys(input.dynamicSpecs).length
      availableParams += Math.min(25, specsAvailable)
    }

    const dataCompleteness = availableParams / totalParams

    // Confidence decreases if data is sparse
    const confidence = Math.min(1, dataCompleteness * 1.5) // Boost confidence slightly

    return { confidence, dataCompleteness }
  }

  /**
   * Generate certification badges
   */
  private generateBadges(
    veritasScore: number,
    pillars: VeritasPillarScores,
    input: VeritasScoreInput
  ): string[] {
    const badges: string[] = []

    // Veritas Certified™ (score ≥ 85)
    if (veritasScore >= 85) {
      badges.push('Veritas Certified™')
    }

    // Best Value (high value pillar score)
    if (pillars.valueProposition.score >= 80) {
      badges.push('Best Value')
    }

    // Eco Champion (high sustainability)
    if (pillars.sustainability.score >= 75) {
      badges.push('Eco Champion')
    }

    // Trusted Seller (high trust score)
    if (pillars.trustAndSafety.score >= 85) {
      badges.push('Trusted Seller')
    }

    // Premium Quality (high quality score)
    if (pillars.productQuality.score >= 85) {
      badges.push('Premium Quality')
    }

    return badges
  }

  /**
   * Generate insights
   */
  private generateInsights(
    veritasScore: number,
    pillars: VeritasPillarScores,
    input: VeritasScoreInput,
    legacyScores: ScoreBreakdown
  ): string[] {
    const insights: string[] = []

    // Overall score insights
    if (veritasScore >= 85) {
      insights.push('🏆 Exceptional product - top 15% across all categories')
    } else if (veritasScore >= 70) {
      insights.push('✅ Solid choice - above average quality and value')
    }

    // Pillar-specific insights
    if (pillars.productQuality.score >= 80) {
      insights.push('⭐ High quality product with excellent specifications')
    }

    if (pillars.valueProposition.score >= 75) {
      insights.push('💰 Great value for money - competitive pricing')
    }

    if (pillars.trustAndSafety.score >= 80) {
      insights.push('🛡️ Highly trusted - verified seller with strong reputation')
    }

    if (pillars.userExperience.score >= 75) {
      insights.push('🚚 Excellent shipping and return policies')
    }

    if (pillars.sustainability.score >= 70) {
      insights.push('🌱 Sustainable choice - positive environmental impact')
    }

    // Company insights
    if (input.companyMetrics) {
      if (input.companyMetrics.esgScore && input.companyMetrics.esgScore >= 80) {
        insights.push('🏢 Manufacturer has excellent ESG rating')
      }
      if (input.companyMetrics.marketCap && input.companyMetrics.marketCap > 1000) {
        insights.push('💼 Product from trillion-dollar company (high stability)')
      }
    }

    // Add legacy insights
    insights.push(...legacyScores.insights)

    return insights
  }

  /**
   * Get recommendation based on Veritas Score
   */
  private getRecommendation(
    veritasScore: number,
    pillars: VeritasPillarScores,
    confidence: number
  ): VeritasScore['recommendation'] {
    // Low confidence = cautious recommendation
    if (confidence < 0.5) {
      return veritasScore >= 70 ? 'consider' : 'wait'
    }

    // Veritas Certified (≥85 with high trust)
    if (veritasScore >= 85 && pillars.trustAndSafety.score >= 75) {
      return 'veritas-certified'
    }

    // Strong buy (≥75)
    if (veritasScore >= 75) {
      // Check for red flags
      if (pillars.trustAndSafety.score < 40) {
        return 'consider'
      }
      return 'strong-buy'
    }

    // Buy (≥65)
    if (veritasScore >= 65) {
      return 'buy'
    }

    // Consider (≥50)
    if (veritasScore >= 50) {
      return 'consider'
    }

    // Wait (≥35)
    if (veritasScore >= 35) {
      return 'wait'
    }

    // Avoid (<35)
    return 'avoid'
  }

  /**
   * Batch score multiple products
   */
  batchScore(products: VeritasScoreInput[]): VeritasScore[] {
    return products.map(product => this.calculateVeritasScore(product))
  }

  /**
   * Compare products and rank by Veritas Score
   */
  compareAndRank(products: VeritasScoreInput[]): Array<VeritasScoreInput & { veritasScore: VeritasScore }> {
    const scored = products.map(product => ({
      ...product,
      veritasScore: this.calculateVeritasScore(product)
    }))

    // Sort by Veritas Score descending
    scored.sort((a, b) => b.veritasScore.veritasScore - a.veritasScore.veritasScore)

    return scored
  }
}

// Export singleton instance
export const universalScoringEngine = new UniversalScoringEngine()
