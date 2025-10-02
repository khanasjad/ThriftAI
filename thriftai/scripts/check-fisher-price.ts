import { prisma } from '../src/lib/prisma'

async function checkProduct() {
  const product = await prisma.product.findFirst({
    where: {
      name: 'Fisher-Price Classic'
    },
    select: {
      name: true,
      category: true,
      aiScore: true,
      aiScoreBreakdown: true,
      lastScoredAt: true
    }
  })

  if (!product) {
    console.log('Product not found')
    await prisma.$disconnect()
    return
  }

  console.log(`Product: ${product.name} (${product.category})`)
  console.log(`Last scored: ${product.lastScoredAt}`)
  console.log(`AI Score: ${product.aiScore}\n`)

  const b = product.aiScoreBreakdown as any
  console.log('Breakdown keys:', Object.keys(b))
  console.log(`\ndynamicProductSpecs exists: ${b.dynamicProductSpecs !== undefined}`)

  if (b.dynamicProductSpecs) {
    console.log(`dynamicProductSpecs.score: ${b.dynamicProductSpecs.score}`)
  } else {
    console.log('dynamicProductSpecs: NOT IN BREAKDOWN')
  }

  await prisma.$disconnect()
}

checkProduct().catch(console.error)
