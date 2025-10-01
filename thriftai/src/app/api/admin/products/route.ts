/**
 * Admin Products API
 * Provides advanced filtering, sorting, and analytics for all products
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const condition = searchParams.get('condition')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minScore = searchParams.get('minScore')
    const maxScore = searchParams.get('maxScore')
    const isAvailable = searchParams.get('isAvailable')
    const hasAIScore = searchParams.get('hasAIScore')
    const hasFreeShipping = searchParams.get('hasFreeShipping')
    const search = searchParams.get('search')

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build WHERE clause
    const where: any = {}

    if (category) where.category = category
    if (brand) where.brand = brand
    if (condition) where.condition = condition
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true'
    if (hasFreeShipping !== null) where.hasFreeShipping = hasFreeShipping === 'true'

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (minScore || maxScore) {
      where.aiScore = {}
      if (minScore) where.aiScore.gte = parseFloat(minScore)
      if (maxScore) where.aiScore.lte = parseFloat(maxScore)
    }

    if (hasAIScore === 'true') {
      where.aiScore = { not: null }
    } else if (hasAIScore === 'false') {
      where.aiScore = null
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build ORDER BY clause
    const orderBy: any = {}

    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder
        break
      case 'price':
        orderBy.price = sortOrder
        break
      case 'aiScore':
        orderBy.aiScore = sortOrder
        break
      case 'globalRank':
        orderBy.globalRank = sortOrder
        break
      case 'category':
        orderBy.category = sortOrder
        break
      case 'brand':
        orderBy.brand = sortOrder
        break
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder
        break
    }

    logger.info('Fetching products with filters', { where, orderBy, page, limit })

    // Fetch products and count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          category: true,
          brand: true,
          price: true,
          originalPrice: true,
          condition: true,
          description: true,
          imageUrl: true,
          isAvailable: true,
          stockQuantity: true,
          hasFreeShipping: true,
          hasFreeReturns: true,
          estimatedDeliveryDays: true,
          aiScore: true,
          aiConfidence: true,
          aiScoreBreakdown: true,
          lastScoredAt: true,
          globalRank: true,
          categoryRank: true,
          priceTierRank: true,
          leaderboardBadges: true,
          dynamicSpecs: true,
          companyMetrics: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.product.count({ where })
    ])

    // Get filter options
    const [categories, brands, conditions] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { category: 'asc' }
      }),
      prisma.product.groupBy({
        by: ['brand'],
        _count: true,
        orderBy: { _count: { brand: 'desc' } },
        take: 100
      }),
      prisma.product.groupBy({
        by: ['condition'],
        _count: true,
        orderBy: { condition: 'asc' }
      })
    ])

    // Get statistics
    const stats = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN ai_score IS NOT NULL THEN 1 END) as scored,
        AVG(ai_score) as avg_score,
        MIN(ai_score) as min_score,
        MAX(ai_score) as max_score,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(CASE WHEN "isAvailable" = true THEN 1 END) as available,
        COUNT(CASE WHEN "hasFreeShipping" = true THEN 1 END) as free_shipping
      FROM products
    `

    const response = {
      products: products.map(p => ({
        ...p,
        aiScore: p.aiScore ? parseFloat(p.aiScore.toString()) : null,
        aiConfidence: p.aiConfidence ? parseFloat(p.aiConfidence.toString()) : null,
        globalRank: p.globalRank ? Number(p.globalRank) : null,
        categoryRank: p.categoryRank ? Number(p.categoryRank) : null,
        priceTierRank: p.priceTierRank ? Number(p.priceTierRank) : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + products.length < total
      },
      filters: {
        categories: categories.map(c => ({
          value: c.category,
          label: c.category.replace(/_/g, ' '),
          count: c._count
        })),
        brands: brands.map(b => ({
          value: b.brand || 'Unknown',
          label: b.brand || 'Unknown',
          count: b._count
        })),
        conditions: conditions.map(c => ({
          value: c.condition || 'Unknown',
          label: c.condition || 'Unknown',
          count: c._count
        }))
      },
      statistics: {
        total: parseInt(stats[0].total),
        scored: parseInt(stats[0].scored),
        avgScore: stats[0].avg_score ? parseFloat(stats[0].avg_score) : null,
        minScore: stats[0].min_score ? parseFloat(stats[0].min_score) : null,
        maxScore: stats[0].max_score ? parseFloat(stats[0].max_score) : null,
        avgPrice: stats[0].avg_price ? parseFloat(stats[0].avg_price) : null,
        minPrice: stats[0].min_price ? parseFloat(stats[0].min_price) : null,
        maxPrice: stats[0].max_price ? parseFloat(stats[0].max_price) : null,
        available: parseInt(stats[0].available),
        freeShipping: parseInt(stats[0].free_shipping)
      }
    }

    logger.info('Products fetched successfully', {
      count: products.length,
      total,
      page
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Error fetching products', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
