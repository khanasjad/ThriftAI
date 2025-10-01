# 96-Parameter AI Scoring System - Quick Start Guide

Get the advanced AI scoring system up and running in minutes!

---

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with pgvector extension
- API Keys:
  - OpenAI API key (for embeddings)
  - Anthropic API key (for dynamic extraction)
  - Alpha Vantage API key (optional, for stock data)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install pgvector Extension

```sql
-- Connect to your PostgreSQL database
psql -U your_user -d your_database

-- Install pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Step 2: Set Environment Variables

Create or update `.env`:

```bash
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:password@localhost:5432/thriftai

# Optional
ALPHA_VANTAGE_API_KEY=your_key_here
```

### Step 3: Run Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate deploy

# Or for development
npx prisma migrate dev --name add_96_parameter_system
```

### Step 4: Verify Setup

```bash
# Check database
psql $DATABASE_URL -c "\d products"

# Should see new columns:
# - ai_score
# - ai_score_breakdown
# - embedding (vector(1536))
# - company_metrics (jsonb)
# - dynamic_specs (jsonb)
# - global_rank, category_rank, price_tier_rank
```

---

## 🎯 Basic Usage

### 1. Fetch Company Metrics

```typescript
import { companyMetricsService } from '@/lib/services/companyMetricsService'

// Get metrics for a brand
const metrics = await companyMetricsService.getCompanyMetrics('Apple')

console.log(metrics)
// {
//   stockPrice: 180.5,
//   esgScore: 85,
//   marketCap: 2800,
//   revenueGrowth: 15.2,
//   ...25 total parameters
// }
```

### 2. Extract Dynamic Specs

```typescript
import { dynamicParameterExtractor } from '@/lib/services/dynamicParameterExtractor'

// Extract product specs
const specs = await dynamicParameterExtractor.extractSpecs(
  'iPhone 15 Pro 256GB',
  'Apple iPhone 15 Pro with A17 Pro chip, 8GB RAM, 48MP camera...',
  'ELECTRONICS',
  { brand: 'Apple', price: 999 }
)

console.log(specs)
// {
//   cpu: 'Apple A17 Pro',
//   ram: 8,
//   storage: '256GB',
//   camera: '48MP + 12MP',
//   ...more specs
// }
```

### 3. Generate Embeddings

```typescript
import { embeddingService } from '@/lib/services/embeddingService'

// Single product
await embeddingService.generateAndSaveEmbedding(productId)

// Batch process
const result = await embeddingService.batchGenerateEmbeddings({
  productIds: undefined, // null = all products without embeddings
  batchSize: 100,
  onProgress: (progress) => {
    console.log(`${progress.processed}/${progress.total} - ${progress.estimatedTimeRemaining}s remaining`)
  }
})

console.log(`Generated ${result.successful} embeddings`)
console.log(`Cost: $${result.estimatedCost.toFixed(2)}`)
```

### 4. Search with Vectors

```typescript
import { vectorSearchService } from '@/lib/services/vectorSearchService'

// Semantic search
const results = await vectorSearchService.search({
  query: 'affordable smartphone with good camera',
  limit: 20,
  categoryFilter: ['ELECTRONICS'],
  priceRange: { min: 200, max: 500 },
  minAiScore: 70
})

console.log(`Found ${results.results.length} products`)
results.results.forEach(product => {
  console.log(`${product.name} - $${product.price} - Score: ${product.aiScore} - Similarity: ${product.similarity.toFixed(2)}`)
})
```

### 5. Find Similar Products

```typescript
// Get products similar to a specific product
const similar = await vectorSearchService.findSimilar(productId, 10, 0.7)

console.log('Similar products:')
similar.forEach(p => {
  console.log(`${p.name} - Similarity: ${(p.similarity * 100).toFixed(1)}%`)
})
```

### 6. Smart Price Search

```typescript
import { priceIntentDetector } from '@/lib/services/priceIntentDetector'

// Detect price intent
const intent = priceIntentDetector.detect('$20 shirt')

console.log(intent)
// {
//   detected: true,
//   targetPrice: 20,
//   range: { min: 15, max: 25 },
//   flexibility: 'moderate',
//   confidence: 0.8
// }

// Parse complete query
const parsed = priceIntentDetector.parseQuery('around $50 Nike running shoes')
console.log(parsed)
// {
//   originalQuery: 'around $50 Nike running shoes',
//   productQuery: 'Nike running shoes',
//   priceIntent: { targetPrice: 50, range: { min: 30, max: 70 }, ... },
//   categoryIntent: 'SHOES',
//   brandIntent: ['Nike']
// }
```

---

## 🔧 Batch Processing Scripts

### Generate All Embeddings

Create `scripts/generate-all-embeddings.ts`:

```typescript
import { embeddingService } from '@/lib/services/embeddingService'

async function main() {
  console.log('🚀 Starting embedding generation...')

  const result = await embeddingService.batchGenerateEmbeddings({
    forceRegenerate: false, // Only products without embeddings
    batchSize: 100,
    onProgress: (progress) => {
      const percent = ((progress.processed / progress.total) * 100).toFixed(1)
      console.log(`Progress: ${percent}% (${progress.processed}/${progress.total})`)
    }
  })

  console.log('\n✅ Complete!')
  console.log(`Successful: ${result.successful}`)
  console.log(`Failed: ${result.failed}`)
  console.log(`Cost: $${result.estimatedCost.toFixed(2)}`)
  console.log(`Time: ${(result.processingTime / 1000).toFixed(1)}s`)
}

main().catch(console.error)
```

Run it:
```bash
npx tsx scripts/generate-all-embeddings.ts
```

### Score All Products

Create `scripts/score-all-products.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { aiScoringEngine } from '@/lib/services/aiScoringEngine'
// (Note: This service needs to be created - see TODO list)

async function main() {
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    select: { id: true, name: true }
  })

  console.log(`Scoring ${products.length} products...`)

  for (const product of products) {
    // Score product with 96 parameters
    const score = await aiScoringEngine.scoreProduct(product.id)
    console.log(`${product.name}: ${score.aiScore}/100`)
  }
}

main().catch(console.error)
```

---

## 📊 Query Examples

### Example 1: Smart Price Search

```typescript
// User types: "$20 shirt"

const parsed = priceIntentDetector.parseQuery('$20 shirt')
// { productQuery: 'shirt', priceIntent: { min: 15, max: 25 } }

const results = await vectorSearchService.search({
  query: parsed.productQuery,
  priceRange: parsed.priceIntent.range,
  limit: 50
})

// Returns shirts priced $15-$25, ranked by AI score and similarity
```

### Example 2: Semantic Search

```typescript
// User types: "comfortable running shoes for marathon"

const results = await vectorSearchService.hybridSearch({
  query: 'comfortable running shoes for marathon',
  categoryFilter: ['SHOES'],
  weights: { vector: 0.5, keyword: 0.3, aiScore: 0.2 }
})

// Returns shoes semantically similar to "comfortable", "marathon"
// even if those exact words aren't in the product title
```

### Example 3: Filter by AI Score

```typescript
// Only show high-quality products

const results = await vectorSearchService.search({
  query: 'laptop',
  minAiScore: 80, // Only products with AI score >= 80
  limit: 20
})

// Returns only top-rated laptops based on 96 parameters
```

---

## 🎨 Frontend Integration Example

```typescript
// In your React component
'use client'

import { useState } from 'react'

export function SmartSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleSearch = async () => {
    const response = await fetch(`/api/smart-search?q=${encodeURIComponent(query)}`)
    const data = await response.json()
    setResults(data.results)
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try: $20 shirt or comfortable running shoes"
      />
      <button onClick={handleSearch}>Search</button>

      {results.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <p>AI Score: {product.aiScore}/100</p>
          <p>Similarity: {(product.similarity * 100).toFixed(0)}%</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### pgvector not found
```bash
# Install pgvector
# macOS
brew install pgvector

# Ubuntu/Debian
sudo apt-get install postgresql-14-pgvector

# Or compile from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### OpenAI API Errors
```
Error: 429 Too Many Requests
```
Solution: Add rate limiting or use batching (already implemented in EmbeddingService)

### Missing API Keys
```
Error: OPENAI_API_KEY is not set
```
Solution: Add API key to `.env` file

### Slow Vector Search
```
Query takes > 1 second
```
Solution: Ensure HNSW index is created:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'products';
-- Should see: products_embedding_idx
```

---

## 📈 Performance Tips

1. **Batch Operations**: Always use batch methods for multiple products
2. **Caching**: Company metrics and embeddings are cached - leverage this
3. **Indexes**: Ensure all database indexes are created (migration does this)
4. **Rate Limiting**: Built into services - don't bypass it
5. **Vector Search**: Use `similarityThreshold` to reduce results
6. **Hybrid Search**: Best results but slightly slower than pure vector search

---

## 📚 Next Steps

1. **Create Missing Services**:
   - `aiScoringEngine.ts` - Integrate all 96 parameters
   - Leaderboard API endpoints
   - Smart search API endpoint

2. **Add Monitoring**:
   - Track API costs
   - Monitor search performance
   - Measure scoring accuracy

3. **Optimize**:
   - Tune vector search parameters
   - Adjust scoring weights per category
   - A/B test different configurations

4. **Scale**:
   - Set up Redis for caching
   - Add CDN for product images
   - Implement read replicas for search

---

## 💡 Pro Tips

- **Development**: Use mock data (already implemented) to avoid API costs
- **Testing**: Test with small batches first (limit: 10) before running on all products
- **Monitoring**: Check `ai_scoring_statistics` view for system health
- **Costs**: Embedding 10,000 products costs ~$5-10 USD
- **Updates**: Re-run embeddings when product descriptions change significantly

---

## 🆘 Need Help?

1. Check `AI_SCORING_96_PARAMETER_SYSTEM.md` for detailed documentation
2. Review `IMPLEMENTATION_PROGRESS.md` for system status
3. Look at service file comments for usage examples
4. Check migration file for database schema details

---

**Ready to go!** 🚀

Start with generating embeddings for a few products, then try semantic search!

```bash
# Quick test
npx tsx -e "
import { embeddingService } from './src/lib/services/embeddingService';
const stats = await embeddingService.getEmbeddingStatistics();
console.log('📊 Stats:', stats);
"
```
