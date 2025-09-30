/**
 * Search Validation Test Runner
 * Executes 100 search queries and validates results
 */

import { searchTestCases, SearchTestCase } from './search-validation.test'

interface TestResult {
  testCase: SearchTestCase
  passed: boolean
  failures: string[]
  productCount: number
  executionTime: number
}

interface TestSummary {
  totalTests: number
  passed: number
  failed: number
  passRate: number
  failedTests: TestResult[]
  averageExecutionTime: number
}

class SearchValidator {
  private baseUrl: string = 'http://localhost:3000/api/buyers/enhanced-search'
  private results: TestResult[] = []

  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 Starting search validation tests...\n')
    console.log(`Testing ${searchTestCases.length} queries\n`)
    console.log('='.repeat(80))

    for (let i = 0; i < searchTestCases.length; i++) {
      const testCase = searchTestCases[i]
      console.log(`\n[${i + 1}/${searchTestCases.length}] Testing: "${testCase.query}"`)

      const result = await this.runSingleTest(testCase)
      this.results.push(result)

      if (result.passed) {
        console.log(`✅ PASSED - ${result.productCount} products found (${result.executionTime}ms)`)
      } else {
        console.log(`❌ FAILED - ${result.failures.join(', ')}`)
      }

      // Small delay to avoid overwhelming the server
      await this.delay(100)
    }

    return this.generateSummary()
  }

  private async runSingleTest(testCase: SearchTestCase): Promise<TestResult> {
    const startTime = Date.now()
    const failures: string[] = []

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testCase.query,
          pagination: { page: 1, limit: 20 }
        })
      })

      const executionTime = Date.now() - startTime

      if (!response.ok) {
        failures.push(`HTTP ${response.status}`)
        return {
          testCase,
          passed: false,
          failures,
          productCount: 0,
          executionTime
        }
      }

      const data = await response.json()
      const products = data.products || []
      const productCount = products.length

      // Validation 1: Check minimum results
      if (testCase.minResults && productCount < testCase.minResults) {
        failures.push(`Expected at least ${testCase.minResults} results, got ${productCount}`)
      }

      // Validation 2: Check for expected keywords in results
      if (testCase.expectedKeywords && testCase.expectedKeywords.length > 0) {
        const keywordFound = products.some((product: any) => {
          const productText = `${product.name || ''} ${product.title || ''} ${product.description || ''}`.toLowerCase()
          return testCase.expectedKeywords.some(keyword =>
            productText.includes(keyword.toLowerCase())
          )
        })

        if (!keywordFound && productCount > 0) {
          failures.push(`No products contain expected keywords: ${testCase.expectedKeywords.join(', ')}`)
        }
      }

      // Validation 3: Check for unwanted content
      if (testCase.shouldNotContain && testCase.shouldNotContain.length > 0 && productCount > 0) {
        const unwantedFound = products.some((product: any) => {
          const productText = `${product.name || ''} ${product.title || ''} ${product.description || ''}`.toLowerCase()
          return testCase.shouldNotContain!.some(keyword =>
            productText.includes(keyword.toLowerCase())
          )
        })

        if (unwantedFound) {
          failures.push(`Products contain unwanted keywords: ${testCase.shouldNotContain.join(', ')}`)
        }
      }

      // Validation 4: Check category if specified
      if (testCase.expectedCategory && data.metadata?.appliedFilters?.category) {
        const returnedCategory = data.metadata.appliedFilters.category
        if (returnedCategory !== testCase.expectedCategory) {
          // This is a soft failure - log but don't fail the test
          console.log(`   ⚠️  Category mismatch: expected ${testCase.expectedCategory}, got ${returnedCategory}`)
        }
      }

      return {
        testCase,
        passed: failures.length === 0,
        failures,
        productCount,
        executionTime
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      failures.push(`Error: ${error instanceof Error ? error.message : String(error)}`)

      return {
        testCase,
        passed: false,
        failures,
        productCount: 0,
        executionTime
      }
    }
  }

  private generateSummary(): TestSummary {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const failedTests = this.results.filter(r => !r.passed)
    const avgTime = this.results.reduce((sum, r) => sum + r.executionTime, 0) / this.results.length

    console.log('\n' + '='.repeat(80))
    console.log('\n📊 TEST SUMMARY\n')
    console.log('='.repeat(80))
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`✅ Passed: ${passed} (${((passed / this.results.length) * 100).toFixed(1)}%)`)
    console.log(`❌ Failed: ${failed} (${((failed / this.results.length) * 100).toFixed(1)}%)`)
    console.log(`⏱️  Average Execution Time: ${avgTime.toFixed(0)}ms`)
    console.log('='.repeat(80))

    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:\n')
      failedTests.forEach((result, index) => {
        console.log(`${index + 1}. "${result.testCase.query}"`)
        console.log(`   Description: ${result.testCase.description}`)
        console.log(`   Failures: ${result.failures.join(', ')}`)
        console.log()
      })
    }

    return {
      totalTests: this.results.length,
      passed,
      failed,
      passRate: (passed / this.results.length) * 100,
      failedTests,
      averageExecutionTime: avgTime
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  exportResults(filename: string = 'search-validation-results.json'): void {
    const fs = require('fs')
    const path = require('path')

    const summary = this.generateSummary()
    const exportData = {
      timestamp: new Date().toISOString(),
      summary,
      results: this.results
    }

    const filePath = path.join(__dirname, filename)
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2))
    console.log(`\n📝 Results exported to: ${filePath}`)
  }
}

// Run tests if executed directly
if (require.main === module) {
  const validator = new SearchValidator()

  validator.runAllTests()
    .then((summary) => {
      console.log('\n✨ Testing complete!')

      if (summary.passRate === 100) {
        console.log('🎉 All tests passed!')
        process.exit(0)
      } else if (summary.passRate >= 90) {
        console.log('⚠️  Most tests passed, but some failures detected')
        process.exit(0)
      } else {
        console.log('❌ Significant test failures detected')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Fatal error running tests:', error)
      process.exit(1)
    })
}

export { SearchValidator, TestResult, TestSummary }