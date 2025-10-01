import { prisma } from '../src/lib/prisma'

async function checkCategories() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      category: true
    },
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  })

  console.log('\n📊 Available Categories:\n')
  categories.forEach(cat => {
    console.log(`${cat.category}: ${cat._count.category} products`)
  })

  await prisma.$disconnect()
}

checkCategories()
