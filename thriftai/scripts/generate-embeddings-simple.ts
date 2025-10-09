/**
 * Generate embeddings for products
 * Simple implementation using JSON storage
 */

import { simpleSemanticSearch } from '../src/lib/services/simpleSemanticSearch'
import { logger } from '../src/lib/logger'

async function main() {
  try {
    console.log('🚀 Starting embedding generation...\n')

    // Get current statistics
    const statsBefore = await simpleSemanticSearch.getStatistics()
    console.log('📊 Current Statistics:')
    console.log(`   Total products: ${statsBefore.totalProducts}`)
    console.log(`   With embeddings: ${statsBefore.withEmbeddings}`)
    console.log(`   Without embeddings: ${statsBefore.withoutEmbeddings}`)
    console.log(`   Progress: ${statsBefore.percentageComplete.toFixed(1)}%\n`)

    if (statsBefore.withoutEmbeddings === 0) {
      console.log('✅ All products already have embeddings!')
      return
    }

    // Generate embeddings for products without them
    const limit = parseInt(process.argv[2] || '20')
    console.log(`🔄 Generating embeddings for up to ${limit} products...\n`)

    const result = await simpleSemanticSearch.generateBatchEmbeddings(undefined, limit)

    console.log('\n✅ Batch generation completed!')
    console.log(`   Successful: ${result.successful}`)
    console.log(`   Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`)
      })
      if (result.errors.length > 5) {
        console.log(`   ... and ${result.errors.length - 5} more errors`)
      }
    }

    // Get updated statistics
    const statsAfter = await simpleSemanticSearch.getStatistics()
    console.log('\n📊 Updated Statistics:')
    console.log(`   Total products: ${statsAfter.totalProducts}`)
    console.log(`   With embeddings: ${statsAfter.withEmbeddings}`)
    console.log(`   Without embeddings: ${statsAfter.withoutEmbeddings}`)
    console.log(`   Progress: ${statsAfter.percentageComplete.toFixed(1)}%\n`)

    console.log('🎉 Done!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
