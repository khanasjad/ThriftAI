#!/usr/bin/env tsx
/**
 * Initialize Qdrant for Veritas B2B Platform
 *
 * Run this script once to set up the Qdrant vector database collection
 * for the B2B SaaS platform.
 *
 * Usage:
 *   npx tsx scripts/b2b/init-qdrant.ts
 */

import { b2bVectorSearchService } from '../../src/lib/services/b2bVectorSearch'
import { qdrantClient } from '../../src/lib/vector/qdrant/QdrantClient'

async function main() {
  console.log('🚀 Initializing Qdrant for Veritas B2B Platform...\n')

  try {
    // Step 1: Health check
    console.log('📊 Checking Qdrant health...')
    const health = await qdrantClient.healthCheck()

    if (health.status !== 'ok') {
      throw new Error('Qdrant is not healthy. Please check the connection.')
    }

    console.log('✅ Qdrant is healthy')
    console.log(`   Version: ${health.version}`)
    console.log(`   Existing collections: ${health.collections}\n`)

    // Step 2: Initialize collection
    console.log('📦 Creating B2B products collection...')
    await b2bVectorSearchService.initializeCollection()
    console.log('✅ B2B products collection ready\n')

    // Step 3: Verify collection
    console.log('🔍 Verifying collection...')
    const stats = await b2bVectorSearchService.getStatistics()

    console.log('\n📈 Collection Statistics:')
    console.log(`   Status: ${stats.status}`)
    console.log(`   Total vectors: ${stats.vectorCount}`)
    console.log(`   Indexed vectors: ${stats.indexedVectorCount}\n`)

    console.log('✨ Qdrant initialization complete!\n')
    console.log('Next steps:')
    console.log('  1. Run: npx tsx scripts/b2b/index-tenant-products.ts <tenantId>')
    console.log('  2. Or enable indexing during product ingestion with enableIndexing: true\n')

  } catch (error) {
    console.error('❌ Initialization failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

main()
