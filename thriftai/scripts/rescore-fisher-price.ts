import { prisma } from '../src/lib/prisma'
import { aiScoringEngine } from '../src/lib/services/aiScoringEngine'

async function rescoreFisherPrice() {
  const product = await prisma.product.findFirst({
    where: {
      name: 'Fisher-Price Classic',
      category: 'OUTDOOR_TOYS'
    },
    select: {
      id: true,
      name: true,
      category: true
    }
  })

  if (!product) {
    console.log('Product not found')
    await prisma.$disconnect()
    return
  }

  console.log(`\nRe-scoring ${product.name} (${product.category})...`)
  console.log('Bypassing cache to get fresh score with dynamicProductSpecs\n')

  const result = await aiScoringEngine.scoreProduct(product.id, {
    skipCache: true,
    includeInsights: true
  })

  console.log(`✅ New AI Score: ${result.aiScore}/100`)
  console.log('\nResult object keys:', Object.keys(result))

  // Now fetch the updated product from database
  const updated = await prisma.product.findUnique({
    where: { id: product.id },
    select: {
      aiScore: true,
      aiScoreBreakdown: true
    }
  })

  const b = updated.aiScoreBreakdown as any
  console.log(`\nBreakdown from database:`)
  console.log(`  - Breakdown exists: ${b !== null}`)
  if (b) {
    console.log(`  - Breakdown keys: ${Object.keys(b).join(', ')}`)
    console.log(`  - Has dynamicProductSpecs: ${b.dynamicProductSpecs !== undefined}`)

    if (b.dynamicProductSpecs) {
      console.log(`  - dynamicProductSpecs.score: ${b.dynamicProductSpecs.score}/100`)
      console.log(`  - Specs Quality (0-10 scale): ${(b.dynamicProductSpecs.score / 10).toFixed(1)}/10`)
    } else {
      console.log(`  - ❌ dynamicProductSpecs NOT FOUND in breakdown`)
    }
  }

  console.log(`\n🎉 Product re-scored! Refresh the leaderboard to see updated scores.`)

  await prisma.$disconnect()
}

rescoreFisherPrice().catch(console.error)
