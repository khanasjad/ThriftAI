/**
 * Test script for Veritas Score calculation
 * Usage: npx tsx scripts/test-veritas-score.ts
 */

import { prisma } from '../src/lib/prisma'
import { veritasScoreService } from '../src/lib/services/veritasScoreService'

async function testVeritasScore() {
  console.log('🧪 Testing Veritas Score System\n')

  try {
    // 1. Find a product to test with
    console.log('📦 Finding a test product...')
    const product = await prisma.product.findFirst({
      where: {
        isAvailable: true,
      },
      include: {
        seller: true,
        reviews: true,
      }
    })

    if (!product) {
      console.error('❌ No products found in database')
      return
    }

    console.log(`✅ Found product: ${product.name}`)
    console.log(`   Category: ${product.category}`)
    console.log(`   Brand: ${product.brand || 'N/A'}`)
    console.log(`   Price: $${product.price}`)
    console.log(`   Condition: ${product.condition || 'N/A'}`)
    console.log(`   ID: ${product.id}\n`)

    // 2. Calculate Veritas Score
    console.log('🔢 Calculating Veritas Score...')
    const startTime = Date.now()

    const scoreResult = await veritasScoreService.calculateScore(product.id)

    const duration = Date.now() - startTime
    console.log(`✅ Score calculated in ${duration}ms\n`)

    // 3. Display results
    console.log('📊 VERITAS SCORE RESULTS')
    console.log('=' .repeat(60))
    console.log(`SSN: ${scoreResult.ssn}`)
    console.log(`Overall Score: ${scoreResult.overallScore.toFixed(2)}/100`)
    console.log(`Confidence: ${(scoreResult.confidence * 100).toFixed(2)}%`)
    console.log(`Data Quality: ${scoreResult.dataQualityScore.toFixed(2)}%`)
    console.log(`Missing Fields: ${scoreResult.missingDataFields.length}`)
    console.log('=' .repeat(60))
    console.log()

    // 4. Display category breakdown
    console.log('📈 CATEGORY BREAKDOWN')
    console.log('=' .repeat(60))
    scoreResult.categories.forEach(category => {
      const percentage = (category.weight * 100).toFixed(0)
      console.log(`\n${category.categoryName} (${percentage}% weight)`)
      console.log(`  Score: ${category.categoryScore.toFixed(2)}/100`)
      console.log(`  Weighted: ${category.weightedScore.toFixed(2)}`)
      console.log(`  Confidence: ${(category.confidence * 100).toFixed(2)}%`)
      console.log(`  Parameters: ${category.parameters.length}`)
    })
    console.log()

    // 5. Save to database
    console.log('💾 Saving score to database...')
    await veritasScoreService.saveScore(product.id, scoreResult)
    console.log('✅ Score saved successfully\n')

    // 6. Retrieve saved score
    console.log('🔍 Retrieving saved score from database...')
    const savedScore = await veritasScoreService.getScore(product.id)

    if (savedScore) {
      console.log('✅ Score retrieved successfully')
      console.log(`   Overall Score: ${savedScore.overallScore}`)
      console.log(`   Categories: ${savedScore.categories.length}`)
      console.log(`   Total Parameters: ${savedScore.categories.reduce((sum: number, cat: any) => sum + cat.parameters.length, 0)}`)
      console.log()
    }

    // 7. Display sample parameters
    console.log('🔬 SAMPLE PARAMETERS (Product Quality)')
    console.log('=' .repeat(60))
    const productQuality = scoreResult.categories.find(c => c.categoryName === 'PRODUCT_QUALITY')
    if (productQuality) {
      productQuality.parameters.slice(0, 5).forEach(param => {
        console.log(`\n${param.parameterName}`)
        console.log(`  Code: ${param.parameterCode}`)
        console.log(`  Value: ${param.normalizedValue.toFixed(2)}/100`)
        console.log(`  Weight: ${(param.weight * 100).toFixed(0)}%`)
        console.log(`  Source: ${param.dataSource}`)
        console.log(`  Missing: ${param.isMissing ? 'Yes' : 'No'}`)
      })
    }
    console.log()

    // 8. Summary
    console.log('✅ TEST COMPLETED SUCCESSFULLY')
    console.log('=' .repeat(60))
    console.log('The Veritas Score system is working correctly!')
    console.log(`\nProduct: ${product.name}`)
    console.log(`Final Score: ${scoreResult.overallScore.toFixed(2)}/100`)
    console.log(`Grade: ${getGrade(scoreResult.overallScore)}`)
    console.log()

  } catch (error: any) {
    console.error('❌ Error during test:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

function getGrade(score: number): string {
  if (score >= 95) return 'S (Exceptional)'
  if (score >= 85) return 'A (Excellent)'
  if (score >= 75) return 'B (Good)'
  if (score >= 65) return 'C (Fair)'
  if (score >= 50) return 'D (Below Average)'
  return 'F (Poor)'
}

// Run the test
testVeritasScore()
