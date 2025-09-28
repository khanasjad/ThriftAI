import { z } from 'zod'
import { logger } from '@/lib/logger'

// API configuration schema
const apiConfigSchema = z.object({
  ai: z.object({
    openai: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://api.openai.com/v1'),
      model: z.string().default('gpt-3.5-turbo'),
      maxTokens: z.number().min(100).max(4000).default(1000),
      temperature: z.number().min(0).max(2).default(0.7),
      timeout: z.number().min(5000).max(60000).default(30000),
      retries: z.number().min(0).max(5).default(3),
    }),
    anthropic: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://api.anthropic.com'),
      model: z.string().default('claude-3-sonnet-20240229'),
      maxTokens: z.number().min(100).max(4000).default(1000),
      timeout: z.number().min(5000).max(60000).default(30000),
      retries: z.number().min(0).max(5).default(3),
    }),
  }),
  external: z.object({
    amazon: z.object({
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      associateTag: z.string().optional(),
      baseUrl: z.string().url().default('https://webservices.amazon.com/paapi5'),
      timeout: z.number().min(5000).max(30000).default(15000),
      retries: z.number().min(0).max(3).default(2),
    }),
    ebay: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://api.ebay.com'),
      timeout: z.number().min(5000).max(30000).default(15000),
      retries: z.number().min(0).max(3).default(2),
    }),
    google: z.object({
      mapsApiKey: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      timeout: z.number().min(5000).max(30000).default(10000),
    }),
  }),
  shipping: z.object({
    fedex: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://apis.fedex.com'),
      timeout: z.number().min(5000).max(30000).default(15000),
    }),
    ups: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://onlinetools.ups.com'),
      timeout: z.number().min(5000).max(30000).default(15000),
    }),
    usps: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://secure.shippingapis.com'),
      timeout: z.number().min(5000).max(30000).default(15000),
    }),
    dhl: z.object({
      apiKey: z.string().optional(),
      baseUrl: z.string().url().default('https://api-eu.dhl.com'),
      timeout: z.number().min(5000).max(30000).default(15000),
    }),
  }),
  endpoints: z.object({
    search: z.object({
      defaultLimit: z.number().min(1).max(100).default(20),
      maxLimit: z.number().min(1).max(100).default(50),
      timeout: z.number().min(1000).max(30000).default(10000),
    }),
    products: z.object({
      cacheTimeout: z.number().min(60).max(3600).default(300),
      timeout: z.number().min(1000).max(30000).default(5000),
    }),
    users: z.object({
      sessionTimeout: z.number().min(300).max(86400).default(3600),
      timeout: z.number().min(1000).max(10000).default(5000),
    }),
  }),
  monitoring: z.object({
    sentry: z.object({
      dsn: z.string().optional(),
      environment: z.string().default('development'),
      tracesSampleRate: z.number().min(0).max(1).default(0.1),
      enabled: z.boolean().default(false),
    }),
    analytics: z.object({
      googleAnalyticsId: z.string().optional(),
      enabled: z.boolean().default(false),
    }),
  }),
})

export type ApiConfig = z.infer<typeof apiConfigSchema>

// Get API configuration from environment
const getApiConfigFromEnv = (): ApiConfig => {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    ai: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY?.startsWith('sk-') ? process.env.OPENAI_API_KEY : undefined,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 1000,
        temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
        timeout: Number(process.env.OPENAI_TIMEOUT) || 30000,
        retries: Number(process.env.OPENAI_RETRIES) || 3,
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') ? process.env.ANTHROPIC_API_KEY : undefined,
        baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 1000,
        timeout: Number(process.env.ANTHROPIC_TIMEOUT) || 30000,
        retries: Number(process.env.ANTHROPIC_RETRIES) || 3,
      },
    },
    external: {
      amazon: {
        apiKey: process.env.AMAZON_API_KEY !== 'demo-key' ? process.env.AMAZON_API_KEY : undefined,
        apiSecret: process.env.AMAZON_API_SECRET !== 'demo-secret' ? process.env.AMAZON_API_SECRET : undefined,
        associateTag: process.env.AMAZON_ASSOCIATE_TAG !== 'thriftai-20' ? process.env.AMAZON_ASSOCIATE_TAG : undefined,
        baseUrl: process.env.AMAZON_BASE_URL || 'https://webservices.amazon.com/paapi5',
        timeout: Number(process.env.AMAZON_TIMEOUT) || 15000,
        retries: Number(process.env.AMAZON_RETRIES) || 2,
      },
      ebay: {
        apiKey: process.env.EBAY_API_KEY !== 'demo-key' ? process.env.EBAY_API_KEY : undefined,
        baseUrl: process.env.EBAY_BASE_URL || 'https://api.ebay.com',
        timeout: Number(process.env.EBAY_TIMEOUT) || 15000,
        retries: Number(process.env.EBAY_RETRIES) || 2,
      },
      google: {
        mapsApiKey: process.env.GOOGLE_MAPS_API_KEY !== 'demo-key' ? process.env.GOOGLE_MAPS_API_KEY : undefined,
        clientId: process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' ? process.env.GOOGLE_CLIENT_ID : undefined,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret' ? process.env.GOOGLE_CLIENT_SECRET : undefined,
        timeout: Number(process.env.GOOGLE_TIMEOUT) || 10000,
      },
    },
    shipping: {
      fedex: {
        apiKey: process.env.FEDEX_API_KEY !== 'demo-key' ? process.env.FEDEX_API_KEY : undefined,
        baseUrl: process.env.FEDEX_BASE_URL || 'https://apis.fedex.com',
        timeout: Number(process.env.FEDEX_TIMEOUT) || 15000,
      },
      ups: {
        apiKey: process.env.UPS_API_KEY !== 'demo-key' ? process.env.UPS_API_KEY : undefined,
        baseUrl: process.env.UPS_BASE_URL || 'https://onlinetools.ups.com',
        timeout: Number(process.env.UPS_TIMEOUT) || 15000,
      },
      usps: {
        apiKey: process.env.USPS_API_KEY !== 'demo-key' ? process.env.USPS_API_KEY : undefined,
        baseUrl: process.env.USPS_BASE_URL || 'https://secure.shippingapis.com',
        timeout: Number(process.env.USPS_TIMEOUT) || 15000,
      },
      dhl: {
        apiKey: process.env.DHL_API_KEY !== 'demo-key' ? process.env.DHL_API_KEY : undefined,
        baseUrl: process.env.DHL_BASE_URL || 'https://api-eu.dhl.com',
        timeout: Number(process.env.DHL_TIMEOUT) || 15000,
      },
    },
    endpoints: {
      search: {
        defaultLimit: Number(process.env.SEARCH_DEFAULT_LIMIT) || 20,
        maxLimit: Number(process.env.SEARCH_MAX_LIMIT) || 50,
        timeout: Number(process.env.SEARCH_TIMEOUT) || 10000,
      },
      products: {
        cacheTimeout: Number(process.env.PRODUCTS_CACHE_TIMEOUT) || 300,
        timeout: Number(process.env.PRODUCTS_TIMEOUT) || 5000,
      },
      users: {
        sessionTimeout: Number(process.env.USERS_SESSION_TIMEOUT) || 3600,
        timeout: Number(process.env.USERS_TIMEOUT) || 5000,
      },
    },
    monitoring: {
      sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || (isProduction ? 0.1 : 1.0),
        enabled: !!process.env.SENTRY_DSN && isProduction,
      },
      analytics: {
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
        enabled: !!process.env.GOOGLE_ANALYTICS_ID && isProduction,
      },
    },
  }
}

class ApiConfigManager {
  private static instance: ApiConfigManager
  private config: ApiConfig
  private initialized = false

  private constructor() {
    this.config = {} as ApiConfig
  }

  public static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager()
    }
    return ApiConfigManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Load configuration from environment
      const envConfig = getApiConfigFromEnv()

      // Validate the configuration
      this.config = apiConfigSchema.parse(envConfig)

      this.initialized = true

      logger.info('API configuration initialized successfully', {
        component: 'ApiConfig',
        metadata: {
          environment: process.env.NODE_ENV,
          openaiEnabled: !!this.config.ai.openai.apiKey,
          anthropicEnabled: !!this.config.ai.anthropic.apiKey,
          externalApis: Object.keys(this.config.external).filter(
            key => !!(this.config.external as any)[key].apiKey
          ),
          monitoringEnabled: this.config.monitoring.sentry.enabled,
        },
      })
    } catch (error) {
      logger.error('Failed to initialize API configuration', error, {
        component: 'ApiConfig',
      })
      throw new Error('API configuration initialization failed')
    }
  }

  public getConfig(): ApiConfig {
    if (!this.initialized) {
      throw new Error('API configuration not initialized. Call initialize() first.')
    }
    return this.config
  }

  public get<K extends keyof ApiConfig>(section: K): ApiConfig[K] {
    return this.getConfig()[section]
  }

  public getAiConfig(): ApiConfig['ai'] {
    return this.config.ai
  }

  public getExternalConfig(): ApiConfig['external'] {
    return this.config.external
  }

  public getShippingConfig(): ApiConfig['shipping'] {
    return this.config.shipping
  }

  public getEndpointsConfig(): ApiConfig['endpoints'] {
    return this.config.endpoints
  }

  public getMonitoringConfig(): ApiConfig['monitoring'] {
    return this.config.monitoring
  }

  public isOpenAIAvailable(): boolean {
    return !!this.config.ai.openai.apiKey
  }

  public isAnthropicAvailable(): boolean {
    return !!this.config.ai.anthropic.apiKey
  }

  public isExternalApiAvailable(service: keyof ApiConfig['external']): boolean {
    const serviceConfig = this.config.external[service] as any
    return !!serviceConfig.apiKey
  }

  public isShippingApiAvailable(service: keyof ApiConfig['shipping']): boolean {
    const serviceConfig = this.config.shipping[service] as any
    return !!serviceConfig.apiKey
  }

  public async updateConfig(updates: Partial<ApiConfig>): Promise<void> {
    try {
      const newConfig = { ...this.config, ...updates }
      const validatedConfig = apiConfigSchema.parse(newConfig)

      this.config = validatedConfig

      logger.info('API configuration updated', {
        component: 'ApiConfig',
        metadata: { updates },
      })
    } catch (error) {
      logger.error('Failed to update API configuration', error, {
        component: 'ApiConfig',
        metadata: { updates },
      })
      throw new Error('API configuration update failed')
    }
  }
}

// Export singleton instance
export const apiConfig = ApiConfigManager.getInstance()

// Export types
export type { ApiConfig }

// Export the class for testing
export { ApiConfigManager }

// Helper functions for common config access
export const getApiConfig = () => apiConfig.getConfig()
export const getAiConfig = () => apiConfig.getAiConfig()
export const isOpenAIAvailable = () => apiConfig.isOpenAIAvailable()
export const isAnthropicAvailable = () => apiConfig.isAnthropicAvailable()
export const getExternalConfig = () => apiConfig.getExternalConfig()
export const getShippingConfig = () => apiConfig.getShippingConfig()
export const getEndpointsConfig = () => apiConfig.getEndpointsConfig()
export const getMonitoringConfig = () => apiConfig.getMonitoringConfig()

// Default export
export default apiConfig