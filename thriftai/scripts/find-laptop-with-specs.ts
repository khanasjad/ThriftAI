import { prisma } from '../src/lib/prisma'

async function findLaptopWithSpecs() {
  console.log('🔍 Finding laptops with dynamicSpecs...\n')

  const laptops = await prisma.product.findMany({
    where: {
      category: 'LAPTOPS',
      aiScore: { not: null }
    },
    select: {
      id: true,
      name: true,
      aiScore: true,
      dynamicSpecs: true,
      aiScoreBreakdown: true,
      lastScoredAt: true
    },
    orderBy: {
      lastScoredAt: 'desc'
    },
    take: 20
  })

  console.log(`Found ${laptops.length} scored laptops\n`)

  laptops.forEach((laptop, i) => {
    const specs = laptop.dynamicSpecs as any
    const specsCount = specs ? Object.keys(specs).length : 0
    const breakdown = laptop.aiScoreBreakdown as any
    const hasSpecsQuality = breakdown?.components?.specsQuality !== undefined

    console.log(`${i + 1}. ${laptop.name}`)
    console.log(`   AI Score: ${laptop.aiScore?.toFixed(1)}/100`)
    console.log(`   Specs count: ${specsCount}`)
    if (specsCount > 0) {
      console.log(`   Specs:`, JSON.stringify(specs, null, 2))
    }
    console.log(`   Has specsQuality component: ${hasSpecsQuality}`)
    if (hasSpecsQuality) {
      console.log(`   specsQuality value: ${breakdown.components.specsQuality}`)
    }
    console.log('')
  })

  await prisma.$disconnect()
}

findLaptopWithSpecs().catch(console.error)
