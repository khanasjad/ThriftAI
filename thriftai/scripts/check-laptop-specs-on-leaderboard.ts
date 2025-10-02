import { prisma } from '../src/lib/prisma'

async function checkLaptopSpecs() {
  console.log('🔍 Checking laptop specs on leaderboard...\n')

  const laptops = await prisma.product.findMany({
    where: {
      isAvailable: true,
      aiScore: { not: null },
      category: 'LAPTOPS'
    },
    select: {
      id: true,
      name: true,
      brand: true,
      aiScore: true,
      dynamicSpecs: true,
      aiScoreBreakdown: true
    },
    orderBy: {
      aiScore: 'desc'
    },
    take: 5
  })

  console.log(`Top 5 laptops on leaderboard:\n`)

  laptops.forEach((laptop, i) => {
    const specs = laptop.dynamicSpecs as Record<string, any> | null
    const breakdown = laptop.aiScoreBreakdown as any
    const specsQuality = breakdown?.components?.specsQuality || breakdown?.dynamicProductSpecs?.score / 10 || 0

    console.log(`${i + 1}. ${laptop.name} by ${laptop.brand}`)
    console.log(`   AI Score: ${laptop.aiScore?.toFixed(2)}/100`)
    console.log(`   Specs Quality: ${specsQuality}/10`)

    if (specs && Object.keys(specs).length > 0) {
      console.log(`   ✅ Has ${Object.keys(specs).length} specs:`)
      Object.entries(specs).forEach(([key, value]) => {
        console.log(`      - ${key}: ${value}`)
      })
    } else {
      console.log(`   ❌ No specs data available`)
    }
    console.log('')
  })

  await prisma.$disconnect()
}

checkLaptopSpecs().catch(console.error)
