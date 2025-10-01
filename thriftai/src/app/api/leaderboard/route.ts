/**
 * Leaderboard API Endpoint
 *
 * Provides product rankings based on AI scores:
 * - Global top 100 products
 * - Category-specific leaderboards
 * - Price tier leaderboards (budget, mid, premium, luxury)
 * - Real-time ranking updates
 *
 * Uses materialized view for performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'global' // global, category, price_tier
    const category = searchParams.get('category')
    const priceTier = searchParams.get('priceTier') // budget, mid, premium, luxury
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    logger.info('Leaderboard request', { type, category, priceTier, limit })

    let results: any[]

    if (type === 'global') {
      // Global leaderboard - top products across all categories
      results = await prisma.$queryRawUnsafe(`
        SELECT
          id,
          name,
          category,
          brand,
          price,
          "originalPrice",
          ai_score as "aiScore",
          ai_confidence as "aiConfidence",
          "imageUrl",
          global_rank as "globalRank",
          leaderboard_badges as badges,
          last_scored_at as "lastScoredAt"
        FROM product_leaderboard
        WHERE global_rank IS NOT NULL
        ORDER BY global_rank
        LIMIT $1 OFFSET $2
      `, limit, offset)

    } else if (type === 'category' && category) {
      // Category-specific leaderboard
      results = await prisma.$queryRawUnsafe(`
        SELECT
          id,
          name,
          category,
          brand,
          price,
          "originalPrice",
          ai_score as "aiScore",
          ai_confidence as "aiConfidence",
          "imageUrl",
          category_rank as "categoryRank",
          leaderboard_badges as badges,
          last_scored_at as "lastScoredAt"
        FROM product_leaderboard
        WHERE category = $1
          AND category_rank IS NOT NULL
        ORDER BY category_rank
        LIMIT $2 OFFSET $3
      `, category, limit, offset)

    } else if (type === 'price_tier' && priceTier) {
      // Price tier leaderboard
      results = await prisma.$queryRawUnsafe(`
        SELECT
          id,
          name,
          category,
          brand,
          price,
          "originalPrice",
          ai_score as "aiScore",
          ai_confidence as "aiConfidence",
          "imageUrl",
          price_tier_rank as "priceTierRank",
          leaderboard_badges as badges,
          last_scored_at as "lastScoredAt"
        FROM product_leaderboard
        WHERE price_tier = $1
          AND price_tier_rank IS NOT NULL
        ORDER BY price_tier_rank
        LIMIT $2 OFFSET $3
      `, priceTier, limit, offset)

    } else {
      return NextResponse.json(
        { error: 'Invalid leaderboard type or missing required parameters' },
        { status: 400 }
      )
    }

    // Get total count for pagination
    let totalCount = 0
    if (type === 'global') {
      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count
        FROM product_leaderboard
        WHERE global_rank IS NOT NULL
      `)
      totalCount = parseInt(countResult[0].count)

    } else if (type === 'category' && category) {
      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count
        FROM product_leaderboard
        WHERE category = $1
      `, category)
      totalCount = parseInt(countResult[0].count)

    } else if (type === 'price_tier' && priceTier) {
      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count
        FROM product_leaderboard
        WHERE price_tier = $1
      `, priceTier)
      totalCount = parseInt(countResult[0].count)
    }

    // Format results
    const leaderboard = results.map(product => ({
      ...product,
      price: parseFloat(product.price),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
      aiScore: product.aiScore ? parseFloat(product.aiScore) : null,
      aiConfidence: product.aiConfidence ? parseFloat(product.aiConfidence) : null,
      badges: Array.isArray(product.badges) ? product.badges : [],
      rank: Number(product.globalRank || product.categoryRank || product.priceTierRank),
      globalRank: product.globalRank ? Number(product.globalRank) : null,
      categoryRank: product.categoryRank ? Number(product.categoryRank) : null,
      priceTierRank: product.priceTierRank ? Number(product.priceTierRank) : null
    }))

    // Get leaderboard metadata
    const metadata = await getLeaderboardMetadata(type, category, priceTier)

    const response = {
      leaderboard,
      metadata: {
        type,
        category: category || undefined,
        priceTier: priceTier || undefined,
        limit,
        offset,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1,
        generatedAt: new Date().toISOString(),
        ...metadata
      }
    }

    logger.info('Leaderboard returned', {
      type,
      resultsCount: leaderboard.length,
      totalCount
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Leaderboard error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get metadata about the leaderboard
 */
async function getLeaderboardMetadata(
  type: string,
  category?: string | null,
  priceTier?: string | null
) {
  try {
    if (type === 'global') {
      // Get average score and top categories
      const stats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          AVG(ai_score) as "avgScore",
          MIN(ai_score) as "minScore",
          MAX(ai_score) as "maxScore"
        FROM product_leaderboard
      `)

      const topCategories = await prisma.$queryRawUnsafe<any[]>(`
        SELECT category, COUNT(*) as count
        FROM product_leaderboard
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `)

      return {
        averageScore: stats[0]?.avgScore ? parseFloat(stats[0].avgScore) : null,
        minScore: stats[0]?.minScore ? parseFloat(stats[0].minScore) : null,
        maxScore: stats[0]?.maxScore ? parseFloat(stats[0].maxScore) : null,
        topCategories: topCategories.map(c => ({
          category: c.category,
          count: parseInt(c.count)
        }))
      }

    } else if (type === 'category' && category) {
      // Get category-specific stats
      const stats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          AVG(ai_score) as "avgScore",
          AVG(price) as "avgPrice"
        FROM product_leaderboard
        WHERE category = $1
      `, category)

      return {
        averageScore: stats[0]?.avgScore ? parseFloat(stats[0].avgScore) : null,
        averagePrice: stats[0]?.avgPrice ? parseFloat(stats[0].avgPrice) : null
      }

    } else if (type === 'price_tier' && priceTier) {
      // Get price tier stats
      const stats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          AVG(ai_score) as "avgScore",
          MIN(price) as "minPrice",
          MAX(price) as "maxPrice"
        FROM product_leaderboard
        WHERE price_tier = $1
      `, priceTier)

      return {
        averageScore: stats[0]?.avgScore ? parseFloat(stats[0].avgScore) : null,
        priceRange: {
          min: stats[0]?.minPrice ? parseFloat(stats[0].minPrice) : null,
          max: stats[0]?.maxPrice ? parseFloat(stats[0].maxPrice) : null
        }
      }
    }

    return {}
  } catch (error) {
    logger.error('Error fetching leaderboard metadata', { error })
    return {}
  }
}

/**
 * POST method to refresh leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('Refreshing leaderboard')

    // Call the database function to refresh the materialized view
    await prisma.$executeRaw`SELECT refresh_product_leaderboard()`

    logger.info('Leaderboard refreshed successfully')

    return NextResponse.json({
      success: true,
      message: 'Leaderboard refreshed successfully',
      refreshedAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error refreshing leaderboard', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Failed to refresh leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
