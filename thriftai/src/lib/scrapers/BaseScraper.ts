/**
 * Base Scraper Class
 * Foundation for all web scrapers with rate limiting, retries, caching, and anti-detection
 */

import { chromium, Browser, Page } from 'playwright'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from '@/lib/logger'
import { getCachedOrFetch, generateCacheKey } from '@/lib/dataFetcher/cache'
import type { ScraperConfig, ScraperResult } from './types'

export abstract class BaseScraper {
  protected config: ScraperConfig
  protected browser?: Browser
  private lastRequestTime: number = 0
  private requestCount: number = 0
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessingQueue: boolean = false

  constructor(config: ScraperConfig) {
    this.config = config
  }

  /**
   * Initialize browser instance
   */
  protected async initBrowser(): Promise<void> {
    if (!this.browser) {
      logger.info('Initializing Playwright browser', {
        component: this.config.name,
        metadata: { headless: this.config.antiDetection.headless },
      })

      this.browser = await chromium.launch({
        headless: this.config.antiDetection.headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      })
    }
  }

  /**
   * Close browser instance
   */
  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = undefined
      logger.info('Closed Playwright browser', {
        component: this.config.name,
      })
    }
  }

  /**
   * Create new page with anti-detection measures
   */
  protected async createPage(): Promise<Page> {
    await this.initBrowser()
    const page = await this.browser!.newPage()

    // Set random user agent if enabled
    if (this.config.antiDetection.randomUserAgent) {
      await page.setExtraHTTPHeaders({
        'User-Agent': this.getRandomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      })
    }

    // Remove automation indicators
    await page.addInitScript(() => {
      // @ts-ignore
      delete navigator.__proto__.webdriver
    })

    return page
  }

  /**
   * Fetch URL with rate limiting
   */
  protected async fetchWithRateLimit<T>(
    url: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fetcher()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.isProcessingQueue) {
        this.processQueue()
      }
    })
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      // Enforce rate limit
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const minDelay = 1000 / this.config.rateLimit.requestsPerSecond

      if (timeSinceLastRequest < minDelay) {
        await this.delay(minDelay - timeSinceLastRequest)
      }

      // Add random delay if enabled
      if (this.config.antiDetection.randomDelay) {
        const randomDelay = Math.random() * 2000 + 1000 // 1-3 seconds
        await this.delay(randomDelay)
      } else {
        await this.delay(this.config.rateLimit.delayMs)
      }

      const request = this.requestQueue.shift()
      if (request) {
        this.lastRequestTime = Date.now()
        this.requestCount++

        try {
          await request()
        } catch (error) {
          logger.error('Request failed in queue', {
            component: this.config.name,
            metadata: { error: error instanceof Error ? error.message : 'Unknown' },
          })
        }
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * Fetch with retry logic
   */
  protected async fetchWithRetry<T>(
    fetcher: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        logger.info(`Fetch attempt ${attempt}/${this.config.retry.maxAttempts}`, {
          component: this.config.name,
          metadata: { context },
        })

        return await fetcher()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        logger.warn(`Fetch attempt ${attempt} failed`, {
          component: this.config.name,
          metadata: {
            context,
            error: lastError.message,
            attemptsLeft: this.config.retry.maxAttempts - attempt,
          },
        })

        if (attempt < this.config.retry.maxAttempts) {
          const backoff = this.config.retry.backoffMs * attempt
          await this.delay(backoff)
        }
      }
    }

    throw lastError || new Error('Unknown error during fetch')
  }

  /**
   * Fetch with caching
   */
  protected async fetchWithCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>
  ): Promise<{ data: T; cached: boolean }> {
    if (!this.config.cache.enabled) {
      const data = await fetcher()
      return { data, cached: false }
    }

    return await getCachedOrFetch(cacheKey, this.config.cache.ttlSeconds, fetcher)
  }

  /**
   * Fetch HTML with Playwright
   */
  protected async fetchHtmlWithBrowser(url: string): Promise<string> {
    return this.fetchWithRateLimit(url, async () => {
      return this.fetchWithRetry(async () => {
        const page = await this.createPage()

        try {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          })

          // Wait for dynamic content
          await page.waitForTimeout(2000)

          const html = await page.content()
          await page.close()

          return html
        } catch (error) {
          await page.close()
          throw error
        }
      }, `fetch HTML from ${url}`)
    })
  }

  /**
   * Fetch HTML with axios (lightweight)
   */
  protected async fetchHtmlWithAxios(url: string): Promise<string> {
    return this.fetchWithRateLimit(url, async () => {
      return this.fetchWithRetry(async () => {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
          },
          timeout: 15000,
        })

        return response.data
      }, `fetch HTML from ${url}`)
    })
  }

  /**
   * Parse HTML with Cheerio
   */
  protected parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html)
  }

  /**
   * Random user agent generator
   */
  protected getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]

    return userAgents[Math.floor(Math.random() * userAgents.length)]
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Generate cache key helper
   */
  protected getCacheKey(...parts: string[]): string {
    return generateCacheKey(this.config.name, ...parts)
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  abstract scrape(...args: any[]): Promise<ScraperResult<any>>

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.closeBrowser()
  }
}
