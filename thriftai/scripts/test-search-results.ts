/**
 * Test search to see how many products match
 */

import { prisma } from '../src/lib/prisma'

async function testSearch() {
  console.log('🔍 Testing search queries...\n')

  // Test 1: All ELECTRONICS products under $100
  const electronicsCount = await prisma.product.count({
    where: {
      isAvailable: true,
      category: 'ELECTRONICS',
      price: { lte: 100 }
    }
  })

  console.log(`📊 ELECTRONICS under $100: ${electronicsCount} products`)

  // Test 2: All products under $100
  const cheapProducts = await prisma.product.count({
    where: {
      isAvailable: true,
      price: { lte: 100 }
    }
  })

  console.log(`📊 All products under $100: ${cheapProducts} products`)

  // Test 3: Products with "tech" in name or description
  const techProducts = await prisma.product.count({
    where: {
      isAvailable: true,
      price: { lte: 100 },
      OR: [
        { name: { contains: 'tech', mode: 'insensitive' } },
        { description: { contains: 'tech', mode: 'insensitive' } },
        { category: 'ELECTRONICS' }
      ]
    }
  })

  console.log(`📊 "Tech" products under $100: ${techProducts} products`)

  // Test 4: Sample products
  const samples = await prisma.product.findMany({
    where: {
      isAvailable: true,
      price: { lte: 100 }
    },
    select: {
      name: true,
      category: true,
      price: true
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  console.log('\n📦 Sample products under $100:')
  samples.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - ${p.category} - $${p.price}`)
  })

  await prisma.$disconnect()
}

testSearch().catch(console.error)
