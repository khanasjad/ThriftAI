/**
 * Configuration Service
 *
 * Central service for all system configuration.
 * Eliminates hardcoding by fetching all config from database with caching.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// In-memory cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ConfigurationService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultCacheTTL = 300000 // 5 minutes

  /**
   * Get category-specific scoring weights
   */
  async getScoringWeights(category: string): Promise<{
    productQuality: number
    valueProposition: number
    trustAndSafety: number
    userExperience: number
    sustainability: number
  }> {
    const cacheKey = `scoring:${category.toUpperCase()}`
    const cached = this.getFromCache<any>(cacheKey)
    if (cached) return cached

    try {
      let config = await prisma.$queryRaw<any[]>`
        SELECT
          product_quality_weight,
          value_proposition_weight,
          trust_and_safety_weight,
          user_experience_weight,
          sustainability_weight
        FROM scoring_configurations
        WHERE category = ${category.toUpperCase()} AND is_active = true
        LIMIT 1
      `

      // Fallback to DEFAULT if specific category not found
      if (!config || config.length === 0) {
        config = await prisma.$queryRaw<any[]>`
          SELECT
            product_quality_weight,
            value_proposition_weight,
            trust_and_safety_weight,
            user_experience_weight,
            sustainability_weight
          FROM scoring_configurations
          WHERE category = 'DEFAULT' AND is_active = true
          LIMIT 1
        `
      }

      const weights = config[0] ? {
        productQuality: Number(config[0].product_quality_weight),
        valueProposition: Number(config[0].value_proposition_weight),
        trustAndSafety: Number(config[0].trust_and_safety_weight),
        userExperience: Number(config[0].user_experience_weight),
        sustainability: Number(config[0].sustainability_weight)
      } : {
        // Ultimate fallback (should never happen)
        productQuality: 0.30,
        valueProposition: 0.25,
        trustAndSafety: 0.20,
        userExperience: 0.15,
        sustainability: 0.10
      }

      this.setCache(cacheKey, weights, this.defaultCacheTTL)
      return weights
    } catch (error) {
      logger.error('Error fetching scoring weights', { category, error })
      // Return default weights on error
      return {
        productQuality: 0.30,
        valueProposition: 0.25,
        trustAndSafety: 0.20,
        userExperience: 0.15,
        sustainability: 0.10
      }
    }
  }

  /**
   * Get category default specifications
   */
  async getCategoryDefaultSpecs(category: string, subcategory?: string): Promise<Record<string, any>> {
    const cacheKey = `specs:${category}:${subcategory || 'none'}`
    const cached = this.getFromCache<Record<string, any>>(cacheKey)
    if (cached) return cached

    try {
      // Try specific subcategory first (higher priority)
      if (subcategory) {
        const specificSpecs = await prisma.$queryRaw<any[]>`
          SELECT default_specs
          FROM category_default_specs
          WHERE category = ${category}
            AND subcategory = ${subcategory}
            AND is_active = true
          ORDER BY priority DESC
          LIMIT 1
        `

        if (specificSpecs && specificSpecs.length > 0) {
          const specs = specificSpecs[0].default_specs
          this.setCache(cacheKey, specs, this.defaultCacheTTL)
          return specs
        }
      }

      // Fallback to category-level defaults
      const categorySpecs = await prisma.$queryRaw<any[]>`
        SELECT default_specs
        FROM category_default_specs
        WHERE category = ${category}
          AND subcategory IS NULL
          AND is_active = true
        ORDER BY priority DESC
        LIMIT 1
      `

      const specs = categorySpecs.length > 0 ? categorySpecs[0].default_specs : {}
      this.setCache(cacheKey, specs, this.defaultCacheTTL)
      return specs
    } catch (error) {
      logger.error('Error fetching category default specs', { category, subcategory, error })
      return {}
    }
  }

  /**
   * Get score threshold configuration
   */
  async getScoreThresholds(): Promise<Array<{
    name: string
    minScore: number
    maxScore: number
    badgeColor: string
    badgeClass: string
    label: string
  }>> {
    const cacheKey = 'score:thresholds'
    const cached = this.getFromCache<any[]>(cacheKey)
    if (cached) return cached

    try {
      const thresholds = await prisma.$queryRaw<any[]>`
        SELECT name, min_score, max_score, badge_color, badge_class, label
        FROM score_thresholds
        WHERE is_active = true
        ORDER BY display_order ASC
      `

      const result = thresholds.map(t => ({
        name: t.name,
        minScore: Number(t.min_score),
        maxScore: Number(t.max_score),
        badgeColor: t.badge_color,
        badgeClass: t.badge_class,
        label: t.label
      }))

      this.setCache(cacheKey, result, this.defaultCacheTTL)
      return result
    } catch (error) {
      logger.error('Error fetching score thresholds', { error })
      // Return default thresholds on error
      return [
        { name: 'excellent', minScore: 80, maxScore: 100, badgeColor: 'green', badgeClass: 'bg-green-600', label: 'Excellent' },
        { name: 'good', minScore: 70, maxScore: 79.99, badgeColor: 'blue', badgeClass: 'bg-blue-600', label: 'Good' },
        { name: 'fair', minScore: 60, maxScore: 69.99, badgeColor: 'yellow', badgeClass: 'bg-yellow-600', label: 'Fair' },
        { name: 'poor', minScore: 0, maxScore: 59.99, badgeColor: 'gray', badgeClass: 'bg-gray-600', label: 'Poor' }
      ]
    }
  }

  /**
   * Get system configuration value
   */
  async getSystemConfig(key: string, defaultValue?: any): Promise<any> {
    const cacheKey = `system:${key}`
    const cached = this.getFromCache<any>(cacheKey)
    if (cached !== undefined) return cached

    try {
      const config = await prisma.$queryRaw<any[]>`
        SELECT value, value_type
        FROM system_configurations
        WHERE key = ${key} AND is_active = true
        LIMIT 1
      `

      if (!config || config.length === 0) {
        this.setCache(cacheKey, defaultValue, this.defaultCacheTTL)
        return defaultValue
      }

      const { value, value_type } = config[0]
      let parsedValue: any = value

      // Parse based on type
      switch (value_type) {
        case 'NUMBER':
          parsedValue = Number(value)
          break
        case 'BOOLEAN':
          parsedValue = value.toLowerCase() === 'true'
          break
        case 'JSON':
          parsedValue = JSON.parse(value)
          break
        // STRING: no parsing needed
      }

      this.setCache(cacheKey, parsedValue, this.defaultCacheTTL)
      return parsedValue
    } catch (error) {
      logger.error('Error fetching system config', { key, error })
      return defaultValue
    }
  }

  /**
   * Clear specific cache key
   */
  clearCache(key: string) {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear()
    logger.info('Configuration cache cleared')
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data as T
  }

  /**
   * Set cache
   */
  private setCache<T>(key: string, data: T, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
}

// Export singleton instance
export const configService = new ConfigurationService()
