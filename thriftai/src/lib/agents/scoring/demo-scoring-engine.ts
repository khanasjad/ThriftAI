/**
 * Demo script for Scoring Engine
 *
 * Run with: npx tsx src/lib/agents/scoring/demo-scoring-engine.ts
 */

import { calculateProductScore, formatProductScore } from './product-scorer'
import type { EvidenceData } from './factor-scorer'

// Sample evidence for a high-quality product
const excellentProductEvidence: EvidenceData[] = [
  // Fit evidence (positive)
  { factor: 'fit.true_to_size', signal: 'true_to_size', sentiment: 1.0, confidence: 0.9 },
  { factor: 'fit.true_to_size', signal: 'true_to_size', sentiment: 1.0, confidence: 0.95 },
  { factor: 'fit.size_consistency', signal: 'consistent_sizing', sentiment: 1.0, confidence: 0.85 },
  { factor: 'fit.body_shape_match', signal: 'fits_curvy', sentiment: 0.5, confidence: 0.8 },
  { factor: 'fit.length_proportions', signal: 'perfect_length', sentiment: 1.0, confidence: 0.9 },

  // Quality evidence (positive)
  { factor: 'quality.fabric', signal: 'premium_fabric', sentiment: 1.0, confidence: 0.95 },
  { factor: 'quality.fabric', signal: 'soft_fabric', sentiment: 0.8, confidence: 0.9 },
  { factor: 'quality.construction', signal: 'excellent_stitching', sentiment: 1.0, confidence: 0.9 },
  { factor: 'quality.wash_durability', signal: 'holds_up_well', sentiment: 1.0, confidence: 0.85 },
  { factor: 'quality.wear_resistance', signal: 'no_pilling', sentiment: 1.0, confidence: 0.9 },
  { factor: 'quality.longevity', signal: 'lasted_years', sentiment: 1.0, confidence: 0.95 },

  // Style & Value evidence (positive)
  { factor: 'style_value.value_for_money', signal: 'great_value', sentiment: 1.0, confidence: 0.85 },
  { factor: 'style_value.looks_as_pictured', signal: 'matches_photo', sentiment: 1.0, confidence: 0.9 },
  { factor: 'style_value.versatility', signal: 'very_versatile', sentiment: 1.0, confidence: 0.8 },

  // Comfort evidence (positive)
  { factor: 'comfort.softness', signal: 'very_soft', sentiment: 1.0, confidence: 0.95 },
  { factor: 'comfort.breathability', signal: 'breathable', sentiment: 1.0, confidence: 0.85 },
  { factor: 'comfort.stretch_mobility', signal: 'great_stretch', sentiment: 1.0, confidence: 0.9 },

  // Sustainability evidence (bonus points)
  { factor: 'sustainability.material_certs', signal: 'organic_cotton', sentiment: 1.0, confidence: 0.9 },
  { factor: 'sustainability.ethical_production', signal: 'fair_trade', sentiment: 1.0, confidence: 0.85 }
]

// Sample evidence for a poor-quality product
const poorProductEvidence: EvidenceData[] = [
  // Fit evidence (negative)
  { factor: 'fit.true_to_size', signal: 'runs_small', sentiment: -0.7, confidence: 0.9 },
  { factor: 'fit.true_to_size', signal: 'runs_very_small', sentiment: -1.0, confidence: 0.85 },
  { factor: 'fit.size_consistency', signal: 'inconsistent_sizing', sentiment: -1.0, confidence: 0.8 },
  { factor: 'fit.return_rate_fit', signal: 'returned_too_small', sentiment: -1.0, confidence: 0.9 },

  // Quality evidence (negative)
  { factor: 'quality.fabric', signal: 'cheap_fabric', sentiment: -1.0, confidence: 0.95 },
  { factor: 'quality.fabric', signal: 'thin_fabric', sentiment: -0.7, confidence: 0.9 },
  { factor: 'quality.construction', signal: 'poor_stitching', sentiment: -1.0, confidence: 0.9 },
  { factor: 'quality.construction', signal: 'seams_coming_apart', sentiment: -1.0, confidence: 0.85 },
  { factor: 'quality.wash_durability', signal: 'shrinks', sentiment: -1.0, confidence: 0.9 },
  { factor: 'quality.wash_durability', signal: 'color_fades', sentiment: -0.8, confidence: 0.85 },
  { factor: 'quality.wear_resistance', signal: 'pills_immediately', sentiment: -1.0, confidence: 0.95 },
  { factor: 'quality.return_rate_quality', signal: 'returned_poor_quality', sentiment: -1.0, confidence: 0.9 },

  // Style & Value evidence (negative)
  { factor: 'style_value.value_for_money', signal: 'overpriced', sentiment: -1.0, confidence: 0.85 },
  { factor: 'style_value.looks_as_pictured', signal: 'color_different', sentiment: -0.8, confidence: 0.8 }
]

// Sample evidence for a mixed-review product
const mixedProductEvidence: EvidenceData[] = [
  // Fit - mostly positive
  { factor: 'fit.true_to_size', signal: 'true_to_size', sentiment: 1.0, confidence: 0.9 },
  { factor: 'fit.true_to_size', signal: 'runs_small', sentiment: -0.7, confidence: 0.7 },
  { factor: 'fit.size_consistency', signal: 'consistent_sizing', sentiment: 1.0, confidence: 0.8 },

  // Quality - mixed
  { factor: 'quality.fabric', signal: 'soft_fabric', sentiment: 0.8, confidence: 0.85 },
  { factor: 'quality.construction', signal: 'excellent_stitching', sentiment: 1.0, confidence: 0.8 },
  { factor: 'quality.wash_durability', signal: 'wrinkles_easily', sentiment: -0.5, confidence: 0.7 },
  { factor: 'quality.wear_resistance', signal: 'pills_moderate', sentiment: -0.6, confidence: 0.75 },

  // Style & Value - good value but style issues
  { factor: 'style_value.value_for_money', signal: 'fair_price', sentiment: 0.7, confidence: 0.8 },
  { factor: 'style_value.looks_as_pictured', signal: 'looks_different', sentiment: -0.9, confidence: 0.85 },

  // Comfort - positive
  { factor: 'comfort.softness', signal: 'comfortable', sentiment: 0.9, confidence: 0.85 },
  { factor: 'comfort.breathability', signal: 'breathable', sentiment: 1.0, confidence: 0.8 }
]

async function runDemo() {
  console.log('========================================')
  console.log('Scoring Engine - Demo')
  console.log('========================================\n')

  const scenarios = [
    {
      name: 'Excellent Product (High Quality)',
      evidence: excellentProductEvidence,
      reviewCount: 50
    },
    {
      name: 'Poor Product (Low Quality)',
      evidence: poorProductEvidence,
      reviewCount: 35
    },
    {
      name: 'Mixed Reviews Product',
      evidence: mixedProductEvidence,
      reviewCount: 20
    },
    {
      name: 'New Launch (Insufficient Data)',
      evidence: mixedProductEvidence.slice(0, 3),
      reviewCount: 5
    }
  ]

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i]

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Scenario ${i + 1}: ${scenario.name}`)
    console.log('='.repeat(60))
    console.log(`Evidence count: ${scenario.evidence.length}`)
    console.log(`Review count: ${scenario.reviewCount}\n`)

    const productScore = calculateProductScore(
      `demo-product-${i + 1}`,
      scenario.evidence,
      scenario.reviewCount
    )

    console.log(formatProductScore(productScore))

    // Show detailed factor breakdown for first scenario
    if (i === 0) {
      console.log('\n📋 Detailed Factor Breakdown:')
      if (productScore.pillars.fit) {
        console.log('\n  FIT PILLAR:')
        productScore.pillars.fit.factors.forEach(f => {
          if (f.evidenceCount > 0) {
            console.log(`    ${f.factor}: ${f.percentage.toFixed(1)}% (${f.evidenceCount} evidence)`)
          }
        })
      }
      if (productScore.pillars.quality) {
        console.log('\n  QUALITY PILLAR:')
        productScore.pillars.quality.factors.forEach(f => {
          if (f.evidenceCount > 0) {
            console.log(`    ${f.factor}: ${f.percentage.toFixed(1)}% (${f.evidenceCount} evidence)`)
          }
        })
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✓ Demo completed successfully')
  console.log('='.repeat(60))
}

// Run the demo
runDemo()
  .then(() => {
    console.log('\n✅ All scenarios processed')
  })
  .catch((error) => {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  })
