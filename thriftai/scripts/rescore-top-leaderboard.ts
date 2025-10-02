import { prisma } from '../src/lib/prisma'
import { aiScoringEngine } from '../src/lib/services/aiScoringEngine'

async function rescoreTopLeaderboard() {
  console.log('🏆 Re-scoring top 200 leaderboard products...\n')

  // Get top 200 products by AI score
  const products = await prisma.product.findMany({
    where: {
      isAvailable: true,
      aiScore: { not: null }
    },
    select: {
      id: true,
      name: true,
      category: true,
      aiScore: true
    },
    orderBy: {
      aiScore: 'desc'
    },
    take: 200
  })

  console.log(`Found ${products.length} top products\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    try {
      console.log(`[${i + 1}/${products.length}] Re-scoring: ${product.name} (${product.category})...`)

      const result = await aiScoringEngine.scoreProduct(product.id, {
        skipCache: true,
        includeInsights: true
      })

      console.log(`   ✅ New score: ${result.aiScore}/100`)
      successCount++

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      errorCount++
    }

    // Add small delay to avoid overwhelming the system
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully re-scored: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`\n🎉 Top leaderboard products re-scored! Refresh the page to see updated scores.`)

  await prisma.$disconnect()
}

rescoreTopLeaderboard().catch(console.error)
