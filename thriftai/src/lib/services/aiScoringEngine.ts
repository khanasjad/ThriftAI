/**
 * AI Scoring Engine - 96 Parameter System
 *
 * Integrates all scoring components:
 * - 46 existing parameters (price, seller, quality, reviews, etc.)
 * - 25 company parameters (financial, ESG, growth, social, risk)
 * - 25 dynamic parameters (category-specific product specs)
 *
 * Produces a comprehensive 0-100 AI score with detailed breakdown,
 * confidence scoring, insights, and recommendations.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { aiProductScorer, ProductData } from './aiProductScorer'
import { companyMetricsService, calculateCompanyScore } from './companyMetricsService'
import { dynamicParameterExtractor } from './dynamicParameterExtractor'
import {
  AIScoreResult,
  AIScoreBreakdown,
  CompanyMetrics,
  DynamicSpecs,
  ProductCategory,
  ScoringWeights,
  DEFAULT_WEIGHTS,
  CATEGORY_WEIGHT_MULTIPLIERS
} from '@/lib/types/aiScoring96'

// ========================================
// AI SCORING ENGINE
// ========================================

export class AIScoringEngine {
  /**
   * Score a single product using all 96 parameters
   */
  async scoreProduct(productId: string, options?: {
    forceRefresh?: boolean
    includeCompanyMetrics?: boolean
    includeDynamicSpecs?: boolean
  }): Promise<AIScoreResult> {
    const startTime = Date.now()

    try {
      logger.info('Scoring product with 96 parameters', { productId })

      // Fetch product from database
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          seller: true,
          reviews: {
            take: 100,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Check if we can use cached scores
      if (!options?.forceRefresh && product.aiScore && product.lastScoredAt) {
        const hoursSinceScore = (Date.now() - product.lastScoredAt.getTime()) / (1000 * 60 * 60)
        if (hoursSinceScore < 24) { // Cache for 24 hours
          logger.info('Using cached AI score', { productId, age: hoursSinceScore.toFixed(1) })
          return {
            aiScore: parseFloat(product.aiScore.toString()),
            confidence: product.aiConfidence || 0.8,
            breakdown: product.aiScoreBreakdown as any || {} as AIScoreBreakdown,
            recommendation: this.getRecommendationFromScore(parseFloat(product.aiScore.toString())),
            insights: [],
            strengths: [],
            weaknesses: [],
            scoringVersion: '2.0-96param',
            scoredAt: product.lastScoredAt.toISOString(),
            processingTimeMs: 0
          }
        }
      }

      // ===== STEP 1: Calculate existing 46 parameters =====
      const existingScore = this.calculateExistingParameters(product)

      // ===== STEP 2: Fetch company metrics (25 parameters) =====
      let companyMetrics: CompanyMetrics | null = null
      let companyScore = 50 // Default neutral score

      if (options?.includeCompanyMetrics !== false && product.brand) {
        try {
          // Check if we have cached company metrics
          if (product.companyMetrics && !options?.forceRefresh) {
            companyMetrics = product.companyMetrics as CompanyMetrics
          } else {
            companyMetrics = await companyMetricsService.getCompanyMetrics(product.brand)
          }

          if (companyMetrics) {
            companyScore = calculateCompanyScore(companyMetrics)
          }
        } catch (error) {
          logger.warn('Failed to fetch company metrics', {
            productId,
            brand: product.brand,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // ===== STEP 3: Extract dynamic specs (25 parameters) =====
      let dynamicSpecs: DynamicSpecs = { aiDetectedFeatures: [] }
      let dynamicScore = 50 // Default neutral score

      if (options?.includeDynamicSpecs !== false) {
        try {
          // Check if we already have enriched specs (from parameter enrichment system)
          const existingParamCount = product.dynamicSpecs ? Object.keys(product.dynamicSpecs).length : 0
          const hasEnrichedParams = existingParamCount > 2 // More than just aiDetectedFeatures

          // IMPORTANT: Preserve existing enriched parameters!
          // Only extract new specs if we don't have enriched data already
          if (hasEnrichedParams) {
            logger.info('Using existing enriched parameters', {
              productId,
              paramCount: existingParamCount
            })
            dynamicSpecs = product.dynamicSpecs as DynamicSpecs
          } else if (product.dynamicSpecs && !options?.forceRefresh) {
            // Use cached specs if available and not forcing refresh
            dynamicSpecs = product.dynamicSpecs as DynamicSpecs
          } else {
            // Only extract if we have no enriched data
            logger.info('Extracting dynamic specs', {
              productId
            })
            dynamicSpecs = await dynamicParameterExtractor.extractSpecs(
              product.name,
              product.description,
              product.category as ProductCategory,
              {
                brand: product.brand || undefined,
                price: product.price
              }
            )
          }

          if (dynamicSpecs) {
            dynamicScore = dynamicParameterExtractor.scoreSpecs(
              dynamicSpecs,
              product.category as ProductCategory
            )
          }
        } catch (error) {
          logger.error('Error extracting dynamic specs', {
            productId,
            error: error instanceof Error ? error.message : String(error)
          })
          // Fallback to existing specs if extraction fails
          if (product.dynamicSpecs) {
            dynamicSpecs = product.dynamicSpecs as DynamicSpecs
          }
        }
      }

      // ===== STEP 4: Calculate final weighted score =====
      const weights = this.getWeights(product.category as ProductCategory)
      const breakdown = this.buildScoreBreakdown(
        existingScore,
        companyMetrics,
        companyScore,
        dynamicSpecs,
        dynamicScore
      )

      const finalScore = this.calculateWeightedScore(breakdown, weights)
      const confidence = this.calculateConfidence(product, companyMetrics, dynamicSpecs)
      const recommendation = this.getRecommendation(finalScore, breakdown, confidence)
      const insights = this.generateInsights(product, breakdown, finalScore)
      const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses(breakdown)

      const result: AIScoreResult = {
        aiScore: finalScore,
        confidence,
        breakdown,
        recommendation,
        insights,
        strengths,
        weaknesses,
        scoringVersion: '2.0-96param',
        scoredAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime
      }

      // ===== STEP 5: Save to database =====
      await this.saveScore(productId, result, companyMetrics, dynamicSpecs)

      logger.info('Product scored successfully', {
        productId,
        score: finalScore,
        confidence,
        recommendation,
        processingTime: result.processingTimeMs
      })

      return result
    } catch (error) {
      logger.error('Error scoring product', {
        productId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Calculate scores from existing 46 parameters
   */
  private calculateExistingParameters(product: any): any {
    // Map database product to ProductData interface
    const productData: ProductData = {
      id: product.id,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      condition: product.condition as any,
      sellerId: product.sellerId,
      sellerRating: product.seller?.rating,
      sellerResponseTime: product.seller?.avgResponseTimeHours,
      sellerTotalSales: product.seller?.totalSales,
      rating: this.calculateAverageRating(product.reviews),
      reviewCount: product.reviews?.length || 0,
      recentReviewCount: this.countRecentReviews(product.reviews, 30),
      verifiedPurchaseRatio: this.calculateVerifiedRatio(product.reviews),
      shippingCost: product.shippingCost,
      estimatedDeliveryDays: product.estimatedDeliveryDays,
      hasFreeShipping: product.hasFreeShipping,
      hasFreeReturns: product.hasFreeReturns,
      returnPeriodDays: product.returnPeriodDays,
      hasWarranty: product.hasWarranty,
      isAuthentic: product.isAuthentic,
      certifications: product.certifications,
      inStock: product.isAvailable,
      stockLevel: product.stockQuantity,
      viewsLast24h: this.estimateViews(product),
      salesLast7Days: this.estimateSales(product),
      cartAdditionsLast24h: this.estimateCartAdditions(product),
      sustainability: this.checkSustainability(product),
      marketAveragePrice: product.price * 1.2 // Simplified estimate
    }

    return aiProductScorer.calculateScore(productData)
  }

  /**
   * Build complete score breakdown with all 96 parameters
   */
  private buildScoreBreakdown(
    existingScore: any,
    companyMetrics: CompanyMetrics | null,
    companyScore: number,
    dynamicSpecs: DynamicSpecs,
    dynamicScore: number
  ): AIScoreBreakdown {
    return {
      // Existing 46 parameters
      priceValue: {
        score: existingScore.components.priceValue,
        currentPrice: 0, // Would need to extract from existingScore
        discountPercentage: 0,
        marketAveragePrice: 0,
        priceCompetitiveness: 0,
        freeShippingBonus: 0,
        charmPricingBonus: 0
      },
      trustScore: {
        score: existingScore.components.trustScore,
        sellerRating: 0,
        totalSales: 0,
        responseTimeHours: 0,
        returnPeriodDays: 0,
        freeReturns: false,
        verificationStatus: false,
        accountAge: 0
      },
      qualityScore: {
        score: existingScore.components.qualityScore,
        condition: '',
        hasWarranty: false,
        isAuthentic: false,
        certificationCount: 0,
        brandPremium: 0
      },
      socialProof: {
        score: existingScore.components.socialProof,
        rating: 0,
        reviewCount: 0,
        recentReviewCount: 0,
        verifiedPurchaseRatio: 0,
        socialMediaMentions: 0,
        reviewSentiment: 0
      },
      convenience: {
        score: existingScore.components.convenience,
        estimatedDeliveryDays: 0,
        hasFreeShipping: false,
        hasFastShipping: false,
        hasTracking: false,
        shippingCost: 0,
        inStock: false
      },
      urgency: {
        score: existingScore.components.urgency,
        stockLevel: 0,
        viewsLast24h: 0,
        salesLast7Days: 0,
        cartAdditionsLast24h: 0,
        scarcityMultiplier: 0
      },
      relevance: {
        score: existingScore.components.relevance,
        clickThroughRate: 0,
        conversionRate: 0,
        bounceRate: 0,
        queryMatchScore: 0
      },
      emotional: {
        score: existingScore.components.emotional,
        brandRecognition: 0,
        sustainability: false,
        madeInPreferredCountry: false,
        emotionalAppealScore: 0
      },

      // Company parameters (25)
      companyFinancialHealth: {
        score: companyMetrics ? this.scoreFinancialHealth(companyMetrics) : 50,
        metrics: companyMetrics || {}
      },
      companyGrowth: {
        score: companyMetrics ? this.scoreGrowth(companyMetrics) : 50,
        metrics: companyMetrics || {}
      },
      companySustainability: {
        score: companyMetrics ? this.scoreSustainability(companyMetrics) : 50,
        metrics: companyMetrics || {}
      },
      companySocialResponsibility: {
        score: companyMetrics ? this.scoreSocialResponsibility(companyMetrics) : 50,
        metrics: companyMetrics || {}
      },
      companyRisk: {
        score: companyMetrics ? this.scoreRisk(companyMetrics) : 50,
        metrics: companyMetrics || {}
      },

      // Dynamic parameters (25)
      dynamicProductSpecs: {
        score: dynamicScore,
        category: '',
        specs: dynamicSpecs,
        specScores: this.scoreIndividualSpecs(dynamicSpecs)
      },

      // Metadata
      totalParameters: 96,
      parametersUsed: this.countUsedParameters(existingScore, companyMetrics, dynamicSpecs),
      missingParameters: []
    }
  }

  /**
   * Calculate weighted final score
   */
  private calculateWeightedScore(breakdown: AIScoreBreakdown, weights: ScoringWeights): number {
    // Helper function to safely get score value
    const safeScore = (value: number | undefined | null): number => {
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return value
      }
      return 0 // Default to 0 for invalid values
    }

    let weightedSum = 0
    let totalWeight = 0

    // Existing parameters
    weightedSum += safeScore(breakdown.priceValue.score) * weights.priceValue
    weightedSum += safeScore(breakdown.trustScore.score) * weights.trustScore
    weightedSum += safeScore(breakdown.qualityScore.score) * weights.qualityScore
    weightedSum += safeScore(breakdown.socialProof.score) * weights.socialProof
    weightedSum += safeScore(breakdown.convenience.score) * weights.convenience
    weightedSum += safeScore(breakdown.urgency.score) * weights.urgency
    weightedSum += safeScore(breakdown.relevance.score) * weights.relevance
    weightedSum += safeScore(breakdown.emotional.score) * weights.emotional

    totalWeight += weights.priceValue + weights.trustScore + weights.qualityScore +
                   weights.socialProof + weights.convenience + weights.urgency +
                   weights.relevance + weights.emotional

    // Company parameters
    weightedSum += safeScore(breakdown.companyFinancialHealth.score) * weights.companyFinancialHealth
    weightedSum += safeScore(breakdown.companyGrowth.score) * weights.companyGrowth
    weightedSum += safeScore(breakdown.companySustainability.score) * weights.companySustainability
    weightedSum += safeScore(breakdown.companySocialResponsibility.score) * weights.companySocialResponsibility
    weightedSum += safeScore(breakdown.companyRisk.score) * weights.companyRisk

    totalWeight += weights.companyFinancialHealth + weights.companyGrowth +
                   weights.companySustainability + weights.companySocialResponsibility +
                   weights.companyRisk

    // Dynamic parameters
    weightedSum += safeScore(breakdown.dynamicProductSpecs.score) * weights.dynamicProductSpecs
    totalWeight += weights.dynamicProductSpecs

    const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0

    // Final safeguard
    if (isNaN(finalScore) || !isFinite(finalScore)) {
      logger.warn('Final score calculation resulted in NaN or Infinity', { weightedSum, totalWeight })
      return 0
    }

    return Math.round(finalScore * 100) / 100 // Round to 2 decimals
  }

  /**
   * Get category-specific weights
   */
  private getWeights(category: ProductCategory): ScoringWeights {
    const baseWeights = { ...DEFAULT_WEIGHTS }
    const multipliers = CATEGORY_WEIGHT_MULTIPLIERS[category] || {}

    // Apply category multipliers
    Object.keys(multipliers).forEach(key => {
      const multiplier = multipliers[key as keyof typeof multipliers]
      if (multiplier) {
        baseWeights[key as keyof ScoringWeights] *= multiplier
      }
    })

    // Normalize weights to sum to 1
    const total = Object.values(baseWeights).reduce((sum, w) => sum + w, 0)
    Object.keys(baseWeights).forEach(key => {
      baseWeights[key as keyof ScoringWeights] /= total
    })

    return baseWeights
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    product: any,
    companyMetrics: CompanyMetrics | null,
    dynamicSpecs: DynamicSpecs
  ): number {
    let confidence = 0.5 // Base confidence

    // Data completeness
    if (product.description) confidence += 0.1
    if (product.reviews && product.reviews.length > 10) confidence += 0.1
    if (product.seller) confidence += 0.1
    if (companyMetrics) confidence += 0.1
    if (Object.keys(dynamicSpecs).length > 2) confidence += 0.1

    return Math.min(1.0, confidence)
  }

  /**
   * Generate recommendation
   */
  private getRecommendation(
    score: number,
    breakdown: AIScoreBreakdown,
    confidence: number
  ): 'strong-buy' | 'buy' | 'consider' | 'wait' | 'avoid' {
    if (confidence < 0.5) return score > 60 ? 'consider' : 'wait'

    if (score >= 85) return 'strong-buy'
    if (score >= 70) {
      // Check for red flags
      if (breakdown.trustScore.score < 40 || breakdown.companyRisk.score < 40) {
        return 'consider'
      }
      return 'buy'
    }
    if (score >= 55) return 'consider'
    if (score >= 40) return 'wait'
    return 'avoid'
  }

  /**
   * Generate insights
   */
  private generateInsights(
    product: any,
    breakdown: AIScoreBreakdown,
    score: number
  ): string[] {
    const insights: string[] = []

    if (score >= 80) insights.push(`Excellent overall value with ${score}/100 AI score`)
    if (breakdown.priceValue.score > 75) insights.push('Great price for the quality offered')
    if (breakdown.trustScore.score > 80) insights.push('Highly trusted seller with excellent reputation')
    if (breakdown.companySustainability.score > 75) insights.push('Company has strong sustainability practices')
    if (breakdown.dynamicProductSpecs.score > 75) insights.push('Superior product specifications for this category')
    if (breakdown.urgency.score > 70) insights.push('High demand - product is trending')

    return insights.slice(0, 5) // Limit to 5 insights
  }

  /**
   * Analyze strengths and weaknesses
   */
  private analyzeStrengthsWeaknesses(breakdown: AIScoreBreakdown): {
    strengths: string[]
    weaknesses: string[]
  } {
    const strengths: string[] = []
    const weaknesses: string[] = []

    const scores = [
      { name: 'Price value', score: breakdown.priceValue.score },
      { name: 'Seller trust', score: breakdown.trustScore.score },
      { name: 'Product quality', score: breakdown.qualityScore.score },
      { name: 'Customer reviews', score: breakdown.socialProof.score },
      { name: 'Company sustainability', score: breakdown.companySustainability.score }
    ]

    scores.forEach(item => {
      if (item.score > 75) strengths.push(item.name)
      if (item.score < 40) weaknesses.push(item.name)
    })

    return { strengths, weaknesses }
  }

  /**
   * Save score to database
   */
  private async saveScore(
    productId: string,
    result: AIScoreResult,
    companyMetrics: CompanyMetrics | null,
    dynamicSpecs: DynamicSpecs
  ): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: {
        aiScore: result.aiScore,
        aiScoreBreakdown: result.breakdown as any,
        aiConfidence: result.confidence,
        lastScoredAt: new Date(),
        companyMetrics: companyMetrics as any,
        dynamicSpecs: dynamicSpecs as any
      }
    })
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  }

  private countRecentReviews(reviews: any[], days: number): number {
    if (!reviews) return 0
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return reviews.filter(r => r.createdAt > cutoff).length
  }

  private calculateVerifiedRatio(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0
    const verified = reviews.filter(r => r.isVerifiedPurchase).length
    return verified / reviews.length
  }

  private estimateViews(product: any): number {
    return product.viewCount || 0
  }

  private estimateSales(product: any): number {
    return product.purchaseCount || 0
  }

  private estimateCartAdditions(product: any): number {
    return product.cartAdditionCount || 0
  }

  private checkSustainability(product: any): boolean {
    return product.tags?.includes('sustainable') ||
           product.tags?.includes('eco-friendly') ||
           product.description?.toLowerCase().includes('sustainable') ||
           false
  }

  private scoreFinancialHealth(metrics: CompanyMetrics): number {
    let score = 50
    if (metrics.stockPerformance1y && metrics.stockPerformance1y > 0) score += 15
    if (metrics.profitMargin && metrics.profitMargin > 15) score += 15
    if (metrics.creditRating === 'AAA' || metrics.creditRating === 'AA') score += 20
    return Math.min(100, score)
  }

  private scoreGrowth(metrics: CompanyMetrics): number {
    let score = 50
    if (metrics.revenueGrowth && metrics.revenueGrowth > 10) score += 20
    if (metrics.rdInvestment && metrics.rdInvestment > 10) score += 15
    if (metrics.patentCount && metrics.patentCount > 1000) score += 15
    return Math.min(100, score)
  }

  private scoreSustainability(metrics: CompanyMetrics): number {
    return metrics.esgScore || 50
  }

  private scoreSocialResponsibility(metrics: CompanyMetrics): number {
    let score = 50
    if (metrics.fairLabor && metrics.fairLabor > 70) score += 20
    if (metrics.diversityInclusion && metrics.diversityInclusion > 70) score += 15
    if (metrics.communityInvestment && metrics.communityInvestment > 3) score += 15
    return Math.min(100, score)
  }

  private scoreRisk(metrics: CompanyMetrics): number {
    let score = 100 // Start high, deduct for risks
    if (metrics.legalViolations) score -= metrics.legalViolations * 20
    if (metrics.productRecallRate && metrics.productRecallRate > 1) score -= 20
    return Math.max(0, score)
  }

  private scoreIndividualSpecs(specs: DynamicSpecs): Record<string, number> {
    const scores: Record<string, number> = {}
    Object.keys(specs).forEach(key => {
      scores[key] = 70 // Default score for having the spec
    })
    return scores
  }

  private countUsedParameters(
    existingScore: any,
    companyMetrics: CompanyMetrics | null,
    dynamicSpecs: DynamicSpecs
  ): number {
    let count = 46 // Base existing parameters
    if (companyMetrics) count += Object.keys(companyMetrics).filter(k => companyMetrics[k as keyof CompanyMetrics] !== undefined).length
    count += Object.keys(dynamicSpecs).filter(k => dynamicSpecs[k as keyof DynamicSpecs] !== undefined).length
    return count
  }

  private getRecommendationFromScore(score: number): AIScoreResult['recommendation'] {
    if (score >= 85) return 'strong-buy'
    if (score >= 70) return 'buy'
    if (score >= 55) return 'consider'
    if (score >= 40) return 'wait'
    return 'avoid'
  }
}

// Export singleton instance
export const aiScoringEngine = new AIScoringEngine()
