import { prisma } from '../src/lib/prisma'

async function testSpecsFallback() {
  console.log('🧪 Testing Specs Quality fallback calculation\n')

  // Get top 3 products
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
      dynamicSpecs: true,
      aiScoreBreakdown: true
    },
    orderBy: {
      aiScore: 'desc'
    },
    take: 3
  })

  console.log(`Testing with ${products.length} products:\n`)

  products.forEach((product, i) => {
    const specs = product.dynamicSpecs as Record<string, any> | null
    const specsCount = specs ? Object.keys(specs).length : 0
    const breakdown = product.aiScoreBreakdown as any

    // Simulate the fallback calculation (matches API logic)
    const calculateFallbackSpecsQuality = (product: any): number => {
      const specs = product.dynamicSpecs as Record<string, any> | null
      if (!specs || typeof specs !== 'object') return 50 // Neutral default

      const specsCount = Object.keys(specs).length
      if (specsCount === 0) return 50 // Neutral default for categories without spec mappings

      if (specsCount >= 9) return 100
      if (specsCount >= 6) return 75
      if (specsCount >= 3) return 50
      return 25
    }

    const fallbackScore = calculateFallbackSpecsQuality(product)
    const fallbackScoreOn10 = fallbackScore / 10

    console.log(`${i + 1}. ${product.name} (${product.category})`)
    console.log(`   AI Score: ${product.aiScore?.toFixed(2)}/100`)
    console.log(`   dynamicSpecs count: ${specsCount}`)
    if (specsCount > 0 && specs) {
      console.log(`   dynamicSpecs keys: ${Object.keys(specs).join(', ')}`)
    }
    console.log(`   Has breakdown.dynamicProductSpecs: ${breakdown?.dynamicProductSpecs !== undefined ? 'YES' : 'NO'}`)
    console.log(`   📊 Fallback specsQuality: ${fallbackScore}/100 (${fallbackScoreOn10.toFixed(1)}/10)`)
    console.log('')
  })

  await prisma.$disconnect()
}

testSpecsFallback().catch(console.error)
