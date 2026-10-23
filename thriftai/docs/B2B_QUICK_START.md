# Veritas B2B API - Quick Start Guide

**Get started with Veritas Search API in 5 minutes**

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis (optional, for production)

---

## Step 1: Set Up Your First Tenant

Open Prisma Studio or use the Prisma Client to create a test tenant:

```bash
# Open Prisma Studio
npx prisma studio
```

Or create via code:

```typescript
// scripts/create-test-tenant.ts
import { PrismaClient } from '@prisma/client'
import { generateApiKey } from '@/lib/middleware/apiAuth'

const prisma = new PrismaClient()

async function main() {
  const apiKey = generateApiKey(true) // Generate test key

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Store',
      email: 'test@example.com',
      apiKey,
      plan: 'professional',
      rateLimit: 100000, // 100K requests/hour
      isActive: true,
      settings: {
        product_quality_weight: 0.30,
        seller_trust_weight: 0.25,
        market_value_weight: 0.20
      }
    }
  })

  console.log(' Tenant created!')
  console.log('API Key:', apiKey)
  console.log('Tenant ID:', tenant.id)
}

main()
```

**Save your API key** - you'll need it for API calls!

---

## Step 2: Add Test Products

Add some products to your tenant's catalog:

```typescript
// scripts/seed-test-products.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenantId = 'YOUR_TENANT_ID' // Replace with your tenant ID

  const products = [
    {
      tenantId,
      name: 'Organic Coconut Shampoo',
      category: 'Beauty',
      brand: 'Natural Essentials',
      price: 24.99,
      description: 'Premium organic shampoo with coconut oil',
      condition: 'new',
      isAvailable: true,
      imageUrl: 'https://example.com/shampoo1.jpg'
    },
    {
      tenantId,
      name: 'Sulfate-Free Shampoo',
      category: 'Beauty',
      brand: 'Pure Care',
      price: 19.99,
      description: 'Gentle sulfate-free formula for all hair types',
      condition: 'new',
      isAvailable: true,
      imageUrl: 'https://example.com/shampoo2.jpg'
    },
    {
      tenantId,
      name: 'Volumizing Shampoo',
      category: 'Beauty',
      brand: 'Hair Boost',
      price: 29.99,
      description: 'Professional volumizing shampoo',
      condition: 'new',
      isAvailable: true,
      imageUrl: 'https://example.com/shampoo3.jpg'
    }
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  console.log(' Added', products.length, 'test products')
}

main()
```

---

## Step 3: Test the Search API

### Using cURL

```bash
# Basic search
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: vts_test_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "shampoo",
    "limit": 10
  }'
```

### With Filters

```bash
# Search with category and price filter
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: vts_test_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "organic shampoo",
    "filters": {
      "category": "Beauty",
      "minPrice": 10,
      "maxPrice": 30,
      "brand": "Natural"
    },
    "limit": 20,
    "offset": 0
  }'
```

### Using JavaScript

```javascript
// client-example.js
async function searchProducts(query, filters = {}) {
  const response = await fetch('http://localhost:3000/api/v1/search', {
    method: 'POST',
    headers: {
      'x-api-key': 'vts_test_YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      filters,
      limit: 20
    })
  })

  const data = await response.json()

  console.log('Search Results:', data.results.length)
  console.log('Average Veritas Score:', data.metadata.avgVeritasScore)
  console.log('Processing Time:', data.metadata.processingTime + 'ms')

  return data
}

// Test it
searchProducts('shampoo', { category: 'Beauty' })
  .then(data => console.log(JSON.stringify(data, null, 2)))
```

### Using Python

```python
# client-example.py
import requests
import json

def search_products(query, filters=None):
    url = 'http://localhost:3000/api/v1/search'
    headers = {
        'x-api-key': 'vts_test_YOUR_API_KEY',
        'Content-Type': 'application/json'
    }

    payload = {
        'query': query,
        'filters': filters or {},
        'limit': 20
    }

    response = requests.post(url, headers=headers, json=payload)
    data = response.json()

    print(f"Found {len(data['results'])} products")
    print(f"Avg Veritas Score: {data['metadata']['avgVeritasScore']}")

    return data

# Test it
results = search_products('shampoo', {'category': 'Beauty'})
print(json.dumps(results, indent=2))
```

---

## Step 4: Check Rate Limits

Rate limit headers are included in every response:

```bash
X-RateLimit-Limit: 100000
X-RateLimit-Remaining: 99995
X-RateLimit-Reset: 1698765432
```

---

## Expected Response

```json
{
  "query": {
    "original": "organic shampoo",
    "filters": {
      "category": "Beauty",
      "minPrice": 10,
      "maxPrice": 30
    }
  },
  "results": [
    {
      "id": "cm3h5k9...",
      "name": "Organic Coconut Shampoo",
      "category": "Beauty",
      "brand": "Natural Essentials",
      "price": 24.99,
      "imageUrl": "https://example.com/shampoo1.jpg",
      "description": "Premium organic shampoo with coconut oil",
      "condition": "new",
      "veritasScore": null,
      "matchScore": 87
    },
    {
      "id": "cm3h5k10...",
      "name": "Sulfate-Free Shampoo",
      "category": "Beauty",
      "brand": "Pure Care",
      "price": 19.99,
      "imageUrl": "https://example.com/shampoo2.jpg",
      "description": "Gentle sulfate-free formula",
      "condition": "new",
      "veritasScore": null,
      "matchScore": 75
    }
  ],
  "metadata": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "processingTime": 45,
    "avgVeritasScore": 0,
    "searchMethod": "veritas-b2b"
  }
}
```

---

## Testing Authentication Errors

### Invalid API Key

```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: invalid_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Response**:
```json
{
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

### Missing API Key

```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Response**:
```json
{
  "error": "Missing API key. Include x-api-key header or Authorization: Bearer token",
  "code": "MISSING_API_KEY"
}
```

---

## Testing Rate Limits

To test rate limiting, send requests rapidly or temporarily lower the rate limit:

```typescript
// Temporarily set low rate limit for testing
await prisma.tenant.update({
  where: { id: 'YOUR_TENANT_ID' },
  data: { rateLimit: 5 } // 5 requests per hour
})
```

Then make 6+ requests - the 6th should return 429:

```json
{
  "error": "Rate limit exceeded. Limit: 5 requests per hour.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3540
}
```

---

## Common Issues & Solutions

### 1. "Invalid API key" but key is correct

**Solution**: Check that the tenant is active:
```typescript
await prisma.tenant.update({
  where: { apiKey: 'your-api-key' },
  data: { isActive: true }
})
```

### 2. No products returned

**Solution**: Verify tenantId matches:
```typescript
// Check products exist for this tenant
const count = await prisma.product.count({
  where: { tenantId: 'YOUR_TENANT_ID' }
})
console.log('Products:', count)
```

### 3. "CORS error" in browser

**Solution**: The API includes CORS headers. If using a different domain, you may need to whitelist it in `src/app/api/v1/search/route.ts`:

```typescript
'Access-Control-Allow-Origin': 'https://your-domain.com'
```

---

## Next Steps

1. **Add More Products**: Bulk upload your product catalog
2. **Calculate Veritas Scores**: Implement scoring for better ranking
3. **Enable Vector Search**: Add Qdrant for semantic search
4. **Build Client Portal**: Create UI for tenant management
5. **Add Analytics**: Track search patterns and conversions

---

## API Reference

### Search Endpoint

**URL**: `POST /api/v1/search`

**Headers**:
- `x-api-key`: Your tenant API key (required)
- `Content-Type`: application/json

**Request Body**:
```typescript
{
  query: string        // Search query (required)
  filters?: {
    category?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    condition?: string
  }
  limit?: number       // Results per page (default: 20)
  offset?: number      // Pagination offset (default: 0)
}
```

**Response**: 200 OK
```typescript
{
  query: {
    original: string
    filters: object
  }
  results: Array<{
    id: string
    name: string
    category: string
    brand?: string
    price: number
    imageUrl?: string
    description?: string
    condition?: string
    veritasScore?: number
    matchScore: number
  }>
  metadata: {
    total: number
    limit: number
    offset: number
    processingTime: number
    avgVeritasScore: number
    searchMethod: string
  }
}
```

**Error Responses**:
- `400` - Bad Request (missing query)
- `401` - Unauthorized (invalid/missing API key)
- `403` - Forbidden (tenant inactive)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

**You're all set!** Start integrating Veritas Search API into your e-commerce platform. =€

For questions or support, refer to:
- [Architecture Docs](./B2B_SAAS_ARCHITECTURE.md)
- [Implementation Status](./B2B_IMPLEMENTATION_STATUS.md)
- [Full Implementation Plan](./IMPLEMENTATION_PLAN.md)
