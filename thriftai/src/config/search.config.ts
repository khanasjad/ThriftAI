import { z } from 'zod'

/**
 * Search Configuration Schema
 * Centralizes ALL hardcoded search limits, delays, and pagination values
 *
 * NOTE: No logger import here - this file is used by both client and server components
 */
const searchConfigSchema = z.object({
  pagination: z.object({
    defaultLimit: z.number().min(1).max(100).default(20),
    maxLimit: z.number().min(1).max(200).default(100),
    defaultPage: z.number().min(1).default(1),
    maxPage: z.number().min(1).max(1000).default(100),
  }),
  products: z.object({
    topProductsCount: z.number().min(1).max(20).default(3),
    intelligentRankingLimit: z.number().min(1).max(50).default(20),
    enrichmentBatchSize: z.number().min(1).max(50).default(10),
    comparisonProductsCount: z.number().min(1).max(10).default(3),
  }),
  chat: z.object({
    autoAnalysisDelayMs: z.number().min(0).max(5000).default(1500),
    maxMessagesHistory: z.number().min(5).max(100).default(20),
  }),
  cache: z.object({
    categoriesTTLMs: z.number().min(60000).max(3600000).default(300000), // 5 minutes
    searchResultsTTLMs: z.number().min(30000).max(600000).default(60000), // 1 minute
  }),
  timeout: z.object({
    searchTimeoutMs: z.number().min(1000).max(30000).default(10000),
    aiTimeoutMs: z.number().min(5000).max(60000).default(30000),
  }),
})

export type SearchConfig = z.infer<typeof searchConfigSchema>

/**
 * Load search configuration from environment variables
 */
const getSearchConfigFromEnv = (): SearchConfig => {
  return {
    pagination: {
      defaultLimit: Number(process.env.SEARCH_DEFAULT_LIMIT) || 20,
      maxLimit: Number(process.env.SEARCH_MAX_LIMIT) || 100,
      defaultPage: Number(process.env.SEARCH_DEFAULT_PAGE) || 1,
      maxPage: Number(process.env.SEARCH_MAX_PAGE) || 100,
    },
    products: {
      topProductsCount: Number(process.env.SEARCH_TOP_PRODUCTS_COUNT) || 3,
      intelligentRankingLimit: Number(process.env.SEARCH_INTELLIGENT_RANKING_LIMIT) || 20,
      enrichmentBatchSize: Number(process.env.SEARCH_ENRICHMENT_BATCH_SIZE) || 10,
      comparisonProductsCount: Number(process.env.SEARCH_COMPARISON_PRODUCTS_COUNT) || 3,
    },
    chat: {
      autoAnalysisDelayMs: Number(process.env.CHAT_AUTO_ANALYSIS_DELAY_MS) || 1500,
      maxMessagesHistory: Number(process.env.CHAT_MAX_MESSAGES_HISTORY) || 20,
    },
    cache: {
      categoriesTTLMs: Number(process.env.CACHE_CATEGORIES_TTL_MS) || 300000,
      searchResultsTTLMs: Number(process.env.CACHE_SEARCH_RESULTS_TTL_MS) || 60000,
    },
    timeout: {
      searchTimeoutMs: Number(process.env.SEARCH_TIMEOUT_MS) || 10000,
      aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
    },
  }
}

/**
 * Search Configuration Manager (Singleton)
 */
class SearchConfigManager {
  private static instance: SearchConfigManager
  private config: SearchConfig
  private initialized = false

  private constructor() {
    this.config = {} as SearchConfig
  }

  public static getInstance(): SearchConfigManager {
    if (!SearchConfigManager.instance) {
      SearchConfigManager.instance = new SearchConfigManager()
    }
    return SearchConfigManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Load configuration from environment
      const envConfig = getSearchConfigFromEnv()

      // Validate the configuration
      this.config = searchConfigSchema.parse(envConfig)

      this.initialized = true

      // Only log in Node.js environment (server-side)
      if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
        console.log('[SearchConfig] Initialized successfully', {
          defaultLimit: this.config.pagination.defaultLimit,
          maxLimit: this.config.pagination.maxLimit,
          topProductsCount: this.config.products.topProductsCount,
          autoAnalysisDelay: this.config.chat.autoAnalysisDelayMs,
        })
      }
    } catch (error) {
      if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
        console.error('[SearchConfig] Failed to initialize', error)
      }
      throw new Error('Search configuration initialization failed')
    }
  }

  public getConfig(): SearchConfig {
    if (!this.initialized) {
      // Auto-initialize if not done yet
      const envConfig = getSearchConfigFromEnv()
      this.config = searchConfigSchema.parse(envConfig)
      this.initialized = true
    }
    return this.config
  }

  public get<K extends keyof SearchConfig>(section: K): SearchConfig[K] {
    return this.getConfig()[section]
  }

  public getPaginationConfig(): SearchConfig['pagination'] {
    return this.getConfig().pagination
  }

  public getProductsConfig(): SearchConfig['products'] {
    return this.getConfig().products
  }

  public getChatConfig(): SearchConfig['chat'] {
    return this.getConfig().chat
  }

  public getCacheConfig(): SearchConfig['cache'] {
    return this.getConfig().cache
  }

  public getTimeoutConfig(): SearchConfig['timeout'] {
    return this.getConfig().timeout
  }

  public async updateConfig(updates: Partial<SearchConfig>): Promise<void> {
    try {
      const newConfig = { ...this.config, ...updates }
      const validatedConfig = searchConfigSchema.parse(newConfig)

      this.config = validatedConfig

      // Only log in Node.js environment (server-side)
      if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
        console.log('[SearchConfig] Updated successfully', { updates })
      }
    } catch (error) {
      if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
        console.error('[SearchConfig] Failed to update', error, { updates })
      }
      throw new Error('Search configuration update failed')
    }
  }
}

// Export singleton instance
export const searchConfig = SearchConfigManager.getInstance()

// Export types
export type { SearchConfig }

// Export the class for testing
export { SearchConfigManager }

// Safe helper functions for common config access with fallbacks
export const getSearchConfig = (): SearchConfig => {
  try {
    return searchConfig.getConfig()
  } catch (error) {
    return getSearchConfigFromEnv()
  }
}

export const getPaginationConfig = () => {
  try {
    return searchConfig.getPaginationConfig()
  } catch (error) {
    return getSearchConfigFromEnv().pagination
  }
}

export const getProductsConfig = () => {
  try {
    return searchConfig.getProductsConfig()
  } catch (error) {
    return getSearchConfigFromEnv().products
  }
}

export const getChatConfig = () => {
  try {
    return searchConfig.getChatConfig()
  } catch (error) {
    return getSearchConfigFromEnv().chat
  }
}

export const getCacheConfig = () => {
  try {
    return searchConfig.getCacheConfig()
  } catch (error) {
    return getSearchConfigFromEnv().cache
  }
}

export const getTimeoutConfig = () => {
  try {
    return searchConfig.getTimeoutConfig()
  } catch (error) {
    return getSearchConfigFromEnv().timeout
  }
}

// Default export
export default searchConfig
