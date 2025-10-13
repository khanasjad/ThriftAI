/**
 * Recalculate All Products with NEW Veritas Score Formula
 *
 * Updates: 2025-10-12
 * - Price Value: 23% → 20%
 * - Trust Score: 18% → 16%
 * - Specs Quality: 10% → 15% ⭐ ENHANCED (now targets 25 parameters)
 * - Social Proof: 14% → 13%
 * - Quality Score: 12% → 11%
 * - Emotional Appeal: 2% → 4%
 * - User Experience: 10% (unchanged)
 * - Relevance: 7% (unchanged)
 * - Urgency: 4% (unchanged)
 *
 * Total Parameters: 96 → 116
 *
 * Usage:
 *   npx tsx scripts/recalculate-with-new-formula.ts
 *   npx tsx scripts/recalculate-with-new-formula.ts --dry-run  # Preview only
 *   npx tsx scripts/recalculate-with-new-formula.ts --batch 100  # Process in batches
 */

import { prisma } from '../src/lib/prisma'
import { aiScoringEngine } from '../src/lib/services/aiScoringEngine'
import { logger } from '../src/lib/logger'

interface ProductScoreComparison {
  id: string
  name: string
  category: string
  oldScore: number
  newScore: number
  change: number
  specsCount: number
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const batchIndex = args.indexOf('--batch')
  const batchSize = batchIndex !== -1 ? parseInt(args[batchIndex + 1]) : 50

  console.log('\n' + '='.repeat(80))
  console.log('🔄 VERITAS SCORE FORMULA UPDATE - RECALCULATION')
  console.log('='.repeat(80))
  console.log('\n📋 New Formula Changes (2025-10-12):')
  console.log('   ┌─────────────────────┬──────────┬──────────┬─────────┐')
  console.log('   │ Component           │ Old %    │ New %    │ Change  │')
  console.log('   ├─────────────────────┼──────────┼──────────┼─────────┤')
  console.log('   │ Price Value         │   23%    │   20%    │  -3%    │')
  console.log('   │ Trust Score         │   18%    │   16%    │  -2%    │')
  console.log('   │ Specs Quality ⭐    │   10%    │   15%    │  +5%    │')
  console.log('   │ Social Proof        │   14%    │   13%    │  -1%    │')
  console.log('   │ Quality Score       │   12%    │   11%    │  -1%    │')
  console.log('   │ User Experience     │   10%    │   10%    │   0%    │')
  console.log('   │ Relevance           │    7%    │    7%    │   0%    │')
  console.log('   │ Urgency             │    4%    │    4%    │   0%    │')
  console.log('   │ Emotional Appeal    │    2%    │    4%    │  +2%    │')
  console.log('   └─────────────────────┴──────────┴──────────┴─────────┘')
  console.log('\n🎯 Key Enhancement:')
  console.log('   • Specs Quality weight increased from 10% to 15%')
  console.log('   • Now targets 25 category-specific parameters')
  console.log('   • Rewards comprehensive product information')
  console.log('\n📊 Scoring Tiers:')
  console.log('   • 25+ specs = 100 points (Exceptional)')
  console.log('   • 20-24 specs = 80 points (Very Detailed)')
  console.log('   • 15-19 specs = 60 points (Good)')
  console.log('   • 10-14 specs = 40 points (Moderate)')
  console.log('   • 5-9 specs = 20 points (Minimal)')
  console.log('   • <5 specs = 0 points (Insufficient)')

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE: Will preview changes without updating database\n')
  } else {
    console.log('\n✅ LIVE MODE: Will update all product scores in database\n')
  }

  console.log(`📦 Batch Size: ${batchSize} products per batch\n`)

  try {
    // Get all products with existing scores
    const totalProducts = await prisma.product.count({
      where: {
        isAvailable: true,
        aiScore: { not: null }
      }
    })

    console.log(`📊 Found ${totalProducts} products with existing scores to recalculate\n`)

    if (totalProducts === 0) {
      console.log('⚠️  No scored products found. Run score-all-products.ts first.\n')
      return
    }

    // Get sample statistics before recalculation
    const beforeStats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) as total,
        AVG(ai_score) as avg_score,
        MIN(ai_score) as min_score,
        MAX(ai_score) as max_score,
        COUNT(CASE WHEN ai_score >= 80 THEN 1 END) as excellent,
        COUNT(CASE WHEN ai_score >= 60 AND ai_score < 80 THEN 1 END) as good
      FROM products
      WHERE ai_score IS NOT NULL AND is_available = true
    `)

    console.log('📈 Before Recalculation:')
    if (beforeStats.length > 0) {
      const s = beforeStats[0]
      console.log(`   Average Score: ${parseFloat(s.avg_score).toFixed(2)}/100`)
      console.log(`   Range: ${parseFloat(s.min_score).toFixed(1)} - ${parseFloat(s.max_score).toFixed(1)}`)
      console.log(`   Excellent (80+): ${s.excellent} products`)
      console.log(`   Good (60-79): ${s.good} products`)
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n🔄 Starting Recalculation...\n')

    const startTime = Date.now()
    let processed = 0
    let successful = 0
    let failed = 0
    let totalChange = 0
    const comparisons: ProductScoreComparison[] = []
    const errors: Array<{ productId: string; error: string }> = []

    // Process in batches
    let skip = 0
    while (skip < totalProducts) {
      const batch = await prisma.product.findMany({
        where: {
          isAvailable: true,
          aiScore: { not: null }
        },
        select: {
          id: true,
          name: true,
          category: true,
          brand: true,
          aiScore: true,
          dynamicSpecs: true
        },
        take: batchSize,
        skip,
        orderBy: { aiScore: 'desc' }
      })

      for (const product of batch) {
        const progress = ((processed / totalProducts) * 100).toFixed(1)
        process.stdout.write(
          `\r📈 Progress: ${progress}% (${processed}/${totalProducts}) - Processing: ${product.name.substring(0, 40)}...`
        )

        try {
          const oldScore = product.aiScore || 0
          const specsCount = product.dynamicSpecs ? Object.keys(product.dynamicSpecs as any).length : 0

          if (!dryRun) {
            // Recalculate with new formula
            const result = await aiScoringEngine.scoreProduct(product.id, {
              forceRefresh: true,
              includeCompanyMetrics: true,
              includeDynamicSpecs: true
            })

            const newScore = result.aiScore
            const change = newScore - oldScore
            totalChange += Math.abs(change)

            comparisons.push({
              id: product.id,
              name: product.name,
              category: product.category || 'Unknown',
              oldScore,
              newScore,
              change,
              specsCount
            })

            // Highlight significant changes
            if (Math.abs(change) >= 5) {
              const direction = change > 0 ? '📈' : '📉'
              console.log(
                `\n   ${direction} ${product.name.substring(0, 50)} (${specsCount} specs): ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (${change > 0 ? '+' : ''}${change.toFixed(1)})`
              )
            }

            successful++
          } else {
            // Dry run: just count
            comparisons.push({
              id: product.id,
              name: product.name,
              category: product.category || 'Unknown',
              oldScore,
              newScore: oldScore, // Will be recalculated in live mode
              change: 0,
              specsCount
            })
            successful++
          }
        } catch (error) {
          failed++
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push({ productId: product.id, error: errorMsg })
        }

        processed++

        // Small delay every 10 products to avoid rate limits
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      skip += batchSize
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n\n' + '='.repeat(80))
    console.log('✅ Recalculation Complete!')
    console.log('='.repeat(80) + '\n')

    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Time: ${totalTime}s`)

    if (successful > 0 && !dryRun) {
      const avgTime = ((Date.now() - startTime) / successful).toFixed(0)
      const avgChange = (totalChange / successful).toFixed(2)
      console.log(`⚡ Avg Time per Product: ${avgTime}ms`)
      console.log(`📊 Avg Score Change: ${avgChange} points\n`)

      // Get statistics after recalculation
      const afterStats = await prisma.$queryRawUnsafe<any[]>(`
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
        WHERE ai_score IS NOT NULL AND is_available = true
      `)

      console.log('📈 After Recalculation:')
      if (afterStats.length > 0) {
        const s = afterStats[0]
        const oldAvg = beforeStats[0] ? parseFloat(beforeStats[0].avg_score) : 0
        const newAvg = parseFloat(s.avg_score)
        const avgDiff = newAvg - oldAvg

        console.log(`   Average Score: ${newAvg.toFixed(2)}/100 (${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(2)})`)
        console.log(`   Range: ${parseFloat(s.min_score).toFixed(1)} - ${parseFloat(s.max_score).toFixed(1)}`)
        console.log(`   Excellent (80+): ${s.excellent}`)
        console.log(`   Good (60-79): ${s.good}`)
        console.log(`   Average (40-59): ${s.average}`)
        console.log(`   Poor (<40): ${s.poor}`)
      }

      // Show products most affected by the formula change
      const topGainers = comparisons
        .filter(c => c.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 5)

      const topLosers = comparisons
        .filter(c => c.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 5)

      if (topGainers.length > 0) {
        console.log('\n📈 Top 5 Score Increases (likely have good specs):')
        topGainers.forEach(p => {
          console.log(
            `   ${p.name.substring(0, 50)} (${p.specsCount} specs): ${p.oldScore.toFixed(1)} → ${p.newScore.toFixed(1)} (+${p.change.toFixed(1)})`
          )
        })
      }

      if (topLosers.length > 0) {
        console.log('\n📉 Top 5 Score Decreases (likely have few specs):')
        topLosers.forEach(p => {
          console.log(
            `   ${p.name.substring(0, 50)} (${p.specsCount} specs): ${p.oldScore.toFixed(1)} → ${p.newScore.toFixed(1)} (${p.change.toFixed(1)})`
          )
        })
      }

      // Specs quality impact analysis
      const highSpecsProducts = comparisons.filter(c => c.specsCount >= 15)
      const lowSpecsProducts = comparisons.filter(c => c.specsCount < 10)

      if (highSpecsProducts.length > 0) {
        const avgChangeHighSpecs = highSpecsProducts.reduce((sum, p) => sum + p.change, 0) / highSpecsProducts.length
        console.log(`\n⭐ Products with 15+ specs (${highSpecsProducts.length}): Avg change ${avgChangeHighSpecs > 0 ? '+' : ''}${avgChangeHighSpecs.toFixed(2)}`)
      }

      if (lowSpecsProducts.length > 0) {
        const avgChangeLowSpecs = lowSpecsProducts.reduce((sum, p) => sum + p.change, 0) / lowSpecsProducts.length
        console.log(`   Products with <10 specs (${lowSpecsProducts.length}): Avg change ${avgChangeLowSpecs > 0 ? '+' : ''}${avgChangeLowSpecs.toFixed(2)}`)
      }
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
    if (dryRun) {
      console.log('   1. Run without --dry-run to apply changes')
      console.log('   2. Monitor score changes in the output above')
    } else {
      console.log('   1. ✅ All products recalculated with new formula')
      console.log('   2. Run: npx tsx scripts/update-leaderboard.ts')
      console.log('   3. View updated scores in the app')
      console.log('   4. Products with 25+ specs will score highest!')
    }

    console.log('\n🎉 Formula Update Complete!\n')

  } catch (error) {
    console.error('\n❌ Fatal Error:', error)
    logger.error('Formula recalculation failed', {
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
