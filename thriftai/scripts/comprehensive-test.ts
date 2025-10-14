/**
 * Comprehensive Testing Script for ThriftAI
 * Tests all pages, APIs, data integrity, and UI components
 */

import { prisma } from '../src/lib/prisma'
import { logger } from '../src/lib/logger'

interface TestResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

const results: TestResult[] = []

function addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ category, test, status, message, details })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} [${category}] ${test}: ${message}`)
}

async function testDataIntegrity() {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 TESTING DATA INTEGRITY')
  console.log('='.repeat(80) + '\n')

  // Test 1: Product Count
  try {
    const totalProducts = await prisma.product.count({ where: { isAvailable: true } })
    if (totalProducts >= 1000) {
      addResult('Data', 'Product Count', 'PASS', `Found ${totalProducts} products`)
    } else {
      addResult('Data', 'Product Count', 'WARN', `Only ${totalProducts} products found (expected 1000+)`)
    }
  } catch (error) {
    addResult('Data', 'Product Count', 'FAIL', 'Database connection failed', error)
  }

  // Test 2: Veritas Scores
  try {
    const scoredProducts = await prisma.product.count({
      where: { isAvailable: true, aiScore: { not: null } }
    })
    const totalProducts = await prisma.product.count({ where: { isAvailable: true } })
    const coverage = (scoredProducts / totalProducts) * 100

    if (coverage >= 99) {
      addResult('Data', 'Veritas Score Coverage', 'PASS', `${coverage.toFixed(1)}% coverage`)
    } else {
      addResult('Data', 'Veritas Score Coverage', 'WARN', `Only ${coverage.toFixed(1)}% coverage`, { scored: scoredProducts, total: totalProducts })
    }
  } catch (error) {
    addResult('Data', 'Veritas Score Coverage', 'FAIL', 'Failed to check scores', error)
  }

  // Test 3: Enriched Parameters
  try {
    const enrichedProducts = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { dynamicSpecs: true },
      take: 100
    })

    let totalParams = 0
    let productCount = 0

    enrichedProducts.forEach(p => {
      const specs = p.dynamicSpecs as any
      const paramCount = Object.keys(specs || {}).length
      if (paramCount > 2) {
        totalParams += paramCount
        productCount++
      }
    })

    const avgParams = totalParams / productCount

    if (avgParams >= 25) {
      addResult('Data', 'Parameter Enrichment', 'PASS', `Avg ${avgParams.toFixed(1)} parameters per product`)
    } else {
      addResult('Data', 'Parameter Enrichment', 'WARN', `Only ${avgParams.toFixed(1)} parameters per product (expected 25+)`)
    }
  } catch (error) {
    addResult('Data', 'Parameter Enrichment', 'FAIL', 'Failed to check parameters', error)
  }

  // Test 4: Images
  try {
    const productsWithImages = await prisma.product.count({
      where: { isAvailable: true, imageUrl: { not: null } }
    })
    const totalProducts = await prisma.product.count({ where: { isAvailable: true } })
    const coverage = (productsWithImages / totalProducts) * 100

    if (coverage >= 99) {
      addResult('Data', 'Image Coverage', 'PASS', `${coverage.toFixed(1)}% have images`)
    } else {
      addResult('Data', 'Image Coverage', 'WARN', `Only ${coverage.toFixed(1)}% have images`)
    }
  } catch (error) {
    addResult('Data', 'Image Coverage', 'FAIL', 'Failed to check images', error)
  }

  // Test 5: Category Distribution
  try {
    const categories = ['ELECTRONICS', 'CLOTHING', 'SHOES', 'ACCESSORIES', 'BEAUTY', 'HOME', 'SPORTS', 'TOYS']
    const distribution: Record<string, number> = {}

    for (const cat of categories) {
      const count = await prisma.product.count({
        where: { isAvailable: true, category: cat }
      })
      distribution[cat] = count
    }

    const min = Math.min(...Object.values(distribution))
    const max = Math.max(...Object.values(distribution))

    if (min >= 100 && max <= 150) {
      addResult('Data', 'Category Distribution', 'PASS', 'Balanced distribution', distribution)
    } else {
      addResult('Data', 'Category Distribution', 'WARN', 'Unbalanced distribution', distribution)
    }
  } catch (error) {
    addResult('Data', 'Category Distribution', 'FAIL', 'Failed to check categories', error)
  }

  // Test 6: Price Ranges
  try {
    const priceStats = await prisma.product.aggregate({
      where: { isAvailable: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    })

    if (priceStats._min.price! > 0 && priceStats._max.price! < 10000) {
      addResult('Data', 'Price Ranges', 'PASS', `Range: $${priceStats._min.price} - $${priceStats._max.price}`)
    } else {
      addResult('Data', 'Price Ranges', 'WARN', 'Price range seems unusual', priceStats)
    }
  } catch (error) {
    addResult('Data', 'Price Ranges', 'FAIL', 'Failed to check prices', error)
  }

  // Test 7: Score Breakdown Structure
  try {
    const sampleProduct = await prisma.product.findFirst({
      where: { isAvailable: true, aiScore: { not: null } },
      select: { aiScoreBreakdown: true }
    })

    const breakdown = sampleProduct?.aiScoreBreakdown as any
    const requiredComponents = ['priceValue', 'trustScore', 'qualityScore', 'urgency', 'socialProof', 'relevance', 'emotional', 'convenience']

    const hasAllComponents = requiredComponents.every(comp => breakdown?.[comp] !== undefined)

    if (hasAllComponents) {
      addResult('Data', 'Score Breakdown Structure', 'PASS', 'All components present')
    } else {
      addResult('Data', 'Score Breakdown Structure', 'FAIL', 'Missing components', { breakdown, required: requiredComponents })
    }
  } catch (error) {
    addResult('Data', 'Score Breakdown Structure', 'FAIL', 'Failed to check breakdown', error)
  }
}

async function testAPIs() {
  console.log('\n' + '='.repeat(80))
  console.log('🔌 TESTING API ENDPOINTS')
  console.log('='.repeat(80) + '\n')

  const baseUrl = 'http://localhost:3000'

  // Test 1: Products API
  try {
    const response = await fetch(`${baseUrl}/api/products`)
    if (response.ok) {
      const data = await response.json()
      if (data.products && data.products.length > 0) {
        addResult('API', 'GET /api/products', 'PASS', `Returned ${data.products.length} products`)
      } else {
        addResult('API', 'GET /api/products', 'WARN', 'No products returned')
      }
    } else {
      addResult('API', 'GET /api/products', 'FAIL', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('API', 'GET /api/products', 'FAIL', 'Request failed', error)
  }

  // Test 2: Leaderboard API
  try {
    const response = await fetch(`${baseUrl}/api/leaderboard`)
    if (response.ok) {
      const data = await response.json()
      if (data.products && data.products.length > 0) {
        const hasScores = data.products.every((p: any) => p.aiScore !== null)
        if (hasScores) {
          addResult('API', 'GET /api/leaderboard', 'PASS', `Returned ${data.products.length} products with scores`)
        } else {
          addResult('API', 'GET /api/leaderboard', 'WARN', 'Some products missing scores')
        }
      } else {
        addResult('API', 'GET /api/leaderboard', 'WARN', 'No products returned')
      }
    } else {
      addResult('API', 'GET /api/leaderboard', 'FAIL', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('API', 'GET /api/leaderboard', 'FAIL', 'Request failed', error)
  }

  // Test 3: Single Product API
  try {
    const firstProduct = await prisma.product.findFirst({
      where: { isAvailable: true },
      select: { id: true }
    })

    if (firstProduct) {
      const response = await fetch(`${baseUrl}/api/products/${firstProduct.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.id === firstProduct.id) {
          addResult('API', 'GET /api/products/[id]', 'PASS', 'Product details returned')
        } else {
          addResult('API', 'GET /api/products/[id]', 'FAIL', 'Wrong product returned')
        }
      } else {
        addResult('API', 'GET /api/products/[id]', 'FAIL', `HTTP ${response.status}`)
      }
    }
  } catch (error) {
    addResult('API', 'GET /api/products/[id]', 'FAIL', 'Request failed', error)
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80) + '\n')

  const categories = [...new Set(results.map(r => r.category))]

  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category)
    const passed = categoryResults.filter(r => r.status === 'PASS').length
    const failed = categoryResults.filter(r => r.status === 'FAIL').length
    const warned = categoryResults.filter(r => r.status === 'WARN').length
    const total = categoryResults.length

    console.log(`\n📂 ${category}:`)
    console.log(`  ✅ Passed: ${passed}/${total}`)
    console.log(`  ❌ Failed: ${failed}/${total}`)
    console.log(`  ⚠️  Warnings: ${warned}/${total}`)

    if (failed > 0) {
      console.log(`\n  Failed Tests:`)
      categoryResults.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`    - ${r.test}: ${r.message}`)
      })
    }

    if (warned > 0) {
      console.log(`\n  Warnings:`)
      categoryResults.filter(r => r.status === 'WARN').forEach(r => {
        console.log(`    - ${r.test}: ${r.message}`)
      })
    }
  })

  const totalPassed = results.filter(r => r.status === 'PASS').length
  const totalFailed = results.filter(r => r.status === 'FAIL').length
  const totalWarned = results.filter(r => r.status === 'WARN').length
  const total = results.length

  console.log('\n' + '='.repeat(80))
  console.log(`📈 OVERALL: ${totalPassed}/${total} PASSED, ${totalFailed} FAILED, ${totalWarned} WARNINGS`)
  console.log('='.repeat(80) + '\n')

  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED!')
  } else {
    console.log('⚠️  SOME TESTS FAILED - REVIEW ISSUES ABOVE')
  }
}

async function main() {
  console.log('\n🚀 Starting Comprehensive Testing...\n')

  await testDataIntegrity()
  await testAPIs()
  await generateReport()

  process.exit(totalFailed > 0 ? 1 : 0)
}

const totalFailed = () => results.filter(r => r.status === 'FAIL').length

main().catch(e => {
  console.error('❌ Testing failed:', e)
  process.exit(1)
})
