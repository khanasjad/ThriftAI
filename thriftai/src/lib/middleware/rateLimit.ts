import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getRateLimitConfig } from '@/config/security.config'

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Export for testing
export { rateLimitStore }

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string  // Custom key generator
  skipSuccessfulRequests?: boolean  // Don't count successful requests
  skipFailedRequests?: boolean  // Don't count failed requests
}

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => getClientIP(req),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config

  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(req)
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up old entries
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(entryKey)
      }
    }

    // Get or create entry for this client
    let entry = rateLimitStore.get(key)
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowMs }
      rateLimitStore.set(key, entry)
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          },
        }
      )
    }

    // Execute the handler
    const response = await handler()

    // Decide whether to count this request
    const shouldCount = !(
      (skipSuccessfulRequests && response.status < 400) ||
      (skipFailedRequests && response.status >= 400)
    )

    if (shouldCount) {
      entry.count++
      rateLimitStore.set(key, entry)
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString())

    return response
  }
}

// Extract client IP address
function getClientIP(req: NextRequest): string {
  // Check various headers for real IP
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to a default IP for development
  return req.ip || '127.0.0.1'
}

// Predefined rate limit configurations
// These now use configuration values instead of hardcoded ones
export const rateLimitConfigs = {
  // Search API - more generous for core functionality
  get search() {
    return getRateLimitConfig('search')
  },

  // AI search - more restrictive due to computational cost
  get aiSearch() {
    return getRateLimitConfig('aiSearch')
  },

  // Authentication - strict to prevent brute force
  get auth() {
    return getRateLimitConfig('auth')
  },

  // General API - moderate limits
  get api() {
    return getRateLimitConfig('api')
  },

  // Global rate limiting (catch-all)
  get global() {
    return getRateLimitConfig('global')
  },
}

// Legacy support for existing code
export const rateLimitConfigs_legacy = {
  // Search API - more generous for core functionality
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,      // 30 requests per minute
  },

  // AI search - more restrictive due to computational cost
  aiSearch: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,      // 10 requests per minute
  },

  // Authentication - strict to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 attempts per 15 minutes
  },

  // General API - moderate limits
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,      // 60 requests per minute
  },
}