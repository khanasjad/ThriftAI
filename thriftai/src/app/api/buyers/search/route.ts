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
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ])

      products = productResults
      total = totalCount
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