import crypto from 'crypto'
import axios from 'axios'

interface AmazonConfig {
  accessKey: string
  secretKey: string
  partnerTag: string
  region: string
}

interface AmazonSearchParams {
  keywords: string
  category?: string
  minPrice?: number
  maxPrice?: number
  limit?: number
}

export interface AmazonProduct {
  asin: string
  title: string
  brand?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  productUrl: string
  affiliateUrl: string
  rating?: number
  reviewCount?: number
  availability: boolean
}

export class AmazonAdapter {
  private config: AmazonConfig
  private endpoint: string

  constructor() {
    this.config = {
      accessKey: process.env.AMAZON_ACCESS_KEY || process.env.AMAZON_API_KEY || '',
      secretKey: process.env.AMAZON_SECRET_KEY || process.env.AMAZON_API_SECRET || '',
      partnerTag: process.env.AMAZON_PARTNER_TAG || process.env.AMAZON_ASSOCIATE_TAG || '',
      region: 'us-east-1'
    }
    this.endpoint = 'https://webservices.amazon.com/paapi5/searchitems'
  }

  async searchProducts(params: AmazonSearchParams): Promise<AmazonProduct[]> {
    // Check if real API keys are configured
    if (!this.config.accessKey || !this.config.secretKey || this.config.accessKey.includes('demo')) {
      console.log('Amazon API: Using mock data (no real API keys configured)')
      return await this.getMockProducts(params)
    }

    try {
      const request = this.buildSearchRequest(params)
      const response = await axios.post(this.endpoint, request, {
        headers: this.getSignedHeaders(request),
        timeout: 5000
      })

      return this.parseSearchResponse(response.data)
    } catch (error) {
      console.error('Amazon API error:', error)
      // Fallback to mock data on error
      return await this.getMockProducts(params)
    }
  }

  private buildSearchRequest(params: AmazonSearchParams) {
    return {
      PartnerTag: this.config.partnerTag,
      PartnerType: 'Associates',
      Keywords: params.keywords,
      SearchIndex: this.mapCategoryToSearchIndex(params.category),
      ItemCount: params.limit || 10,
      MinPrice: params.minPrice ? params.minPrice * 100 : undefined, // cents
      MaxPrice: params.maxPrice ? params.maxPrice * 100 : undefined,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price',
        'Offers.Listings.Condition',
        'Offers.Listings.Availability',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count'
      ]
    }
  }

  private getSignedHeaders(payload: any): Record<string, string> {
    const timestamp = new Date().toISOString()
    const canonicalRequest = JSON.stringify(payload)

    // AWS Signature Version 4
    const signature = this.generateSignature(canonicalRequest, timestamp)

    return {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Amz-Date': timestamp,
      'Authorization': signature,
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'Content-Encoding': 'amz-1.0'
    }
  }

  private generateSignature(payload: string, timestamp: string): string {
    // Implement AWS Signature V4
    // See: https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html

    const kDate = crypto
      .createHmac('sha256', `AWS4${this.config.secretKey}`)
      .update(timestamp.split('T')[0])
      .digest()

    const kRegion = crypto
      .createHmac('sha256', kDate)
      .update(this.config.region)
      .digest()

    const kService = crypto
      .createHmac('sha256', kRegion)
      .update('ProductAdvertisingAPI')
      .digest()

    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest()

    const signature = crypto
      .createHmac('sha256', kSigning)
      .update(payload)
      .digest('hex')

    return `AWS4-HMAC-SHA256 Credential=${this.config.accessKey}/${timestamp.split('T')[0]}/${this.config.region}/ProductAdvertisingAPI/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${signature}`
  }

  private parseSearchResponse(data: any): AmazonProduct[] {
    if (!data.SearchResult?.Items) return []

    return data.SearchResult.Items.map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
      originalPrice: item.Offers?.Listings?.[0]?.SavingBasis?.Amount,
      imageUrl: item.Images?.Primary?.Large?.URL,
      productUrl: item.DetailPageURL,
      affiliateUrl: this.buildAffiliateUrl(item.ASIN),
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count || 0,
      availability: item.Offers?.Listings?.[0]?.Availability?.Type === 'Now'
    }))
  }

  private buildAffiliateUrl(asin: string): string {
    return `https://www.amazon.com/dp/${asin}?tag=${this.config.partnerTag}`
  }

  private mapCategoryToSearchIndex(category?: string): string {
    const mapping: Record<string, string> = {
      'CLOTHING': 'Fashion',
      'SHOES': 'Shoes',
      'ELECTRONICS': 'Electronics',
      'ACCESSORIES': 'Jewelry',
      'HOME': 'HomeAndKitchen',
      'BOOKS': 'Books'
    }
    return category ? mapping[category] || 'All' : 'All'
  }

  private async getMockProducts(params: AmazonSearchParams): Promise<AmazonProduct[]> {
    // Use MockAmazonService for realistic product search with proper filtering
    try {
      const { mockAmazonService } = await import('@/lib/services/mockAmazonService')

      // Build filters for MockAmazonService
      const filters: any = {}

      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        filters.priceRange = {
          min: params.minPrice || 0,
          max: params.maxPrice || 999999
        }
      }

      if (params.category) {
        // Map Amazon category to our categories
        const categoryMap: Record<string, string> = {
          'Electronics': 'ELECTRONICS',
          'Fashion': 'CLOTHING',
          'Shoes': 'SHOES',
          'Jewelry': 'ACCESSORIES',
          'HomeAndKitchen': 'HOME'
        }
        const mappedCategory = categoryMap[params.category] || params.category
        filters.categories = [mappedCategory]
      }

      // Search with proper filtering
      const results = await mockAmazonService.searchProducts(
        params.keywords,
        filters,
        params.limit || 20,
        0
      )

      // Convert to AmazonProduct format
      return results.map(product => ({
        asin: product.asin,
        title: product.title,
        brand: product.brand,
        price: product.price.current,
        originalPrice: product.price.original,
        imageUrl: product.images[0],
        productUrl: `https://www.amazon.com/dp/${product.asin}`,
        affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${this.config.partnerTag}`,
        rating: product.reviews.rating,
        reviewCount: product.reviews.count,
        availability: product.availability.inStock
      }))
    } catch (error) {
      console.error('Mock Amazon Service error:', error)
      // Fallback to empty array instead of returning hardcoded products
      return []
    }
  }
}