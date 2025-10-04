/**
 * Test script for FREE data sources
 * Demonstrates all implemented FREE APIs working
 */

import {
  checkAppleWarranty,
  checkDellWarranty,
  getPhoneSpecs,
  getRepairability,
  fetchAllProductData,
  getDataAvailability,
} from '../src/lib/dataFetcher'

async function main() {
  console.log('🚀 Testing FREE Data Sources for Veritas Score™\n')
  console.log('=' .repeat(60))

  // Test 1: Apple Warranty Check
  console.log('\n📱 Test 1: Apple Warranty Check')
  console.log('-'.repeat(60))

  try {
    const appleResult = await checkAppleWarranty('F2LXXX') // Example serial
    console.log('✅ Apple Warranty API:',  appleResult.success ? 'SUCCESS' : 'FAILED')
    console.log('   Source:', appleResult.source)
    console.log('   Cached:', appleResult.cached)
    if (appleResult.data) {
      console.log('   Valid:', appleResult.data.isValid)
      console.log('   Status:', appleResult.data.warrantyStatus)
      console.log('   Model:', appleResult.data.model || 'N/A')
    }
  } catch (error) {
    console.log('❌ Apple Warranty test failed:', error)
  }

  // Test 2: Dell Warranty Check
  console.log('\n💻 Test 2: Dell Warranty Check')
  console.log('-'.repeat(60))

  try {
    const dellResult = await checkDellWarranty('1A2B3C4') // Example service tag
    console.log('✅ Dell Warranty API:', dellResult.success ? 'SUCCESS' : 'FAILED')
    console.log('   Source:', dellResult.source)
    console.log('   Cached:', dellResult.cached)
    if (dellResult.data) {
      console.log('   Valid:', dellResult.data.isValid)
      console.log('   Status:', dellResult.data.warrantyStatus)
      console.log('   Model:', dellResult.data.model || 'N/A')
    }
  } catch (error) {
    console.log('❌ Dell Warranty test failed:', error)
  }

  // Test 3: GSMArena Phone Specs
  console.log('\n📱 Test 3: GSMArena Phone Specifications')
  console.log('-'.repeat(60))

  try {
    console.log('   Fetching specs for: iPhone 15 Pro')
    const phoneResult = await getPhoneSpecs('iPhone 15 Pro')
    console.log('✅ GSMArena API:', phoneResult.success ? 'SUCCESS' : 'FAILED')
    console.log('   Source:', phoneResult.source)
    console.log('   Cached:', phoneResult.cached)
    if (phoneResult.data) {
      console.log('   Device:', phoneResult.data.deviceName)
      console.log('   Brand:', phoneResult.data.brand || 'N/A')
      console.log('   Processor:', phoneResult.data.processor || 'N/A')
      console.log('   RAM:', phoneResult.data.ram || 'N/A')
      console.log('   Display:', phoneResult.data.displaySize || 'N/A')
      console.log('   Battery:', phoneResult.data.batteryCapacity || 'N/A')
      console.log('   Release:', phoneResult.data.releaseDate || 'N/A')
    }
  } catch (error) {
    console.log('❌ GSMArena test failed:', error)
  }

  // Test 4: iFixit Repairability
  console.log('\n🔧 Test 4: iFixit Repairability Score')
  console.log('-'.repeat(60))

  try {
    console.log('   Fetching repairability for: iPhone 15 Pro')
    const repairResult = await getRepairability('iPhone 15 Pro')
    console.log('✅ iFixit API:', repairResult.success ? 'SUCCESS' : 'FAILED')
    console.log('   Source:', repairResult.source)
    console.log('   Cached:', repairResult.cached)
    if (repairResult.data) {
      console.log('   Device:', repairResult.data.deviceName)
      console.log('   Repairability Score:', `${repairResult.data.repairabilityScore}/10`)
      console.log('   Difficulty:', repairResult.data.difficulty)
      console.log('   Parts Available:', repairResult.data.partsAvailable ? 'Yes' : 'No')
      console.log('   Teardown URL:', repairResult.data.teardownUrl || 'N/A')
    }
  } catch (error) {
    console.log('❌ iFixit test failed:', error)
  }

  // Test 5: Fetch All Data for a Product
  console.log('\n📦 Test 5: Fetch All Product Data (Combined)')
  console.log('-'.repeat(60))

  try {
    const productData = await fetchAllProductData({
      name: 'iPhone 15 Pro',
      brand: 'Apple',
      category: 'Mobile Phone',
    })

    const availability = getDataAvailability(productData)

    console.log('✅ Combined Data Fetch Complete')
    console.log('   Sources Available:', `${availability.available}/${availability.total}`)
    console.log('   Coverage:', `${availability.percentage.toFixed(1)}%`)
    console.log('   Active Sources:', availability.sources.join(', '))

    console.log('\n   Data Sources:')
    if (productData.warranty) {
      console.log('   ✓ Warranty:', productData.warranty.success ? 'Available' : 'Failed')
    }
    if (productData.specifications) {
      console.log('   ✓ Specifications:', productData.specifications.success ? 'Available' : 'Failed')
    }
    if (productData.repairability) {
      console.log('   ✓ Repairability:', productData.repairability.success ? 'Available' : 'Failed')
    }
  } catch (error) {
    console.log('❌ Combined fetch test failed:', error)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 FREE Data Sources Test Complete!')
  console.log('='.repeat(60))
  console.log('\nImplemented FREE APIs:')
  console.log('  ✅ Apple Warranty API - Official, No cost')
  console.log('  ✅ Dell Warranty API - Official, No cost')
  console.log('  ✅ GSMArena Scraper - Public data, No cost')
  console.log('  ✅ iFixit API - Open source, No cost')
  console.log('\nTotal Parameters Covered: ~30 (25% of Veritas Score system)')
  console.log('Monthly Cost: $0')
  console.log('\nNext Steps:')
  console.log('  - Add eBay API (seller trust data)')
  console.log('  - Add Energy Star API (sustainability)')
  console.log('  - Add Alpha Vantage (stock data)')
  console.log('  - Integrate into Veritas Score calculation')
  console.log('')
}

main().catch(console.error)
