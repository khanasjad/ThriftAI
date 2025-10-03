import { NextRequest, NextResponse } from 'next/server'
import { veritasScoreService } from '@/lib/services/veritasScoreService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/veritas/compare?productIds=id1,id2,id3
 * Compare Veritas Scores of multiple products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productIdsParam = searchParams.get('productIds')

    if (!productIdsParam) {
      return NextResponse.json(
        { error: 'productIds query parameter is required (comma-separated)' },
        { status: 400 }
      )
    }

    const productIds = productIdsParam.split(',').filter(id => id.trim())

    if (productIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 product IDs are required for comparison' },
        { status: 400 }
      )
    }

    if (productIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 products can be compared at once' },
        { status: 400 }
      )
    }

    // Fetch scores for all products
    const scores = await Promise.all(
      productIds.map(async (productId) => {
        try {
          let score = await veritasScoreService.getScore(productId)

          // Calculate if doesn't exist
          if (!score) {
            const scoreResult = await veritasScoreService.calculateScore(productId)
            await veritasScoreService.saveScore(productId, scoreResult)
            score = await veritasScoreService.getScore(productId)
          }

          // Fetch basic product info
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              name: true,
              category: true,
              brand: true,
              price: true,
              condition: true,
              imageUrl: true
            }
          })

          return {
            product,
            score
          }
        } catch (error: any) {
          console.error(`Error fetching score for product ${productId}:`, error)
          return {
            productId,
            error: error.message
          }
        }
      })
    )

    // Separate successful and failed fetches
    const successful = scores.filter(s => s.score && s.product)
    const failed = scores.filter(s => s.error)

    // Calculate comparison insights
    const insights = calculateComparisonInsights(successful)

    return NextResponse.json({
      success: true,
      comparison: {
        products: successful,
        insights,
        errors: failed.length > 0 ? failed : undefined
      }
    })
  } catch (error: any) {
    console.error('Veritas Score comparison error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Calculate insights from compared products
 */
function calculateComparisonInsights(products: any[]) {
  if (products.length === 0) return null

  const scores = products.map(p => parseFloat(p.score.overallScore))
  const prices = products.map(p => p.product.price)

  // Find best and worst
  const bestScoreIndex = scores.indexOf(Math.max(...scores))
  const worstScoreIndex = scores.indexOf(Math.min(...scores))
  const bestValueIndex = findBestValue(products)

  // Calculate statistics
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  // Category comparison
  const categoryComparison = compareCategoryScores(products)

  return {
    summary: {
      totalCompared: products.length,
      averageScore: avgScore.toFixed(2),
      averagePrice: avgPrice.toFixed(2),
      scoreRange: {
        min: Math.min(...scores).toFixed(2),
        max: Math.max(...scores).toFixed(2)
      }
    },
    recommendations: {
      highestScore: {
        productId: products[bestScoreIndex].product.id,
        productName: products[bestScoreIndex].product.name,
        score: scores[bestScoreIndex].toFixed(2)
      },
      lowestScore: {
        productId: products[worstScoreIndex].product.id,
        productName: products[worstScoreIndex].product.name,
        score: scores[worstScoreIndex].toFixed(2)
      },
      bestValue: {
        productId: products[bestValueIndex].product.id,
        productName: products[bestValueIndex].product.name,
        score: scores[bestValueIndex].toFixed(2),
        price: prices[bestValueIndex].toFixed(2),
        valueRatio: (scores[bestValueIndex] / prices[bestValueIndex]).toFixed(4)
      }
    },
    categoryComparison
  }
}

/**
 * Find product with best value (score/price ratio)
 */
function findBestValue(products: any[]): number {
  let bestRatio = 0
  let bestIndex = 0

  products.forEach((product, index) => {
    const score = parseFloat(product.score.overallScore)
    const price = product.product.price
    const ratio = score / (price || 1) // Avoid division by zero

    if (ratio > bestRatio) {
      bestRatio = ratio
      bestIndex = index
    }
  })

  return bestIndex
}

/**
 * Compare category scores across products
 */
function compareCategoryScores(products: any[]) {
  const categories = [
    'PRODUCT_QUALITY',
    'SELLER_TRUST',
    'MARKET_VALUE',
    'SUSTAINABILITY',
    'SECURITY_SAFETY',
    'USER_EXPERIENCE'
  ]

  return categories.map(categoryName => {
    const categoryScores = products.map(p => {
      const category = p.score.categories?.find((c: any) => c.categoryName === categoryName)
      return {
        productId: p.product.id,
        productName: p.product.name,
        score: category ? parseFloat(category.categoryScore) : 0
      }
    })

    const scores = categoryScores.map(cs => cs.score)
    const bestIndex = scores.indexOf(Math.max(...scores))

    return {
      category: categoryName,
      leader: categoryScores[bestIndex],
      allScores: categoryScores,
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
    }
  })
}
