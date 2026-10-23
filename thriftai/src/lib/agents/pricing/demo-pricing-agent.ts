/**
 * Demo script for Price & Value Agent
 *
 * Run with: npx tsx src/lib/agents/pricing/demo-pricing-agent.ts
 */

import {
  comparePrices,
  generateMockPrices,
  formatPriceComparison
} from './price-comparison'
import {
  generatePriceFairnessEvidence,
  formatPriceEvidence
} from './price-evidence-generator'

// Sample products with different pricing scenarios
const sampleProducts = [
  {
    id: 'demo-product-1',
    name: 'Organic Cotton T-Shirt',
    brandPrice: 28.00,
    description: 'Best price in market'
  },
  {
    id: 'demo-product-2',
    name: 'Premium Denim Jeans',
    brandPrice: 89.00,
    description: 'Fair market price'
  },
  {
    id: 'demo-product-3',
    name: 'Cashmere Sweater',
    brandPrice: 165.00,
    description: 'Above market average'
  },
  {
    id: 'demo-product-4',
    name: 'Designer Jacket',
    brandPrice: 350.00,
    description: 'Significantly overpriced'
  }
]

async function runDemo() {
  console.log('========================================')
  console.log('Price & Value Agent - Demo')
  console.log('========================================\n')

  for (let i = 0; i < sampleProducts.length; i++) {
    const product = sampleProducts[i]

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Product ${i + 1}: ${product.name}`)
    console.log(`Expected: ${product.description}`)
    console.log('='.repeat(60))

    // Generate mock competitor prices
    const competitorPrices = generateMockPrices(product.brandPrice, 4)

    // Manually adjust prices to create specific scenarios
    if (i === 0) {
      // Scenario 1: Best price - make brand price lowest
      competitorPrices.forEach(cp => {
        cp.price = product.brandPrice + (Math.random() * 10) + 5
      })
    } else if (i === 1) {
      // Scenario 2: Fair price - brand price near average
      const prices = [26, 30, 32, 28]
      competitorPrices.forEach((cp, idx) => {
        cp.price = product.brandPrice * (prices[idx] / 28)
      })
    } else if (i === 2) {
      // Scenario 3: Above average - brand price higher than most
      competitorPrices.forEach((cp, idx) => {
        cp.price = product.brandPrice * (0.85 + (idx * 0.05))
      })
    } else if (i === 3) {
      // Scenario 4: Overpriced - brand price much higher than all
      competitorPrices.forEach(cp => {
        cp.price = product.brandPrice * 0.65
      })
    }

    // Round prices to 2 decimals
    competitorPrices.forEach(cp => {
      cp.price = Math.round(cp.price * 100) / 100
    })

    console.log(`\nBrand Price: $${product.brandPrice.toFixed(2)}`)
    console.log(`Competitor Prices:`)
    competitorPrices.forEach(cp => {
      console.log(`  ${cp.retailer}: $${cp.price.toFixed(2)}`)
    })

    // Compare prices
    const comparison = comparePrices(product.id, product.brandPrice, competitorPrices)

    console.log(`\n${formatPriceComparison(comparison)}`)

    // Generate evidence
    const evidence = generatePriceFairnessEvidence(comparison)

    console.log('='.repeat(60))
    console.log('Evidence Generated for Factor 14 (Price Fairness):')
    console.log('='.repeat(60))
    console.log(formatPriceEvidence(evidence))
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✓ Demo completed successfully')
  console.log('='.repeat(60))

  // Summary
  console.log('\n📊 Summary of Pricing Scenarios:\n')
  console.log('Scenario 1: Best Price')
  console.log('  - Brand has lowest price in market')
  console.log('  - Evidence: best_price, sentiment: +1.0\n')

  console.log('Scenario 2: Fair Price')
  console.log('  - Brand price near market average')
  console.log('  - Evidence: fair_price, sentiment: +0.6 to +0.8\n')

  console.log('Scenario 3: Above Average')
  console.log('  - Brand price higher than most competitors')
  console.log('  - Evidence: better_price_elsewhere, sentiment: -0.3 to -0.7\n')

  console.log('Scenario 4: Overpriced')
  console.log('  - Brand price significantly above market')
  console.log('  - Evidence: overpriced, sentiment: -1.0\n')

  console.log('💡 Key Insights:')
  console.log('  - Fairness score (0-100) based on market position')
  console.log('  - Evidence automatically generated for Factor 14')
  console.log('  - Sentiment ranges from -1.0 (overpriced) to +1.0 (best price)')
  console.log('  - Confidence based on # of comparisons and price consistency\n')
}

// Run the demo
runDemo()
  .then(() => {
    console.log('✅ Demo execution complete')
  })
  .catch((error) => {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  })
