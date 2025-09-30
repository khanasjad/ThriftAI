/**
 * Optimized AI Score Parameters Generator
 *
 * Based on database analysis:
 * - 22 products total
 * - Price range: $8.99 - $899.99 (median: $55)
 * - Categories: ACCESSORIES ($85 avg), ELECTRONICS ($338 avg), SHOES ($64 avg), CLOTHING ($35 avg)
 * - NO reviews or seller ratings in database
 *
 * This service generates realistic, deterministic parameters optimized for the actual product distribution.
 */

export interface OptimizedScoreParams {
  // Seller metrics
  sellerRating: number
  sellerTotalSales: number
  sellerResponseTime: number

  // Product quality
  rating: number
  reviewCount: number
  recentReviewCount: number
  verifiedPurchaseRatio: number

  // Shipping
  estimatedDeliveryDays: number
  hasFreeShipping: boolean
  hasFastShipping: boolean
  shippingCost: number
  returnPeriodDays: number
  hasFreeReturns: boolean
  hasWarranty: boolean

  // Availability & urgency
  stockLevel: number
  viewsLast24h: number
  salesLast7Days: number
  cartAdditionsLast24h: number

  // Search relevance
  clickThroughRate: number
  conversionRate: number
  bounceRate: number

  // Competition
  marketAveragePrice: number
}

// Database statistics (from analysis)
const DB_STATS = {
  MEDIAN_PRICE: 55.0,
  MIN_PRICE: 8.99,
  MAX_PRICE: 899.99,
  AVG_PRICE: 140.11
}

const CATEGORY_AVG_PRICES: Record<string, number> = {
  'ACCESSORIES': 84.85,
  'ELECTRONICS': 337.74,
  'SHOES': 64.10,
  'CLOTHING': 35.37
}

// Category-specific scoring profiles
const CATEGORY_PROFILES = {
  'ELECTRONICS': {
    trustWeight: 1.3,      // Electronics need higher trust (expensive items)
    qualityWeight: 1.2,    // Quality matters more
    reviewWeight: 1.4,     // Reviews very important for tech
    priceWeight: 0.9,      // Less price-sensitive for quality tech
    avgReviewMultiplier: 1.5
  },
  'ACCESSORIES': {
    trustWeight: 1.0,
    qualityWeight: 1.1,
    reviewWeight: 1.2,
    priceWeight: 1.2,      // Price-sensitive category
    avgReviewMultiplier: 1.0
  },
  'SHOES': {
    trustWeight: 1.0,
    qualityWeight: 1.3,    // Fit and quality critical
    reviewWeight: 1.5,     // Reviews crucial (sizing info)
    priceWeight: 1.1,
    avgReviewMultiplier: 1.3
  },
  'CLOTHING': {
    trustWeight: 0.9,
    qualityWeight: 1.2,
    reviewWeight: 1.4,     // Reviews important (sizing, fit)
    priceWeight: 1.3,      // Very price-sensitive
    avgReviewMultiplier: 1.2
  },
  'DEFAULT': {
    trustWeight: 1.0,
    qualityWeight: 1.0,
    reviewWeight: 1.0,
    priceWeight: 1.0,
    avgReviewMultiplier: 1.0
  }
}

/**
 * Get hash value from product ID for consistent randomization
 */
function getProductHash(productId: string): number {
  if (!productId) return 42
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Determine price tier for a product
 */
function getPriceTier(price: number): 'budget' | 'mid' | 'premium' | 'luxury' {
  if (price < DB_STATS.MEDIAN_PRICE * 0.7) return 'budget'      // < $38
  if (price < DB_STATS.MEDIAN_PRICE * 1.5) return 'mid'        // < $82
  if (price < DB_STATS.MEDIAN_PRICE * 5) return 'premium'      // < $275
  return 'luxury'                                                // >= $275
}

/**
 * Generate optimized scoring parameters based on product data
 */
export function generateOptimizedParams(
  productId: string,
  price: number,
  category: string = 'DEFAULT',
  originalPrice?: number
): OptimizedScoreParams {

  const hash = getProductHash(productId)
  const priceTier = getPriceTier(price)
  const categoryProfile = CATEGORY_PROFILES[category as keyof typeof CATEGORY_PROFILES] || CATEGORY_PROFILES.DEFAULT

  // Price-based modifiers (relative to median)
  const priceRatio = price / DB_STATS.MEDIAN_PRICE
  const priceNormalized = Math.min(price / DB_STATS.MAX_PRICE, 1) // 0-1 scale

  // Discount factor (if originalPrice exists)
  const discountFactor = originalPrice && originalPrice > price
    ? ((originalPrice - price) / originalPrice)
    : 0

  // ========================================
  // SELLER METRICS
  // ========================================

  // Seller rating: Higher-priced items have better sellers (3.5-5.0 range)
  // Use hash for variation but trend upward with price
  const sellerRatingBase = 3.5 + (priceNormalized * 1.0) + ((hash % 100) / 200)
  const sellerRating = Math.min(5.0, Math.max(3.2, sellerRatingBase))

  // Total sales: Higher for mid-price items (bell curve)
  // Budget: 50-200, Mid: 200-500, Premium: 100-300, Luxury: 50-150
  let sellerTotalSales = 100
  if (priceTier === 'budget') {
    sellerTotalSales = 50 + ((hash % 150))
  } else if (priceTier === 'mid') {
    sellerTotalSales = 200 + ((hash % 300))
  } else if (priceTier === 'premium') {
    sellerTotalSales = 100 + ((hash % 200))
  } else {
    sellerTotalSales = 50 + ((hash % 100))
  }

  // Response time: Better for premium items (1-12 hours)
  const sellerResponseTime = priceTier === 'luxury' || priceTier === 'premium'
    ? 1 + ((hash % 4))
    : 2 + ((hash % 10))

  // ========================================
  // REVIEW METRICS
  // ========================================

  // Rating: Correlate with price tier and seller rating
  // Budget: 3.0-4.0, Mid: 3.5-4.5, Premium: 4.0-4.8, Luxury: 4.2-5.0
  let ratingBase = 3.0
  if (priceTier === 'budget') {
    ratingBase = 3.0 + ((hash % 100) / 100)
  } else if (priceTier === 'mid') {
    ratingBase = 3.5 + ((hash % 100) / 100)
  } else if (priceTier === 'premium') {
    ratingBase = 4.0 + ((hash % 80) / 100)
  } else {
    ratingBase = 4.2 + ((hash % 80) / 100)
  }
  const rating = Math.min(5.0, ratingBase * categoryProfile.reviewWeight)

  // Review count: More reviews for mid-priced popular items
  // Also influenced by category (shoes/clothing get more reviews)
  let reviewCountBase = 0
  if (priceTier === 'budget') {
    reviewCountBase = 5 + ((hash % 30))
  } else if (priceTier === 'mid') {
    reviewCountBase = 20 + ((hash % 80))
  } else if (priceTier === 'premium') {
    reviewCountBase = 10 + ((hash % 50))
  } else {
    reviewCountBase = 5 + ((hash % 20))
  }
  const reviewCount = Math.floor(reviewCountBase * categoryProfile.avgReviewMultiplier)

  // Recent reviews: ~10-20% of total
  const recentReviewCount = Math.floor(reviewCount * (0.1 + ((hash % 10) / 100)))

  // Verified purchase ratio: Higher for premium/luxury
  const verifiedPurchaseRatio = 0.4 + (priceNormalized * 0.3) + ((hash % 20) / 100)

  // ========================================
  // SHIPPING METRICS
  // ========================================

  // Delivery days: Premium items get faster shipping
  const estimatedDeliveryDays = priceTier === 'luxury' || priceTier === 'premium'
    ? 2 + ((hash % 3))
    : 3 + ((hash % 7))

  // Free shipping: Common for items > $50 or premium
  const hasFreeShipping = price > 50 || priceTier === 'premium' || priceTier === 'luxury' || (hash % 100) < 30

  // Fast shipping: Available for premium items
  const hasFastShipping = (priceTier === 'premium' || priceTier === 'luxury') && estimatedDeliveryDays <= 3

  // Shipping cost: $0 if free, otherwise $3-8 based on category
  const shippingCost = hasFreeShipping ? 0 : (3 + ((hash % 5)))

  // Return period: Premium items have longer returns
  const returnPeriodDays = price > 75 || priceTier === 'premium' || priceTier === 'luxury' ? 60 : 30

  // Free returns: Common for premium items or > $50
  const hasFreeReturns = price > 75 || priceTier === 'premium' || priceTier === 'luxury' || (hash % 100) < 40

  // Warranty: More common for electronics and expensive items
  const hasWarranty = (category === 'ELECTRONICS' && price > 100) || priceTier === 'luxury' || (hash % 100) < 20

  // ========================================
  // AVAILABILITY & URGENCY
  // ========================================

  // Stock level: Lower for popular mid-priced items (creates urgency)
  let stockLevel = 20
  if (priceTier === 'budget') {
    stockLevel = 15 + ((hash % 20))
  } else if (priceTier === 'mid') {
    stockLevel = 5 + ((hash % 15))  // Lower stock = popular
  } else if (priceTier === 'premium') {
    stockLevel = 8 + ((hash % 12))
  } else {
    stockLevel = 3 + ((hash % 7))   // Luxury items are scarce
  }

  // Views: Higher for mid-priced items (sweet spot)
  // Budget: 50-150, Mid: 150-400, Premium: 100-250, Luxury: 50-150
  let viewsLast24h = 50
  if (priceTier === 'budget') {
    viewsLast24h = 50 + ((hash % 100))
  } else if (priceTier === 'mid') {
    viewsLast24h = 150 + ((hash % 250))
  } else if (priceTier === 'premium') {
    viewsLast24h = 100 + ((hash % 150))
  } else {
    viewsLast24h = 50 + ((hash % 100))
  }

  // Sales velocity: Higher for mid-priced items
  const salesLast7Days = priceTier === 'mid'
    ? 10 + ((hash % 30))
    : 3 + ((hash % 15))

  // Cart additions: Correlates with views
  const cartAdditionsLast24h = Math.floor(viewsLast24h * (0.05 + ((hash % 10) / 200)))

  // ========================================
  // SEARCH RELEVANCE METRICS
  // ========================================

  // CTR: Higher for well-priced mid-tier items
  // Range: 0.02 - 0.15
  const clickThroughRate = priceTier === 'mid'
    ? 0.06 + ((hash % 90) / 1000)
    : 0.02 + ((hash % 50) / 1000)

  // Conversion: Higher for good value items
  // Boosted by discounts
  const conversionBase = 0.01 + (priceNormalized * 0.03) + (discountFactor * 0.02)
  const conversionRate = Math.min(0.08, conversionBase + ((hash % 30) / 1000))

  // Bounce rate: Lower for better products
  // Influenced by rating and price tier
  const bounceRateBase = 0.6 - (rating / 10) - (priceTier === 'mid' ? 0.1 : 0)
  const bounceRate = Math.max(0.2, Math.min(0.8, bounceRateBase + ((hash % 20) / 100)))

  // ========================================
  // COMPETITION
  // ========================================

  // Market average: Slightly higher than current price (makes our price look good)
  // Use category average as reference
  const categoryAvg = CATEGORY_AVG_PRICES[category as keyof typeof CATEGORY_AVG_PRICES] || DB_STATS.AVG_PRICE
  const marketAveragePrice = Math.max(price * 1.05, categoryAvg * (0.9 + ((hash % 20) / 100)))

  return {
    sellerRating,
    sellerTotalSales,
    sellerResponseTime,
    rating,
    reviewCount,
    recentReviewCount,
    verifiedPurchaseRatio,
    estimatedDeliveryDays,
    hasFreeShipping,
    hasFastShipping,
    shippingCost,
    returnPeriodDays,
    hasFreeReturns,
    hasWarranty,
    stockLevel,
    viewsLast24h,
    salesLast7Days,
    cartAdditionsLast24h,
    clickThroughRate,
    conversionRate,
    bounceRate,
    marketAveragePrice
  }
}

// Export constants for reference
export { DB_STATS, CATEGORY_PROFILES }