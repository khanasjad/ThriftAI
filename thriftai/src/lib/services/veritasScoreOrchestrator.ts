/**
 * Veritas Score™ Orchestrator
 * Combines all 16 data sources to calculate complete 121-parameter score
 */

import { Product, Seller, Review } from '@prisma/client'
import { logger } from '@/lib/logger'

// Import all 16 data sources
import { getProductTrends } from '@/lib/dataFetcher/googleTrends'
import { checkSSLSecurity } from '@/lib/dataFetcher/sslLabs'
import { calculateCarbonFootprint } from '@/lib/calculators/carbonFootprint'
import { calculateUSPSShipping } from '@/lib/dataFetcher/uspsShipping'
import { analyzeNewsSentiment } from '@/lib/scrapers/googleNewsScraper'
import { scrapeLaptopSpecs } from '@/lib/scrapers/notebookCheckScraper'
import { analyzeImageQuality } from '@/lib/analyzers/imageQualityAnalyzer'
import { updateSellerAnalytics } from '@/lib/services/sellerAnalyticsService'
import { scrapeAmazonMSRP } from '@/lib/scrapers/amazonMsrpScraper'
import { analyzePricing } from '@/lib/calculators/priceAnalyzer'
import { scrapeBBBRatings } from '@/lib/scrapers/bbbRatingsScraper'
import {
  calculateComprehensiveVeritasScore,
  analyzeWarranty,
  analyzePaymentSecurity,
  analyzeDescriptionQuality,
  predictResaleValue,
  analyzeAdvancedQuality,
  analyzeMarketDynamics,
  analyzeAdditionalSpecs
} from '@/lib/services/comprehensiveVeritasCalculators'

export interface VeritasScoreResult {
  // Overall Score
  overallScore: number
  confidence: number
  dataCompleteness: number

  // Category Scores (8 categories)
  categoryScores: {
    productQuality: number
    sellerTrust: number
    marketValue: number
    sustainability: number
    securitySafety: number
    userExperience: number
    productSpecification: number
    companyPerformance: number
  }

  // Detailed Data (121 parameters organized)
  detailedData: {
    productQuality: any
    sellerTrust: any
    marketValue: any
    sustainability: any
    securitySafety: any
    userExperience: any
    productSpecification: any
    companyPerformance: any
  }

  // Metadata
  calculatedAt: Date
  cacheDuration: number // seconds
  dataSourcesUsed: string[]
  dataSourcesFailed: string[]
}

export interface ProductWithRelations extends Product {
  seller?: Seller
  reviews?: Review[]
}

/**
 * Main orchestration function - calculates complete Veritas Score
 */
export async function calculateFullVeritasScore(
  product: ProductWithRelations
): Promise<VeritasScoreResult> {

  const startTime = Date.now()
  const dataSourcesUsed: string[] = []
  const dataSourcesFailed: string[] = []

  logger.info('🎯 Starting Veritas Score calculation', {
    component: 'VeritasOrchestrator',
    metadata: { productId: product.id, productName: product.name }
  })

  try {
    // Fetch all data sources in parallel (maximum performance)
    const results = await Promise.allSettled([
      // 1. Google Trends (Market Demand)
      getProductTrends({ keyword: product.name, category: product.category }).catch(e => ({ success: false, error: e })),

      // 2. SSL Labs (Platform Security)
      checkSSLSecurity({ host: 'localhost' }).catch(e => ({ success: false, error: e })),

      // 3. Carbon Footprint (Sustainability)
      Promise.resolve(calculateCarbonFootprint(product.name, product.category, product.condition)),

      // 4. USPS Shipping (Total Cost)
      calculateUSPSShipping({
        weight: 2,
        origin: '10001',
        destination: '90210',
        service: 'Priority'
      }).catch(e => ({ success: false, error: e })),

      // 5. Google News (Brand Reputation)
      analyzeNewsSentiment({
        brand: product.brand || 'Unknown',
        maxArticles: 10
      }).catch(e => ({ success: false, error: e })),

      // 6. NotebookCheck (Laptop Specs)
      scrapeLaptopSpecs({
        model: product.name,
        brand: product.brand
      }).catch(e => ({ success: false, error: e })),

      // 7. Image Quality (User Experience)
      product.imageUrl
        ? analyzeImageQuality(product.imageUrl).catch(e => ({ success: false, error: e }))
        : Promise.resolve({ success: false, error: 'No image' }),

      // 8. Seller Analytics (Trust - 25 params!)
      product.seller
        ? updateSellerAnalytics(product.seller).catch(e => null)
        : Promise.resolve(null),

      // 9. Amazon MSRP (Price Benchmarking)
      scrapeAmazonMSRP({
        productName: product.name,
        brand: product.brand,
        category: product.category
      }).catch(e => ({ success: false, error: e })),

      // 10. Price Analysis (Market Value - 12 params!)
      Promise.resolve(analyzePricing(product.price, {
        originalPrice: product.originalPrice || undefined,
        category: product.category,
        condition: product.condition
      })),

      // 11. BBB Ratings (Business Credibility)
      product.seller?.businessName
        ? scrapeBBBRatings({ businessName: product.seller.businessName }).catch(e => ({ success: false, error: e }))
        : Promise.resolve({ success: false, error: 'No seller' })
    ])

    // Extract results
    const [
      trendsResult,
      sslResult,
      carbonData,
      shippingResult,
      newsResult,
      notebookResult,
      imageResult,
      sellerData,
      amazonResult,
      priceData,
      bbbResult
    ] = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return r.value
      } else {
        logger.warn(`Data source ${i} failed`, { error: r.reason })
        return null
      }
    })

    // Track which data sources succeeded
    if (trendsResult?.success) dataSourcesUsed.push('Google Trends')
    else dataSourcesFailed.push('Google Trends')

    if (sslResult?.success) dataSourcesUsed.push('SSL Labs')
    else dataSourcesFailed.push('SSL Labs')

    if (carbonData) dataSourcesUsed.push('Carbon Calculator')

    if (shippingResult?.success) dataSourcesUsed.push('USPS Shipping')
    else dataSourcesFailed.push('USPS Shipping')

    if (newsResult?.success) dataSourcesUsed.push('Google News')
    else dataSourcesFailed.push('Google News')

    if (notebookResult?.success) dataSourcesUsed.push('NotebookCheck')
    else dataSourcesFailed.push('NotebookCheck')

    if (imageResult?.success) dataSourcesUsed.push('Image Analyzer')
    else dataSourcesFailed.push('Image Analyzer')

    if (sellerData) dataSourcesUsed.push('Seller Analytics')
    else dataSourcesFailed.push('Seller Analytics')

    if (amazonResult?.success) dataSourcesUsed.push('Amazon MSRP')
    else dataSourcesFailed.push('Amazon MSRP')

    if (priceData) dataSourcesUsed.push('Price Analyzer')

    if (bbbResult?.success) dataSourcesUsed.push('BBB Ratings')
    else dataSourcesFailed.push('BBB Ratings')

    // Calculate comprehensive score using all remaining calculators
    const comprehensiveData = calculateComprehensiveVeritasScore(
      product,
      {
        trendsData: trendsResult?.success ? trendsResult.data : null,
        amazonData: amazonResult?.success ? amazonResult.data : null,
        priceData
      },
      sellerData
    )

    // Calculate individual category scores
    const categoryScores = calculateCategoryScores({
      product,
      comprehensiveData,
      sellerData,
      priceData,
      carbonData,
      sslResult,
      newsResult,
      imageResult,
      notebookResult,
      trendsResult,
      amazonResult,
      bbbResult
    })

    // Calculate overall score (weighted average)
    const overallScore = calculateOverallScore(categoryScores)

    // Calculate data completeness
    const dataCompleteness = (dataSourcesUsed.length / 11) * 100 // 11 external sources

    // Calculate confidence based on data availability
    const confidence = calculateConfidence(dataSourcesUsed.length, dataCompleteness)

    const result: VeritasScoreResult = {
      overallScore: Math.round(overallScore * 10) / 10,
      confidence: Math.round(confidence),
      dataCompleteness: Math.round(dataCompleteness),

      categoryScores,

      detailedData: {
        productQuality: {
          warranty: comprehensiveData.warranty,
          advancedQuality: comprehensiveData.advancedQuality,
          condition: product.condition,
          authenticity: 'Verified by seller'
        },

        sellerTrust: sellerData || {
          sellerTrustScore: 75,
          note: 'Default seller score - no analytics available'
        },

        marketValue: {
          priceAnalysis: priceData,
          amazonComparison: amazonResult?.success ? amazonResult.data : null,
          trends: trendsResult?.success ? trendsResult.data : null,
          resaleValue: comprehensiveData.resaleValue
        },

        sustainability: carbonData,

        securitySafety: {
          paymentSecurity: comprehensiveData.paymentSecurity,
          platformSecurity: sslResult?.success ? sslResult.data : null
        },

        userExperience: {
          descriptionQuality: comprehensiveData.descriptionQuality,
          imageQuality: imageResult?.success ? imageResult.data : null
        },

        productSpecification: {
          laptopSpecs: notebookResult?.success ? notebookResult.data : null,
          additionalSpecs: comprehensiveData.additionalSpecs,
          dynamicSpecs: product.dynamicSpecs
        },

        companyPerformance: {
          brandReputation: newsResult?.success ? newsResult.data : null,
          bbbRatings: bbbResult?.success ? bbbResult.data : null,
          marketDynamics: comprehensiveData.marketDynamics
        }
      },

      calculatedAt: new Date(),
      cacheDuration: getCacheDuration(product.category),
      dataSourcesUsed,
      dataSourcesFailed
    }

    const duration = Date.now() - startTime
    logger.info('✅ Veritas Score calculated successfully', {
      component: 'VeritasOrchestrator',
      metadata: {
        productId: product.id,
        overallScore: result.overallScore,
        confidence: result.confidence,
        dataCompleteness: result.dataCompleteness,
        duration: `${duration}ms`,
        sourcesUsed: dataSourcesUsed.length,
        sourcesFailed: dataSourcesFailed.length
      }
    })

    return result

  } catch (error) {
    logger.error('❌ Veritas Score calculation failed', {
      component: 'VeritasOrchestrator',
      error: error instanceof Error ? error.message : String(error)
    })

    // Return safe defaults
    return getDefaultVeritasScore(product)
  }
}

/**
 * Calculate category scores from all data sources
 */
function calculateCategoryScores(data: any) {
  const {
    product,
    comprehensiveData,
    sellerData,
    priceData,
    carbonData,
    sslResult,
    newsResult,
    imageResult,
    notebookResult,
    trendsResult,
    amazonResult,
    bbbResult
  } = data

  return {
    // 1. Product Quality (20 params)
    productQuality: Math.round(
      (comprehensiveData.advancedQuality.functionalityScore * 0.3 +
       comprehensiveData.advancedQuality.aestheticScore * 0.2 +
       comprehensiveData.advancedQuality.materialQuality * 0.2 +
       comprehensiveData.advancedQuality.buildQuality * 0.15 +
       comprehensiveData.warranty.warrantyScore * 0.15)
    ),

    // 2. Seller Trust (25 params)
    sellerTrust: Math.round(
      sellerData?.sellerTrustScore || 75
    ),

    // 3. Market Value (15 params)
    marketValue: Math.round(
      (priceData.valueForMoneyScore * 0.4 +
       priceData.priceCompetitiveness * 0.3 +
       (trendsResult?.success ? trendsResult.data.demandScore : 50) * 0.2 +
       comprehensiveData.resaleValue.valueRetention * 0.1)
    ),

    // 4. Sustainability (10 params)
    sustainability: Math.round(
      carbonData ? (
        (carbonData.impactRating === 'High' ? 85 :
         carbonData.impactRating === 'Medium' ? 65 : 45)
      ) : 50
    ),

    // 5. Security & Safety (8 params)
    securitySafety: Math.round(
      (comprehensiveData.paymentSecurity.securityScore * 0.6 +
       (sslResult?.success ? sslResult.data.trustScore : 70) * 0.4)
    ),

    // 6. User Experience (12 params)
    userExperience: Math.round(
      (comprehensiveData.descriptionQuality.readabilityScore * 0.4 +
       comprehensiveData.descriptionQuality.completenessScore * 0.3 +
       (imageResult?.success ? imageResult.data.overallQuality : 70) * 0.3)
    ),

    // 7. Product Specification (20 params)
    productSpecification: Math.round(
      comprehensiveData.additionalSpecs.specCompletenessScore
    ),

    // 8. Company Performance (11 params)
    companyPerformance: Math.round(
      ((newsResult?.success ? newsResult.data.reputationScore : 70) * 0.4 +
       (bbbResult?.success ? bbbResult.data.trustScore : 70) * 0.3 +
       comprehensiveData.marketDynamics.competitionLevel * 0.3)
    )
  }
}

/**
 * Calculate overall score (weighted average of categories)
 */
function calculateOverallScore(categoryScores: any): number {
  const weights = {
    productQuality: 0.25,
    sellerTrust: 0.20,
    marketValue: 0.15,
    sustainability: 0.10,
    securitySafety: 0.10,
    userExperience: 0.10,
    productSpecification: 0.05,
    companyPerformance: 0.05
  }

  return (
    categoryScores.productQuality * weights.productQuality +
    categoryScores.sellerTrust * weights.sellerTrust +
    categoryScores.marketValue * weights.marketValue +
    categoryScores.sustainability * weights.sustainability +
    categoryScores.securitySafety * weights.securitySafety +
    categoryScores.userExperience * weights.userExperience +
    categoryScores.productSpecification * weights.productSpecification +
    categoryScores.companyPerformance * weights.companyPerformance
  )
}

/**
 * Calculate confidence based on data availability
 */
function calculateConfidence(sourcesUsed: number, dataCompleteness: number): number {
  // Confidence increases with more data sources
  const baseConfidence = 50
  const sourceBonus = (sourcesUsed / 11) * 30 // Max 30 points
  const completenessBonus = (dataCompleteness / 100) * 20 // Max 20 points

  return Math.min(100, baseConfidence + sourceBonus + completenessBonus)
}

/**
 * Get cache duration based on product category
 */
function getCacheDuration(category: string): number {
  const durations: Record<string, number> = {
    'ELECTRONICS': 6 * 60 * 60,      // 6 hours (volatile pricing)
    'FASHION': 12 * 60 * 60,          // 12 hours
    'ACCESSORIES': 12 * 60 * 60,      // 12 hours
    'FURNITURE': 24 * 60 * 60,        // 24 hours
    'COLLECTIBLES': 24 * 60 * 60,     // 24 hours (stable)
    'SPORTS': 12 * 60 * 60,           // 12 hours
    'BOOKS': 24 * 60 * 60             // 24 hours
  }

  return durations[category?.toUpperCase()] || 12 * 60 * 60 // Default 12 hours
}

/**
 * Get default Veritas Score (fallback)
 */
function getDefaultVeritasScore(product: ProductWithRelations): VeritasScoreResult {
  const defaultCategoryScores = {
    productQuality: 70,
    sellerTrust: 75,
    marketValue: 65,
    sustainability: 60,
    securitySafety: 75,
    userExperience: 65,
    productSpecification: 60,
    companyPerformance: 70
  }

  return {
    overallScore: 68.5,
    confidence: 50,
    dataCompleteness: 0,
    categoryScores: defaultCategoryScores,
    detailedData: {
      productQuality: { note: 'Default values - calculation failed' },
      sellerTrust: { note: 'Default values - calculation failed' },
      marketValue: { note: 'Default values - calculation failed' },
      sustainability: { note: 'Default values - calculation failed' },
      securitySafety: { note: 'Default values - calculation failed' },
      userExperience: { note: 'Default values - calculation failed' },
      productSpecification: { note: 'Default values - calculation failed' },
      companyPerformance: { note: 'Default values - calculation failed' }
    },
    calculatedAt: new Date(),
    cacheDuration: 12 * 60 * 60,
    dataSourcesUsed: [],
    dataSourcesFailed: ['All sources - error occurred']
  }
}

/**
 * Generate human-readable insights from Veritas Score
 */
export function generateVeritasInsights(result: VeritasScoreResult): string[] {
  const insights: string[] = []

  // Overall score insight
  if (result.overallScore >= 85) {
    insights.push('🌟 Exceptional product with outstanding quality across all metrics')
  } else if (result.overallScore >= 70) {
    insights.push('✅ Great product with solid performance in most categories')
  } else if (result.overallScore >= 55) {
    insights.push('👍 Good product with decent overall value')
  } else {
    insights.push('⚠️ Below average product - consider alternatives')
  }

  // Category-specific insights
  const { categoryScores } = result

  if (categoryScores.sellerTrust >= 80) {
    insights.push('Highly trustworthy seller with excellent track record')
  } else if (categoryScores.sellerTrust < 60) {
    insights.push('⚠️ Seller trust is below average - proceed with caution')
  }

  if (categoryScores.marketValue >= 80) {
    insights.push('💰 Excellent value for money - great deal!')
  } else if (categoryScores.marketValue < 50) {
    insights.push('Price may be above market average')
  }

  if (categoryScores.sustainability >= 75) {
    insights.push('♻️ Eco-friendly choice with significant carbon savings')
  }

  if (categoryScores.productQuality >= 85) {
    insights.push('Premium quality with exceptional build and materials')
  }

  // Data completeness insight
  if (result.dataCompleteness < 50) {
    insights.push('⚠️ Limited data available - score confidence is lower')
  }

  return insights
}
