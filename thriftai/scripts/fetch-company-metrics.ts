/**
 * Company Metrics Batch Fetch Script
 *
 * Fetches and caches company metrics for all brands in the database.
 * Uses Alpha Vantage API for stock data and ESG data providers.
 *
 * Usage:
 *   npx tsx scripts/fetch-company-metrics.ts
 *   npx tsx scripts/fetch-company-metrics.ts --force  # Bypass cache
 *   npx tsx scripts/fetch-company-metrics.ts --brands Apple,Nike,Samsung  # Specific brands
 */

import { prisma } from '../src/lib/prisma'
import { companyMetricsService } from '../src/lib/services/companyMetricsService'
import { logger } from '../src/lib/logger'

async function main() {
  const args = process.argv.slice(2)
  const forceRefresh = args.includes('--force')
  const brandsIndex = args.indexOf('--brands')
  const specificBrands = brandsIndex !== -1 ? args[brandsIndex + 1].split(',') : undefined

  console.log('\n📊 Fetching Company Metrics')
  console.log('============================\n')

  if (forceRefresh) {
    console.log('⚠️  FORCE MODE: Will bypass cache and refresh all metrics\n')
  }

  if (specificBrands) {
    console.log(`🎯 TARGET BRANDS: ${specificBrands.join(', ')}\n`)
  }

  try {
    // Get unique brands from database
    let brands: string[]

    if (specificBrands) {
      brands = specificBrands
    } else {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT DISTINCT brand
        FROM products
        WHERE brand IS NOT NULL
          AND brand != ''
          AND is_available = true
        ORDER BY brand
      `)
      brands = result.map(r => r.brand)
    }

    console.log(`🏢 Found ${brands.length} unique brands\n`)

    if (brands.length === 0) {
      console.log('⚠️  No brands found in database\n')
      return
    }

    // Fetch metrics for each brand
    let successful = 0
    let failed = 0
    let cached = 0
    const errors: Array<{ brand: string; error: string }> = []
    const startTime = Date.now()

    console.log('🔄 Fetching company metrics...\n')

    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i]
      const progress = ((i / brands.length) * 100).toFixed(1)

      try {
        process.stdout.write(`\r📈 Progress: ${progress}% (${i}/${brands.length}) - ${brand.padEnd(20)}`)

        const metrics = await companyMetricsService.getCompanyMetrics(brand, {
          skipCache: forceRefresh
        })

        if (metrics) {
          successful++

          // Check if it was from cache
          const wasCached = await companyMetricsService.isCached(brand)
          if (wasCached && !forceRefresh) {
            cached++
          }

          // Log interesting findings
          if (metrics.esgScore && metrics.esgScore >= 80) {
            console.log(`\n🌱 High ESG: ${brand} - ESG Score: ${metrics.esgScore}/100`)
          }
          if (metrics.stockPerformance30d && metrics.stockPerformance30d >= 20) {
            console.log(`\n📈 Strong Growth: ${brand} - 30d: +${metrics.stockPerformance30d.toFixed(1)}%`)
          }
        } else {
          failed++
          console.log(`\n⚠️  No data: ${brand}`)
        }

      } catch (error) {
        failed++
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push({ brand, error: errorMsg })
        console.log(`\n❌ Failed: ${brand} - ${errorMsg}`)
      }

      // Rate limiting: wait between API calls
      if ((i + 1) % 5 === 0 && !forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n\n✅ Fetch Complete!')
    console.log('==================\n')
    console.log(`✅ Successful: ${successful}`)
    console.log(`💾 From Cache: ${cached}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Time: ${totalTime}s`)

    if (successful > 0) {
      const avgTime = ((Date.now() - startTime) / successful).toFixed(0)
      console.log(`⚡ Avg Time per Brand: ${avgTime}ms`)
    }

    // Show cache statistics
    const cacheStats = await companyMetricsService.getCacheStatistics()
    console.log('\n💾 Cache Statistics:')
    console.log(`   Total Cached: ${cacheStats.totalCached}`)
    console.log(`   Fresh (< 24h): ${cacheStats.fresh}`)
    console.log(`   Stale (> 24h): ${cacheStats.stale}`)

    // Update products with company metrics
    console.log('\n🔄 Updating product records with company metrics...')

    let productsUpdated = 0
    for (const brand of brands.slice(0, Math.min(brands.length, successful))) {
      try {
        const metrics = await companyMetricsService.getCompanyMetrics(brand)
        if (metrics) {
          const result = await prisma.$executeRawUnsafe(`
            UPDATE products
            SET company_metrics = $1::jsonb
            WHERE brand = $2
              AND is_available = true
          `, JSON.stringify(metrics), brand)

          // @ts-ignore
          productsUpdated += result || 0
        }
      } catch (error) {
        // Silent fail - already logged above
      }
    }

    console.log(`✅ Updated ${productsUpdated} product records\n`)

    if (errors.length > 0) {
      console.log('\n⚠️  Errors:')
      errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.brand}: ${err.error}`)
      })
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`)
      }
    }

    console.log('\n💡 Next Steps:')
    console.log('   1. Run: npx tsx scripts/score-all-products.ts')
    console.log('   2. Company metrics will be included in AI scoring')

    console.log('\n📊 API Usage:')
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      console.log('   ✅ Alpha Vantage: Configured')
    } else {
      console.log('   ⚠️  Alpha Vantage: Not configured (using mock data)')
    }

    console.log('\n🎉 Done!\n')

  } catch (error) {
    console.error('\n❌ Fatal Error:', error)
    logger.error('Company metrics fetch script failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
