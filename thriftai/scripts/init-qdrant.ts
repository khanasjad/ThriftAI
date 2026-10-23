#!/usr/bin/env tsx
/**
 * Initialize Qdrant Collections
 *
 * Run this script to set up all Qdrant collections with optimized configurations.
 *
 * Usage:
 *   npm run qdrant:init
 *   or
 *   tsx scripts/init-qdrant.ts
 */

import { qdrantClient } from '../src/lib/vector/qdrant/QdrantClient';
import {
  PRODUCTS_COLLECTION_CONFIG,
  CHUNKS_COLLECTION_CONFIG,
  USER_PROFILES_COLLECTION_CONFIG
} from '../src/lib/vector/qdrant/config';

async function main() {
  console.log('🚀 Initializing Qdrant collections...\n');

  try {
    // Step 1: Health check
    console.log('📊 Checking Qdrant health...');
    const health = await qdrantClient.healthCheck();

    if (health.status !== 'ok') {
      throw new Error('Qdrant is not healthy. Please check the connection.');
    }

    console.log('✅ Qdrant is healthy');
    console.log(`   Version: ${health.version}`);
    console.log(`   Existing collections: ${health.collections}\n`);

    // Step 2: Initialize collections
    console.log('📦 Creating collections...\n');

    console.log('1. Products collection...');
    await qdrantClient.initializeCollection(PRODUCTS_COLLECTION_CONFIG);
    console.log('   ✅ Products collection ready\n');

    console.log('2. Chunks collection (for RAG)...');
    await qdrantClient.initializeCollection(CHUNKS_COLLECTION_CONFIG);
    console.log('   ✅ Chunks collection ready\n');

    console.log('3. User profiles collection...');
    await qdrantClient.initializeCollection(USER_PROFILES_COLLECTION_CONFIG);
    console.log('   ✅ User profiles collection ready\n');

    // Step 3: Verify
    console.log('🔍 Verifying collections...\n');

    const collections = [
      PRODUCTS_COLLECTION_CONFIG.name,
      CHUNKS_COLLECTION_CONFIG.name,
      USER_PROFILES_COLLECTION_CONFIG.name
    ];

    for (const collectionName of collections) {
      const info = await qdrantClient.getCollectionInfo(collectionName);
      console.log(`   ${collectionName}:`);
      console.log(`     - Status: ${info.status}`);
      console.log(`     - Vectors: ${info.vectorCount}`);
      console.log(`     - Vector size: ${info.config.params.vectorSize}`);
      console.log(`     - Distance: ${info.config.params.distance}\n`);
    }

    console.log('✨ All collections initialized successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run migrate:qdrant (to migrate from pgvector)');
    console.log('  2. Or start adding new products with embeddings\n');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
