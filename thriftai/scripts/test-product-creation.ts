#!/usr/bin/env npx tsx
/**
 * Diagnostic Test: Single Product Creation
 * Tests if products can be created and persisted to database
 */

import { prisma } from '../src/lib/prisma'

async function testProductCreation() {
  console.log('🔍 Testing Product Creation & Persistence')
  console.log('='.repeat(80))
  console.log()

  try {
    // Step 1: Check database connection
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected')

    // Step 2: Create a test user for seller
    console.log('\n2️⃣ Creating test user...')
    const testUser = await prisma.user.create({
      data: {
        email: `test-seller-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'Seller',
      },
    })
    console.log(`   ✅ User created: ${testUser.id}`)

    // Step 3: Verify user was saved
    const verifyUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    })
    console.log(`   ✅ User verification: ${verifyUser ? 'SUCCESS' : 'FAILED'}`)

    // Step 4: Create a test seller
    console.log('\n3️⃣ Creating test seller...')
    const testSeller = await prisma.seller.create({
      data: {
        userId: testUser.id,
        businessName: 'Test Business',
        ownerName: 'Test Owner',
        email: testUser.email,
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        rating: 5.0,
        totalSales: 0,
        categories: ['ELECTRONICS'],
        isVerified: true,
        isActive: true,
      },
    })
    console.log(`   ✅ Seller created: ${testSeller.id}`)

    // Step 5: Verify seller was saved
    const verifySeller = await prisma.seller.findUnique({
      where: { id: testSeller.id },
    })
    console.log(`   ✅ Seller verification: ${verifySeller ? 'SUCCESS' : 'FAILED'}`)

    // Step 6: Create a test product
    console.log('\n4️⃣ Creating test product...')
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'This is a test product',
        price: 99.99,
        originalPrice: 149.99,
        brand: 'TestBrand',
        category: 'ELECTRONICS',
        condition: 'New',
        imageUrl: 'https://picsum.photos/800/600',
        seller: {
          connect: {
            id: testSeller.id
          }
        },
        isAvailable: true,
        isAuthentic: true,
        qualityScore: 95,
        estimatedDeliveryDays: 3,
        hasFreeShipping: true,
        hasFreeReturns: true,
        hasWarranty: true,
        warrantyMonths: 12,
        returnPeriodDays: 30,
        shippingCost: 0,
        certifications: ['Test Certified'],
        stockQuantity: 10,
        popularityScore: 80,
        relevanceScore: 85,
        trendingScore: 75,
        viewCount: 0,
        clickCount: 0,
        purchaseCount: 0,
        cartAdditionCount: 0,
        tags: ['test'],
        searchKeywords: ['test', 'product'],
        dynamicSpecs: {
          test: true,
        },
      },
    })
    console.log(`   ✅ Product created: ${testProduct.id}`)
    console.log(`   📝 Product name: ${testProduct.name}`)
    console.log(`   💰 Product price: $${testProduct.price}`)

    // Step 7: Immediately verify product was saved
    console.log('\n5️⃣ Verifying product persistence...')
    const verifyProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    })

    if (verifyProduct) {
      console.log(`   ✅ VERIFICATION SUCCESS!`)
      console.log(`   📝 Found: ${verifyProduct.name}`)
      console.log(`   💰 Price: $${verifyProduct.price}`)
    } else {
      console.log(`   ❌ VERIFICATION FAILED - Product not found!`)
    }

    // Step 8: Count total products
    console.log('\n6️⃣ Counting all products...')
    const productCount = await prisma.product.count()
    console.log(`   📊 Total products in database: ${productCount}`)

    // Step 9: List all products
    console.log('\n7️⃣ Listing all products...')
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
      },
    })

    if (allProducts.length > 0) {
      allProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - $${p.price} (${p.id})`)
      })
    } else {
      console.log('   ⚠️  No products found')
    }

    console.log()
    console.log('='.repeat(80))
    console.log('✅ TEST COMPLETED')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    console.error('\nFull error details:', JSON.stringify(error, null, 2))
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database disconnected')
  }
}

testProductCreation()
