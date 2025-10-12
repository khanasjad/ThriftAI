#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma'

async function debug() {
  console.log('Checking products in database...\n')

  // Check all products
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      price: true,
      searchKeywords: true,
      tags: true,
    }
  })

  console.log(`Total products: ${allProducts.length}\n`)

  // Check ELECTRONICS category
  const electronics = await prisma.product.findMany({
    where: {
      category: 'ELECTRONICS'
    },
    select: {
      name: true,
      category: true,
      brand: true,
      price: true,
    }
  })

  console.log(`ELECTRONICS products: ${electronics.length}`)
  electronics.forEach(p => {
    console.log(`  - ${p.name} (${p.brand}) - $${p.price}`)
  })

  // Check categories
  console.log('\nAll categories:')
  const categories = [...new Set(allProducts.map(p => p.category))]
  categories.forEach(cat => {
    const count = allProducts.filter(p => p.category === cat).length
    console.log(`  - ${cat}: ${count} products`)
  })

  // Check search keywords
  console.log('\nSample search keywords:')
  allProducts.slice(0, 3).forEach(p => {
    console.log(`  ${p.name}:`)
    console.log(`    Keywords: ${p.searchKeywords}`)
    console.log(`    Tags: ${p.tags}`)
  })

  await prisma.$disconnect()
}

debug().catch(console.error)
