// ThriftAI - Mock Amazon API Service
// Converts PostgreSQL products to Amazon-like format with enhanced data

import { PrismaClient } from '@prisma/client'
import type {
  MockAmazonProduct,
  SearchFilters,
  QueryOptimization
} from '../types/scoring'
import { ConfigurationService } from './configurationService'

const prisma = new PrismaClient()

export class MockAmazonService {
  // Cache for configuration data (loaded once per instance)
  private brandConfigCache: Map<string, any> | null = null
  private categoryMappingCache: Map<string, any> | null = null

  private async getBrandConfiguration(): Promise<Map<string, any>> {
    if (!this.brandConfigCache) {
      this.brandConfigCache = await ConfigurationService.getBrandConfiguration()
    }
    return this.brandConfigCache
  }

  private async getCategoryMappings(): Promise<Map<string, any>> {
    if (!this.categoryMappingCache) {
      this.categoryMappingCache = await ConfigurationService.getCategoryMappings()
    }
    return this.categoryMappingCache
  }

  /**
   * Normalize search query to handle common variations
   * Converts "tshirt" → "shirt", "smartphone" → "phone", etc.
   */
  private normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim()

    // Common product name variations
    const substitutions: [RegExp, string][] = [
      [/\btshirts?\b/gi, 'shirt'],  // tshirt/tshirts → shirt
      [/\bsmartphones?\b/gi, 'phone'],
      [/\bcellphones?\b/gi, 'phone'],
      [/\bmobilephones?\b/gi, 'phone'],
    ]

    // Apply substitutions
    for (const [pattern, replacement] of substitutions) {
      normalized = normalized.replace(pattern, replacement)
    }

    return normalized
  }

  // Enhanced search with comprehensive pagination and filtering
  async searchProductsEnhanced(
    query: string,
    options: {
      filters?: SearchFilters
      pagination?: {
        page: number
        limit: number
      }
      sorting?: {
        field: 'price' | 'name' | 'createdAt' | 'brand' | 'relevance'
        direction: 'asc' | 'desc'
      }
      includeMetadata?: boolean
    } = {}
  ): Promise<{
    products: MockAmazonProduct[]
    metadata: {
      total: number
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
      filters: {
        availableCategories: string[]
        availableBrands: string[]
        priceRange: { min: number; max: number }
        availableConditions: string[]
        availableSizes: string[]
      }
    }
  }> {
    try {
      const { filters = {}, pagination = { page: 1, limit: 20 }, sorting = { field: 'relevance', direction: 'desc' } } = options
      const { page, limit } = pagination
      const offset = (page - 1) * limit

      // Build search conditions
      const where: any = { isAvailable: true }
      const orConditions: any[] = []

      // Enhanced text search with smart product-first strategy
      if (query && query.trim()) {
        // Normalize query to handle common variations (tshirt → t-shirt)
        const normalizedQuery = this.normalizeQuery(query)
        if (normalizedQuery !== query.toLowerCase()) {
          console.log('🔄 MockAmazon: Normalized query:', query, '→', normalizedQuery)
        }
        const searchTerms = normalizedQuery.toLowerCase().split(' ').filter(term => term.length > 1)

        if (searchTerms.length > 0) {
          // Get configuration data from database
          const [productTypeKeywords, brandKeywords, conditionKeywords, stopWords] = await Promise.all([
            ConfigurationService.getProductTypeKeywords(),
            ConfigurationService.getBrandDescriptors(),
            ConfigurationService.getConditionDescriptors(),
            ConfigurationService.getSearchKeywordsByType('STOP_WORD')
          ])

          console.log('🔑 Search terms after normalization:', searchTerms)
          console.log('🔑 Product type keywords from config:', productTypeKeywords.slice(0, 20))

          // Find the most important product type term
          const mainProductType = searchTerms.find(term => productTypeKeywords.includes(term))
          console.log('🔑 Main product type found:', mainProductType)

          if (mainProductType) {
            // STRATEGY 1: Product-first search with smart plural/singular handling
            const productVariations = []

            // Handle common plural/singular variations
            if (mainProductType.endsWith('s')) {
              // If plural, add singular
              const singular = mainProductType.slice(0, -1)
              productVariations.push(
                { name: { contains: mainProductType, mode: 'insensitive' } },
                { name: { contains: singular, mode: 'insensitive' } }
              )
            } else {
              // If singular, add plural
              const plural = mainProductType + 's'
              productVariations.push(
                { name: { contains: mainProductType, mode: 'insensitive' } },
                { name: { contains: plural, mode: 'insensitive' } }
              )
            }

            const productCondition = { OR: productVariations }

            // Build additional conditions for other meaningful terms (optional)
            const additionalConditions: any[] = []
            searchTerms.forEach(term => {
              if (term !== mainProductType && !stopWords.includes(term)) {
                additionalConditions.push(
                  { name: { contains: term, mode: 'insensitive' } },
                  { description: { contains: term, mode: 'insensitive' } },
                  { brand: { contains: term, mode: 'insensitive' } }
                )
              }
            })

            // Prioritize products that match the main type, with bonus for additional matches
            if (additionalConditions.length > 0) {
              // Simple strategy: Products must match the main product type (bags)
              // Additional terms are nice-to-have but not required
              where.OR = productVariations
            } else {
              // If only product type, search with variations
              where.OR = productVariations
            }

          } else {
            // STRATEGY 2: General search - no specific product type found
            console.log('📁 STRATEGY 2: No product type found, checking category keywords')
            // Check if query matches category keywords
            const categoryKeywordMapping = await ConfigurationService.getCategoryKeywordsMapping()
            const matchedCategories = new Set<string>()

            searchTerms.forEach(term => {
              const categories = categoryKeywordMapping.get(term)
              console.log(`📁 Checking term "${term}":`, categories ? `Found categories: ${Array.from(categories).join(', ')}` : 'No match')
              if (categories) {
                categories.forEach(cat => matchedCategories.add(cat))
              }
            })

            console.log('📁 Matched categories:', Array.from(matchedCategories))

            // Filter by meaningful search terms (not stop words)
            const meaningfulTerms = searchTerms.filter(term => !stopWords.includes(term))

            // If query matches categories (like "shirt" -> CLOTHING), search by category + term
            if (matchedCategories.size > 0) {
              console.log('📁 Searching in matched categories:', Array.from(matchedCategories))
              where.category = { in: Array.from(matchedCategories) }

              // IMPORTANT: Also filter by the search term within the category
              // This prevents returning ALL items in the category
              if (meaningfulTerms.length > 0) {
                meaningfulTerms.forEach(term => {
                  orConditions.push(
                    { name: { contains: term, mode: 'insensitive' } },
                    { description: { contains: term, mode: 'insensitive' } },
                    { brand: { contains: term, mode: 'insensitive' } }
                  )
                })
                where.OR = orConditions
                console.log(`📁 Also filtering by search terms: ${meaningfulTerms.join(', ')}`)
              }
            } else {
              console.log('📁 No category matches, using broader search')
              // Use broader search with all meaningful terms
              meaningfulTerms.forEach(term => {
                orConditions.push(
                  { name: { contains: term, mode: 'insensitive' } },
                  { description: { contains: term, mode: 'insensitive' } },
                  { brand: { contains: term, mode: 'insensitive' } },
                  { category: { contains: term, mode: 'insensitive' } }
                )
              })

              if (orConditions.length > 0) {
                where.OR = orConditions
              }
            }
          }
        }
      }

      // Apply filters
      if (filters.categories?.length) {
        where.category = { in: filters.categories }
      }

      if (filters.brands?.length) {
        where.brand = { in: filters.brands }
      }

      if (filters.priceRange) {
        where.price = {}
        if (filters.priceRange.min !== undefined && filters.priceRange.min !== null) {
          where.price.gte = filters.priceRange.min
        }
        if (filters.priceRange.max !== undefined && filters.priceRange.max !== null) {
          where.price.lte = filters.priceRange.max
        }
        // Only apply if at least one constraint exists
        if (Object.keys(where.price).length === 0) {
          delete where.price
        }
      }

      if (filters.condition?.length) {
        where.condition = { in: filters.condition }
      }

      if (filters.sizes?.length) {
        where.size = { in: filters.sizes }
      }

      // Note: Search conditions are now handled in the enhanced search logic above

      // Get total count for pagination
      const total = await prisma.product.count({ where })

      // Build order by clause
      let orderBy: any[] = []

      switch (sorting.field) {
        case 'price':
          orderBy = [{ price: sorting.direction }]
          break
        case 'name':
          orderBy = [{ name: sorting.direction }]
          break
        case 'createdAt':
          orderBy = [{ createdAt: sorting.direction }]
          break
        case 'brand':
          orderBy = [{ brand: sorting.direction }, { name: 'asc' }]
          break
        case 'relevance':
        default:
          // For relevance, prioritize by name match, then recent, then price
          orderBy = [
            { name: 'asc' },
            { createdAt: 'desc' },
            { price: 'asc' }
          ]
          break
      }

      // Fetch products
      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            include: {
              user: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy
      })

      console.log(`✅ MockAmazon: Found ${products.length} products (total: ${await prisma.product.count({ where })})`)
      if (products.length > 0) {
        console.log('✅ Products:', products.map(p => ({ name: p.name, category: p.category })))
      }

      // Get filter metadata if requested
      let filterMetadata = {
        availableCategories: [] as string[],
        availableBrands: [] as string[],
        priceRange: { min: 0, max: 0 },
        availableConditions: [] as string[],
        availableSizes: [] as string[]
      }

      if (options.includeMetadata) {
        const [categories, brands, priceStats, conditions, sizes] = await Promise.all([
          prisma.product.findMany({
            where: orConditions.length > 0 ? { OR: orConditions, isAvailable: true } : { isAvailable: true },
            select: { category: true },
            distinct: ['category']
          }),
          prisma.product.findMany({
            where: orConditions.length > 0 ? { OR: orConditions, isAvailable: true } : { isAvailable: true },
            select: { brand: true },
            distinct: ['brand']
          }),
          prisma.product.aggregate({
            where: orConditions.length > 0 ? { OR: orConditions, isAvailable: true } : { isAvailable: true },
            _min: { price: true },
            _max: { price: true }
          }),
          prisma.product.findMany({
            where: orConditions.length > 0 ? { OR: orConditions, isAvailable: true } : { isAvailable: true },
            select: { condition: true },
            distinct: ['condition']
          }),
          prisma.product.findMany({
            where: orConditions.length > 0 ? { OR: orConditions, isAvailable: true } : { isAvailable: true },
            select: { size: true },
            distinct: ['size']
          })
        ])

        filterMetadata = {
          availableCategories: categories.map(c => c.category).filter(Boolean).sort(),
          availableBrands: brands.map(b => b.brand).filter(Boolean).sort(),
          priceRange: {
            min: priceStats._min.price || 0,
            max: priceStats._max.price || 1000
          },
          availableConditions: conditions.map(c => c.condition).filter(Boolean).sort(),
          availableSizes: sizes.map(s => s.size).filter(Boolean).sort()
        }
      }

      // Convert to Amazon format
      const amazonProducts = await Promise.all(products.map(product => this.convertToAmazonFormat(product)))

      const totalPages = Math.ceil(total / limit)

      return {
        products: amazonProducts,
        metadata: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          filters: filterMetadata
        }
      }

    } catch (error) {
      console.error('Error in enhanced product search:', error)
      throw new Error('Failed to search products with enhanced filters')
    }
  }

  async searchProducts(
    optimizedQuery: string,
    filters?: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<MockAmazonProduct[]> {
    try {
      // For backward compatibility, also check if we have structured search data
      let structuredSearch = null
      if (typeof optimizedQuery === 'object' && optimizedQuery.primaryTerms) {
        structuredSearch = optimizedQuery
        optimizedQuery = structuredSearch.primaryTerms.join(' ')
      }

      const where: any = {}
      const orConditions: any[] = []

      // Build search conditions based on structured data or fallback to string parsing
      if (structuredSearch) {
        // Use structured search for better accuracy
        const { primaryTerms, secondaryTerms, searchFilters } = structuredSearch

        // Primary terms must match (higher priority)
        if (primaryTerms.length > 0) {
          primaryTerms.forEach(term => {
            orConditions.push(
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { brand: { contains: term, mode: 'insensitive' } }
            )
          })
        }

        // Secondary terms for broader matching
        if (secondaryTerms.length > 0) {
          secondaryTerms.forEach(term => {
            orConditions.push(
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } }
            )
          })
        }

        // Apply structured filters
        if (searchFilters.brands?.length > 0) {
          where.brand = { in: searchFilters.brands, mode: 'insensitive' }
        }
        if (searchFilters.categories?.length > 0) {
          where.category = { in: searchFilters.categories }
        }
        if (searchFilters.sizes?.length > 0) {
          where.size = { in: searchFilters.sizes }
        }
        if (searchFilters.colors?.length > 0) {
          orConditions.push(
            ...searchFilters.colors.map(color => ({
              description: { contains: color, mode: 'insensitive' }
            }))
          )
        }
      } else {
        // Fallback to the improved tokenized search
        const searchTerms = optimizedQuery.toLowerCase().split(' ').filter(term => term.length > 2)

        if (searchTerms.length > 0) {
          searchTerms.forEach(term => {
            orConditions.push(
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { brand: { contains: term, mode: 'insensitive' } }
            )
          })
        }
      }

      // Only add OR conditions if we have any
      if (orConditions.length > 0) {
        where.OR = orConditions
      }

      // Apply filters
      if (filters?.categories?.length) {
        where.category = { in: filters.categories }
      }

      if (filters?.brands?.length) {
        where.brand = { in: filters.brands }
      }

      if (filters?.priceRange) {
        where.price = {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max
        }
      }

      if (filters?.condition?.length) {
        where.condition = { in: filters.condition }
      }

      if (filters?.inStock !== undefined) {
        // For our mock, we'll assume all products are in stock
        // In a real system, this would filter by inventory levels
      }

      // If no search conditions, return empty result
      if (Object.keys(where).length === 0) {
        console.log('No search conditions found, returning empty results')
        return []
      }

      // Fetch products from database
      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            include: {
              user: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      })

      console.log(`Found ${products.length} products matching search criteria`)

      // Convert each product to MockAmazonProduct format
      const amazonProducts = await Promise.all(products.map(product =>
        this.convertToAmazonFormat(product)
      ))

      return amazonProducts

    } catch (error) {
      console.error('Error searching products:', error)
      throw new Error('Failed to search products in mock Amazon API')
    }
  }

  // New method for structured search queries
  async searchProductsStructured(
    queryOptimization: QueryOptimization,
    filters?: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<MockAmazonProduct[]> {
    try {
      console.log(`🔥 STRUCTURED SEARCH CALLED!`)
      console.log(`Query optimization:`, JSON.stringify(queryOptimization, null, 2))

      const where: any = {}
      const orConditions: any[] = []

      // Handle both old and new query optimization formats
      const primaryTerms = queryOptimization.primaryTerms || queryOptimization.optimizedQuery?.split(' ') || []
      const secondaryTerms = queryOptimization.secondaryTerms || queryOptimization.enhancements?.synonyms || []
      const searchFilters = queryOptimization.searchFilters || {
        brands: queryOptimization.enhancements?.brandNormalization || [],
        categories: queryOptimization.enhancements?.categoryInference || [],
        sizes: queryOptimization.enhancements?.sizeExtraction || [],
        colors: queryOptimization.enhancements?.colorExtraction || [],
        styles: queryOptimization.enhancements?.styleInference || [],
        priceRange: queryOptimization.enhancements?.budgetInference ? { max: queryOptimization.enhancements.budgetInference } : null
      }

      console.log(`Structured search - Primary: [${primaryTerms.join(', ')}], Secondary: [${secondaryTerms.join(', ')}]`)
      console.log(`Applied filters:`, JSON.stringify(searchFilters, null, 2))

      // Primary terms get priority (these should appear in results)
      if (primaryTerms.length > 0) {
        primaryTerms.forEach(term => {
          orConditions.push(
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { brand: { contains: term, mode: 'insensitive' } }
          )
        })
      }

      // Secondary terms for broader matching (optional)
      if (secondaryTerms.length > 0) {
        secondaryTerms.forEach(term => {
          orConditions.push(
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } }
          )
        })
      }

      // Apply extracted filters from Claude
      if (searchFilters.brands?.length > 0) {
        // Try exact match first, then fallback to contains
        where.brand = { in: searchFilters.brands }
      }

      if (searchFilters.categories?.length > 0) {
        where.category = { in: searchFilters.categories }
      }

      if (searchFilters.sizes?.length > 0) {
        where.size = { in: searchFilters.sizes }
      }

      // Colors are often in descriptions
      if (searchFilters.colors?.length > 0) {
        orConditions.push(
          ...searchFilters.colors.map(color => ({
            description: { contains: color, mode: 'insensitive' }
          }))
        )
      }

      // Apply additional filters passed in
      if (filters?.priceRange) {
        where.price = {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max
        }
      }

      if (filters?.condition?.length) {
        where.condition = { in: filters.condition }
      }

      // Only add OR conditions if we have any
      if (orConditions.length > 0) {
        where.OR = orConditions
      }

      // If no search conditions, return empty result
      if (Object.keys(where).length === 0) {
        console.log('No structured search conditions found, returning empty results')
        return []
      }

      console.log('Structured search where clause:', JSON.stringify(where, null, 2))

      // Fetch products from database
      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            include: {
              user: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      })

      console.log(`Structured search found ${products.length} products`)

      // Convert each product to MockAmazonProduct format
      const amazonProducts = await Promise.all(products.map(product =>
        this.convertToAmazonFormat(product)
      ))

      return amazonProducts

    } catch (error) {
      console.error('Error in structured product search:', error)
      throw new Error('Failed to search products with structured query')
    }
  }

  private async convertToAmazonFormat(product: any): Promise<MockAmazonProduct> {
    // Generate realistic ASIN (Amazon Standard Identification Number)
    const asin = this.generateASIN(product.id)

    // Get brand information from database configuration
    const brandConfiguration = await this.getBrandConfiguration()
    const brandKey = product.brand?.toLowerCase() || 'default'
    const brandInfo = brandConfiguration.get(brandKey) || brandConfiguration.get('default') || { reputation: 70, premium: false, warranty: '30 days' }

    // Get category information from database configuration
    const categoryMappings = await this.getCategoryMappings()
    const categoryInfo = categoryMappings.get(product.category) || {
      amazonCategory: 'Fashion',
      subcategories: ['General'],
      avgShippingDays: 3,
      returnWindow: 30
    }

    // Calculate pricing with realistic variations
    const pricing = this.calculatePricing(product.price, brandInfo.premium)

    // Generate reviews and ratings
    const reviews = this.generateReviews(brandInfo.reputation)

    // Calculate availability and shipping
    const availability = this.calculateAvailability(categoryInfo)

    // Generate sustainability data
    const sustainability = this.generateSustainabilityData(product)

    // Create seller information
    const seller = this.createSellerInfo(product.seller)

    return {
      asin,
      title: product.name,
      brand: product.brand || 'Unbranded',
      category: categoryInfo.amazonCategory,
      price: pricing,
      availability,
      specifications: {
        category: categoryInfo.amazonCategory,
        subcategory: this.getRandomSubcategory(categoryInfo.subcategories),
        size: product.size || undefined,
        color: product.color || this.getRandomColor(),
        condition: product.condition || undefined,
        material: this.inferMaterial(product.category, product.description),
        weight: this.estimateWeight(product.category),
        dimensions: this.estimateDimensions(product.category),
        model: this.generateModelNumber(product.brand),
        year: this.estimateYear(product.createdAt)
      },
      reviews,
      images: this.generateImageUrls(product.imageUrl, asin),
      description: this.enhanceDescription(product.description),
      features: this.extractFeatures(product.description),
      seller,
      sustainability,
      authenticity: {
        verified: brandInfo.reputation > 85,
        authenticityGuarantee: brandInfo.premium,
        returnPolicy: `${categoryInfo.returnWindow} day returns`,
        warranty: brandInfo.warranty
      },
      metadata: {
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        lastPriceUpdate: new Date(),
        popularityRank: this.calculatePopularityRank(reviews.rating, reviews.count),
        salesRank: this.calculateSalesRank(product.category, reviews.count)
      }
    }
  }

  private generateASIN(productId: string): string {
    // Generate a realistic looking ASIN
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let asin = 'B0'

    // Convert string ID to a hash for consistency
    let hash = 0
    for (let i = 0; i < productId.length; i++) {
      const char = productId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }

    // Use hash to generate ASIN
    const seed = Math.abs(hash).toString().padStart(8, '0')
    for (let i = 0; i < 8; i++) {
      const index = (parseInt(seed[i]) + i) % chars.length
      asin += chars[index]
    }

    return asin
  }

  private calculatePricing(basePrice: number, isPremium: boolean) {
    // Add realistic pricing variations
    const discountRange = isPremium ? 0.1 : 0.3 // Premium brands have smaller discounts
    const discount = Math.random() * discountRange
    const current = basePrice * (1 - discount)

    return {
      current: Math.round(current * 100) / 100,
      original: basePrice,
      currency: 'USD' as const,
      discountPercentage: Math.round(discount * 100)
    }
  }

  private generateReviews(brandReputation: number) {
    // Generate realistic review data based on brand reputation
    const baseRating = (brandReputation / 100) * 5
    const variation = 0.5
    const rating = Math.max(1, Math.min(5, baseRating + (Math.random() - 0.5) * variation))

    // Review count tends to be higher for better brands
    const baseCount = Math.floor((brandReputation / 100) * 1000)
    const count = baseCount + Math.floor(Math.random() * 500)

    return {
      rating: Math.round(rating * 10) / 10,
      count,
      verified: brandReputation > 80,
      recentRating: Math.round((rating + (Math.random() - 0.5) * 0.3) * 10) / 10,
      ratingDistribution: this.generateRatingDistribution(rating, count)
    }
  }

  private generateRatingDistribution(avgRating: number, totalCount: number): { [key: number]: number } {
    // Realistic rating distribution based on average
    const distribution: { [key: number]: number } = {}

    for (let stars = 1; stars <= 5; stars++) {
      const distance = Math.abs(stars - avgRating)
      const probability = Math.max(0.05, 1 - (distance * 0.3))
      distribution[stars] = Math.floor(totalCount * probability)
    }

    return distribution
  }

  private calculateAvailability(categoryInfo: any) {
    const inStock = Math.random() > 0.1 // 90% chance of being in stock
    const quantity = inStock ? Math.floor(Math.random() * 50) + 1 : 0

    return {
      inStock,
      quantity,
      shippingDays: categoryInfo.avgShippingDays + Math.floor(Math.random() * 3),
      shippingCost: Math.random() > 0.6 ? 0 : Math.round((Math.random() * 10 + 5) * 100) / 100,
      expeditedShipping: Math.random() > 0.3
    }
  }

  private generateSustainabilityData(product: any) {
    // Generate realistic sustainability data
    const ecoFriendly = Math.random() > 0.7
    const recyclable = Math.random() > 0.5
    const sustainableMaterials = Math.random() > 0.6

    const certifications = []
    if (ecoFriendly) certifications.push('Eco-Friendly')
    if (sustainableMaterials) certifications.push('Sustainable Materials')
    if (Math.random() > 0.8) certifications.push('Fair Trade')
    if (Math.random() > 0.9) certifications.push('Organic')

    return {
      ecoFriendly,
      recyclable,
      sustainableMaterials,
      certifications,
      carbonFootprint: ecoFriendly ? Math.round(Math.random() * 5 + 1) : Math.round(Math.random() * 15 + 5),
      ethicalProduction: Math.random() > 0.6
    }
  }

  private createSellerInfo(seller: any) {
    const sellerRating = 3.5 + Math.random() * 1.5 // 3.5 to 5.0
    const totalSales = Math.floor(Math.random() * 10000) + 100

    return {
      name: seller?.user?.name || 'ThriftAI Seller',
      rating: Math.round(sellerRating * 10) / 10,
      totalSales,
      fulfillment: Math.random() > 0.3 ? 'Amazon' as const : 'Merchant' as const,
      location: this.getRandomLocation(),
      verified: seller?.verificationStatus === 'VERIFIED' || Math.random() > 0.2
    }
  }

  private getRandomSubcategory(subcategories: string[]): string {
    return subcategories[Math.floor(Math.random() * subcategories.length)]
  }

  private getRandomColor(): string {
    const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Brown', 'Navy', 'Beige', 'Multi']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private inferMaterial(category: string, description: string): string {
    const materialMap: { [key: string]: string[] } = {
      'CLOTHING': ['Cotton', 'Polyester', 'Wool', 'Linen', 'Silk', 'Denim', 'Cashmere'],
      'SHOES': ['Leather', 'Synthetic', 'Canvas', 'Rubber', 'Suede', 'Mesh'],
      'ACCESSORIES': ['Metal', 'Leather', 'Plastic', 'Fabric', 'Gold', 'Silver'],
      'ELECTRONICS': ['Plastic', 'Metal', 'Glass', 'Silicon', 'Aluminum']
    }

    const materials = materialMap[category] || ['Mixed Materials']

    // Try to infer from description
    for (const material of materials) {
      if (description?.toLowerCase().includes(material.toLowerCase())) {
        return material
      }
    }

    return materials[Math.floor(Math.random() * materials.length)]
  }

  private estimateWeight(category: string): string {
    const weightRanges: { [key: string]: [number, number] } = {
      'CLOTHING': [0.1, 2.0],
      'SHOES': [0.5, 3.0],
      'ACCESSORIES': [0.05, 1.0],
      'ELECTRONICS': [0.1, 5.0]
    }

    const [min, max] = weightRanges[category] || [0.1, 1.0]
    const weight = min + Math.random() * (max - min)
    return `${Math.round(weight * 100) / 100} lbs`
  }

  private estimateDimensions(category: string): string {
    // Generate realistic dimensions based on category
    switch (category) {
      case 'CLOTHING':
        return `${12 + Math.floor(Math.random() * 8)}" x ${8 + Math.floor(Math.random() * 4)}" x ${1 + Math.floor(Math.random() * 2)}"`
      case 'SHOES':
        return `${10 + Math.floor(Math.random() * 4)}" x ${4 + Math.floor(Math.random() * 2)}" x ${3 + Math.floor(Math.random() * 2)}"`
      case 'ACCESSORIES':
        return `${3 + Math.floor(Math.random() * 8)}" x ${2 + Math.floor(Math.random() * 6)}" x ${1 + Math.floor(Math.random() * 3)}"`
      case 'ELECTRONICS':
        return `${5 + Math.floor(Math.random() * 10)}" x ${3 + Math.floor(Math.random() * 8)}" x ${1 + Math.floor(Math.random() * 4)}"`
      default:
        return `${Math.floor(Math.random() * 10) + 1}" x ${Math.floor(Math.random() * 8) + 1}" x ${Math.floor(Math.random() * 4) + 1}"`
    }
  }

  private generateModelNumber(brand?: string): string {
    if (!brand) return undefined

    const prefix = brand.substring(0, 2).toUpperCase()
    const numbers = Math.floor(Math.random() * 9000) + 1000
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26))

    return `${prefix}-${numbers}${suffix}`
  }

  private estimateYear(createdAt: Date): number {
    // Estimate product year based on when it was added (accounting for it being second-hand)
    const currentYear = new Date().getFullYear()
    const productAge = Math.floor(Math.random() * 5) + 1 // 1-5 years old
    return currentYear - productAge
  }

  private generateImageUrls(primaryImage?: string, asin?: string): string[] {
    const images = []

    if (primaryImage) {
      images.push(primaryImage)
    }

    // Generate additional mock image URLs
    for (let i = 1; i < 4; i++) {
      images.push(`https://images-na.ssl-images-amazon.com/images/I/${asin}_${i}.jpg`)
    }

    return images
  }

  private enhanceDescription(originalDescription?: string): string {
    if (!originalDescription) {
      return 'High-quality pre-owned item in excellent condition. Carefully inspected and authenticated.'
    }

    // Enhance the description with Amazon-like details
    const enhancements = [
      'Verified authentic and in excellent condition.',
      'Professionally cleaned and inspected.',
      'Ships fast with tracking.',
      'Sustainable choice - reducing environmental impact.'
    ]

    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)]
    return `${originalDescription} ${randomEnhancement}`
  }

  private extractFeatures(description?: string): string[] {
    if (!description) return []

    const features = []
    const keywords = ['waterproof', 'breathable', 'comfortable', 'durable', 'lightweight', 'vintage', 'designer', 'premium']

    keywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        features.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
      }
    })

    // Add some generic features
    if (Math.random() > 0.5) features.push('High Quality Materials')
    if (Math.random() > 0.7) features.push('Expert Craftsmanship')
    if (Math.random() > 0.6) features.push('Timeless Design')

    return features
  }

  private getRandomLocation(): string {
    const locations = [
      'California, US',
      'New York, US',
      'Texas, US',
      'Florida, US',
      'Washington, US',
      'Illinois, US',
      'Massachusetts, US',
      'Oregon, US'
    ]
    return locations[Math.floor(Math.random() * locations.length)]
  }

  private calculatePopularityRank(rating: number, reviewCount: number): number {
    // Simple algorithm to calculate popularity rank
    const popularityScore = (rating * 0.7) + (Math.log(reviewCount + 1) * 0.3)
    return Math.floor((5 - popularityScore) * 200000) + Math.floor(Math.random() * 50000)
  }

  private calculateSalesRank(category: string, reviewCount: number): number {
    // Category-specific sales rank calculation
    const categoryMultipliers: { [key: string]: number } = {
      'CLOTHING': 1000000,
      'SHOES': 500000,
      'ACCESSORIES': 300000,
      'ELECTRONICS': 800000
    }

    const multiplier = categoryMultipliers[category] || 500000
    const baseRank = Math.floor(multiplier * Math.random())
    const reviewBonus = Math.floor(reviewCount * 100)

    return Math.max(1, baseRank - reviewBonus)
  }

  // Additional utility methods for advanced features

  // Get all available filter options for dynamic UI
  async getAvailableFilters(): Promise<{
    categories: Array<{ value: string; label: string; count: number }>
    brands: Array<{ value: string; label: string; count: number }>
    conditions: Array<{ value: string; label: string; count: number }>
    sizes: Array<{ value: string; label: string; count: number }>
    priceRange: { min: number; max: number }
  }> {
    try {
      const [categoryData, brandData, conditionData, sizeData, priceData] = await Promise.all([
        prisma.product.groupBy({
          by: ['category'],
          where: { isAvailable: true },
          _count: { category: true },
          orderBy: { _count: { category: 'desc' } }
        }),
        prisma.product.groupBy({
          by: ['brand'],
          where: { isAvailable: true, brand: { not: null } },
          _count: { brand: true },
          orderBy: { _count: { brand: 'desc' } }
        }),
        prisma.product.groupBy({
          by: ['condition'],
          where: { isAvailable: true, condition: { not: null } },
          _count: { condition: true },
          orderBy: { _count: { condition: 'desc' } }
        }),
        prisma.product.groupBy({
          by: ['size'],
          where: { isAvailable: true, size: { not: null } },
          _count: { size: true },
          orderBy: { _count: { size: 'desc' } }
        }),
        prisma.product.aggregate({
          where: { isAvailable: true },
          _min: { price: true },
          _max: { price: true }
        })
      ])

      return {
        categories: categoryData.map(item => ({
          value: item.category,
          label: this.formatCategoryLabel(item.category),
          count: item._count.category
        })),
        brands: brandData.slice(0, 50).map(item => ({ // Limit to top 50 brands
          value: item.brand!,
          label: item.brand!,
          count: item._count.brand
        })),
        conditions: conditionData.map(item => ({
          value: item.condition!,
          label: item.condition!,
          count: item._count.condition
        })),
        sizes: sizeData.slice(0, 30).map(item => ({ // Limit to top 30 sizes
          value: item.size!,
          label: item.size!,
          count: item._count.size
        })),
        priceRange: {
          min: Math.floor(priceData._min.price || 0),
          max: Math.ceil(priceData._max.price || 1000)
        }
      }
    } catch (error) {
      console.error('Error getting available filters:', error)
      throw new Error('Failed to get available filters')
    }
  }

  private formatCategoryLabel(category: string): string {
    // Convert category to a more readable format
    const labelMap: { [key: string]: string } = {
      'CLOTHING': 'Clothing & Fashion',
      'SHOES': 'Shoes & Footwear',
      'ACCESSORIES': 'Accessories & Jewelry',
      'ELECTRONICS': 'Electronics & Gadgets',
      'HOME': 'Home & Decor',
      'BOOKS': 'Books & Media',
      'SPORTS': 'Sports & Outdoors',
      'FURNITURE': 'Furniture',
      'BEAUTY': 'Beauty & Personal Care',
      'TOYS': 'Toys & Collectibles',
      'AUTOMOTIVE': 'Automotive & Tools'
    }
    return labelMap[category] || category
  }

  async getProductsByCategory(category: string, limit: number = 10): Promise<MockAmazonProduct[]> {
    return this.searchProducts('', { categories: [category] }, limit)
  }

  async getTrendingProducts(limit: number = 10): Promise<MockAmazonProduct[]> {
    // For trending, we'll get recently added products with good ratings
    const products = await prisma.product.findMany({
      include: {
        seller: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit * 2 // Get more to filter
    })

    const amazonProducts = products
      .map(product => this.convertToAmazonFormat(product))
      .filter(product => product.reviews.rating >= 4.0)
      .slice(0, limit)

    return amazonProducts
  }

  async getProductRecommendations(asin: string, limit: number = 5): Promise<MockAmazonProduct[]> {
    // Find the original product to get category and brand
    const products = await prisma.product.findMany({
      include: {
        seller: {
          include: {
            user: true
          }
        }
      },
      take: 50 // Get a larger pool to filter from
    })

    const allAmazonProducts = await Promise.all(products.map(product => this.convertToAmazonFormat(product)))
    const targetProduct = allAmazonProducts.find(p => p.asin === asin)

    if (!targetProduct) {
      return this.getTrendingProducts(limit)
    }

    // Find similar products (same category, similar price range)
    const similar = allAmazonProducts
      .filter(product =>
        product.asin !== asin &&
        product.category === targetProduct.category &&
        Math.abs(product.price.current - targetProduct.price.current) <= targetProduct.price.current * 0.5
      )
      .sort(() => Math.random() - 0.5) // Randomize
      .slice(0, limit)

    return similar
  }

  // Health check method
  async isServiceHealthy(): Promise<boolean> {
    try {
      await prisma.product.count()
      return true
    } catch (error) {
      console.error('Mock Amazon Service health check failed:', error)
      return false
    }
  }

  // Performance metrics
  async getServiceMetrics() {
    try {
      const totalProducts = await prisma.product.count()
      const productsByCategory = await prisma.product.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      })

      return {
        totalProducts,
        productsByCategory: productsByCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category
          return acc
        }, {} as Record<string, number>),
        lastUpdated: new Date(),
        serviceVersion: '1.0.0'
      }
    } catch (error) {
      console.error('Error getting service metrics:', error)
      throw error
    }
  }
}

// Export singleton instance
export const mockAmazonService = new MockAmazonService()
export default MockAmazonService