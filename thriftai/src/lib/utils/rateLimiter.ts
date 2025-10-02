// Simple in-memory rate limiter
// For production, use Redis (Upstash) for distributed rate limiting

import { logger } from '@/lib/logger'

interface RateLimitConfig {
  requests: number
  windowMs: number
}

// API rate limits per source
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  amazon: { requests: 1, windowMs: 1000 },      // 1 req/sec
  ebay: { requests: 5, windowMs: 1000 },        // 5 req/sec
  nike: { requests: 10, windowMs: 60000 },      // 10 req/min
  adidas: { requests: 10, windowMs: 60000 }     // 10 req/min
}

// In-memory store for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimit(source: string): Promise<boolean> {
  const config = RATE_LIMITS[source]
  if (!config) return true

  const now = Date.now()
  const key = `ratelimit:${source}`

  const existing = requestCounts.get(key)

  if (!existing || now > existing.resetTime) {
    // Reset window
    requestCounts.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return true
  }

  if (existing.count < config.requests) {
    existing.count++
    return true
  }

  // Rate limit exceeded
  return false
}

export async function waitForRateLimit(source: string): Promise<void> {
  const maxWait = 10000 // Max 10 seconds
  const startTime = Date.now()

  while (!(await checkRateLimit(source))) {
    if (Date.now() - startTime > maxWait) {
      logger.warn(`Rate limit wait timeout for ${source}`, { source, maxWait })
      break
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 60000) // Clean every minute