#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma'

async function verify() {
  console.log('Verifying products in database...\n')

  const total = await prisma.product.count()
  console.log(`Total products: ${total}`)

  if (total === 0) {
    console.log('\n❌ No products found!\n')
    await prisma.$disconnect()
    return
  }

  // Count by category
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: true
  })

  console.log('\n📊 Products by category:')
  categories.forEach(cat => {
    console.log(`   ${cat.category}: ${cat._count} products`)
  })

  // Sample products
  console.log('\n🔍 Sample products from each category:')
  for (const cat of categories) {
    const sample = await prisma.product.findFirst({
      where: { category: cat.category },
      select: { name: true, brand: true, price: true, imageUrl: true }
    })
    if (sample) {
      console.log(`\n   ${cat.category}:`)
      console.log(`     Name: ${sample.name}`)
      console.log(`     Brand: ${sample.brand}`)
      console.log(`     Price: $${sample.price}`)
      console.log(`     Image: ${sample.imageUrl?.substring(0, 60)}...`)
    }
  }

  await prisma.$disconnect()
}

verify().catch(console.error)
