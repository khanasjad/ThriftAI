# Veritas.AI Gap Analysis
## Plan vs. Current Implementation

**Date**: 2026-10-20
**Document**: Veritas.AI — Product & Technical Plan (24 pages)
**Current Codebase**: ThriftAI (Next.js 15.5.4)

---

## Executive Summary

### Overall Status: 🟡 **Foundation Strong, Core Features Incomplete**

- **Database Schema**: ✅ 95% Complete - Excellent alignment with Veritas specification
- **Agent System**: 🟡 10% Complete - 1 of 10 agents fully implemented
- **UI Components**: 🟡 40% Complete - Components exist but design doesn't match plan
- **Backend Infrastructure**: ❌ 0% Complete - No FastAPI agents service, no pipeline
- **Search Flow**: ❌ 0% Complete - No Intent Parser, no ranking model

**Key Insight**: The database foundation is production-ready, but the core intelligence (agents) and search pipeline are missing.

---

## Part 1: What's Implemented ✅

### 1.1 Database Schema (95% Complete) ✅

**Status**: Excellent alignment with Veritas.AI specification

**Implemented Models**:
```prisma
✅ VeritasScore - Overall score storage with SSN
✅ VeritasCategory - 8 category types as specified
✅ VeritasParameter - Individual metrics within categories
✅ VeritasEvidence - Agent reasoning and evidence
✅ VeritasCompanyProfile - Brand data, stock prices
✅ VeritasProductSpec - Technical specifications
✅ VeritasSellerProfile - Seller trust metrics
✅ VeritasSecurityPolicy - Platform security analysis
✅ VeritasProductQuality - Condition and authenticity
✅ VeritasMarketData - Pricing and competition analysis
✅ VeritasSustainability - Environmental impact
✅ VeritasUserExperience - Listing quality metrics
✅ VeritasScoreHistory - Historical tracking
✅ VeritasAdjustment - Manual overrides
```

**Category Types Match Plan**:
```typescript
enum VeritasCategoryType {
  PRODUCT_QUALITY      // ✅ Quality Assessment Agent
  SELLER_TRUST         // ✅ Trust & Reliability Agent
  ENVIRONMENTAL_IMPACT // ✅ Sustainability Agent
  MARKET_DEMAND        // ✅ Market Demand Agent
  PRICING              // ✅ Price Intelligence Agent
  SPECIFICATIONS       // ✅ Specification Matcher Agent
  FINANCIAL_VALUE      // ✅ Financial Value Agent
  USER_EXPERIENCE      // ✅ (User preference integration)
}
```

**What's Missing from Schema**:
- ❌ Scam Detection flags table (mentioned in plan but not in schema)
- ❌ Personalization user preference weights table
- ❌ Arbitrage opportunity tracking

### 1.2 Agents (10% Complete) 🟡

**Fully Implemented**: 1 of 10

#### ✅ **PriceIntelligenceAgent** (Production-Ready)
- **File**: `/src/lib/agents/specialized/PriceIntelligenceAgent.ts`
- **Status**: Fully implemented with comprehensive tests
- **Features**:
  - Compares price to category median
  - Detects suspiciously low prices (scam protection)
  - Confidence scoring based on data quality
  - Detailed reasoning output
- **Performance**: 3-40ms per product
- **Test Coverage**: 15 test cases, all passing
- **Output Format**: ⚠️ Does NOT match plan's JSON contract (needs standardization)

**Partially Implemented**: 6 of 10

Files exist but implementation incomplete:
- 🟡 QualityAgent.ts (exists, needs review)
- 🟡 TrustAgent.ts (exists, needs review)
- 🟡 SustainabilityAgent.ts (exists, needs review)
- 🟡 MarketDemandAgent.ts (exists, needs review)
- 🟡 SpecMatcherAgent.ts (exists, needs review)
- 🟡 FinancialValueAgent.ts (exists, needs review)

**Not Implemented**: 3 of 10

- ❌ ScamDetectionAgent (critical for MVP)
- ❌ PersonalizationAgent
- ❌ ArbitrageOpportunityAgent

#### ✅ **DeterministicBaseAgent** (Complete)
- Base class for all agents
- Provides: normalization, logging, error handling, result formatting

#### 🟡 **AgentOrchestrator** (Partial)
- File exists but needs review against plan's weighted aggregation formula

### 1.3 UI Components (40% Complete) 🟡

**Implemented Components** (29 total via Glob):

#### Core Components ✅
- `VeritasScoreBadge.tsx` - Score display (ring visualization)
- `VeritasScoreModal.tsx` - Detailed breakdown
- `ProductCard.tsx` - Product display card
- `Navigation.tsx` - Site navigation
- `Footer.tsx` - Site footer
- `HeroSection.tsx` - Home page hero (1,084 lines - VERY COMPLEX)

#### Search Components ✅
- `SearchBar.tsx`
- `VisualSearchModal.tsx`
- `VoiceSearchModal.tsx`

#### Product Features ✅
- `ProductComparison.tsx` - Side-by-side comparison
- `ProductRecommendations.tsx`
- `ProductFilters.tsx`

#### Specialized ✅
- `ChatWidget.tsx` - AI assistant
- `LoginModal.tsx`, `SignupModal.tsx`

**Problems with Current UI**:
1. ❌ **HeroSection is too complex** (1,084 lines, many features not in plan)
2. ❌ **Design doesn't match plan** (plan says "calm, editorial, trustworthy" - current has category tiles, animations, complex features)
3. ❌ **Color scheme doesn't match** (plan emphasizes white space and minimalism)

### 1.4 Pages

**Implemented**:
- ✅ Home page (`/src/app/page.tsx`)
- ✅ Products listing (inferred from components)
- ✅ Product detail pages (inferred from components)
- ✅ Search results (inferred from components)

**Status**: Pages exist but UI design needs alignment with plan specifications

### 1.5 API Routes

**Implemented** (inferred from page.tsx):
- ✅ `/api/claude-intelligent-search` - Claude-powered search
- ✅ `/api/intelligent-search-lite` - Fallback search
- ✅ `/api/visual-search` - Image-based search

**Status**: REST API exists, but no FastAPI agents service as specified in plan

### 1.6 Authentication

**Implemented**:
- ✅ NextAuth.js integration (`useSession`, `signIn`, `signOut`)
- ✅ User model in database
- ✅ Login/Signup modals

---

## Part 2: What Needs to Change 🔄

### 2.1 Agent Output Format Standardization

**Current Format** (PriceIntelligenceAgent):
```typescript
{
  score: 75,
  confidence: 0.85,
  reasoning: "Price is 14.5% below median. Good value.",
  factors: { ... },
  processingTime: 3
}
```

**Plan's Required Format**:
```json
{
  "agent": "PriceIntelligenceAgent",
  "listing_id": "lst_8f21",
  "score": 82,
  "confidence": 0.9,
  "evidence": ["$3.10 below 90-day median", "cheapest of 14 sellers"],
  "flags": [],
  "model_version": "price-v3.2",
  "computed_at": "2026-10-20T16:02:11Z"
}
```

**Required Changes**:
1. Add `agent` field (agent name)
2. Add `listing_id` field
3. Change `reasoning` → `evidence` (array of strings)
4. Add `flags` array for warnings
5. Add `model_version` for versioning
6. Add `computed_at` timestamp

**Action**: Update `DeterministicBaseAgent` to enforce this contract

### 2.2 Scoring Formula Alignment

**Plan Specifies**:
```
Final Score = Weighted Average of 8 Categories × (1 - r_scam)

Default Weights:
- Spec match: 25%
- Price: 20%
- Quality: 15%
- Trust: 15%
- Financial value: 10%
- Demand: 5%
- Sustainability: 5%
- Scam: Multiplier (not additive)
```

**Current Implementation**:
- ⚠️ Needs verification in `AgentOrchestrator.ts`
- ⚠️ Scam agent needs to work as multiplier, not additive component

**Action**: Review and update `AgentOrchestrator` to match exact formula

### 2.3 UI Design Philosophy

**Plan Says**:
> "Calm, editorial, trustworthy: lots of white space, no flashing deals or countdown timers, no 'Only 3 left!' Dark patterns avoided."

**Current HeroSection.tsx** (1,084 lines):
- ❌ Too complex with many features (category tiles, voice search, visual search, price sliders)
- ❌ Not minimalist (plan shows: centered search box, rotating examples, nothing else)
- ❌ Too many visual elements

**Plan's Home Page Specification**:
```
1. Centered search box (large)
2. Rotating example searches ("Sony WH-1000XM5 headphones")
3. One-sentence tagline
4. NOTHING ELSE
```

**Action**: Simplify `HeroSection.tsx` to match plan's minimalist design

### 2.4 Results Page Structure

**Plan Specifies**:
```
1. "Understood-as" editable chips bar at top
2. Top pick: Large card (1 item, highest score)
3. Ranked list: 5-10 items below
4. Score breakdown drawer (right side, collapsible)
```

**Current Implementation**:
- ❌ No "understood-as" chips
- ❌ No top pick card
- ❌ Results likely shown as uniform grid

**Action**: Restructure results page to match plan

### 2.5 Color Palette

**Plan Specifies** (Page 10):
- Primary: #0071E3 (Apple blue) ✅ Mentioned in UI-DESIGN-SYSTEM.md
- Success: #30D158 (Apple green) ✅
- Warning: #FF9F0A ✅
- Error: #FF3B30 ✅
- **Emphasis**: Lots of white space, minimal color

**Current Implementation**:
- UI-DESIGN-SYSTEM.md has correct colors
- WorldClassHero.tsx (rejected component) used vibrant gradients ❌
- Need to verify current HeroSection doesn't overuse color

**Action**: Audit all components for minimalist color usage

### 2.6 Data Acquisition Approach

**Plan Emphasizes** (Page 16-17):
> "LEGAL ONLY: eBay Browse API, Amazon Product Advertising API, affiliate feeds. NO SCRAPING without written permission."

**Current Implementation**:
- ⚠️ Unknown - need to verify product ingestion approach
- ⚠️ Check if any scraping code exists

**Action**: Verify all data acquisition is through official APIs

---

## Part 3: What Needs to be Added ➕

### 3.1 Missing Agents (9 of 10)

#### Priority 1: MVP Core Agents (Per Plan, Page 18)

**1. SpecificationMatcherAgent** (25% weight - HIGHEST)
- **Status**: File exists (`SpecMatcherAgent.ts`), needs implementation review
- **Requirements from Plan**:
  - Hard constraints (storage ≥ 256GB, RAM ≥ 16GB)
  - Embedding similarity (CLIP for images, BERT for text)
  - Budget-fit curve (exponential penalty if over budget)
  - Spec coverage score
- **Inputs**: User query, product specs, hard constraints
- **Outputs**: Score 0-100, matched attributes, missing attributes
- **Effort**: 3-4 days (complex logic)

**2. ScamDetectionAgent** (CRITICAL - Multiplier)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Price anomaly detection (>2σ below median → flag)
  - Duplicate image detection (pHash)
  - Seller velocity patterns (new seller + high volume = suspicious)
  - Stolen image detection (reverse image search)
  - Output: r_scam (0-1, where 1 = definitely scam)
- **Inputs**: Product data, seller history, image data
- **Outputs**: Scam probability 0-1, flags array, evidence
- **Effort**: 4-5 days (requires image analysis, pattern detection)

**3. FinancialValueAgent** (10% weight)
- **Status**: File exists, needs review
- **Requirements from Plan**:
  - Total cost of ownership (TCO): price + shipping + tax + estimated repairs
  - Cost-per-year calculation (TCO / expected lifespan)
  - Resale value estimation
  - Warranty value
- **Inputs**: Price, shipping, condition, category, brand
- **Outputs**: Score 0-100, TCO breakdown, cost-per-year
- **Effort**: 2-3 days

#### Priority 2: Remaining Core Agents

**4. QualityAssessmentAgent** (15% weight)
- **Status**: File exists, needs review
- **Requirements from Plan**:
  - Aspect-based sentiment analysis (build quality, reliability)
  - Brand quality priors (Sony > Generic)
  - Image quality analysis (blur detection, lighting)
  - Condition assessment
- **Effort**: 3-4 days

**5. TrustReliabilityAgent** (15% weight)
- **Status**: File exists, needs review
- **Requirements from Plan**:
  - Bayesian rating aggregation (Wilson score)
  - Seller history (age, volume, disputes)
  - Return policy completeness
  - Shipping reliability
- **Effort**: 3-4 days

**6. MarketDemandAgent** (10% weight)
- **Status**: File exists, needs review
- **Requirements from Plan**:
  - Popularity score (views, saves)
  - Trending tags
  - Sell-through rate
  - Time on market
- **Effort**: 2 days

**7. SustainabilityAgent** (10% weight)
- **Status**: File exists, needs review
- **Requirements from Plan**:
  - Material composition analysis
  - Repairability score (iFixit data)
  - Energy efficiency certifications
  - Carbon footprint estimation
- **Effort**: 2-3 days

#### Priority 3: Personalization (Post-MVP)

**8. PersonalizationAgent** (5% weight)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Contextual bandit for weight learning
  - User preference weighting (re-weight 8 categories)
  - Click history analysis
  - A/B testing framework
- **Effort**: 4-5 days (ML integration)

**9. ArbitrageOpportunityAgent** (Optional)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Resale margin calculation
  - Arbitrage potential (buy price vs. likely sell price)
  - Market liquidity assessment
  - Optional filter, not included in Veritas Score
- **Effort**: 2-3 days

### 3.2 Missing Infrastructure Components

#### Search Flow Components

**1. Intent Parser** (Critical)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - LLM-based query understanding (GPT-4/Claude)
  - JSON schema output:
    ```json
    {
      "item": "Sony WH-1000XM5",
      "hard_constraints": {"storage": ">=256GB"},
      "soft_prefs": {"color": "black"},
      "budget": 300
    }
    ```
  - Editable chips UI (user can modify)
- **Tech Stack**: OpenAI/Anthropic API
- **Effort**: 3-4 days

**2. Entity Resolution Service** (Critical)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - GTIN → canonical product matching
  - Embedding-based duplicate detection
  - Human review queue for ambiguous matches
  - Brand/model normalization
- **Tech Stack**: PostgreSQL + embeddings table + admin UI
- **Effort**: 5-7 days

**3. Learning-to-Rank Model** (Post-MVP)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - LambdaMART/LightGBM
  - Features: 8 agent scores + user context
  - Training data: clicks, add-to-cart, purchases
  - Offline evaluation (NDCG)
- **Tech Stack**: Python + LightGBM + Feature Store
- **Effort**: 7-10 days (ML pipeline)

#### Backend Services

**1. FastAPI Agents Service** (Critical)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Python FastAPI service
  - `/score` endpoint (single product)
  - `/batch_score` endpoint (multiple products)
  - Async agent execution
  - Redis caching layer
- **Tech Stack**: Python 3.11, FastAPI, Redis
- **Effort**: 4-5 days

**2. Data Ingestion Pipeline** (Critical)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - eBay Browse API integration
  - Amazon Product Advertising API integration
  - Affiliate feed parsers (CJ, ShareASale)
  - Kafka → Spark → Delta Lake
  - Airflow orchestration
  - Hourly/daily update schedules
- **Tech Stack**: Kafka, Spark, Airflow, Delta Lake
- **Effort**: 10-14 days (complex pipeline)

**3. Feature Store** (Post-MVP)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Store computed features (category medians, seller stats)
  - Low-latency lookup (<10ms)
  - Version control for features
- **Tech Stack**: Redis + PostgreSQL
- **Effort**: 5-7 days

#### Databases & Storage

**1. OpenSearch/Elasticsearch** (Critical)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Hybrid search (BM25 + CLIP embeddings)
  - Faceted filtering (brand, price range, condition)
  - <100ms query latency
- **Tech Stack**: OpenSearch 2.x
- **Effort**: 3-4 days (setup + integration)

**2. Graph Database** (Post-MVP)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Scam ring detection (seller clusters)
  - Product relationship graph
- **Tech Stack**: Neo4j or DGraph
- **Effort**: 5-7 days

**3. Lakehouse** (Post-MVP)
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Historical data storage (Delta Lake or Iceberg)
  - Analytics queries
- **Tech Stack**: Delta Lake + S3/MinIO
- **Effort**: 4-5 days

### 3.3 Missing UI Components

**1. "Understood-as" Editable Chips Bar**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Shows parsed query as editable chips
  - User can click to modify (e.g., change ">=256GB" to ">=512GB")
  - Updates search results live
- **Location**: Top of results page
- **Effort**: 2 days

**2. Top Pick Large Card**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - First result shown as large card (image left, details right)
  - Prominent Veritas Score (90+)
  - "Why this?" explanation (3-4 bullet points)
- **Location**: Top of results list
- **Effort**: 1-2 days

**3. Score Breakdown Drawer**
- **Status**: Partial (VeritasScoreModal exists)
- **Requirements from Plan**:
  - Right side drawer (not center modal)
  - Shows all 8 category scores as bars
  - Click each category → see detailed reasoning
  - Shows agent evidence bullets
- **Action**: Convert modal to right drawer
- **Effort**: 1 day

**4. Price History Sparkline**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Small chart showing 90-day price trend
  - Shows if price is rising/falling
- **Location**: Product card
- **Effort**: 1 day

**5. "Wait or Buy?" Hint**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Simple text hint: "Good time to buy" or "Wait, price dropping"
  - Based on price history + market demand
- **Location**: Product card
- **Effort**: 1 day (after price history implemented)

### 3.4 Missing Pages

**1. Comparison Page**
- **Status**: Component exists (`ProductComparison.tsx`), needs full page
- **Requirements from Plan**:
  - Side-by-side comparison (up to 4 products)
  - All 8 category scores compared
  - Spec differences highlighted
- **Effort**: 2 days

**2. About/How It Works Page**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Explain Veritas Score methodology
  - Transparent about data sources
  - Example score breakdown
- **Effort**: 2 days (content + design)

**3. Seller Profile Page**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Seller trust score
  - Historical performance
  - Product catalog
- **Effort**: 3 days

### 3.5 Browser Extension (Future)

**Status**: ❌ NOT IMPLEMENTED
**Requirements from Plan**:
- Inject Veritas Score on Amazon/eBay product pages
- Side panel with detailed breakdown
- Chrome + Firefox support

**Tech Stack**: Manifest V3, React
**Effort**: 7-10 days

### 3.6 B2B Features (Future)

**1. Score API**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - REST API for partners
  - Rate limiting (tier-based)
  - API key authentication
  - SLA: <2s response time
- **Effort**: 5-7 days

**2. White-label Badge**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Embeddable widget for partner sites
  - iframe or web component
  - Customizable branding
- **Effort**: 4-5 days

**3. Admin Dashboard**
- **Status**: ❌ NOT IMPLEMENTED
- **Requirements from Plan**:
  - Manage API keys
  - Usage analytics
  - Manual score overrides
  - Entity resolution review queue
- **Effort**: 7-10 days

---

## Part 4: Implementation Roadmap 🗺️

### Phase 1: MVP Core (4 weeks) - CRITICAL PATH

**Goal**: 5 core agents working, basic search flow, legal data sources

#### Week 1: Complete Core Agents
- **Day 1-2**: ScamDetectionAgent (CRITICAL - security)
- **Day 3-4**: SpecificationMatcherAgent (25% weight - highest impact)
- **Day 5**: FinancialValueAgent
- **Day 6-7**: Review & fix QualityAgent, TrustAgent

**Deliverable**: 5 agents producing standardized output

#### Week 2: Agent Orchestration & Standardization
- **Day 1-2**: Update all agents to plan's JSON contract format
- **Day 3-4**: Implement weighted aggregation formula in AgentOrchestrator
- **Day 5**: Add scam multiplier logic
- **Day 6-7**: Comprehensive agent integration tests

**Deliverable**: End-to-end scoring system working

#### Week 3: Search Flow & UI
- **Day 1-2**: Simplify HeroSection (minimalist design per plan)
- **Day 3-4**: Implement Intent Parser (LLM-based)
- **Day 5**: Build "understood-as" chips UI
- **Day 6**: Restructure results page (top pick + ranked list)
- **Day 7**: Convert score modal to right drawer

**Deliverable**: User-facing search experience matches plan

#### Week 4: Data Ingestion & Testing
- **Day 1-3**: eBay Browse API integration (LEGAL data source)
- **Day 4-5**: Entity Resolution service (basic version)
- **Day 6**: End-to-end testing with real eBay data
- **Day 7**: Performance optimization, bug fixes

**Deliverable**: MVP ready for closed beta

### Phase 2: Scale & Polish (3 weeks)

**Goal**: Learning-to-rank, remaining agents, performance optimization

#### Week 5: Remaining Agents
- **Day 1-2**: MarketDemandAgent + SustainabilityAgent
- **Day 3-5**: PersonalizationAgent (contextual bandit)
- **Day 6-7**: ArbitrageOpportunityAgent (optional)

#### Week 6: Infrastructure
- **Day 1-3**: OpenSearch setup (hybrid search)
- **Day 4-5**: FastAPI agents service (separate from Next.js)
- **Day 6-7**: Redis caching layer

#### Week 7: ML & Optimization
- **Day 1-4**: Learning-to-rank model (LightGBM)
- **Day 5-6**: Feature store setup
- **Day 7**: Performance testing (target: <2s search latency)

**Deliverable**: Production-ready system

### Phase 3: Advanced Features (4 weeks)

**Goal**: Pipeline automation, B2B features, browser extension

#### Week 8-9: Data Pipeline
- Amazon API integration
- Kafka + Spark pipeline
- Airflow orchestration
- Daily/hourly update schedules

#### Week 10: B2B Features
- Score API with authentication
- White-label badge widget
- Admin dashboard

#### Week 11: Browser Extension
- Chrome extension MVP
- Inject scores on Amazon/eBay

**Deliverable**: Full product suite

---

## Part 5: Effort Estimates Summary

### Immediate (MVP - 4 weeks, 160 hours)
- **Agents**: 60 hours (5 agents + orchestration)
- **UI Alignment**: 30 hours (simplify hero, results page, drawer)
- **Intent Parser**: 20 hours (LLM integration)
- **eBay API**: 25 hours (legal data ingestion)
- **Entity Resolution**: 25 hours (basic version)

### Short-term (Weeks 5-7, 120 hours)
- **Remaining Agents**: 40 hours (3 agents)
- **Infrastructure**: 50 hours (OpenSearch, FastAPI, Redis)
- **ML Model**: 30 hours (LightGBM LTR)

### Long-term (Weeks 8-11, 160 hours)
- **Pipeline**: 80 hours (Kafka, Spark, Airflow)
- **B2B Features**: 50 hours (API, badge, dashboard)
- **Extension**: 30 hours (Chrome/Firefox)

**Total Estimate**: 440 hours (~3 months full-time)

---

## Part 6: Critical Decisions Needed 🚨

### Decision 1: Agent Implementation Language
**Plan Suggests**: Python (FastAPI) for agents
**Current Implementation**: TypeScript agents

**Options**:
- **A**: Keep TypeScript (faster short-term, easier integration)
- **B**: Rewrite in Python (plan compliance, better ML ecosystem)

**Recommendation**: Keep TypeScript for MVP, migrate to Python in Phase 2

### Decision 2: Search Infrastructure
**Plan Requires**: OpenSearch + LLM Intent Parser
**Current**: Claude-based search (simpler but less scalable)

**Options**:
- **A**: Build OpenSearch + Intent Parser now (4-5 days extra)
- **B**: Use current Claude search for MVP, upgrade in Phase 2

**Recommendation**: Option B (faster MVP, upgrade later)

### Decision 3: Data Source Priority
**Legal Options** (per plan):
- eBay Browse API (free, 5000 calls/day)
- Amazon Product Advertising API (requires affiliate account)
- Affiliate feeds (CJ, ShareASale)

**Recommendation**: Start with eBay API (easiest to implement legally)

### Decision 4: UI Redesign Scope
**Current HeroSection**: 1,084 lines (very complex)
**Plan Specifies**: Minimal (search box + examples only)

**Options**:
- **A**: Complete rewrite (2-3 days, clean slate)
- **B**: Incremental simplification (4-5 days, preserve working features)

**Recommendation**: Option A (faster, cleaner alignment with plan)

---

## Part 7: Risk Assessment ⚠️

### High Risk
1. **Scam Detection Agent**: Complex ML (image hashing, pattern detection) - may need external services
2. **Entity Resolution**: Requires human review queue + admin tooling - takes time
3. **Learning-to-Rank**: Need labeled training data (clicks, purchases) - cold start problem
4. **Latency Budget**: Plan requires <2s total - need careful optimization

### Medium Risk
1. **eBay API Rate Limits**: 5000 calls/day may not be enough for production scale
2. **Agent Accuracy**: Deterministic agents may not be as accurate as ML-based (plan mentions future ML migration)
3. **UI Redesign**: User may have strong opinions on design changes

### Low Risk
1. **Database Schema**: Already excellent, minimal changes needed
2. **Core Agent Logic**: PriceAgent working well, template for others
3. **Authentication**: Already implemented with NextAuth

---

## Part 8: Quick Wins 🎯

### Can Be Done in 1 Day Each:
1. **Standardize Agent Output Format**: Update DeterministicBaseAgent to enforce plan's JSON contract
2. **Simplify Home Page**: Strip HeroSection down to search box + examples
3. **Add Top Pick Card**: Create large card component for #1 result
4. **Convert Modal to Drawer**: Change VeritasScoreModal to right-side drawer
5. **Add Price History Table**: Simple table in database, render sparkline

### Can Be Done in 1-2 Days:
1. **Understood-as Chips UI**: Editable chip components
2. **About/How It Works Page**: Explain methodology
3. **FinancialValueAgent**: TCO calculation logic
4. **MarketDemandAgent**: Popularity scoring

---

## Part 9: Alignment Checklist

### Must Match Plan Exactly ✅
- [ ] Agent output format (JSON contract with evidence, flags, version)
- [ ] Scoring formula (weighted avg × scam multiplier)
- [ ] Home page design (centered search, rotating examples, white space)
- [ ] Results page structure (chips, top pick, ranked list, drawer)
- [ ] Data sources (LEGAL APIs only, no unauthorized scraping)
- [ ] Color palette (Apple blues/greens, minimal usage)
- [ ] Latency budget (<2s search end-to-end)

### Can Be Interpreted 🟡
- [ ] Agent implementation details (TypeScript vs Python)
- [ ] Infrastructure choices (managed services vs self-hosted)
- [ ] Feature prioritization (MVP scope flexible)
- [ ] UI polish level (animations, transitions)

### Not in Plan (Remove or Defer) ❌
- [ ] WorldClassHero component (vibrant gradients - doesn't match minimalist philosophy)
- [ ] Excessive category tiles on home (plan shows simple search only)
- [ ] Voice search (not mentioned in plan - nice-to-have)
- [ ] Complex visual search (plan mentions it but lower priority)

---

## Part 10: Next Immediate Steps

### This Week (Days 1-7):

**Day 1 (Today)**:
1. Review this gap analysis document
2. Make critical decisions (see Part 6)
3. Set up project tracking (Jira/Linear/GitHub Projects)

**Day 2**:
1. Update DeterministicBaseAgent with standardized output format
2. Update PriceIntelligenceAgent to use new format
3. Write unit tests for format compliance

**Day 3-4**:
1. Implement ScamDetectionAgent (MVP version - price anomaly + basic checks)
2. Test with real product data

**Day 5-6**:
1. Review & complete SpecificationMatcherAgent (25% weight - critical)
2. Integration tests with orchestrator

**Day 7**:
1. Review progress
2. Plan next week (UI simplification)

---

## Conclusion

### The Good News ✅
- **Database foundation is excellent** (95% aligned with plan)
- **Agent architecture is sound** (PriceAgent proves the pattern works)
- **Core components exist** (just need refinement)

### The Reality Check 🟡
- **Only 1 of 10 agents truly complete** (9 more to go)
- **UI doesn't match plan's minimalism** (needs significant simplification)
- **No backend infrastructure** (FastAPI service, pipeline, OpenSearch all missing)
- **No legal data ingestion** (eBay API not integrated yet)

### The Path Forward 🚀
- **MVP is 4 weeks away** (if focused on core 5 agents + basic search)
- **Production-ready is 3 months away** (all 10 agents + infrastructure + polish)
- **The plan is solid** - just needs systematic execution

### Success Criteria
A successful MVP will have:
1. 5 core agents producing standardized scores
2. Minimalist UI matching plan (search box → results with top pick)
3. Legal eBay data ingestion
4. <2s search latency
5. Transparent score breakdowns

**Ready to build when you are.** 🏗️
