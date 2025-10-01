import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category') || 'ALL'
    const minPrice = Number(searchParams.get('minPrice')) || 0
    const maxPrice = Number(searchParams.get('maxPrice')) || 999999
    const condition = searchParams.get('condition') || 'ALL'
    const limit = Number(searchParams.get('limit')) || 20

    logger.info('🏆 Leaderboard request', {
      category,
      minPrice,
      maxPrice,
      condition,
      limit
    })

    // Build where clause
    const whereClause: any = {
      isAvailable: true,
      aiScore: { not: null },
      price: {
        gte: minPrice,
        lte: maxPrice
      }
    }

    // Add category filter
    if (category !== 'ALL') {
      whereClause.category = category
    }

    // Add condition filter
    if (condition !== 'ALL') {
      whereClause.condition = condition
    }

    // Fetch top products
    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true,
        originalPrice: true,
        condition: true,
        aiScore: true,
        aiConfidence: true,
        aiScoreBreakdown: true,
        stockQuantity: true,
        shippingCost: true,
        hasFreeShipping: true,
        estimatedDeliveryDays: true,
        hasFreeReturns: true,
        companyMetrics: true
      },
      orderBy: {
        aiScore: 'desc'
      },
      take: limit
    })

    logger.info('✅ Leaderboard results', {
      productsFound: products.length,
      topScore: products[0]?.aiScore,
      lowestScore: products[products.length - 1]?.aiScore
    })

    return NextResponse.json({
      success: true,
      products,
      filters: {
        category,
        minPrice,
        maxPrice,
        condition
      },
      totalResults: products.length
    })

  } catch (error) {
    logger.error('❌ Leaderboard error', { error })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard',
        products: []
      },
      { status: 500 }
    )
  }
}
