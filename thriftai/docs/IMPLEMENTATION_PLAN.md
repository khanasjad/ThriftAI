# Veritas B2B SaaS - Implementation Plan
## From Current State to Production-Ready API

**Last Updated**: 2026-10-22

---

## ✅ What You Already Have (80% Complete!)

### 1. **Veritas Scoring Engine** ✅
**Location**: `src/lib/agents/veritas/`

**Working Components**:
- ✅ `SpecMatcherAgent` - Product specification matching
- ✅ `FinancialValueAgent` - Price analysis
- ✅ `PriceIntelligenceAgent` - Market price comparison
- ✅ `ScamDetectionAgent` - Fraud risk detection
- ✅ `TrustReliabilityAgent` - Seller trust scoring
- ✅ `VeritasOrchestrator` - Combines all scores

**Tests**: 207/207 passing (100% coverage)

### 2. **Semantic Search Infrastructure** ✅
**Components**:
- ✅ Qdrant vector database client (`src/lib/rag/QdrantClient.ts`)
- ✅ OpenAI embeddings integration
- ✅ Hybrid search (vector + SQL)
- ✅ RRF (Reciprocal Rank Fusion) algorithm

### 3. **AI Integration** ✅
- ✅ Claude API for query understanding
- ✅ OpenAI for embeddings
- ✅ Intelligent product ranking
- ✅ Workspace ID support for multi-tenant

### 4. **Database Schema** ✅
- ✅ PostgreSQL with Prisma ORM
- ✅ Product model with all fields
- ✅ Category, brand, condition support
- ✅ Veritas score storage

---

## 🚧 What Needs to Be Built

### **Priority 1: Multi-Tenancy (Week 1-2)**

#### Step 1: Add Tenant Schema
```sql
-- Add to Prisma schema
model Tenant {
  id          String   @id @default(uuid())
  name        String
  apiKey      String   @unique
  plan        String   @default("free")
  rateLimit   Int      @default(1000)
  settings    Json?    // Custom scoring weights
  createdAt   DateTime @default(now())
  products    Product[]
}

model Product {
  // Add tenant relationship
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  // Existing fields...
  @@index([tenantId, category])
  @@index([tenantId, veritasScore])
}
```

#### Step 2: API Key Middleware
```typescript
// src/middleware/apiAuth.ts
export async function validateApiKey(req: Request) {
  const apiKey = req.headers.get('x-api-key')

  const tenant = await prisma.tenant.findUnique({
    where: { apiKey }
  })

  if (!tenant) {
    throw new Error('Invalid API key')
  }

  // Check rate limiting
  await checkRateLimit(tenant.id, tenant.rateLimit)

  return tenant
}
```

### **Priority 2: Product Ingestion API (Week 2-3)**

#### Bulk Upload Endpoint
```typescript
// src/app/api/v1/products/ingest/route.ts
export async function POST(req: Request) {
  const tenant = await validateApiKey(req)
  const { products } = await req.json()

  // Validate products
  const validated = validateProducts(products)

  // Enqueue for processing
  await productQueue.addBulk(
    validated.map(product => ({
      tenantId: tenant.id,
      product
    }))
  )

  return Response.json({
    status: 'processing',
    count: validated.length,
    jobId: 'job-xxx'
  })
}
```

#### Background Processing
```typescript
// src/workers/productProcessor.ts
productQueue.process(async (job) => {
  const { tenantId, product } = job.data

  // 1. Enrich product data
  const enriched = await enrichProduct(product)

  // 2. Calculate Veritas score
  const veritasScore = await calculateVeritasScore(enriched)

  // 3. Generate embeddings
  const embedding = await generateEmbedding(
    `${product.name} ${product.description}`
  )

  // 4. Store in PostgreSQL
  await prisma.product.create({
    data: {
      tenantId,
      ...enriched,
      veritasScore
    }
  })

  // 5. Store in Qdrant
  await qdrant.upsert({
    id: product.id,
    vector: embedding,
    payload: {
      tenantId,
      productId: product.id,
      veritasScore
    }
  })
})
```

### **Priority 3: Search API (Week 3-4)**

```typescript
// src/app/api/v1/search/route.ts
export async function POST(req: Request) {
  const tenant = await validateApiKey(req)
  const { query, filters, limit = 20 } = await req.json()

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query)

  // 2. Vector search
  const vectorResults = await qdrant.search({
    vector: queryEmbedding,
    filter: {
      must: [
        { key: 'tenantId', match: { value: tenant.id } },
        ...buildFilters(filters)
      ]
    },
    limit: 100
  })

  // 3. Keyword search (SQL)
  const keywordResults = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ],
      ...filters
    },
    take: 100
  })

  // 4. RRF Fusion
  const fusedResults = reciprocalRankFusion([
    vectorResults,
    keywordResults
  ])

  // 5. Rank by Veritas Score
  const ranked = fusedResults.sort((a, b) => {
    // 60% Veritas score, 40% relevance
    const scoreA = (a.relevanceScore * 0.4) + (a.veritasScore * 0.6)
    const scoreB = (b.relevanceScore * 0.4) + (b.veritasScore * 0.6)
    return scoreB - scoreA
  })

  // 6. Return results
  return Response.json({
    results: ranked.slice(0, limit),
    total: fusedResults.length,
    avgVeritasScore: calculateAverage(ranked, 'veritasScore'),
    searchId: generateSearchId()
  })
}
```

---

## 📦 Directory Structure (Reorganized for B2B)

```
src/
├── app/
│   └── api/
│       └── v1/                     # Public API
│           ├── search/
│           │   └── route.ts        # Main search endpoint
│           ├── products/
│           │   ├── ingest/
│           │   │   └── route.ts    # Bulk upload
│           │   ├── update/
│           │   │   └── route.ts    # Real-time sync
│           │   └── delete/
│           │       └── route.ts
│           ├── tenants/
│           │   ├── create/
│           │   └── settings/
│           └── analytics/
│               └── route.ts
│
├── lib/
│   ├── agents/
│   │   └── veritas/                # ✅ Already exists!
│   │       ├── SpecMatcherAgent.ts
│   │       ├── PriceIntelligenceAgent.ts
│   │       ├── ScamDetectionAgent.ts
│   │       ├── TrustReliabilityAgent.ts
│   │       └── VeritasOrchestrator.ts
│   │
│   ├── search/
│   │   ├── vectorSearch.ts         # Qdrant integration
│   │   ├── hybridSearch.ts         # Vector + SQL
│   │   └── rrfFusion.ts           # Rank fusion
│   │
│   ├── ingestion/
│   │   ├── productValidator.ts
│   │   ├── productEnricher.ts
│   │   └── embeddingGenerator.ts
│   │
│   ├── middleware/
│   │   ├── apiAuth.ts             # API key validation
│   │   ├── rateLimit.ts           # Rate limiting
│   │   └── tenantContext.ts       # Multi-tenant isolation
│   │
│   └── workers/
│       ├── productProcessor.ts     # Background jobs
│       └── scoreCalculator.ts
│
└── prisma/
    └── schema.prisma              # Multi-tenant schema
```

---

## 🔧 Quick Start Implementation

### **Week 1: Multi-Tenancy Setup**

```bash
# 1. Update Prisma schema
npx prisma migrate dev --name add_multi_tenancy

# 2. Create seed data for testing
npx prisma db seed
```

### **Week 2: Build Ingestion Pipeline**

1. Create `/api/v1/products/ingest` endpoint
2. Add Bull queue for background processing
3. Implement Veritas score calculation worker
4. Test with sample CSV (100 products)

### **Week 3: Build Search API**

1. Create `/api/v1/search` endpoint
2. Integrate existing Qdrant + RRF code
3. Add Veritas-based ranking
4. Test with sample queries

### **Week 4: Client Portal**

1. Tenant registration page
2. API key management
3. Product upload interface
4. Analytics dashboard

---

## 🎯 MVP Feature Checklist

### **Core API** (Must-Have)
- [ ] `/api/v1/search` - Semantic search with Veritas ranking
- [ ] `/api/v1/products/ingest` - Bulk product upload
- [ ] `/api/v1/products/update` - Single product update
- [ ] API key authentication
- [ ] Rate limiting
- [ ] Multi-tenant isolation

### **Client Portal** (Nice-to-Have)
- [ ] Tenant registration
- [ ] API key generation
- [ ] Product upload UI (CSV/JSON)
- [ ] Search testing playground
- [ ] Basic analytics dashboard

### **Documentation** (Must-Have)
- [ ] API reference (OpenAPI/Swagger)
- [ ] Integration guide
- [ ] Sample code (JS, Python, PHP)
- [ ] Quickstart tutorial

---

## 💻 Code Examples for Clients

### **JavaScript Integration**
```javascript
// Client-side integration (e.g., Shopify, WooCommerce)
const veritasSearch = async (query, filters = {}) => {
  const response = await fetch('https://api.veritas.ai/v1/search', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-api-key',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      query,
      filters,
      limit: 20
    })
  })

  const data = await response.json()
  return data.results  // Returns products ranked by Veritas score
}

// Usage
const products = await veritasSearch('organic shampoo', {
  category: 'Beauty',
  priceRange: [10, 50]
})
```

### **Product Upload Example**
```javascript
// Bulk upload from client database
const uploadProducts = async (products) => {
  const response = await fetch('https://api.veritas.ai/v1/products/ingest', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-api-key',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        brand: p.brand,
        price: p.price,
        condition: p.condition,
        metadata: {
          sku: p.sku,
          stock: p.stock,
          images: p.images
        }
      }))
    })
  })

  return response.json()  // { status: 'processing', jobId: '...' }
}
```

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Search API latency (P95) | < 200ms | ~500ms |
| Product ingestion rate | 10K/min | N/A |
| Uptime SLA | 99.9% | N/A |
| Vector index size | 10M vectors | ~1K |
| Concurrent requests | 1000/sec | ~10/sec |

---

## 🚀 Go-to-Market Strategy

### **Phase 1: Beta (Month 1-2)**
1. Recruit 3-5 beta customers
2. Free API access
3. Gather feedback & iterate
4. Build case studies

### **Phase 2: Launch (Month 3)**
1. Announce on Product Hunt
2. Content marketing (blog, SEO)
3. Offer "Starter" plan at $99/mo
4. Target mid-size e-commerce sites

### **Phase 3: Scale (Month 4+)**
1. Enterprise sales team
2. Channel partnerships (Shopify, WooCommerce plugins)
3. International expansion
4. Custom ML models per vertical

---

## 💡 Key Differentiation

**"The only search API that ranks by product QUALITY, not just relevance"**

**Tagline Options**:
- "Show the best products first, not just the most relevant"
- "Search intelligence that increases conversions"
- "AI-powered quality ranking for e-commerce"

---

## 🎯 Success Metrics (First 6 Months)

- **10 paying customers** @ $499/mo average = **$5K MRR**
- **500K API calls/month**
- **15% average conversion rate improvement** for clients
- **99.9% uptime**

---

**You have 80% of the code already built!** 🎉

The heavy lifting (Veritas scoring, vector search, hybrid ranking) is done. You just need to:
1. Add multi-tenancy
2. Build public API endpoints
3. Create client onboarding
4. Package it as a service

**This is absolutely doable in 4-6 weeks!** 🚀
