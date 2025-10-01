/**
 * Batch Embedding Generation Script
 *
 * Generates vector embeddings for all products in the database.
 * Uses OpenAI's text-embedding-3-large model (1536 dimensions).
 *
 * Usage:
 *   npx tsx scripts/generate-all-embeddings.ts
 *   npx tsx scripts/generate-all-embeddings.ts --force  # Regenerate all
 *   npx tsx scripts/generate-all-embeddings.ts --limit 100  # Only first 100
 */

import { embeddingService } from '../src/lib/services/embeddingService'
import { logger } from '../src/lib/logger'

async function main() {
  const args = process.argv.slice(2)
  const forceRegenerate = args.includes('--force')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined

  console.log('\n🚀 Starting Embedding Generation')
  console.log('================================\n')

  if (forceRegenerate) {
    console.log('⚠️  FORCE MODE: Will regenerate ALL embeddings\n')
  }

  if (limit) {
    console.log(`📊 LIMIT: Processing only ${limit} products\n`)
  }

  try {
    // Get current statistics
    const statsBefore = await embeddingService.getEmbeddingStatistics()
    console.log('📊 Current Status:')
    console.log(`   Total Products: ${statsBefore.totalProducts}`)
    console.log(`   With Embeddings: ${statsBefore.productsWithEmbeddings}`)
    console.log(`   Without Embeddings: ${statsBefore.productsWithoutEmbeddings}`)
    console.log(`   Coverage: ${statsBefore.coveragePercentage.toFixed(1)}%\n`)

    if (statsBefore.productsWithoutEmbeddings === 0 && !forceRegenerate) {
      console.log('✅ All products already have embeddings!')
      console.log('💡 Use --force flag to regenerate all embeddings\n')
      return
    }

    // Start batch generation
    console.log('🔄 Starting batch generation...\n')

    let lastProgress = 0
    const startTime = Date.now()

    const result = await embeddingService.batchGenerateEmbeddings({
      forceRegenerate,
      batchSize: 100,
      limit,
      onProgress: (progress) => {
        const percent = ((progress.processed / progress.total) * 100).toFixed(1)

        // Only log every 5% to avoid spam
        if (Math.floor(parseFloat(percent) / 5) > Math.floor(lastProgress / 5)) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          console.log(
            `📈 Progress: ${percent}% ` +
            `(${progress.processed}/${progress.total}) ` +
            `| Elapsed: ${elapsed}s ` +
            `| Remaining: ~${progress.estimatedTimeRemaining}s`
          )
        }
        lastProgress = parseFloat(percent)
      }
    })

    // Print results
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n✅ Generation Complete!')
    console.log('======================\n')
    console.log(`✅ Successful: ${result.successful}`)
    console.log(`❌ Failed: ${result.failed}`)
    console.log(`⏱️  Total Time: ${totalTime}s`)
    console.log(`💰 Estimated Cost: $${result.estimatedCost.toFixed(3)}`)

    if (result.successful > 0) {
      const avgTime = (result.processingTime / result.successful).toFixed(0)
      console.log(`⚡ Avg Time per Product: ${avgTime}ms`)
    }

    // Get updated statistics
    const statsAfter = await embeddingService.getEmbeddingStatistics()
    console.log('\n📊 Updated Status:')
    console.log(`   Products with Embeddings: ${statsAfter.productsWithEmbeddings}`)
    console.log(`   Coverage: ${statsAfter.coveragePercentage.toFixed(1)}%`)

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      result.errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.productId}: ${err.error}`)
      })
      if (result.errors.length > 5) {
        console.log(`   ... and ${result.errors.length - 5} more errors`)
      }
    }

    console.log('\n🎉 Done!\n')

  } catch (error) {
    console.error('\n❌ Fatal Error:', error)
    logger.error('Embedding generation script failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
