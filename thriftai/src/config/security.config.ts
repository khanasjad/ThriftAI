import { z } from 'zod'
import { logger } from '@/lib/logger'

// Security configuration schema
const securityConfigSchema = z.object({
  csrf: z.object({
    secret: z.string().min(32),
    tokenLength: z.number().min(16).max(64).default(32),
    maxAge: z.number().min(300000).max(86400000).default(3600000), // 1 hour
    cookieName: z.string().default('__csrf-token'),
    headerName: z.string().default('x-csrf-token'),
  }),
  rateLimit: z.object({
    search: z.object({
      windowMs: z.number().min(10000).max(3600000).default(60000), // 1 minute
      maxRequests: z.number().min(1).max(1000).default(30),
    }),
    aiSearch: z.object({
      windowMs: z.number().min(10000).max(3600000).default(60000), // 1 minute
      maxRequests: z.number().min(1).max(100).default(10),
    }),
    api: z.object({
      windowMs: z.number().min(10000).max(3600000).default(60000), // 1 minute
      maxRequests: z.number().min(1).max(1000).default(100),
    }),
    auth: z.object({
      windowMs: z.number().min(60000).max(3600000).default(900000), // 15 minutes
      maxRequests: z.number().min(1).max(20).default(5),
    }),
    global: z.object({
      windowMs: z.number().min(10000).max(3600000).default(60000), // 1 minute
      maxRequests: z.number().min(10).max(10000).default(1000),
    }),
  }),
  headers: z.object({
    contentSecurityPolicy: z.boolean().default(true),
    frameOptions: z.boolean().default(true),
    xssProtection: z.boolean().default(true),
    contentTypeOptions: z.boolean().default(true),
    referrerPolicy: z.boolean().default(true),
    strictTransportSecurity: z.boolean().default(true),
    permissionsPolicy: z.boolean().default(true),
  }),
  validation: z.object({
    maxQueryLength: z.number().min(10).max(1000).default(200),
    maxPrice: z.number().min(1).max(1000000).default(10000),
    maxPageSize: z.number().min(1).max(100).default(50),
    maxPage: z.number().min(1).max(10000).default(100),
    allowedImageTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
    maxImageSize: z.number().min(1024).max(50 * 1024 * 1024).default(10 * 1024 * 1024), // 10MB
  }),
  encryption: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyLength: z.number().min(32).max(64).default(32),
    ivLength: z.number().min(12).max(16).default(16),
  }),
  session: z.object({
    httpOnly: z.boolean().default(true),
    secure: z.boolean().default(true),
    sameSite: z.enum(['strict', 'lax', 'none']).default('strict'),
    maxAge: z.number().min(300).max(2592000).default(86400), // 1 day
  }),
})

export type SecurityConfig = z.infer<typeof securityConfigSchema>

// Environment-based security configuration
const getSecurityConfigFromEnv = (): SecurityConfig => {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    csrf: {
      secret: process.env.CSRF_SECRET ||
        (isProduction ?
          (() => { throw new Error('CSRF_SECRET must be set in production') })() :
          'development-csrf-secret-change-in-production'
        ),
      tokenLength: Number(process.env.CSRF_TOKEN_LENGTH) || 32,
      maxAge: Number(process.env.CSRF_MAX_AGE) || 3600000,
      cookieName: process.env.CSRF_COOKIE_NAME || '__csrf-token',
      headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    },
    rateLimit: {
      search: {
        windowMs: Number(process.env.RATE_LIMIT_SEARCH_WINDOW) || 60000,
        maxRequests: Number(process.env.RATE_LIMIT_SEARCH_MAX) || 30,
      },
      aiSearch: {
        windowMs: Number(process.env.RATE_LIMIT_AI_SEARCH_WINDOW) || 60000,
        maxRequests: Number(process.env.RATE_LIMIT_AI_SEARCH_MAX) || 10,
      },
      api: {
        windowMs: Number(process.env.RATE_LIMIT_API_WINDOW) || 60000,
        maxRequests: Number(process.env.RATE_LIMIT_API_MAX) || 100,
      },
      auth: {
        windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW) || 900000,
        maxRequests: Number(process.env.RATE_LIMIT_AUTH_MAX) || 5,
      },
      global: {
        windowMs: Number(process.env.RATE_LIMIT_GLOBAL_WINDOW) || 60000,
        maxRequests: Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 1000,
      },
    },
    headers: {
      contentSecurityPolicy: process.env.SECURITY_HEADER_CSP !== 'false',
      frameOptions: process.env.SECURITY_HEADER_FRAME_OPTIONS !== 'false',
      xssProtection: process.env.SECURITY_HEADER_XSS_PROTECTION !== 'false',
      contentTypeOptions: process.env.SECURITY_HEADER_CONTENT_TYPE_OPTIONS !== 'false',
      referrerPolicy: process.env.SECURITY_HEADER_REFERRER_POLICY !== 'false',
      strictTransportSecurity: process.env.SECURITY_HEADER_HSTS !== 'false' && isProduction,
      permissionsPolicy: process.env.SECURITY_HEADER_PERMISSIONS_POLICY !== 'false',
    },
    validation: {
      maxQueryLength: Number(process.env.VALIDATION_MAX_QUERY_LENGTH) || 200,
      maxPrice: Number(process.env.VALIDATION_MAX_PRICE) || 10000,
      maxPageSize: Number(process.env.VALIDATION_MAX_PAGE_SIZE) || 50,
      maxPage: Number(process.env.VALIDATION_MAX_PAGE) || 100,
      allowedImageTypes: process.env.VALIDATION_ALLOWED_IMAGE_TYPES?.split(',') ||
        ['image/jpeg', 'image/png', 'image/webp'],
      maxImageSize: Number(process.env.VALIDATION_MAX_IMAGE_SIZE) || 10 * 1024 * 1024,
    },
    encryption: {
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      keyLength: Number(process.env.ENCRYPTION_KEY_LENGTH) || 32,
      ivLength: Number(process.env.ENCRYPTION_IV_LENGTH) || 16,
    },
    session: {
      httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
      secure: isProduction && process.env.SESSION_SECURE !== 'false',
      sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
      maxAge: Number(process.env.SESSION_MAX_AGE) || 86400,
    },
  }
}

class SecurityConfigManager {
  private static instance: SecurityConfigManager
  private config: SecurityConfig
  private initialized = false

  private constructor() {
    this.config = {} as SecurityConfig
  }

  public static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager()
    }
    return SecurityConfigManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Load configuration from environment
      const envConfig = getSecurityConfigFromEnv()

      // Validate the configuration
      this.config = securityConfigSchema.parse(envConfig)

      // Load database overrides if available
      await this.loadDatabaseConfig()

      this.initialized = true

      logger.info('Security configuration initialized successfully', {
        component: 'SecurityConfig',
        metadata: {
          environment: process.env.NODE_ENV,
          csrfEnabled: !!this.config.csrf.secret,
          headersEnabled: Object.values(this.config.headers).filter(Boolean).length,
          rateLimitRules: Object.keys(this.config.rateLimit).length,
        },
      })
    } catch (error) {
      logger.error('Failed to initialize security configuration', error, {
        component: 'SecurityConfig',
      })
      throw new Error('Security configuration initialization failed')
    }
  }

  private async loadDatabaseConfig(): Promise<void> {
    try {
      // This would load security configuration from database
      // For now, we'll skip this and rely on environment variables
      // In a future implementation, we could query a SecurityConfig table
      logger.debug('Database security configuration loading skipped - using environment variables', {
        component: 'SecurityConfig',
      })
    } catch (error) {
      logger.warn('Failed to load database security configuration, using defaults', error, {
        component: 'SecurityConfig',
      })
    }
  }

  public getConfig(): SecurityConfig {
    if (!this.initialized) {
      throw new Error('Security configuration not initialized. Call initialize() first.')
    }
    return this.config
  }

  public get<K extends keyof SecurityConfig>(section: K): SecurityConfig[K] {
    return this.getConfig()[section]
  }

  public getRateLimitConfig(type: keyof SecurityConfig['rateLimit']): SecurityConfig['rateLimit'][typeof type] {
    return this.config.rateLimit[type]
  }

  public getValidationConfig(): SecurityConfig['validation'] {
    return this.config.validation
  }

  public getCsrfConfig(): SecurityConfig['csrf'] {
    return this.config.csrf
  }

  public getHeadersConfig(): SecurityConfig['headers'] {
    return this.config.headers
  }

  public async updateConfig(updates: Partial<SecurityConfig>): Promise<void> {
    try {
      const newConfig = { ...this.config, ...updates }
      const validatedConfig = securityConfigSchema.parse(newConfig)

      this.config = validatedConfig

      logger.info('Security configuration updated', {
        component: 'SecurityConfig',
        metadata: { updates },
      })
    } catch (error) {
      logger.error('Failed to update security configuration', error, {
        component: 'SecurityConfig',
        metadata: { updates },
      })
      throw new Error('Security configuration update failed')
    }
  }

  public isProductionSecurity(): boolean {
    return process.env.NODE_ENV === 'production'
  }
}

// Export singleton instance
export const securityConfig = SecurityConfigManager.getInstance()

// Export types
export type { SecurityConfig }

// Export the class for testing
export { SecurityConfigManager }

// Safe helper functions for common config access with fallbacks
export const getSecurityConfig = () => {
  try {
    return securityConfig.getConfig()
  } catch (error) {
    return getSecurityConfigFromEnv()
  }
}

export const getRateLimitConfig = (type: keyof SecurityConfig['rateLimit']) => {
  try {
    return securityConfig.getRateLimitConfig(type)
  } catch (error) {
    // Return safe defaults if config not initialized
    const envConfig = getSecurityConfigFromEnv()
    return envConfig.rateLimit[type]
  }
}

export const getValidationConfig = () => {
  try {
    return securityConfig.getValidationConfig()
  } catch (error) {
    return getSecurityConfigFromEnv().validation
  }
}

export const getCsrfConfig = () => {
  try {
    return securityConfig.getCsrfConfig()
  } catch (error) {
    return getSecurityConfigFromEnv().csrf
  }
}

export const getHeadersConfig = () => {
  try {
    return securityConfig.getHeadersConfig()
  } catch (error) {
    return getSecurityConfigFromEnv().headers
  }
}

// Default export
export default securityConfig