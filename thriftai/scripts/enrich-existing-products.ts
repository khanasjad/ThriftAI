#!/usr/bin/env npx tsx
/**
 * Batch Product Enrichment Script
 *
 * Enriches ALL existing products with:
 * 1. Product images from eBay API
 * 2. Detailed specifications from external APIs (GSMArena, iFixit, etc.)
 * 3. Market comparison data from eBay
 * 4. Warranty information (Apple, Dell)
 * 5. Price history and trends
 *
 * Usage:
 *   npx tsx scripts/enrich-existing-products.ts
 *   OR with options:
 *   npx tsx scripts/enrich-existing-products.ts --limit 50 --category ELECTRONICS
 *   npx tsx scripts/enrich-existing-products.ts --only-missing
 */

import { PrismaClient } from '@prisma/client'
import { productEnrichmentService } from '../src/lib/services/productEnrichmentService'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()

interface ScriptOptions {
  limit?: number
  category?: string
  onlyMissing?: boolean
  verbose?: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)
  const options: ScriptOptions = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1])
      i++
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[i + 1]
      i++
    } else if (args[i] === '--only-missing') {
      options.onlyMissing = true
    } else if (args[i] === '--verbose') {
      options.verbose = true
    }
  }

  return options
}

/**
 * Main enrichment function
 */
async function main() {
  console.log('🚀 ThriftAI Product Enrichment')
  console.log('='.repeat(80))
  console.log()

  const options = parseArgs()

  // Show configuration
  console.log('⚙️  Configuration:')
  console.log(`   Limit: ${options.limit || 'All products'}`)
  console.log(`   Category: ${options.category || 'All categories'}`)
  console.log(`   Only Missing Data: ${options.onlyMissing ? 'Yes' : 'No'}`)
  console.log(`   Verbose: ${options.verbose ? 'Yes' : 'No'}`)
  console.log()

  // Get current enrichment statistics
  console.log('📊 Current Enrichment Status:')
  const statsBefore = await productEnrichmentService.getEnrichmentStats()
  console.log(`   Total Products: ${statsBefore.total}`)
  console.log(`   With Images: ${statsBefore.withImages} (${((statsBefore.withImages / statsBefore.total) * 100).toFixed(1)}%)`)
  console.log(`   With Specifications: ${statsBefore.withSpecs} (${((statsBefore.withSpecs / statsBefore.total) * 100).toFixed(1)}%)`)
  console.log(`   With Market Data: ${statsBefore.withMarketData} (${((statsBefore.withMarketData / statsBefore.total) * 100).toFixed(1)}%)`)
  console.log(`   Overall Completion: ${statsBefore.percentageComplete.toFixed(1)}%`)
  console.log()

  // Check for API keys
  console.log('🔑 Checking API Configuration:')
  const ebayAppId = process.env.EBAY_APP_ID
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

  if (!ebayAppId) {
    console.log('   ⚠️  EBAY_APP_ID not configured - eBay data will be limited')
  } else {
    console.log('   ✅ eBay API configured (5000 calls/day)')
  }

  if (!anthropicKey) {
    console.log('   ⚠️  ANTHROPIC_API_KEY not configured - AI features limited')
  } else {
    console.log('   ✅ Claude API configured')
  }
  console.log()

  // Start enrichment
  console.log('🔄 Starting Batch Enrichment...')
  console.log('='.repeat(80))
  console.log()

  const startTime = Date.now()

  try {
    const results = await productEnrichmentService.enrichAllProducts({
      limit: options.limit,
      category: options.category,
      onlyMissingData: options.onlyMissing,
      fetchImages: true,
      fetchSpecs: true,
      fetchMarketData: true,
      overwriteExisting: false,
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log()
    console.log('='.repeat(80))
    console.log('📊 ENRICHMENT SUMMARY')
    console.log('='.repeat(80))
    console.log()

    // Calculate statistics
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalImages = results.reduce((sum, r) => sum + r.imagesFetched, 0)
    const totalFields = results.reduce((sum, r) => sum + r.enrichedFields.length, 0)

    console.log(`✅ Successful: ${successful}/${results.length}`)
    console.log(`❌ Failed: ${failed}/${results.length}`)
    console.log(`📸 Images Fetched: ${totalImages}`)
    console.log(`📝 Fields Enriched: ${totalFields}`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`⚡ Speed: ${(results.length / parseFloat(duration)).toFixed(1)} products/sec`)
    console.log()

    // Show detailed results if verbose
    if (options.verbose) {
      console.log('📋 Detailed Results:')
      console.log('='.repeat(80))
      for (const result of results) {
        if (result.success) {
          console.log(`✅ ${result.productName}`)
          console.log(`   Images: ${result.imagesFetched}`)
          console.log(`   Fields: ${result.enrichedFields.join(', ') || 'none'}`)
          console.log(`   Sources: ${result.dataSources.join(', ') || 'none'}`)
        } else {
          console.log(`❌ ${result.productName}`)
          console.log(`   Error: ${result.error}`)
        }
        console.log()
      }
    }

    // Get updated statistics
    console.log('📊 Updated Enrichment Status:')
    const statsAfter = await productEnrichmentService.getEnrichmentStats()
    console.log(`   Total Products: ${statsAfter.total}`)
    console.log(`   With Images: ${statsAfter.withImages} (${((statsAfter.withImages / statsAfter.total) * 100).toFixed(1)}%)`)
    console.log(`   With Specifications: ${statsAfter.withSpecs} (${((statsAfter.withSpecs / statsAfter.total) * 100).toFixed(1)}%)`)
    console.log(`   With Market Data: ${statsAfter.withMarketData} (${((statsAfter.withMarketData / statsAfter.total) * 100).toFixed(1)}%)`)
    console.log(`   Overall Completion: ${statsAfter.percentageComplete.toFixed(1)}%`)
    console.log()

    // Show improvement
    const improvement = statsAfter.percentageComplete - statsBefore.percentageComplete
    console.log(`📈 Improvement: +${improvement.toFixed(1)}%`)
    console.log()

    console.log('✅ Enrichment completed successfully!')
    console.log()
    console.log('🎯 Next Steps:')
    console.log('   1. Check enriched products in the database')
    console.log('   2. Verify images are displaying correctly')
    console.log('   3. Test search with enriched products')
    console.log('   4. Calculate Veritas scores: npx tsx scripts/calculate-veritas-batch.ts')
    console.log()

  } catch (error) {
    console.error()
    console.error('💥 Enrichment failed:')
    console.error(error)
    console.error()
    throw error
  }
}

// Run script
main()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
