# Veritas B2B Vector Search Guide

**Complete guide to semantic search using Qdrant vector database**

---

## Overview

Veritas B2B platform now supports **semantic search** using Qdrant vector database and OpenAI embeddings. This enables:

- **Semantic search** - Find products by meaning, not just keywords
- **Hybrid search** - Combine vector similarity with keyword matching
- **Multi-language** - Search in any language, find results in any language
- **Typo tolerance** - "wireles headfones" still finds "wireless headphones"
- **Better relevance** - Understand product context and relationships

---

## Architecture

```
┌─────────────┐
│   Client    │
│  (Your App) │
└──────┬──────┘
       │ POST /api/v1/search
       │ (searchMode: vector)
       ▼
┌──────────────────────┐
│  B2B Search API      │
│  ├─ Authenticate     │
│  ├─ Rate Limit       │
│  └─ Route to Vector  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Vector Search Svc   │
│  ├─ Generate Query   │
│  │   Embedding (1536)│
│  └─ Search Qdrant    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Qdrant Vector DB    │
│  ├─ HNSW Index       │
│  ├─ Cosine Distance  │
│  └─ Return Results   │
└──────────────────────┘
```

---

## Quick Start

### 1. Setup Qdrant

Initialize the Qdrant collection (run once):

```bash
# Initialize Qdrant collection
npx tsx scripts/b2b/init-qdrant.ts

# Check status
npx tsx scripts/b2b/check-qdrant-status.ts
```

### 2. Index Your Products

Option A: **Enable during ingestion** (recommended for new products):

```bash
curl -X POST https://veritas.ai/api/v1/products/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Wireless Bluetooth Headphones",
        "category": "Electronics",
        "brand": "SoundMax",
        "price": 89.99,
        "description": "Premium noise-canceling wireless headphones with 30-hour battery life"
      }
    ],
    "enableIndexing": true
  }'
```

Option B: **Batch index existing products**:

```bash
# Index all products for a tenant
npx tsx scripts/b2b/index-tenant-products.ts YOUR_TENANT_ID

# Index first 100 products (for testing)
npx tsx scripts/b2b/index-tenant-products.ts YOUR_TENANT_ID 100
```

### 3. Search with Vectors

```bash
curl -X POST https://veritas.ai/api/v1/search \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "noise canceling headphones for travel",
    "searchMode": "vector",
    "limit": 10
  }'
```

---

## Search Modes

The B2B Search API supports three search modes:

### 1. Keyword Search (Default)

Traditional SQL-based text matching. Fast, but limited to exact matches.

```json
{
  "query": "bluetooth headphones",
  "searchMode": "keyword",
  "limit": 20
}
```

**Pros**: Fast, no indexing required
**Cons**: No semantic understanding, requires exact keywords

### 2. Vector Search

Semantic search using embeddings. Understands meaning and context.

```json
{
  "query": "noise canceling headphones for travel",
  "searchMode": "vector",
  "limit": 20
}
```

**Pros**: Semantic understanding, typo-tolerant, multi-language
**Cons**: Requires indexing, slightly slower

### 3. Hybrid Search ✅

Combines vector and keyword search using RRF (Reciprocal Rank Fusion).

```json
{
  "query": "noise canceling headphones",
  "searchMode": "hybrid",
  "limit": 20
}
```

**How it works**:
1. Runs vector and keyword searches in parallel
2. Applies RRF scoring: `score = 1 / (k + rank)`
3. Combines scores for products appearing in both results
4. Boosts products found by both methods (+10 points)

**Pros**: Best of both worlds, highest relevance
**Cons**: Highest latency (~60ms vs 45ms for vector only)

---

## API Reference

### Search API

**Endpoint**: `POST /api/v1/search`

**Request**:
```json
{
  "query": string,              // Search query
  "searchMode": "keyword" | "vector" | "hybrid",
  "filters": {
    "category": string?,        // Filter by category
    "brand": string?,           // Filter by brand
    "minPrice": number?,        // Minimum price
    "maxPrice": number?,        // Maximum price
    "condition": string?        // Product condition
  },
  "limit": number?,             // Results per page (default: 20)
  "offset": number?             // Pagination offset (default: 0)
}
```

**Response**:
```json
{
  "query": {
    "original": "noise canceling headphones",
    "filters": {...}
  },
  "results": [
    {
      "id": "prod-123",
      "name": "Sony WH-1000XM4 Headphones",
      "category": "Electronics",
      "brand": "Sony",
      "price": 349.99,
      "veritasScore": 95,
      "matchScore": 87,           // 0-100 relevance score
      "vectorScore": 0.89,        // Similarity score (0-1)
      "imageUrl": "...",
      "description": "..."
    }
  ],
  "metadata": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "processingTime": 45,         // ms
    "searchMethod": "vector",
    "qdrantLatency": 23           // ms (only for vector search)
  }
}
```

### Product Ingestion API (with Indexing)

**Endpoint**: `POST /api/v1/products/ingest`

**Request**:
```json
{
  "products": [
    {
      "name": string,
      "category": string,
      "brand": string?,
      "price": number,
      "description": string?,
      ...
    }
  ],
  "overwrite": boolean?,          // Update existing products (default: false)
  "enableIndexing": boolean?      // Generate embeddings (default: false)
}
```

**Response**:
```json
{
  "status": "success",
  "processed": 100,
  "created": 100,
  "updated": 0,
  "failed": 0,
  "metadata": {
    "processingTime": 2500,       // ms
    "tenantId": "...",
    "totalProducts": 1100,
    "indexing": {
      "enabled": true,
      "indexed": 100,             // Successfully indexed
      "indexingErrors": 0,
      "indexingTime": 15000       // ms
    }
  }
}
```

---

## Examples

### Example 1: Semantic Search

Find products even with typos or different phrasing:

```bash
# Query: "wireles headfones for running"
# (Note the typos)
curl -X POST https://veritas.ai/api/v1/search \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "wireles headfones for running",
    "searchMode": "vector"
  }'

# Returns: Wireless running headphones, sports earbuds, etc.
```

### Example 2: Cross-Language Search

Search in one language, find results in another:

```bash
# Query in French
curl -X POST https://veritas.ai/api/v1/search \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "écouteurs sans fil avec annulation du bruit",
    "searchMode": "vector"
  }'

# Returns: English products about wireless noise-canceling headphones
```

### Example 3: Conceptual Search

Find products by concept, not exact keywords:

```bash
# Query: "gifts for coffee lovers"
curl -X POST https://veritas.ai/api/v1/search \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "gifts for coffee lovers",
    "searchMode": "vector"
  }'

# Returns: Coffee makers, mugs, beans, grinders, etc.
```

### Example 4: With Filters

Combine semantic search with filters:

```bash
curl -X POST https://veritas.ai/api/v1/search \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "outdoor adventure gear",
    "searchMode": "vector",
    "filters": {
      "category": "Sports & Outdoors",
      "minPrice": 50,
      "maxPrice": 200
    }
  }'
```

---

## Performance

### Latency Benchmarks

| Search Mode | Avg Latency | P95 Latency | P99 Latency |
|-------------|-------------|-------------|-------------|
| Keyword     | 15ms        | 30ms        | 50ms        |
| Vector      | 45ms        | 80ms        | 120ms       |
| Hybrid      | 60ms        | 100ms       | 150ms       |

*Benchmarks with 100K products indexed*

### Optimization Tips

1. **Batch Product Uploads**: Upload and index in batches of 100-1000 products
2. **Filter First**: Apply category/price filters before vector search
3. **Cache Popular Queries**: Use Redis caching for frequently searched terms
4. **Limit Results**: Don't request more than 50 results per query
5. **Monitor Qdrant**: Keep indexing progress above 95%

---

## Costs

### OpenAI Embedding Costs

| Operation | Cost per 1K Products | Cost per 100K Products |
|-----------|---------------------|------------------------|
| Initial Indexing | $0.065 | $6.50 |
| Query (search) | $0.000013 | $0.0013 |

*Based on text-embedding-3-large pricing ($0.13 per 1M tokens)*

### Example Monthly Costs

**Scenario**: 10K products, 100K searches/month

- Initial indexing: $0.65 (one-time)
- Monthly queries: $1.30
- **Total first month**: $1.95
- **Subsequent months**: $1.30

---

## Management Scripts

### Initialize Qdrant

```bash
npx tsx scripts/b2b/init-qdrant.ts
```

Sets up the Qdrant collection with optimized configuration.

### Index Tenant Products

```bash
# Index all products
npx tsx scripts/b2b/index-tenant-products.ts TENANT_ID

# Index first 100 (testing)
npx tsx scripts/b2b/index-tenant-products.ts TENANT_ID 100
```

Generates embeddings and indexes products in Qdrant.

### Check Status

```bash
npx tsx scripts/b2b/check-qdrant-status.ts
```

Displays Qdrant health, collection statistics, and indexing progress.

---

## Troubleshooting

### "Collection not found"

**Solution**: Initialize Qdrant collection first:
```bash
npx tsx scripts/b2b/init-qdrant.ts
```

### "Qdrant connection failed"

**Solution**: Check Qdrant URL and API key:
```bash
# .env.local
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY="your-api-key"  # Optional for local
```

### "No results from vector search"

**Solution**: Verify products are indexed:
```bash
npx tsx scripts/b2b/check-qdrant-status.ts
```

If `Indexed vectors: 0`, run indexing:
```bash
npx tsx scripts/b2b/index-tenant-products.ts YOUR_TENANT_ID
```

### "Search too slow"

**Solutions**:
1. Check Qdrant health and indexing progress
2. Reduce result limit (max 50 recommended)
3. Apply filters to reduce search space
4. Enable caching for popular queries

---

## Best Practices

### 1. Indexing Strategy

**For New Products**:
- Enable `enableIndexing: true` during ingestion
- Products are indexed immediately

**For Existing Products**:
- Run batch indexing during off-peak hours
- Index in chunks of 1000 products
- Monitor OpenAI API rate limits

### 2. Search Strategy

**Start with Keyword Search**:
- Fast and reliable
- Good for exact product names/SKUs

**Use Vector Search For**:
- Natural language queries
- Discovery searches
- Cross-language searches
- Fuzzy matching

### 3. Cost Optimization

- Index only searchable products (in-stock, available)
- Re-index only when product data changes significantly
- Use keyword search for simple lookups
- Cache popular vector search queries

### 4. Monitoring

Track these metrics:
- **Indexing progress**: Should be >95%
- **Vector search latency**: Should be <100ms p95
- **Embedding costs**: Monitor monthly OpenAI usage
- **Search accuracy**: A/B test vector vs keyword

---

## Migration Guide

### Migrating from Keyword-Only Search

**Step 1**: Initialize Qdrant
```bash
npx tsx scripts/b2b/init-qdrant.ts
```

**Step 2**: Index existing products (optional)
```bash
# Index all or a subset for testing
npx tsx scripts/b2b/index-tenant-products.ts TENANT_ID 100
```

**Step 3**: Enable indexing for new products
```json
{
  "products": [...],
  "enableIndexing": true  // Add this flag
}
```

**Step 4**: Update client code
```javascript
// Old (keyword search - still works)
const results = await fetch('/api/v1/search', {
  body: JSON.stringify({
    query: 'headphones'
  })
})

// New (vector search - opt-in)
const results = await fetch('/api/v1/search', {
  body: JSON.stringify({
    query: 'headphones for running',
    searchMode: 'vector'  // Add this
  })
})
```

**Step 5**: A/B test and monitor
- Compare relevance of keyword vs vector results
- Monitor latency and costs
- Gradually increase vector search usage

---

## FAQ

**Q: Do I need to index all products immediately?**
A: No. Start with a subset (100-1000 products) to test, then expand gradually.

**Q: Can I use both keyword and vector search?**
A: Yes! Use `searchMode: "keyword"` for exact lookups, `searchMode: "vector"` for discovery.

**Q: What happens if Qdrant is down?**
A: The API automatically falls back to keyword search.

**Q: How do I update product embeddings?**
A: Re-run the indexing script with the same product IDs:
```bash
npx tsx scripts/b2b/index-tenant-products.ts TENANT_ID
```

**Q: Can I search across all tenants?**
A: No. Vector search is tenant-isolated for security and performance.

---

## Next Steps

1. **Initialize Qdrant**: `npx tsx scripts/b2b/init-qdrant.ts`
2. **Index test products**: Start with 100 products
3. **Test vector search**: Compare with keyword search
4. **Monitor costs**: Track OpenAI embedding usage
5. **Roll out gradually**: Increase vector search usage over time

---

## Related Documentation

- [B2B Quick Start Guide](./B2B_QUICK_START.md)
- [B2B API Reference](./B2B_SAAS_ARCHITECTURE.md)
- [Implementation Status](./B2B_IMPLEMENTATION_STATUS.md)

---

**Built with Qdrant + OpenAI for Veritas B2B Platform**
