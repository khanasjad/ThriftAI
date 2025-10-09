/**
 * Test Claude Search Components
 * Tests Claude intent extraction and result explanation (without embeddings)
 */

import { claudeIntentExtractor } from '../src/lib/services/claudeIntentExtractor'
import { logger } from '../src/lib/logger'

async function testClaudeIntentExtraction() {
  console.log('🧪 Testing Claude Intent Extraction\n')

  const testQueries = [
    'lookng for vintge handbag undr $500',
    'tshrt for men',
    'best tech deals under $100',
    'sustainable fashion options'
  ]

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`)
    console.log('─'.repeat(60))

    try {
      const intent = await claudeIntentExtractor.extractIntent({
        messages: [],
        currentQuery: query
      })

      console.log('✅ Intent Extracted Successfully:')
      console.log(`   Normalized: "${intent.normalizedQuery}"`)
      console.log(`   Intent: ${intent.intent}`)
      console.log(`   Confidence: ${(intent.confidence * 100).toFixed(1)}%`)

      if (intent.hardFilters.maxPrice || intent.hardFilters.minPrice) {
        console.log(`   Price Range: $${intent.hardFilters.minPrice || 0} - $${intent.hardFilters.maxPrice || '∞'}`)
      }

      if (intent.hardFilters.category) {
        console.log(`   Category: ${intent.hardFilters.category}`)
      }

      if (intent.softPreferences.brands && intent.softPreferences.brands.length > 0) {
        console.log(`   Brands: ${intent.softPreferences.brands.join(', ')}`)
      }

      if (intent.keywords.length > 0) {
        console.log(`   Keywords: ${intent.keywords.join(', ')}`)
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    }
  }
}

async function main() {
  console.log('🚀 Claude Search Component Test\n')
  console.log('Testing Claude Haiku 3.5 for intent extraction...\n')

  try {
    await testClaudeIntentExtraction()

    console.log('\n' + '═'.repeat(60))
    console.log('✅ All tests completed!')
    console.log('═'.repeat(60))
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

main()
