# Veritas B2B SaaS Architecture
## Enterprise Search Intelligence Platform

**Last Updated**: 2026-10-22
**Status**: Architecture Design

---

## 🎯 Product Vision

**What We're Building:**
A white-label search intelligence API that e-commerce companies integrate to provide better product search and ranking.

**Value Proposition:**
- 🎯 **Better Search**: Semantic understanding, not keyword matching
- ⭐ **Quality Ranking**: Show best products first (Veritas Score)
- 💰 **Higher Conversion**: Customers find what they want faster
- 📊 **Analytics**: Insights into product quality and search patterns

**Target Customers:**
- Mid-size e-commerce platforms (100K-10M products)
- Vertical marketplaces (fashion, electronics, beauty)
- B2B catalogs and wholesalers

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT E-COMMERCE SITE                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Search Bar │  │  Category  │  │  Filters   │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
│        └────────────────┴────────────────┘                   │
│                         │                                    │
│                    [Veritas API Call]                        │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   VERITAS API GATEWAY                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Authentication (API Keys)                          │  │
│  │  • Rate Limiting                                      │  │
│  │  • Request Validation                                 │  │
│  │  • Multi-tenant Routing                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SEMANTIC   │  │   SCORING    │  │   RANKING    │
│    SEARCH    │  │   ENGINE     │  │   ENGINE     │
│              │  │              │  │              │
│ • Vector DB  │  │ • Veritas    │  │ • ML Rerank  │
│ • Embeddings │  │ • Parameters │  │ • Diversity  │
│ • Hybrid     │  │ • Signals    │  │ • Context    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  PRODUCT CATALOG DB  │
              │  (Multi-tenant)      │
              │                      │
              │  • Client A Products │
              │  • Client B Products │
              │  • Client C Products │
              └─────────────────────┘
```

---

## 🔧 Core Components

### 1. **API Gateway**
**Technology**: Next.js API Routes + Express
**Responsibilities**:
- Authentication via API keys
- Rate limiting per client
- Request validation
- Multi-tenant routing
- Usage tracking & billing

**Endpoints**:
```typescript
POST /api/v1/search
POST /api/v1/products/ingest     // Bulk product upload
POST /api/v1/products/update     // Real-time updates
GET  /api/v1/analytics           // Search insights
```

### 2. **Vector Database**
**Technology**: Qdrant (already partially implemented)
**Purpose**: Semantic search via embeddings

**Schema**:
```typescript
interface VectorDocument {
  id: string
  tenantId: string              // Multi-tenant isolation
  productId: string
  embedding: number[]            // 1536-dim from OpenAI
  metadata: {
    name: string
    category: string
    brand: string
    price: number
    veritasScore: number         // Pre-calculated
    lastUpdated: Date
  }
}
```

### 3. **Scoring Engine** (Veritas Algorithm)
**Current Implementation**: `src/lib/agents/veritas/`
**Improvements Needed**:
- Make it client-configurable
- Support custom parameters
- Real-time score updates

**Algorithm**:
```typescript
VeritasScore = Σ (weightᵢ × parameterScoreᵢ)

Where parameters include:
1. Spec Matching Score (40%)      - How well product matches query
2. Price Intelligence (20%)        - Value for money analysis
3. Trust & Reliability (20%)       - Seller quality, reviews
4. Scam Detection (15%)            - Fraud risk assessment
5. Financial Value (5%)            - Long-term value

Final Score: 0-100 (higher = better quality)
```

### 4. **Product Ingestion Pipeline**
**Technology**: Bull Queue + PostgreSQL
**Purpose**: Ingest client product catalogs

**Flow**:
```
Client Product CSV/API
    ↓
Validation & Enrichment
    ↓
Veritas Score Calculation
    ↓
Vector Embedding Generation
    ↓
Store in PostgreSQL + Qdrant
```

**Supported Formats**:
- CSV/JSON bulk upload
- REST API real-time sync
- Webhook for live updates
- Direct database connector (PostgreSQL, MySQL)

---

## 📊 Database Schema (Multi-tenant)

### **Tenants Table**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  api_key VARCHAR(255) UNIQUE,
  plan VARCHAR(50),              -- free, starter, pro, enterprise
  rate_limit INT DEFAULT 1000,   -- requests per hour
  created_at TIMESTAMP,
  settings JSONB                 -- custom scoring weights
);
```

### **Products Table** (Partitioned by tenant)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  external_id VARCHAR(255),      -- Client's product ID
  name TEXT,
  description TEXT,
  category VARCHAR(100),
  brand VARCHAR(100),
  price DECIMAL(10, 2),

  -- Veritas Scoring
  veritas_score INT,             -- 0-100
  spec_match_score INT,
  price_intelligence_score INT,
  trust_score INT,
  scam_risk_score INT,

  -- Metadata
  metadata JSONB,                -- Flexible client data
  last_updated TIMESTAMP,

  INDEX idx_tenant_category (tenant_id, category),
  INDEX idx_veritas_score (tenant_id, veritas_score DESC)
) PARTITION BY LIST (tenant_id);
```

### **Search Analytics Table**
```sql
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  query TEXT,
  results_count INT,
  top_product_id UUID,
  avg_veritas_score DECIMAL(5, 2),
  response_time_ms INT,
  clicked_product_id UUID,       -- Track conversions
  timestamp TIMESTAMP
);
```

---

## 🔍 Search Flow (Detailed)

```typescript
// CLIENT REQUEST
POST /api/v1/search
{
  "query": "organic shampoo for dry hair",
  "tenant_id": "client-abc-123",
  "filters": {
    "category": "Beauty",
    "priceRange": [10, 50]
  },
  "limit": 20
}

// STEP 1: Hybrid Search
const semanticResults = await qdrant.search({
  vector: await generateEmbedding(query),
  filter: { tenant_id, ...filters },
  limit: 100
})

const keywordResults = await postgres.query(`
  SELECT * FROM products
  WHERE tenant_id = $1
    AND to_tsvector(name || ' ' || description) @@ plainto_tsquery($2)
  LIMIT 100
`, [tenant_id, query])

// STEP 2: Fusion (RRF - Reciprocal Rank Fusion)
const fusedResults = reciprocalRankFusion([
  semanticResults,
  keywordResults
])

// STEP 3: Veritas Scoring & Reranking
const scoredResults = fusedResults.map(product => ({
  ...product,
  veritasScore: calculateVeritasScore(product, query, context),
  relevanceScore: calculateRelevance(product, query)
}))

// STEP 4: Final Ranking
const rankedResults = scoredResults.sort((a, b) => {
  // Weighted combination
  const scoreA = (a.relevanceScore * 0.4) + (a.veritasScore * 0.6)
  const scoreB = (b.relevanceScore * 0.4) + (b.veritasScore * 0.6)
  return scoreB - scoreA
})

// RESPONSE
{
  "results": rankedResults.slice(0, 20),
  "total": scoredResults.length,
  "avg_veritas_score": 78.5,
  "search_id": "search-xyz-789",  // For analytics
  "suggestions": [...]
}
```

---

## 🚀 Implementation Roadmap

### **Phase 1: MVP (4-6 weeks)**
✅ **Week 1-2**: Multi-tenant Architecture
- [ ] Tenant management system
- [ ] API key authentication
- [ ] Rate limiting
- [ ] Multi-tenant database partitioning

✅ **Week 3-4**: Product Ingestion
- [ ] CSV/JSON bulk upload API
- [ ] Product validation & enrichment
- [ ] Veritas score batch calculation
- [ ] Vector embedding generation pipeline

✅ **Week 5-6**: Search API
- [ ] Hybrid search implementation
- [ ] RRF fusion algorithm
- [ ] Veritas-based ranking
- [ ] API documentation

### **Phase 2: Production Ready (4-6 weeks)**
- [ ] Real-time product sync API
- [ ] Webhook support
- [ ] Advanced analytics dashboard
- [ ] Client portal for onboarding
- [ ] Pricing & billing integration

### **Phase 3: Scale (Ongoing)**
- [ ] Auto-scaling infrastructure
- [ ] CDN for global latency
- [ ] A/B testing framework
- [ ] Custom ML models per client
- [ ] White-label UI components

---

## 💰 Pricing Model

### **Tiered Pricing**:

**Starter** - $99/month
- 10K API calls/month
- 1K products
- Email support

**Professional** - $499/month
- 100K API calls/month
- 50K products
- Custom scoring weights
- Dedicated support

**Enterprise** - Custom
- Unlimited API calls
- Unlimited products
- Custom ML models
- SLA guarantee
- On-premise deployment option

**Usage-Based Add-ons**:
- Additional API calls: $0.001 per call
- Additional products: $0.01 per product/month
- Premium features: Analytics, A/B testing

---

## 🔐 Security & Compliance

1. **Authentication**: API keys with HMAC signatures
2. **Data Isolation**: Multi-tenant database partitioning
3. **Encryption**: TLS 1.3 in transit, AES-256 at rest
4. **GDPR Compliance**: Data deletion APIs
5. **SOC 2 Type II**: (Future roadmap)

---

## 📈 Success Metrics

**For Clients**:
- Search conversion rate improvement
- Average order value increase
- Search result satisfaction scores
- Time to find product reduction

**For Veritas**:
- API uptime (99.9% SLA)
- P95 response time < 200ms
- Client retention rate
- MRR growth

---

## 🛠️ Technology Stack

**Backend**:
- Next.js 15 (API routes)
- PostgreSQL 14 (multi-tenant data)
- Qdrant (vector search)
- Redis (caching, rate limiting)
- Bull (job queue)

**AI/ML**:
- OpenAI Embeddings (text-embedding-3-large)
- Claude Haiku 4.5 (query understanding)
- Custom Veritas scoring algorithm

**Infrastructure**:
- Vercel (API hosting)
- Supabase (PostgreSQL + Auth)
- Upstash (Redis)
- Qdrant Cloud

---

## 📚 Next Steps

1. **Validate with pilot customers** (1-2 companies)
2. **Build tenant onboarding flow**
3. **Implement product ingestion pipeline**
4. **Create API documentation & SDKs**
5. **Set up analytics & monitoring**

---

## 🎯 Competitive Advantage

**vs. Algolia/Elasticsearch**:
- ✅ Quality ranking (not just relevance)
- ✅ Built-in fraud detection
- ✅ Price intelligence
- ✅ Semantic understanding

**vs. Generic AI Search**:
- ✅ E-commerce specific
- ✅ Trust & scam detection
- ✅ Financial value analysis
- ✅ Easy integration

---

**This is a $10M+ ARR opportunity if executed well!** 🚀
