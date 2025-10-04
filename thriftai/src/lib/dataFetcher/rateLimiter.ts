/**
 * Rate limiting utilities for API calls
 */

import { RATE_LIMIT_CONFIG, RateLimitError } from './types'

interface RequestRecord {
  timestamp: number
}

class RateLimiter {
  private requestHistory: Map<string, RequestRecord[]> = new Map()
  private lastRequestTime: Map<string, number> = new Map()

  /**
   * Check if request is allowed and wait if necessary
   */
  async checkAndWait(source: string): Promise<void> {
    const config = RATE_LIMIT_CONFIG[source]
    if (!config) {
      // No rate limit configured for this source
      return
    }

    // Check delay between requests
    if (config.delayMs) {
      const lastRequest = this.lastRequestTime.get(source) || 0
      const timeSinceLastRequest = Date.now() - lastRequest

      if (timeSinceLastRequest < config.delayMs) {
        const waitTime = config.delayMs - timeSinceLastRequest
        console.log(`[RateLimit] ${source}: Waiting ${waitTime}ms before next request`)
        await this.sleep(waitTime)
      }
    }

    // Check window-based rate limit
    const now = Date.now()
    const history = this.requestHistory.get(source) || []

    // Remove old requests outside the window
    const windowStart = now - config.windowMs
    const recentRequests = history.filter(r => r.timestamp > windowStart)

    // Check if limit exceeded
    if (recentRequests.length >= config.maxRequests) {
      const oldestRequest = recentRequests[0]
      const waitTime = oldestRequest.timestamp + config.windowMs - now

      throw new RateLimitError(source, waitTime)
    }

    // Record this request
    recentRequests.push({ timestamp: now })
    this.requestHistory.set(source, recentRequests)
    this.lastRequestTime.set(source, now)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get rate limit stats for a source
   */
  getStats(source: string) {
    const config = RATE_LIMITS[source]
    if (!config) {
      return null
    }

    const history = this.requestHistory.get(source) || []
    const now = Date.now()
    const windowStart = now - config.windowMs
    const recentRequests = history.filter(r => r.timestamp > windowStart)

    return {
      source,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      currentRequests: recentRequests.length,
      remaining: config.maxRequests - recentRequests.length,
      delayMs: config.delayMs,
    }
  }

  /**
   * Reset rate limit for a source
   */
  reset(source: string): void {
    this.requestHistory.delete(source)
    this.lastRequestTime.delete(source)
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requestHistory.clear()
    this.lastRequestTime.clear()
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Execute function with rate limiting
 */
export async function withRateLimit<T>(
  source: string,
  fn: () => Promise<T>
): Promise<T> {
  await rateLimiter.checkAndWait(source)
  return fn()
}
