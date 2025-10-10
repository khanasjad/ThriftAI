/**
 * Veritas Score™ Calculation API
 * POST /api/veritas/calculate
 *
 * Enterprise-grade endpoint for calculating product Veritas Scores
 * Implements all 121 parameters with real data sources
 *
 * @version 2.0.0
 * @author ThriftAI Team
 */

import { NextRequest, NextResponse } from 'next/server'
import { veritasScoreCalculator } from '@/lib/services/veritas/VeritasScoreCalculator'
import type { VeritasScoreInput } from '@/lib/services/veritas/types'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

/**
 * Default value generators for each category
 * Used when user doesn't provide full parameter set
 */
function getDefaultProductQuality() {
  return {
    physicalCondition: {
      overallCondition: 'Good' as const,
      visualDefectsCount: 0,
      visualDefectsDescription: '',
      functionalCompleteness: 100,
      wearTearLevel: 3,
      missingComponents: [],
      materialQuality: 80,
    },
    authenticity: {
      authenticationStatus: 'Unverified' as const,
      serialNumberValid: false,
      counterfeitRiskScore: 70,
      documentationComplete: false,
      certificationBadges: [],
      hasOriginalPackaging: false,
      hasOriginalAccessories: false,
    },
    functionalTesting: {
      hardwareFunctionality: 90,
      softwarePerformance: 90,
      networkConnectivity: 100,
      displayTestResult: 100,
      sensorFunctionality: 100,
    },
    ageHistory: {
      ageInMonths: 12,
      previousOwners: 1,
      usageIntensity: 'Moderate' as const,
      maintenanceHistory: 'Unknown' as const,
      storageConditions: 'Good' as const,
    },
  }
}

function getDefaultSellerTrust() {
  return {
    reputation: {
      sellerRating: 4.0,
      totalReviews: 100,
      positivePercentage: 85,
      verifiedSeller: false,
      yearsActive: 2,
      platformBadges: [],
    },
    transactionHistory: {
      totalSales: 100,
      completionRate: 95,
      averageShippingTime: 3,
      returnRate: 5,
      disputeRate: 1,
    },
    verification: {
      identityVerified: false,
      businessRegistered: false,
      taxCompliant: false,
      paymentMethodsSecure: true,
    },
    customerService: {
      responseTimeHours: 24,
      resolutionRate: 90,
      communicationQuality: 4.0,
      refundPolicy: 'Standard' as const,
    },
  }
}

function getDefaultMarketValue() {
  return {
    pricing: {
      currentPrice: 0,
      originalMSRP: 0,
      averageMarketPrice: 0,
      pricePercentile: 50,
      priceTrend: 'Stable' as const,
    },
    comparison: {
      competitorPrices: [],
      similarListings: 0,
      priceDifferencePercent: 0,
      valueScore: 70,
    },
    depreciation: {
      depreciationRate: 20,
      expectedLifespan: 60,
      resaleValueProjection: 0,
    },
    demand: {
      viewsCount: 0,
      watchersCount: 0,
      timeOnMarket: 7,
      demandScore: 50,
    },
  }
}

function getDefaultSustainability() {
  return {
    environmental: {
      carbonFootprintKg: 50,
      recyclablePercentage: 60,
      energyEfficiencyRating: 'Unknown' as const,
      sustainableMaterials: false,
      eWasteReduction: 70,
    },
    circular: {
      refurbishability: 70,
      repairability: 70,
      recyclingEaseScore: 60,
      secondLifePotential: 80,
    },
    certifications: {
      energyStarCertified: false,
      epeatRating: 'None' as const,
      sustainabilityCertifications: [],
    },
  }
}

function getDefaultSecuritySafety() {
  return {
    dataPrivacy: {
      dataWipedProperly: false,
      encryptionCapable: true,
      privacyRiskScore: 70,
    },
    productSafety: {
      recallStatus: 'No Recall' as const,
      safetyTestsPassed: true,
      hazardousMaterials: false,
      childSafetyCompliant: true,
    },
  }
}

function getDefaultUserExperience() {
  return {
    listing: {
      photoQuality: 70,
      descriptionCompleteness: 70,
      accuracyScore: 80,
      informationClarity: 75,
    },
    purchase: {
      checkoutExperience: 80,
      shippingOptions: 3,
      paymentSecurity: 90,
      customerSupportQuality: 75,
    },
  }
}

function getDefaultProductSpecification() {
  return {
    technical: {
      specificationAccuracy: 80,
      performanceBenchmarks: {},
      compatibilityScore: 80,
      technologyGeneration: 'Current' as const,
    },
    documentation: {
      manualAvailable: false,
      technicalSupport: false,
      warrantyDocument: false,
      setupGuide: false,
    },
  }
}

function getDefaultCompanyPerformance() {
  return {
    brand: {
      brandReputation: 80,
      marketShare: 10,
      innovationScore: 70,
    },
    financial: {
      stockPerformance: 0,
      financialStability: 'Unknown' as const,
      marketCap: 0,
    },
  }
}

/**
 * POST /api/veritas/calculate
 * Calculate Veritas Score for a product
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.productName || !body.brand || !body.category) {
      logger.warn('Veritas API: Missing required fields', {
        component: 'VeritasAPI',
        metadata: { body },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Required fields: productName, brand, category',
        },
        { status: 400 }
      )
    }

    // Build complete input with defaults
    const input: VeritasScoreInput = {
      productName: body.productName,
      brand: body.brand,
      category: body.category,
      condition: body.condition || 'Good',
      serialNumber: body.serialNumber,
      serviceTag: body.serviceTag,
      asin: body.asin,

      // Merge user data with defaults for all 8 categories
      productQuality: {
        ...getDefaultProductQuality(),
        ...(body.productQuality || {}),
      },
      sellerTrust: {
        ...getDefaultSellerTrust(),
        ...(body.sellerTrust || {}),
      },
      marketValue: {
        ...getDefaultMarketValue(),
        ...(body.marketValue || {}),
        pricing: {
          ...getDefaultMarketValue().pricing,
          currentPrice: body.price || body.marketValue?.pricing?.currentPrice || 0,
          ...(body.marketValue?.pricing || {}),
        },
      },
      sustainability: {
        ...getDefaultSustainability(),
        ...(body.sustainability || {}),
      },
      securitySafety: {
        ...getDefaultSecuritySafety(),
        ...(body.securitySafety || {}),
      },
      userExperience: {
        ...getDefaultUserExperience(),
        ...(body.userExperience || {}),
      },
      productSpecification: {
        ...getDefaultProductSpecification(),
        ...(body.productSpecification || {}),
      },
      companyPerformance: {
        ...getDefaultCompanyPerformance(),
        ...(body.companyPerformance || {}),
      },
    }

    logger.info('Starting Veritas Score calculation via API', {
      component: 'VeritasAPI',
      metadata: {
        product: input.productName,
        brand: input.brand,
        category: input.category,
        hasSerialNumber: !!input.serialNumber,
      },
    })

    // Calculate Veritas Score using enterprise calculator
    const result = await veritasScoreCalculator.calculate(input)

    logger.info('Veritas Score calculation completed', {
      component: 'VeritasAPI',
      metadata: {
        score: result.overallScore,
        grade: result.grade,
        processingTimeMs: result.metadata.processingTimeMs,
        dataSources: result.metadata.dataSources.length,
      },
    })

    // Store in database if productId provided
    if (body.productId) {
      try {
        // Upsert main Veritas Score record
        const veritasScoreRecord = await prisma.veritasScore.upsert({
          where: { productId: body.productId },
          create: {
            productId: body.productId,
            ssn: result.ssn,
            overallScore: result.overallScore,
            confidence: result.metadata.overallConfidence,
            dataQualityScore: result.metadata.overallDataQuality,
            calculatedAt: new Date(),
            missingDataFields: [], // TODO: populate from result
          },
          update: {
            ssn: result.ssn,
            overallScore: result.overallScore,
            confidence: result.metadata.overallConfidence,
            dataQualityScore: result.metadata.overallDataQuality,
            lastUpdatedAt: new Date(),
          },
        })

        // Save category scores
        const categoryRecords = [
          { name: 'PRODUCT_QUALITY', data: result.categories.productQuality },
          { name: 'SELLER_TRUST', data: result.categories.sellerTrust },
          { name: 'MARKET_VALUE', data: result.categories.marketValue },
          { name: 'SUSTAINABILITY', data: result.categories.sustainability },
          { name: 'SECURITY_SAFETY', data: result.categories.securitySafety },
          { name: 'USER_EXPERIENCE', data: result.categories.userExperience },
          { name: 'PRODUCT_SPECIFICATION', data: result.categories.productSpecification },
          { name: 'COMPANY_PERFORMANCE', data: result.categories.companyPerformance },
        ]

        for (const category of categoryRecords) {
          await prisma.veritasCategory.upsert({
            where: {
              veritasScoreId_categoryName: {
                veritasScoreId: veritasScoreRecord.id,
                categoryName: category.name as any,
              },
            },
            create: {
              veritasScoreId: veritasScoreRecord.id,
              categoryName: category.name as any,
              categoryScore: category.data.categoryScore,
              weight: category.data.weightedScore / category.data.categoryScore,
              weightedScore: category.data.weightedScore,
              confidence: category.data.confidence,
            },
            update: {
              categoryScore: category.data.categoryScore,
              weightedScore: category.data.weightedScore,
              confidence: category.data.confidence,
            },
          })
        }

        // Save to history
        await prisma.veritasScoreHistory.create({
          data: {
            productId: body.productId,
            overallScore: result.overallScore,
            confidence: result.metadata.overallConfidence,
            ssn: result.ssn,
            recordedAt: new Date(),
          },
        })

        logger.info('Veritas Score saved to database', {
          component: 'VeritasAPI',
          metadata: { productId: body.productId, veritasScoreId: veritasScoreRecord.id },
        })
      } catch (dbError) {
        logger.error('Failed to save Veritas Score to database', {
          component: 'VeritasAPI',
          error: dbError,
          metadata: { productId: body.productId },
        })
        // Don't fail the request if DB save fails
      }
    }

    const totalTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        apiVersion: '2.0.0',
        processingTimeMs: totalTime,
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error) {
    const totalTime = Date.now() - startTime

    logger.error('Veritas Score calculation failed', {
      component: 'VeritasAPI',
      error,
      metadata: { processingTimeMs: totalTime },
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Calculation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        meta: {
          processingTimeMs: totalTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/veritas/calculate
 * API documentation and status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Veritas Score™ Calculation API',
    version: '2.0.0',
    status: 'operational',
    description: 'Enterprise-grade product quality scoring using 121 parameters',
    endpoints: {
      calculate: {
        method: 'POST',
        path: '/api/veritas/calculate',
        description: 'Calculate Veritas Score for a product',
        requiredFields: ['productName', 'brand', 'category'],
        optionalFields: [
          'condition',
          'serialNumber',
          'serviceTag',
          'asin',
          'price',
          'productId',
          'productQuality',
          'sellerTrust',
          'marketValue',
          'sustainability',
          'securitySafety',
          'userExperience',
          'productSpecification',
          'companyPerformance',
        ],
      },
    },
    parameters: {
      total: 121,
      categories: {
        productQuality: 30,
        sellerTrust: 25,
        marketValue: 20,
        sustainability: 15,
        securitySafety: 8,
        userExperience: 8,
        productSpecification: 10,
        companyPerformance: 5,
      },
    },
    dataSources: {
      apis: [
        'Apple Warranty API',
        'Dell Warranty API',
        'iFixit API',
        'eBay Finding API',
        'Energy Star API',
        'Alpha Vantage API',
      ],
      scrapers: [
        'GSMArena',
        'CamelCamelCamel',
        'Walmart',
        'Target',
      ],
    },
    documentation: 'https://docs.thriftai.com/veritas-score',
    support: 'support@thriftai.com',
  })
}
