import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories, priceRange, colors, styles, brands, sizes, condition, userId } = body

    logger.info('🎯 Initializing swipe session', {
      categories,
      priceRange,
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

    // Build filters directly from user selections instead of using Claude AI
    // This ensures we get results that match the category without text search restrictions
    logger.info('🎯 Building filters from user selections', { categories, priceRange })

    const structuredFilters: any = {
      searchTerms: [], // Don't use text search - just filter by category
      sortBy: 'relevance',
      limit: 50
    }

    // Set category if provided
    if (categories && categories.length > 0) {
      structuredFilters.category = categories[0] // Use first category for now
    }

    // Apply user filters - only set if values are valid
    if (priceRange) {
      // Only set minPrice if it's greater than 0
      if (priceRange.min !== undefined && priceRange.min !== null && priceRange.min > 0) {
        structuredFilters.minPrice = priceRange.min
      } else {
        // Ensure minPrice is not null/undefined for query executor
        delete structuredFilters.minPrice
      }

      // Only set maxPrice if it's a valid number
      if (priceRange.max !== undefined && priceRange.max !== null && priceRange.max > 0) {
        structuredFilters.maxPrice = priceRange.max
      } else {
        // Ensure maxPrice is not null/undefined for query executor
        delete structuredFilters.maxPrice
      }
    } else {
      // No price range provided, remove any null values from Claude
      delete structuredFilters.minPrice
      delete structuredFilters.maxPrice
    }

    if (brands && brands.length > 0) {
      structuredFilters.brands = brands
    }

    if (condition && condition.length > 0) {
      structuredFilters.condition = condition
    }

    // Fetch products (get more than needed for swiping)
    structuredFilters.limit = 50 // Get 50 products to start

    const results = await safeQueryExecutor.executeQuery(structuredFilters)

    console.log('🔍 Query results:', {
      totalProducts: results.products.length,
      total: results.total,
      hasProducts: results.products.length > 0
    })

    logger.info('✅ Swipe session initialized', {
      sessionId: session.id,
      productsFound: results.products.length,
      totalAvailable: results.total
    })

    // Transform products for swipe interface
    const swipeProducts = results.products.map(p => ({
      id: p.id,
      name: p.name || p.title,
      price: p.price?.current || p.price || 0,
      originalPrice: p.price?.original || p.originalPrice,
      images: Array.isArray(p.images)
        ? p.images
        : p.imageUrl
        ? [p.imageUrl]
        : ['/placeholder-image.jpg'],
      brand: p.brand || p.specifications?.brand,
      category: p.category,
      condition: p.condition || p.specifications?.condition,
      rating: p.rating || p.reviews?.rating || 0,
      description: p.description
    }))

    console.log('📦 Transformed products:', swipeProducts.length, 'products ready')

    return NextResponse.json({
      sessionId: session.id,
      products: swipeProducts,
      totalAvailable: results.total,
      filters: structuredFilters
    })

  } catch (error) {
    logger.error('❌ Failed to initialize swipe session', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Failed to initialize session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
