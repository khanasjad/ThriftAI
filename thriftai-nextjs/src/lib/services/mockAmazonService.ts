// ThriftAI - Mock Amazon API Service
// Converts PostgreSQL products to Amazon-like format with enhanced data

import { PrismaClient } from '@prisma/client'
import type {
  MockAmazonProduct,
  SearchFilters,
  QueryOptimization
} from '../types/scoring'

const prisma = new PrismaClient()

export class MockAmazonService {
  private readonly BRAND_MAPPINGS = {
    // Map common brands to their reputation levels
    'nike': { reputation: 95, premium: true, warranty: '1 year' },
    'adidas': { reputation: 92, premium: true, warranty: '1 year' },
    'levi\'s': { reputation: 88, premium: false, warranty: '6 months' },
    'gap': { reputation: 75, premium: false, warranty: '3 months' },
    'h&m': { reputation: 65, premium: false, warranty: '30 days' },
    'zara': { reputation: 78, premium: false, warranty: '30 days' },
    'uniqlo': { reputation: 82, premium: false, warranty: '6 months' },
    'apple': { reputation: 98, premium: true, warranty: '1 year' },
    'samsung': { reputation: 90, premium: true, warranty: '1 year' },
    'sony': { reputation: 89, premium: true, warranty: '1 year' },
    'default': { reputation: 70, premium: false, warranty: '30 days' }
  }

  private readonly CATEGORY_MAPPINGS = {
    'CLOTHING': {
      amazonCategory: 'Fashion',
      subcategories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear'],
      avgShippingDays: 3,
      returnWindow: 30
    },
    'SHOES': {
      amazonCategory: 'Shoes & Handbags',
      subcategories: ['Athletic', 'Casual', 'Dress', 'Boots', 'Sandals'],
      avgShippingDays: 2,
      returnWindow: 30
    },
    'ACCESSORIES': {
      amazonCategory: 'Accessories',
      subcategories: ['Jewelry', 'Watches', 'Bags', 'Belts', 'Sunglasses'],
      avgShippingDays: 2,
      returnWindow: 15
    },
    'ELECTRONICS': {
      amazonCategory: 'Electronics',
      subcategories: ['Phones', 'Laptops', 'Audio', 'Gaming', 'Smart Home'],
      avgShippingDays: 1,
      returnWindow: 15
    }
  }

  async searchProducts(
    optimizedQuery: string,
    filters?: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<MockAmazonProduct[]> {
    try {
      // Build the where clause for Prisma
      const where: any = {}

      // Text search across multiple fields
      if (optimizedQuery) {
        const searchTerms = optimizedQuery.toLowerCase().split(' ')
        where.OR = [
          {
            name: {
              contains: optimizedQuery,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: optimizedQuery,
              mode: 'insensitive'
            }
          },
          {
            brand: {
              contains: optimizedQuery,
              mode: 'insensitive'
            }
          }
        ]

        // Add individual term searches for better matching
        searchTerms.forEach(term => {
          if (term.length > 2) {
            where.OR.push(
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { brand: { contains: term, mode: 'insensitive' } }
            )
          }
        })
      }

      // Apply filters
      if (filters?.categories?.length) {
        where.category = { in: filters.categories }
      }

      if (filters?.brands?.length) {
        where.brand = { in: filters.brands }
      }

      if (filters?.priceRange) {
        where.price = {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max
        }
      }

      if (filters?.condition?.length) {
        where.condition = { in: filters.condition }
      }

      if (filters?.inStock !== undefined) {
        // For our mock, we'll assume all products are in stock
        // In a real system, this would filter by inventory levels
      }

      // Fetch products from database
      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            include: {
              user: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      })

      // Convert each product to MockAmazonProduct format
      const amazonProducts = products.map(product =>
        this.convertToAmazonFormat(product)
      )

      return amazonProducts

    } catch (error) {
      console.error('Error searching products:', error)
      throw new Error('Failed to search products in mock Amazon API')
    }
  }

  private convertToAmazonFormat(product: any): MockAmazonProduct {
    // Generate realistic ASIN (Amazon Standard Identification Number)
    const asin = this.generateASIN(product.id)

    // Get brand information
    const brandKey = product.brand?.toLowerCase() || 'default'
    const brandInfo = this.BRAND_MAPPINGS[brandKey] || this.BRAND_MAPPINGS.default

    // Get category information
    const categoryInfo = this.CATEGORY_MAPPINGS[product.category] || this.CATEGORY_MAPPINGS.CLOTHING

    // Calculate pricing with realistic variations
    const pricing = this.calculatePricing(product.price, brandInfo.premium)

    // Generate reviews and ratings
    const reviews = this.generateReviews(brandInfo.reputation)

    // Calculate availability and shipping
    const availability = this.calculateAvailability(categoryInfo)

    // Generate sustainability data
    const sustainability = this.generateSustainabilityData(product)

    // Create seller information
    const seller = this.createSellerInfo(product.seller)

    return {
      asin,
      title: product.name,
      brand: product.brand || 'Unbranded',
      category: categoryInfo.amazonCategory,
      price: pricing,
      availability,
      specifications: {
        category: categoryInfo.amazonCategory,
        subcategory: this.getRandomSubcategory(categoryInfo.subcategories),
        size: product.size || undefined,
        color: product.color || this.getRandomColor(),
        material: this.inferMaterial(product.category, product.description),
        weight: this.estimateWeight(product.category),
        dimensions: this.estimateDimensions(product.category),
        model: this.generateModelNumber(product.brand),
        year: this.estimateYear(product.createdAt)
      },
      reviews,
      images: this.generateImageUrls(product.imageUrl, asin),
      description: this.enhanceDescription(product.description),
      features: this.extractFeatures(product.description),
      seller,
      sustainability,
      authenticity: {
        verified: brandInfo.reputation > 85,
        authenticityGuarantee: brandInfo.premium,
        returnPolicy: `${categoryInfo.returnWindow} day returns`,
        warranty: brandInfo.warranty
      },
      metadata: {
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        lastPriceUpdate: new Date(),
        popularityRank: this.calculatePopularityRank(reviews.rating, reviews.count),
        salesRank: this.calculateSalesRank(product.category, reviews.count)
      }
    }
  }

  private generateASIN(productId: number): string {
    // Generate a realistic looking ASIN
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let asin = 'B0'

    // Use product ID to ensure consistency
    const seed = productId.toString().padStart(8, '0')
    for (let i = 0; i < 8; i++) {
      const index = (parseInt(seed[i]) + i) % chars.length
      asin += chars[index]
    }

    return asin
  }

  private calculatePricing(basePrice: number, isPremium: boolean) {
    // Add realistic pricing variations
    const discountRange = isPremium ? 0.1 : 0.3 // Premium brands have smaller discounts
    const discount = Math.random() * discountRange
    const current = basePrice * (1 - discount)

    return {
      current: Math.round(current * 100) / 100,
      original: basePrice,
      currency: 'USD' as const,
      discountPercentage: Math.round(discount * 100)
    }
  }

  private generateReviews(brandReputation: number) {
    // Generate realistic review data based on brand reputation
    const baseRating = (brandReputation / 100) * 5
    const variation = 0.5
    const rating = Math.max(1, Math.min(5, baseRating + (Math.random() - 0.5) * variation))

    // Review count tends to be higher for better brands
    const baseCount = Math.floor((brandReputation / 100) * 1000)
    const count = baseCount + Math.floor(Math.random() * 500)

    return {
      rating: Math.round(rating * 10) / 10,
      count,
      verified: brandReputation > 80,
      recentRating: Math.round((rating + (Math.random() - 0.5) * 0.3) * 10) / 10,
      ratingDistribution: this.generateRatingDistribution(rating, count)
    }
  }

  private generateRatingDistribution(avgRating: number, totalCount: number): { [key: number]: number } {
    // Realistic rating distribution based on average
    const distribution: { [key: number]: number } = {}

    for (let stars = 1; stars <= 5; stars++) {
      const distance = Math.abs(stars - avgRating)
      const probability = Math.max(0.05, 1 - (distance * 0.3))
      distribution[stars] = Math.floor(totalCount * probability)
    }

    return distribution
  }

  private calculateAvailability(categoryInfo: any) {
    const inStock = Math.random() > 0.1 // 90% chance of being in stock
    const quantity = inStock ? Math.floor(Math.random() * 50) + 1 : 0

    return {
      inStock,
      quantity,
      shippingDays: categoryInfo.avgShippingDays + Math.floor(Math.random() * 3),
      shippingCost: Math.random() > 0.6 ? 0 : Math.round((Math.random() * 10 + 5) * 100) / 100,
      expeditedShipping: Math.random() > 0.3
    }
  }

  private generateSustainabilityData(product: any) {
    // Generate realistic sustainability data
    const ecoFriendly = Math.random() > 0.7
    const recyclable = Math.random() > 0.5
    const sustainableMaterials = Math.random() > 0.6

    const certifications = []
    if (ecoFriendly) certifications.push('Eco-Friendly')
    if (sustainableMaterials) certifications.push('Sustainable Materials')
    if (Math.random() > 0.8) certifications.push('Fair Trade')
    if (Math.random() > 0.9) certifications.push('Organic')

    return {
      ecoFriendly,
      recyclable,
      sustainableMaterials,
      certifications,
      carbonFootprint: ecoFriendly ? Math.round(Math.random() * 5 + 1) : Math.round(Math.random() * 15 + 5),
      ethicalProduction: Math.random() > 0.6
    }
  }

  private createSellerInfo(seller: any) {
    const sellerRating = 3.5 + Math.random() * 1.5 // 3.5 to 5.0
    const totalSales = Math.floor(Math.random() * 10000) + 100

    return {
      name: seller?.user?.name || 'ThriftAI Seller',
      rating: Math.round(sellerRating * 10) / 10,
      totalSales,
      fulfillment: Math.random() > 0.3 ? 'Amazon' as const : 'Merchant' as const,
      location: this.getRandomLocation(),
      verified: seller?.verificationStatus === 'VERIFIED' || Math.random() > 0.2
    }
  }

  private getRandomSubcategory(subcategories: string[]): string {
    return subcategories[Math.floor(Math.random() * subcategories.length)]
  }

  private getRandomColor(): string {
    const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Brown', 'Navy', 'Beige', 'Multi']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private inferMaterial(category: string, description: string): string {
    const materialMap: { [key: string]: string[] } = {
      'CLOTHING': ['Cotton', 'Polyester', 'Wool', 'Linen', 'Silk', 'Denim', 'Cashmere'],
      'SHOES': ['Leather', 'Synthetic', 'Canvas', 'Rubber', 'Suede', 'Mesh'],
      'ACCESSORIES': ['Metal', 'Leather', 'Plastic', 'Fabric', 'Gold', 'Silver'],
      'ELECTRONICS': ['Plastic', 'Metal', 'Glass', 'Silicon', 'Aluminum']
    }

    const materials = materialMap[category] || ['Mixed Materials']

    // Try to infer from description
    for (const material of materials) {
      if (description?.toLowerCase().includes(material.toLowerCase())) {
        return material
      }
    }

    return materials[Math.floor(Math.random() * materials.length)]
  }

  private estimateWeight(category: string): string {
    const weightRanges: { [key: string]: [number, number] } = {
      'CLOTHING': [0.1, 2.0],
      'SHOES': [0.5, 3.0],
      'ACCESSORIES': [0.05, 1.0],
      'ELECTRONICS': [0.1, 5.0]
    }

    const [min, max] = weightRanges[category] || [0.1, 1.0]
    const weight = min + Math.random() * (max - min)
    return `${Math.round(weight * 100) / 100} lbs`
  }

  private estimateDimensions(category: string): string {
    // Generate realistic dimensions based on category
    switch (category) {
      case 'CLOTHING':
        return `${12 + Math.floor(Math.random() * 8)}" x ${8 + Math.floor(Math.random() * 4)}" x ${1 + Math.floor(Math.random() * 2)}"`
      case 'SHOES':
        return `${10 + Math.floor(Math.random() * 4)}" x ${4 + Math.floor(Math.random() * 2)}" x ${3 + Math.floor(Math.random() * 2)}"`
      case 'ACCESSORIES':
        return `${3 + Math.floor(Math.random() * 8)}" x ${2 + Math.floor(Math.random() * 6)}" x ${1 + Math.floor(Math.random() * 3)}"`
      case 'ELECTRONICS':
        return `${5 + Math.floor(Math.random() * 10)}" x ${3 + Math.floor(Math.random() * 8)}" x ${1 + Math.floor(Math.random() * 4)}"`
      default:
        return `${Math.floor(Math.random() * 10) + 1}" x ${Math.floor(Math.random() * 8) + 1}" x ${Math.floor(Math.random() * 4) + 1}"`
    }
  }

  private generateModelNumber(brand?: string): string {
    if (!brand) return undefined

    const prefix = brand.substring(0, 2).toUpperCase()
    const numbers = Math.floor(Math.random() * 9000) + 1000
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26))

    return `${prefix}-${numbers}${suffix}`
  }

  private estimateYear(createdAt: Date): number {
    // Estimate product year based on when it was added (accounting for it being second-hand)
    const currentYear = new Date().getFullYear()
    const productAge = Math.floor(Math.random() * 5) + 1 // 1-5 years old
    return currentYear - productAge
  }

  private generateImageUrls(primaryImage?: string, asin?: string): string[] {
    const images = []

    if (primaryImage) {
      images.push(primaryImage)
    }

    // Generate additional mock image URLs
    for (let i = 1; i < 4; i++) {
      images.push(`https://images-na.ssl-images-amazon.com/images/I/${asin}_${i}.jpg`)
    }

    return images
  }

  private enhanceDescription(originalDescription?: string): string {
    if (!originalDescription) {
      return 'High-quality pre-owned item in excellent condition. Carefully inspected and authenticated.'
    }

    // Enhance the description with Amazon-like details
    const enhancements = [
      'Verified authentic and in excellent condition.',
      'Professionally cleaned and inspected.',
      'Ships fast with tracking.',
      'Sustainable choice - reducing environmental impact.'
    ]

    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)]
    return `${originalDescription} ${randomEnhancement}`
  }

  private extractFeatures(description?: string): string[] {
    if (!description) return []

    const features = []
    const keywords = ['waterproof', 'breathable', 'comfortable', 'durable', 'lightweight', 'vintage', 'designer', 'premium']

    keywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        features.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
      }
    })

    // Add some generic features
    if (Math.random() > 0.5) features.push('High Quality Materials')
    if (Math.random() > 0.7) features.push('Expert Craftsmanship')
    if (Math.random() > 0.6) features.push('Timeless Design')

    return features
  }

  private getRandomLocation(): string {
    const locations = [
      'California, US',
      'New York, US',
      'Texas, US',
      'Florida, US',
      'Washington, US',
      'Illinois, US',
      'Massachusetts, US',
      'Oregon, US'
    ]
    return locations[Math.floor(Math.random() * locations.length)]
  }

  private calculatePopularityRank(rating: number, reviewCount: number): number {
    // Simple algorithm to calculate popularity rank
    const popularityScore = (rating * 0.7) + (Math.log(reviewCount + 1) * 0.3)
    return Math.floor((5 - popularityScore) * 200000) + Math.floor(Math.random() * 50000)
  }

  private calculateSalesRank(category: string, reviewCount: number): number {
    // Category-specific sales rank calculation
    const categoryMultipliers: { [key: string]: number } = {
      'CLOTHING': 1000000,
      'SHOES': 500000,
      'ACCESSORIES': 300000,
      'ELECTRONICS': 800000
    }

    const multiplier = categoryMultipliers[category] || 500000
    const baseRank = Math.floor(multiplier * Math.random())
    const reviewBonus = Math.floor(reviewCount * 100)

    return Math.max(1, baseRank - reviewBonus)
  }

  // Additional utility methods for advanced features

  async getProductsByCategory(category: string, limit: number = 10): Promise<MockAmazonProduct[]> {
    return this.searchProducts('', { categories: [category] }, limit)
  }

  async getTrendingProducts(limit: number = 10): Promise<MockAmazonProduct[]> {
    // For trending, we'll get recently added products with good ratings
    const products = await prisma.product.findMany({
      include: {
        seller: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit * 2 // Get more to filter
    })

    const amazonProducts = products
      .map(product => this.convertToAmazonFormat(product))
      .filter(product => product.reviews.rating >= 4.0)
      .slice(0, limit)

    return amazonProducts
  }

  async getProductRecommendations(asin: string, limit: number = 5): Promise<MockAmazonProduct[]> {
    // Find the original product to get category and brand
    const products = await prisma.product.findMany({
      include: {
        seller: {
          include: {
            user: true
          }
        }
      },
      take: 50 // Get a larger pool to filter from
    })

    const allAmazonProducts = products.map(product => this.convertToAmazonFormat(product))
    const targetProduct = allAmazonProducts.find(p => p.asin === asin)

    if (!targetProduct) {
      return this.getTrendingProducts(limit)
    }

    // Find similar products (same category, similar price range)
    const similar = allAmazonProducts
      .filter(product =>
        product.asin !== asin &&
        product.category === targetProduct.category &&
        Math.abs(product.price.current - targetProduct.price.current) <= targetProduct.price.current * 0.5
      )
      .sort(() => Math.random() - 0.5) // Randomize
      .slice(0, limit)

    return similar
  }

  // Health check method
  async isServiceHealthy(): Promise<boolean> {
    try {
      await prisma.product.count()
      return true
    } catch (error) {
      console.error('Mock Amazon Service health check failed:', error)
      return false
    }
  }

  // Performance metrics
  async getServiceMetrics() {
    try {
      const totalProducts = await prisma.product.count()
      const productsByCategory = await prisma.product.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      })

      return {
        totalProducts,
        productsByCategory: productsByCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category
          return acc
        }, {} as Record<string, number>),
        lastUpdated: new Date(),
        serviceVersion: '1.0.0'
      }
    } catch (error) {
      console.error('Error getting service metrics:', error)
      throw error
    }
  }
}

// Export singleton instance
export const mockAmazonService = new MockAmazonService()
export default MockAmazonService