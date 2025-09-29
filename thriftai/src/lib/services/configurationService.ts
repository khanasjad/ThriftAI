import { prisma } from '../prisma'

export class ConfigurationService {
  // Category configuration cache
  private static categoryCache = new Map<string, any>()
  private static keywordCache = new Map<string, any>()
  private static cacheExpiry = 30 * 60 * 1000 // 30 minutes

  /**
   * Get all active categories - replaces hardcoded category arrays
   */
  static async getAllActiveCategories(): Promise<string[]> {
    const cacheKey = 'all_categories'

    try {
      const cached = this.categoryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const categories = await prisma.categoryConfiguration.findMany({
        where: { isActive: true },
        select: { categoryName: true },
        orderBy: { sortOrder: 'asc' }
      })

      const categoryNames = categories.map(c => c.categoryName)

      this.categoryCache.set(cacheKey, {
        data: categoryNames,
        timestamp: Date.now()
      })

      return categoryNames
    } catch (error) {
      console.error('Failed to load categories from database', error)
      // Fallback to default categories
      return ['CLOTHING', 'SHOES', 'ELECTRONICS', 'ACCESSORIES', 'HOME', 'BOOKS']
    }
  }

  /**
   * Get categories by parent - replaces hardcoded subcategory logic
   */
  static async getCategoriesByParent(parentCategory: string): Promise<string[]> {
    const cacheKey = `parent_${parentCategory}`

    try {
      const cached = this.categoryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const categories = await prisma.categoryConfiguration.findMany({
        where: {
          parentCategory,
          isActive: true
        },
        select: { categoryName: true },
        orderBy: { sortOrder: 'asc' }
      })

      const categoryNames = categories.map(c => c.categoryName)

      this.categoryCache.set(cacheKey, {
        data: categoryNames,
        timestamp: Date.now()
      })

      return categoryNames
    } catch (error) {
      console.error(`Failed to load subcategories for ${parentCategory}`, error)
      return []
    }
  }

  /**
   * Get category display names mapping
   */
  static async getCategoryDisplayNames(): Promise<Map<string, string>> {
    const cacheKey = 'category_display'

    try {
      const cached = this.categoryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const categories = await prisma.categoryConfiguration.findMany({
        where: { isActive: true },
        select: { categoryName: true, displayName: true }
      })

      const displayMap = new Map<string, string>()
      categories.forEach(c => {
        displayMap.set(c.categoryName, c.displayName)
      })

      this.categoryCache.set(cacheKey, {
        data: displayMap,
        timestamp: Date.now()
      })

      return displayMap
    } catch (error) {
      console.error('Failed to load category display names', error)
      return new Map()
    }
  }

  /**
   * Get category keywords mapping - replaces hardcoded keyword arrays
   */
  static async getCategoryKeywordsMapping(): Promise<Map<string, string[]>> {
    const cacheKey = 'category_keywords'

    try {
      const cached = this.keywordCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const keywords = await prisma.categoryKeyword.findMany({
        where: { isActive: true },
        include: {
          categoryConfiguration: {
            select: { categoryName: true, isActive: true }
          }
        }
      })

      const keywordMap = new Map<string, string[]>()
      keywords.forEach(kw => {
        if (kw.categoryConfiguration.isActive) {
          const key = kw.keyword.toLowerCase()
          const existing = keywordMap.get(key) || []
          existing.push(kw.categoryConfiguration.categoryName)
          keywordMap.set(key, existing)
        }
      })

      this.keywordCache.set(cacheKey, {
        data: keywordMap,
        timestamp: Date.now()
      })

      return keywordMap
    } catch (error) {
      console.error('Failed to load keyword mappings', error)
      return this.getDefaultKeywordMappings()
    }
  }

  /**
   * Get keywords for a specific category
   */
  static async getKeywordsForCategory(categoryName: string): Promise<string[]> {
    const cacheKey = `keywords_${categoryName}`

    try {
      const cached = this.keywordCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const keywords = await prisma.categoryKeyword.findMany({
        where: {
          isActive: true,
          categoryConfiguration: {
            categoryName,
            isActive: true
          }
        },
        select: { keyword: true },
        orderBy: { weight: 'desc' }
      })

      const keywordList = keywords.map(k => k.keyword)

      this.keywordCache.set(cacheKey, {
        data: keywordList,
        timestamp: Date.now()
      })

      return keywordList
    } catch (error) {
      console.error(`Failed to load keywords for category ${categoryName}`, error)
      return []
    }
  }

  /**
   * Get relevant categories for search intent
   */
  static async getRelevantCategoriesForIntent(searchQuery: string): Promise<string[]> {
    const queryLower = searchQuery.toLowerCase()

    try {
      // Vintage/Designer Intent
      if (queryLower.includes('vintage') || queryLower.includes('designer')) {
        return this.getCategoriesForSearchContext('vintage_designer')
      }

      // Fashion Intent
      if (queryLower.includes('fashion') || queryLower.includes('clothing') || queryLower.includes('apparel')) {
        return this.getCategoriesForSearchContext('fashion')
      }

      // Tech Intent
      if (queryLower.includes('tech') || queryLower.includes('electronics') || queryLower.includes('gadget')) {
        return this.getCategoriesForSearchContext('electronics')
      }

      // Automotive Intent
      if (queryLower.includes('car') || queryLower.includes('auto') || queryLower.includes('automotive')) {
        return this.getCategoriesForSearchContext('automotive')
      }

      // Bag Intent
      if (queryLower.includes('bag') || queryLower.includes('purse') || queryLower.includes('handbag')) {
        return this.getCategoriesForSearchContext('bags')
      }

      // Default to all main categories
      return this.getAllActiveCategories()
    } catch (error) {
      console.error(`Failed to get relevant categories for query: ${searchQuery}`, error)
      return this.getAllActiveCategories()
    }
  }

  /**
   * Get excluded categories for search intent
   */
  static async getExcludedCategoriesForIntent(searchQuery: string): Promise<string[]> {
    const queryLower = searchQuery.toLowerCase()

    try {
      if (queryLower.includes('bag') || queryLower.includes('purse')) {
        const exclusions = await prisma.searchExclusionConfiguration.findMany({
          where: {
            searchContext: 'bag_search',
            isActive: true
          },
          select: { exclusionKeyword: true }
        })
        return exclusions.map(e => e.exclusionKeyword)
      }

      if (queryLower.includes('automotive') || queryLower.includes('car')) {
        const exclusions = await prisma.searchExclusionConfiguration.findMany({
          where: {
            searchContext: 'automotive_search',
            isActive: true
          },
          select: { exclusionKeyword: true }
        })
        return exclusions.map(e => e.exclusionKeyword)
      }

      return []
    } catch (error) {
      console.error(`Failed to get exclusions for query: ${searchQuery}`, error)
      return []
    }
  }

  /**
   * Helper method to get categories for specific search context
   */
  private static getCategoriesForSearchContext(context: string): string[] {
    switch (context.toLowerCase()) {
      case 'vintage_designer':
      case 'fashion':
        return ['CLOTHING', 'SHOES', 'ACCESSORIES']
      case 'electronics':
        return ['ELECTRONICS']
      case 'automotive':
        return ['AUTOMOTIVE', 'ACCESSORIES', 'ELECTRONICS']
      case 'bags':
        return ['ACCESSORIES']
      default:
        return ['CLOTHING', 'SHOES', 'ELECTRONICS', 'ACCESSORIES', 'HOME', 'BOOKS']
    }
  }

  /**
   * Fallback keyword mappings if database fails
   */
  private static getDefaultKeywordMappings(): Map<string, string[]> {
    const defaults = new Map<string, string[]>()

    // Clothing keywords
    const clothingKeywords = ['clothing', 'clothes', 'apparel', 'shirt', 'blouse', 'sweater', 'jacket', 'pants', 'jeans', 'dress']
    clothingKeywords.forEach(keyword => defaults.set(keyword, ['CLOTHING']))

    // Shoes keywords
    const shoeKeywords = ['shoes', 'footwear', 'sneakers', 'boots', 'heels', 'flats', 'sandals']
    shoeKeywords.forEach(keyword => defaults.set(keyword, ['SHOES']))

    // Electronics keywords
    const electronicsKeywords = ['electronics', 'gadget', 'device', 'tech', 'phone', 'computer', 'laptop', 'headphones']
    electronicsKeywords.forEach(keyword => defaults.set(keyword, ['ELECTRONICS']))

    // Accessories keywords
    const accessoryKeywords = ['accessories', 'bag', 'purse', 'handbag', 'wallet', 'belt', 'jewelry', 'watch', 'sunglasses']
    accessoryKeywords.forEach(keyword => defaults.set(keyword, ['ACCESSORIES']))

    return defaults
  }

  /**
   * Check if a category is valid
   */
  static async isValidCategory(categoryName: string): Promise<boolean> {
    const categories = await this.getAllActiveCategories()
    return categories.includes(categoryName.toUpperCase())
  }

  /**
   * Get category hierarchy
   */
  static async getCategoryHierarchy(): Promise<Map<string, string>> {
    const cacheKey = 'category_hierarchy'

    try {
      const cached = this.categoryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const categories = await prisma.categoryConfiguration.findMany({
        where: { isActive: true },
        select: { categoryName: true, parentCategory: true }
      })

      const hierarchyMap = new Map<string, string>()
      categories.forEach(c => {
        if (c.parentCategory) {
          hierarchyMap.set(c.categoryName, c.parentCategory)
        }
      })

      this.categoryCache.set(cacheKey, {
        data: hierarchyMap,
        timestamp: Date.now()
      })

      return hierarchyMap
    } catch (error) {
      console.error('Failed to load category hierarchy', error)
      return new Map()
    }
  }

  /**
   * Get search keywords by type - replaces hardcoded keyword arrays
   */
  static async getSearchKeywordsByType(keywordType: string): Promise<string[]> {
    const cacheKey = `search_keywords_${keywordType}`

    try {
      const cached = this.keywordCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const keywords = await prisma.searchKeywordConfiguration.findMany({
        where: {
          keywordType: keywordType as any,
          isActive: true
        },
        select: { keyword: true, synonyms: true },
        orderBy: { weight: 'desc' }
      })

      // Combine main keywords with their synonyms
      const allKeywords = []
      keywords.forEach(k => {
        allKeywords.push(k.keyword.toLowerCase())
        if (k.synonyms && k.synonyms.length > 0) {
          allKeywords.push(...k.synonyms.map(s => s.toLowerCase()))
        }
      })

      const uniqueKeywords = [...new Set(allKeywords)]

      this.keywordCache.set(cacheKey, {
        data: uniqueKeywords,
        timestamp: Date.now()
      })

      return uniqueKeywords
    } catch (error) {
      console.error(`Failed to load search keywords for type ${keywordType}`, error)
      return this.getDefaultKeywordsByType(keywordType)
    }
  }

  /**
   * Get all search keywords grouped by type
   */
  static async getAllSearchKeywords(): Promise<Map<string, string[]>> {
    const cacheKey = 'all_search_keywords'

    try {
      const cached = this.keywordCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const keywords = await prisma.searchKeywordConfiguration.findMany({
        where: { isActive: true },
        select: { keywordType: true, keyword: true, synonyms: true },
        orderBy: { weight: 'desc' }
      })

      const keywordMap = new Map<string, string[]>()
      keywords.forEach(k => {
        const type = k.keywordType.toString()
        const existing = keywordMap.get(type) || []

        existing.push(k.keyword.toLowerCase())
        if (k.synonyms && k.synonyms.length > 0) {
          existing.push(...k.synonyms.map(s => s.toLowerCase()))
        }

        keywordMap.set(type, [...new Set(existing)])
      })

      this.keywordCache.set(cacheKey, {
        data: keywordMap,
        timestamp: Date.now()
      })

      return keywordMap
    } catch (error) {
      console.error('Failed to load all search keywords', error)
      return this.getDefaultAllKeywords()
    }
  }

  /**
   * Get brand configuration data - replaces hardcoded brand mappings
   */
  static async getBrandConfiguration(): Promise<Map<string, any>> {
    const cacheKey = 'brand_configuration'

    try {
      const cached = this.keywordCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const brands = await prisma.brandConfiguration.findMany({
        where: { isActive: true },
        include: {
          keywords: {
            where: { isActive: true }
          }
        }
      })

      const brandMap = new Map<string, any>()
      brands.forEach(brand => {
        const brandKey = brand.normalizedName.toLowerCase()
        brandMap.set(brandKey, {
          reputation: brand.reputation,
          premium: brand.isPremium,
          warranty: brand.warranty,
          category: brand.category,
          keywords: brand.keywords.map(k => k.keyword.toLowerCase()),
          metadata: brand.metadata
        })

        // Also map by brand name for direct lookups
        brandMap.set(brand.brandName.toLowerCase(), {
          reputation: brand.reputation,
          premium: brand.isPremium,
          warranty: brand.warranty,
          category: brand.category,
          keywords: brand.keywords.map(k => k.keyword.toLowerCase()),
          metadata: brand.metadata
        })
      })

      this.keywordCache.set(cacheKey, {
        data: brandMap,
        timestamp: Date.now()
      })

      return brandMap
    } catch (error) {
      console.error('Failed to load brand configuration', error)
      return this.getDefaultBrandConfiguration()
    }
  }

  /**
   * Get category mapping configuration - replaces hardcoded category mappings
   */
  static async getCategoryMappings(): Promise<Map<string, any>> {
    const cacheKey = 'category_mappings'

    try {
      const cached = this.categoryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      const mappings = await prisma.categoryMappingConfiguration.findMany({
        where: { isActive: true }
      })

      const mappingMap = new Map<string, any>()
      mappings.forEach(mapping => {
        mappingMap.set(mapping.categoryName, {
          amazonCategory: mapping.amazonCategory,
          subcategories: mapping.subcategories,
          avgShippingDays: mapping.avgShippingDays,
          returnWindow: mapping.returnWindow,
          metadata: mapping.metadata
        })
      })

      this.categoryCache.set(cacheKey, {
        data: mappingMap,
        timestamp: Date.now()
      })

      return mappingMap
    } catch (error) {
      console.error('Failed to load category mappings', error)
      return this.getDefaultCategoryMappings()
    }
  }

  /**
   * Check if a keyword is a stop word
   */
  static async isStopWord(keyword: string): Promise<boolean> {
    const stopWords = await this.getSearchKeywordsByType('STOP_WORD')
    return stopWords.includes(keyword.toLowerCase())
  }

  /**
   * Get product type keywords
   */
  static async getProductTypeKeywords(): Promise<string[]> {
    return this.getSearchKeywordsByType('PRODUCT_TYPE')
  }

  /**
   * Get brand descriptor keywords
   */
  static async getBrandDescriptors(): Promise<string[]> {
    return this.getSearchKeywordsByType('BRAND_DESCRIPTOR')
  }

  /**
   * Get condition descriptor keywords
   */
  static async getConditionDescriptors(): Promise<string[]> {
    return this.getSearchKeywordsByType('CONDITION_DESCRIPTOR')
  }

  /**
   * Fallback methods for when database fails
   */
  private static getDefaultKeywordsByType(keywordType: string): string[] {
    switch (keywordType) {
      case 'PRODUCT_TYPE':
        return ['bag', 'bags', 'handbag', 'handbags', 'purse', 'purses', 'backpack', 'backpacks', 'tote', 'totes', 'clutch', 'clutches', 'wallet', 'wallets', 'crossbody', 'messenger', 'satchel', 'satchels', 'hobo', 'shoulder', 'pouch', 'pouches']
      case 'BRAND_DESCRIPTOR':
        return ['designer', 'luxury', 'premium']
      case 'CONDITION_DESCRIPTOR':
        return ['vintage', 'antique', 'classic', 'retro', 'new', 'used', 'excellent', 'good', 'fair']
      case 'STOP_WORD':
        return ['find', 'search', 'get', 'buy', 'shop', 'looking', 'for', 'the', 'and', 'or', 'a', 'an', 'with', 'in', 'on']
      default:
        return []
    }
  }

  private static getDefaultAllKeywords(): Map<string, string[]> {
    const map = new Map<string, string[]>()
    map.set('PRODUCT_TYPE', this.getDefaultKeywordsByType('PRODUCT_TYPE'))
    map.set('BRAND_DESCRIPTOR', this.getDefaultKeywordsByType('BRAND_DESCRIPTOR'))
    map.set('CONDITION_DESCRIPTOR', this.getDefaultKeywordsByType('CONDITION_DESCRIPTOR'))
    map.set('STOP_WORD', this.getDefaultKeywordsByType('STOP_WORD'))
    return map
  }

  private static getDefaultBrandConfiguration(): Map<string, any> {
    const brands = new Map<string, any>()

    // Add some default brand configurations
    const defaultBrands = [
      { name: 'nike', reputation: 95, premium: true, warranty: '1 year' },
      { name: 'adidas', reputation: 92, premium: true, warranty: '1 year' },
      { name: 'gucci', reputation: 98, premium: true, warranty: '2 years' },
      { name: 'chanel', reputation: 99, premium: true, warranty: '2 years' },
      { name: 'coach', reputation: 90, premium: true, warranty: '1 year' },
      { name: 'calvin klein', reputation: 85, premium: false, warranty: '6 months' },
      { name: 'michael kors', reputation: 80, premium: false, warranty: '6 months' }
    ]

    defaultBrands.forEach(brand => {
      brands.set(brand.name, {
        reputation: brand.reputation,
        premium: brand.premium,
        warranty: brand.warranty,
        keywords: [brand.name],
        metadata: null
      })
    })

    // Default fallback
    brands.set('default', { reputation: 70, premium: false, warranty: '30 days' })

    return brands
  }

  private static getDefaultCategoryMappings(): Map<string, any> {
    const mappings = new Map<string, any>()

    mappings.set('CLOTHING', {
      amazonCategory: 'Fashion',
      subcategories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear'],
      avgShippingDays: 3,
      returnWindow: 30
    })

    mappings.set('SHOES', {
      amazonCategory: 'Shoes & Handbags',
      subcategories: ['Athletic', 'Casual', 'Dress', 'Boots', 'Sandals'],
      avgShippingDays: 2,
      returnWindow: 30
    })

    mappings.set('ACCESSORIES', {
      amazonCategory: 'Accessories',
      subcategories: ['Jewelry', 'Watches', 'Bags', 'Belts', 'Sunglasses'],
      avgShippingDays: 2,
      returnWindow: 15
    })

    mappings.set('ELECTRONICS', {
      amazonCategory: 'Electronics',
      subcategories: ['Phones', 'Laptops', 'Audio', 'Gaming', 'Smart Home'],
      avgShippingDays: 1,
      returnWindow: 15
    })

    return mappings
  }

  /**
   * Clear caches (useful for testing or manual cache invalidation)
   */
  static clearCache(): void {
    this.categoryCache.clear()
    this.keywordCache.clear()
  }
}