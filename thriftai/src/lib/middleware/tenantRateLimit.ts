/**
 * Tenant-Based Rate Limiting Middleware
 *
 * Implements per-tenant rate limiting for B2B API calls
 * - Uses Redis for distributed rate limiting
 * - Falls back to in-memory for development
 * - Supports different limits per plan
 */

import { AuthenticatedTenant } from './apiAuth'
import { logger } from '@/lib/logger'
import { Redis } from '@upstash/redis'

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Redis client for rate limiting (production)
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
    logger.info('Redis rate limiter initialized')
  } else {
    logger.warn('Redis not configured, using in-memory rate limiter')
  }
} catch (error) {
  logger.error('Failed to initialize Redis', { error })
}

// In-memory fallback for development
interface RateLimitEntry {
  count: number
  resetTime: number
}

const inMemoryLimits = new Map<string, RateLimitEntry>()

/**
 * Check rate limit for a tenant
 * Returns true if request should proceed, throws RateLimitError if limit exceeded
 */
export async function checkRateLimit(tenant: AuthenticatedTenant): Promise<void> {
  const window = 3600 // 1 hour in seconds
  const limit = tenant.rateLimit || 1000
  const key = `ratelimit:${tenant.id}`

  try {
    if (redis) {
      // Use Redis for distributed rate limiting
      const current = await redis.incr(key)

      if (current === 1) {
        // First request in this window, set expiry
        await redis.expire(key, window)
      }

      const ttl = await redis.ttl(key)
      const remaining = Math.max(0, limit - current)

      if (current > limit) {
        throw new RateLimitError(
          `Rate limit exceeded. Limit: ${limit} requests per hour.`,
          ttl,
          limit,
          remaining
        )
      }

      logger.debug('Rate limit check passed', {
        tenantId: tenant.id,
        current,
        limit,
        remaining
      })
    } else {
      // Fallback to in-memory rate limiting (development only)
      const now = Date.now()
      const entry = inMemoryLimits.get(key)

      if (!entry || now > entry.resetTime) {
        // Create new window
        inMemoryLimits.set(key, {
          count: 1,
          resetTime: now + (window * 1000)
        })
        return
      }

      entry.count++
      const remaining = Math.max(0, limit - entry.count)
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

      if (entry.count > limit) {
        throw new RateLimitError(
          `Rate limit exceeded. Limit: ${limit} requests per hour.`,
          retryAfter,
          limit,
          remaining
        )
      }
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error
    }

    logger.error('Rate limit check failed', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error)
    })
    // Don't block requests if rate limiting fails
  }
}

/**
 * Get current rate limit status for a tenant
 */
export async function getRateLimitStatus(tenantId: string, limit: number): Promise<{
  limit: number
  remaining: number
  resetTime: number
}> {
  const window = 3600
  const key = `ratelimit:${tenantId}`

  try {
    if (redis) {
      const current = await redis.get<number>(key) || 0
      const ttl = await redis.ttl(key)
      const remaining = Math.max(0, limit - current)
      const resetTime = Date.now() + (ttl * 1000)

      return {
        limit,
        remaining,
        resetTime
      }
    } else {
      const entry = inMemoryLimits.get(key)
      if (!entry) {
        return {
          limit,
          remaining: limit,
          resetTime: Date.now() + (window * 1000)
        }
      }

      return {
        limit,
        remaining: Math.max(0, limit - entry.count),
        resetTime: entry.resetTime
      }
    }
  } catch (error) {
    logger.error('Failed to get rate limit status', {
      tenantId,
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      limit,
      remaining: limit,
      resetTime: Date.now() + (window * 1000)
    }
  }
}

/**
 * Reset rate limit for a tenant (admin function)
 */
export async function resetRateLimit(tenantId: string): Promise<void> {
  const key = `ratelimit:${tenantId}`

  try {
    if (redis) {
      await redis.del(key)
    } else {
      inMemoryLimits.delete(key)
    }

    logger.info('Rate limit reset', { tenantId })
  } catch (error) {
    logger.error('Failed to reset rate limit', {
      tenantId,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(headers: Headers, status: {
  limit: number
  remaining: number
  resetTime: number
}): Headers {
  headers.set('X-RateLimit-Limit', status.limit.toString())
  headers.set('X-RateLimit-Remaining', status.remaining.toString())
  headers.set('X-RateLimit-Reset', Math.floor(status.resetTime / 1000).toString())

  return headers
}
