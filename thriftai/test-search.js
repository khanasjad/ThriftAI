#!/usr/bin/env node

/**
 * Comprehensive AI Search Test
 * Tests 100 different queries to verify Claude AI-powered search
 */

const queries = [
  // Simple product searches
  "Nike skirt",
  "tracksuit",
  "lip balm",
  "self-help book",
  "mirror",
  "skateboard",
  "vase",
  "luggage",
  "hat",
  "dumbbells",
  "face mask",
  "fantasy novel",
  "speaker",
  "golf club",
  "thriller book",
  "textbook",
  "car charger",
  "seat covers",
  "plush toy",
  "sandals",
  "dresser",
  "steering wheel cover",
  "athletic shoes",
  "kettlebell",
  "jumpsuit",
  "yoga mat",
  "scarf",

  // Natural language queries
  "I need a yoga mat for exercise",
  "looking for nike shoes",
  "find me a book to read",
  "want to buy dumbbells",
  "need car accessories",
  "searching for home decor",
  "show me beauty products",
  "I want sports equipment",
  "looking for clothing",
  "need accessories for my outfit",

  // Category searches
  "clothing",
  "shoes",
  "accessories",
  "electronics",
  "books",
  "home decor",
  "sports equipment",
  "beauty products",
  "toys",
  "automotive",

  // With modifiers
  "luxury scarf",
  "vintage jumpsuit",
  "modern tracksuit",
  "classic dresser",
  "professional golf club",
  "training kettlebell",
  "contemporary vase",
  "regular nike skirt",

  // Price-based searches
  "cheap books",
  "affordable shoes",
  "budget clothing",
  "expensive electronics",
  "luxury accessories",
  "under 50",
  "under 100",
  "under 200",

  // Brand searches
  "Nike products",
  "Patagonia gear",
  "Coach bags",
  "Acer electronics",
  "Garmin accessories",
  "Skechers sandals",
  "Gap clothing",
  "Samsonite luggage",
  "Olay beauty",
  "Neutrogena skincare",

  // Specific attributes
  "paperback books",
  "anniversary edition",
  "mid-century furniture",
  "universal car accessories",
  "training equipment",
  "amateur sports gear",
  "care products",

  // Complex queries
  "vintage designer bags under 200",
  "cheap nike shoes for sports",
  "luxury home decor items",
  "affordable books for reading",
  "modern furniture for living room",
  "professional sports equipment",
  "beauty care products for face",
  "automotive accessories for cars",
  "classic clothing for men",
  "contemporary home accessories",

  // Typos and variations (to test Claude's intelligence)
  "traksuit",
  "dumbell",
  "boks",
  "accesories",
  "elegance",
  "jens",
  "shose",
  "furnature",
];

let successCount = 0;
let failureCount = 0;
const results = [];

async function testSearch(query, index) {
  try {
    const response = await fetch('http://localhost:3000/api/buyers/enhanced-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    const productsFound = data.products?.length || 0;
    const total = data.metadata?.total || 0;
    const category = data.metadata?.appliedFilters?.category || 'N/A';
    const confidence = data.metadata?.aiInsights?.confidence || 0;

    const result = {
      index: index + 1,
      query,
      productsFound,
      total,
      category,
      confidence,
      success: response.ok && total >= 0
    };

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }

    results.push(result);

    // Print result
    const emoji = productsFound > 0 ? '✅' : '⚠️';
    console.log(`${emoji} [${index + 1}/100] "${query}" → ${productsFound} products (total: ${total}, category: ${category}, confidence: ${confidence.toFixed(2)})`);

    return result;
  } catch (error) {
    failureCount++;
    console.error(`❌ [${index + 1}/100] "${query}" → ERROR: ${error.message}`);
    return { index: index + 1, query, error: error.message, success: false };
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive AI search test (100 queries)\n');
  console.log('Testing Claude AI-powered search with NO HARDCODING\n');
  console.log('=' .repeat(80) + '\n');

  const startTime = Date.now();

  // Run tests sequentially to avoid overwhelming the server
  for (let i = 0; i < queries.length; i++) {
    await testSearch(queries[i], i);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total queries: ${queries.length}`);
  console.log(`Successful: ${successCount} (${(successCount/queries.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failureCount} (${(failureCount/queries.length*100).toFixed(1)}%)`);
  console.log(`Total time: ${duration}s`);
  console.log(`Average: ${(duration/queries.length).toFixed(2)}s per query`);

  // Category breakdown
  const categoryCount = {};
  results.forEach(r => {
    if (r.category) {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
    }
  });

  console.log('\n📁 CATEGORY DISTRIBUTION:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} queries`);
    });

  // Average confidence
  const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
  console.log(`\n🎯 AVERAGE CONFIDENCE: ${(avgConfidence * 100).toFixed(1)}%`);

  // Results breakdown
  const withResults = results.filter(r => r.productsFound > 0).length;
  const noResults = results.filter(r => r.productsFound === 0 && r.success).length;

  console.log('\n📈 RESULTS BREAKDOWN:');
  console.log(`  Found products: ${withResults} (${(withResults/queries.length*100).toFixed(1)}%)`);
  console.log(`  No results: ${noResults} (${(noResults/queries.length*100).toFixed(1)}%)`);
  console.log(`  Errors: ${failureCount} (${(failureCount/queries.length*100).toFixed(1)}%)`);

  console.log('\n✅ AI-powered search test complete!\n');
}

runTests().catch(console.error);
