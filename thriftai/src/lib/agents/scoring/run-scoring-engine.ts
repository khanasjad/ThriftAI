#!/usr/bin/env tsx
/**
 * CLI tool for running the Scoring Engine
 *
 * Usage:
 *   npx tsx src/lib/agents/scoring/run-scoring-engine.ts [options]
 *
 * Options:
 *   --product <id>     Score specific product ID
 *   --all              Score all products with evidence
 *   --no-save          Don't save to database (dry run)
 *   --help, -h         Show help message
 *
 * Examples:
 *   # Score specific product
 *   npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product abc123
 *
 *   # Score all products
 *   npx tsx src/lib/agents/scoring/run-scoring-engine.ts --all
 *
 *   # Dry run (calculate but don't save)
 *   npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product abc123 --no-save
 */

import { scoreProduct, scoreAllProducts } from './scoring-engine'
import { formatProductScore } from './product-scorer'

async function main() {
  const args = process.argv.slice(2)

  let productId: string | undefined
  let scoreAll = false
  let saveToDatabase = true

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--product':
        productId = args[++i]
        break
      case '--all':
        scoreAll = true
        break
      case '--no-save':
        saveToDatabase = false
        break
      case '--help':
      case '-h':
        console.log(`
Scoring Engine CLI

Usage:
  npx tsx src/lib/agents/scoring/run-scoring-engine.ts [options]

Options:
  --product <id>     Score specific product ID
  --all              Score all products with evidence
  --no-save          Don't save to database (dry run)
  --help, -h         Show this help message

Examples:
  # Score specific product
  npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product abc123

  # Score all products
  npx tsx src/lib/agents/scoring/run-scoring-engine.ts --all

  # Dry run (calculate but don't save)
  npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product abc123 --no-save
`)
        process.exit(0)
      default:
        console.error(`Unknown option: ${arg}`)
        console.error('Run with --help for usage information')
        process.exit(1)
    }
  }

  // Validate arguments
  if (!productId && !scoreAll) {
    console.error('Error: Must specify either --product or --all')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  console.log('🚀 Starting Scoring Engine...\n')

  try {
    if (productId) {
      // Score single product
      console.log(`Scoring product: ${productId}`)
      console.log(`Save to DB: ${saveToDatabase}\n`)

      const result = await scoreProduct(productId, { saveToDatabase })

      if (result.error) {
        console.error(`❌ Error scoring product:`, result.error)
        process.exit(1)
      }

      console.log('✅ Scoring complete!\n')
      console.log(formatProductScore(result.productScore))

      if (result.saved) {
        console.log('\n💾 Score saved to database')
      } else {
        console.log('\n⚠️  Score not saved (dry run mode)')
      }
    } else if (scoreAll) {
      // Score all products
      console.log(`Scoring all products with evidence`)
      console.log(`Save to DB: ${saveToDatabase}\n`)

      const results = await scoreAllProducts({ saveToDatabase })

      console.log(`\n✅ Scoring complete!`)
      console.log(`\n📊 Summary:`)
      console.log(`   Total products: ${results.length}`)
      console.log(`   Successful: ${results.filter(r => !r.error).length}`)
      console.log(`   Failed: ${results.filter(r => r.error).length}`)
      console.log(`   Saved to DB: ${results.filter(r => r.saved).length}`)

      // Show grade distribution
      const gradeDistribution = results.reduce((acc, r) => {
        if (r.productScore) {
          acc[r.productScore.grade] = (acc[r.productScore.grade] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      console.log(`\n📈 Grade Distribution:`)
      Object.entries(gradeDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([grade, count]) => {
          console.log(`   ${grade}: ${count}`)
        })

      // Show average score
      const avgScore = results
        .filter(r => r.productScore)
        .reduce((sum, r) => sum + r.productScore.overall, 0) / results.length

      console.log(`\n🎯 Average Score: ${avgScore.toFixed(1)}/100`)
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Scoring failed:', error)
    process.exit(1)
  }
}

main()
