import { prisma } from '../src/lib/prisma'

async function testLeaderboardAPI() {
  const product = await prisma.product.findFirst({
    where: {
      category: 'LAPTOPS',
      aiScore: { not: null }
    },
    select: {
      id: true,
      name: true,
      aiScore: true,
      aiScoreBreakdown: true
    },
    orderBy: {
      aiScore: 'desc'
    }
  })

  if (!product) {
    console.log('No product found')
    return
  }

  console.log(`Product: ${product.name}`)
  console.log(`AI Score: ${product.aiScore}\n`)

  const breakdown = product.aiScoreBreakdown as any
  console.log('Breakdown structure:', JSON.stringify(breakdown, null, 2))

  await prisma.$disconnect()
}

testLeaderboardAPI().catch(console.error)
