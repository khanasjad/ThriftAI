/**
 * Enrich Products with Real Parameters
 * Scrapes and populates 25+ category-specific parameters for all products
 *
 * Usage:
 *   npx tsx scripts/enrich-products-with-parameters.ts --category ELECTRONICS --limit 10
 *   npx tsx scripts/enrich-products-with-parameters.ts --all --batch 10
 */

import { prisma } from '../src/lib/prisma'
import { urlBasedScraper } from '../src/lib/services/urlBasedScraper'
import { logger } from '../src/lib/logger'
import { calculateParameterCompleteness } from '../src/config/categoryParameters'

interface EnrichmentStats {
  totalProcessed: number
  successful: number
  failed: number
  avgCompleteness: number
  avgParameterCount: number
  categoryBreakdown: Record<string, {
    count: number
    avgCompleteness: number
    avgParams: number
  }>
}

async function enrichProducts(options: {
  category?: string
  limit?: number
  batch?: number
  all?: boolean
}) {
  const startTime = Date.now()
  logger.info('🚀 Starting product enrichment', options)

  try {
    // Build query
    const where: any = {
      isAvailable: true
    }

    if (options.category) {
      where.category = options.category
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        dynamicSpecs: true
      },
      take: options.limit || undefined,
      orderBy: {
        createdAt: 'asc'
      }
    })

    logger.info(`📦 Found ${products.length} products to enrich`)

    if (products.length === 0) {
      logger.warn('⚠️  No products found matching criteria')
      return
    }

    // Extract parameters for all products
    const batchSize = options.batch || 10
    const scrapedResults = []

    logger.info(`📦 Processing ${products.length} products in batches of ${batchSize}`)

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      logger.info(`🔄 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`)

      const batchResults = await Promise.all(
        batch.map(async (p) => {
          const result = await urlBasedScraper.extractParameters({
            id: p.id,
            name: p.name,
            brand: p.brand || 'Unknown',
            category: p.category || 'GENERAL'
          })

          return {
            productId: p.id,
            productName: p.name,
            brand: p.brand || 'Unknown',
            category: p.category || 'GENERAL',
            parameters: result.parameters,
            sourceUrls: ['Knowledge Base'],
            scrapedAt: new Date(),
            completeness: result.completeness,
            success: result.success,
            error: result.error
          }
        })
      )

      scrapedResults.push(...batchResults)
    }

    // Update database with scraped parameters
    logger.info('💾 Updating database with scraped parameters...')

    const stats: EnrichmentStats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      avgCompleteness: 0,
      avgParameterCount: 0,
      categoryBreakdown: {}
    }

    let totalCompleteness = 0
    let totalParams = 0

    for (let i = 0; i < scrapedResults.length; i++) {
      const result = scrapedResults[i]
      const product = products[i]

      try {
        if (result.success && Object.keys(result.parameters).length > 0) {
          // Merge with existing dynamicSpecs
          const existingSpecs = (product.dynamicSpecs as any) || {}
          const mergedSpecs = {
            ...existingSpecs,
            ...result.parameters,
            _enrichedAt: new Date().toISOString(),
            _sourceUrls: result.sourceUrls,
            _completeness: result.completeness
          }

          // Update product
          await prisma.product.update({
            where: { id: product.id },
            data: {
              dynamicSpecs: mergedSpecs as any
            }
          })

          stats.successful++
          totalCompleteness += result.completeness
          totalParams += Object.keys(result.parameters).length

          // Track category breakdown
          if (!stats.categoryBreakdown[product.category || 'GENERAL']) {
            stats.categoryBreakdown[product.category || 'GENERAL'] = {
              count: 0,
              avgCompleteness: 0,
              avgParams: 0
            }
          }
          stats.categoryBreakdown[product.category || 'GENERAL'].count++

          logger.info(`✅ [${i + 1}/${products.length}] Enriched: ${product.name}`, {
            parameters: Object.keys(result.parameters).length,
            completeness: result.completeness.toFixed(1) + '%'
          })
        } else {
          stats.failed++
          logger.warn(`❌ [${i + 1}/${products.length}] Failed: ${product.name}`, {
            error: result.error
          })
        }

        stats.totalProcessed++

      } catch (error) {
        stats.failed++
        logger.error(`❌ Database update failed for ${product.name}`, {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Calculate final stats
    if (stats.successful > 0) {
      stats.avgCompleteness = totalCompleteness / stats.successful
      stats.avgParameterCount = totalParams / stats.successful

      // Calculate category averages
      for (const result of scrapedResults) {
        if (result.success && stats.categoryBreakdown[result.category]) {
          const cat = stats.categoryBreakdown[result.category]
          cat.avgCompleteness = (cat.avgCompleteness * (cat.count - 1) + result.completeness) / cat.count
          cat.avgParams = (cat.avgParams * (cat.count - 1) + Object.keys(result.parameters).length) / cat.count
        }
      }
    }

    // Print final report
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    logger.info('\n' + '='.repeat(80))
    logger.info('📊 ENRICHMENT SUMMARY')
    logger.info('='.repeat(80))
    logger.info(`Total Processed: ${stats.totalProcessed}`)
    logger.info(`✅ Successful: ${stats.successful}`)
    logger.info(`❌ Failed: ${stats.failed}`)
    logger.info(`📈 Avg Completeness: ${stats.avgCompleteness.toFixed(1)}%`)
    logger.info(`📋 Avg Parameters: ${stats.avgParameterCount.toFixed(1)}`)
    logger.info(`⏱️  Duration: ${duration}s`)
    logger.info('\n📂 CATEGORY BREAKDOWN:')

    Object.entries(stats.categoryBreakdown).forEach(([category, data]) => {
      logger.info(`  ${category}:`)
      logger.info(`    - Products: ${data.count}`)
      logger.info(`    - Avg Completeness: ${data.avgCompleteness.toFixed(1)}%`)
      logger.info(`    - Avg Parameters: ${data.avgParams.toFixed(1)}`)
    })

    logger.info('='.repeat(80) + '\n')

  } catch (error) {
    logger.error('❌ Enrichment failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Parse CLI arguments
const args = process.argv.slice(2)
const options: any = {
  batch: 10 // Default batch size
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]

  if (arg === '--category' && args[i + 1]) {
    options.category = args[i + 1].toUpperCase()
    i++
  } else if (arg === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1], 10)
    i++
  } else if (arg === '--batch' && args[i + 1]) {
    options.batch = parseInt(args[i + 1], 10)
    i++
  } else if (arg === '--all') {
    options.all = true
  }
}

// Validate
if (!options.category && !options.all) {
  console.error('❌ Error: Must specify --category or --all')
  console.error('\nUsage:')
  console.error('  npx tsx scripts/enrich-products-with-parameters.ts --category ELECTRONICS --limit 10')
  console.error('  npx tsx scripts/enrich-products-with-parameters.ts --all --batch 10')
  process.exit(1)
}

// Run enrichment
enrichProducts(options)
  .then(() => {
    logger.info('✅ Enrichment completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('❌ Enrichment failed', error)
    process.exit(1)
  })
