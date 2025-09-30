/**
 * Product Configuration
 * Centralized configuration for all product-related constants
 * Can be extended to fetch from database for fully dynamic configuration
 */

import { prisma } from '@/lib/prisma'

// Product Categories Configuration
export interface CategoryConfig {
  name: string
  keywords: string[]
  subcategories?: string[]
}

// Product Condition Configuration
export interface ConditionConfig {
  value: string
  label: string
  description?: string
  qualityScore: number // 0-100
}

// Brand Configuration
export interface BrandConfig {
  name: string
  categories: string[]
  isPremium: boolean
  alternateNames?: string[]
}

/**
 * Dynamic configuration loader
 * Fetches configuration from database if available, falls back to defaults
 */
export class ProductConfiguration {
  private static instance: ProductConfiguration
  private categories: CategoryConfig[] | null = null
  private conditions: ConditionConfig[] | null = null
  private brands: BrandConfig[] | null = null
  private lastFetch: Date | null = null
  private cacheDuration = 300000 // 5 minutes cache

  private constructor() {}

  static getInstance(): ProductConfiguration {
    if (!ProductConfiguration.instance) {
      ProductConfiguration.instance = new ProductConfiguration()
    }
    return ProductConfiguration.instance
  }

  private shouldRefresh(): boolean {
    if (!this.lastFetch) return true
    return Date.now() - this.lastFetch.getTime() > this.cacheDuration
  }

  async getCategories(): Promise<CategoryConfig[]> {
    if (this.categories && !this.shouldRefresh()) {
      return this.categories
    }

    try {
      // Try to fetch from database
      const dbCategories = await prisma.categoryConfiguration.findMany({
        where: { isActive: true },
        include: {
          keywords: true
        }
      })

      if (dbCategories.length > 0) {
        this.categories = dbCategories.map(cat => ({
          name: cat.name,
          keywords: cat.keywords.map(k => k.keyword),
          subcategories: cat.metadata ? (cat.metadata as any).subcategories : []
        }))
        this.lastFetch = new Date()
        return this.categories
      }
    } catch (error) {
      // Database table might not exist yet, use defaults
      console.log('Using default categories configuration')
    }

    // Default categories if database is empty or unavailable
    this.categories = [
      {
        name: 'ELECTRONICS',
        keywords: ['tech', 'laptop', 'computer', 'phone', 'smartphone', 'tablet', 'electronics', 'gadget', 'charger', 'cable', 'device', 'camera', 'headphones', 'speaker', 'monitor', 'keyboard', 'mouse']
      },
      {
        name: 'CLOTHING',
        keywords: ['shirt', 'pants', 'jeans', 'dress', 'jacket', 'clothing', 'apparel', 'clothes', 'coat', 'sweater', 'hoodie', 'tshirt', 't-shirt', 'blouse', 'suit']
      },
      {
        name: 'SHOES',
        keywords: ['shoe', 'sneaker', 'boot', 'sandal', 'footwear', 'loafer', 'heel', 'slipper', 'trainer', 'runner']
      },
      {
        name: 'ACCESSORIES',
        keywords: ['bag', 'purse', 'wallet', 'watch', 'jewelry', 'accessory', 'belt', 'hat', 'scarf', 'sunglasses', 'handbag', 'backpack', 'bracelet', 'necklace', 'ring']
      },
      {
        name: 'HOME',
        keywords: ['furniture', 'decor', 'home', 'kitchen', 'appliance', 'lamp', 'chair', 'table', 'sofa', 'bed', 'mattress', 'curtain', 'rug', 'pillow']
      },
      {
        name: 'BOOKS',
        keywords: ['book', 'novel', 'textbook', 'magazine', 'ebook', 'paperback', 'hardcover', 'comic', 'manga', 'journal']
      }
    ]

    this.lastFetch = new Date()
    return this.categories
  }

  async getConditions(): Promise<ConditionConfig[]> {
    if (this.conditions && !this.shouldRefresh()) {
      return this.conditions
    }

    try {
      // Try to fetch from database
      const dbConditions = await prisma.searchKeywordConfiguration.findMany({
        where: {
          keywordType: 'CONDITION',
          isActive: true
        }
      })

      if (dbConditions.length > 0) {
        this.conditions = dbConditions.map(cond => {
          const metadata = cond.metadata as any || {}
          return {
            value: cond.keyword,
            label: metadata.label || cond.keyword,
            description: metadata.description,
            qualityScore: metadata.qualityScore || 50
          }
        })
        this.lastFetch = new Date()
        return this.conditions
      }
    } catch (error) {
      // Database table might not exist yet, use defaults
      console.log('Using default conditions configuration')
    }

    // Default conditions if database is empty or unavailable
    this.conditions = [
      { value: 'new', label: 'Brand New', description: 'Never used, original packaging', qualityScore: 100 },
      { value: 'like-new', label: 'Like New', description: 'Barely used, excellent condition', qualityScore: 90 },
      { value: 'excellent', label: 'Excellent', description: 'Minimal signs of use', qualityScore: 80 },
      { value: 'good', label: 'Good', description: 'Some signs of normal use', qualityScore: 70 },
      { value: 'fair', label: 'Fair', description: 'Visible wear but fully functional', qualityScore: 50 }
    ]

    this.lastFetch = new Date()
    return this.conditions
  }

  async getBrands(): Promise<BrandConfig[]> {
    if (this.brands && !this.shouldRefresh()) {
      return this.brands
    }

    try {
      // Try to fetch from database
      const dbBrands = await prisma.brandConfiguration.findMany({
        where: { isActive: true },
        include: {
          keywords: true
        }
      })

      if (dbBrands.length > 0) {
        this.brands = dbBrands.map(brand => ({
          name: brand.brandName,
          categories: brand.category ? [brand.category] : [],
          isPremium: brand.isPremium,
          alternateNames: brand.keywords.map(k => k.keyword)
        }))
        this.lastFetch = new Date()
        return this.brands
      }
    } catch (error) {
      // Database table might not exist yet, use defaults
      console.log('Using default brands configuration')
    }

    // Default brands if database is empty or unavailable
    this.brands = [
      // Tech brands
      { name: 'Apple', categories: ['ELECTRONICS'], isPremium: true, alternateNames: ['iphone', 'macbook', 'ipad'] },
      { name: 'Samsung', categories: ['ELECTRONICS'], isPremium: false, alternateNames: ['galaxy'] },
      { name: 'Dell', categories: ['ELECTRONICS'], isPremium: false, alternateNames: ['alienware', 'inspiron'] },
      { name: 'HP', categories: ['ELECTRONICS'], isPremium: false, alternateNames: ['hewlett packard'] },
      { name: 'Lenovo', categories: ['ELECTRONICS'], isPremium: false, alternateNames: ['thinkpad', 'ideapad'] },
      { name: 'Sony', categories: ['ELECTRONICS'], isPremium: true, alternateNames: ['playstation'] },
      { name: 'Microsoft', categories: ['ELECTRONICS'], isPremium: false, alternateNames: ['xbox', 'surface'] },
      { name: 'Google', categories: ['ELECTRONICS'], isPremium: false, alternateNames: ['pixel', 'nest'] },

      // Fashion brands
      { name: 'Nike', categories: ['SHOES', 'CLOTHING'], isPremium: false, alternateNames: ['jordan', 'air max'] },
      { name: 'Adidas', categories: ['SHOES', 'CLOTHING'], isPremium: false, alternateNames: ['yeezy', 'ultraboost'] },
      { name: 'Puma', categories: ['SHOES', 'CLOTHING'], isPremium: false, alternateNames: [] },
      { name: 'Under Armour', categories: ['CLOTHING'], isPremium: false, alternateNames: ['ua'] },

      // Luxury brands
      { name: 'Coach', categories: ['ACCESSORIES'], isPremium: true, alternateNames: [] },
      { name: 'Gucci', categories: ['ACCESSORIES', 'CLOTHING'], isPremium: true, alternateNames: [] },
      { name: 'Prada', categories: ['ACCESSORIES', 'CLOTHING'], isPremium: true, alternateNames: [] },
      { name: 'Louis Vuitton', categories: ['ACCESSORIES'], isPremium: true, alternateNames: ['lv'] },
      { name: 'Chanel', categories: ['ACCESSORIES', 'CLOTHING'], isPremium: true, alternateNames: [] },

      // Retail brands
      { name: 'Zara', categories: ['CLOTHING'], isPremium: false, alternateNames: [] },
      { name: 'H&M', categories: ['CLOTHING'], isPremium: false, alternateNames: ['h and m'] },
      { name: 'Uniqlo', categories: ['CLOTHING'], isPremium: false, alternateNames: [] },
      { name: 'Gap', categories: ['CLOTHING'], isPremium: false, alternateNames: [] },
      { name: 'Levi', categories: ['CLOTHING'], isPremium: false, alternateNames: ['levis', "levi's"] }
    ]

    this.lastFetch = new Date()
    return this.brands
  }

  async getCategoryNames(): Promise<string[]> {
    const categories = await this.getCategories()
    return categories.map(cat => cat.name)
  }

  async getCategoryKeywords(categoryName?: string): Promise<string[]> {
    const categories = await this.getCategories()
    if (categoryName) {
      const category = categories.find(cat => cat.name === categoryName)
      return category?.keywords || []
    }
    return categories.flatMap(cat => cat.keywords)
  }

  async getConditionValues(): Promise<string[]> {
    const conditions = await this.getConditions()
    return conditions.map(cond => cond.value)
  }

  async getBrandNames(): Promise<string[]> {
    const brands = await this.getBrands()
    return brands.map(brand => brand.name)
  }

  async findCategoryByKeyword(keyword: string): Promise<string | undefined> {
    const categories = await this.getCategories()
    const normalizedKeyword = keyword.toLowerCase()

    for (const category of categories) {
      if (category.keywords.some(k => k.toLowerCase().includes(normalizedKeyword))) {
        return category.name
      }
    }

    return undefined
  }

  async findBrandByName(name: string): Promise<BrandConfig | undefined> {
    const brands = await this.getBrands()
    const normalizedName = name.toLowerCase()

    return brands.find(brand =>
      brand.name.toLowerCase() === normalizedName ||
      brand.alternateNames?.some(alt => alt.toLowerCase() === normalizedName)
    )
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.categories = null
    this.conditions = null
    this.brands = null
    this.lastFetch = null
  }
}

// Export singleton instance
export const productConfig = ProductConfiguration.getInstance()