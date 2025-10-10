/**
 * Amazon Product Advertising API Integration
 * Fetches products from Amazon using PA-API 5.0
 */

import { logger } from '@/lib/logger'
import crypto from 'crypto'

interface AmazonCredentials {
  accessKey: string
  secretKey: string
  partnerTag: string
  region: string
}

interface AmazonProduct {
  id: string
  asin: string
  name: string
  title: string
  brand?: string
  price?: number
  originalPrice?: number
  imageUrl?: string
  images?: string[]
  description?: string
  category?: string
  rating?: number
  reviewCount?: number
  affiliateUrl: string
  source: 'Amazon'
  availability?: string
  condition?: string
  isPrime?: boolean
}

interface AmazonSearchParams {
  keywords: string
  category?: string
  minPrice?: number
  maxPrice?: number
  condition?: 'New' | 'Used' | 'Refurbished' | 'All'
  sortBy?: 'Relevance' | 'Price:LowToHigh' | 'Price:HighToLow' | 'AvgCustomerReview' | 'Newest'
  page?: number
  itemsPerPage?: number
}

interface AmazonSearchResult {
  success: boolean
  products: AmazonProduct[]
  totalResults: number
  page: number
  error?: string
}

/**
 * Get Amazon credentials from environment
 */
function getAmazonCredentials(): AmazonCredentials {
  const accessKey = process.env.AMAZON_ACCESS_KEY || process.env.AMAZON_API_KEY
  const secretKey = process.env.AMAZON_SECRET_KEY || process.env.AMAZON_API_SECRET
  const partnerTag = process.env.AMAZON_PARTNER_TAG || process.env.AMAZON_ASSOCIATE_TAG || 'thriftai-20'

  if (!accessKey || !secretKey) {
    throw new Error('Amazon API credentials not configured')
  }

  return {
    accessKey,
    secretKey,
    partnerTag,
    region: 'us-east-1'
  }
}

/**
 * Create AWS Signature Version 4
 */
function createAWSSignature(
  method: string,
  host: string,
  path: string,
  payload: string,
  credentials: AmazonCredentials
): { headers: Record<string, string> } {
  const service = 'ProductAdvertisingAPI'
  const region = credentials.region
  const algorithm = 'AWS4-HMAC-SHA256'

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.substr(0, 8)

  // Create canonical request
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex')
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-date'
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  // Calculate signature
  const kDate = crypto.createHmac('sha256', `AWS4${credentials.secretKey}`).update(dateStamp).digest()
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest()
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest()
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest()
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  // Create authorization header
  const authorizationHeader = `${algorithm} Credential=${credentials.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    headers: {
      'Host': host,
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader,
      'Content-Type': 'application/json; charset=utf-8'
    }
  }
}

/**
 * Search products on Amazon
 */
export async function searchAmazonProducts(
  params: AmazonSearchParams
): Promise<AmazonSearchResult> {
  try {
    const credentials = getAmazonCredentials()

    logger.info('🔍 Searching Amazon products', {
      component: 'AmazonAPI',
      metadata: { keywords: params.keywords, category: params.category }
    })

    // Build request payload
    const payload = {
      Keywords: params.keywords,
      Resources: [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ProductInfo',
        'ItemInfo.Features',
        'ItemInfo.Classifications',
        'Offers.Listings.Price',
        'Offers.Listings.Condition',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'BrowseNodeInfo.BrowseNodes'
      ],
      PartnerTag: credentials.partnerTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
      ItemCount: params.itemsPerPage || 10,
      ItemPage: params.page || 1,
      ...(params.minPrice && { MinPrice: Math.round(params.minPrice * 100) }),
      ...(params.maxPrice && { MaxPrice: Math.round(params.maxPrice * 100) }),
      ...(params.condition && params.condition !== 'All' && { Condition: params.condition }),
      ...(params.sortBy && { SortBy: params.sortBy })
    }

    const host = 'webservices.amazon.com'
    const path = '/paapi5/searchitems'
    const payloadString = JSON.stringify(payload)

    // Create AWS signature
    const { headers } = createAWSSignature('POST', host, path, payloadString, credentials)

    // Make API request
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
      },
      body: payloadString
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Amazon API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Check for API errors
    if (data.Errors && data.Errors.length > 0) {
      throw new Error(`Amazon API error: ${data.Errors[0].Message}`)
    }

    // Parse response
    const products: AmazonProduct[] = (data.SearchResult?.Items || []).map((item: any) => {
      const offer = item.Offers?.Listings?.[0]
      const price = offer?.Price?.Amount ? offer.Price.Amount / 100 : undefined
      const originalPrice = offer?.SavingBasis?.Amount ? offer.SavingBasis.Amount / 100 : undefined

      return {
        id: item.ASIN,
        asin: item.ASIN,
        name: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
        title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
        brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
        price,
        originalPrice: originalPrice || price,
        imageUrl: item.Images?.Primary?.Large?.URL,
        images: item.Images?.Variants?.map((v: any) => v.Large?.URL).filter(Boolean) || [],
        description: item.ItemInfo?.Features?.DisplayValues?.join('. '),
        category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName,
        rating: undefined, // Not available in SearchItems
        reviewCount: undefined,
        affiliateUrl: item.DetailPageURL,
        source: 'Amazon' as const,
        availability: offer?.Availability?.Message,
        condition: offer?.Condition?.Value || 'New',
        isPrime: offer?.DeliveryInfo?.IsPrimeEligible || false
      }
    })

    logger.info('✅ Amazon search complete', {
      component: 'AmazonAPI',
      metadata: {
        productsFound: products.length,
        totalResults: data.SearchResult?.TotalResultCount || products.length
      }
    })

    return {
      success: true,
      products,
      totalResults: data.SearchResult?.TotalResultCount || products.length,
      page: params.page || 1
    }

  } catch (error) {
    logger.error('❌ Amazon API search failed', {
      component: 'AmazonAPI',
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
 * Get product details from Amazon
 */
export async function getAmazonProductDetails(asin: string): Promise<AmazonProduct | null> {
  try {
    const credentials = getAmazonCredentials()

    logger.info('📦 Fetching Amazon product details', {
      component: 'AmazonAPI',
      metadata: { asin }
    })

    const payload = {
      ItemIds: [asin],
      Resources: [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ProductInfo',
        'ItemInfo.Features',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.Classifications',
        'Offers.Listings.Price',
        'Offers.Listings.Condition',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count'
      ],
      PartnerTag: credentials.partnerTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com'
    }

    const host = 'webservices.amazon.com'
    const path = '/paapi5/getitems'
    const payloadString = JSON.stringify(payload)

    const { headers } = createAWSSignature('POST', host, path, payloadString, credentials)

    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
      },
      body: payloadString
    })

    const data = await response.json()

    if (data.Errors && data.Errors.length > 0) {
      throw new Error(`Amazon API error: ${data.Errors[0].Message}`)
    }

    const item = data.ItemsResult?.Items?.[0]
    if (!item) return null

    const offer = item.Offers?.Listings?.[0]
    const price = offer?.Price?.Amount ? offer.Price.Amount / 100 : undefined

    return {
      id: item.ASIN,
      asin: item.ASIN,
      name: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price,
      originalPrice: offer?.SavingBasis?.Amount ? offer.SavingBasis.Amount / 100 : price,
      imageUrl: item.Images?.Primary?.Large?.URL,
      images: item.Images?.Variants?.map((v: any) => v.Large?.URL).filter(Boolean) || [],
      description: item.ItemInfo?.Features?.DisplayValues?.join('. '),
      category: item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue,
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
      affiliateUrl: item.DetailPageURL,
      source: 'Amazon',
      availability: offer?.Availability?.Message,
      condition: offer?.Condition?.Value || 'New',
      isPrime: offer?.DeliveryInfo?.IsPrimeEligible || false
    }

  } catch (error) {
    logger.error('❌ Amazon product details failed', {
      component: 'AmazonAPI',
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}

/**
 * Check if Amazon API is configured
 */
export function isAmazonAPIConfigured(): boolean {
  try {
    getAmazonCredentials()
    return true
  } catch {
    return false
  }
}
