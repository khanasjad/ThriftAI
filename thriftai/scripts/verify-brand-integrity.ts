#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma'

async function verifyBrandIntegrity() {
  console.log('🔍 Verifying brand-product integrity...\n')

  // Define impossible combinations
  const checks = [
    {
      name: 'iPhone',
      correctBrand: 'Apple',
      description: 'iPhones must be Apple'
    },
    {
      name: 'MacBook',
      correctBrand: 'Apple',
      description: 'MacBooks must be Apple'
    },
    {
      name: 'iPad',
      correctBrand: 'Apple',
      description: 'iPads must be Apple'
    },
    {
      name: 'AirPods',
      correctBrand: 'Apple',
      description: 'AirPods must be Apple'
    },
    {
      name: 'Apple Watch',
      correctBrand: 'Apple',
      description: 'Apple Watches must be Apple'
    },
    {
      name: 'Galaxy',
      correctBrand: 'Samsung',
      description: 'Galaxy products must be Samsung'
    },
    {
      name: 'Pixel',
      correctBrand: 'Google',
      description: 'Pixel products must be Google'
    },
    {
      name: 'PlayStation',
      correctBrand: 'Sony',
      description: 'PlayStation must be Sony'
    },
    {
      name: 'Xbox',
      correctBrand: 'Microsoft',
      description: 'Xbox must be Microsoft'
    },
    {
      name: 'Switch',
      correctBrand: 'Nintendo',
      description: 'Nintendo Switch must be Nintendo'
    }
  ]

  let allCorrect = true
  let totalChecked = 0
  let totalIncorrect = 0

  for (const check of checks) {
    // Find all products with this name that DON'T have the correct brand
    const incorrectProducts = await prisma.product.findMany({
      where: {
        name: {
          contains: check.name,
          mode: 'insensitive'
        },
        brand: {
          not: check.correctBrand,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true
      }
    })

    const correctProducts = await prisma.product.count({
      where: {
        name: {
          contains: check.name,
          mode: 'insensitive'
        },
        brand: {
          equals: check.correctBrand,
          mode: 'insensitive'
        }
      }
    })

    totalChecked += incorrectProducts.length + correctProducts

    if (incorrectProducts.length > 0) {
      console.log(`❌ ${check.description}:`)
      console.log(`   Found ${incorrectProducts.length} INCORRECT products:`)
      incorrectProducts.forEach(p => {
        console.log(`   - ${p.name} | Brand: ${p.brand} | Category: ${p.category}`)
      })
      allCorrect = false
      totalIncorrect += incorrectProducts.length
    } else if (correctProducts > 0) {
      console.log(`✅ ${check.description}: ${correctProducts} products (all correct)`)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Total products checked: ${totalChecked}`)
  console.log(`   Incorrect combinations: ${totalIncorrect}`)

  if (allCorrect) {
    console.log('\n🎉 ALL BRAND-PRODUCT COMBINATIONS ARE GENUINE!')
    console.log('   No impossible combinations found (e.g., no "Sony iPhone")')
  } else {
    console.log('\n⚠️  BRAND INTEGRITY ISSUES FOUND!')
    console.log('   Please re-run the seed script to fix these issues.')
  }

  await prisma.$disconnect()
}

verifyBrandIntegrity().catch(console.error)
