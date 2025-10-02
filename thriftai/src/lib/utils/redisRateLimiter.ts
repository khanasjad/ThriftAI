/**
 * Production-Ready Redis Rate Limiter
 * Uses Upstash Redis for distributed rate limiting across serverless instances
 * Automatically falls back to in-memory rate limiting if Redis is unavailable
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

// In-memory fallback for when Redis is unavailable
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  requests: number
  windowMs: number
}

// Rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // External APIs
  amazon: { requests: 1, windowMs: 1000 }, // 1 req/sec
  ebay: { requests: 5, windowMs: 1000 }, // 5 req/sec
  nike: { requests: 10, windowMs: 60000 }, // 10 req/min
  adidas: { requests: 10, windowMs: 60000 }, // 10 req/min

  // Internal APIs
  search: {
    requests: Number(process.env.RATE_LIMIT_SEARCH_MAX) || 30,
    windowMs: Number(process.env.RATE_LIMIT_SEARCH_WINDOW) || 60000,
  },
  aiSearch: {
    requests: Number(process.env.RATE_LIMIT_AI_SEARCH_MAX) || 10,
    windowMs: Number(process.env.RATE_LIMIT_AI_SEARCH_WINDOW) || 60000,
  },
  api: {
    requests: Number(process.env.RATE_LIMIT_API_MAX) || 100,
    windowMs: Number(process.env.RATE_LIMIT_API_WINDOW) || 60000,
  },
  auth: {
    requests: Number(process.env.RATE_LIMIT_AUTH_MAX) || 5,
    windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW) || 900000,
  },
  global: {
    requests: Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 1000,
    windowMs: Number(process.env.RATE_LIMIT_GLOBAL_WINDOW) || 60000,
  },
}

/**
 * Redis Rate Limiter Manager
 */
class RedisRateLimiter {
  private redis: Redis | null = null
  private rateLimiters: Map<string, Ratelimit> = new Map()
  private isRedisAvailable: boolean = false

  constructor() {
    this.initializeRedis()
  }

  private initializeRedis() {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

      if (!redisUrl || !redisToken) {
        logger.warn('⚠️ Upstash Redis credentials not found - using in-memory rate limiting', {
          component: 'RedisRateLimiter',
        })
        this.isRedisAvailable = false
        return
      }

      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      })

      this.isRedisAvailable = true

      logger.info('✅ Redis rate limiter initialized successfully', {
        component: 'RedisRateLimiter',
        url: redisUrl.substring(0, 30) + '...',
      })
    } catch (error) {
      logger.error('❌ Failed to initialize Redis rate limiter, using in-memory fallback', error, {
        component: 'RedisRateLimiter',
      })
      this.isRedisAvailable = false
    }
  }

  /**
   * Get or create a rate limiter for a specific source
   */
  private getRateLimiter(source: string): Ratelimit | null {
    if (!this.isRedisAvailable || !this.redis) {
      return null
    }

    // Return cached rate limiter if exists
    if (this.rateLimiters.has(source)) {
      return this.rateLimiters.get(source)!
    }

    const config = RATE_LIMITS[source]
    if (!config) {
      logger.warn(`No rate limit configuration found for source: ${source}`, {
        component: 'RedisRateLimiter',
        source,
      })
      return null
    }

    // Create new rate limiter with sliding window algorithm
    const ratelimiter = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowMs}ms`),
      analytics: true,
      prefix: `@upstash/ratelimit:${source}`,
    })

    this.rateLimiters.set(source, ratelimiter)
    return ratelimiter
  }

  /**
   * Check if a request is within rate limits (Redis-based)
   */
  async checkRateLimit(source: string, identifier: string = 'anonymous'): Promise<boolean> {
    const ratelimiter = this.getRateLimiter(source)

    // Use Redis if available
    if (ratelimiter) {
      try {
        const { success, limit, remaining, reset } = await ratelimiter.limit(identifier)

        logger.debug('Rate limit check (Redis)', {
          component: 'RedisRateLimiter',
          source,
          identifier,
          success,
          limit,
          remaining,
          reset: new Date(reset),
        })

        return success
      } catch (error) {
        logger.error('❌ Redis rate limit check failed, falling back to in-memory', error, {
          component: 'RedisRateLimiter',
          source,
          identifier,
        })
        // Fall through to in-memory check
      }
    }

    // Fallback to in-memory rate limiting
    return this.checkRateLimitInMemory(source, identifier)
  }

  /**
   * In-memory rate limit fallback
   */
  private checkRateLimitInMemory(source: string, identifier: string): boolean {
    const config = RATE_LIMITS[source]
    if (!config) return true

    const now = Date.now()
    const key = `${source}:${identifier}`

    const existing = inMemoryStore.get(key)

    if (!existing || now > existing.resetTime) {
      // Reset window
      inMemoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      })
      return true
    }

    if (existing.count < config.requests) {
      existing.count++
      return true
    }

    // Rate limit exceeded
    logger.warn('⚠️ Rate limit exceeded (in-memory)', {
      component: 'RedisRateLimiter',
      source,
      identifier,
      count: existing.count,
      limit: config.requests,
    })

    return false
  }

  /**
   * Wait for rate limit to become available
   */
  async waitForRateLimit(source: string, identifier: string = 'anonymous', maxWaitMs: number = 10000): Promise<void> {
    const startTime = Date.now()

    while (!(await this.checkRateLimit(source, identifier))) {
      if (Date.now() - startTime > maxWaitMs) {
        logger.warn(`Rate limit wait timeout for ${source}`, {
          component: 'RedisRateLimiter',
          source,
          identifier,
          maxWaitMs,
        })
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Reset rate limit for a specific identifier (admin use only)
   */
  async resetRateLimit(source: string, identifier: string): Promise<void> {
    if (!this.isRedisAvailable || !this.redis) {
      // Reset in-memory
      const key = `${source}:${identifier}`
      inMemoryStore.delete(key)
      logger.info('Rate limit reset (in-memory)', {
        component: 'RedisRateLimiter',
        source,
        identifier,
      })
      return
    }

    try {
      const key = `@upstash/ratelimit:${source}:${identifier}`
      await this.redis.del(key)
      logger.info('Rate limit reset (Redis)', {
        component: 'RedisRateLimiter',
        source,
        identifier,
      })
    } catch (error) {
      logger.error('Failed to reset rate limit', error, {
        component: 'RedisRateLimiter',
        source,
        identifier,
      })
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(source: string, identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: Date
  } | null> {
    const ratelimiter = this.getRateLimiter(source)

    if (!ratelimiter) {
      // Return in-memory status
      const config = RATE_LIMITS[source]
      if (!config) return null

      const key = `${source}:${identifier}`
      const existing = inMemoryStore.get(key)

      if (!existing || Date.now() > existing.resetTime) {
        return {
          success: true,
          limit: config.requests,
          remaining: config.requests,
          reset: new Date(Date.now() + config.windowMs),
        }
      }

      return {
        success: existing.count < config.requests,
        limit: config.requests,
        remaining: Math.max(0, config.requests - existing.count),
        reset: new Date(existing.resetTime),
      }
    }

    try {
      const result = await ratelimiter.limit(identifier)
      return result
    } catch (error) {
      logger.error('Failed to get rate limit status', error, {
        component: 'RedisRateLimiter',
        source,
        identifier,
      })
      return null
    }
  }

  /**
   * Check if Redis is available
   */
  isUsingRedis(): boolean {
    return this.isRedisAvailable
  }
}

// Singleton instance
export const redisRateLimiter = new RedisRateLimiter()

// Export for backwards compatibility
export const checkRateLimit = (source: string, identifier?: string) =>
  redisRateLimiter.checkRateLimit(source, identifier || 'anonymous')

export const waitForRateLimit = (source: string, identifier?: string, maxWaitMs?: number) =>
  redisRateLimiter.waitForRateLimit(source, identifier || 'anonymous', maxWaitMs)

// Clean up in-memory store periodically (only if not using Redis)
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    if (!redisRateLimiter.isUsingRedis()) {
      const now = Date.now()
      for (const [key, value] of inMemoryStore.entries()) {
        if (now > value.resetTime) {
          inMemoryStore.delete(key)
        }
      }
    }
  }, 60000) // Clean every minute
}

export default redisRateLimiter
