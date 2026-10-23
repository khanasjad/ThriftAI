/**
 * Demo script for Evidence Agent
 *
 * Run with: npx tsx src/lib/agents/evidence/demo-evidence-agent.ts
 */

import { extractEvidence } from './evidence-agent'
import { EvidenceExtractionInput } from './evidence-types'

// Sample reviews for testing
const sampleReviews: EvidenceExtractionInput[] = [
  {
    reviewText: `I absolutely love this t-shirt! The fabric is so soft and comfortable,
    and it fits true to size. I'm 5'6" and 140 lbs and ordered a medium - perfect fit.
    The quality is excellent - it's held up really well after 10 washes with no pilling
    or fading. Definitely worth the price.`,
    metadata: {
      sizePurchased: 'Medium',
      height: '5\'6"',
      weight: '140 lbs',
      bodyType: 'Average'
    }
  },
  {
    reviewText: `Runs SUPER small! I'm normally a size small but this was way too tight.
    Had to return and order a large. The fabric also feels kind of cheap and thin.
    For $45 I expected much better quality. The color also looks different than the photo -
    more of a washed out blue instead of the vibrant navy shown.`,
    metadata: {
      sizePurchased: 'Small',
      height: '5\'4"',
      bodyType: 'Slim'
    }
  },
  {
    reviewText: `This dress is beautiful and fits perfectly! Love that it's made from
    organic cotton. The company is transparent about their production process and it's
    fair trade certified. Feels good to support ethical fashion. Only downside is it
    wrinkles really easily, but I don't mind.`,
    metadata: {
      sizePurchased: 'Large'
    }
  },
  {
    reviewText: `Terrible quality. The stitching came undone after just ONE wash.
    The zipper broke within a week. Fabric started pilling immediately.
    Total waste of money. Don't buy!`,
    metadata: {
      sizePurchased: 'Medium'
    }
  }
]

async function runDemo() {
  console.log('========================================')
  console.log('Evidence Extraction Agent - Demo')
  console.log('========================================\n')

  for (let i = 0; i < sampleReviews.length; i++) {
    const review = sampleReviews[i]

    console.log(`\n--- Review ${i + 1} ---`)
    console.log(`Text: ${review.reviewText.substring(0, 100)}...`)
    console.log(`Metadata:`, review.metadata)
    console.log('\nExtracting evidence...\n')

    try {
      const result = await extractEvidence(review)

      console.log(`✓ Extracted ${result.evidence.length} pieces of evidence`)
      console.log(`  Processing time: ${result.processingTime}ms`)
      console.log(`  Factors covered: ${result.summary.factorsCovered.length}`)
      console.log(`  Pillars covered: ${result.summary.pillarsCovered.join(', ')}`)
      console.log(`  Average confidence: ${(result.summary.averageConfidence * 100).toFixed(1)}%`)

      console.log('\nEvidence extracted:')
      result.evidence.forEach((ev, idx) => {
        console.log(`\n  ${idx + 1}. ${ev.factor} (${ev.pillar})`)
        console.log(`     Signal: ${ev.signal}`)
        console.log(`     Sentiment: ${ev.sentiment.toFixed(2)}`)
        console.log(`     Confidence: ${(ev.confidence * 100).toFixed(1)}%`)
        console.log(`     Quote: "${ev.quote}"`)
        if (ev.explanation) {
          console.log(`     Why: ${ev.explanation}`)
        }
      })

      console.log('\n' + '='.repeat(60))
    } catch (error) {
      console.error(`✗ Failed to extract evidence:`, error)
    }
  }
}

// Check if ANTHROPIC_API_KEY is set
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable is not set')
  console.error('\nPlease set your Anthropic API key:')
  console.error('  export ANTHROPIC_API_KEY="your-api-key-here"')
  console.error('\nOr add it to your .env.local file:')
  console.error('  ANTHROPIC_API_KEY=your-api-key-here')
  process.exit(1)
}

// Run the demo
runDemo()
  .then(() => {
    console.log('\n✓ Demo completed successfully')
  })
  .catch((error) => {
    console.error('\n✗ Demo failed:', error)
    process.exit(1)
  })
