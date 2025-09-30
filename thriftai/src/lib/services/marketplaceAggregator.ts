import { AmazonAdapter, AmazonProduct } from '@/lib/integrations/amazon/amazonAdapter'
import { EbayAdapter, EbayProduct } from '@/lib/integrations/ebay/ebayAdapter'
import { BrandAdapter, BrandProduct } from '@/lib/integrations/brands/brandAdapter'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/utils/rateLimiter'

interface AggregatedSearchParams {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sources?: ('thriftai' | 'amazon' | 'ebay' | 'nike' | 'adidas')[]
}

export interface AggregatedProduct {
  source: string
  id: string
  title: string
  brand?: string
  price: number
  originalPrice?: number
  shippingCost?: number
  totalCost: number
  imageUrl?: string
  productUrl: string
  affiliateUrl?: string
  rating?: number
  condition?: string
  availability: boolean
  metadata?: any
}

interface AggregatedResults {
  results: AggregatedProduct[]
  bestDeal: AggregatedProduct | null
  insights: {
    totalFound: number
    averagePrice: number
    priceRange: { min: number; max: number }
    sourceBreakdown: Record<string, number>
  }
}

// Simple in-memory cache (5 minutes)
const searchCache = new Map<string, { data: AggregatedResults; expiry: number }>()

export class MarketplaceAggregator {
  private amazonAdapter: AmazonAdapter
  private ebayAdapter: EbayAdapter
  private brandAdapter: BrandAdapter

  constructor() {
    this.amazonAdapter = new AmazonAdapter()
    this.ebayAdapter = new EbayAdapter()
    this.brandAdapter = new BrandAdapter()
  }

  async searchAllMarketplaces(params: AggregatedSearchParams & { limit?: number }): Promise<AggregatedResults> {
    const sources = params.sources || ['thriftai', 'amazon', 'ebay']
    const perSourceLimit = params.limit || 20 // Default to 20 per source

    // Check cache first
    const cacheKey = `search:${JSON.stringify(params)}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() < cached.expiry) {
      console.log('Returning cached marketplace results')
      return cached.data
    }

    console.log(`Searching ${sources.length} marketplaces with limit ${perSourceLimit} per source`, {
      query: params.query,
      maxPrice: params.maxPrice,
      minPrice: params.minPrice
    })

    // Search all sources in parallel with error handling and per-source limits
    const searchPromises = sources.map(source =>
      this.searchSource(source, { ...params, limit: perSourceLimit }).catch(err => {
        console.error(`${source} search failed:`, err)
        return []
      })
    )

    const results = await Promise.all(searchPromises)
    const allProducts = results.flat()

    console.log(`Total products from all sources: ${allProducts.length}`)

    // Apply hard filters at aggregation level (belt and suspenders)
    const hardFiltered = this.applyHardFilters(allProducts, params)
    console.log(`After hard filtering: ${hardFiltered.length} products`)

    // Deduplicate similar products
    const deduplicated = this.deduplicateProducts(hardFiltered)
    console.log(`After deduplication: ${deduplicated.length} products`)

    // Sort by total cost (price + shipping)
    deduplicated.sort((a, b) => a.totalCost - b.totalCost)

    // Limit total results
    const maxTotalResults = perSourceLimit * sources.length
    const limited = deduplicated.slice(0, maxTotalResults)

    // Find best deal
    const bestDeal = limited[0] || null

    // Calculate insights
    const insights = this.calculateInsights(limited)

    const response: AggregatedResults = {
      results: limited,
      bestDeal,
      insights
    }

    // Cache for 5 minutes
    searchCache.set(cacheKey, {
      data: response,
      expiry: Date.now() + 5 * 60 * 1000
    })

    return response
  }

  /**
   * Apply hard filters at aggregation level to ensure nothing slips through
   */
  private applyHardFilters(
    products: AggregatedProduct[],
    params: AggregatedSearchParams
  ): AggregatedProduct[] {
    return products.filter(product => {
      // Price filters
      if (params.minPrice !== undefined && product.price < params.minPrice) {
        return false
      }
      if (params.maxPrice !== undefined && product.price > params.maxPrice) {
        return false
      }

      // Availability filter (always require available)
      if (!product.availability) {
        return false
      }

      return true
    })
  }

  private async searchSource(
    source: string,
    params: AggregatedSearchParams
  ): Promise<AggregatedProduct[]> {
    // Check rate limit
    const allowed = await checkRateLimit(source)
    if (!allowed) {
      console.warn(`Rate limit exceeded for ${source}`)
      return []
    }

    switch (source) {
      case 'thriftai':
        return this.searchThriftAI(params)
      case 'amazon':
        return this.searchAmazon(params)
      case 'ebay':
        return this.searchEbay(params)
      case 'nike':
        return this.searchNike(params)
      case 'adidas':
        return this.searchAdidas(params)
      default:
        return []
    }
  }

  private async searchThriftAI(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    try {
      const whereClause: any = {
        isAvailable: true
      }

      // Add search query filter
      if (params.query) {
        whereClause.OR = [
          { name: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } },
          { brand: { contains: params.query, mode: 'insensitive' } }
        ]
      }

      // Add price filters
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        whereClause.price = {}
        if (params.minPrice !== undefined) {
          whereClause.price.gte = params.minPrice
        }
        if (params.maxPrice !== undefined) {
          whereClause.price.lte = params.maxPrice
        }
      }

      // Add category filter
      if (params.category) {
        whereClause.category = params.category
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        take: 20,
        include: {
          seller: {
            select: { businessName: true, rating: true }
          }
        }
      })

      return products.map(product => ({
        source: 'thriftai',
        id: product.id,
        title: product.name,
        brand: product.brand || undefined,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        shippingCost: 5, // Estimate, should be calculated
        totalCost: product.price + 5,
        imageUrl: product.imageUrl || undefined,
        productUrl: `/products/${product.id}`,
        condition: product.condition || undefined,
        availability: true,
        metadata: { seller: product.seller }
      }))
    } catch (error) {
      console.error('ThriftAI search error:', error)
      return []
    }
  }

  private async searchAmazon(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    try {
      const results = await this.amazonAdapter.searchProducts({
        keywords: params.query,
        category: params.category,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        limit: 20
      })

      return results.map(product => ({
        source: 'amazon',
        id: product.asin,
        title: product.title,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        shippingCost: 0, // Amazon often has free shipping
        totalCost: product.price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        affiliateUrl: product.affiliateUrl,
        rating: product.rating,
        condition: 'New',
        availability: product.availability
      }))
    } catch (error) {
      console.error('Amazon search error:', error)
      return []
    }
  }

  private async searchEbay(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    try {
      const results = await this.ebayAdapter.searchProducts({
        keywords: params.query,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        limit: 20
      })

      return results.map(product => ({
        source: 'ebay',
        id: product.itemId,
        title: product.title,
        price: product.price,
        shippingCost: product.shippingCost,
        totalCost: product.price + product.shippingCost,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        affiliateUrl: product.affiliateUrl,
        condition: product.condition,
        availability: true,
        metadata: { sellerRating: product.sellerRating, location: product.location }
      }))
    } catch (error) {
      console.error('eBay search error:', error)
      return []
    }
  }

  private async searchNike(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    try {
      const results = await this.brandAdapter.searchNikeProducts(params.query)
      return results.map(product => ({
        source: 'nike',
        id: product.id,
        title: product.title,
        brand: 'Nike',
        price: product.price,
        shippingCost: 0,
        totalCost: product.price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        affiliateUrl: product.affiliateUrl,
        condition: 'New',
        availability: true
      }))
    } catch (error) {
      console.error('Nike search error:', error)
      return []
    }
  }

  private async searchAdidas(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    try {
      const results = await this.brandAdapter.searchAdidasProducts(params.query)
      return results.map(product => ({
        source: 'adidas',
        id: product.id,
        title: product.title,
        brand: 'Adidas',
        price: product.price,
        shippingCost: 0,
        totalCost: product.price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        affiliateUrl: product.affiliateUrl,
        condition: 'New',
        availability: true
      }))
    } catch (error) {
      console.error('Adidas search error:', error)
      return []
    }
  }

  private deduplicateProducts(products: AggregatedProduct[]): AggregatedProduct[] {
    // Simple deduplication based on title similarity
    // TODO: Use more sophisticated matching (embeddings, brand+model, etc.)
    const seen = new Set<string>()
    return products.filter(product => {
      const key = `${product.brand || 'unknown'}-${product.title.toLowerCase().slice(0, 50)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private calculateInsights(products: AggregatedProduct[]) {
    if (products.length === 0) {
      return {
        totalFound: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        sourceBreakdown: {}
      }
    }

    const prices = products.map(p => p.totalCost)
    const sourceBreakdown = products.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalFound: products.length,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      sourceBreakdown
    }
  }
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of searchCache.entries()) {
    if (now > value.expiry) {
      searchCache.delete(key)
    }
  }
}, 60000) // Clean every minute