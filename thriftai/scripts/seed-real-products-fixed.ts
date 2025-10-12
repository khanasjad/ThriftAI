#!/usr/bin/env npx tsx
/**
 * Seed Real Market Products - WITH EXPLICIT VERIFICATION
 */

import { prisma } from '../src/lib/prisma'

// Real iPhone products
const realIPhones = [
  {
    name: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium',
    brand: 'Apple',
    category: 'ELECTRONICS',
    price: 899.99,
    originalPrice: 1199.99,
    condition: 'Like New',
    description: 'iPhone 15 Pro Max with A17 Pro chip, 48MP camera system, and titanium design.',
    imageUrl: 'https://picsum.photos/seed/iphone15promax/800/600',
    qualityScore: 95,
    warrantyMonths: 12,
    returnPeriodDays: 30,
    hasFreeShipping: true,
    certifications: ['Apple Certified Refurbished', 'Unlocked'],
  },
  {
    name: 'Apple iPhone 14 128GB - Midnight Black',
    brand: 'Apple',
    category: 'ELECTRONICS',
    price: 599.99,
    originalPrice: 799.99,
    condition: 'Very Good',
    description: 'iPhone 14 with A15 Bionic chip and advanced camera system.',
    imageUrl: 'https://picsum.photos/seed/iphone14/800/600',
    qualityScore: 88,
    warrantyMonths: 6,
    returnPeriodDays: 14,
    hasFreeShipping: true,
    certifications: ['Unlocked'],
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB - Titanium Gray',
    brand: 'Samsung',
    category: 'ELECTRONICS',
    price: 949.99,
    originalPrice: 1419.99,
    condition: 'Like New',
    description: 'Galaxy S24 Ultra with built-in S Pen and AI-powered camera.',
    imageUrl: 'https://picsum.photos/seed/s24ultra/800/600',
    qualityScore: 94,
    warrantyMonths: 12,
    returnPeriodDays: 30,
    hasFreeShipping: true,
    certifications: ['Samsung Certified', 'Unlocked'],
  }
]

// Helper function
async function getOrCreateSeller(sellerName: string) {
  const sellerId = `seller-${sellerName.toLowerCase().replace(/\s+/g, '-')}`

  let seller = await prisma.seller.findUnique({
    where: { id: sellerId },
  })

  if (!seller) {
    const user = await prisma.user.create({
      data: {
        email: `${sellerId}@thriftai.local`,
        firstName: 'Verified',
        lastName: 'Seller',
      },
    })

    seller = await prisma.seller.create({
      data: {
        id: sellerId,
        userId: user.id,
        businessName: `${sellerName} Store`,
        ownerName: sellerName,
        email: `${sellerId}@thriftai.local`,
        phone: '555-0100',
        address: '456 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        rating: 4.8 + Math.random() * 0.2,
        totalSales: Math.floor(500 + Math.random() * 1500),
        categories: ['ELECTRONICS', 'CLOTHING', 'ACCESSORIES'],
      },
    })
    console.log(`  Created seller: ${sellerId}`)
  }

  return seller.id
}

async function main() {
  console.log('🚀 Seeding REAL Market Products WITH VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  let saved = 0

  for (const product of realIPhones) {
    try {
      console.log(`\n📱 Processing: ${product.name}`)

      // Get seller
      const sellerId = await getOrCreateSeller(product.brand)
      console.log(`  ✓ Seller: ${sellerId}`)

      // Create product
      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          brand: product.brand,
          category: product.category,
          condition: product.condition,
          imageUrl: product.imageUrl,
          seller: {
            connect: {
              id: sellerId
            }
          },
          isAvailable: true,
          qualityScore: product.qualityScore,
          isAuthentic: true,
          warrantyMonths: product.warrantyMonths,
          returnPeriodDays: product.returnPeriodDays,
          hasWarranty: product.warrantyMonths > 0,
          estimatedDeliveryDays: 3,
          hasFreeShipping: product.hasFreeShipping,
          hasFreeReturns: true,
          shippingCost: product.hasFreeShipping ? 0 : 9.99,
          certifications: product.certifications,
          tags: [product.brand, product.category, product.condition],
          searchKeywords: [product.name, product.brand, product.category],
          stockQuantity: Math.floor(1 + Math.random() * 5),
          popularityScore: 80 + Math.random() * 20,
          relevanceScore: 85 + Math.random() * 15,
          trendingScore: 70 + Math.random() * 30,
          viewCount: Math.floor(1000 + Math.random() * 5000),
          clickCount: Math.floor(200 + Math.random() * 800),
          purchaseCount: Math.floor(10 + Math.random() * 90),
          cartAdditionCount: Math.floor(100 + Math.random() * 400),
        },
      })

      console.log(`  ✓ Created product with ID: ${createdProduct.id}`)

      // IMMEDIATELY verify it was saved
      const verification = await prisma.product.findUnique({
        where: { id: createdProduct.id },
        select: { id: true, name: true, price: true }
      })

      if (verification) {
        console.log(`  ✅ VERIFIED in database: ${verification.name} - $${verification.price}`)
        saved++
      } else {
        console.log(`  ❌ VERIFICATION FAILED - Product not found!`)
      }

    } catch (error: any) {
      console.error(`  ❌ ERROR: ${error.message}`)
      if (error.code) console.error(`  Error code: ${error.code}`)
      if (error.meta) console.error(`  Error meta:`, error.meta)
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`📊 Products created: ${saved}/${realIPhones.length}`)

  // Final count
  const totalCount = await prisma.product.count()
  console.log(`📊 Total products in database: ${totalCount}`)

  if (totalCount !== saved) {
    console.log(`⚠️  WARNING: Count mismatch!`)
  }

  console.log('='.repeat(80))
}

main()
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Disconnected from database')
  })
