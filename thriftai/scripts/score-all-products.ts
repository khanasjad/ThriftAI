/**
 * Batch Product Scoring Script
 *
 * Calculates AI scores for all products using the 96-parameter system.
 * Integrates company metrics, dynamic specs, and existing parameters.
 *
 * Usage:
 *   npx tsx scripts/score-all-products.ts
 *   npx tsx scripts/score-all-products.ts --force  # Rescore all products
 *   npx tsx scripts/score-all-products.ts --category ELECTRONICS  # Only one category
 *   npx tsx scripts/score-all-products.ts --limit 50  # Only first 50
 */

import { prisma } from '../src/lib/prisma'
import { aiScoringEngine } from '../src/lib/services/aiScoringEngine'
import { logger } from '../src/lib/logger'

async function main() {
  const args = process.argv.slice(2)
  const forceRescore = args.includes('--force')
  const categoryIndex = args.indexOf('--category')
  const category = categoryIndex !== -1 ? args[categoryIndex + 1] : undefined
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined

  console.log('\n🎯 Starting Product Scoring')
  console.log('===========================\n')

  if (forceRescore) {
    console.log('⚠️  FORCE MODE: Will rescore ALL products\n')
  }

  if (category) {
    console.log(`📁 CATEGORY FILTER: ${category}\n`)
  }

  if (limit) {
    console.log(`📊 LIMIT: Processing only ${limit} products\n`)
  }

  try {
    // Get products to score
    const whereClause: any = { isAvailable: true }

    if (!forceRescore) {
      whereClause.OR = [
        { aiScore: null },
        { lastScoredAt: null },
        // Rescore products older than 30 days
        { lastScoredAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ]
    }

    if (category) {
      whereClause.category = category
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        aiScore: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📦 Found ${products.length} products to score\n`)

    if (products.length === 0) {
      console.log('✅ All products are already scored!')
      console.log('💡 Use --force flag to rescore all products\n')
      return
    }

    // Score products
    let successful = 0
    let failed = 0
    const errors: Array<{ productId: string; error: string }> = []
    const startTime = Date.now()

    console.log('🔄 Scoring products...\n')

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const progress = ((i / products.length) * 100).toFixed(1)

      try {
        process.stdout.write(`\r📈 Progress: ${progress}% (${i}/${products.length}) - ${product.name.substring(0, 40)}...`)

        const result = await aiScoringEngine.scoreProduct(product.id, {
          skipCache: forceRescore,
          includeInsights: true
        })

        successful++

        // Log high-quality or low-quality products
        if (result.aiScore >= 90) {
          console.log(`\n⭐ Excellent: ${product.name} - Score: ${result.aiScore}/100`)
        } else if (result.aiScore < 50) {
          console.log(`\n⚠️  Low Score: ${product.name} - Score: ${result.aiScore}/100`)
        }

      } catch (error) {
        failed++
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push({ productId: product.id, error: errorMsg })
        console.log(`\n❌ Failed: ${product.name} - ${errorMsg}`)
      }

      // Add small delay to avoid rate limits
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n\n✅ Scoring Complete!')
    console.log('===================\n')
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Time: ${totalTime}s`)

    if (successful > 0) {
      const avgTime = ((Date.now() - startTime) / successful).toFixed(0)
      console.log(`⚡ Avg Time per Product: ${avgTime}ms`)
    }

    // Get score statistics
    const stats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) as total,
        AVG(ai_score) as avg_score,
        MIN(ai_score) as min_score,
        MAX(ai_score) as max_score,
        COUNT(CASE WHEN ai_score >= 80 THEN 1 END) as excellent,
        COUNT(CASE WHEN ai_score >= 60 AND ai_score < 80 THEN 1 END) as good,
        COUNT(CASE WHEN ai_score >= 40 AND ai_score < 60 THEN 1 END) as average,
        COUNT(CASE WHEN ai_score < 40 THEN 1 END) as poor
      FROM products
      WHERE ai_score IS NOT NULL
      ${category ? `AND category = '${category}'` : ''}
    `)

    if (stats.length > 0) {
      const s = stats[0]
      console.log('\n📊 Score Distribution:')
      console.log(`   Total Scored: ${s.total}`)
      console.log(`   Average Score: ${parseFloat(s.avg_score).toFixed(1)}/100`)
      console.log(`   Range: ${parseFloat(s.min_score).toFixed(1)} - ${parseFloat(s.max_score).toFixed(1)}`)
      console.log(`   Excellent (80+): ${s.excellent}`)
      console.log(`   Good (60-79): ${s.good}`)
      console.log(`   Average (40-59): ${s.average}`)
      console.log(`   Poor (<40): ${s.poor}`)
    }

    if (errors.length > 0) {
      console.log('\n⚠️  Errors:')
      errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.productId}: ${err.error}`)
      })
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`)
      }
    }

    console.log('\n💡 Next Steps:')
    console.log('   1. Run: npx tsx scripts/update-leaderboard.ts')
    console.log('   2. View leaderboard: GET /api/leaderboard?type=global')
    console.log('\n🎉 Done!\n')

  } catch (error) {
    console.error('\n❌ Fatal Error:', error)
    logger.error('Product scoring script failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
