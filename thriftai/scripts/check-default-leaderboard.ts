import { prisma } from '../src/lib/prisma'

async function checkDefaultLeaderboard() {
  console.log('🏆 Checking default leaderboard products...\n')

  const products = await prisma.product.findMany({
    where: {
      isAvailable: true,
      aiScore: { not: null }
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
    },
    take: 20
  })

  console.log(`Top 20 products on default leaderboard:\n`)

  products.forEach((p, i) => {
    const breakdown = p.aiScoreBreakdown as any
    const hasDynamicSpecs = breakdown?.dynamicProductSpecs !== undefined

    console.log(`${i + 1}. ${p.name} (${p.category})`)
    console.log(`   AI Score: ${p.aiScore?.toFixed(2)}/100`)
    console.log(`   Last scored: ${p.lastScoredAt || 'OLD (null)'}`)
    console.log(`   Has dynamicProductSpecs: ${hasDynamicSpecs ? '✅ YES' : '❌ NO'}`)
    console.log('')
  })

  const withDynamicSpecs = products.filter(p => {
    const breakdown = p.aiScoreBreakdown as any
    return breakdown?.dynamicProductSpecs !== undefined
  }).length

  console.log(`📊 Summary:`)
  console.log(`   Products with dynamicProductSpecs: ${withDynamicSpecs}/20`)
  console.log(`   Products WITHOUT dynamicProductSpecs: ${20 - withDynamicSpecs}/20`)

  await prisma.$disconnect()
}

checkDefaultLeaderboard().catch(console.error)
