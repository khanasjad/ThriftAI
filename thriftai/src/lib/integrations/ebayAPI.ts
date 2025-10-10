/**
 * eBay Finding API Integration
 * Fetches products from eBay marketplace
 */

import { logger } from '@/lib/logger'

interface eBayCredentials {
  appId: string
  certId?: string
  devId?: string
  campaignId?: string
}

interface eBayProduct {
  id: string
  itemId: string
  name: string
  title: string
  brand?: string
  price?: number
  originalPrice?: number
  imageUrl?: string
  images?: string[]
  description?: string
  category?: string
  condition?: string
  affiliateUrl: string
  source: 'eBay'
  location?: string
  shippingCost?: number
  listingType?: string
  buyItNowAvailable?: boolean
}

interface eBaySearchParams {
  keywords: string
  category?: string
  minPrice?: number
  maxPrice?: number
  condition?: 'New' | 'Used' | 'Unspecified' | 'All'
  sortBy?: 'BestMatch' | 'CurrentPriceHighest' | 'PricePlusShippingLowest' | 'PricePlusShippingHighest' | 'EndTimeSoonest'
  page?: number
  itemsPerPage?: number
}

interface eBaySearchResult {
  success: boolean
  products: eBayProduct[]
  totalResults: number
  page: number
  error?: string
}

/**
 * Get eBay credentials from environment
 */
function geteBayCredentials(): eBayCredentials {
  const appId = process.env.EBAY_APP_ID || process.env.EBAY_API_KEY
  const certId = process.env.EBAY_CERT_ID
  const devId = process.env.EBAY_DEV_ID
  const campaignId = process.env.EBAY_CAMPAIGN_ID

  if (!appId) {
    throw new Error('eBay API credentials not configured')
  }

  return {
    appId,
    certId,
    devId,
    campaignId
  }
}

/**
 * Map eBay condition to our standard format
 */
function mapCondition(condition: string): string {
  const conditionMap: Record<string, string> = {
    '1000': 'New',
    '1500': 'New',
    '1750': 'Like New',
    '2000': 'Refurbished',
    '2500': 'Refurbished',
    '3000': 'Used',
    '4000': 'Used',
    '5000': 'Used',
    '6000': 'Used',
    '7000': 'Refurbished'
  }

  return conditionMap[condition] || 'Used'
}

/**
 * Search products on eBay
 */
export async function searcheBayProducts(
  params: eBaySearchParams
): Promise<eBaySearchResult> {
  try {
    const credentials = geteBayCredentials()

    logger.info('🔍 Searching eBay products', {
      component: 'eBayAPI',
      metadata: { keywords: params.keywords, category: params.category }
    })

    // Build query parameters
    const queryParams = new URLSearchParams({
      'OPERATION-NAME': 'findItemsAdvanced',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': credentials.appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': 'true',
      'keywords': params.keywords,
      'paginationInput.entriesPerPage': String(params.itemsPerPage || 10),
      'paginationInput.pageNumber': String(params.page || 1),
      'sortOrder': params.sortBy || 'BestMatch'
    })

    // Add price filters
    if (params.minPrice) {
      queryParams.append('itemFilter(0).name', 'MinPrice')
      queryParams.append('itemFilter(0).value', String(params.minPrice))
      queryParams.append('itemFilter(0).paramName', 'Currency')
      queryParams.append('itemFilter(0).paramValue', 'USD')
    }

    if (params.maxPrice) {
      const filterIndex = params.minPrice ? 1 : 0
      queryParams.append(`itemFilter(${filterIndex}).name`, 'MaxPrice')
      queryParams.append(`itemFilter(${filterIndex}).value`, String(params.maxPrice))
      queryParams.append(`itemFilter(${filterIndex}).paramName`, 'Currency')
      queryParams.append(`itemFilter(${filterIndex}).paramValue`, 'USD')
    }

    // Add condition filter
    if (params.condition && params.condition !== 'All') {
      const filterIndex = params.minPrice && params.maxPrice ? 2 : params.minPrice || params.maxPrice ? 1 : 0
      queryParams.append(`itemFilter(${filterIndex}).name`, 'Condition')

      if (params.condition === 'New') {
        queryParams.append(`itemFilter(${filterIndex}).value`, '1000')
      } else if (params.condition === 'Used') {
        queryParams.append(`itemFilter(${filterIndex}).value(0)`, '3000')
        queryParams.append(`itemFilter(${filterIndex}).value(1)`, '4000')
        queryParams.append(`itemFilter(${filterIndex}).value(2)`, '5000')
      }
    }

    // Add affiliate tracking
    if (credentials.campaignId) {
      queryParams.append('affiliate.networkId', '9')
      queryParams.append('affiliate.trackingId', credentials.campaignId)
    }

    // Make API request
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${queryParams.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`)
    }

    const data = await response.json()

    // Check for API errors
    if (data.errorMessage) {
      throw new Error(`eBay API error: ${data.errorMessage[0].error[0].message[0]}`)
    }

    // Parse response
    const searchResult = data.findItemsAdvancedResponse?.[0]
    const items = searchResult?.searchResult?.[0]?.item || []

    const products: eBayProduct[] = items.map((item: any) => {
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0)
      const shippingCost = parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || 0)
      const condition = item.condition?.[0]?.conditionId?.[0]

      return {
        id: item.itemId[0],
        itemId: item.itemId[0],
        name: item.title[0],
        title: item.title[0],
        brand: undefined, // Not always available in Finding API
        price,
        originalPrice: price, // eBay doesn't provide MSRP in Finding API
        imageUrl: item.galleryURL?.[0] || item.pictureURLLarge?.[0],
        images: item.pictureURLLarge || [],
        description: item.subtitle?.[0],
        category: item.primaryCategory?.[0]?.categoryName?.[0],
        condition: condition ? mapCondition(condition) : 'Used',
        affiliateUrl: item.viewItemURL[0],
        source: 'eBay' as const,
        location: item.location?.[0],
        shippingCost,
        listingType: item.listingInfo?.[0]?.listingType?.[0],
        buyItNowAvailable: item.listingInfo?.[0]?.buyItNowAvailable?.[0] === 'true'
      }
    })

    const totalResults = parseInt(searchResult?.paginationOutput?.[0]?.totalEntries?.[0] || '0')

    logger.info('✅ eBay search complete', {
      component: 'eBayAPI',
      metadata: {
        productsFound: products.length,
        totalResults
      }
    })

    return {
      success: true,
      products,
      totalResults,
      page: params.page || 1
    }

  } catch (error) {
    logger.error('❌ eBay API search failed', {
      component: 'eBayAPI',
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      products: [],
      totalResults: 0,
      page: params.page || 1,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get product details from eBay
 */
export async function geteBayProductDetails(itemId: string): Promise<eBayProduct | null> {
  try {
    const credentials = geteBayCredentials()

    logger.info('📦 Fetching eBay product details', {
      component: 'eBayAPI',
      metadata: { itemId }
    })

    const queryParams = new URLSearchParams({
      'OPERATION-NAME': 'findItemsByProduct',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': credentials.appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': 'true',
      'productId.@type': 'ReferenceID',
      'productId': itemId
    })

    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${queryParams.toString()}`
    const response = await fetch(url)
    const data = await response.json()

    const item = data.findItemsByProductResponse?.[0]?.searchResult?.[0]?.item?.[0]
    if (!item) return null

    const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0)
    const condition = item.condition?.[0]?.conditionId?.[0]

    return {
      id: item.itemId[0],
      itemId: item.itemId[0],
      name: item.title[0],
      title: item.title[0],
      brand: undefined,
      price,
      originalPrice: price,
      imageUrl: item.galleryURL?.[0],
      images: item.pictureURLLarge || [],
      description: item.subtitle?.[0],
      category: item.primaryCategory?.[0]?.categoryName?.[0],
      condition: condition ? mapCondition(condition) : 'Used',
      affiliateUrl: item.viewItemURL[0],
      source: 'eBay',
      location: item.location?.[0],
      shippingCost: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || 0),
      listingType: item.listingInfo?.[0]?.listingType?.[0],
      buyItNowAvailable: item.listingInfo?.[0]?.buyItNowAvailable?.[0] === 'true'
    }

  } catch (error) {
    logger.error('❌ eBay product details failed', {
      component: 'eBayAPI',
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}

/**
 * Check if eBay API is configured
 */
export function iseBayAPIConfigured(): boolean {
  try {
    geteBayCredentials()
    return true
  } catch {
    return false
  }
}
