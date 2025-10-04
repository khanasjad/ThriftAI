/**
 * API endpoint to fetch products with Veritas Scores
 * GET /api/products/veritas
 *
 * Query params:
 * - limit: number of products (default: 20)
 * - offset: pagination offset (default: 0)
 * - category: filter by category (optional)
 * - minScore: minimum Veritas score (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { veritasScoreService } from '@/lib/services/veritasScoreService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const minScore = searchParams.get('minScore') ? parseFloat(searchParams.get('minScore')!) : undefined

    // Build filter
    const where: any = {
      isAvailable: true
    }

    if (category) {
      where.category = category
    }

    // Fetch products with existing Veritas scores
    const products = await prisma.product.findMany({
      where,
      include: {
        veritasScore: true,
        companyProfile: true,
        sellerProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Calculate scores for products that don't have them yet
    const productsWithScores = await Promise.all(
      products.map(async (product) => {
        let score = product.veritasScore?.[0]

        // Calculate score if missing or outdated
        if (!score || (score.nextUpdateDue && new Date() > score.nextUpdateDue)) {
          try {
            console.log(`[API] Calculating Veritas Score for product ${product.id}`)
            const scoreResult = await veritasScoreService.calculateScore(product.id)
            await veritasScoreService.saveScore(product.id, scoreResult)

            // Refetch to get saved score
            const updatedProduct = await prisma.product.findUnique({
              where: { id: product.id },
              include: {
                veritasScore: true,
                companyProfile: true,
                sellerProfile: true
              }
            })

            score = updatedProduct?.veritasScore?.[0]
          } catch (error) {
            console.error(`[API] Error calculating score for ${product.id}:`, error)
          }
        }

        // Filter by minimum score if specified
        if (minScore && score && Number(score.overallScore) < minScore) {
          return null
        }

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          price: Number(product.price),
          originalPrice: Number(product.originalPrice),
          condition: product.condition,
          imageUrl: product.imageUrl,

          // Veritas Score data
          veritasScore: score ? {
            ssn: score.ssn,
            overallScore: Number(score.overallScore),
            confidence: Number(score.confidence),
            dataQualityScore: Number(score.dataQualityScore),
            calculatedAt: score.calculatedAt,

            // Category breakdown
            categories: score.categories.map(cat => ({
              name: cat.categoryName,
              score: Number(cat.categoryScore),
              weight: Number(cat.weight),
              weightedScore: Number(cat.weightedScore)
            }))
          } : null,

          // Company/Seller info
          companyProfile: product.companyProfile ? {
            brandName: product.companyProfile.brandName,
            brandReputation: Number(product.companyProfile.brandReputationScore),
            stockSymbol: product.companyProfile.stockSymbol
          } : null,

          sellerProfile: product.sellerProfile ? {
            seller: product.sellerProfile.sellerIdentifier,
            rating: Number(product.sellerProfile.sellerRating),
            isTopRated: product.sellerProfile.isTopRated
          } : null
        }
      })
    )

    // Filter out nulls (products below minScore)
    const filteredProducts = productsWithScores.filter(p => p !== null)

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where })

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('[API] Error fetching products with Veritas scores:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}
