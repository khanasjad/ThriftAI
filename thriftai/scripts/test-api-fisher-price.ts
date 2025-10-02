import { prisma } from '../src/lib/prisma'

async function testAPITransformation() {
  console.log('🧪 Testing API transformation for Fisher-Price Classic\n')

  const product = await prisma.product.findFirst({
    where: {
      name: 'Fisher-Price Classic',
      category: 'OUTDOOR_TOYS'
    },
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      price: true,
      originalPrice: true,
      condition: true,
      aiScore: true,
      aiConfidence: true,
      aiScoreBreakdown: true,
      stockQuantity: true,
      shippingCost: true,
      hasFreeShipping: true,
      estimatedDeliveryDays: true,
      hasFreeReturns: true,
      companyMetrics: true,
      dynamicSpecs: true
    }
  })

  if (!product) {
    console.log('Product not found')
    await prisma.$disconnect()
    return
  }

  console.log('Product found:', product.name)
  console.log('AI Score:', product.aiScore)
  console.log('\n📊 Breakdown structure:')

  const breakdown = product.aiScoreBreakdown as any

  console.log('Has breakdown.components:', breakdown?.components !== undefined)
  console.log('Has breakdown.relevance.score:', breakdown?.relevance?.score !== undefined)
  console.log('Has breakdown.dynamicProductSpecs:', breakdown?.dynamicProductSpecs !== undefined)
  console.log('\nBreakdown keys:', breakdown ? Object.keys(breakdown).join(', ') : 'null')

  if (breakdown?.dynamicProductSpecs) {
    console.log('\n✅ dynamicProductSpecs found:')
    console.log('   Score:', breakdown.dynamicProductSpecs.score)
    console.log('   Specs Quality (0-10):', (breakdown.dynamicProductSpecs.score / 10).toFixed(1))
  } else {
    console.log('\n❌ dynamicProductSpecs NOT found in breakdown')
  }

  // Simulate the transformation logic
  console.log('\n🔄 Simulating transformation:')

  if (breakdown?.components) {
    console.log('Taking path 1: components format')
    const specsQuality = (breakdown.components.specsQuality || breakdown.dynamicProductSpecs?.score || 0) / 10
    console.log('specsQuality would be:', specsQuality)
  } else if (breakdown?.relevance?.score !== undefined) {
    console.log('Taking path 2: nested score format')
    const specsQuality = (breakdown.dynamicProductSpecs?.score || 0) / 10
    console.log('specsQuality would be:', specsQuality)
  } else {
    console.log('Taking path 3: direct values format')
    const specsQuality = (breakdown?.dynamicProductSpecs?.score || 0) / 10
    console.log('specsQuality would be:', specsQuality)
  }

  await prisma.$disconnect()
}

testAPITransformation().catch(console.error)
