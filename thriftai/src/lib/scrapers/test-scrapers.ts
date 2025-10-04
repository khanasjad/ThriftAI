/**
 * Scraper Testing Utilities
 * Test all scrapers with real data to verify functionality
 */

import { logger } from '@/lib/logger'
import {
  CamelCamelCamelScraper,
  getAmazonPriceHistory,
  getAmazonPriceStats,
} from './CamelCamelCamelScraper'
import { WalmartScraper, searchWalmartProducts, getWalmartProduct } from './WalmartScraper'
import { TargetScraper, searchTargetProducts, getTargetProduct } from './TargetScraper'
import type { ScraperResult } from './types'

/**
 * Test Results Interface
 */
interface TestResult {
  scraper: string
  testName: string
  success: boolean
  duration: number
  dataPoints?: number
  cached?: boolean
  error?: string
}

/**
 * Test CamelCamelCamel Scraper
 */
export async function testCamelCamelCamel(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Real Amazon ASIN - Apple AirPods Pro
  const test1Start = Date.now()
  try {
    const result = await getAmazonPriceHistory('B0CHWRXH8B') // AirPods Pro 2nd Gen

    results.push({
      scraper: 'CamelCamelCamel',
      testName: 'Get Price History - AirPods Pro',
      success: result.success,
      duration: Date.now() - test1Start,
      dataPoints: result.data?.priceHistory?.length || 0,
      cached: result.cached,
      error: result.error,
    })

    if (result.success && result.data) {
      logger.info('CamelCamelCamel test successful', {
        component: 'ScraperTest',
        metadata: {
          product: result.data.productName,
          currentPrice: result.data.currentPrice,
          lowestPrice: result.data.lowestPrice,
          historyPoints: result.data.priceHistory.length,
        },
      })
    }
  } catch (error) {
    results.push({
      scraper: 'CamelCamelCamel',
      testName: 'Get Price History - AirPods Pro',
      success: false,
      duration: Date.now() - test1Start,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 2: Price Stats
  const test2Start = Date.now()
  try {
    const stats = await getAmazonPriceStats('B0CHWRXH8B')

    results.push({
      scraper: 'CamelCamelCamel',
      testName: 'Get Price Stats',
      success: !!stats.current || !!stats.lowest,
      duration: Date.now() - test2Start,
      error: !stats.current && !stats.lowest ? 'No stats found' : undefined,
    })

    logger.info('CamelCamelCamel stats test', {
      component: 'ScraperTest',
      metadata: stats,
    })
  } catch (error) {
    results.push({
      scraper: 'CamelCamelCamel',
      testName: 'Get Price Stats',
      success: false,
      duration: Date.now() - test2Start,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return results
}

/**
 * Test Walmart Scraper
 */
export async function testWalmart(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Search Products
  const test1Start = Date.now()
  try {
    const result = await searchWalmartProducts('laptop')

    results.push({
      scraper: 'Walmart',
      testName: 'Search Products - Laptop',
      success: result.success,
      duration: Date.now() - test1Start,
      dataPoints: result.data?.length || 0,
      cached: result.cached,
      error: result.error,
    })

    if (result.success && result.data && result.data.length > 0) {
      logger.info('Walmart search test successful', {
        component: 'ScraperTest',
        metadata: {
          query: 'laptop',
          productsFound: result.data.length,
          firstProduct: {
            name: result.data[0].name,
            price: result.data[0].price,
          },
        },
      })
    }
  } catch (error) {
    results.push({
      scraper: 'Walmart',
      testName: 'Search Products - Laptop',
      success: false,
      duration: Date.now() - test1Start,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 2: Get Product by ID (use a known ID if search worked)
  // Note: This test may need adjustment based on real Walmart product IDs
  const test2Start = Date.now()
  try {
    // This is a placeholder ID - adjust based on actual Walmart product structure
    const result = await getWalmartProduct('example-product-id')

    results.push({
      scraper: 'Walmart',
      testName: 'Get Product by ID',
      success: result !== null,
      duration: Date.now() - test2Start,
      dataPoints: result ? 1 : 0,
    })
  } catch (error) {
    results.push({
      scraper: 'Walmart',
      testName: 'Get Product by ID',
      success: false,
      duration: Date.now() - test2Start,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return results
}

/**
 * Test Target Scraper
 */
export async function testTarget(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Search Products
  const test1Start = Date.now()
  try {
    const result = await searchTargetProducts('coffee maker')

    results.push({
      scraper: 'Target',
      testName: 'Search Products - Coffee Maker',
      success: result.success,
      duration: Date.now() - test1Start,
      dataPoints: result.data?.length || 0,
      cached: result.cached,
      error: result.error,
    })

    if (result.success && result.data && result.data.length > 0) {
      logger.info('Target search test successful', {
        component: 'ScraperTest',
        metadata: {
          query: 'coffee maker',
          productsFound: result.data.length,
          firstProduct: {
            name: result.data[0].name,
            price: result.data[0].price,
          },
        },
      })
    }
  } catch (error) {
    results.push({
      scraper: 'Target',
      testName: 'Search Products - Coffee Maker',
      success: false,
      duration: Date.now() - test1Start,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 2: Get Product by ID (use a known Target DPCI or TCIN)
  // Note: This test may need adjustment based on real Target product IDs
  const test2Start = Date.now()
  try {
    // This is a placeholder ID - adjust based on actual Target product structure
    const result = await getTargetProduct('12345678')

    results.push({
      scraper: 'Target',
      testName: 'Get Product by ID',
      success: result !== null,
      duration: Date.now() - test2Start,
      dataPoints: result ? 1 : 0,
    })
  } catch (error) {
    results.push({
      scraper: 'Target',
      testName: 'Get Product by ID',
      success: false,
      duration: Date.now() - test2Start,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return results
}

/**
 * Test All Scrapers
 */
export async function testAllScrapers(): Promise<{
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
}> {
  logger.info('Starting scraper tests', {
    component: 'ScraperTest',
    metadata: { scrapers: ['CamelCamelCamel', 'Walmart', 'Target'] },
  })

  const allResults: TestResult[] = []

  // Run tests sequentially to respect rate limits
  logger.info('Testing CamelCamelCamel scraper...')
  const camelResults = await testCamelCamelCamel()
  allResults.push(...camelResults)

  logger.info('Waiting 5 seconds before next scraper...')
  await new Promise((resolve) => setTimeout(resolve, 5000))

  logger.info('Testing Walmart scraper...')
  const walmartResults = await testWalmart()
  allResults.push(...walmartResults)

  logger.info('Waiting 5 seconds before next scraper...')
  await new Promise((resolve) => setTimeout(resolve, 5000))

  logger.info('Testing Target scraper...')
  const targetResults = await testTarget()
  allResults.push(...targetResults)

  const totalTests = allResults.length
  const passed = allResults.filter((r) => r.success).length
  const failed = totalTests - passed

  logger.info('Scraper tests completed', {
    component: 'ScraperTest',
    metadata: {
      totalTests,
      passed,
      failed,
      successRate: `${((passed / totalTests) * 100).toFixed(1)}%`,
    },
  })

  return {
    totalTests,
    passed,
    failed,
    results: allResults,
  }
}

/**
 * Print Test Results
 */
export function printTestResults(summary: {
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
}) {
  console.log('\n' + '='.repeat(80))
  console.log('SCRAPER TEST RESULTS')
  console.log('='.repeat(80))
  console.log(`Total Tests: ${summary.totalTests}`)
  console.log(`Passed: ${summary.passed} ✅`)
  console.log(`Failed: ${summary.failed} ❌`)
  console.log(`Success Rate: ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%`)
  console.log('='.repeat(80))
  console.log()

  for (const result of summary.results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} | ${result.scraper} | ${result.testName}`)
    console.log(`   Duration: ${result.duration}ms`)
    if (result.dataPoints !== undefined) {
      console.log(`   Data Points: ${result.dataPoints}`)
    }
    if (result.cached !== undefined) {
      console.log(`   Cached: ${result.cached}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    console.log()
  }
}

/**
 * Example: Run Tests
 */
export async function runScraperTests() {
  try {
    const summary = await testAllScrapers()
    printTestResults(summary)
    return summary
  } catch (error) {
    logger.error('Scraper test suite failed', {
      component: 'ScraperTest',
      metadata: { error: error instanceof Error ? error.message : 'Unknown' },
    })
    throw error
  }
}
