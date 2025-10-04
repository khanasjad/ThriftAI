#!/usr/bin/env npx tsx
/**
 * Scraper Test Runner
 * Run this script to test all web scrapers
 *
 * Usage:
 *   npm run test:scrapers
 *   OR
 *   npx tsx scripts/test-scrapers.ts
 */

import { runScraperTests } from '../src/lib/scrapers/test-scrapers'

async function main() {
  console.log('🚀 ThriftAI Web Scraper Test Suite')
  console.log('Testing: CamelCamelCamel, Walmart, Target\n')

  try {
    const summary = await runScraperTests()

    // Exit with error code if any tests failed
    if (summary.failed > 0) {
      console.error(`\n❌ ${summary.failed} test(s) failed`)
      process.exit(1)
    } else {
      console.log(`\n✅ All ${summary.passed} tests passed!`)
      process.exit(0)
    }
  } catch (error) {
    console.error('\n💥 Test suite encountered an error:')
    console.error(error)
    process.exit(1)
  }
}

main()
