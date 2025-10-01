import { prisma } from '../src/lib/prisma'

async function testInsert() {
  console.log('Testing single product insertion...')

  try {
    const result = await prisma.product.create({
      data: {
        id: 'test-prod-999',
        name: 'Test Product',
        category: 'LAPTOPS',
        price: 999.99,
        originalPrice: 1299.99,
        condition: 'New',
        isAvailable: true,
        stockQuantity: 10,
        shippingCost: 0,
        hasFreeShipping: true,
        estimatedDeliveryDays: 3,
        hasFreeReturns: true,
        imageUrl: '/test.jpg',
        aiScore: 85.5,
        aiConfidence: 0.95,
        aiScoreBreakdown: { test: 'data' },
        dynamicSpecs: {},
        companyMetrics: { esgScore: 75 },
        sellerId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    console.log('✅ Success! Product created:', result.id)
  } catch (error) {
    console.error('❌ Full error:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testInsert()
