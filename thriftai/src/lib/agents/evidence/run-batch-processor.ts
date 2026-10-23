#!/usr/bin/env tsx
/**
 * CLI tool for running batch evidence extraction
 *
 * Usage:
 *   npx tsx src/lib/agents/evidence/run-batch-processor.ts [options]
 *
 * Options:
 *   --product <id>     Process specific product ID
 *   --limit <n>        Limit number of reviews to process
 *   --concurrency <n>  Number of parallel requests (default: 5)
 *   --no-save          Don't save to database (dry run)
 *   --reprocess        Process all reviews, even if already processed
 *
 * Examples:
 *   # Process all unprocessed reviews
 *   npx tsx src/lib/agents/evidence/run-batch-processor.ts
 *
 *   # Process specific product
 *   npx tsx src/lib/agents/evidence/run-batch-processor.ts --product abc123
 *
 *   # Dry run on first 10 reviews
 *   npx tsx src/lib/agents/evidence/run-batch-processor.ts --limit 10 --no-save
 */

import { processBatch, BatchProcessorOptions } from './batch-processor'

async function main() {
  const args = process.argv.slice(2)

  const options: BatchProcessorOptions = {
    concurrency: 5,
    saveToDatabase: true,
    skipProcessed: true
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--product':
        options.productId = args[++i]
        break
      case '--limit':
        options.limit = parseInt(args[++i])
        break
      case '--concurrency':
        options.concurrency = parseInt(args[++i])
        break
      case '--no-save':
        options.saveToDatabase = false
        break
      case '--reprocess':
        options.skipProcessed = false
        break
      case '--help':
      case '-h':
        console.log(`
Batch Evidence Processor

Usage:
  npx tsx src/lib/agents/evidence/run-batch-processor.ts [options]

Options:
  --product <id>     Process specific product ID
  --limit <n>        Limit number of reviews to process
  --concurrency <n>  Number of parallel requests (default: 5)
  --no-save          Don't save to database (dry run)
  --reprocess        Process all reviews, even if already processed
  --help, -h         Show this help message

Examples:
  # Process all unprocessed reviews
  npx tsx src/lib/agents/evidence/run-batch-processor.ts

  # Process specific product
  npx tsx src/lib/agents/evidence/run-batch-processor.ts --product abc123

  # Dry run on first 10 reviews
  npx tsx src/lib/agents/evidence/run-batch-processor.ts --limit 10 --no-save

  # Reprocess all reviews for a product with higher concurrency
  npx tsx src/lib/agents/evidence/run-batch-processor.ts --product abc123 --reprocess --concurrency 10
`)
        process.exit(0)
      default:
        console.error(`Unknown option: ${arg}`)
        console.error('Run with --help for usage information')
        process.exit(1)
    }
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable is not set')
    console.error('\nPlease set your Anthropic API key:')
    console.error('  export ANTHROPIC_API_KEY="your-api-key-here"')
    console.error('\nOr add it to your .env.local file:')
    console.error('  ANTHROPIC_API_KEY=your-api-key-here')
    process.exit(1)
  }

  try {
    const stats = await processBatch(options)

    console.log('\n✅ Batch processing complete!')
    console.log(`\n📊 Final Stats:`)
    console.log(`   Total reviews: ${stats.totalReviews}`)
    console.log(`   Processed: ${stats.processedReviews}`)
    console.log(`   Skipped: ${stats.skippedReviews}`)
    console.log(`   Total evidence: ${stats.totalEvidence}`)
    console.log(`   Avg confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`)
    console.log(`   Avg processing time: ${stats.averageProcessingTime.toFixed(0)}ms/review`)
    console.log(`   Validation errors: ${stats.validationErrors}`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Batch processing failed:', error)
    process.exit(1)
  }
}

main()
