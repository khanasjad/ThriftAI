import { prisma } from '../src/lib/prisma'

async function findFisherPriceOutdoor() {
  console.log('🔍 Finding all Fisher-Price Classic (OUTDOOR_TOYS)...\n')

  const products = await prisma.product.findMany({
    where: {
      name: 'Fisher-Price Classic',
      category: 'OUTDOOR_TOYS'
    },
    select: {
      id: true,
      name: true,
      category: true,
      aiScore: true,
      lastScoredAt: true,
      aiScoreBreakdown: true
    },
    orderBy: {
      aiScore: 'desc'
    }
  })

  console.log(`Found ${products.length} Fisher-Price Classic (OUTDOOR_TOYS) products:\n`)

  products.forEach((p, i) => {
    const breakdown = p.aiScoreBreakdown as any
    const hasDynamicSpecs = breakdown?.dynamicProductSpecs !== undefined

    console.log(`${i + 1}. ID: ${p.id}`)
    console.log(`   AI Score: ${p.aiScore}`)
    console.log(`   Last scored: ${p.lastScoredAt}`)
    console.log(`   Has dynamicProductSpecs: ${hasDynamicSpecs}`)
    console.log('')
  })

  // Check which one is in top 200
  const top200 = await prisma.product.findMany({
    where: {
      isAvailable: true,
      aiScore: { not: null }
    },
    select: {
      id: true,
      name: true,
      category: true
    },
    orderBy: {
      aiScore: 'desc'
    },
    take: 200
  })

  console.log('\n🏆 Checking which Fisher-Price Classic (OUTDOOR_TOYS) is in top 200:')
  products.forEach(p => {
    const isInTop200 = top200.some(t => t.id === p.id)
    console.log(`   ${p.id}: ${isInTop200 ? '✅ IN TOP 200' : '❌ NOT in top 200'}`)
  })

  await prisma.$disconnect()
}

findFisherPriceOutdoor().catch(console.error)
