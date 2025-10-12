/**
 * Amazon Product Advertising API (PA-API 5.0) Client
 *
 * Official Amazon API for getting real product data with affiliate links.
 *
 * Setup:
 * 1. Sign up: https://affiliate-program.amazon.com/
 * 2. Get API credentials: https://webservices.amazon.com/paapi5/documentation/
 * 3. Add to .env:
 *    AMAZON_ACCESS_KEY=your_access_key
 *    AMAZON_SECRET_KEY=your_secret_key
 *    AMAZON_ASSOCIATE_TAG=your_associate_tag
 *    AMAZON_REGION=us-east-1
 */

import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk'

export interface AmazonProduct {
  asin: string
  title: string
  brand: string
  price: number
  listPrice: number
  images: string[]
  affiliateUrl: string
  rating: number
  reviewCount: number
  availability: string
  isPrime: boolean
  features: string[]
  category?: string
}

export class AmazonPAAPI {
  private api: any
  private partnerTag: string
  private isConfigured: boolean

  constructor() {
    // Check if API is configured
    this.isConfigured = !!(
      process.env.AMAZON_ACCESS_KEY &&
      process.env.AMAZON_SECRET_KEY &&
      process.env.AMAZON_ASSOCIATE_TAG
    )

    if (!this.isConfigured) {
      console.warn('⚠️  Amazon PA-API not configured. Add credentials to .env')
      return
    }

    try {
      const client = ProductAdvertisingAPIv1.ApiClient.instance
      client.accessKey = process.env.AMAZON_ACCESS_KEY!
      client.secretKey = process.env.AMAZON_SECRET_KEY!
      client.host = 'webservices.amazon.com'
      client.region = process.env.AMAZON_REGION || 'us-east-1'

      this.api = new ProductAdvertisingAPIv1.DefaultApi()
      this.partnerTag = process.env.AMAZON_ASSOCIATE_TAG!

      console.log('✅ Amazon PA-API initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Amazon PA-API:', error)
      this.isConfigured = false
    }
  }

  /**
   * Check if API is properly configured
   */
  isReady(): boolean {
    return this.isConfigured
  }

  /**
   * Search for products by keyword
   */
  async searchProducts(keyword: string, limit: number = 10): Promise<AmazonProduct[]> {
    if (!this.isConfigured) {
      console.warn('Amazon PA-API not configured')
      return []
    }

    try {
      const searchRequest = new ProductAdvertisingAPIv1.SearchItemsRequest()
      searchRequest.PartnerTag = this.partnerTag
      searchRequest.PartnerType = 'Associates'
      searchRequest.Keywords = keyword
      searchRequest.ItemCount = Math.min(limit, 10) // Max 10 per request
      searchRequest.SearchIndex = 'All'
      searchRequest.Resources = [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'ItemInfo.Classifications',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.Availability.Message',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ]

      console.log(`🔍 Amazon PA-API: Searching for "${keyword}"...`)

      const data = await this.api.searchItems(searchRequest)

      if (!data.SearchResult?.Items) {
        console.log(`⚠️  No products found for "${keyword}"`)
        return []
      }

      const products = data.SearchResult.Items.map((item: any) => this.parseProduct(item))
      console.log(`✅ Found ${products.length} products for "${keyword}"`)

      return products
    } catch (error: any) {
      console.error(`❌ Amazon PA-API search error for "${keyword}":`, error.message || error)
      return []
    }
  }

  /**
   * Get product by ASIN
   */
  async getProduct(asin: string): Promise<AmazonProduct | null> {
    if (!this.isConfigured) {
      console.warn('Amazon PA-API not configured')
      return null
    }

    try {
      const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest()
      getItemsRequest.PartnerTag = this.partnerTag
      getItemsRequest.PartnerType = 'Associates'
      getItemsRequest.ItemIds = [asin]
      getItemsRequest.Resources = [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'ItemInfo.Classifications',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.Availability.Message',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ]

      console.log(`🔍 Amazon PA-API: Getting product ${asin}...`)

      const data = await this.api.getItems(getItemsRequest)

      if (!data.ItemsResult?.Items?.[0]) {
        console.log(`⚠️  Product not found: ${asin}`)
        return null
      }

      const product = this.parseProduct(data.ItemsResult.Items[0])
      console.log(`✅ Found product: ${product.title}`)

      return product
    } catch (error: any) {
      console.error(`❌ Amazon PA-API error for ASIN ${asin}:`, error.message || error)
      return null
    }
  }

  /**
   * Get multiple products by ASINs (batch)
   */
  async getProducts(asins: string[]): Promise<AmazonProduct[]> {
    if (!this.isConfigured) {
      console.warn('Amazon PA-API not configured')
      return []
    }

    try {
      // PA-API supports max 10 ASINs per request
      const batches = []
      for (let i = 0; i < asins.length; i += 10) {
        batches.push(asins.slice(i, i + 10))
      }

      const allProducts: AmazonProduct[] = []

      for (const batch of batches) {
        const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest()
        getItemsRequest.PartnerTag = this.partnerTag
        getItemsRequest.PartnerType = 'Associates'
        getItemsRequest.ItemIds = batch
        getItemsRequest.Resources = [
          'Images.Primary.Large',
          'Images.Variants.Large',
          'ItemInfo.Title',
          'ItemInfo.ByLineInfo',
          'ItemInfo.Features',
          'ItemInfo.Classifications',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'Offers.Listings.Availability.Message',
          'Offers.Listings.DeliveryInfo.IsPrimeEligible',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating'
        ]

        const data = await this.api.getItems(getItemsRequest)

        if (data.ItemsResult?.Items) {
          const products = data.ItemsResult.Items.map((item: any) => this.parseProduct(item))
          allProducts.push(...products)
        }

        // Rate limiting: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log(`✅ Found ${allProducts.length} products from ${asins.length} ASINs`)
      return allProducts
    } catch (error: any) {
      console.error(`❌ Amazon PA-API batch error:`, error.message || error)
      return []
    }
  }

  /**
   * Parse Amazon API response into our product format
   */
  private parseProduct(item: any): AmazonProduct {
    const images: string[] = []

    // Primary image
    if (item.Images?.Primary?.Large?.URL) {
      images.push(item.Images.Primary.Large.URL)
    }

    // Variant images (multiple angles/views)
    if (item.Images?.Variants) {
      for (const variant of item.Images.Variants) {
        if (variant.Large?.URL && images.length < 8) {
          images.push(variant.Large.URL)
        }
      }
    }

    // Fallback: If no images, use a placeholder
    if (images.length === 0) {
      images.push(`https://via.placeholder.com/800x800?text=${encodeURIComponent(item.ItemInfo?.Title?.DisplayValue || 'Product')}`)
    }

    // Get pricing
    const listing = item.Offers?.Listings?.[0]
    const price = listing?.Price?.Amount || 0
    const listPrice = listing?.SavingBasis?.Amount || price

    // Get brand
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ||
                  item.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue ||
                  'Unknown'

    // Get category from product group
    const productGroup = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue || ''
    const category = this.mapCategory(productGroup)

    // Get rating
    const starRating = item.CustomerReviews?.StarRating?.Value
    const rating = starRating ? parseFloat(starRating) : 0

    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || '',
      brand: brand,
      price: price,
      listPrice: listPrice,
      images: images,
      affiliateUrl: item.DetailPageURL, // ⭐ This URL includes your affiliate tag!
      rating: rating,
      reviewCount: item.CustomerReviews?.Count || 0,
      availability: listing?.Availability?.Message || 'Unknown',
      isPrime: listing?.DeliveryInfo?.IsPrimeEligible || false,
      features: item.ItemInfo?.Features?.DisplayValues || [],
      category: category
    }
  }

  /**
   * Map Amazon product group to ThriftAI category
   */
  private mapCategory(productGroup: string): string {
    const group = productGroup.toLowerCase()

    if (group.includes('electronic') || group.includes('computer') || group.includes('phone')) {
      return 'ELECTRONICS'
    }
    if (group.includes('apparel') || group.includes('cloth') || group.includes('shirt') || group.includes('pant')) {
      return 'CLOTHING'
    }
    if (group.includes('shoe') || group.includes('sneaker') || group.includes('boot')) {
      return 'SHOES'
    }
    if (group.includes('watch') || group.includes('jewelry') || group.includes('bag') || group.includes('sunglass')) {
      return 'ACCESSORIES'
    }
    if (group.includes('home') || group.includes('kitchen') || group.includes('furniture')) {
      return 'HOME'
    }
    if (group.includes('beauty') || group.includes('cosmetic') || group.includes('health')) {
      return 'BEAUTY'
    }
    if (group.includes('sport') || group.includes('fitness') || group.includes('outdoor')) {
      return 'SPORTS'
    }
    if (group.includes('toy') || group.includes('game')) {
      return 'TOYS'
    }

    // Default to ELECTRONICS
    return 'ELECTRONICS'
  }
}

// Singleton instance
let amazonApiInstance: AmazonPAAPI | null = null

/**
 * Get singleton instance of Amazon PA-API client
 */
export function getAmazonApi(): AmazonPAAPI {
  if (!amazonApiInstance) {
    amazonApiInstance = new AmazonPAAPI()
  }
  return amazonApiInstance
}
