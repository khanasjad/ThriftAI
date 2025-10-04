#!/usr/bin/env npx tsx
/**
 * Product Data Scraping Script
 * Batch process products to fetch data from all scrapers
 *
 * Usage:
 *   npm run scrape:products
 *   OR
 *   npx tsx scripts/scrape-products.ts
 *   OR with options:
 *   npx tsx scripts/scrape-products.ts --limit 10 --category electronics
 */

import { prisma } from '../src/lib/prisma'
import { fetchAllProductData, getDataAvailability } from '../src/lib/dataFetcher'
import { logger } from '../src/lib/logger'

interface ScriptOptions {
  limit?: number
  category?: string
  productId?: string
}

async function parseArgs(): Promise<ScriptOptions> {
  const args = process.argv.slice(2)
  const options: ScriptOptions = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1])
      i++
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[i + 1]
      i++
    } else if (args[i] === '--product' && args[i + 1]) {
      options.productId = args[i + 1]
      i++
    }
  }

  return options
}

async function scrapeProductData(productId: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Scraping product: ${productId}`)
  console.log('='.repeat(80))

  try {
    // Fetch product from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    })

    if (!product) {
      console.error(`❌ Product not found: ${productId}`)
      return { success: false, productId }
    }

    console.log(`📦 Product: ${product.name}`)
    console.log(`🏷️  Category: ${product.category.name}`)
    console.log(`💰 Price: $${product.price}`)
    console.log(`\nFetching data from all sources...`)

    // Fetch all available data sources
    const startTime = Date.now()
    const data = await fetchAllProductData({
      name: product.name,
      brand: product.brand || undefined,
      serialNumber: undefined, // Could be added to product model
      serviceTag: undefined, // Could be added to product model
      category: product.category.name,
      asin: undefined, // Could be extracted from product name or added to model
    })
    const duration = Date.now() - startTime

    // Get data availability summary
    const availability = getDataAvailability(data)

    console.log(`\n✅ Data fetching completed in ${duration}ms`)
    console.log(`📊 Data Sources Available: ${availability.available}/${availability.total} (${availability.percentage.toFixed(1)}%)`)
    console.log(`🔍 Sources: ${availability.sources.join(', ')}`)

    // Log detailed results
    console.log('\n📋 Detailed Results:')

    if (data.warranty?.success) {
      console.log(`  ✅ Warranty: ${data.warranty.source}`)
      console.log(`     Status: ${data.warranty.data?.warrantyStatus || 'N/A'}`)
    } else {
      console.log(`  ❌ Warranty: Not available`)
    }

    if (data.specifications?.success) {
      console.log(`  ✅ Specifications: ${data.specifications.source}`)
      const specCount = Object.keys(data.specifications.data || {}).length
      console.log(`     Fields: ${specCount} parameters`)
    } else {
      console.log(`  ❌ Specifications: Not available`)
    }

    if (data.repairability?.success) {
      console.log(`  ✅ Repairability: ${data.repairability.source}`)
      console.log(`     Score: ${data.repairability.data?.score || 'N/A'}/10`)
    } else {
      console.log(`  ❌ Repairability: Not available`)
    }

    if (data.priceHistory?.success) {
      console.log(`  ✅ Price History: ${data.priceHistory.source}`)
      console.log(`     Current: $${data.priceHistory.data?.currentPrice || 'N/A'}`)
      console.log(`     Lowest: $${data.priceHistory.data?.lowestPrice || 'N/A'}`)
      console.log(`     Highest: $${data.priceHistory.data?.highestPrice || 'N/A'}`)
    } else {
      console.log(`  ❌ Price History: Not available`)
    }

    if (data.marketComparison?.walmart?.success) {
      console.log(`  ✅ Walmart: ${data.marketComparison.walmart.source}`)
      const walmartCount = data.marketComparison.walmart.data?.length || 0
      console.log(`     Products found: ${walmartCount}`)
      if (walmartCount > 0) {
        const avgPrice = data.marketComparison.walmart.data.reduce((sum: number, p: any) => sum + p.price, 0) / walmartCount
        console.log(`     Avg Price: $${avgPrice.toFixed(2)}`)
      }
    } else {
      console.log(`  ❌ Walmart: Not available`)
    }

    if (data.marketComparison?.target?.success) {
      console.log(`  ✅ Target: ${data.marketComparison.target.source}`)
      const targetCount = data.marketComparison.target.data?.length || 0
      console.log(`     Products found: ${targetCount}`)
      if (targetCount > 0) {
        const avgPrice = data.marketComparison.target.data.reduce((sum: number, p: any) => sum + p.price, 0) / targetCount
        console.log(`     Avg Price: $${avgPrice.toFixed(2)}`)
      }
    } else {
      console.log(`  ❌ Target: Not available`)
    }

    return {
      success: true,
      productId,
      availability: availability.percentage,
      duration,
      data,
    }
  } catch (error) {
    console.error(`\n❌ Error scraping product ${productId}:`, error)
    logger.error('Product scraping failed', {
      component: 'ScraperScript',
      metadata: { productId, error: error instanceof Error ? error.message : 'Unknown' },
    })

    return { success: false, productId, error }
  }
}

async function main() {
  console.log('🚀 ThriftAI Product Data Scraping Script')
  console.log('==========================================\n')

  const options = await parseArgs()

  try {
    let products: any[]

    // Single product mode
    if (options.productId) {
      const product = await prisma.product.findUnique({
        where: { id: options.productId },
      })
      products = product ? [product] : []
    }
    // Batch mode
    else {
      const where: any = {}
      if (options.category) {
        where.category = {
          name: {
            contains: options.category,
            mode: 'insensitive',
          },
        }
      }

      products = await prisma.product.findMany({
        where,
        take: options.limit || 10,
        orderBy: { createdAt: 'desc' },
      })
    }

    if (products.length === 0) {
      console.log('⚠️  No products found matching criteria')
      process.exit(0)
    }

    console.log(`📦 Found ${products.length} product(s) to process\n`)

    const results = []
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      console.log(`\n[${i + 1}/${products.length}] Processing product...`)

      const result = await scrapeProductData(product.id)
      results.push(result)

      // Rate limiting between products
      if (i < products.length - 1) {
        console.log('\n⏳ Waiting 10 seconds before next product...')
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }

    // Summary
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('📊 SCRAPING SUMMARY')
    console.log('='.repeat(80))

    const successful = results.filter(r => r.success).length
    const failed = results.length - successful
    const avgAvailability = results
      .filter(r => r.success && r.availability)
      .reduce((sum, r) => sum + (r.availability || 0), 0) / successful

    console.log(`Total Products: ${results.length}`)
    console.log(`Successful: ${successful} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Average Data Availability: ${avgAvailability.toFixed(1)}%`)

    if (failed > 0) {
      console.log(`\n❌ Failed Products:`)
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.productId}`))
    }

    console.log('\n✅ Scraping completed!')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Script encountered an error:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
