#!/usr/bin/env npx tsx
/**
 * Test iPhone 15 Pro Max Enrichment with Verbose Logging
 * This script enriches ONLY the iPhone to see which APIs are being called
 */

import { prisma } from '../src/lib/prisma'
import { veritasScoreService } from '../src/lib/services/veritasScoreService'

const IPHONE_PRODUCT_ID = 'cmgn6ly300000rm5q8g4smrq9'

async function main() {
  console.log('🎯 Testing iPhone 15 Pro Max Enrichment with API Logging\\n')

  try {
    // Get the iPhone product
    const product = await prisma.product.findUnique({
      where: { id: IPHONE_PRODUCT_ID }
    })

    if (!product) {
      console.error('❌ iPhone product not found!')
      return
    }

    console.log('📱 Product:', product.name)
    console.log('📦 Category:', product.category)
    console.log('🆔 ID:', product.id)
    console.log('\\n' + '='.repeat(80) + '\\n')

    // Calculate Veritas Score (this will trigger all API calls with logging)
    console.log('🔄 Calculating Veritas Score (watch for API calls)...\\n')

    const scoreResult = await veritasScoreService.calculateScore(IPHONE_PRODUCT_ID)

    console.log('\\n' + '='.repeat(80) + '\\n')
    console.log('📊 RESULTS:\\n')
    console.log('Overall Score:', scoreResult.overallScore.toFixed(2), '/100')
    console.log('Confidence:', (scoreResult.confidence * 100).toFixed(1), '%')
    console.log('Data Quality:', scoreResult.dataQualityScore.toFixed(1), '%')
    console.log('\\nCategory Breakdown:')

    scoreResult.categories.forEach(cat => {
      console.log(`  ${cat.categoryName}: ${cat.categoryScore.toFixed(1)}/100 (weight: ${cat.weight})`)
    })

    console.log('\\nMissing Data Fields:', scoreResult.missingDataFields.length)
    console.log('SSN:', scoreResult.ssn)

    // Save the score
    console.log('\\n💾 Saving score to database...')
    await veritasScoreService.saveScore(IPHONE_PRODUCT_ID, scoreResult)

    console.log('\\n✅ SUCCESS! Check console output above for API call logs.')
    console.log('\\n🔍 Look for these log patterns:')
    console.log('  ✅ = API call succeeded')
    console.log('  ⚠️ = API returned no data')
    console.log('  ❌ = API call failed')

  } catch (error) {
    console.error('\\n❌ ERROR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
