import { prisma } from '../src/lib/prisma'

async function checkAccessories() {
  const accessories = await prisma.product.findMany({
    where: {
      OR: [
        { category: 'WOMENS_ACCESSORIES' },
        { category: 'MENS_ACCESSORIES' }
      ]
    },
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      price: true,
      aiScore: true,
      aiConfidence: true,
      isAvailable: true
    },
    take: 10
  })

  console.log('\n📦 Accessories Products:\n')
  accessories.forEach(p => {
    console.log(`${p.name} - ${p.category}`)
    console.log(`  Price: $${p.price} | AI Score: ${p.aiScore}/100 (${(Number(p.aiConfidence) || 0) * 100}%)`)
    console.log(`  Available: ${p.isAvailable}`)
    console.log()
  })

  const totalAvailable = await prisma.product.count({
    where: {
      isAvailable: true
    }
  })

  console.log(`\n✅ Total available products: ${totalAvailable}/1800`)

  await prisma.$disconnect()
}

checkAccessories()
