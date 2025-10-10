/**
 * Product Comparison API
 * POST /api/compare
 * Compares multiple products and determines the best value
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface CompareRequest {
  productIds: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json()
    const { productIds } = body

    if (!productIds || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No product IDs provided' },
        { status: 400 }
      )
    }

    if (productIds.length > 4) {
      return NextResponse.json(
        { success: false, error: 'Maximum 4 products allowed' },
        { status: 400 }
      )
    }

    logger.info('🔄 Product comparison requested', {
      component: 'ComparisonAPI',
      metadata: { productIds, count: productIds.length }
    })

    // Fetch all products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        }
      }
    })

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products found' },
        { status: 404 }
      )
    }

    // Determine winner
    const winner = determineWinner(products)

    // Generate insights
    const insights = generateInsights(products)

    logger.info('✅ Comparison complete', {
      component: 'ComparisonAPI',
      metadata: {
        productsCompared: products.length,
        winner: winner.productId
      }
    })

    return NextResponse.json({
      success: true,
      products,
      comparison: {
        winner,
        insights
      }
    })
  } catch (error) {
    logger.error('❌ Comparison API error', {
      component: 'ComparisonAPI',
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare products'
      },
      { status: 500 }
    )
  }
}

/**
 * Determine the winning product based on multiple factors
 */
function determineWinner(products: any[]) {
  const scores = products.map(product => {
    let score = 0

    // Price score (lower is better, max 30 points)
    const prices = products.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    if (priceRange > 0) {
      const priceScore = 30 - ((product.price - minPrice) / priceRange) * 30
      score += priceScore
    } else {
      score += 15 // All same price
    }

    // Condition score (max 25 points)
    const conditionScores: Record<string, number> = {
      'New': 25,
      'Like New': 22,
      'Excellent': 20,
      'Good': 15,
      'Fair': 10,
      'Used': 10
    }
    score += conditionScores[product.condition || 'Used'] || 10

    // AI Score (max 20 points)
    if (product.aiScore) {
      score += (parseFloat(product.aiScore.toString()) / 100) * 20
    } else {
      score += 10 // Default
    }

    // Seller rating (max 15 points)
    if (product.seller?.rating) {
      score += (product.seller.rating / 5) * 15
    } else {
      score += 7 // Default
    }

    // Specification completeness (max 10 points)
    const specCount = product.dynamicSpecs ? Object.keys(product.dynamicSpecs).length : 0
    score += Math.min(10, (specCount / 25) * 10)

    return {
      productId: product.id,
      product,
      score: Math.round(score)
    }
  })

  // Find highest score
  scores.sort((a, b) => b.score - a.score)
  const winner = scores[0]

  // Generate reason
  let reason = `Best overall value considering `
  const reasons = []

  // Check why it won
  const allPrices = products.map(p => p.price)
  const isLowestPrice = winner.product.price === Math.min(...allPrices)

  if (isLowestPrice) {
    reasons.push('lowest price')
  }

  if (winner.product.condition === 'New' || winner.product.condition === 'Like New') {
    reasons.push('excellent condition')
  }

  if (winner.product.aiScore && parseFloat(winner.product.aiScore.toString()) > 80) {
    reasons.push('high quality score')
  }

  if (winner.product.seller?.rating && winner.product.seller.rating >= 4.5) {
    reasons.push('trusted seller')
  }

  const specCount = winner.product.dynamicSpecs ? Object.keys(winner.product.dynamicSpecs).length : 0
  if (specCount > 20) {
    reasons.push('detailed specifications')
  }

  reason += reasons.slice(0, 3).join(', ')
  reason += '.'

  return {
    productId: winner.productId,
    reason,
    score: winner.score
  }
}

/**
 * Generate AI insights about the comparison
 */
function generateInsights(products: any[]): string[] {
  const insights: string[] = []

  // Price insights
  const prices = products.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b) / prices.length

  const priceDiff = maxPrice - minPrice
  const priceDiffPct = (priceDiff / minPrice) * 100

  if (priceDiffPct > 20) {
    insights.push(
      `Price varies significantly (${priceDiffPct.toFixed(0)}% difference). The lowest option saves you $${priceDiff.toFixed(2)}.`
    )
  }

  // Condition insights
  const conditions = products.map(p => p.condition || 'Used')
  const hasNew = conditions.includes('New')
  const hasUsed = conditions.includes('Used') || conditions.includes('Good') || conditions.includes('Fair')

  if (hasNew && hasUsed) {
    const newProduct = products.find(p => p.condition === 'New')
    const usedProduct = products.find(p => p.condition !== 'New')
    if (newProduct && usedProduct) {
      const savings = newProduct.price - usedProduct.price
      if (savings > 0) {
        insights.push(
          `Buying used/refurbished could save you $${savings.toFixed(2)} compared to new condition.`
        )
      }
    }
  }

  // Seller insights
  const sellers = products.map(p => p.seller)
  const ratings = sellers.filter(s => s?.rating).map(s => s!.rating)

  if (ratings.length > 0) {
    const avgRating = ratings.reduce((a, b) => a + b) / ratings.length
    const bestRating = Math.max(...ratings)

    if (bestRating >= 4.5) {
      const topSeller = products.find(p => p.seller?.rating === bestRating)
      insights.push(
        `${topSeller?.seller?.businessName} has the highest seller rating (${bestRating}/5) for reliable service.`
      )
    }
  }

  // Specification insights
  const specCounts = products.map(p =>
    p.dynamicSpecs ? Object.keys(p.dynamicSpecs).length : 0
  )
  const maxSpecs = Math.max(...specCounts)

  if (maxSpecs > 20) {
    const detailedProduct = products.find(p =>
      p.dynamicSpecs && Object.keys(p.dynamicSpecs).length === maxSpecs
    )
    insights.push(
      `${detailedProduct?.name} provides the most detailed specifications (${maxSpecs} fields) for informed decision-making.`
    )
  }

  // Value insight
  const pricePerValue = products.map(p => {
    const specCount = p.dynamicSpecs ? Object.keys(p.dynamicSpecs).length : 10
    const conditionMult = p.condition === 'New' ? 1.2 : 1
    const value = (specCount * conditionMult) / p.price
    return { product: p, value }
  })

  pricePerValue.sort((a, b) => b.value - a.value)
  const bestValue = pricePerValue[0]

  insights.push(
    `${bestValue.product.name} offers the best value-for-money ratio based on price, condition, and features.`
  )

  return insights.slice(0, 4) // Max 4 insights
}
