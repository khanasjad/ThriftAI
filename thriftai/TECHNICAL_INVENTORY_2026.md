# 📦 Technical Inventory & Architecture Audit

**Date**: October 22, 2026
**Purpose**: Map what actually exists vs. what documentation claims

---

## 🗂️ COMPLETE CODEBASE MAP

### API Endpoints (42+ Total)

#### Search APIs (11 Different Implementations 🚨)
```
/api/v1/search                    ← B2B API (just built, production-ready)
/api/v2/search                    ← RAG-based search
/api/buyers/search                ← Basic buyer search
/api/buyers/enhanced-search       ← Enhanced with Claude
/api/buyers/chat-search           ← Chat-based search
/api/buyers/claude-search         ← Another Claude variant
/api/claude-intelligent-search    ← Standalone Claude search
/api/intelligent-search-lite      ← Lightweight version
/api/semantic-search              ← Vector-only search
/api/smart-search                 ← "Smart" search (unclear difference)
/api/enhanced-search              ← Generic enhanced
```

**QUESTION**: Which one is the "main" search? They all do similar things.

#### Product APIs
```
/api/products                     ← CRUD operations
/api/products/[id]                ← Single product
/api/products/enrich              ← Enrichment with external data
/api/products/enhanced            ← Enhanced product data
/api/products/veritas             ← Veritas scoring
/api/products/[id]/veritas        ← Single product Veritas score
/api/products/[id]/reviews        ← Product reviews
/api/v1/products/ingest           ← B2B bulk ingestion (just built)
```

#### Veritas Scoring APIs
```
/api/veritas/[productId]          ← Get score for product
/api/veritas/calculate            ← Calculate score
/api/veritas/calculator           ← Score calculator
/api/veritas/category-score       ← Category-level scoring
/api/veritas/compare              ← Compare products
/api/veritas/database-parameters/[id]
/api/veritas/database-parameters/batch
/api/test/veritas-score           ← Test endpoint
```

#### Integration APIs
```
/api/integrations/cpsc            ← Consumer Product Safety Commission
/api/integrations/ifixit          ← Repairability data
/api/integrations/barcode         ← UPC/barcode lookup
/api/integrations/food            ← Food database
/api/integrations/free            ← Free integrations aggregator
```

#### Swipe/Gamification
```
/api/swipe/initialize             ← Start swipe session
/api/swipe/action                 ← Swipe left/right
/api/swipe/summary/[productId]    ← Swipe summary
/api/leaderboard                  ← Gamification leaderboard
```

#### E-Commerce
```
/api/cart                         ← Shopping cart
/api/cart/migrate                 ← Cart migration
/api/checkout                     ← Checkout process
/api/checkout/create-order        ← Order creation
/api/orders/[orderId]             ← Order management
/api/affiliate/click              ← Affiliate tracking
/api/affiliate/redirect           ← Affiliate redirects
```

#### Misc
```
/api/chat                         ← Conversational interface (v1)
/api/v2/chat                      ← Conversational interface (v2)
/api/compare                      ← Product comparison
/api/marketplace/compare          ← Marketplace comparison
/api/visual-search                ← Image-based search
/api/price-intelligence/[productId]
/api/price-intelligence/best-deals
/api/filters                      ← Dynamic filters
/api/personalized/recommendations
/api/scrapers/run                 ← Run web scrapers
/api/config/score-thresholds      ← Configuration
/api/docs/swagger                 ← API documentation
/api/csrf-token                   ← CSRF protection
/api/tts                          ← Text-to-speech
/api/webhooks/stripe              ← Stripe webhooks
```

#### Admin APIs
```
/api/admin/products               ← Product management
/api/admin/rescore-products       ← Batch re-scoring
/api/admin/batch-enrich           ← Batch enrichment
/api/admin/clear-cache            ← Cache management
```

---

### Services (55+ Total)

#### Search Services (35+ Files 🚨)
```
/lib/services/
  - veritasSearchService.ts
  - vectorSearchService.ts
  - semanticSearchService.ts
  - claudeSemanticSearchService.ts
  - intelligentSearchService.ts
  - ragSearchService.ts
  - enhancedSearchService.ts
  - b2bVectorSearch.ts          ← Just built
  ... and ~27 more search-related services
```

**PROBLEM**: Massive duplication. Most do: embedding → vector search → ranking.

#### Scoring Services
```
/lib/services/
  - veritasScoreService.ts (76KB - the main one)
  - aiProductScorer.ts
  - comprehensiveVeritasCalculators.ts
  - scoringService.ts
  - productScoringService.ts
```

#### Data Services
```
/lib/dataFetcher/
  - appleSpecsFetcher.ts
  - amazonDataFetcher.ts
  - bestBuyDataFetcher.ts
  - ebayDataFetcher.ts
  - walmartDataFetcher.ts
  - targetDataFetcher.ts
  - cpscDataFetcher.ts
  - ifixitDataFetcher.ts
  - energyStarFetcher.ts
  - yahooFinanceFetcher.ts
  ... ~10 more fetchers
```

#### Agent Services
```
/lib/agents/
  - ClaudeAgent.ts
  - IntentExtractionAgent.ts
  - QueryGeneratorAgent.ts
  - SemanticAgent.ts
  - StructuredQueryAgent.ts
  - VeritasAgent.ts
```

**STATUS**: Partially implemented, unclear orchestration.

#### RAG Components
```
/lib/rag/
  - MultiSourceRetriever.ts
  - Reranker.ts
  - ConversationStore.ts
  - LLMOrchestrator.ts
```

**STATUS**: Infrastructure exists, integration unclear.

---

## 🔍 WHAT ACTUALLY WORKS (Test Results)

### ✅ Confirmed Working
1. **Product Database** - Prisma + PostgreSQL with pgvector
2. **Basic Search** - Keyword search on products table
3. **Veritas Scoring** - Can calculate 96-parameter score
4. **B2B API** (just built) - Tenant auth, rate limiting, vector search
5. **Consumer UI** - Browse products, add to cart
6. **Affiliate Links** - Tracking and redirects

### 🔶 Partially Working
1. **Vector Search** - Multiple implementations, unclear which is best
2. **Claude Integration** - Works but expensive (no routing)
3. **Price Intelligence** - Service exists, unclear if data is fresh
4. **Admin Tools** - Interfaces exist, unclear usage

### ❌ Not Working / Not Integrated
1. **RAG Pipeline** - Components exist, not fully connected
2. **Agent Orchestration** - Agents exist independently, no system
3. **Conversation Memory** - ConversationStore exists but unused
4. **Swipe Feature** - Built but no clear user adoption
5. **Visual Search** - Endpoint exists, unclear quality

---

## 📊 Database Schema (Current)

### Core Tables
```sql
Product
  - Basic info (name, category, brand, price)
  - Veritas score fields
  - Vector embedding (pgvector)
  - Dynamic specs (JSON)
  - Certifications (JSON)
  - Company metrics (JSON)
  - tenantId (optional, for B2B)

Tenant (just added)
  - API key
  - Subscription plan
  - Rate limits
  - Usage tracking

User
  - Authentication
  - Preferences
  - Cart/Orders

Review
  - Product reviews
  - Ratings

SwipeSession
  - Gamification data
```

**GAPS**:
- No evidence ledger (promised in strategy doc)
- No owner check-in table
- No conversation history
- No A/B test results table

---

## 🏗️ Architecture Patterns

### What Exists
```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  - Consumer UI (browse, cart)          │
│  - Admin UI (product management)       │
│  - Swipe UI (gamification)             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         API Layer (42+ endpoints)       │
│  - 11 search implementations            │
│  - Product CRUD                         │
│  - Veritas scoring                      │
│  - Integrations                         │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Services Layer (55+ services)      │
│  - Search (35+)                         │
│  - Scoring (5+)                         │
│  - Data fetchers (20+)                  │
│  - Agents (6+)                          │
│  - RAG components (4+)                  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Data Layer                      │
│  - PostgreSQL + pgvector                │
│  - Redis (caching)                      │
│  - Qdrant (vector DB - just added)     │
└─────────────────────────────────────────┘
```

### What's Missing (Per Strategy Docs)
```
┌─────────────────────────────────────────┐
│     MISSING: Evidence Ledger            │
│  - Review analysis                      │
│  - Expert test results                  │
│  - Recall data                          │
│  - Owner check-ins                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     MISSING: Orchestration              │
│  - Clear agent routing                  │
│  - LLM cost optimization                │
│  - Model selection strategy             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     MISSING: Proof Systems              │
│  - Golden query eval set                │
│  - Return rate correlation              │
│  - A/B test results                     │
└─────────────────────────────────────────┘
```

---

## 💰 Cost Analysis (Current Burn)

### Monthly Costs (Estimated)
```
OpenAI API:
  - Embeddings: ~$20/month (for existing products)
  - Claude calls: ~$50-100/month (if in production)

Infrastructure:
  - Hosting: ~$0-30/month (if on Vercel/Netlify free tier)
  - PostgreSQL: Included in hosting or ~$10/month
  - Qdrant: $0 (local) or ~$25/month (cloud)
  - Redis: ~$10/month (Upstash)

Total: ~$100-200/month
```

**Revenue: $0**
**Burn: Your time (15-20 hrs/week × 52 weeks = 780-1040 hrs/year)**

---

## 🔥 REDUNDANCY REPORT

### Duplicate/Overlapping Code

**Search Implementations:**
- 11 different API endpoints for search
- 35+ service files related to search
- Estimated: **70% code duplication**

**Scoring Services:**
- 5 different scoring services
- Unclear which is canonical
- SCORING_REFACTOR_PLAN.md identifies redundant parameters

**Data Fetchers:**
- 20+ fetcher services
- Many unused or stale
- No centralized data freshness strategy

### Code That Could Be Deleted
```
Swipe feature:             ~2,000 lines
Unused search variants:    ~15,000 lines
Partial RAG implementation: ~3,000 lines
Unused admin tools:        ~1,000 lines

Total deletable: ~21,000 lines (estimate)
```

**Without losing core functionality.**

---

## 🎯 WHAT YOU ACTUALLY NEED (Minimal Viable)

### For B2B API Business
```
KEEP:
- /api/v1/search (just built)
- /api/v1/products/ingest (just built)
- Tenant management
- Rate limiting
- b2bVectorSearch.ts
- veritasScoreService.ts (one scoring implementation)
- Product database

DELETE:
- All other search APIs
- Swipe feature
- Partial RAG
- Most admin tools
- Duplicate scoring services

RESULT: ~60% code reduction
```

### For Agentic Quality Layer
```
NEED TO BUILD:
- Evidence extraction pipeline
- Owner check-in system
- Proof metric (return rate correlation)
- MCP server
- Golden query evaluation

CAN LEVERAGE:
- Existing Veritas scoring
- Product database
- Vector search infrastructure

MUST DELETE:
- Everything consumer-facing (swipe, marketplace UI)
- All search API variants
- Half-finished agent code
```

### For Consumer Marketplace
```
KEEP:
- One search API (pick best)
- Product browsing UI
- Cart/checkout
- veritasScoreService.ts
- Affiliate links

DELETE:
- B2B API (just built!)
- Admin tools
- Swipe feature
- 10 other search variants

RESULT: Focus on user acquisition
```

**YOU CANNOT DO ALL THREE. PICK ONE.**

---

## 📈 Capability Maturity Assessment

| Capability | Maturity Level | Notes |
|-----------|---------------|-------|
| **Product Scoring** | 🟡 Partial (60%) | Algorithm exists but unvalidated |
| **Search** | 🟡 Partial (50%) | Too many implementations, no clarity |
| **Vector Search** | 🟢 Complete (90%) | Just built, production-ready |
| **B2B API** | 🟢 Complete (90%) | Just built, untested in market |
| **Data Fetching** | 🟡 Partial (40%) | Many fetchers, unclear freshness |
| **Agent System** | 🔴 Incomplete (30%) | Components exist, no orchestration |
| **RAG Pipeline** | 🔴 Incomplete (35%) | Infrastructure exists, not integrated |
| **Consumer UI** | 🟡 Partial (60%) | Works but generic |
| **Evidence Ledger** | 🔴 Not Started (0%) | Critical for moat, doesn't exist |
| **Proof Systems** | 🔴 Not Started (0%) | No validation of claims |

---

## 🚨 CRITICAL DEPENDENCIES NOT MET

### For B2B Success
- ❌ Customer conversations (0)
- ❌ Market validation
- ❌ Proof of ROI
- ❌ Differentiation from Constructor/Algolia

### For Agentic Layer Success
- ❌ Evidence ledger
- ❌ Owner check-ins
- ❌ Outcome correlation proof
- ❌ Partnership discussions with OpenAI/Google

### For Consumer Success
- ❌ User acquisition strategy
- ❌ Traffic
- ❌ Proof score changes behavior

---

## 💡 RECOMMENDED ACTIONS

### Immediate (Next 7 Days)
1. **Pick ONE strategy** (B2B, Agentic, or Consumer)
2. **Delete 60-70% of code** not related to that strategy
3. **Create dependency graph** of what's actually used
4. **Document the ONE search API** you'll support

### Short-term (Next 30 Days)
1. **Consolidate search** into one canonical implementation
2. **Fix Veritas scoring** (per SCORING_REFACTOR_PLAN.md)
3. **Build proof** (golden queries or customer validation)
4. **Sunset unused features** (swipe, unused APIs)

### Medium-term (90 Days)
1. **Achieve ONE clear metric**:
   - B2B: 1 paying customer
   - Agentic: Proof metric showing correlation
   - Consumer: 100 active users
2. **Eliminate all architectural debt**
3. **Document and test** the final architecture

---

## 📋 FILE STRUCTURE CLEANUP NEEDED

### Current: Chaos
```
/api/
  - v1/
  - v2/
  - buyers/
  - multiple competing endpoints
```

### Recommended: Clarity
```
/api/
  - core/           ← ONE search, ONE scoring
  - integrations/   ← External data sources
  - internal/       ← Admin, testing
  - deprecated/     ← Mark for deletion
```

---

**SUMMARY**:
- 42+ APIs, most redundant
- 55+ services, 70% duplicate functionality
- 3 competing strategies, zero validated
- Strong tech foundation, zero market validation
- **Action**: Simplify ruthlessly or shut down**

**You have good engineering skills. You're building the wrong thing.**
