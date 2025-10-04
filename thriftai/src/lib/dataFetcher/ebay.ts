/**
 * eBay Finding API Integration
 * Official eBay API - FREE (5,000 calls/day)
 * Provides seller trust data and market information
 */

import { EbaySellerInfo, EbayListingInfo, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'

const EBAY_API_BASE = 'https://svcs.ebay.com/services/search/FindingService/v1'

/**
 * Get seller information from eBay
 */
export async function getEbaySeller(
  sellerId: string
): Promise<DataSourceResult<EbaySellerInfo>> {
  const source = 'EBAY_SELLER'
  const cacheKey = generateCacheKey(source, sellerId)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.SELLER_INFO,
      async () => {
        return await withRateLimit('EBAY', async () => {
          return await fetchEbaySeller(sellerId)
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
    console.error('[eBay Seller] Error:', error)
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
 * Search eBay listings by product name
 */
export async function searchEbayListings(
  productName: string,
  options?: {
    condition?: 'New' | 'Used' | 'Refurbished'
    maxResults?: number
    sortOrder?: 'BestMatch' | 'PricePlusShippingLowest' | 'PricePlusShippingHighest'
  }
): Promise<DataSourceResult<EbayListingInfo[]>> {
  const source = 'EBAY_LISTINGS'
  const cacheKey = generateCacheKey(source, productName, options?.condition || 'all')

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.LISTING_DATA,
      async () => {
        return await withRateLimit('EBAY', async () => {
          return await fetchEbayListings(productName, options)
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
    console.error('[eBay Listings] Error:', error)
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
 * Fetch seller information
 */
async function fetchEbaySeller(sellerId: string): Promise<EbaySellerInfo> {
  const appId = process.env.EBAY_APP_ID

  if (!appId) {
    throw new Error('EBAY_APP_ID environment variable not set')
  }

  // Search for items by this seller
  const params = new URLSearchParams({
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'itemFilter(0).name': 'Seller',
    'itemFilter(0).value': sellerId,
    'paginationInput.entriesPerPage': '1',
  })

  const url = `${EBAY_API_BASE}?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'X-EBAY-API-APP-ID': appId,
    },
  })

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status}`)
  }

  const data = await response.json()

  const searchResult = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]

  if (!searchResult || !searchResult.item || searchResult.item.length === 0) {
    throw new Error(`Seller not found: ${sellerId}`)
  }

  const item = searchResult.item[0]
  const sellerInfo = item.sellerInfo?.[0]

  if (!sellerInfo) {
    throw new Error(`Seller info not available for: ${sellerId}`)
  }

  return parseEbaySellerInfo(sellerInfo)
}

/**
 * Fetch listings
 */
async function fetchEbayListings(
  productName: string,
  options?: {
    condition?: 'New' | 'Used' | 'Refurbished'
    maxResults?: number
    sortOrder?: 'BestMatch' | 'PricePlusShippingLowest' | 'PricePlusShippingHighest'
  }
): Promise<EbayListingInfo[]> {
  const appId = process.env.EBAY_APP_ID

  if (!appId) {
    throw new Error('EBAY_APP_ID environment variable not set')
  }

  const params = new URLSearchParams({
    'OPERATION-NAME': 'findItemsByKeywords',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': productName,
    'paginationInput.entriesPerPage': String(options?.maxResults || 25),
  })

  // Add condition filter
  if (options?.condition) {
    const conditionMap: Record<string, string> = {
      'New': '1000',
      'Used': '3000',
      'Refurbished': '2000',
    }
    params.append('itemFilter(0).name', 'Condition')
    params.append('itemFilter(0).value', conditionMap[options.condition])
  }

  // Add sort order
  if (options?.sortOrder) {
    params.append('sortOrder', options.sortOrder)
  }

  const url = `${EBAY_API_BASE}?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'X-EBAY-API-APP-ID': appId,
    },
  })

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status}`)
  }

  const data = await response.json()

  const searchResult = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]

  if (!searchResult || !searchResult.item) {
    return []
  }

  const items = searchResult.item || []

  return items.map((item: any) => parseEbayListing(item))
}

/**
 * Parse seller info from eBay response
 */
function parseEbaySellerInfo(sellerInfo: any): EbaySellerInfo {
  return {
    userId: sellerInfo.sellerUserName?.[0] || '',
    feedbackScore: parseInt(sellerInfo.feedbackScore?.[0] || '0'),
    positiveFeedbackPercent: parseFloat(sellerInfo.positiveFeedbackPercent?.[0] || '0'),
    negativeFeedbackPercent: 100 - parseFloat(sellerInfo.positiveFeedbackPercent?.[0] || '0'),
    topRatedSeller: sellerInfo.topRatedSeller?.[0] === 'true',
    feedbackPrivate: sellerInfo.feedbackPrivate?.[0] === 'true',
    sellerBusinessType: sellerInfo.sellerBusinessType?.[0],
  }
}

/**
 * Parse listing from eBay response
 */
function parseEbayListing(item: any): EbayListingInfo {
  const sellerInfo = item.sellerInfo?.[0]

  return {
    itemId: item.itemId?.[0] || '',
    title: item.title?.[0] || '',
    condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
    price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
    currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
    shippingCost: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0'),
    location: item.location?.[0] || '',
    sellerInfo: sellerInfo ? parseEbaySellerInfo(sellerInfo) : {
      userId: '',
      feedbackScore: 0,
      positiveFeedbackPercent: 0,
      negativeFeedbackPercent: 100,
      topRatedSeller: false,
      feedbackPrivate: false,
    },
    imageUrls: item.galleryURL ? [item.galleryURL[0]] : [],
    listingUrl: item.viewItemURL?.[0] || '',
  }
}

/**
 * Calculate seller trust score from eBay data
 */
export function calculateSellerTrustScore(seller: EbaySellerInfo): number {
  let score = 0

  // Feedback score (0-30 points)
  // 1000+ feedback = 30 points
  const feedbackPoints = Math.min(30, (seller.feedbackScore / 1000) * 30)
  score += feedbackPoints

  // Positive feedback percentage (0-50 points)
  score += seller.positiveFeedbackPercent * 0.5

  // Top rated seller bonus (20 points)
  if (seller.topRatedSeller) {
    score += 20
  }

  // Cap at 100
  return Math.min(100, score)
}

/**
 * Get market price statistics from listings
 */
export function getMarketPriceStats(listings: EbayListingInfo[]): {
  average: number
  median: number
  lowest: number
  highest: number
  count: number
} {
  if (listings.length === 0) {
    return {
      average: 0,
      median: 0,
      lowest: 0,
      highest: 0,
      count: 0,
    }
  }

  const prices = listings.map(l => l.price + (l.shippingCost || 0)).sort((a, b) => a - b)

  return {
    average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    median: prices[Math.floor(prices.length / 2)],
    lowest: prices[0],
    highest: prices[prices.length - 1],
    count: prices.length,
  }
}
