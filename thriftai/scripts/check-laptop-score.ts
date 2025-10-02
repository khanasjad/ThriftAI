import { prisma } from '../src/lib/prisma'

async function checkLaptopScore() {
  console.log('🔍 Checking recently scored laptop with specs...\n')

  const laptop = await prisma.product.findFirst({
    where: {
      category: 'LAPTOPS',
      dynamicSpecs: { not: null },
      aiScore: { not: null },
      lastScoredAt: { not: null }
    },
    select: {
      id: true,
      name: true,
      category: true,
      aiScore: true,
      dynamicSpecs: true,
      aiScoreBreakdown: true,
      lastScoredAt: true
    },
    orderBy: {
      lastScoredAt: 'desc'
    }
  })

  if (!laptop) {
    console.log('No laptop found')
    return
  }

  console.log(`📦 Product: ${laptop.name}`)
  console.log(`📊 AI Score: ${laptop.aiScore}/100`)
  console.log(`📅 Last Scored: ${laptop.lastScoredAt}`)
  console.log(`💻 Specs:`, JSON.stringify(laptop.dynamicSpecs, null, 2))

  const breakdown = laptop.aiScoreBreakdown as any
  console.log(`\n🎯 Score Breakdown:`)
  console.log(`   Total: ${breakdown?.total || 'N/A'}`)

  if (breakdown?.components) {
    console.log(`\n   Components:`)
    Object.entries(breakdown.components).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`)
    })

    console.log(`\n   ✅ Has specsQuality: ${breakdown.components.specsQuality !== undefined}`)
    console.log(`   📦 specsQuality value: ${breakdown.components.specsQuality || 0}/10`)

    // Calculate expected score based on number of specs
    const specsCount = Object.keys(laptop.dynamicSpecs || {}).length
    console.log(`\n   📋 Number of specs: ${specsCount}`)
    console.log(`   Expected specsQuality score: ${specsCount >= 5 ? 100 : specsCount * 20}/100`)
  }

  await prisma.$disconnect()
}

checkLaptopScore().catch(console.error)
