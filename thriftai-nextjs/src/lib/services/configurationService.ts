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
   * Clear caches (useful for testing or manual cache invalidation)
   */
  static clearCache(): void {
    this.categoryCache.clear()
    this.keywordCache.clear()
  }
}