/**
 * Leaderboard Update Script
 *
 * Refreshes the product_leaderboard materialized view to update rankings.
 * Should be run after scoring products or when rankings need to be updated.
 *
 * Usage:
 *   npx tsx scripts/update-leaderboard.ts
 *   npx tsx scripts/update-leaderboard.ts --stats  # Show detailed statistics
 */

import { prisma } from '../src/lib/prisma'
import { logger } from '../src/lib/logger'

async function main() {
  const args = process.argv.slice(2)
  const showStats = args.includes('--stats')

  console.log('\n🏆 Updating Leaderboard Rankings')
  console.log('=================================\n')

  try {
    // Get stats before refresh
    const statsBefore = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as total_ranked
      FROM product_leaderboard
    `)

    console.log(`📊 Current Rankings: ${statsBefore[0]?.total_ranked || 0} products\n`)
    console.log('🔄 Refreshing materialized view...')

    const startTime = Date.now()

    // Refresh the materialized view
    await prisma.$executeRaw`SELECT refresh_product_leaderboard()`

    const refreshTime = Date.now() - startTime

    console.log(`✅ Refresh complete in ${refreshTime}ms\n`)

    // Get stats after refresh
    const statsAfter = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as total_ranked
      FROM product_leaderboard
    `)

    const totalRanked = parseInt(statsAfter[0]?.total_ranked || '0')

    console.log('📊 Updated Rankings:')
    console.log(`   Total Products Ranked: ${totalRanked}`)
    console.log(`   New Products Added: ${totalRanked - parseInt(statsBefore[0]?.total_ranked || '0')}`)

    if (showStats || totalRanked <= 20) {
      // Show top 10 global leaders
      const topGlobal = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          global_rank,
          name,
          category,
          brand,
          price,
          ai_score
        FROM product_leaderboard
        WHERE global_rank IS NOT NULL
        ORDER BY global_rank
        LIMIT 10
      `)

      console.log('\n🥇 Top 10 Global Leaders:')
      console.log('========================\n')
      topGlobal.forEach(product => {
        const rank = `#${product.global_rank}`.padEnd(4)
        const score = `${parseFloat(product.ai_score).toFixed(1)}`.padStart(5)
        const price = `$${parseFloat(product.price).toFixed(2)}`.padStart(8)
        const name = product.name.substring(0, 40).padEnd(42)
        console.log(`${rank} ${score}/100 ${price} ${name} (${product.category})`)
      })

      // Show category breakdown
      const categoryStats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          category,
          COUNT(*) as total,
          AVG(ai_score) as avg_score,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM product_leaderboard
        GROUP BY category
        ORDER BY total DESC
        LIMIT 10
      `)

      console.log('\n📁 Category Breakdown:')
      console.log('=====================\n')
      categoryStats.forEach(cat => {
        const category = cat.category.padEnd(20)
        const total = `${cat.total}`.padStart(5)
        const avgScore = parseFloat(cat.avg_score).toFixed(1).padStart(5)
        const priceRange = `$${parseFloat(cat.min_price).toFixed(0)}-$${parseFloat(cat.max_price).toFixed(0)}`
        console.log(`${category} ${total} products | Avg Score: ${avgScore} | Price: ${priceRange}`)
      })

      // Show price tier breakdown
      const tierStats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          price_tier,
          COUNT(*) as total,
          AVG(ai_score) as avg_score
        FROM product_leaderboard
        GROUP BY price_tier
        ORDER BY
          CASE price_tier
            WHEN 'luxury' THEN 1
            WHEN 'premium' THEN 2
            WHEN 'mid' THEN 3
            WHEN 'budget' THEN 4
          END
      `)

      console.log('\n💰 Price Tier Breakdown:')
      console.log('=======================\n')
      tierStats.forEach(tier => {
        const name = tier.price_tier.padEnd(10)
        const total = `${tier.total}`.padStart(5)
        const avgScore = parseFloat(tier.avg_score).toFixed(1).padStart(5)
        console.log(`${name} ${total} products | Avg Score: ${avgScore}`)
      })

      // Show badge distribution
      const badgeStats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          unnest(leaderboard_badges) as badge,
          COUNT(*) as total
        FROM product_leaderboard
        WHERE array_length(leaderboard_badges, 1) > 0
        GROUP BY badge
        ORDER BY total DESC
      `)

      if (badgeStats.length > 0) {
        console.log('\n🏅 Badge Distribution:')
        console.log('=====================\n')
        badgeStats.forEach(badge => {
          const name = badge.badge.padEnd(25)
          const total = badge.total
          console.log(`${name} ${total}`)
        })
      }
    }

    console.log('\n💡 View Leaderboard:')
    console.log('   Global:   GET /api/leaderboard?type=global')
    console.log('   Category: GET /api/leaderboard?type=category&category=ELECTRONICS')
    console.log('   Price:    GET /api/leaderboard?type=price_tier&priceTier=premium')

    console.log('\n🎉 Done!\n')

  } catch (error) {
    console.error('\n❌ Fatal Error:', error)
    logger.error('Leaderboard update script failed', {
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
