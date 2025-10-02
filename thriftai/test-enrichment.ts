/**
 * Test Parameter Enrichment Service
 *
 * Run with: npx tsx test-enrichment.ts
 */

import { parameterEnrichmentService } from './src/lib/services/parameterEnrichmentService'
import { ProductData } from './src/lib/services/aiProductScorer'

async function testEnrichment() {
  console.log('🧪 Testing Parameter Enrichment Service\n')

  // Test product with minimal data
  const testProduct: ProductData = {
    id: 'test-001',
    name: 'Apple MacBook Pro 14"',
    brand: 'Apple',
    category: 'ELECTRONICS',
    price: 1999,
    originalPrice: 2399,
    condition: 'excellent',
    description: 'M3 Pro chip, 18GB RAM, 512GB SSD'
  }

  console.log('📦 Test Product (Before Enrichment):')
  console.log('  - ID:', testProduct.id)
  console.log('  - Name:', testProduct.name)
  console.log('  - Brand:', testProduct.brand)
  console.log('  - Category:', testProduct.category)
  console.log('  - Has Company Metrics:', !!(testProduct as any).companyMetrics)
  console.log('  - Has Dynamic Specs:', !!testProduct.dynamicSpecs)
  console.log()

  // Enrich the product
  console.log('🔧 Enriching product with 96 parameters...')
  const enrichedProduct = await parameterEnrichmentService.enrichProduct(testProduct)

  console.log()
  console.log('✅ Enriched Product (After Enrichment):')
  console.log('  - ID:', enrichedProduct.id)
  console.log('  - Name:', enrichedProduct.name)
  console.log('  - Has Company Metrics:', !!enrichedProduct.companyMetrics)
  console.log('  - Has Dynamic Specs:', !!enrichedProduct.dynamicSpecs)
  console.log()

  // Validate enrichment
  const validation = parameterEnrichmentService.validateEnrichment(enrichedProduct)
  console.log('📊 Validation Results:')
  console.log('  - Is Complete:', validation.isComplete)
  console.log('  - Total Parameters:', validation.totalParameters)
  console.log('  - Completeness:', validation.completenessPercentage + '%')
  console.log('  - Missing Parameters:', validation.missingParameters.length)
  if (validation.missingParameters.length > 0) {
    console.log('    ', validation.missingParameters.slice(0, 5).join(', '), '...')
  }
  console.log()

  // Display Company Metrics
  if (enrichedProduct.companyMetrics) {
    console.log('💼 Company Metrics (Sample):')
    console.log('  - Stock Price:', enrichedProduct.companyMetrics.stockPrice || 'N/A')
    console.log('  - ESG Score:', enrichedProduct.companyMetrics.esgScore || 'N/A')
    console.log('  - Market Cap:', enrichedProduct.companyMetrics.marketCap ? `$${enrichedProduct.companyMetrics.marketCap}B` : 'N/A')
    console.log('  - Fair Labor Score:', enrichedProduct.companyMetrics.fairLabor || 'N/A')
    console.log('  - Data Source:', enrichedProduct.companyMetrics.dataSource || 'N/A')
    console.log()
  }

  // Display Dynamic Specs
  if (enrichedProduct.dynamicSpecs) {
    console.log('⚙️  Dynamic Specs (Electronics):')
    const specs = enrichedProduct.dynamicSpecs
    console.log('  - All fields:', Object.keys(specs).join(', '))
    if (typeof specs === 'object') {
      console.log('  - CPU:', (specs as any).cpu || 'N/A')
      console.log('  - RAM:', (specs as any).ram || 'N/A')
      console.log('  - Storage:', (specs as any).storage || 'N/A')
      console.log('  - Screen Size:', (specs as any).screenSize ? `${(specs as any).screenSize}"` : 'N/A')
      console.log('  - Battery Life:', (specs as any).batteryLife ? `${(specs as any).batteryLife}h` : 'N/A')
    }
    console.log()
  }

  console.log('✅ Test completed successfully!')
}

// Run the test
testEnrichment().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
