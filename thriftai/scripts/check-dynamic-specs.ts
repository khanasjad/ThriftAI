import { prisma } from '../src/lib/prisma'

async function checkDynamicSpecs() {
  console.log('🔍 Checking recently re-scored products...\n')

  // Get recently scored products
  const samples = await prisma.product.findMany({
    where: {
      dynamicSpecs: { not: undefined },
      lastScoredAt: { not: null }
    },
    select: {
      id: true,
      name: true,
      category: true,
      dynamicSpecs: true,
      aiScoreBreakdown: true,
      lastScoredAt: true
    },
    orderBy: {
      lastScoredAt: 'desc'
    },
    take: 10
  })

  console.log(`📦 Recently scored products (ordered by lastScoredAt):\n`)
  samples.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.category})`)
    console.log(`   Last Scored: ${p.lastScoredAt}`)
    console.log(`   Specs:`, p.dynamicSpecs)
    const breakdown = p.aiScoreBreakdown as any
    console.log(`   Has specsQuality in breakdown:`, breakdown?.components?.specsQuality !== undefined)
    console.log(`   specsQuality value:`, breakdown?.components?.specsQuality || 'N/A')
    if (breakdown?.components) {
      console.log(`   All components:`, Object.keys(breakdown.components))
    }
    console.log('')
  })

  await prisma.$disconnect()
}

checkDynamicSpecs().catch(console.error)
