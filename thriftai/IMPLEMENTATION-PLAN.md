# ThriftAI - Immediate Implementation Plan

> **Action Plan**: Build production-ready ThriftAI with 10 deterministic agents in 2-3 weeks

---

## Executive Summary

**Problem**: ThriftAI has infrastructure but lacks:
- Real product data (using mock data)
- Effective scoring (25-50 range, not useful)
- Test coverage (0%)
- Polished UI
- Production readiness

**Solution**: 10 specialized deterministic agents that work WITHOUT AI APIs initially

**Timeline**: 2-3 weeks full implementation

---

## Phase 1: Agent System (Week 1) - PRIORITY

### Day 1-2: Enhanced Base Framework

**Files to Create/Modify**:
1. ✅ `/src/lib/agents/types.ts` - Already exists, enhance it
2. 🆕 `/src/lib/agents/DeterministicBaseAgent.ts` - New deterministic base class
3. 🆕 `/src/lib/agents/AgentOrchestrator.ts` - Enhance existing
4. 🆕 `/src/lib/config/agentWeights.ts` - Configuration
5. 🆕 `/src/lib/data/brandDatabase.ts` - Brand reputation data
6. 🆕 `/src/lib/data/categoryData.ts` - Category averages and norms

### Day 3: Implement Core Agents (1-4)

#### 1. PriceIntelligenceAgent
**File**: `/src/lib/agents/specialized/PriceIntelligenceAgent.ts`
**Logic**:
- Query database for category average price
- Calculate discount percentage
- Score 0-100 based on value
- Flag suspiciously low prices (<30% of average = scam risk)

#### 2. QualityAssessmentAgent
**File**: `/src/lib/agents/specialized/QualityAssessmentAgent.ts`
**Logic**:
- Parse condition keywords
- Look up brand reputation (from database)
- Analyze description completeness
- Check for quality signals (warranty, certifications)

#### 3. SustainabilityAgent
**File**: `/src/lib/agents/specialized/SustainabilityAgent.ts`
**Logic**:
- Used vs new bonus
- Brand sustainability ratings
- Material keywords (recycled, organic)
- Repairability signals

#### 4. TrustReliabilityAgent
**File**: `/src/lib/agents/specialized/TrustReliabilityAgent.ts`
**Logic**:
- Seller rating analysis
- Review count weighting
- Return policy scoring
- Verified seller badges

### Day 4: Implement Supporting Agents (5-7)

#### 5. MarketDemandAgent
**File**: `/src/lib/agents/specialized/MarketDemandAgent.ts`
**Logic**:
- Category popularity (from search logs)
- Seasonal trends (hard-coded calendar)
- Brand popularity
- Trending/bestseller tags

#### 6. SpecificationMatcherAgent
**File**: `/src/lib/agents/specialized/SpecificationMatcherAgent.ts`
**Logic**:
- Feature completeness check
- Spec extraction from description
- Comparison with category standards
- Missing spec penalties

#### 7. FinancialValueAgent
**File**: `/src/lib/agents/specialized/FinancialValueAgent.ts`
**Logic**:
- Total cost of ownership (TCO)
- Depreciation calculation
- Resale value estimation
- Warranty value

### Day 5: Implement Safety & Personalization Agents (8-10)

#### 8. ScamDetectionAgent
**File**: `/src/lib/agents/specialized/ScamDetectionAgent.ts`
**Logic**:
- Red flag detection (price too low, vague description)
- Stock photo detection (placeholder for now)
- New seller + low price = red flag
- External payment requests

#### 9. PersonalizationAgent
**File**: `/src/lib/agents/specialized/PersonalizationAgent.ts`
**Logic**:
- User preference matching
- Purchase history analysis
- Budget alignment
- Category interest weighting

#### 10. ArbitrageOpportunityAgent
**File**: `/src/lib/agents/specialized/ArbitrageOpportunityAgent.ts`
**Logic**:
- Resale margin calculation
- Market liquidity checks
- Seasonal arbitrage opportunities
- Collectible detection

### Day 6-7: Integration & Testing

**Tasks**:
- [ ] Integrate all 10 agents into orchestrator
- [ ] Write unit tests for each agent
- [ ] Test with existing 1,022 products
- [ ] Analyze score distribution (target: 60-90 range)
- [ ] Tune agent weights for balance

---

## Phase 2: Data Pipeline (Week 2) - HIGH PRIORITY

### Day 1-2: Web Scraping Infrastructure

**Files to Create**:
1. `/src/lib/scrapers/BaseScraper.ts` - Base scraper class
2. `/src/lib/scrapers/EbayScraper.ts` - eBay integration
3. `/src/lib/scrapers/AmazonScraper.ts` - Amazon scraping
4. `/src/lib/scrapers/FacebookMarketplaceScraper.ts` - Facebook
5. `/src/lib/scrapers/ScraperOrchestrator.ts` - Manages all scrapers
6. `/src/lib/scrapers/deduplication.ts` - Detect duplicate products

**Implementation Priorities**:
1. **eBay API** (Easiest - they have official API)
   - Use Finding API for product search
   - Get: title, price, condition, images, seller rating
   - Categories: Electronics, Clothing, Toys, Home

2. **Amazon** (Medium difficulty)
   - Use Product Advertising API (requires approval)
   - Fallback: Scrape with Puppeteer (rate-limited)

3. **Facebook Marketplace** (Harder)
   - No official API
   - Use Puppeteer with careful rate limiting
   - IP rotation may be needed

### Day 3: Database Optimization

**Prisma Migration**: `/prisma/migrations/add-performance-indices.sql`
```sql
-- Add performance indices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category
  ON products(category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price
  ON products(price);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_score
  ON products("aiScore" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_available
  ON products("isAvailable") WHERE "isAvailable" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
  ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_score
  ON products(category, "aiScore" DESC) WHERE "isAvailable" = true;

-- Add component scores table for transparency
CREATE TABLE IF NOT EXISTS product_scores (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_score INTEGER NOT NULL,
  quality_score INTEGER NOT NULL,
  sustainability_score INTEGER NOT NULL,
  trust_score INTEGER NOT NULL,
  demand_score INTEGER NOT NULL,
  specs_score INTEGER NOT NULL,
  financial_score INTEGER NOT NULL,
  scam_score INTEGER NOT NULL,
  personalization_score INTEGER NOT NULL,
  arbitrage_score INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  scored_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, scored_at)
);
```

**Tasks**:
- [ ] Run migrations
- [ ] Add connection pooling (PgBouncer)
- [ ] Implement Redis caching for hot queries
- [ ] Monitor query performance (pg_stat_statements)

### Day 4-5: ETL Pipeline

**File**: `/src/lib/pipelines/ScoringPipeline.ts`

```typescript
// Scrape → Clean → Score → Store pipeline
export class ScoringPipeline {
  async run() {
    // 1. Scrape products
    const rawProducts = await scraperOrchestrator.scrapeAll();

    // 2. Deduplicate
    const uniqueProducts = await deduplicator.process(rawProducts);

    // 3. Clean and validate
    const cleanProducts = await cleaner.clean(uniqueProducts);

    // 4. Score with 10 agents
    for (const product of cleanProducts) {
      const result = await agentOrchestrator.scoreProduct(product);
      await this.storeProduct(product, result);
    }

    // 5. Update analytics
    await this.updateAnalytics();
  }
}
```

**Cron Job**: `/src/lib/cron/dailyScrape.ts`
- Schedule: Every night at 2 AM
- Scrape 500 products per source
- Score and update database

### Day 6-7: Data Quality & Admin Dashboard

**Admin Features** (`/src/app/admin`):
- [ ] View scraping logs
- [ ] Manually trigger scrapes
- [ ] Review flagged products (scam detection)
- [ ] Adjust agent weights
- [ ] View score distributions
- [ ] Approve/reject products

---

## Phase 3: UI Polish & Testing (Week 3)

### Day 1-2: UI Component Improvements

**Components to Enhance**:

1. **ProductCard** (`/src/components/ProductCard.tsx`)
   - [ ] Add "Why this score?" button → shows all 10 component scores
   - [ ] Improve visual hierarchy
   - [ ] Add hover effects
   - [ ] Show seller rating badge
   - [ ] Display "Trending" or "Hot Deal" tags

2. **LeaderboardCard** (`/src/components/LeaderboardCard.tsx`)
   - [ ] Add category filters
   - [ ] Show top 100 (not just 10)
   - [ ] Add "New This Week" section

3. **Search & Filters** (`/src/components/SearchBar.tsx`)
   - [ ] Advanced filters:
     * Price range slider
     * Category multi-select
     * Condition checkboxes
     * Score threshold
     * Brand filter
   - [ ] Sort options (price, score, newest)
   - [ ] Save searches

4. **Product Detail Page** (`/src/app/products/[id]/page.tsx`)
   - [ ] Score breakdown chart (10 agent scores)
   - [ ] Similar products carousel
   - [ ] Price history graph (if available)
   - [ ] Add to watchlist
   - [ ] Share button

5. **New Component: ScoreBreakdown**
   ```tsx
   // /src/components/ScoreBreakdown.tsx
   // Radial chart showing all 10 agent scores
   // Click each segment to see reasoning
   ```

### Day 3-4: New Features

**Wishlist/Watchlist** (`/src/app/watchlist/page.tsx`):
- [ ] Save favorite products
- [ ] Price drop alerts
- [ ] Back-in-stock notifications

**Product Comparison** (`/src/app/compare/page.tsx`):
- [ ] Compare 2-4 products side-by-side
- [ ] Highlight score differences
- [ ] Show best in each category

**Personalized Feed** (`/src/app/feed/page.tsx`):
- [ ] Based on PersonalizationAgent
- [ ] "Recommended for you"
- [ ] Daily best deals

### Day 5-6: Comprehensive Testing

**Test Structure**:
```
__tests__/
├── agents/
│   ├── PriceAgent.test.ts
│   ├── QualityAgent.test.ts
│   ├── ... (all 10 agents)
│   └── AgentOrchestrator.test.ts
├── scrapers/
│   ├── EbayScraper.test.ts
│   └── ...
├── api/
│   ├── search.test.ts
│   └── products.test.ts
├── components/
│   ├── ProductCard.test.tsx
│   └── ...
└── e2e/
    ├── user-journey.spec.ts
    └── checkout-flow.spec.ts
```

**Test Commands**:
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage

# Load testing
npm run test:load
```

**Coverage Goals**:
- Agents: 95%+
- API routes: 85%+
- Components: 75%+
- Overall: 80%+

### Day 7: Launch Prep

**Pre-Launch Checklist**:
- [ ] All tests passing
- [ ] Lighthouse score >90
- [ ] No console errors
- [ ] Database backed up
- [ ] Environment variables documented
- [ ] README updated
- [ ] API documentation (Swagger)
- [ ] Error monitoring (Sentry)
- [ ] Analytics (Posthog/Mixpanel)

---

## Quick Start Guide (For Immediate Progress)

### Step 1: Run Existing Product Scoring
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai

# Score all products with deterministic agents (once implemented)
npx tsx scripts/score-with-deterministic-agents.ts

# Expected result: Scores improve from 25-50 range to 60-90 range
```

### Step 2: Start UI Development
```bash
# Already running on http://localhost:3000
# Make changes to components
# See live reload

# Focus areas:
# 1. src/components/ProductCard.tsx
# 2. src/app/page.tsx (home page)
# 3. Add score breakdown modal
```

### Step 3: Start Writing Tests
```bash
# Install testing dependencies (if not installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Create first test
# __tests__/agents/PriceAgent.test.ts

# Run tests
npm test
```

---

## File Structure (After Implementation)

```
thriftai/
├── src/
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── DeterministicBaseAgent.ts ✅ NEW
│   │   │   ├── AgentOrchestrator.ts (ENHANCED)
│   │   │   ├── types.ts (ENHANCED)
│   │   │   └── specialized/
│   │   │       ├── PriceIntelligenceAgent.ts ✅ NEW
│   │   │       ├── QualityAssessmentAgent.ts ✅ NEW
│   │   │       ├── SustainabilityAgent.ts ✅ NEW
│   │   │       ├── TrustReliabilityAgent.ts ✅ NEW
│   │   │       ├── MarketDemandAgent.ts ✅ NEW
│   │   │       ├── SpecificationMatcherAgent.ts ✅ NEW
│   │   │       ├── FinancialValueAgent.ts ✅ NEW
│   │   │       ├── ScamDetectionAgent.ts ✅ NEW
│   │   │       ├── PersonalizationAgent.ts ✅ NEW
│   │   │       └── ArbitrageOpportunityAgent.ts ✅ NEW
│   │   ├── scrapers/ ✅ NEW DIRECTORY
│   │   │   ├── BaseScraper.ts
│   │   │   ├── EbayScraper.ts
│   │   │   ├── AmazonScraper.ts
│   │   │   └── ScraperOrchestrator.ts
│   │   ├── pipelines/ ✅ NEW DIRECTORY
│   │   │   └── ScoringPipeline.ts
│   │   ├── data/ ✅ NEW DIRECTORY
│   │   │   ├── brandDatabase.ts
│   │   │   ├── categoryData.ts
│   │   │   └── sustainabilityRatings.ts
│   │   └── config/
│   │       └── agentWeights.ts ✅ NEW
│   ├── components/
│   │   ├── ProductCard.tsx (ENHANCE)
│   │   ├── ScoreBreakdown.tsx ✅ NEW
│   │   ├── SearchFilters.tsx ✅ NEW
│   │   └── ...
│   └── app/
│       ├── admin/ ✅ NEW
│       │   ├── dashboard/page.tsx
│       │   └── products/page.tsx (EXISTS)
│       ├── watchlist/page.tsx ✅ NEW
│       ├── compare/page.tsx (ENHANCE)
│       └── ...
├── __tests__/ ✅ NEW DIRECTORY
│   ├── agents/
│   ├── scrapers/
│   ├── api/
│   ├── components/
│   └── e2e/
├── scripts/
│   └── score-with-deterministic-agents.ts ✅ NEW
├── prisma/
│   └── migrations/
│       └── add-performance-indices.sql ✅ NEW
└── docs/
    ├── PRODUCTION-ROADMAP.md ✅ CREATED
    ├── IMPLEMENTATION-PLAN.md ✅ THIS FILE
    └── API-DOCUMENTATION.md ✅ NEW
```

---

## Success Metrics

### After Week 1:
- ✅ 10 agents implemented and working
- ✅ Scores in 60-90 range (not 25-50)
- ✅ All agents have unit tests
- ✅ Orchestrator integrates all agents

### After Week 2:
- ✅ 5,000+ products scraped from real sources
- ✅ Database optimized (queries <100ms)
- ✅ Daily scraping cron job operational
- ✅ Admin dashboard functional

### After Week 3:
- ✅ UI polished and responsive
- ✅ 80%+ test coverage
- ✅ Lighthouse score >90
- ✅ Zero critical bugs
- ✅ Production deployed

---

## Next Immediate Action

**RIGHT NOW - Start with**:

1. **Create DeterministicBaseAgent.ts** (30 min)
2. **Implement PriceIntelligenceAgent.ts** (1 hour)
3. **Test it with existing products** (30 min)
4. **See scores improve immediately**

**Command to execute**:
```bash
# I'll create the first agent file in the next message
# You can start seeing results within 2 hours
```

---

*This plan is executable, measurable, and delivers value incrementally. Each day shows progress!*
