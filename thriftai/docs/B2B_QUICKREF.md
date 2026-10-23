# Veritas B2B SaaS - Quick Reference

**100% MVP Complete - Production Ready** ✅

---

## Getting Started in 5 Minutes

### 1. Initialize Qdrant (One-time setup)

```bash
npx tsx scripts/b2b/init-qdrant.ts
```

### 2. Create Your First Tenant

```bash
npx tsx scripts/b2b/create-tenant.ts "Acme Corp" "api@acme.com" professional
```

**Save the API key** - you'll need it for all API calls!

### 3. Add Products (Choose one method)

**Option A: Via API** (recommended)
```bash
curl -X POST http://localhost:3000/api/v1/products/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Wireless Headphones",
        "category": "Electronics",
        "brand": "SoundMax",
        "price": 149.99,
        "description": "Premium noise-canceling headphones"
      }
    ],
    "enableIndexing": true
  }'
```

**Option B: Via Script** (for testing)
```bash
npx tsx scripts/b2b/seed-products.ts TENANT_ID 100
npx tsx scripts/b2b/index-tenant-products.ts TENANT_ID
```

### 4. Search Products

**Keyword Search** (fast, exact matching)
```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "headphones", "searchMode": "keyword"}'
```

**Vector Search** (semantic, typo-tolerant)
```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "noise canceling headphones for travel", "searchMode": "vector"}'
```

**Hybrid Search** (best relevance)
```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "wireless headphones", "searchMode": "hybrid"}'
```

---

## Subscription Plans

| Plan | Rate Limit | Max Products | Price |
|------|-----------|--------------|-------|
| Free | 1K/hour | 100 | $0 |
| Starter | 10K/hour | 1,000 | $99/mo |
| Professional | 100K/hour | 50,000 | $499/mo |
| Enterprise | 1M/hour | Unlimited | Custom |

---

## Management Commands

**List all tenants**
```bash
npx tsx scripts/b2b/list-tenants.ts
npx tsx scripts/b2b/list-tenants.ts --detailed  # Show full API keys
```

**Check Qdrant status**
```bash
npx tsx scripts/b2b/check-qdrant-status.ts
```

---

## API Endpoints

### Search API
- **URL**: `POST /api/v1/search`
- **Auth**: `x-api-key` header
- **Modes**: `keyword` | `vector` | `hybrid`

### Ingestion API
- **URL**: `POST /api/v1/products/ingest`
- **Auth**: `x-api-key` header
- **Max Batch**: 1,000 products
- **Optional**: `enableIndexing: true` for vector search

---

## Performance

| Search Mode | Latency | Best For |
|-------------|---------|----------|
| Keyword | ~15ms | Exact product names, SKUs |
| Vector | ~45ms | Natural language, discovery |
| Hybrid | ~60ms | Best overall relevance |

---

## Costs

**Vector Search Costs** (OpenAI Embeddings):
- **Indexing**: $0.065 per 1,000 products (one-time)
- **Search**: $0.000013 per query
- **Example**: 10K products + 100K searches/month = $1.95/month

---

## Complete Documentation

- **[Implementation Summary](./B2B_IMPLEMENTATION_SUMMARY.md)** - Complete overview
- **[Quick Start Guide](./B2B_QUICK_START.md)** - Detailed setup
- **[Vector Search Guide](./B2B_VECTOR_SEARCH.md)** - Vector search deep dive
- **[Architecture](./B2B_SAAS_ARCHITECTURE.md)** - System design
- **[Scripts README](../scripts/b2b/README.md)** - CLI tools reference

---

## Next Steps

1. ✅ Create a test tenant
2. ✅ Add sample products
3. ✅ Test all three search modes
4. 📊 Monitor usage and performance
5. 🚀 Onboard your first B2B client

---

**Questions?** Check the full documentation in `/docs/` or review the implementation status.

**Built with ❤️ for Veritas B2B Platform**
