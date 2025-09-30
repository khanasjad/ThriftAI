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
      return this.getMockProducts(params)
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
      return this.getMockProducts(params)
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

  private getMockProducts(params: AmazonSearchParams): AmazonProduct[] {
    // Mock data for testing without real API
    const keywords = params.keywords.toLowerCase()

    const mockProducts: AmazonProduct[] = [
      {
        asin: 'B08N5WRWNW',
        title: `Amazon Choice - ${params.keywords}`,
        brand: 'Amazon Essentials',
        price: 29.99,
        originalPrice: 39.99,
        imageUrl: 'https://via.placeholder.com/500x500?text=Amazon+Product',
        productUrl: 'https://www.amazon.com/dp/B08N5WRWNW',
        affiliateUrl: `https://www.amazon.com/dp/B08N5WRWNW?tag=${this.config.partnerTag}`,
        rating: 4.5,
        reviewCount: 1250,
        availability: true
      },
      {
        asin: 'B07ZPKN6YR',
        title: `Premium ${params.keywords} - Best Seller`,
        brand: 'Top Brand',
        price: 49.99,
        originalPrice: 79.99,
        imageUrl: 'https://via.placeholder.com/500x500?text=Premium+Product',
        productUrl: 'https://www.amazon.com/dp/B07ZPKN6YR',
        affiliateUrl: `https://www.amazon.com/dp/B07ZPKN6YR?tag=${this.config.partnerTag}`,
        rating: 4.7,
        reviewCount: 2340,
        availability: true
      }
    ]

    return mockProducts.slice(0, params.limit || 10)
  }
}