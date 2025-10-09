/**
 * Batch Veritas Score Calculator for Staging
 * Calculates scores for products using REAL external API calls
 */

import { PrismaClient } from '@prisma/client'
import { veritasScoreService } from '../src/lib/services/veritasScoreService'

const prisma = new PrismaClient()

async function calculateBatchScores(limit: number = 100) {
  console.log('🔬 Batch Veritas Score Calculation (STAGING)')
  console.log('============================================\n')

  try {
    // Get products without scores
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        aiScore: null
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    if (products.length === 0) {
      console.log('✅ All products already have Veritas Scores!')
      return
    }

    console.log(`📊 Found ${products.length} products without scores\n`)
    console.log('🌐 Will make REAL API calls to:')
    console.log('   - Alpha Vantage (stock data)')
    console.log('   - eBay Finding API (seller ratings)')
    console.log('   - GSMArena (phone specs)')
    console.log('   - Apple/Dell Warranty APIs')
    console.log('   - iFixit (repairability)')
    console.log('')

    let completed = 0
    let failed = 0
    const startTime = Date.now()

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const progress = `[${i + 1}/${products.length}]`

      try {
        console.log(`${progress} Calculating score for: ${product.name}`)
        console.log(`          Brand: ${product.brand} | Category: ${product.category}`)

        // Calculate Veritas Score (makes real API calls)
        const scoreResult = await veritasScoreService.calculateScore(product.id)

        // Save to database
        await veritasScoreService.saveScore(product.id, scoreResult)

        // Get FREE API usage count
        const freeApiCount = scoreResult.freeDataSummary?.parametersUsingFreeAPIs || 0
        const freeApiNames = scoreResult.freeDataSummary?.freeAPIsUsed?.join(', ') || 'none'

        console.log(`          ✅ Score: ${scoreResult.overallScore.toFixed(1)} | SSN: ${scoreResult.ssn}`)
        console.log(`          📊 Confidence: ${(scoreResult.confidence * 100).toFixed(0)}%`)
        console.log(`          🆓 FREE API params: ${freeApiCount}/121 (${freeApiNames})`)
        console.log('')

        completed++

        // Rate limiting: Wait 500ms between API calls to be respectful
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

      } catch (error: any) {
        console.log(`          ❌ Failed: ${error.message}`)
        console.log('')
        failed++
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('════════════════════════════════════════')
    console.log('📊 BATCH CALCULATION SUMMARY')
    console.log('════════════════════════════════════════')
    console.log(`✅ Completed: ${completed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((completed / products.length) * 100).toFixed(1)}%`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`⚡ Avg Speed: ${(products.length / parseFloat(duration)).toFixed(1)} products/sec`)
    console.log('')

    // Show score distribution
    const scores = await prisma.veritasScore.findMany({
      select: { overallScore: true }
    })

    const gradeS = scores.filter(s => s.overallScore >= 90).length
    const gradeA = scores.filter(s => s.overallScore >= 80 && s.overallScore < 90).length
    const gradeB = scores.filter(s => s.overallScore >= 70 && s.overallScore < 80).length
    const gradeC = scores.filter(s => s.overallScore >= 60 && s.overallScore < 70).length

    console.log('📊 Score Distribution:')
    console.log(`   S (90-100): ${gradeS} products`)
    console.log(`   A (80-89):  ${gradeA} products`)
    console.log(`   B (70-79):  ${gradeB} products`)
    console.log(`   C (60-69):  ${gradeC} products`)
    console.log('')

  } catch (error) {
    console.error('❌ Batch calculation failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100

// Run batch calculation
calculateBatchScores(limit)
  .then(() => {
    console.log('✅ Batch calculation completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Batch calculation failed:', error)
    process.exit(1)
  })
