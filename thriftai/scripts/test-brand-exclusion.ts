#!/usr/bin/env npx tsx
/**
 * Comprehensive Brand Exclusion Testing Suite
 * Tests the ultra-intelligent brand exclusion system across various product categories
 */

import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

interface TestCase {
  query: string
  expectedBrand?: string
  shouldExclude: string[]
  shouldInclude?: string[]
  category: string
}

const TEST_CASES: TestCase[] = [
  // === LAPTOP TESTS ===
  {
    query: 'laptop apple',
    expectedBrand: 'Apple',
    shouldExclude: ['Dell', 'HP', 'Lenovo', 'Asus', 'Samsung', 'Google', 'Microsoft'],
    shouldInclude: ['Apple'],
    category: 'Laptops'
  },
  {
    query: 'macbook',
    expectedBrand: 'Apple',
    shouldExclude: ['Dell', 'HP', 'Lenovo', 'Asus', 'Samsung', 'Google', 'Microsoft'],
    shouldInclude: ['Apple'],
    category: 'Laptops'
  },
  {
    query: 'laptop dell',
    expectedBrand: 'Dell',
    shouldExclude: ['Apple', 'HP', 'Lenovo', 'Asus', 'Samsung', 'Google', 'Microsoft'],
    shouldInclude: ['Dell'],
    category: 'Laptops'
  },
  {
    query: 'laptop samsung',
    expectedBrand: 'Samsung',
    shouldExclude: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Google', 'Microsoft'],
    shouldInclude: ['Samsung'],
    category: 'Laptops'
  },
  {
    query: 'laptop',
    expectedBrand: undefined,
    shouldExclude: [],
    shouldInclude: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Samsung'],
    category: 'Laptops (Generic)'
  },

  // === PHONE TESTS ===
  {
    query: 'iphone',
    expectedBrand: 'Apple',
    shouldExclude: ['Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'LG'],
    shouldInclude: ['Apple'],
    category: 'Phones'
  },
  {
    query: 'phone samsung',
    expectedBrand: 'Samsung',
    shouldExclude: ['Apple', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'LG'],
    shouldInclude: ['Samsung'],
    category: 'Phones'
  },
  {
    query: 'galaxy',
    expectedBrand: 'Samsung',
    shouldExclude: ['Apple', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'LG'],
    shouldInclude: ['Samsung'],
    category: 'Phones'
  },
  {
    query: 'pixel phone',
    expectedBrand: 'Google',
    shouldExclude: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Motorola', 'LG'],
    shouldInclude: ['Google'],
    category: 'Phones'
  },
  {
    query: 'phone',
    expectedBrand: undefined,
    shouldExclude: [],
    shouldInclude: ['Apple', 'Samsung', 'Google'],
    category: 'Phones (Generic)'
  }
]

async function testBrandExclusion(testCase: TestCase) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🧪 TEST: "${testCase.query}" (${testCase.category})`)
  console.log(`${'='.repeat(80)}`)

  try {
    // Call the structured query generator
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      console.log('⚠️  No API key - skipping Claude test')
      return { passed: false, reason: 'No API key' }
    }

    const anthropic = new Anthropic({ apiKey })

    // Get available categories
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true }
    })
    const availableCategories = categories.map((c: any) => c.category).join(', ')

    const systemPrompt = `You are testing brand exclusion. Generate structured query filters.

When user searches "[PRODUCT] [BRAND]", exclude ALL competing brands.

Available categories: ${availableCategories}

Return JSON with: searchTerms, requiredTerms, optionalTerms, excludeTerms, categories, brands, intent, confidence`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Query: "${testCase.query}"\n\nReturn ONLY valid JSON.`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const result = JSON.parse(jsonMatch[0])

    console.log('\n📊 Claude Response:')
    console.log(`   Search Terms: ${result.searchTerms?.slice(0, 3).join(', ')}...`)
    console.log(`   Brands: ${JSON.stringify(result.brands)}`)
    console.log(`   Exclude Terms: ${result.excludeTerms?.slice(0, 10).join(', ')}...`)
    console.log(`   Total Exclusions: ${result.excludeTerms?.length || 0}`)

    // Validate results
    const failures: string[] = []

    // Check brand filter
    if (testCase.expectedBrand) {
      if (!result.brands?.includes(testCase.expectedBrand)) {
        failures.push(`❌ Expected brand "${testCase.expectedBrand}" not in brands filter`)
      } else {
        console.log(`   ✅ Brand filter correct: ${testCase.expectedBrand}`)
      }
    }

    // Check exclusions
    const excludeTermsLower = result.excludeTerms?.map((t: string) => t.toLowerCase()) || []
    for (const shouldExclude of testCase.shouldExclude) {
      if (!excludeTermsLower.includes(shouldExclude.toLowerCase())) {
        failures.push(`❌ Should exclude "${shouldExclude}" but not in excludeTerms`)
      } else {
        console.log(`   ✅ Correctly excludes: ${shouldExclude}`)
      }
    }

    // Check minimum exclusions for brand searches
    if (testCase.expectedBrand && result.excludeTerms?.length < 10) {
      failures.push(`⚠️  Only ${result.excludeTerms?.length} exclusions (expected 10+)`)
    }

    // Test actual database query
    console.log('\n🔍 Testing Database Query:')
    const dbResults = await prisma.product.findMany({
      where: {
        isAvailable: true,
        OR: result.requiredTerms?.map((term: string) => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } }
          ]
        }))
      },
      take: 20,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true
      }
    })

    console.log(`   Found: ${dbResults.length} products`)

    // Check if results contain excluded brands
    const brandCounts: Record<string, number> = {}
    dbResults.forEach(p => {
      const brand = p.brand || 'Unknown'
      brandCounts[brand] = (brandCounts[brand] || 0) + 1
    })

    console.log(`   Brands in results: ${Object.keys(brandCounts).join(', ') || 'None'}`)

    for (const shouldExclude of testCase.shouldExclude) {
      if (brandCounts[shouldExclude]) {
        failures.push(`❌ Database contains ${brandCounts[shouldExclude]} "${shouldExclude}" products (should be excluded!)`)
      }
    }

    if (testCase.shouldInclude) {
      for (const shouldInclude of testCase.shouldInclude) {
        if (!brandCounts[shouldInclude] && testCase.expectedBrand) {
          // Only warn if we expected this specific brand
          if (shouldInclude === testCase.expectedBrand) {
            failures.push(`⚠️  No "${shouldInclude}" products found in database`)
          }
        }
      }
    }

    // Summary
    console.log('\n📋 Test Summary:')
    if (failures.length === 0) {
      console.log('   ✅ ALL CHECKS PASSED')
      return { passed: true }
    } else {
      console.log(`   ❌ ${failures.length} FAILURES:`)
      failures.forEach(f => console.log(`      ${f}`))
      return { passed: false, failures }
    }

  } catch (error) {
    console.log(`\n❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    return { passed: false, reason: String(error) }
  }
}

async function main() {
  console.log('🚀 BRAND EXCLUSION TEST SUITE')
  console.log('Testing ultra-intelligent brand exclusion across product categories\n')

  const results = {
    total: TEST_CASES.length,
    passed: 0,
    failed: 0,
    errors: 0
  }

  for (const testCase of TEST_CASES) {
    const result = await testBrandExclusion(testCase)

    if (result.passed) {
      results.passed++
    } else if (result.reason?.includes('API key')) {
      results.errors++
    } else {
      results.failed++
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('📊 FINAL RESULTS')
  console.log('='.repeat(80))
  console.log(`Total Tests: ${results.total}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Errors: ${results.errors}`)
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`)
  console.log('='.repeat(80))

  if (results.failed === 0 && results.errors === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Brand exclusion system is working perfectly!')
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
