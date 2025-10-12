#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma'

async function test() {
  console.log('Testing Prisma query...')

  const products = await prisma.product.findMany({
    where: {
      isAvailable: true
    },
    select: {
      id: true,
      name: true,
      brand: true,
      price: true,
      isAvailable: true
    }
  })

  console.log(`Found ${products.length} products:`)
  products.forEach(p => {
    console.log(`- ${p.name} ($${p.price}) - Available: ${p.isAvailable}`)
  })

  const count = await prisma.product.count({
    where: { isAvailable: true }
  })
  console.log(`\nTotal count: ${count}`)

  await prisma.$disconnect()
}

test().catch(console.error)
