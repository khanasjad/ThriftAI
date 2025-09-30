import axios from 'axios'

export interface BrandProduct {
  id: string
  brand: 'Nike' | 'Adidas'
  title: string
  price: number
  imageUrl: string
  productUrl: string
  affiliateUrl: string
  sizes: string[]
  colors: string[]
  category: string
}

export class BrandAdapter {
  // Use affiliate network API (Commission Junction example)
  private cjApiKey: string
  private cjWebsiteId: string

  constructor() {
    this.cjApiKey = process.env.CJ_API_KEY || ''
    this.cjWebsiteId = process.env.CJ_WEBSITE_ID || ''
  }

  async searchNikeProducts(keywords: string): Promise<BrandProduct[]> {
    // Check if real API keys are configured
    if (!this.cjApiKey || this.cjApiKey.includes('demo')) {
      console.log('Nike/CJ API: Using mock data (no real API keys configured)')
      return this.getMockNikeProducts(keywords)
    }

    try {
      // Commission Junction Product Search API
      const response = await axios.get('https://product-search.api.cj.com/v2/product-search', {
        headers: {
          'Authorization': `Bearer ${this.cjApiKey}`
        },
        params: {
          'website-id': this.cjWebsiteId,
          'advertiser-ids': 'nike',  // Nike's CJ advertiser ID
          'keywords': keywords,
          'records-per-page': 20
        },
        timeout: 5000
      })

      return this.parseProducts(response.data, 'Nike')
    } catch (error) {
      console.error('Nike API error:', error)
      return this.getMockNikeProducts(keywords)
    }
  }

  async searchAdidasProducts(keywords: string): Promise<BrandProduct[]> {
    // Check if real API keys are configured
    if (!this.cjApiKey || this.cjApiKey.includes('demo')) {
      console.log('Adidas/CJ API: Using mock data (no real API keys configured)')
      return this.getMockAdidasProducts(keywords)
    }

    try {
      const response = await axios.get('https://product-search.api.cj.com/v2/product-search', {
        headers: {
          'Authorization': `Bearer ${this.cjApiKey}`
        },
        params: {
          'website-id': this.cjWebsiteId,
          'advertiser-ids': 'adidas',
          'keywords': keywords,
          'records-per-page': 20
        },
        timeout: 5000
      })

      return this.parseProducts(response.data, 'Adidas')
    } catch (error) {
      console.error('Adidas API error:', error)
      return this.getMockAdidasProducts(keywords)
    }
  }

  private parseProducts(data: any, brand: 'Nike' | 'Adidas'): BrandProduct[] {
    // Parse Commission Junction response
    // Actual implementation depends on CJ API structure
    if (!data.products || !Array.isArray(data.products)) {
      return []
    }

    return data.products.map((product: any) => ({
      id: product.id || product.sku,
      brand,
      title: product.name || product.title,
      price: parseFloat(product.price || '0'),
      imageUrl: product.imageUrl || product.image,
      productUrl: product.url,
      affiliateUrl: product.affiliateUrl || product.url,
      sizes: product.sizes || [],
      colors: product.colors || [],
      category: product.category || 'Apparel'
    }))
  }

  private getMockNikeProducts(keywords: string): BrandProduct[] {
    return [
      {
        id: 'NIKE-001',
        brand: 'Nike',
        title: `Nike ${keywords} - Air Max`,
        price: 120.00,
        imageUrl: 'https://via.placeholder.com/500x500?text=Nike+Air+Max',
        productUrl: 'https://www.nike.com/t/air-max',
        affiliateUrl: 'https://www.nike.com/t/air-max?ref=thriftai',
        sizes: ['8', '9', '10', '11', '12'],
        colors: ['Black', 'White', 'Red'],
        category: 'Shoes'
      },
      {
        id: 'NIKE-002',
        brand: 'Nike',
        title: `Nike ${keywords} - Sportswear`,
        price: 55.00,
        imageUrl: 'https://via.placeholder.com/500x500?text=Nike+Sportswear',
        productUrl: 'https://www.nike.com/t/sportswear',
        affiliateUrl: 'https://www.nike.com/t/sportswear?ref=thriftai',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'Gray', 'Navy'],
        category: 'Apparel'
      }
    ]
  }

  private getMockAdidasProducts(keywords: string): BrandProduct[] {
    return [
      {
        id: 'ADIDAS-001',
        brand: 'Adidas',
        title: `Adidas ${keywords} - Ultraboost`,
        price: 180.00,
        imageUrl: 'https://via.placeholder.com/500x500?text=Adidas+Ultraboost',
        productUrl: 'https://www.adidas.com/us/ultraboost',
        affiliateUrl: 'https://www.adidas.com/us/ultraboost?ref=thriftai',
        sizes: ['8', '9', '10', '11', '12'],
        colors: ['Black', 'White', 'Blue'],
        category: 'Shoes'
      },
      {
        id: 'ADIDAS-002',
        brand: 'Adidas',
        title: `Adidas ${keywords} - Originals`,
        price: 70.00,
        imageUrl: 'https://via.placeholder.com/500x500?text=Adidas+Originals',
        productUrl: 'https://www.adidas.com/us/originals',
        affiliateUrl: 'https://www.adidas.com/us/originals?ref=thriftai',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Green'],
        category: 'Apparel'
      }
    ]
  }
}