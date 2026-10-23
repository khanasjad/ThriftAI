/**
 * Demo script for Trend & Brand Agent
 *
 * Run with: npx tsx src/lib/agents/trends/demo-trend-agent.ts
 */

import {
  analyzeBrandReputation,
  generateBrandReputationEvidence,
  formatBrandReputation
} from './brand-analyzer'
import {
  analyzeTrendRelevance,
  generateTrendRelevanceEvidence,
  formatTrendRelevance
} from './trend-analyzer'

// Sample products with different brands and styles
const sampleProducts = [
  {
    id: 'product-1',
    name: 'Wide Leg Organic Jeans',
    brand: 'Everlane',
    category: 'jeans',
    style: 'wide leg jeans organic denim',
    description: 'On-trend, trusted brand'
  },
  {
    id: 'product-2',
    name: 'Sustainable Maxi Dress',
    brand: 'Reformation',
    category: 'dress',
    style: 'maxi dress sustainable',
    description: 'Timeless, sustainable brand'
  },
  {
    id: 'product-3',
    name: 'Classic Denim Jacket',
    brand: 'Patagonia',
    category: 'outerwear',
    style: 'denim jacket classic',
    description: 'Timeless, excellent reputation'
  },
  {
    id: 'product-4',
    name: 'Skinny Jeans',
    brand: 'Shein',
    style: 'skinny jeans fast fashion',
    category: 'jeans',
    description: 'Declining trend, poor reputation'
  }
]

async function runDemo() {
  console.log('========================================')
  console.log('Trend & Brand Agent - Demo')
  console.log('========================================\n')

  for (let i = 0; i < sampleProducts.length; i++) {
    const product = sampleProducts[i]

    console.log(`\n${'='.repeat(70)}`)
    console.log(`Product ${i + 1}: ${product.name}`)
    console.log(`Expected: ${product.description}`)
    console.log('='.repeat(70))

    // =========================================================================
    // FACTOR 15: BRAND REPUTATION
    // =========================================================================
    console.log(`\n--- Factor 15: Brand Reputation (${product.brand}) ---\n`)

    const brandReputation = analyzeBrandReputation(
      `brand-${i + 1}`,
      product.brand,
      true  // Use mock data
    )

    console.log(formatBrandReputation(brandReputation))

    const brandEvidence = generateBrandReputationEvidence(
      product.id,
      brandReputation
    )

    console.log('\n📋 Evidence for Factor 15:')
    console.log(`  Signal: ${brandEvidence.signal}`)
    console.log(`  Sentiment: ${brandEvidence.sentiment.toFixed(2)}`)
    console.log(`  Confidence: ${(brandEvidence.confidence * 100).toFixed(1)}%`)
    console.log(`  Quote: "${brandEvidence.quote}"`)

    // =========================================================================
    // FACTOR 17: TREND RELEVANCE
    // =========================================================================
    console.log(`\n--- Factor 17: Trend Relevance ---\n`)

    const trendRelevance = analyzeTrendRelevance(
      product.id,
      product.category,
      product.style,
      true  // Use mock data
    )

    console.log(formatTrendRelevance(trendRelevance))

    const trendEvidence = generateTrendRelevanceEvidence(
      product.id,
      trendRelevance
    )

    console.log('\n📋 Evidence for Factor 17:')
    console.log(`  Signal: ${trendEvidence.signal}`)
    console.log(`  Sentiment: ${trendEvidence.sentiment.toFixed(2)}`)
    console.log(`  Confidence: ${(trendEvidence.confidence * 100).toFixed(1)}%`)
    console.log(`  Quote: "${trendEvidence.quote}"`)
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log('✓ Demo completed successfully')
  console.log('='.repeat(70))

  // Summary
  console.log('\n📊 Summary:\n')
  console.log('Factor 15 - Brand Reputation:')
  console.log('  • Excellent brands (Everlane, Reformation, Patagonia): +0.7 to +1.0 sentiment')
  console.log('  • Poor reputation brands (Shein): -0.8 sentiment')
  console.log('  • Based on customer satisfaction, sustainability, ethics, transparency\n')

  console.log('Factor 17 - Trend Relevance:')
  console.log('  • On-trend (wide leg jeans): +0.7 sentiment')
  console.log('  • Timeless (classic pieces): +1.0 sentiment')
  console.log('  • Declining trends (skinny jeans): -0.8 sentiment')
  console.log('  • Considers trend phase, longevity, and market popularity\n')

  console.log('💡 Key Insights:')
  console.log('  • Both factors contribute 3 points each to Style & Value pillar (20 total)')
  console.log('  • Combined impact: ~6% of overall product score')
  console.log('  • Evidence automatically generated and saved to EvidenceTag table')
  console.log('  • Integrates seamlessly with Scoring Engine\n')
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
