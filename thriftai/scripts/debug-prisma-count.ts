#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🔍 Debugging Prisma Product count\n')

  // Count all products
  const total = await prisma.product.count()
  console.log(`Total products (no filter): ${total}`)

  // Count available products
  const available = await prisma.product.count({
    where: { isAvailable: true }
  })
  console.log(`Available products (isAvailable = true): ${available}`)

  // Raw SQL count
  const rawCount: any = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM products WHERE "isAvailable" = true
  `
  console.log(`Raw SQL count: ${rawCount[0].count}`)

  // Find first few products
  const samples = await prisma.product.findMany({
    take: 5,
    select: { id: true, name: true, isAvailable: true }
  })
  console.log(`\nFirst 5 products:`)
  samples.forEach((p) => console.log(`  - ${p.name} (available: ${p.isAvailable})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
