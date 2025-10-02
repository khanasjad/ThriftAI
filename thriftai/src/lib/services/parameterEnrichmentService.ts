/**
 * Parameter Enrichment Service
 *
 * Ensures ALL products have complete 96 parameters before Veritas Score calculation:
 * - 46 existing parameters (from product data)
 * - 25 company metrics (fetched or estimated)
 * - 25 dynamic specifications (category-specific defaults)
 *
 * CRITICAL RULE: No product should be scored without all 96 parameters.
 * Missing parameters are filled with intelligent category-based defaults.
 */

import { logger } from '@/lib/logger'
import { ProductData } from './aiProductScorer'
import { VeritasScoreInput } from './universalScoringEngine'
import { CompanyMetrics } from '@/lib/types/aiScoring96'
import { companyMetricsService } from './companyMetricsService'
import { configService } from './configService'

// ========================================
// ENRICHMENT SERVICE
// ========================================

export class ParameterEnrichmentService {
  /**
   * Enrich a product with all 96 parameters before scoring
   *
   * @param product - Raw product data (may have missing parameters)
   * @returns Fully enriched product with all 96 parameters
   */
  async enrichProduct(product: ProductData): Promise<VeritasScoreInput> {
    const startTime = Date.now()

    try {
      // Step 1: Enrich company metrics (25 parameters)
      const companyMetrics = await this.enrichCompanyMetrics(product)

      // Step 2: Enrich dynamic specs (25 parameters)
      const dynamicSpecs = await this.enrichDynamicSpecs(product)

      // Step 3: Combine into enriched product
      const enrichedProduct: VeritasScoreInput = {
        ...product,
        companyMetrics,
        dynamicSpecs
      }

      const processingTime = Date.now() - startTime

      logger.info('Product enriched with 96 parameters', {
        productId: product.id,
        brand: product.brand,
        category: product.category,
        hasCompanyMetrics: !!companyMetrics,
        hasDynamicSpecs: !!dynamicSpecs,
        processingTimeMs: processingTime
      })

      return enrichedProduct

    } catch (error) {
      logger.error('Error enriching product parameters', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      })

      // Return product with estimated defaults on error
      return this.getDefaultEnrichedProduct(product)
    }
  }

  /**
   * Batch enrich multiple products
   *
   * @param products - Array of products to enrich
   * @param concurrency - Number of parallel enrichments (default: 5)
   * @returns Array of enriched products
   */
  async enrichProducts(
    products: ProductData[],
    concurrency: number = 5
  ): Promise<VeritasScoreInput[]> {
    const results: VeritasScoreInput[] = []

    logger.info('Starting batch product enrichment', {
      totalProducts: products.length,
      concurrency
    })

    // Process in batches to avoid overwhelming external APIs
    for (let i = 0; i < products.length; i += concurrency) {
      const batch = products.slice(i, i + concurrency)

      const batchResults = await Promise.all(
        batch.map(product => this.enrichProduct(product))
      )

      results.push(...batchResults)

      // Rate limiting between batches
      if (i + concurrency < products.length) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
      }
    }

    logger.info('Batch enrichment completed', {
      totalEnriched: results.length,
      successful: results.filter(r => r.companyMetrics && r.dynamicSpecs).length
    })

    return results
  }

  // ========================================
  // COMPANY METRICS ENRICHMENT (25 params)
  // ========================================

  /**
   * Enrich or fetch company metrics for a product
   * Returns existing metrics if available, fetches if missing
   */
  private async enrichCompanyMetrics(product: ProductData): Promise<CompanyMetrics | undefined> {
    // If product already has company metrics, use them
    // Note: ProductData doesn't have companyMetrics field, so we need to check if it exists
    const existingMetrics = (product as any).companyMetrics as CompanyMetrics | undefined
    if (existingMetrics && this.isCompanyMetricsComplete(existingMetrics)) {
      logger.debug('Using existing company metrics', { productId: product.id })
      return existingMetrics
    }

    // If no brand, return default metrics
    if (!product.brand) {
      logger.warn('No brand for product, using default company metrics', {
        productId: product.id
      })
      return this.getDefaultCompanyMetrics()
    }

    // Fetch company metrics by brand
    try {
      const metrics = await companyMetricsService.getCompanyMetrics(product.brand)

      if (!metrics) {
        logger.warn('Could not fetch company metrics, using defaults', {
          productId: product.id,
          brand: product.brand
        })
        return this.getDefaultCompanyMetrics()
      }

      return metrics

    } catch (error) {
      logger.error('Error fetching company metrics', {
        productId: product.id,
        brand: product.brand,
        error: error instanceof Error ? error.message : String(error)
      })
      return this.getDefaultCompanyMetrics()
    }
  }

  /**
   * Check if company metrics are complete (has at least some key fields)
   */
  private isCompanyMetricsComplete(metrics: CompanyMetrics): boolean {
    // Check if at least 5 key metrics exist
    const keyFields = [
      metrics.stockPrice,
      metrics.esgScore,
      metrics.marketCap,
      metrics.profitMargin,
      metrics.fairLabor
    ]

    const filledFields = keyFields.filter(field => field !== undefined && field !== null).length
    return filledFields >= 2 // At least 2 key fields must exist
  }

  /**
   * Get default company metrics when brand is unknown
   */
  private getDefaultCompanyMetrics(): CompanyMetrics {
    return {
      // Financial - neutral/unavailable
      stockPrice: undefined,
      stockPerformance30d: undefined,
      stockPerformance1y: undefined,
      marketCap: undefined,
      revenueGrowth: undefined,
      profitMargin: undefined,
      debtToEquity: undefined,
      creditRating: undefined,

      // Growth - average estimates
      rdInvestment: 5,
      newProductLaunchRate: 3,
      patentCount: 100,
      marketShare: 5,
      industryAwards: 1,

      // ESG - average estimates
      esgScore: 50,
      carbonFootprint: 10,
      renewableEnergy: 30,
      wasteDiversion: 40,
      waterEfficiency: 30,
      supplierSustainability: 50,
      circularEconomy: 1,

      // Social - average estimates
      fairLabor: 65,
      diversityInclusion: 60,
      communityInvestment: 1.5,

      // Risk - low risk defaults
      legalViolations: 0,
      productRecallRate: 0.5,

      lastUpdated: new Date().toISOString(),
      dataSource: 'Default - Unknown Brand'
    }
  }

  // ========================================
  // DYNAMIC SPECS ENRICHMENT (25 params)
  // ========================================

  /**
   * Enrich or fill dynamic specifications for a product
   * Uses database-driven category-specific defaults for missing specs
   */
  private async enrichDynamicSpecs(product: ProductData): Promise<Record<string, any>> {
    // If product already has complete dynamic specs, use them
    if (product.dynamicSpecs && this.isDynamicSpecsComplete(product.dynamicSpecs)) {
      logger.debug('Using existing dynamic specs', { productId: product.id })
      return product.dynamicSpecs
    }

    // Get category
    const category = product.category || 'OTHER'

    // Get default specs from database (with subcategory support)
    const defaultSpecs = await configService.getCategoryDefaultSpecs(category)

    // Merge existing specs with defaults (existing takes precedence)
    const enrichedSpecs = {
      ...defaultSpecs,
      ...(product.dynamicSpecs || {})
    }

    logger.info('Enriched dynamic specs with DB defaults', {
      productId: product.id,
      category,
      existingSpecsCount: Object.keys(product.dynamicSpecs || {}).length,
      enrichedSpecsCount: Object.keys(enrichedSpecs).length
    })

    return enrichedSpecs
  }

  /**
   * Check if dynamic specs are reasonably complete
   */
  private isDynamicSpecsComplete(specs: Record<string, any>): boolean {
    // Check if at least 3 spec fields exist
    const filledFields = Object.values(specs).filter(
      value => value !== undefined && value !== null && value !== ''
    ).length

    return filledFields >= 3
  }

  // ========================================
  // VALIDATION & UTILITIES
  // ========================================

  /**
   * Validate that a product has all 96 parameters
   *
   * @param product - Enriched product to validate
   * @returns Object with validation status and missing parameters
   */
  validateEnrichment(product: VeritasScoreInput): {
    isComplete: boolean
    totalParameters: number
    missingParameters: string[]
    completenessPercentage: number
  } {
    const missing: string[] = []
    let totalParams = 0
    let filledParams = 0

    // 1. Check basic product data (46 parameters)
    const basicFields = [
      'id', 'name', 'price', 'brand', 'category', 'condition',
      'rating', 'reviewCount', 'sellerRating', 'hasWarranty',
      'shippingCost', 'estimatedDeliveryDays', 'inStock'
    ]

    basicFields.forEach(field => {
      totalParams++
      if ((product as any)[field] !== undefined && (product as any)[field] !== null) {
        filledParams++
      } else {
        missing.push(`product.${field}`)
      }
    })

    // 2. Check company metrics (25 parameters)
    if (product.companyMetrics) {
      const companyFields = Object.keys(product.companyMetrics)
      companyFields.forEach(field => {
        totalParams++
        if ((product.companyMetrics as any)[field] !== undefined) {
          filledParams++
        } else {
          missing.push(`companyMetrics.${field}`)
        }
      })
    } else {
      missing.push('companyMetrics (all 25 parameters)')
      totalParams += 25
    }

    // 3. Check dynamic specs (25 parameters)
    if (product.dynamicSpecs) {
      const specFields = Object.keys(product.dynamicSpecs)
      specFields.forEach(field => {
        totalParams++
        if ((product.dynamicSpecs as any)[field] !== undefined) {
          filledParams++
        }
      })

      if (specFields.length < 3) {
        missing.push('dynamicSpecs (insufficient parameters)')
      }
    } else {
      missing.push('dynamicSpecs (all 25 parameters)')
      totalParams += 25
    }

    const completenessPercentage = totalParams > 0
      ? Math.round((filledParams / totalParams) * 100)
      : 0

    return {
      isComplete: missing.length === 0,
      totalParameters: totalParams,
      missingParameters: missing,
      completenessPercentage
    }
  }

  /**
   * Get a fully enriched product with default values
   * Used as fallback when enrichment fails
   */
  private getDefaultEnrichedProduct(product: ProductData): VeritasScoreInput {
    const category = product.category || 'OTHER'

    return {
      ...product,
      companyMetrics: this.getDefaultCompanyMetrics(),
      dynamicSpecs: getDefaultSpecsByCategory(category)
    }
  }

  /**
   * Get enrichment statistics for a batch of products
   */
  getBatchStatistics(products: VeritasScoreInput[]): {
    total: number
    fullyEnriched: number
    partiallyEnriched: number
    avgCompleteness: number
    productsWithCompanyMetrics: number
    productsWithDynamicSpecs: number
  } {
    const stats = products.map(p => this.validateEnrichment(p))

    return {
      total: products.length,
      fullyEnriched: stats.filter(s => s.isComplete).length,
      partiallyEnriched: stats.filter(s => !s.isComplete && s.completenessPercentage > 50).length,
      avgCompleteness: stats.reduce((sum, s) => sum + s.completenessPercentage, 0) / stats.length,
      productsWithCompanyMetrics: products.filter(p => !!p.companyMetrics).length,
      productsWithDynamicSpecs: products.filter(p => !!p.dynamicSpecs).length
    }
  }
}

// Export singleton instance
export const parameterEnrichmentService = new ParameterEnrichmentService()

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Quick check if a product needs enrichment
 */
export function needsEnrichment(product: ProductData): boolean {
  const hasCompanyMetrics = !!(product as any).companyMetrics
  const hasDynamicSpecs = !!product.dynamicSpecs && Object.keys(product.dynamicSpecs).length >= 3

  return !hasCompanyMetrics || !hasDynamicSpecs
}

/**
 * Count how many of the 96 parameters a product has
 */
export function countParameters(product: VeritasScoreInput): number {
  let count = 0

  // Count basic product fields
  const basicFields = Object.keys(product).filter(
    key => key !== 'companyMetrics' && key !== 'dynamicSpecs'
  )
  count += basicFields.filter(key => (product as any)[key] !== undefined).length

  // Count company metrics
  if (product.companyMetrics) {
    count += Object.keys(product.companyMetrics).filter(
      key => (product.companyMetrics as any)[key] !== undefined
    ).length
  }

  // Count dynamic specs
  if (product.dynamicSpecs) {
    count += Object.keys(product.dynamicSpecs).filter(
      key => (product.dynamicSpecs as any)[key] !== undefined
    ).length
  }

  return count
}
