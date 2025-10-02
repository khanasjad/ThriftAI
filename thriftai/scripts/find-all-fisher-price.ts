import { prisma } from '../src/lib/prisma'

async function findAllFisherPrice() {
  console.log('🔍 Finding all Fisher-Price products...\n')

  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Fisher-Price'
      }
    },
    select: {
      id: true,
      name: true,
      category: true,
      aiScore: true,
      lastScoredAt: true
    },
    orderBy: {
      aiScore: 'desc'
    }
  })

  console.log(`Found ${products.length} Fisher-Price products:\n`)

  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.category})`)
    console.log(`   ID: ${p.id}`)
    console.log(`   AI Score: ${p.aiScore}`)
    console.log(`   Last scored: ${p.lastScoredAt}`)
    console.log('')
  })

  await prisma.$disconnect()
}

findAllFisherPrice().catch(console.error)
