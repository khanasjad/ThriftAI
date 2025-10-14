/**
 * Generate Parameter Enrichment Impact Report
 * Shows comprehensive statistics on enrichment and score improvements
 */

import { prisma } from '../src/lib/prisma'
import { logger } from '../src/lib/logger'

async function generateImpactReport() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 PARAMETER ENRICHMENT IMPACT REPORT')
  console.log('='.repeat(80))

  // Overall statistics
  const totalProducts = await prisma.product.count({ where: { isAvailable: true } })
  const scoredProducts = await prisma.product.count({
    where: { isAvailable: true, aiScore: { not: null } }
  })

  const avgScore = await prisma.product.aggregate({
    where: { isAvailable: true, aiScore: { not: null } },
    _avg: { aiScore: true },
    _min: { aiScore: true },
    _max: { aiScore: true }
  })

  console.log('\n📈 OVERALL STATISTICS:')
  console.log('  Total Products: ' + totalProducts)
  console.log('  Scored Products: ' + scoredProducts)
  console.log('  Coverage: ' + ((scoredProducts / totalProducts) * 100).toFixed(1) + '%')
  console.log('  Average Veritas Score: ' + avgScore._avg.aiScore?.toFixed(2) + '/100')
  console.log('  Min Score: ' + avgScore._min.aiScore?.toFixed(2))
  console.log('  Max Score: ' + avgScore._max.aiScore?.toFixed(2))

  // Category breakdown
  console.log('\n📂 CATEGORY BREAKDOWN:')
  const categories = ['ELECTRONICS', 'CLOTHING', 'SHOES', 'ACCESSORIES', 'BEAUTY', 'HOME', 'SPORTS', 'TOYS']

  for (const category of categories) {
    const count = await prisma.product.count({
      where: { isAvailable: true, category, aiScore: { not: null } }
    })

    const categoryAvg = await prisma.product.aggregate({
      where: { isAvailable: true, category, aiScore: { not: null } },
      _avg: { aiScore: true }
    })

    console.log('  ' + category + ':')
    console.log('    - Products: ' + count)
    console.log('    - Avg Score: ' + (categoryAvg._avg.aiScore?.toFixed(2) || 'N/A'))
  }

  // Parameter enrichment stats
  console.log('\n🎯 PARAMETER ENRICHMENT:')
  const enrichedProducts = await prisma.product.findMany({
    where: { isAvailable: true, dynamicSpecs: { not: null } },
    select: { dynamicSpecs: true, category: true }
  })

  let totalParams = 0
  let enrichedCount = 0
  const categoryParams: Record<string, number[]> = {}

  for (const product of enrichedProducts) {
    const specs = product.dynamicSpecs as any
    const paramCount = Object.keys(specs || {}).length

    if (paramCount > 2) {
      totalParams += paramCount
      enrichedCount++

      const cat = product.category || 'UNKNOWN'
      if (!categoryParams[cat]) {
        categoryParams[cat] = []
      }
      categoryParams[cat].push(paramCount)
    }
  }

  console.log('  Total Enriched: ' + enrichedCount + '/' + totalProducts)
  console.log('  Enrichment Rate: ' + ((enrichedCount / totalProducts) * 100).toFixed(1) + '%')
  console.log('  Avg Parameters per Product: ' + (totalParams / enrichedCount).toFixed(1))

  console.log('\n📋 PARAMETERS BY CATEGORY:')
  for (const [cat, params] of Object.entries(categoryParams)) {
    const avgParams = params.reduce((a, b) => a + b, 0) / params.length
    const minParams = Math.min(...params)
    const maxParams = Math.max(...params)
    console.log('  ' + cat + ':')
    console.log('    - Avg Parameters: ' + avgParams.toFixed(1))
    console.log('    - Range: ' + minParams + '-' + maxParams)
  }

  // Top performers
  console.log('\n🏆 TOP 10 PRODUCTS:')
  const topProducts = await prisma.product.findMany({
    where: { isAvailable: true, aiScore: { not: null } },
    select: { name: true, brand: true, category: true, aiScore: true },
    orderBy: { aiScore: 'desc' },
    take: 10
  })

  topProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (${p.category}) - ${p.aiScore?.toFixed(2)}/100`)
  })

  // Sample enriched product
  console.log('\n📱 SAMPLE ENRICHED PRODUCT:')
  const sample = await prisma.product.findFirst({
    where: {
      isAvailable: true,
      name: { contains: 'iPhone 15 Pro Max' }
    },
    select: {
      name: true,
      brand: true,
      category: true,
      aiScore: true,
      dynamicSpecs: true
    }
  })

  if (sample) {
    console.log('  Product: ' + sample.name)
    console.log('  Brand: ' + sample.brand)
    console.log('  Category: ' + sample.category)
    console.log('  Veritas Score: ' + sample.aiScore?.toFixed(2) + '/100')

    const specs = sample.dynamicSpecs as any
    const paramCount = Object.keys(specs || {}).length
    console.log('  Total Parameters: ' + paramCount)
    console.log('\n  Sample Parameters:')

    const sampleKeys = Object.keys(specs || {}).slice(0, 15)
    sampleKeys.forEach(key => {
      if (!key.startsWith('_')) {
        console.log(`    - ${key}: ${specs[key]}`)
      }
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ IMPACT REPORT COMPLETE')
  console.log('='.repeat(80) + '\n')

  process.exit(0)
}

generateImpactReport().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
