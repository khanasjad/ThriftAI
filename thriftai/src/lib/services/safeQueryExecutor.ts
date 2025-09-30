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
   * Normalize search term to fix common typos and variations
   */
  private normalizeSearchTerm(term: string): string {
    let normalized = term.toLowerCase().trim()

    // Common typos and misspellings
    const typoCorrections: [RegExp, string][] = [
      [/\bjaans?\b/gi, 'jeans'],         // jaan/jaans → jeans
      [/\bjeens?\b/gi, 'jeans'],         // jeen/jeens → jeans
      [/\bshose?\b/gi, 'shoes'],         // shose → shoes
      [/\bsnikers?\b/gi, 'sneakers'],    // sniker/snikers → sneakers
      [/\blaptap?\b/gi, 'laptop'],       // laptap → laptop
      [/\blaptob?\b/gi, 'laptop'],       // laptob → laptop
      [/\biphoen?\b/gi, 'iphone'],       // iphoen → iphone
      [/\bbagg?s?\b/gi, 'bag'],          // bagg/baggs → bag
      [/\bwach\b/gi, 'watch'],           // wach → watch
      [/\btshirts?\b/gi, 'shirt'],       // tshirt → shirt
    ]

    // Apply typo corrections
    for (const [pattern, replacement] of typoCorrections) {
      normalized = normalized.replace(pattern, replacement)
    }

    return normalized
  }

  /**
   * Execute a safe parameterized query from structured filters
   */
  async executeQuery(filters: StructuredQueryFilters): Promise<QueryResult> {
    try {
      logger.info('🔒 Executing safe parameterized query', {
        searchTerms: filters.searchTerms,
        category: filters.category,
        priceRange: { min: filters.minPrice, max: filters.maxPrice }
      })

      // Build WHERE clause using Prisma (100% safe, no SQL injection)
      const whereClause: Prisma.ProductWhereInput = {
        isAvailable: true,
        AND: []
      }

      // Search terms - Each term must appear in at least one field (name, description, or brand)
      // This ensures ALL search terms are relevant to the product
      if (filters.searchTerms && filters.searchTerms.length > 0) {
        // Normalize search terms to fix typos (jaans → jeans, shose → shoes, etc.)
        const normalizedTerms = filters.searchTerms.map(term => this.normalizeSearchTerm(term))

        logger.info('🔍 Search terms normalized', {
          original: filters.searchTerms,
          normalized: normalizedTerms
        })

        normalizedTerms.forEach(term => {
          whereClause.AND!.push({
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { brand: { contains: term, mode: 'insensitive' } }
            ]
          })
        })
      }

      // Category filter
      if (filters.category) {
        whereClause.AND!.push({ category: filters.category })
      }

      // Price range filter
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceCondition: any = {}
        if (filters.minPrice !== undefined) priceCondition.gte = filters.minPrice
        if (filters.maxPrice !== undefined) priceCondition.lte = filters.maxPrice
        whereClause.AND!.push({ price: priceCondition })
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
        products: normalizedProducts,
        total,
        page,
        totalPages,
        filters
      }
    } catch (error) {
      logger.error('❌ Query execution failed', {
        error: error instanceof Error ? error.message : String(error),
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
        category: filters.category,
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