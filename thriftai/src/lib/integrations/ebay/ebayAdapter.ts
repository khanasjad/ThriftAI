import axios from 'axios'

interface EbayConfig {
  appId: string
  certId: string
  devId: string
  campaignId: string
}

interface EbaySearchParams {
  keywords: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  condition?: 'New' | 'Used'
  limit?: number
}

export interface EbayProduct {
  itemId: string
  title: string
  price: number
  shippingCost: number
  condition: string
  imageUrl?: string
  productUrl: string
  affiliateUrl: string
  sellerRating: number
  location: string
  endTime: string
}

export class EbayAdapter {
  private config: EbayConfig
  private endpoint: string

  constructor() {
    this.config = {
      appId: process.env.EBAY_APP_ID || process.env.EBAY_API_KEY || '',
      certId: process.env.EBAY_CERT_ID || '',
      devId: process.env.EBAY_DEV_ID || '',
      campaignId: process.env.EBAY_CAMPAIGN_ID || '5338892896'
    }
    this.endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1'
  }

  async searchProducts(params: EbaySearchParams): Promise<EbayProduct[]> {
    // Check if real API keys are configured
    if (!this.config.appId || this.config.appId.includes('demo')) {
      console.log('eBay API: Using mock data (no real API keys configured)')
      return this.getMockProducts(params)
    }

    try {
      const url = this.buildSearchUrl(params)
      const response = await axios.get(url, {
        headers: {
          'X-EBAY-SOA-SECURITY-APPNAME': this.config.appId
        },
        timeout: 5000
      })

      return this.parseSearchResponse(response.data)
    } catch (error) {
      console.error('eBay API error:', error)
      // Fallback to mock data on error
      return this.getMockProducts(params)
    }
  }

  private buildSearchUrl(params: EbaySearchParams): string {
    const baseUrl = `${this.endpoint}?OPERATION-NAME=findItemsAdvanced`
    const queryParams = [
      `SECURITY-APPNAME=${this.config.appId}`,
      `RESPONSE-DATA-FORMAT=JSON`,
      `REST-PAYLOAD`,
      `keywords=${encodeURIComponent(params.keywords)}`,
      `paginationInput.entriesPerPage=${params.limit || 25}`,
      `sortOrder=PricePlusShippingLowest`
    ]

    if (params.categoryId) {
      queryParams.push(`categoryId=${params.categoryId}`)
    }

    if (params.minPrice) {
      queryParams.push(`itemFilter(0).name=MinPrice`)
      queryParams.push(`itemFilter(0).value=${params.minPrice}`)
    }

    if (params.maxPrice) {
      queryParams.push(`itemFilter(1).name=MaxPrice`)
      queryParams.push(`itemFilter(1).value=${params.maxPrice}`)
    }

    if (params.condition) {
      queryParams.push(`itemFilter(2).name=Condition`)
      queryParams.push(`itemFilter(2).value=${params.condition}`)
    }

    // Only show "Buy It Now" items
    queryParams.push(`itemFilter(3).name=ListingType`)
    queryParams.push(`itemFilter(3).value=FixedPrice`)

    return `${baseUrl}&${queryParams.join('&')}`
  }

  private parseSearchResponse(data: any): EbayProduct[] {
    const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item
    if (!items) return []

    return items.map((item: any) => ({
      itemId: item.itemId?.[0],
      title: item.title?.[0] || 'Unknown',
      price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
      shippingCost: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0'),
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
      imageUrl: item.galleryURL?.[0],
      productUrl: item.viewItemURL?.[0],
      affiliateUrl: this.buildAffiliateUrl(item.itemId?.[0]),
      sellerRating: parseFloat(item.sellerInfo?.[0]?.feedbackScore?.[0] || '0'),
      location: item.location?.[0] || 'Unknown',
      endTime: item.listingInfo?.[0]?.endTime?.[0]
    }))
  }

  private buildAffiliateUrl(itemId: string): string {
    // eBay Partner Network affiliate link
    return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_id=114&ipn=icep&toolid=20004&campid=${this.config.campaignId}&mpre=https://www.ebay.com/itm/${itemId}`
  }

  private mapCategoryToEbayId(category?: string): string | undefined {
    const mapping: Record<string, string> = {
      'CLOTHING': '11450',    // Clothing, Shoes & Accessories > Men's Clothing
      'SHOES': '93427',       // Men's Shoes
      'ELECTRONICS': '293',   // Consumer Electronics
      'ACCESSORIES': '4251',  // Jewelry & Watches
      'HOME': '11700'         // Home & Garden
    }
    return category ? mapping[category] : undefined
  }

  private getMockProducts(params: EbaySearchParams): EbayProduct[] {
    // Mock data for testing without real API
    const mockProducts: EbayProduct[] = [
      {
        itemId: '123456789',
        title: `${params.keywords} - eBay Deal`,
        price: 24.99,
        shippingCost: 5.99,
        condition: 'Used - Good',
        imageUrl: 'https://via.placeholder.com/500x500?text=eBay+Product',
        productUrl: 'https://www.ebay.com/itm/123456789',
        affiliateUrl: `https://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_id=114&ipn=icep&toolid=20004&campid=${this.config.campaignId}&mpre=https://www.ebay.com/itm/123456789`,
        sellerRating: 98.5,
        location: 'United States',
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        itemId: '987654321',
        title: `Vintage ${params.keywords} - Great Condition`,
        price: 19.99,
        shippingCost: 3.99,
        condition: 'Used - Very Good',
        imageUrl: 'https://via.placeholder.com/500x500?text=Vintage+Product',
        productUrl: 'https://www.ebay.com/itm/987654321',
        affiliateUrl: `https://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_id=114&ipn=icep&toolid=20004&campid=${this.config.campaignId}&mpre=https://www.ebay.com/itm/987654321`,
        sellerRating: 99.2,
        location: 'California, USA',
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    return mockProducts.slice(0, params.limit || 10)
  }
}