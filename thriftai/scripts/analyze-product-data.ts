/**
 * Product Data Analyzer
 * Analyzes database products to optimize AI scoring parameters
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProductStats {
  totalProducts: number
  priceStats: {
    min: number
    max: number
    avg: number
    median: number
    distribution: { range: string; count: number }[]
  }
  categoryStats: {
    category: string
    count: number
    avgPrice: number
    avgReviews: number
  }[]
  reviewStats: {
    totalReviews: number
    avgRating: number
    productsWithReviews: number
    productsWithoutReviews: number
    ratingDistribution: { rating: number; count: number }[]
  }
  sellerStats: {
    totalSellers: number
    avgSellerRating: number
    avgTotalSales: number
    sellersWithHighRating: number
  }
  availabilityStats: {
    available: number
    unavailable: number
  }
  ageStats: {
    newest: string
    oldest: string
    avgAgeInDays: number
  }
}

async function analyzeProducts(): Promise<ProductStats> {
  console.log('🔍 Analyzing product data...\n')

  // Get all products with relations
  const products = await prisma.product.findMany({
    include: {
      reviews: true,
      seller: true,
    },
  })

  const totalProducts = products.length
  console.log(`📊 Total Products: ${totalProducts}\n`)

  // Price analysis
  const prices = products.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b)
  const priceStats = {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    median: prices[Math.floor(prices.length / 2)],
    distribution: [
      { range: '$0-50', count: prices.filter(p => p <= 50).length },
      { range: '$50-100', count: prices.filter(p => p > 50 && p <= 100).length },
      { range: '$100-200', count: prices.filter(p => p > 100 && p <= 200).length },
      { range: '$200-500', count: prices.filter(p => p > 200 && p <= 500).length },
      { range: '$500+', count: prices.filter(p => p > 500).length },
    ],
  }

  console.log('💰 Price Statistics:')
  console.log(`   Min: $${priceStats.min.toFixed(2)}`)
  console.log(`   Max: $${priceStats.max.toFixed(2)}`)
  console.log(`   Avg: $${priceStats.avg.toFixed(2)}`)
  console.log(`   Median: $${priceStats.median.toFixed(2)}`)
  console.log('\n   Price Distribution:')
  priceStats.distribution.forEach(d => {
    const percentage = ((d.count / totalProducts) * 100).toFixed(1)
    console.log(`   ${d.range}: ${d.count} (${percentage}%)`)
  })

  // Category analysis
  const categoryMap = new Map<string, { count: number; totalPrice: number; totalReviews: number }>()
  products.forEach(p => {
    const existing = categoryMap.get(p.category) || { count: 0, totalPrice: 0, totalReviews: 0 }
    categoryMap.set(p.category, {
      count: existing.count + 1,
      totalPrice: existing.totalPrice + p.price,
      totalReviews: existing.totalReviews + p.reviews.length,
    })
  })

  const categoryStats = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      count: stats.count,
      avgPrice: stats.totalPrice / stats.count,
      avgReviews: stats.totalReviews / stats.count,
    }))
    .sort((a, b) => b.count - a.count)

  console.log('\n\n📦 Category Statistics:')
  categoryStats.forEach(cat => {
    const percentage = ((cat.count / totalProducts) * 100).toFixed(1)
    console.log(`   ${cat.category}: ${cat.count} products (${percentage}%)`)
    console.log(`      Avg Price: $${cat.avgPrice.toFixed(2)}`)
    console.log(`      Avg Reviews: ${cat.avgReviews.toFixed(1)}`)
  })

  // Review analysis
  const allReviews = products.flatMap(p => p.reviews)
  const productsWithReviews = products.filter(p => p.reviews.length > 0).length
  const ratingMap = new Map<number, number>()

  allReviews.forEach(r => {
    ratingMap.set(r.rating, (ratingMap.get(r.rating) || 0) + 1)
  })

  const reviewStats = {
    totalReviews: allReviews.length,
    avgRating: allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0,
    productsWithReviews,
    productsWithoutReviews: totalProducts - productsWithReviews,
    ratingDistribution: Array.from(ratingMap.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => a.rating - b.rating),
  }

  console.log('\n\n⭐ Review Statistics:')
  console.log(`   Total Reviews: ${reviewStats.totalReviews}`)
  console.log(`   Avg Rating: ${reviewStats.avgRating.toFixed(2)}`)
  console.log(`   Products with Reviews: ${productsWithReviews} (${((productsWithReviews / totalProducts) * 100).toFixed(1)}%)`)
  console.log(`   Products without Reviews: ${reviewStats.productsWithoutReviews} (${((reviewStats.productsWithoutReviews / totalProducts) * 100).toFixed(1)}%)`)
  console.log('\n   Rating Distribution:')
  reviewStats.ratingDistribution.forEach(r => {
    const percentage = ((r.count / reviewStats.totalReviews) * 100).toFixed(1)
    console.log(`   ${r.rating} stars: ${r.count} (${percentage}%)`)
  })

  // Seller analysis
  const sellers = await prisma.seller.findMany()
  const sellerStats = {
    totalSellers: sellers.length,
    avgSellerRating: sellers.reduce((sum, s) => sum + s.rating, 0) / sellers.length,
    avgTotalSales: sellers.reduce((sum, s) => sum + s.totalSales, 0) / sellers.length,
    sellersWithHighRating: sellers.filter(s => s.rating >= 4.0).length,
  }

  console.log('\n\n👥 Seller Statistics:')
  console.log(`   Total Sellers: ${sellerStats.totalSellers}`)
  console.log(`   Avg Seller Rating: ${sellerStats.avgSellerRating.toFixed(2)}`)
  console.log(`   Avg Total Sales: ${sellerStats.avgTotalSales.toFixed(0)}`)
  console.log(`   High-Rated Sellers (≥4.0): ${sellerStats.sellersWithHighRating} (${((sellerStats.sellersWithHighRating / sellerStats.totalSellers) * 100).toFixed(1)}%)`)

  // Availability analysis
  const availabilityStats = {
    available: products.filter(p => p.isAvailable).length,
    unavailable: products.filter(p => !p.isAvailable).length,
  }

  console.log('\n\n📈 Availability Statistics:')
  console.log(`   Available: ${availabilityStats.available} (${((availabilityStats.available / totalProducts) * 100).toFixed(1)}%)`)
  console.log(`   Unavailable: ${availabilityStats.unavailable} (${((availabilityStats.unavailable / totalProducts) * 100).toFixed(1)}%)`)

  // Age analysis
  const dates = products.map(p => p.createdAt).sort((a, b) => a.getTime() - b.getTime())
  const now = new Date()
  const ages = products.map(p => (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))

  const ageStats = {
    newest: dates[dates.length - 1].toISOString(),
    oldest: dates[0].toISOString(),
    avgAgeInDays: ages.reduce((sum, age) => sum + age, 0) / ages.length,
  }

  console.log('\n\n📅 Age Statistics:')
  console.log(`   Oldest Product: ${new Date(ageStats.oldest).toLocaleDateString()}`)
  console.log(`   Newest Product: ${new Date(ageStats.newest).toLocaleDateString()}`)
  console.log(`   Avg Age: ${ageStats.avgAgeInDays.toFixed(0)} days`)

  return {
    totalProducts,
    priceStats,
    categoryStats,
    reviewStats,
    sellerStats,
    availabilityStats,
    ageStats,
  }
}

async function generateOptimizationRecommendations(stats: ProductStats) {
  console.log('\n\n' + '='.repeat(80))
  console.log('💡 AI SCORING OPTIMIZATION RECOMMENDATIONS')
  console.log('='.repeat(80))

  console.log('\n1. PRICE VALUE SCORE:')
  console.log(`   - Price range: $${stats.priceStats.min.toFixed(2)} - $${stats.priceStats.max.toFixed(2)}`)
  console.log(`   - Median: $${stats.priceStats.median.toFixed(2)}`)
  console.log(`   ✅ Recommendation: Use median ($${stats.priceStats.median.toFixed(2)}) as reference point`)
  console.log(`   - Products above median should get lower price value scores`)
  console.log(`   - Products below median should get higher price value scores`)
  console.log(`   - Discount percentage (originalPrice - price) should boost score`)

  console.log('\n2. TRUST SCORE (Seller Rating):')
  console.log(`   - Current avg seller rating: ${stats.sellerStats.avgSellerRating.toFixed(2)}`)
  console.log(`   - Sellers with high rating (≥4.0): ${((stats.sellerStats.sellersWithHighRating / stats.sellerStats.totalSellers) * 100).toFixed(1)}%`)
  console.log(`   ✅ Recommendation: Use ${stats.sellerStats.avgSellerRating.toFixed(2)} as baseline`)
  console.log(`   - Sellers > ${stats.sellerStats.avgSellerRating.toFixed(2)}: boost trust score`)
  console.log(`   - Factor in total sales as credibility indicator`)

  console.log('\n3. QUALITY SCORE (Product Reviews):')
  console.log(`   - Products with reviews: ${((stats.reviewStats.productsWithReviews / stats.totalProducts) * 100).toFixed(1)}%`)
  console.log(`   - Avg rating: ${stats.reviewStats.avgRating.toFixed(2)}`)
  console.log(`   ⚠️  Issue: ${((stats.reviewStats.productsWithoutReviews / stats.totalProducts) * 100).toFixed(1)}% products have NO reviews`)
  console.log(`   ✅ Recommendation: Use weighted approach`)
  console.log(`   - Products with reviews: use actual rating (scaled to 0-100)`)
  console.log(`   - Products without reviews: use conservative score (60-70) + seller rating influence`)

  console.log('\n4. SOCIAL PROOF:')
  console.log(`   - Total reviews: ${stats.reviewStats.totalReviews}`)
  console.log(`   - Avg reviews per product: ${(stats.reviewStats.totalReviews / stats.totalProducts).toFixed(1)}`)
  console.log(`   ✅ Recommendation: Scale by review count`)
  console.log(`   - 0 reviews: low social proof (40-50)`)
  console.log(`   - 1-5 reviews: moderate (60-70)`)
  console.log(`   - 6-20 reviews: good (70-85)`)
  console.log(`   - 20+ reviews: excellent (85-100)`)

  console.log('\n5. CATEGORY-SPECIFIC ADJUSTMENTS:')
  stats.categoryStats.slice(0, 5).forEach(cat => {
    const percentage = ((cat.count / stats.totalProducts) * 100).toFixed(1)
    console.log(`   ${cat.category} (${percentage}%):`)
    console.log(`      - Avg Price: $${cat.avgPrice.toFixed(2)}`)
    console.log(`      - Avg Reviews: ${cat.avgReviews.toFixed(1)}`)
  })
  console.log(`   ✅ Recommendation: Adjust scoring based on category`)
  console.log(`   - High-price categories (e.g., Electronics): emphasize trust & quality`)
  console.log(`   - Low-price categories (e.g., Accessories): emphasize availability & recency`)

  console.log('\n6. RECENCY/URGENCY:')
  console.log(`   - Avg product age: ${stats.ageStats.avgAgeInDays.toFixed(0)} days`)
  console.log(`   ✅ Recommendation: Boost scores for newer products`)
  console.log(`   - Products < 7 days: +10% urgency bonus`)
  console.log(`   - Products < 30 days: +5% urgency bonus`)
  console.log(`   - Products > 90 days: -5% penalty`)

  console.log('\n7. AVAILABILITY IMPACT:')
  console.log(`   - Available: ${((stats.availabilityStats.available / stats.totalProducts) * 100).toFixed(1)}%`)
  console.log(`   ✅ Recommendation: Penalize unavailable products`)
  console.log(`   - Available products: no change`)
  console.log(`   - Unavailable products: multiply final score by 0.5`)

  console.log('\n' + '='.repeat(80))
}

// Run analysis
analyzeProducts()
  .then(stats => {
    generateOptimizationRecommendations(stats)
    console.log('\n✨ Analysis complete!\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })