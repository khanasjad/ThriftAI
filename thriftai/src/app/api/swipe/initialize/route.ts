import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { AIService } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories, priceRange, colors, styles, brands, sizes, condition, userId, query } = body

    logger.info('🎯 Initializing AI-powered swipe session', {
      categories,
      priceRange,
      query,
      userId
    })

    // Create swipe session in database
    const session = await prisma.swipeSession.create({
      data: {
        userId: userId || null,
        buyerId: userId || null,
        filters: {
          categories: categories || [],
          priceRange: priceRange || { min: 0, max: 1000 },
          colors: colors || [],
          styles: styles || [],
          brands: brands || [],
          sizes: sizes || [],
          condition: condition || []
        },
        deviceType: request.headers.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop',
        userAgent: request.headers.get('user-agent') || undefined
      }
    })

    // Build intelligent query with Veritas Score sorting and optional AI search
    let products: any[] = []

    if (query && query.trim()) {
      // Use AI-powered search if query is provided
      logger.info('🤖 Using AI-powered search for query', { query, priceRange })

      // Use AIService enhanced search for better accuracy
      const maxPrice = priceRange?.max && priceRange.max > 0 ? priceRange.max : undefined
      const searchResults = await AIService.searchProductsEnhanced(
        query,
        maxPrice,
        { field: 'relevance', direction: 'desc' }
      )

      // Fetch full product details with Veritas scores
      const productIds = searchResults.map(p => p.id)
      products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isAvailable: true
        },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          brand: true,
          category: true,
          condition: true,
          imageUrl: true,
          description: true,
          aiScore: true,
          veritasScore: {
            select: {
              overallScore: true,
              confidence: true,
              ssn: true
            }
          },
          seller: {
            select: {
              businessName: true,
              rating: true
            }
          }
        }
      })

      // Sort by Veritas score
      products.sort((a, b) => {
        const scoreA = a.veritasScore ? Number(a.veritasScore.overallScore) : (a.aiScore || 0)
        const scoreB = b.veritasScore ? Number(b.veritasScore.overallScore) : (b.aiScore || 0)
        return scoreB - scoreA
      })

      logger.info('✅ AI search completed', { found: products.length, query })
    } else {
      // Use category/filter-based search if no query
      logger.info('🤖 Using filter-based search with Veritas scoring', { categories, priceRange })

      const where: any = {
        isAvailable: true
      }

      // Apply category filter
      if (categories && categories.length > 0) {
        where.category = { in: categories }
      }

      // Apply price range filter
      if (priceRange) {
        where.price = {}
        if (priceRange.min && priceRange.min > 0) {
          where.price.gte = priceRange.min
        }
        if (priceRange.max && priceRange.max > 0) {
          where.price.lte = priceRange.max
        }
        // Remove price filter if empty
        if (Object.keys(where.price).length === 0) {
          delete where.price
        }
      }

      // Apply additional filters
      if (brands && brands.length > 0) {
        where.brand = { in: brands }
      }

      if (condition && condition.length > 0) {
        where.condition = { in: condition }
      }

      // Fetch products with Veritas Scores and sort by score (best products first)
      products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          brand: true,
          category: true,
          condition: true,
          imageUrl: true,
          description: true,
          aiScore: true,
          veritasScore: {
            select: {
              overallScore: true,
              confidence: true,
              ssn: true
            }
          },
          seller: {
            select: {
              businessName: true,
              rating: true
            }
          }
        },
        // Order by Veritas Score (descending) - best products first!
        orderBy: [
          { aiScore: 'desc' },           // Primary: AI Score (Veritas equivalent)
          { createdAt: 'desc' }           // Secondary: Newest first
        ],
        take: 100 // Fetch more products for better selection
      })
    }

    // Show all products sorted by Veritas/AI score (best first, even if score is 0)
    const qualityProducts = products

    console.log('🔍 AI-powered search results:', {
      totalProducts: products.length,
      qualityProducts: qualityProducts.length,
      averageScore: qualityProducts.length > 0
        ? (qualityProducts.reduce((sum, p) => sum + (p.veritasScore ? Number(p.veritasScore.overallScore) : (p.aiScore || 0)), 0) / qualityProducts.length).toFixed(1)
        : 0
    })

    // Take top 50 best-scoring products for swipe deck
    const topProducts = qualityProducts.slice(0, 50)

    logger.info('✅ AI-powered swipe session initialized', {
      sessionId: session.id,
      productsFound: topProducts.length,
      totalAvailable: products.length,
      qualityProducts: qualityProducts.length
    })

    // Transform products for swipe interface with Veritas score metadata
    const swipeProducts = topProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price || 0,
      originalPrice: p.originalPrice,
      images: p.imageUrl ? [p.imageUrl] : ['/placeholder-image.jpg'],
      brand: p.brand,
      category: p.category,
      condition: p.condition,
      description: p.description,
      // Include Veritas score for frontend display (optional)
      veritasScore: p.veritasScore ? {
        score: Number(p.veritasScore.overallScore),
        confidence: Number(p.veritasScore.confidence),
        ssn: p.veritasScore.ssn
      } : undefined
    }))

    console.log('📦 Transformed AI-ranked products:', swipeProducts.length, 'top-quality products ready')

    return NextResponse.json({
      sessionId: session.id,
      products: swipeProducts,
      totalAvailable: products.length,
      qualityProductsCount: qualityProducts.length,
      filters: {
        categories: categories || [],
        priceRange: priceRange || { min: 0, max: 1000 }
      },
      metadata: {
        aiPowered: true,
        sortedBy: 'veritasScore',
        minimumScore: 1,
        averageScore: qualityProducts.length > 0
          ? (qualityProducts.reduce((sum, p) => sum + (p.veritasScore ? Number(p.veritasScore.overallScore) : (p.aiScore || 0)), 0) / qualityProducts.length).toFixed(1)
          : 0
      }
    })

  } catch (error) {
    console.error('❌ Swipe initialization error:', error)
    logger.error('❌ Failed to initialize swipe session', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'Failed to initialize session',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
