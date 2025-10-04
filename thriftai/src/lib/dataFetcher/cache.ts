/**
 * Caching utilities for data fetching
 * Implements in-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    })

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Singleton instance
export const dataCache = new DataCache()

/**
 * Helper function to get cached value or fetch fresh
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  // Try cache first
  const cached = dataCache.get<T>(key)
  if (cached !== null) {
    return { data: cached, cached: true }
  }

  // Fetch fresh data
  const data = await fetchFn()

  // Cache result
  dataCache.set(key, data, ttlSeconds)

  return { data, cached: false }
}

/**
 * Helper to generate cache keys
 */
export function generateCacheKey(source: string, ...params: (string | number)[]): string {
  return `${source}:${params.join(':')}`
}
