/**
 * Scraper Usage Examples
 * Demonstrates how to use each scraper in production
 */

import {
  getAmazonPriceHistory,
  getAmazonPriceStats,
  searchWalmartProducts,
  getWalmartProduct,
  searchTargetProducts,
  getTargetProduct,
} from './index'

/**
 * Example 1: Get Amazon Price History for Veritas Score
 *
 * Use Case: Get historical pricing data to calculate market value score
 * Parameters Enhanced:
 * - Current Market Price
 * - Lowest Price (30/60/90 days)
 * - Price Volatility
 * - Savings Percentage
 */
export async function example1_AmazonPriceHistory() {
  console.log('\n=== Example 1: Amazon Price History ===\n')

  // Get price history for AirPods Pro 2nd Gen
  const asin = 'B0CHWRXH8B'
  const result = await getAmazonPriceHistory(asin, 'Apple AirPods Pro 2nd Gen')

  if (result.success && result.data) {
    console.log(`Product: ${result.data.productName}`)
    console.log(`Current Price: $${result.data.currentPrice}`)
    console.log(`Lowest Price: $${result.data.lowestPrice}`)
    console.log(`Highest Price: $${result.data.highestPrice}`)
    console.log(`Average Price: $${result.data.averagePrice?.toFixed(2)}`)
    console.log(`Price History: ${result.data.priceHistory.length} data points`)
    console.log(`Cached: ${result.cached}`)

    // Use in Veritas Score calculation
    const savingsPercent = result.data.currentPrice && result.data.highestPrice
      ? ((result.data.highestPrice - result.data.currentPrice) / result.data.highestPrice) * 100
      : 0

    console.log(`\n💰 Market Value Score Component:`)
    console.log(`   Savings: ${savingsPercent.toFixed(1)}%`)
    console.log(`   Data Quality: ${result.data.priceHistory.length > 30 ? 'High' : 'Medium'}`)
  } else {
    console.error(`Error: ${result.error}`)
  }
}

/**
 * Example 2: Compare Walmart Prices
 *
 * Use Case: Find market comparables for pricing analysis
 * Parameters Enhanced:
 * - Competitive Pricing Data
 * - Product Specifications
 * - Availability Status
 * - Customer Ratings
 */
export async function example2_WalmartSearch() {
  console.log('\n=== Example 2: Walmart Price Comparison ===\n')

  // Search for laptops to find market comparables
  const result = await searchWalmartProducts('dell laptop')

  if (result.success && result.data) {
    console.log(`Found ${result.data.length} products`)
    console.log(`Cached: ${result.cached}\n`)

    // Display top 5 results
    const top5 = result.data.slice(0, 5)
    top5.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`)
      console.log(`   Price: $${product.price}`)
      console.log(`   Rating: ${product.rating || 'N/A'} ⭐ (${product.reviewCount || 0} reviews)`)
      console.log(`   Available: ${product.availability ? 'Yes' : 'No'}`)
      console.log()
    })

    // Calculate market average
    const avgPrice = result.data.reduce((sum, p) => sum + p.price, 0) / result.data.length
    console.log(`📊 Market Analysis:`)
    console.log(`   Average Price: $${avgPrice.toFixed(2)}`)
    console.log(`   Price Range: $${Math.min(...result.data.map(p => p.price))} - $${Math.max(...result.data.map(p => p.price))}`)
  } else {
    console.error(`Error: ${result.error}`)
  }
}

/**
 * Example 3: Target Product Analysis
 *
 * Use Case: Get detailed product specifications and ratings
 * Parameters Enhanced:
 * - Product Specifications
 * - Brand Information
 * - Customer Reviews
 * - Image URLs
 */
export async function example3_TargetProductDetails() {
  console.log('\n=== Example 3: Target Product Analysis ===\n')

  // Search for coffee makers
  const searchResult = await searchTargetProducts('keurig coffee maker')

  if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
    const firstProduct = searchResult.data[0]

    console.log(`Product: ${firstProduct.name}`)
    console.log(`Price: $${firstProduct.price}`)
    console.log(`Rating: ${firstProduct.rating || 'N/A'} ⭐`)
    console.log(`Reviews: ${firstProduct.reviewCount || 0}`)
    console.log(`Brand: ${firstProduct.brand || 'N/A'}`)
    console.log(`Available: ${firstProduct.availability ? 'Yes' : 'No'}`)
    console.log(`URL: ${firstProduct.productUrl}`)

    // Specifications
    if (firstProduct.specifications && Object.keys(firstProduct.specifications).length > 0) {
      console.log(`\n📋 Specifications:`)
      Object.entries(firstProduct.specifications).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`)
      })
    }

    // Quality score calculation example
    const qualityScore = (firstProduct.rating || 0) * 20 // Convert 5-star to 100-point scale
    console.log(`\n⭐ Product Quality Score: ${qualityScore}/100`)
  } else {
    console.error(`Error: ${searchResult.error || 'No products found'}`)
  }
}

/**
 * Example 4: Comprehensive Product Analysis
 *
 * Use Case: Combine all scrapers for complete market analysis
 * This demonstrates the revolutionary algorithm approach
 */
export async function example4_ComprehensiveAnalysis(
  productName: string,
  amazonAsin?: string
) {
  console.log('\n=== Example 4: Comprehensive Market Analysis ===\n')
  console.log(`Analyzing: ${productName}\n`)

  const analysis: any = {
    product: productName,
    sources: [],
    priceHistory: null,
    competitors: [],
    marketStats: {},
  }

  // 1. Get Amazon price history if ASIN provided
  if (amazonAsin) {
    console.log('📊 Fetching Amazon price history...')
    const priceHistory = await getAmazonPriceHistory(amazonAsin, productName)

    if (priceHistory.success && priceHistory.data) {
      analysis.priceHistory = {
        current: priceHistory.data.currentPrice,
        lowest: priceHistory.data.lowestPrice,
        highest: priceHistory.data.highestPrice,
        average: priceHistory.data.averagePrice,
        dataPoints: priceHistory.data.priceHistory.length,
      }
      analysis.sources.push('CamelCamelCamel')
      console.log('   ✅ Price history retrieved')
    }
  }

  // Wait to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 2. Search Walmart for competitors
  console.log('🏪 Searching Walmart...')
  const walmartResults = await searchWalmartProducts(productName)

  if (walmartResults.success && walmartResults.data && walmartResults.data.length > 0) {
    analysis.competitors.push({
      source: 'Walmart',
      count: walmartResults.data.length,
      avgPrice: walmartResults.data.reduce((sum, p) => sum + p.price, 0) / walmartResults.data.length,
      minPrice: Math.min(...walmartResults.data.map(p => p.price)),
      maxPrice: Math.max(...walmartResults.data.map(p => p.price)),
    })
    analysis.sources.push('Walmart')
    console.log(`   ✅ Found ${walmartResults.data.length} products`)
  }

  // Wait to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 3. Search Target for competitors
  console.log('🎯 Searching Target...')
  const targetResults = await searchTargetProducts(productName)

  if (targetResults.success && targetResults.data && targetResults.data.length > 0) {
    analysis.competitors.push({
      source: 'Target',
      count: targetResults.data.length,
      avgPrice: targetResults.data.reduce((sum, p) => sum + p.price, 0) / targetResults.data.length,
      minPrice: Math.min(...targetResults.data.map(p => p.price)),
      maxPrice: Math.max(...targetResults.data.map(p => p.price)),
    })
    analysis.sources.push('Target')
    console.log(`   ✅ Found ${targetResults.data.length} products`)
  }

  // 4. Calculate market statistics
  if (analysis.competitors.length > 0) {
    const allPrices = [
      ...analysis.competitors.map((c: any) => c.avgPrice),
      analysis.priceHistory?.current || 0,
    ].filter(p => p > 0)

    analysis.marketStats = {
      overallAverage: allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length,
      overallMin: Math.min(...allPrices),
      overallMax: Math.max(...allPrices),
      dataSources: analysis.sources.length,
      totalProducts: analysis.competitors.reduce((sum: number, c: any) => sum + c.count, 0),
    }
  }

  // 5. Print comprehensive report
  console.log('\n' + '='.repeat(80))
  console.log('COMPREHENSIVE MARKET ANALYSIS REPORT')
  console.log('='.repeat(80))
  console.log(`Product: ${analysis.product}`)
  console.log(`Data Sources: ${analysis.sources.join(', ')}`)
  console.log()

  if (analysis.priceHistory) {
    console.log('📊 Price History (Amazon):')
    console.log(`   Current: $${analysis.priceHistory.current}`)
    console.log(`   Lowest: $${analysis.priceHistory.lowest}`)
    console.log(`   Highest: $${analysis.priceHistory.highest}`)
    console.log(`   Average: $${analysis.priceHistory.average?.toFixed(2)}`)
    console.log(`   History: ${analysis.priceHistory.dataPoints} data points`)
    console.log()
  }

  if (analysis.competitors.length > 0) {
    console.log('🏪 Competitor Analysis:')
    analysis.competitors.forEach((comp: any) => {
      console.log(`   ${comp.source}:`)
      console.log(`      Products: ${comp.count}`)
      console.log(`      Avg Price: $${comp.avgPrice.toFixed(2)}`)
      console.log(`      Range: $${comp.minPrice} - $${comp.maxPrice}`)
    })
    console.log()
  }

  if (Object.keys(analysis.marketStats).length > 0) {
    console.log('📈 Market Statistics:')
    console.log(`   Overall Average: $${analysis.marketStats.overallAverage.toFixed(2)}`)
    console.log(`   Price Range: $${analysis.marketStats.overallMin} - $${analysis.marketStats.overallMax}`)
    console.log(`   Total Data Sources: ${analysis.marketStats.dataSources}`)
    console.log(`   Total Products Analyzed: ${analysis.marketStats.totalProducts}`)
    console.log()
  }

  console.log('='.repeat(80))

  return analysis
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await example1_AmazonPriceHistory()
    await new Promise(resolve => setTimeout(resolve, 3000))

    await example2_WalmartSearch()
    await new Promise(resolve => setTimeout(resolve, 3000))

    await example3_TargetProductDetails()
    await new Promise(resolve => setTimeout(resolve, 3000))

    await example4_ComprehensiveAnalysis('Apple AirPods Pro', 'B0CHWRXH8B')
  } catch (error) {
    console.error('Error running examples:', error)
  }
}

// Export individual examples for selective testing
export default {
  example1_AmazonPriceHistory,
  example2_WalmartSearch,
  example3_TargetProductDetails,
  example4_ComprehensiveAnalysis,
  runAllExamples,
}
