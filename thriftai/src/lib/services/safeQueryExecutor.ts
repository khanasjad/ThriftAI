import { prisma } from '@/lib/prisma'
import { StructuredQueryFilters } from './structuredQueryGenerator'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

export interface QueryResult {
  products: any[]
  total: number
  page: number
  totalPages: number
  filters: StructuredQueryFilters
}

/**
 * Safely executes database queries using structured filters
 * NO SQL INJECTION - Uses Prisma's parameterized queries
 */
export class SafeQueryExecutor {
  /**
   * ⚠️ NO HARDCODING PRINCIPLE ⚠️
   * All query understanding is now handled by Claude AI in structuredQueryGenerator
   * This class only executes safe database queries from Claude's structured output
   */

  /**
   * Basic term normalization - NO HARDCODING
   * Typo handling should be done by Claude AI in query generation
   */
  private normalizeSearchTerm(term: string): string {
    return term.toLowerCase().trim()
  }

  /**
   * Execute a safe parameterized query from structured filters
   */
  async executeQuery(filters: StructuredQueryFilters): Promise<QueryResult> {
    try {
      logger.info('🔒 Executing safe parameterized query', {
        searchTerms: filters.searchTerms,
        categories: filters.categories,
        priceRange: { min: filters.minPrice, max: filters.maxPrice }
      })

      // Build WHERE clause using Prisma (100% safe, no SQL injection)
      const whereClause: Prisma.ProductWhereInput = {
        isAvailable: true,
        AND: []
      }

      // NEW INTELLIGENT SEARCH LOGIC:
      // When we have categories (from AI category mapping), prioritize them
      // Search terms become OPTIONAL to boost relevance, not required

      const hasSearchTerms = filters.searchTerms && filters.searchTerms.length > 0
      const hasCategories = filters.categories && filters.categories.length > 0

      if (hasSearchTerms || hasCategories) {
        const normalizedTerms = hasSearchTerms
          ? filters.searchTerms!.map(term => this.normalizeSearchTerm(term))
          : []

        logger.info('🤖 Using Claude AI-generated search terms', {
          original: filters.searchTerms || [],
          normalized: normalizedTerms,
          categories: filters.categories || []
        })

        // Build search conditions for search terms
        const searchConditions: Prisma.ProductWhereInput[] = []
        normalizedTerms.forEach(term => {
          searchConditions.push({
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { brand: { contains: term, mode: 'insensitive' } }
            ]
          })
        })

        // SEMANTIC SEARCH LOGIC:
        // For semantic queries, we need BOTH category filtering AND keyword matching
        // Example: "rare collectibles" → categories: [JEWELRY, WATCHES, ACCESSORIES] + keywords: [rare, limited, exclusive, vintage, designer]
        // This ensures we search within relevant categories for products matching semantic keywords

        if (hasCategories && searchConditions.length > 0) {
          // BEST CASE: Both categories and semantic keywords
          // Find products in relevant categories that match semantic keywords
          whereClause.AND!.push({
            category: {
              in: filters.categories!
            }
          })
          whereClause.AND!.push({
            OR: searchConditions  // Match ANY semantic keyword
          })
        } else if (hasCategories) {
          // Only categories - show all products in those categories
          whereClause.AND!.push({
            category: {
              in: filters.categories!
            }
          })
        } else if (searchConditions.length > 0) {
          // Only keywords - search across ALL categories
          whereClause.AND!.push({
            OR: searchConditions
          })
        }
      }

      // Price range filter
      if ((filters.minPrice !== undefined && filters.minPrice !== null) ||
          (filters.maxPrice !== undefined && filters.maxPrice !== null)) {
        const priceCondition: any = {}
        if (filters.minPrice !== undefined && filters.minPrice !== null) {
          priceCondition.gte = filters.minPrice
        }
        if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
          priceCondition.lte = filters.maxPrice
        }
        if (Object.keys(priceCondition).length > 0) {
          whereClause.AND!.push({ price: priceCondition })
        }
      }

      // Brands filter
      if (filters.brands && filters.brands.length > 0) {
        whereClause.AND!.push({
          brand: {
            in: filters.brands
          }
        })
      }

      // Condition filter
      if (filters.condition && filters.condition.length > 0) {
        whereClause.AND!.push({
          condition: {
            in: filters.condition
          }
        })
      }

      // Build ORDER BY clause (safe - using enums)
      const orderBy: Prisma.ProductOrderByWithRelationInput[] = []

      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price':
            orderBy.push({ price: filters.sortDirection || 'asc' })
            break
          case 'date':
            orderBy.push({ createdAt: filters.sortDirection || 'desc' })
            break
          case 'rating':
            orderBy.push({ rating: filters.sortDirection || 'desc' })
            break
          case 'relevance':
          default:
            // Relevance sorting - prioritize products matching more search terms
            orderBy.push({ createdAt: 'desc' }) // Fallback to newest first
            break
        }
      }

      // Pagination (safe - numeric values)
      const limit = Math.min(filters.limit || 20, 100) // Max 100
      const offset = filters.offset || 0
      const page = Math.floor(offset / limit) + 1

      logger.info('📊 Built safe query parameters', {
        whereClause: JSON.stringify(whereClause, null, 2),
        orderBy,
        limit,
        offset
      })

      // Execute SAFE parameterized queries
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          orderBy,
          take: limit,
          skip: offset,
          include: {
            seller: {
              select: {
                businessName: true,
                rating: true
              }
            },
            reviews: {
              select: {
                rating: true
              }
            }
          }
        }),
        prisma.product.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(total / limit)

      logger.info('✅ Query executed successfully', {
        productsFound: products.length,
        total,
        page,
        totalPages
      })

      // Normalize products to ensure they have all required fields for frontend
      const normalizedProducts = products.map((p: any) => {
        // Calculate rating from reviews if available
        let rating = p.rating || 0
        if (p.reviews && Array.isArray(p.reviews) && p.reviews.length > 0) {
          const totalRating = p.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0)
          rating = totalRating / p.reviews.length
        }

        // Normalize price structure
        const currentPrice = p.price?.current || p.price || 0
        const originalPrice = p.price?.original || p.originalPrice || currentPrice

        // Parse AI scoring fields (use Prisma camelCase field names)
        const aiScore = p.aiScore ? parseFloat(p.aiScore.toString()) : undefined
        const aiConfidence = p.aiConfidence ? parseFloat(p.aiConfidence.toString()) : undefined
        const isHighQuality = aiScore && aiScore >= 70 // Threshold for high quality
        const globalRank = p.globalRank ? Number(p.globalRank) : undefined
        const categoryRank = p.categoryRank ? Number(p.categoryRank) : undefined
        const leaderboardRank = globalRank || categoryRank

        return {
          ...p,
          images: p.images || (p.imageUrl ? [p.imageUrl] : ['/placeholder-image.jpg']),
          title: p.title || p.name,
          asin: p.asin || p.id,
          rating: rating,
          reviews: p.reviews || { rating: rating, count: 0 },
          availability: p.availability || { inStock: p.isAvailable !== false, quantity: p.quantity || 0 },
          specifications: p.specifications || {
            size: p.size || null,
            condition: p.condition || 'Good',
            brand: p.brand || 'Unknown'
          },
          price: {
            current: currentPrice,
            original: originalPrice,
            currency: p.price?.currency || 'USD'
          },
          // AI Scoring fields for frontend
          aiScore,
          aiConfidence,
          isHighQuality,
          leaderboardRank,
          aiScoreBreakdown: p.aiScoreBreakdown,
          lastScoredAt: p.lastScoredAt,
          leaderboardBadges: p.leaderboardBadges || []
        }
      })

      return {
        products: normalizedProducts,
        total,
        page,
        totalPages,
        filters
      }
    } catch (error) {
      logger.error('❌ Query execution failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters
      })

      // Return empty results on error
      return {
        products: [],
        total: 0,
        page: 1,
        totalPages: 0,
        filters
      }
    }
  }

  /**
   * Execute query and enhance results with marketplace data if needed
   */
  async executeWithMarketplace(filters: StructuredQueryFilters): Promise<QueryResult> {
    // First try database
    const dbResults = await this.executeQuery(filters)

    // If we have results, return them
    if (dbResults.products.length > 0) {
      return dbResults
    }

    // If no database results, try marketplace aggregation
    logger.info('💡 No database results, trying marketplace aggregation')

    try {
      const { MarketplaceAggregator } = await import('./marketplaceAggregator')
      const aggregator = new MarketplaceAggregator()

      const marketplaceResults = await aggregator.searchAllMarketplaces({
        query: filters.searchTerms.join(' '),
        category: filters.categories?.[0],
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sources: ['amazon', 'ebay'],
        limit: filters.limit || 20
      })

      logger.info('✅ Found marketplace results', {
        count: marketplaceResults.results.length
      })

      // Normalize marketplace products to match frontend expectations
      const normalizedMarketplaceProducts = marketplaceResults.results.map((p: any) => {
        // Calculate rating from reviews if available
        let rating = p.rating || 0
        if (p.reviews && Array.isArray(p.reviews) && p.reviews.length > 0) {
          const totalRating = p.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0)
          rating = totalRating / p.reviews.length
        }

        // Normalize price structure
        const currentPrice = p.price?.current || p.price || 0
        const originalPrice = p.price?.original || p.originalPrice || currentPrice

        return {
          ...p,
          images: p.images || (p.imageUrl ? [p.imageUrl] : ['/placeholder-image.jpg']),
          title: p.title || p.name,
          asin: p.asin || p.id,
          rating: rating,
          reviews: p.reviews || { rating: rating, count: 0 },
          availability: p.availability || { inStock: p.isAvailable !== false, quantity: p.quantity || 0 },
          specifications: p.specifications || {
            size: p.size || null,
            condition: p.condition || 'Good',
            brand: p.brand || 'Unknown'
          },
          price: {
            current: currentPrice,
            original: originalPrice,
            currency: p.price?.currency || 'USD'
          }
        }
      })

      return {
        products: normalizedMarketplaceProducts,
        total: normalizedMarketplaceProducts.length,
        page: 1,
        totalPages: 1,
        filters
      }
    } catch (error) {
      logger.error('❌ Marketplace aggregation failed', { error })
      return dbResults // Return empty database results
    }
  }
}

// Singleton instance
export const safeQueryExecutor = new SafeQueryExecutor()