/**
 * BestBuy API Integration
 * Official BestBuy API - FREE (50,000 calls/day)
 * Provides product specifications, pricing, reviews, and availability data
 *
 * API Documentation: https://bestbuyapis.github.io/api-documentation/
 * Developer Portal: https://developer.bestbuy.com/
 *
 * Data Retrieved:
 * - Product specifications (screen size, processor, RAM, storage, etc.)
 * - Customer reviews and ratings
 * - Current pricing and discounts
 * - Product availability and stock status
 * - Product images and media
 */

import { DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'
import { logger } from '@/lib/logger'
import { EXTERNAL_API_URLS } from '@/config/constants'

const BESTBUY_API_BASE = EXTERNAL_API_URLS.BESTBUY

/**
 * BestBuy Product Information
 */
export interface BestBuyProductInfo {
  sku: string
  name: string
  type: string
  manufacturer: string
  modelNumber: string
  regularPrice: number
  salePrice?: number
  onSale: boolean
  customerReviewAverage?: number
  customerReviewCount?: number
  inStoreAvailability: boolean
  onlineAvailability: boolean
  url: string
  image?: string
  description?: string
  features?: string[]
  specifications?: Record<string, string>
  category: string
  subCategory?: string
  releaseDate?: string
  condition?: 'new' | 'refurbished' | 'open-box'
}

/**
 * BestBuy Search Result
 */
export interface BestBuySearchResult {
  total: number
  from: number
  to: number
  products: BestBuyProductInfo[]
}

/**
 * Search BestBuy products by query
 */
export async function searchBestBuyProducts(
  query: string,
  options?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    condition?: 'new' | 'refurbished' | 'open-box'
    onSale?: boolean
    maxResults?: number
  }
): Promise<DataSourceResult<BestBuySearchResult>> {
  const source = 'BESTBUY_SEARCH'
  const cacheKey = generateCacheKey(
    source,
    query,
    options?.category || 'all',
    options?.condition || 'all'
  )

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.PRODUCT_INFO,
      async () => {
        return await withRateLimit('BESTBUY', async () => {
          return await fetchBestBuySearch(query, options)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    logger.error('BestBuy search failed', {
      component: 'BestBuyFetcher',
      metadata: { query, error: error instanceof Error ? error.message : 'Unknown error' },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Get BestBuy product details by SKU
 */
export async function getBestBuyProduct(
  sku: string
): Promise<DataSourceResult<BestBuyProductInfo>> {
  const source = 'BESTBUY_PRODUCT'
  const cacheKey = generateCacheKey(source, sku)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.PRODUCT_INFO,
      async () => {
        return await withRateLimit('BESTBUY', async () => {
          return await fetchBestBuyProduct(sku)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    logger.error('BestBuy product fetch failed', {
      component: 'BestBuyFetcher',
      metadata: { sku, error: error instanceof Error ? error.message : 'Unknown error' },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Get BestBuy product reviews
 */
export async function getBestBuyReviews(
  sku: string
): Promise<DataSourceResult<any>> {
  const source = 'BESTBUY_REVIEWS'
  const cacheKey = generateCacheKey(source, sku)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.PRODUCT_REVIEWS,
      async () => {
        return await withRateLimit('BESTBUY', async () => {
          return await fetchBestBuyReviews(sku)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    logger.error('BestBuy reviews fetch failed', {
      component: 'BestBuyFetcher',
      metadata: { sku, error: error instanceof Error ? error.message : 'Unknown error' },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Internal: Fetch BestBuy search results
 */
async function fetchBestBuySearch(
  query: string,
  options?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    condition?: 'new' | 'refurbished' | 'open-box'
    onSale?: boolean
    maxResults?: number
  }
): Promise<BestBuySearchResult> {
  const apiKey = process.env.BESTBUY_API_KEY

  if (!apiKey) {
    logger.warn('BESTBUY_API_KEY not configured', {
      component: 'BestBuyFetcher',
    })
    throw new Error('BestBuy API key not configured')
  }

  // Build query parameters
  const filters: string[] = [`search=${encodeURIComponent(query)}`]

  if (options?.category) {
    filters.push(`categoryPath.name="${encodeURIComponent(options.category)}"`)
  }

  if (options?.minPrice) {
    filters.push(`salePrice>=${options.minPrice}`)
  }

  if (options?.maxPrice) {
    filters.push(`salePrice<=${options.maxPrice}`)
  }

  if (options?.condition === 'refurbished') {
    filters.push('condition=Refurbished')
  } else if (options?.condition === 'open-box') {
    filters.push('condition=Open-Box')
  }

  if (options?.onSale) {
    filters.push('onSale=true')
  }

  const filterString = filters.join('&')
  const pageSize = Math.min(options?.maxResults || 10, 100)

  const url = `${BESTBUY_API_BASE}/products((${filterString}))?format=json&pageSize=${pageSize}&apiKey=${apiKey}`

  logger.info('Fetching BestBuy search results', {
    component: 'BestBuyFetcher',
    metadata: { query, filters: filterString },
  })

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`BestBuy API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  return {
    total: result.total || 0,
    from: result.from || 0,
    to: result.to || 0,
    products: (result.products || []).map(mapBestBuyProduct),
  }
}

/**
 * Internal: Fetch BestBuy product by SKU
 */
async function fetchBestBuyProduct(sku: string): Promise<BestBuyProductInfo> {
  const apiKey = process.env.BESTBUY_API_KEY

  if (!apiKey) {
    logger.warn('BESTBUY_API_KEY not configured', {
      component: 'BestBuyFetcher',
    })
    throw new Error('BestBuy API key not configured')
  }

  const url = `${BESTBUY_API_BASE}/products/${sku}.json?apiKey=${apiKey}`

  logger.info('Fetching BestBuy product details', {
    component: 'BestBuyFetcher',
    metadata: { sku },
  })

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Product SKU ${sku} not found`)
    }
    throw new Error(`BestBuy API error: ${response.status} ${response.statusText}`)
  }

  const product = await response.json()

  return mapBestBuyProduct(product)
}

/**
 * Internal: Fetch BestBuy product reviews
 */
async function fetchBestBuyReviews(sku: string): Promise<any> {
  const apiKey = process.env.BESTBUY_API_KEY

  if (!apiKey) {
    throw new Error('BestBuy API key not configured')
  }

  const url = `${BESTBUY_API_BASE}/reviews(sku=${sku})?format=json&apiKey=${apiKey}`

  logger.info('Fetching BestBuy reviews', {
    component: 'BestBuyFetcher',
    metadata: { sku },
  })

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`BestBuy API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  return result
}

/**
 * Map BestBuy API response to our interface
 */
function mapBestBuyProduct(product: any): BestBuyProductInfo {
  return {
    sku: product.sku,
    name: product.name,
    type: product.type || 'Unknown',
    manufacturer: product.manufacturer || 'Unknown',
    modelNumber: product.modelNumber || '',
    regularPrice: product.regularPrice || 0,
    salePrice: product.salePrice,
    onSale: product.onSale || false,
    customerReviewAverage: product.customerReviewAverage,
    customerReviewCount: product.customerReviewCount,
    inStoreAvailability: product.inStoreAvailability || false,
    onlineAvailability: product.onlineAvailability || false,
    url: product.url || '',
    image: product.image || product.largeImage || product.thumbnailImage,
    description: product.longDescription || product.shortDescription,
    features: product.features || [],
    category: product.categoryPath?.[0]?.name || 'Unknown',
    subCategory: product.categoryPath?.[1]?.name,
    releaseDate: product.releaseDate,
    condition: product.condition?.toLowerCase() || 'new',
  }
}

/**
 * Helper: Find comparable products on BestBuy
 * Used for market value comparison in Veritas Score
 */
export async function findComparableProducts(
  brand: string,
  modelNumber: string,
  category?: string
): Promise<DataSourceResult<BestBuySearchResult>> {
  const query = `${brand} ${modelNumber}`
  return await searchBestBuyProducts(query, {
    category,
    maxResults: 10,
  })
}

/**
 * Helper: Get average market price for a product
 */
export async function getMarketPrice(
  brand: string,
  modelNumber: string,
  condition: 'new' | 'refurbished' | 'open-box' = 'new'
): Promise<number | null> {
  try {
    const result = await searchBestBuyProducts(`${brand} ${modelNumber}`, {
      condition,
      maxResults: 5,
    })

    if (!result.success || !result.data || result.data.products.length === 0) {
      return null
    }

    // Calculate average sale price
    const prices = result.data.products
      .map((p) => p.salePrice || p.regularPrice)
      .filter((p) => p > 0)

    if (prices.length === 0) {
      return null
    }

    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  } catch (error) {
    logger.error('Failed to get market price', {
      component: 'BestBuyFetcher',
      metadata: { brand, modelNumber, error: error instanceof Error ? error.message : 'Unknown' },
    })
    return null
  }
}
