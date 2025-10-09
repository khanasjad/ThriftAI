import { StructuredIntent } from './claudeIntentExtractor'
import { logger } from '@/lib/logger'

export interface OptimizedQuery {
  // Prisma WHERE clause for ThriftAI database
  prismaWhere: any

  // Search parameters for external APIs
  searchParams: {
    query: string
    category?: string
    minPrice?: number
    maxPrice?: number
    brands?: string[]
    condition?: string[]
    keywords: string[]
  }

  // Result limiting strategy
  limits: {
    perSource: number
    total: number
  }

  // Sorting strategy
  orderBy: Array<{ [key: string]: 'asc' | 'desc' }>

  // Query metadata
  metadata: {
    hasHardFilters: boolean
    estimatedResults: 'few' | 'moderate' | 'many'
    queryComplexity: 'simple' | 'moderate' | 'complex'
  }
}

export class IntelligentQueryOptimizer {
  /**
   * Convert structured intent to optimized database query
   */
  optimizeQuery(intent: StructuredIntent): OptimizedQuery {
    logger.info('Optimizing query from structured intent', {
      hardFilters: intent.hardFilters,
      keywords: intent.keywords
    })

    // Build Prisma WHERE clause with hard filters
    const prismaWhere = this.buildPrismaWhere(intent)

    // Build search params for external APIs
    const searchParams = this.buildSearchParams(intent)

    // Determine result limits based on query specificity
    const limits = this.determineResultLimits(intent)

    // Determine sort strategy
    const orderBy = this.buildSortStrategy(intent)

    // Calculate metadata
    const metadata = this.calculateMetadata(intent, prismaWhere)

    const optimizedQuery: OptimizedQuery = {
      prismaWhere,
      searchParams,
      limits,
      orderBy,
      metadata
    }

    logger.info('Query optimization complete', {
      hasHardFilters: metadata.hasHardFilters,
      estimatedResults: metadata.estimatedResults,
      perSourceLimit: limits.perSource
    })

    return optimizedQuery
  }

  /**
   * Build Prisma WHERE clause from hard filters and keywords
   */
  private buildPrismaWhere(intent: StructuredIntent): any {
    const where: any = {
      isAvailable: true // Always filter to available products
    }

    // Apply hard price filters
    if (intent.hardFilters.minPrice !== undefined || intent.hardFilters.maxPrice !== undefined) {
      where.price = {}
      if (intent.hardFilters.minPrice !== undefined) {
        where.price.gte = intent.hardFilters.minPrice
      }
      if (intent.hardFilters.maxPrice !== undefined) {
        where.price.lte = intent.hardFilters.maxPrice
      }
    }

    // Apply category filter
    if (intent.hardFilters.category) {
      where.category = intent.hardFilters.category
    }

    // Apply condition filter
    if (intent.hardFilters.condition && intent.hardFilters.condition.length > 0) {
      where.condition = { in: intent.hardFilters.condition }
    }

    // Build keyword search with OR conditions
    if (intent.keywords.length > 0) {
      const keywordConditions: any[] = []

      intent.keywords.forEach(keyword => {
        keywordConditions.push(
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { brand: { contains: keyword, mode: 'insensitive' } }
        )
      })

      // If we already have other filters, use AND with OR keywords
      if (Object.keys(where).length > 1) {
        where.OR = keywordConditions
      } else {
        // If only availability filter, keywords are more important
        where.OR = keywordConditions
      }
    }

    // Apply soft brand preference as optional OR condition
    if (intent.softPreferences.brands && intent.softPreferences.brands.length > 0) {
      const brandConditions = intent.softPreferences.brands.map(brand => ({
        brand: { contains: brand, mode: 'insensitive' }
      }))

      if (where.OR) {
        where.OR = [...where.OR, ...brandConditions]
      } else {
        where.OR = brandConditions
      }
    }

    // EXCLUDE keywords - prevent matching products with these terms
    // Example: searching "phone" should exclude "headphone"
    if (intent.excludeKeywords && intent.excludeKeywords.length > 0) {
      const excludeConditions: any[] = []

      intent.excludeKeywords.forEach(keyword => {
        // Exclude if ANY field contains the excluded keyword
        // Logic: NOT (name contains X OR description contains X OR brand contains X)
        excludeConditions.push({
          NOT: {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
              { brand: { contains: keyword, mode: 'insensitive' } }
            ]
          }
        })
      })

      // Apply all exclude conditions (must NOT match any of them)
      if (where.AND) {
        where.AND = [...where.AND, ...excludeConditions]
      } else {
        where.AND = excludeConditions
      }
    }

    return where
  }

  /**
   * Build search parameters for external marketplace APIs
   */
  private buildSearchParams(intent: StructuredIntent): OptimizedQuery['searchParams'] {
    // Build query string from keywords
    const query = intent.keywords.join(' ')

    return {
      query,
      category: intent.hardFilters.category,
      minPrice: intent.hardFilters.minPrice,
      maxPrice: intent.hardFilters.maxPrice,
      brands: intent.softPreferences.brands,
      condition: intent.hardFilters.condition,
      keywords: intent.keywords
    }
  }

  /**
   * Determine result limits based on query specificity
   */
  private determineResultLimits(intent: StructuredIntent): OptimizedQuery['limits'] {
    // More specific queries (more hard filters) = fewer results needed
    const hardFilterCount = Object.keys(intent.hardFilters).filter(
      key => intent.hardFilters[key as keyof typeof intent.hardFilters] !== undefined &&
             intent.hardFilters[key as keyof typeof intent.hardFilters] !== null
    ).length

    let perSource: number
    let total: number

    if (hardFilterCount >= 3) {
      // Highly specific query: fewer results per source
      perSource = 10
      total = 50
    } else if (hardFilterCount >= 2) {
      // Moderately specific query
      perSource = 15
      total = 75
    } else {
      // Broad query: more results but still capped
      perSource = 20
      total = 100
    }

    return { perSource, total }
  }

  /**
   * Build sorting strategy based on user priorities
   */
  private buildSortStrategy(intent: StructuredIntent): OptimizedQuery['orderBy'] {
    const priorities = intent.softPreferences.priorityFactors || []

    if (priorities.includes('price')) {
      // Price-conscious users want lowest price first
      return [{ price: 'asc' }, { createdAt: 'desc' }]
    } else if (priorities.includes('quality')) {
      // Quality-conscious users want best condition first
      return [{ condition: 'desc' }, { price: 'asc' }]
    } else if (priorities.includes('brand')) {
      // Brand-conscious users want known brands first
      return [{ brand: 'asc' }, { price: 'asc' }]
    } else {
      // Default: recent products first, then by price
      return [{ createdAt: 'desc' }, { price: 'asc' }]
    }
  }

  /**
   * Calculate query metadata for optimization decisions
   */
  private calculateMetadata(
    intent: StructuredIntent,
    prismaWhere: any
  ): OptimizedQuery['metadata'] {
    // Check if we have meaningful hard filters (beyond just isAvailable)
    const hasHardFilters = Object.keys(prismaWhere).length > 1

    // Estimate result count based on query specificity
    const hardFilterCount = Object.keys(intent.hardFilters).filter(
      key => intent.hardFilters[key as keyof typeof intent.hardFilters] !== undefined
    ).length

    let estimatedResults: 'few' | 'moderate' | 'many'
    if (hardFilterCount >= 3 || (intent.hardFilters.maxPrice && intent.hardFilters.maxPrice < 50)) {
      estimatedResults = 'few'
    } else if (hardFilterCount >= 2 || intent.keywords.length > 2) {
      estimatedResults = 'moderate'
    } else {
      estimatedResults = 'many'
    }

    // Determine query complexity
    let queryComplexity: 'simple' | 'moderate' | 'complex'
    const totalConditions = hardFilterCount + intent.keywords.length + (intent.softPreferences.brands?.length || 0)
    if (totalConditions <= 2) {
      queryComplexity = 'simple'
    } else if (totalConditions <= 5) {
      queryComplexity = 'moderate'
    } else {
      queryComplexity = 'complex'
    }

    return {
      hasHardFilters,
      estimatedResults,
      queryComplexity
    }
  }

  /**
   * Relax filters progressively if no results found
   */
  relaxFilters(intent: StructuredIntent, iteration: number): StructuredIntent {
    const relaxed = JSON.parse(JSON.stringify(intent)) as StructuredIntent

    logger.info(`Relaxing filters - iteration ${iteration}`, {
      originalFilters: intent.hardFilters
    })

    switch (iteration) {
      case 1:
        // Remove condition requirements
        delete relaxed.hardFilters.condition
        break

      case 2:
        // Remove brand preferences
        delete relaxed.softPreferences.brands
        break

      case 3:
        // Expand price range by 20%
        if (relaxed.hardFilters.maxPrice) {
          relaxed.hardFilters.maxPrice = Math.ceil(relaxed.hardFilters.maxPrice * 1.2)
        }
        if (relaxed.hardFilters.minPrice) {
          relaxed.hardFilters.minPrice = Math.floor(relaxed.hardFilters.minPrice * 0.8)
        }
        break

      case 4:
        // Remove price constraints entirely
        delete relaxed.hardFilters.minPrice
        delete relaxed.hardFilters.maxPrice
        break

      case 5:
        // Use only first keyword
        if (relaxed.keywords.length > 1) {
          relaxed.keywords = [relaxed.keywords[0]]
        }
        break

      default:
        // Final fallback: keep only category or first keyword
        if (relaxed.hardFilters.category) {
          relaxed.keywords = []
        }
        break
    }

    logger.info(`Relaxed filters - iteration ${iteration}`, {
      relaxedFilters: relaxed.hardFilters
    })

    return relaxed
  }

  /**
   * Validate that query will return reasonable results
   */
  validateQuery(optimizedQuery: OptimizedQuery): {
    valid: boolean
    reason?: string
  } {
    // Check if we have at least some search criteria
    const hasCriteria = optimizedQuery.searchParams.keywords.length > 0 ||
                       optimizedQuery.searchParams.category !== undefined ||
                       optimizedQuery.searchParams.brands !== undefined

    if (!hasCriteria) {
      return {
        valid: false,
        reason: 'No search criteria provided - query is too broad'
      }
    }

    // Check if price range makes sense
    if (optimizedQuery.searchParams.minPrice && optimizedQuery.searchParams.maxPrice) {
      if (optimizedQuery.searchParams.minPrice > optimizedQuery.searchParams.maxPrice) {
        return {
          valid: false,
          reason: 'Invalid price range - minimum is greater than maximum'
        }
      }
    }

    // Check if maxPrice is unreasonably low
    if (optimizedQuery.searchParams.maxPrice && optimizedQuery.searchParams.maxPrice < 1) {
      return {
        valid: false,
        reason: 'Maximum price is unreasonably low'
      }
    }

    return { valid: true }
  }
}

// Singleton instance
export const intelligentQueryOptimizer = new IntelligentQueryOptimizer()