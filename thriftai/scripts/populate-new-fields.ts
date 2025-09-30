/**
 * Populate New Database Fields
 * Updates existing products with realistic values for the new world-class fields
 */

import { PrismaClient } from '@prisma/client'
import { generateOptimizedParams } from '../src/lib/services/optimizedScoreParameters'

const prisma = new PrismaClient()

async function populateNewFields() {
  console.log('🚀 Populating new database fields with optimized values...\n')
  console.log('='.repeat(80))

  // Get all existing products
  const products = await prisma.product.findMany({
    include: {
      reviews: true,
      seller: true
    }
  })

  console.log(`\n📊 Found ${products.length} products to update\n`)

  let updated = 0

  for (const product of products) {
    // Generate optimized parameters
    const params = generateOptimizedParams(
      product.id,
      product.price,
      product.category,
      product.originalPrice
    )

    // Calculate quality score based on reviews
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : params.rating

    const qualityScore = Math.max(0, Math.min(100, (avgRating / 5) * 100))

    // Use correct field names from OptimizedScoreParams
    const viewCount = params.viewsLast24h
    const purchaseCount = params.salesLast7Days
    const cartAdditionCount = params.cartAdditionsLast24h

    // Calculate popularity score (views + purchases weighted)
    const popularityScore = Math.max(0, Math.min(100, (viewCount * 0.5 + purchaseCount * 10)))

    // Calculate trending score (recent activity vs historical)
    const trendingScore = Math.max(0, Math.min(100, (viewCount / 10) + (cartAdditionCount * 2)))

    // Calculate click count
    const clickCount = Math.floor(viewCount * params.clickThroughRate)

    // Calculate wishlist count
    const wishlistCount = Math.floor(viewCount * 0.05)

    // Update product with new fields
    await prisma.product.update({
      where: { id: product.id },
      data: {
        // Stock & Availability
        stockQuantity: params.stockLevel,
        lowStockThreshold: 5,

        // Shipping & Delivery
        shippingCost: params.shippingCost,
        estimatedDeliveryDays: params.estimatedDeliveryDays,
        hasFreeShipping: params.hasFreeShipping,
        hasFreeReturns: params.hasFreeReturns,
        returnPeriodDays: params.returnPeriodDays,

        // Quality Indicators
        hasWarranty: params.hasWarranty,
        isAuthentic: true,
        certifications: [],

        // Performance Metrics
        viewCount: viewCount,
        clickCount: clickCount,
        purchaseCount: purchaseCount,
        cartAdditionCount: cartAdditionCount,
        wishlistCount: wishlistCount,

        // Computed Scores
        popularityScore,
        qualityScore,
        trendingScore,
        relevanceScore: 50.0, // Will be updated based on search performance

        // Search Optimization
        searchKeywords: [
          product.name.toLowerCase(),
          product.brand?.toLowerCase() || '',
          product.category.toLowerCase(),
          ...(product.description?.split(' ').slice(0, 5) || [])
        ].filter(k => k.length > 2),

        tags: [
          product.category,
          product.condition || 'good',
          params.hasFreeShipping ? 'free-shipping' : '',
          params.hasWarranty ? 'warranty' : '',
          product.brand || ''
        ].filter(t => t.length > 0),

        // Analytics Timestamps
        lastViewedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random within last 24h
        lastPurchasedAt: purchaseCount > 0
          ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null
      }
    })

    // Update seller performance metrics if seller exists
    if (product.seller) {
      await prisma.seller.update({
        where: { id: product.seller.id },
        data: {
          responseTimeHours: params.sellerResponseTime,
          avgShipmentDays: params.estimatedDeliveryDays * 0.8, // Slightly faster than estimate
          onTimeDeliveryRate: 0.92 + (Math.random() * 0.07), // 92-99%
          defectRate: 0.01 + (Math.random() * 0.03), // 1-4%
          customerSatisfactionRate: 0.85 + (Math.random() * 0.14) // 85-99%
        }
      })
    }

    updated++
    console.log(`✅ Updated: ${product.name} (${product.category})`)
  }

  console.log(`\n✨ Successfully updated ${updated} products!\n`)
  console.log('='.repeat(80))

  // Display summary statistics
  const stats = await prisma.product.aggregate({
    _avg: {
      popularityScore: true,
      qualityScore: true,
      trendingScore: true,
      viewCount: true,
      stockQuantity: true
    },
    _max: {
      popularityScore: true,
      qualityScore: true,
      viewCount: true
    },
    _min: {
      popularityScore: true,
      qualityScore: true,
      viewCount: true
    }
  })

  console.log('\n📊 Updated Database Statistics:\n')
  console.log(`Average Popularity Score:  ${stats._avg.popularityScore?.toFixed(2)}`)
  console.log(`Average Quality Score:     ${stats._avg.qualityScore?.toFixed(2)}`)
  console.log(`Average Trending Score:    ${stats._avg.trendingScore?.toFixed(2)}`)
  console.log(`Average View Count:        ${Math.floor(stats._avg.viewCount || 0)}`)
  console.log(`Average Stock Quantity:    ${Math.floor(stats._avg.stockQuantity || 0)}`)
  console.log('')
  console.log(`Max Popularity:  ${stats._max.popularityScore?.toFixed(2)}`)
  console.log(`Min Popularity:  ${stats._min.popularityScore?.toFixed(2)}`)
  console.log(`Max Views:       ${stats._max.viewCount}`)
  console.log(`Min Views:       ${stats._min.viewCount}`)
  console.log('')

  // Count products with specific features
  const withFreeShipping = await prisma.product.count({ where: { hasFreeShipping: true } })
  const withWarranty = await prisma.product.count({ where: { hasWarranty: true } })
  const lowStock = await prisma.product.count({ where: { stockQuantity: { lte: 5 } } })

  console.log(`Products with Free Shipping: ${withFreeShipping} (${((withFreeShipping / products.length) * 100).toFixed(1)}%)`)
  console.log(`Products with Warranty:      ${withWarranty} (${((withWarranty / products.length) * 100).toFixed(1)}%)`)
  console.log(`Products with Low Stock:     ${lowStock} (${((lowStock / products.length) * 100).toFixed(1)}%)`)
  console.log('')
}

populateNewFields()
  .then(() => {
    console.log('✅ Database population complete!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error populating fields:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })