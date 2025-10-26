#!/usr/bin/env npx tsx
/**
 * IMMEDIATE FIX: Replace Generic Images with Category-Matched Images
 *
 * This script:
 * 1. Keeps your existing 1,000 real products
 * 2. Replaces generic Unsplash images with category-specific images
 * 3. Ensures images match the product category
 * 4. No API key needed
 * 5. Takes 2-3 minutes to run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Unsplash source URLs by category
const CATEGORY_IMAGES = {
  ELECTRONICS: [
    '1484788984921-03950022c9ef', // laptop/tech
    '1550009158-9ebf69173e03', // headphones
    '1588423771073-b8903fbb85b5', // gadgets
    '1519558260268-0d16b626b8a2', // phone
    '1593642632823-8f785ba67e45', // camera
    '1556656793-08538906a9f8', // smartwatch
    '1531297484001-80022131f5a1', // electronics
    '1585776245865-b92df54c6b25', // tech products
  ],
  CLOTHING: [
    '1489987707025-afc232f7ea0f', // fashion
    '1515886657613-9f3515b0c78f', // clothing
    '1591047139829-d91aecb6caea', // hoodie
    '1503341960582-b45751874cf0', // apparel
    '1490481651871-ab68de25977d', // fashion items
    '1556821561-141e2b4a2cc9', // clothing rack
    '1525507119028-ed4c629a60a3', // fashion detail
  ],
  SHOES: [
    '1542291026-7eec264764d7', // sneakers
    '1549298916-b41d501d3772', // shoes
    '1460353581641-37baddab0fa2', // footwear
    '1552346154-21d32810aba3', // athletic shoes
    '1595950653106-6c9ebd614d3a', // running shoes
    '1551107696-a4b19a6c91d7', // shoe collection
  ],
  ACCESSORIES: [
    '1523275335684-37898b6baf30', // watch
    '1589128777073-263d31242e53', // sunglasses
    '1553062407-98eebcbc3b58', // accessories
    '1509941943102-cd3b2f555c24', // bags
    '1517841905240-472988babdf9', // wallet
    '1611312449408-fcbb6f5831b8', // fashion accessories
  ],
  HOME: [
    '1585821569331-f071db2abd8d', // home products
    '1556911219-4057f86c5f8e', // home appliances
    '1571781926291-c477ebfd024b', // smart home
    '1558618666-fcd25c85cd64', // home electronics
    '1574269909862-7e1d70bb8078', // household items
    '1585338447937-7082f8fc763d', // home tech
  ],
  BEAUTY: [
    '1596462502726-27b2295a3697', // beauty products
    '1571875257727-431f229c640b', // cosmetics
    '1556228578-0d85b1a4d571', // skincare
    '1522335789917-bb30e4fe3556', // beauty items
    '1571731956672-f2b94d7dd0cb', // makeup
  ],
  SPORTS: [
    '1571902943202-507ec2618e8f', // fitness equipment
    '1517836357463-d25dfeac3438', // sports gear
    '1534438327276-14e5300c3a48', // gym equipment
    '1599058917212-d750089bc07e', // workout gear
    '1526506118085-60ce8714f8c5', // sports equipment
  ],
  TOYS: [
    '1587300003388-59208cc962cb', // toys
    '1596461200736-d0359f87d4c2', // games
    '1587912781141-1f00f3f4b21b', // gaming
    '1526657782461-9fe13402a841', // children toys
    '1558618666-fcd25c85cd64', // play items
    '1621710122463-00b3b3d85d1a', // gaming console
    '1515276941804-b8e5d3f8b4d4', // video games
    '1590273828132-1f5d50e88c8e', // gaming products
  ]
} as const

/**
 * Get category-appropriate images
 */
function getCategoryImages(category: string, productName: string): string[] {
  const categoryKey = category as keyof typeof CATEGORY_IMAGES
  const imageIds = CATEGORY_IMAGES[categoryKey] || CATEGORY_IMAGES.ELECTRONICS

  // Generate hash from product name for consistency
  const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const startIndex = hash % Math.max(1, imageIds.length - 4)

  // Select 5 images starting from hash-based index
  const selectedIds = [
    imageIds[startIndex % imageIds.length],
    imageIds[(startIndex + 1) % imageIds.length],
    imageIds[(startIndex + 2) % imageIds.length],
    imageIds[(startIndex + 3) % imageIds.length],
    imageIds[(startIndex + 4) % imageIds.length],
  ]

  // Return full Unsplash URLs
  return selectedIds.map(id => `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop&auto=format&q=80`)
}

/**
 * Main update function
 */
async function main() {
  console.log('🔧 Fixing Product Images...\n')

  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true, category: true }
    })

    console.log(`📦 Found ${products.length} products to update\n`)

    let updated = 0
    const batchSize = 100

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`)

      // Update each product in the batch
      for (const product of batch) {
        const images = getCategoryImages(product.category, product.name)

        await prisma.product.update({
          where: { id: product.id },
          data: {
            imageUrl: JSON.stringify(images)
          }
        })

        updated++
      }

      console.log(`  ✅ Updated ${updated}/${products.length} products`)
    }

    console.log('\n🎉 SUCCESS! All product images updated!')
    console.log(`✅ ${updated} products now have category-matched images\n`)

    // Show category breakdown
    console.log('📊 Category Breakdown:')
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { isAvailable: true },
      _count: true
    })

    for (const cat of categories) {
      console.log(`   ${cat.category}: ${cat._count} products`)
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Check your products: http://localhost:3000')
    console.log('2. Images should now match the category')
    console.log('3. Ready for demo!\n')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
