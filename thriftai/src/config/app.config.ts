import { z } from 'zod'
import { logger } from '@/lib/logger'

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('3000'),
  DATABASE_URL: z.string().url('Invalid database URL'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL').optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
})

// Application configuration schema
const appConfigSchema = z.object({
  app: z.object({
    name: z.string().default('ThriftAI'),
    version: z.string().default('1.0.0'),
    environment: z.enum(['development', 'test', 'production']),
    port: z.number().min(1000).max(65535),
    url: z.string().url(),
    debug: z.boolean().default(false),
  }),
  database: z.object({
    url: z.string().url(),
    maxConnections: z.number().min(1).max(100).default(10),
    connectionTimeout: z.number().min(1000).max(30000).default(5000),
    queryTimeout: z.number().min(1000).max(60000).default(10000),
  }),
  auth: z.object({
    sessionMaxAge: z.number().min(300).max(604800).default(86400), // 1 day
    secret: z.string().min(32),
    cookieName: z.string().default('thriftai-session'),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    maxFiles: z.string().default('30d'),
    maxSize: z.string().default('20m'),
    enableConsole: z.boolean().default(true),
    enableFile: z.boolean().default(true),
  }),
  cache: z.object({
    ttl: z.number().min(60).max(86400).default(300), // 5 minutes
    maxItems: z.number().min(100).max(10000).default(1000),
  }),
  uploads: z.object({
    maxFileSize: z.number().min(1024).max(50 * 1024 * 1024).default(10 * 1024 * 1024), // 10MB
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
    uploadPath: z.string().default('./uploads'),
  }),
})

export type AppConfig = z.infer<typeof appConfigSchema>

// Configuration defaults that can be overridden by environment or database
const defaultConfig: AppConfig = {
  app: {
    name: 'ThriftAI',
    version: '1.0.0',
    environment: 'development',
    port: 3000,
    url: 'http://localhost:3000',
    debug: false,
  },
  database: {
    url: '',
    maxConnections: 10,
    connectionTimeout: 5000,
    queryTimeout: 10000,
  },
  auth: {
    sessionMaxAge: 86400,
    secret: '',
    cookieName: 'thriftai-session',
  },
  logging: {
    level: 'info',
    maxFiles: '30d',
    maxSize: '20m',
    enableConsole: true,
    enableFile: true,
  },
  cache: {
    ttl: 300,
    maxItems: 1000,
  },
  uploads: {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: './uploads',
  },
}

class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig
  private initialized = false

  private constructor() {
    this.config = defaultConfig
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Validate environment variables
      const env = this.validateEnvironment()

      // Build configuration from environment
      this.config = this.buildConfigFromEnvironment(env)

      // Load database overrides if available
      await this.loadDatabaseConfig()

      this.initialized = true

      logger.info('Configuration initialized successfully', {
        component: 'Config',
        metadata: {
          environment: this.config.app.environment,
          port: this.config.app.port,
          logLevel: this.config.logging.level,
        },
      })
    } catch (error) {
      logger.error('Failed to initialize configuration', error, {
        component: 'Config',
      })
      throw new Error('Configuration initialization failed')
    }
  }

  private validateEnvironment(): z.infer<typeof envSchema> {
    try {
      return envSchema.parse(process.env)
    } catch (error) {
      logger.error('Environment validation failed', error, {
        component: 'Config',
      })
      throw new Error('Invalid environment configuration')
    }
  }

  private buildConfigFromEnvironment(env: z.infer<typeof envSchema>): AppConfig {
    const config: AppConfig = {
      app: {
        name: process.env.APP_NAME || defaultConfig.app.name,
        version: process.env.APP_VERSION || defaultConfig.app.version,
        environment: env.NODE_ENV,
        port: env.PORT ? Number(env.PORT) : defaultConfig.app.port,
        url: env.NEXTAUTH_URL || `http://localhost:${env.PORT || 3000}`,
        debug: env.NODE_ENV === 'development',
      },
      database: {
        url: env.DATABASE_URL,
        maxConnections: Number(process.env.DB_MAX_CONNECTIONS) || defaultConfig.database.maxConnections,
        connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT) || defaultConfig.database.connectionTimeout,
        queryTimeout: Number(process.env.DB_QUERY_TIMEOUT) || defaultConfig.database.queryTimeout,
      },
      auth: {
        sessionMaxAge: Number(process.env.SESSION_MAX_AGE) || defaultConfig.auth.sessionMaxAge,
        secret: env.NEXTAUTH_SECRET,
        cookieName: process.env.SESSION_COOKIE_NAME || defaultConfig.auth.cookieName,
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || (env.NODE_ENV === 'development' ? 'debug' : 'info'),
        maxFiles: process.env.LOG_MAX_FILES || defaultConfig.logging.maxFiles,
        maxSize: process.env.LOG_MAX_SIZE || defaultConfig.logging.maxSize,
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
        enableFile: process.env.LOG_ENABLE_FILE !== 'false',
      },
      cache: {
        ttl: Number(process.env.CACHE_TTL) || defaultConfig.cache.ttl,
        maxItems: Number(process.env.CACHE_MAX_ITEMS) || defaultConfig.cache.maxItems,
      },
      uploads: {
        maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE) || defaultConfig.uploads.maxFileSize,
        allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || defaultConfig.uploads.allowedTypes,
        uploadPath: process.env.UPLOAD_PATH || defaultConfig.uploads.uploadPath,
      },
    }

    // Validate the built configuration
    return appConfigSchema.parse(config)
  }

  private async loadDatabaseConfig(): Promise<void> {
    try {
      // This would load configuration from database
      // For now, we'll skip this and rely on environment variables
      // In a future implementation, we could query a SystemConfig table
      logger.debug('Database configuration loading skipped - using environment variables', {
        component: 'Config',
      })
    } catch (error) {
      logger.warn('Failed to load database configuration, using defaults', error, {
        component: 'Config',
      })
    }
  }

  public getConfig(): AppConfig {
    if (!this.initialized) {
      throw new Error('Configuration not initialized. Call initialize() first.')
    }
    return this.config
  }

  public get<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.getConfig()[section]
  }

  public async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    try {
      const newConfig = { ...this.config, ...updates }
      const validatedConfig = appConfigSchema.parse(newConfig)

      this.config = validatedConfig

      logger.info('Configuration updated', {
        component: 'Config',
        metadata: { updates },
      })
    } catch (error) {
      logger.error('Failed to update configuration', error, {
        component: 'Config',
        metadata: { updates },
      })
      throw new Error('Configuration update failed')
    }
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development'
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production'
  }

  public isTest(): boolean {
    return this.config.app.environment === 'test'
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance()

// Export types
export type { AppConfig }

// Export the class for testing
export { ConfigManager }

// Helper functions for common config access
export const getConfig = () => config.getConfig()
export const isDevelopment = () => config.isDevelopment()
export const isProduction = () => config.isProduction()
export const isTest = () => config.isTest()

// Default export
export default config