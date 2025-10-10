import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/services/aiService'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/middleware/rateLimit'
import { validateSearchParams } from '@/lib/validations/search'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  return rateLimit(rateLimitConfigs.search)(request, async () => {
    try {
      const { searchParams } = new URL(request.url)

      // Validate input parameters
      const validatedParams = validateSearchParams(searchParams)
      const { q: query, category, minPrice, maxPrice, page, limit } = validatedParams

    console.log(`🔍 Search API called with query: "${query}"`)

    let products: any[] = []
    let total = 0

    if (query) {
      // Use AIService for smart word boundary search when there's a query
      const budget = maxPrice ? parseFloat(maxPrice) : undefined
      const searchResults = await AIService.searchProducts(query, budget)

      // Filter by category if specified
      let filteredResults = searchResults
      if (category) {
        filteredResults = searchResults.filter(p => p.category === category)
      }

      // Filter by price range
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice)
        filteredResults = filteredResults.filter(p => p.price >= minPriceValue)
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      products = filteredResults.slice(startIndex, endIndex)
      total = filteredResults.length

      console.log(`🔍 AI Search returned ${total} total products, showing ${products.length} on page ${page}`)
    } else {
      // Use traditional search when no query (for browsing)
      const where: any = {
        isAvailable: true,
      }

      if (category) {
        where.category = category
      }

      if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = parseFloat(minPrice)
        if (maxPrice) where.price.lte = parseFloat(maxPrice)
      }

      const skip = (page - 1) * limit

      const [productResults, totalCount] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            seller: {
              select: {
                businessName: true,
                rating: true
              }
            },
            veritasScore: {
              include: {
                categories: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ])

      products = productResults.map(p => ({
        ...p,
        veritasScore: p.veritasScore ? {
          ssn: p.veritasScore.ssn,
          overallScore: Number(p.veritasScore.overallScore),
          confidence: Number(p.veritasScore.confidence),
          grade: calculateVeritasGrade(Number(p.veritasScore.overallScore)),
          categories: p.veritasScore.categories.map(c => ({
            name: c.categoryName,
            score: Number(c.categoryScore),
            weight: Number(c.weight)
          }))
        } : null
      }))
      total = totalCount
    }

    // Enrich AI search results with Veritas scores from database
    if (query && products.length > 0) {
      const productIds = products.map(p => p.id)
      const veritasScores = await prisma.veritasScore.findMany({
        where: {
          productId: { in: productIds }
        },
        include: {
          categories: true
        }
      })

      const scoresMap = new Map(veritasScores.map(s => [s.productId, s]))

      products = products.map(p => ({
        ...p,
        veritasScore: scoresMap.has(p.id) ? {
          ssn: scoresMap.get(p.id)!.ssn,
          overallScore: Number(scoresMap.get(p.id)!.overallScore),
          confidence: Number(scoresMap.get(p.id)!.confidence),
          grade: calculateVeritasGrade(Number(scoresMap.get(p.id)!.overallScore)),
          categories: scoresMap.get(p.id)!.categories.map(c => ({
            name: c.categoryName,
            score: Number(c.categoryScore),
            weight: Number(c.weight)
          }))
        } : null
      }))
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    function calculateVeritasGrade(score: number): string {
      if (score >= 95) return 'S'
      if (score >= 85) return 'A'
      if (score >= 75) return 'B'
      if (score >= 65) return 'C'
      if (score >= 50) return 'D'
      return 'F'
    }
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid input parameters',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        )
      }

      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}