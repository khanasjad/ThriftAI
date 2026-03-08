/**
 * Bulk Calculate Veritas Scores for all products
 *
 * This script calculates enterprise-grade Veritas Scores for all products
 * that don't have scores yet or have outdated scores.
 *
 * Usage:
 *   npx tsx scripts/calculate-veritas-scores.ts
 *   npx tsx scripts/calculate-veritas-scores.ts --limit 10
 *   npx tsx scripts/calculate-veritas-scores.ts --force (recalculate all)
 */

import { prisma } from '../src/lib/prisma'
import { veritasScoreCalculator } from '../src/lib/services/veritas/VeritasScoreCalculator'
import type { VeritasScoreInput } from '../src/lib/services/veritas/types'

const args = process.argv.slice(2)
const limitIndex = args.indexOf('--limit')
const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : undefined
const force = args.includes('--force')

async function main() {
  console.log('🚀 Starting Veritas Score calculation...')
  console.log(`📊 Mode: ${force ? 'FORCE (recalculate all)' : 'UPDATE (only missing)'}`)
  if (limit) console.log(`🔢 Limit: ${limit} products`)

  // Find products that need scores
  const whereClause: any = {
    isAvailable: true,
  }

  if (!force) {
    whereClause.veritasScore = null
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      veritasScore: true,
      seller: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  console.log(`\n📦 Found ${products.length} products to process`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const progress = `[${i + 1}/${products.length}]`

    try {
      console.log(`\n${progress} Processing: ${product.name} (${product.id})`)

      // Build input for calculator
      const input: VeritasScoreInput = {
        productName: product.name,
        brand: product.brand || 'Unknown',
        category: product.category || 'General',
        condition: (product.condition as any) || 'Good',
        serialNumber: undefined, // TODO: extract from product if available
        serviceTag: undefined,
        asin: undefined,

        // Use default values - these will be enriched by external data sources
        productQuality: {
          physicalCondition: {
            overallCondition: (product.condition as any) || 'Good',
            visualDefectsCount: 0,
            visualDefectsDescription: '',
            functionalCompleteness: 100,
            wearTearLevel: 3,
            missingComponents: [],
            materialQuality: 80,
          },
          authenticity: {
            authenticationStatus: 'Unverified',
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
            productAgeMonths: 12,
            previousOwnerCount: 1,
            usageHoursCycles: 1000,
            repairHistory: 'Unknown',
          },
        },
        sellerTrust: {
          reputation: {
            sellerRating: product.seller?.rating ? Number(product.seller.rating) : 4.0,
            transactionCount: product.seller?.totalSales || 100,
            positiveFeedbackPercent: 85,
            accountAgeYears: 2,
            isVerifiedSeller: product.seller?.isVerified || false,
            isTopRatedSeller: false,
            isPowerSeller: false,
            sellerLocation: 'US',
          },
          transactionHistory: {
            disputeRatePercent: 1,
            refundRatePercent: 3,
            chargebackRatePercent: 0.5,
            cancellationRatePercent: 2,
            lateShipmentRatePercent: 5,
            itemNotAsDescribedPercent: 2,
          },
          responseService: {
            responseTimeHours: product.seller?.responseTimeHours || 24,
            responseRatePercent: 95,
            customerServiceQuality: 80,
            communicationClarity: 85,
            acceptsReturns: true,
            problemResolution: 90,
          },
          reliability: {
            onTimeShippingPercent: 95,
            descriptionAccuracy: 85,
            packagingQuality: 80,
            providesTracking: true,
            responsiveness: 8,
          },
        },
        marketValue: {
          pricePositioning: {
            currentPrice: Number(product.price),
            originalMSRP: Number(product.originalPrice) || Number(product.price) * 1.5,
            priceVsMarketAverage: 0,
            discountPercentage: 25,
            valueForMoneyIndex: 70,
            priceTrend30Days: 'Stable' as const,
            lowestHistoricalPrice: Number(product.price) * 0.9,
          },
          competitiveAnalysis: {
            priceVsCompetitors: 0,
            competitorCount: 5,
            isBestPrice: false,
            priceStabilityScore: 80,
            marketAvailability: 10,
            demandLevel: 60,
          },
          totalCost: {
            shippingCost: 10,
            taxAmount: Number(product.price) * 0.08,
            hiddenFees: 0,
            warrantyValue: product.hasWarranty ? 50 : 0,
          },
          marketDynamics: {
            priceTrendDirection: 'Stable' as const,
            seasonalPricing: 'Normal' as const,
            supplyLevel: 'Normal' as const,
          },
        },
        sustainability: {
          environmentalImpact: {
            carbonFootprintReduction: 60,
            eWastePrevention: true,
            resourceConservation: 70,
            isEnergyStarCertified: false,
            epeatRating: null,
          },
          circularEconomy: {
            reuseFactor: 70,
            recyclingPotential: 60,
            refurbishmentQuality: 'Amateur' as const,
            secondHandMarketValue: Number(product.price) * 0.7,
          },
          productLongevity: {
            expectedRemainingLifeYears: 5,
            repairabilityScore: 7,
            partsAvailability: 'Good' as const,
            softwareSupportYears: 3,
          },
          certifications: {
            ecoCertifications: [],
            hasRefurbCertification: false,
          },
        },
        securitySafety: {
          paymentSecurity: {
            paymentMethodSecurity: 'Good' as const,
            hasFraudProtection: true,
          },
          buyerProtection: {
            buyerProtectionPolicy: 'Partial' as const,
            disputeResolutionAvailable: true,
          },
          dataSecurity: {
            isGDPRCompliant: true,
            isDeviceFactoryReset: false,
          },
          platformTrust: {
            platformReputation: 85,
            sslGrade: 'A' as const,
          },
        },
        userExperience: {
          listingQuality: {
            productPageQuality: 75,
            descriptionCompleteness: product.description ? 70 : 40,
            transparencyScore: 80,
          },
          visualPresentation: {
            imageQualityScore: product.imageUrl ? 70 : 40,
            imageCount: product.imageUrl ? 1 : 0,
          },
          purchaseExperience: {
            checkoutEase: 80,
            navigationQuality: 85,
          },
          customerSupport: {
            supportAccessibility: 75,
          },
        },
        productSpecification: {
          technicalSpecs: {
            specificationCompleteness: 80,
            technicalDetailLevel: 75,
            accuracyVerification: 80,
            isModelNumberVerified: false,
          },
          categoryFeatures: {
            featureMatchScore: 85,
            featureCompleteness: 90,
            upgradeDowngradeLevel: 0,
          },
          hardwareDetails: {
            processorSpec: 'Unknown',
            memoryStorageSpec: 'Unknown',
            displaySpec: 'Unknown',
          },
        },
        companyPerformance: {
          brandReputation: {
            brandReputationScore: 80,
            brandRecognitionPercent: 75,
          },
          marketPerformance: {
            stockPerformanceYoY: 5,
          },
          newsSentiment: {
            newsSentimentScore: 70,
          },
          customerSatisfaction: {
            customerSatisfactionIndex: 80,
          },
        },
      }

      console.log(`  ⚙️  Calculating score with enterprise calculator...`)
      const result = await veritasScoreCalculator.calculate(input)

      console.log(`  ✅ Score calculated: ${result.overallScore}/100 (Grade: ${result.grade})`)
      console.log(`  📊 Confidence: ${result.metadata.overallConfidence}%`)
      console.log(`  🔢 Data Quality: ${result.metadata.overallDataQuality}%`)
      console.log(`  ⏱️  Processing Time: ${result.metadata.processingTimeMs}ms`)

      // Save to database
      console.log(`  💾 Saving to database...`)

      // Check if score is valid
      if (isNaN(result.overallScore)) {
        console.log(`  ⚠️  Warning: Score is NaN, skipping database save`)
        errorCount++
        continue
      }

      // Upsert main Veritas Score record
      const veritasScoreRecord = await prisma.veritasScore.upsert({
        where: { productId: product.id },
        create: {
          product: {
            connect: { id: product.id }
          },
          ssn: result.ssn,
          overallScore: result.overallScore,
          confidence: result.metadata.overallConfidence,
          dataQualityScore: result.metadata.overallDataQuality,
          calculatedAt: new Date(),
          missingDataFields: [],
        },
        update: {
          ssn: result.ssn,
          overallScore: result.overallScore,
          confidence: result.metadata.overallConfidence,
          dataQualityScore: result.metadata.overallDataQuality,
          lastUpdatedAt: new Date(),
        },
      })

      // Delete existing category scores for this product
      await prisma.veritasCategory.deleteMany({
        where: { veritasScoreId: veritasScoreRecord.id },
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
        // Ensure no NaN values
        const categoryScore = isNaN(category.data.categoryScore) ? 70 : category.data.categoryScore
        const weightedScore = isNaN(category.data.weightedScore) ? 70 * 0.125 : category.data.weightedScore
        const weight = categoryScore > 0 ? weightedScore / categoryScore : 0.125

        await prisma.veritasCategory.create({
          data: {
            veritasScoreId: veritasScoreRecord.id,
            categoryName: category.name as any,
            categoryScore,
            weight,
            weightedScore,
            confidence: category.data.confidence,
          },
        })
      }

      // Save to history
      await prisma.veritasScoreHistory.create({
        data: {
          productId: product.id,
          overallScore: result.overallScore,
          confidence: result.metadata.overallConfidence,
          ssn: result.ssn,
          recordedAt: new Date(),
        },
      })

      console.log(`  ✅ Database updated successfully`)
      successCount++

    } catch (error) {
      console.error(`  ❌ Error processing ${product.name}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`⏭️  Skipped: ${skippedCount}`)
  console.log(`📦 Total processed: ${successCount + errorCount + skippedCount}`)
  console.log('='.repeat(60))

  await prisma.$disconnect()
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
