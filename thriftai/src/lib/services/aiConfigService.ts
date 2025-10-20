import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * AI Configuration Service
 * Centralized service for retrieving AI model settings from database
 * Eliminates hardcoded AI parameters throughout the codebase
 */
export class AIConfigService {
  private static configCache = new Map<string, { value: any; timestamp: number }>()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get AI model name for a specific use case
   */
  static async getModel(useCase: 'query_generation' | 'product_ranking' | 'chat' | 'intent_extraction' | 'review_summarization'): Promise<string> {
    const key = `ai.model.${useCase}`
    const cached = this.getCached(key)
    if (cached) return cached

    try {
      const config = await prisma.systemConfiguration.findUnique({
        where: { key, is_active: true }
      })

      const value = config?.value || 'claude-3-5-haiku-20241022' // Fallback
      this.setCache(key, value)
      return value
    } catch (error) {
      logger.error(`Failed to load AI model config for ${useCase}`, { error })
      return 'claude-3-5-haiku-20241022' // Fallback
    }
  }

  /**
   * Get temperature setting for a specific use case
   */
  static async getTemperature(useCase: 'query_generation' | 'product_ranking' | 'chat'): Promise<number> {
    const key = `ai.temperature.${useCase}`
    const cached = this.getCached(key)
    if (cached !== undefined) return parseFloat(cached)

    try {
      const config = await prisma.systemConfiguration.findUnique({
        where: { key, is_active: true }
      })

      const value = config?.value ? parseFloat(config.value) : this.getDefaultTemperature(useCase)
      this.setCache(key, value.toString())
      return value
    } catch (error) {
      logger.error(`Failed to load temperature config for ${useCase}`, { error })
      return this.getDefaultTemperature(useCase)
    }
  }

  /**
   * Get max tokens setting for a specific use case
   */
  static async getMaxTokens(useCase: 'query_generation' | 'product_ranking' | 'chat' | 'intent_extraction'): Promise<number> {
    const key = `ai.max_tokens.${useCase}`
    const cached = this.getCached(key)
    if (cached !== undefined) return parseInt(cached)

    try {
      const config = await prisma.systemConfiguration.findUnique({
        where: { key, is_active: true }
      })

      const value = config?.value ? parseInt(config.value) : this.getDefaultMaxTokens(useCase)
      this.setCache(key, value.toString())
      return value
    } catch (error) {
      logger.error(`Failed to load max tokens config for ${useCase}`, { error })
      return this.getDefaultMaxTokens(useCase)
    }
  }

  /**
   * Get complete AI configuration for a use case
   */
  static async getConfig(useCase: 'query_generation' | 'product_ranking' | 'chat' | 'intent_extraction'): Promise<{
    model: string
    temperature: number
    maxTokens: number
  }> {
    const [model, temperature, maxTokens] = await Promise.all([
      this.getModel(useCase),
      this.getTemperature(useCase as any),
      this.getMaxTokens(useCase)
    ])

    return { model, temperature, maxTokens }
  }

  /**
   * Clear configuration cache (useful for testing or after updates)
   */
  static clearCache() {
    this.configCache.clear()
  }

  // Private helper methods
  private static getCached(key: string): any | undefined {
    const cached = this.configCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value
    }
    return undefined
  }

  private static setCache(key: string, value: any) {
    this.configCache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  private static getDefaultTemperature(useCase: string): number {
    const defaults: Record<string, number> = {
      query_generation: 0.1,
      product_ranking: 0.3,
      chat: 0.7
    }
    return defaults[useCase] || 0.5
  }

  private static getDefaultMaxTokens(useCase: string): number {
    const defaults: Record<string, number> = {
      query_generation: 800,
      product_ranking: 2000,
      chat: 1000,
      intent_extraction: 500
    }
    return defaults[useCase] || 1000
  }
}
