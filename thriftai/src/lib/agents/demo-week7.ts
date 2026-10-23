/**
 * Week 7 Demo: Natural Language Search & Conversation
 *
 * Run with: npx tsx src/lib/agents/demo-week7.ts
 *
 * Demonstrates:
 * 1. Query Understanding Agent - Natural language to structured search
 * 2. Score Explanation Agent - Explain product scores
 * 3. Conversation Manager - Multi-turn dialogue
 */

import { understandQuery } from './query/query-agent'
import { explainScore, compareProducts } from './explanation/explanation-agent'
import { conversationManager } from './conversation/conversation-manager'
import { QueryIntent } from './query/query-types'

// Sample queries to test
const sampleQueries = [
  {
    query: 'Show me sustainable jeans under $100',
    description: 'Price filter + sustainability requirement'
  },
  {
    query: 'I need a durable jacket for hiking',
    description: 'Quality signal + use case'
  },
  {
    query: 'Wide leg jeans from Everlane that run true to size',
    description: 'Brand + style + fit signal'
  },
  {
    query: 'Why did this product get a low score?',
    description: 'Explanation request'
  },
  {
    query: 'Compare these two jackets',
    description: 'Comparison request'
  },
  {
    query: 'What does "fabric quality" mean in your scoring?',
    description: 'General question about system'
  }
]

async function runDemo() {
  console.log('========================================')
  console.log('Week 7 Demo: Natural Language Search')
  console.log('========================================\n')

  // ==========================================================================
  // PART 1: QUERY UNDERSTANDING AGENT
  // ==========================================================================
  console.log('PART 1: Query Understanding Agent')
  console.log('=' .repeat(70))
  console.log('Demonstrates natural language understanding and structured search generation\n')

  for (let i = 0; i < sampleQueries.length; i++) {
    const { query, description } = sampleQueries[i]

    console.log(`\nQuery ${i + 1}: "${query}"`)
    console.log(`Type: ${description}`)
    console.log('-'.repeat(70))

    try {
      const understanding = await understandQuery({ query })

      console.log(`\n✓ Intent: ${understanding.intent}`)
      console.log(`✓ Confidence: ${(understanding.confidence * 100).toFixed(1)}%`)

      if (understanding.semanticQuery) {
        console.log(`✓ Semantic Query: "${understanding.semanticQuery}"`)
      }

      // Show extracted entities
      if (Object.values(understanding.entities).some(arr => arr.length > 0)) {
        console.log('\n📋 Extracted Entities:')
        if (understanding.entities.productTypes.length > 0) {
          console.log(`  Product Types: ${understanding.entities.productTypes.join(', ')}`)
        }
        if (understanding.entities.brands.length > 0) {
          console.log(`  Brands: ${understanding.entities.brands.join(', ')}`)
        }
        if (understanding.entities.styles.length > 0) {
          console.log(`  Styles: ${understanding.entities.styles.join(', ')}`)
        }
        if (understanding.entities.colors.length > 0) {
          console.log(`  Colors: ${understanding.entities.colors.join(', ')}`)
        }
        if (understanding.entities.sustainabilitySignals.length > 0) {
          console.log(`  Sustainability: ${understanding.entities.sustainabilitySignals.join(', ')}`)
        }
        if (understanding.entities.qualitySignals.length > 0) {
          console.log(`  Quality: ${understanding.entities.qualitySignals.join(', ')}`)
        }
        if (understanding.entities.fitSignals.length > 0) {
          console.log(`  Fit: ${understanding.entities.fitSignals.join(', ')}`)
        }
      }

      // Show generated filters
      if (Object.keys(understanding.filters).length > 0) {
        console.log('\n🔍 Generated Filters:')
        if (understanding.filters.categories) {
          console.log(`  Categories: ${understanding.filters.categories.join(', ')}`)
        }
        if (understanding.filters.priceMin !== undefined || understanding.filters.priceMax !== undefined) {
          console.log(`  Price Range: $${understanding.filters.priceMin || 0} - $${understanding.filters.priceMax || '∞'}`)
        }
        if (understanding.filters.brands) {
          console.log(`  Brands: ${understanding.filters.brands.join(', ')}`)
        }
        if (understanding.filters.minOverallScore) {
          console.log(`  Min Overall Score: ${understanding.filters.minOverallScore}`)
        }
        if (understanding.filters.minPillarScores) {
          console.log(`  Min Pillar Scores:`)
          for (const [pillar, score] of Object.entries(understanding.filters.minPillarScores)) {
            console.log(`    ${pillar}: ${score}`)
          }
        }
        if (understanding.filters.sustainabilityRequired) {
          console.log(`  Sustainability Required: Yes`)
        }
        if (understanding.filters.fitPreferences) {
          console.log(`  Fit Preferences:`, understanding.filters.fitPreferences)
        }
        if (understanding.filters.sortBy) {
          console.log(`  Sort By: ${understanding.filters.sortBy}`)
        }
      }

      // Show clarifications if needed
      if (understanding.clarificationNeeded && understanding.clarificationNeeded.length > 0) {
        console.log('\n⚠️  Clarification Needed:')
        understanding.clarificationNeeded.forEach(q => {
          console.log(`  - ${q}`)
        })
      }

      // Show suggested refinements
      if (understanding.suggestedRefinements && understanding.suggestedRefinements.length > 0) {
        console.log('\n💡 Suggested Refinements:')
        understanding.suggestedRefinements.forEach(r => {
          console.log(`  - ${r}`)
        })
      }

      console.log(`\n⏱️  Processing Time: ${understanding.processingTime}ms`)
    } catch (error) {
      console.error(`\n❌ Failed to understand query:`, error instanceof Error ? error.message : error)
    }
  }

  // ==========================================================================
  // PART 2: SCORE EXPLANATION AGENT (Simulated)
  // ==========================================================================
  console.log('\n\n' + '='.repeat(70))
  console.log('PART 2: Score Explanation Agent (Simulated)')
  console.log('='.repeat(70))
  console.log('Demonstrates natural language explanations for product scores\n')

  console.log('NOTE: This requires actual product data in the database.')
  console.log('In production, this would:')
  console.log('  1. Fetch ProductScore and FactorScores from database')
  console.log('  2. Generate natural language explanation')
  console.log('  3. Identify strengths and weaknesses')
  console.log('  4. Provide personalized recommendations\n')

  console.log('Example Output:')
  console.log('-'.repeat(70))
  console.log('Product: Everlane Wide Leg Organic Jeans')
  console.log('Overall Score: 85.4/100 (Grade B)')
  console.log('')
  console.log('This is an excellent product with outstanding quality across most areas.')
  console.log('')
  console.log('Strengths:')
  console.log('  • Outstanding fit & sizing (82.9%)')
  console.log('  • Outstanding quality & durability (94.0%)')
  console.log('  • True to size')
  console.log('')
  console.log('Weaknesses:')
  console.log('  • Below average style & value (75.0%)')
  console.log('')
  console.log('Recommendations:')
  console.log('  • This is a high-quality product worth considering for purchase')
  console.log('  • Pay close attention to sizing - consider reading detailed fit reviews')

  // ==========================================================================
  // PART 3: CONVERSATION MANAGER (Simulated)
  // ==========================================================================
  console.log('\n\n' + '='.repeat(70))
  console.log('PART 3: Conversation Manager')
  console.log('='.repeat(70))
  console.log('Demonstrates multi-turn conversation with context retention\n')

  const conversationId = conversationManager.startConversation()

  const conversationFlow = [
    'Show me sustainable jeans',
    'What about under $80?',
    'Explain the score for the first one',
    'How do you calculate quality scores?'
  ]

  console.log(`Starting Conversation (ID: ${conversationId})\n`)

  for (let i = 0; i < conversationFlow.length; i++) {
    const userMessage = conversationFlow[i]

    console.log(`User: "${userMessage}"`)
    console.log('-'.repeat(70))

    try {
      const response = await conversationManager.processMessage(
        conversationId,
        userMessage
      )

      console.log(`Assistant (Intent: ${response.intent}):`)
      console.log(response.message)

      if (response.suggestions && response.suggestions.length > 0) {
        console.log('\nSuggestions:')
        response.suggestions.forEach(s => {
          console.log(`  • ${s}`)
        })
      }

      console.log('')
    } catch (error) {
      console.error(`\n❌ Failed to process message:`, error instanceof Error ? error.message : error)
    }
  }

  // Show conversation state
  const conversation = conversationManager.getConversation(conversationId)
  if (conversation) {
    console.log('\n' + '-'.repeat(70))
    console.log(`Conversation Summary:`)
    console.log(`  Total Messages: ${conversation.messages.length}`)
    console.log(`  Last Intent: ${conversation.context.lastIntent || 'none'}`)
    console.log(`  Started: ${conversation.createdAt.toLocaleTimeString()}`)
    console.log(`  Last Updated: ${conversation.updatedAt.toLocaleTimeString()}`)
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n\n' + '='.repeat(70))
  console.log('Week 7 Summary')
  console.log('='.repeat(70))
  console.log('')
  console.log('✅ Query Understanding Agent:')
  console.log('   - Converts natural language to structured search filters')
  console.log('   - Extracts entities (products, brands, colors, etc.)')
  console.log('   - Detects intent (search, compare, explain, etc.)')
  console.log('   - Provides clarifications and refinement suggestions')
  console.log('')
  console.log('✅ Score Explanation Agent:')
  console.log('   - Generates natural language explanations for scores')
  console.log('   - Identifies strengths and weaknesses')
  console.log('   - Provides personalized recommendations')
  console.log('   - Supports product comparisons')
  console.log('')
  console.log('✅ Conversation Manager:')
  console.log('   - Maintains multi-turn conversation context')
  console.log('   - Routes to appropriate agents based on intent')
  console.log('   - Tracks conversation history and user preferences')
  console.log('   - Handles follow-up questions intelligently')
  console.log('')
  console.log('📊 Integration Ready:')
  console.log('   - Works with existing vector search (Qdrant + pgvector)')
  console.log('   - Integrates with 27-factor scoring system')
  console.log('   - Ready for API endpoint implementation')
  console.log('   - Supports conversational product discovery')
  console.log('')
  console.log('🎯 Next Steps:')
  console.log('   - Create API endpoints (/api/v1/query, /api/v1/conversation)')
  console.log('   - Integrate with real product database')
  console.log('   - Add caching for query understanding results')
  console.log('   - Implement user preference learning')
  console.log('   - Add search result ranking based on scores')
  console.log('')
}

// Run the demo
runDemo()
  .then(() => {
    console.log('\n✅ Demo completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  })
