#!/usr/bin/env tsx
/**
 * Direct test of Apple scraper waterfall logic for iPhone enrichment
 */
import { PrismaClient } from '@prisma/client'

// Initialize Prisma with the correct database URL from env
const prisma = new PrismaClient()

const IPHONE_ID = 'cmgn6ly300000rm5q8g4smrq9'

async function main() {
  console.log('🎯 Testing Apple Scraper Waterfall for iPhone 15 Pro Max\n')

  try {
    // Import the score service
    const { veritasScoreService } = await import('../src/lib/services/veritasScoreService')

    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: IPHONE_ID }
    })

    if (!product) {
      console.error('❌ iPhone not found!')
      return
    }

    console.log('📱 Product:', product.name)
    console.log('🏢 Brand:', product.brand)
    console.log('📦 Category:', product.category)
    console.log('\n' + '='.repeat(80) + '\n')

    // Calculate score (watch for Apple scraper logs)
    console.log('🔄 Calculating Veritas Score (watch for Apple scraper logs)...\n')
    const scoreResult = await veritasScoreService.calculateScore(IPHONE_ID)

    console.log('\n' + '='.repeat(80) + '\n')
    console.log('📊 RESULTS:\n')
    console.log('Overall Score:', scoreResult.overallScore.toFixed(2), '/100')
    console.log('Confidence:', (scoreResult.confidence * 100).toFixed(1), '%')
    console.log('\nCategory Breakdown:')

    scoreResult.categories.forEach(cat => {
      console.log(`  ${cat.categoryName}: ${cat.categoryScore.toFixed(1)}/100`)
    })

    console.log('\n✅ Test complete! Check logs above for Apple scraper activity.')

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
