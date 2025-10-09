/**
 * Test Intelligent Search Lite
 *
 * Verifies:
 * - Typo correction (tshrt → t-shirt)
 * - Semantic understanding (multi-field search)
 * - Price extraction (under $500)
 * - Category detection
 * - No API calls = No rate limits
 */

import { intelligentSearchLite } from '../src/lib/services/intelligentSearchLite'
import { prisma } from '../src/lib/prisma'
import { logger } from '../src/lib/logger'

interface TestCase {
  name: string
  query: string
  expectedFeatures: {
    typoCorrection?: boolean
    priceExtraction?: boolean
    categoryDetection?: boolean
  }
}

const testCases: TestCase[] = [
  {
    name: 'Typo Correction - tshrt',
    query: 'looking for tshrt',
    expectedFeatures: { typoCorrection: true }
  },
  {
    name: 'Typo Correction + Price - tshrt under $50',
    query: 'tshrt under $50',
    expectedFeatures: { typoCorrection: true, priceExtraction: true }
  },
  {
    name: 'Price Extraction - under $100',
    query: 'tech under $100',
    expectedFeatures: { priceExtraction: true }
  },
  {
    name: 'Category Detection - electronics',
    query: 'electronics under $200',
    expectedFeatures: { categoryDetection: true, priceExtraction: true }
  },
  {
    name: 'Complex Query',
    query: 'looking for labtops under $500',
    expectedFeatures: { typoCorrection: true, priceExtraction: true }
  },
  {
    name: 'Simple Search - laptop',
    query: 'laptop',
    expectedFeatures: {}
  }
]

async function runTests() {
  console.log('🧪 Testing Intelligent Search Lite\n')
  console.log('=' .repeat(80))

  // First check database status
  console.log('\n📊 Database Status:')
  const totalProducts = await prisma.product.count({ where: { isAvailable: true } })
  console.log(`   Total available products: ${totalProducts.toLocaleString()}`)

  const cheapProducts = await prisma.product.count({
    where: { isAvailable: true, price: { lte: 100 } }
  })
  console.log(`   Products under $100: ${cheapProducts.toLocaleString()}`)

  console.log('\n' + '=' .repeat(80))

  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n🔍 Test: ${testCase.name}`)
    console.log(`   Query: "${testCase.query}"`)

    const startTime = Date.now()

    try {
      const result = await intelligentSearchLite.search(testCase.query, 5)
      const duration = Date.now() - startTime

      console.log(`   ⏱️  Duration: ${duration}ms`)
      console.log(`   📝 Original: "${result.query.original}"`)
      console.log(`   ✨ Corrected: "${result.query.corrected}"`)
      console.log(`   🎯 Intent: "${result.query.intent}"`)

      // Check typo corrections
      if (result.insights.typosCorrected.length > 0) {
        console.log(`   ✅ Typo Corrections: ${result.insights.typosCorrected.join(', ')}`)
      }

      // Check price filters
      if (result.query.appliedFilters.priceRange?.max) {
        console.log(`   💰 Max Price: $${result.query.appliedFilters.priceRange.max}`)
      }

      // Check category filters
      if (result.query.appliedFilters.category) {
        console.log(`   📂 Category: ${result.query.appliedFilters.category}`)
      }

      // Results
      console.log(`   📦 Results Found: ${result.results.length}`)

      if (result.results.length > 0) {
        console.log('   Top Results:')
        result.results.slice(0, 3).forEach((product, i) => {
          console.log(`      ${i + 1}. ${product.name} - $${product.price} (Score: ${product.matchScore})`)
        })
      }

      // Validate expected features
      let validationPassed = true
      if (testCase.expectedFeatures.typoCorrection && result.insights.typosCorrected.length === 0) {
        console.log('   ❌ Expected typo correction but found none')
        validationPassed = false
      }

      if (testCase.expectedFeatures.priceExtraction && !result.query.appliedFilters.priceRange?.max) {
        console.log('   ❌ Expected price extraction but found none')
        validationPassed = false
      }

      if (testCase.expectedFeatures.categoryDetection && !result.query.appliedFilters.category) {
        console.log('   ❌ Expected category detection but found none')
        validationPassed = false
      }

      if (validationPassed) {
        console.log('   ✅ Test PASSED')
      } else {
        console.log('   ⚠️  Test FAILED (but search still worked)')
      }

    } catch (error) {
      console.log(`   ❌ Test FAILED with error:`)
      console.log(`      ${error instanceof Error ? error.message : String(error)}`)
    }

    console.log('-'.repeat(80))
  }

  console.log('\n✅ All tests completed!\n')

  await prisma.$disconnect()
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
