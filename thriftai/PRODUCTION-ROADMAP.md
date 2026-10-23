# ThriftAI Production Roadmap - 10 Agent System

> **Goal**: Transform ThriftAI into a production-ready marketplace with intelligent scoring, real data, comprehensive tests, and polished UI

**Timeline**: 2-3 weeks
**Approach**: Build deterministic agents first, add AI capabilities later

---

## Current State Analysis

### ✅ What's Working
- Next.js 15.5.4 with Turbopack
- PostgreSQL database with Prisma ORM
- Basic product catalog (1,022 seeded products)
- Frontend components (ProductCard, LeaderboardCard, etc.)
- Scoring system architecture (ready for agents)

### ⚠️ What Needs Work
1. **Agents**: AI scoring engine exists but needs API keys
2. **UI Polish**: Inconsistent styling, missing features
3. **Tests**: No test coverage
4. **Real Data**: Mock data, need real scraped products
5. **Database**: Not optimized, missing indices
6. **Algorithms**: Basic heuristics, need sophisticated scoring
7. **Performance**: No caching, slow queries

---

## 10 Specialized Agents Architecture

### Agent Philosophy
- **Deterministic First**: Build rule-based logic without AI APIs
- **Modular Design**: Each agent is independent
- **Upgradeable**: Easy to swap heuristics with AI calls later
- **Observable**: All agents log decisions and reasoning

---

## The 10 Agents

### 1. **Price Intelligence Agent**
**Purpose**: Analyze price competitiveness and value

**Deterministic Logic**:
```typescript
- Compare with average category price
- Calculate % discount from MSRP
- Check historical price trends (if available)
- Identify price outliers (too cheap = suspicious, too expensive = bad deal)
- Score: 0-100 based on:
  * 20-40% below category average = 90-100
  * 0-20% below average = 70-90
  * At average = 60
  * Above average = 0-60 (scaled)
```

**AI Upgrade Path**: Use LLM to understand market context, seasonal trends

---

### 2. **Quality Assessment Agent**
**Purpose**: Evaluate product condition and durability

**Deterministic Logic**:
```typescript
- Condition keywords analysis:
  * "New", "Sealed" = +30 points
  * "Like New", "Excellent" = +25 points
  * "Very Good" = +20 points
  * "Good" = +10 points
  * "Fair", "Acceptable" = 0 points
- Brand reputation score (predefined brand rankings)
- Product age (if available)
- Description quality (length, detail level)
- Missing info penalty
```

**AI Upgrade Path**: Computer vision for image quality analysis, NLP for description quality

---

### 3. **Sustainability Agent**
**Purpose**: Calculate environmental impact and eco-friendliness

**Deterministic Logic**:
```typescript
- Buying used = +30 points (vs new)
- Brand sustainability rating (maintain database):
  * Patagonia, Fairphone = +20 points
  * Nike, Apple (commitments) = +10 points
- Durability signals:
  * "Lifetime warranty" = +15 points
  * "Repairable" = +10 points
- Packaging keywords:
  * "Minimal packaging" = +5 points
- Material keywords:
  * "Recycled", "Organic" = +10 points
```

**AI Upgrade Path**: LLM to understand product lifecycle, carbon footprint estimation

---

### 4. **Trust & Seller Reliability Agent**
**Purpose**: Assess seller credibility

**Deterministic Logic**:
```typescript
- Seller rating (if available):
  * 4.8-5.0 = +30 points
  * 4.5-4.8 = +20 points
  * 4.0-4.5 = +10 points
  * <4.0 = 0 points
- Number of reviews:
  * 1000+ = +20 points
  * 100-1000 = +10 points
  * 10-100 = +5 points
- Verified seller badge = +15 points
- Return policy:
  * 30+ days = +10 points
  * 14-30 days = +5 points
- Response time (if available)
```

**AI Upgrade Path**: LLM to detect scam patterns, analyze review sentiment

---

### 5. **Market Demand Agent**
**Purpose**: Gauge product popularity and demand

**Deterministic Logic**:
```typescript
- Category popularity (track search volume)
- Seasonal trends:
  * Winter coats in Dec-Feb = +20 points
  * Beach gear in Jun-Aug = +20 points
- Brand popularity (Google Trends data)
- Review count as demand proxy:
  * 500+ reviews = +25 points
  * 100-500 = +15 points
  * 50-100 = +5 points
- "Trending" or "Bestseller" tags = +20 points
```

**AI Upgrade Path**: Predictive analytics, trend forecasting

---

### 6. **Specification Matcher Agent**
**Purpose**: Match product specs against buyer needs

**Deterministic Logic**:
```typescript
- Feature completeness score:
  * Count of key features mentioned
  * Technical specs present = +10 points each
- Comparison with category standards:
  * iPhone 15: 256GB vs 128GB = +10 points
  * Higher RAM, better camera = +points
- Missing critical specs = penalty
- Keyword matching:
  * User search: "waterproof phone"
  * Product has "IP68 rating" = +30 points
```

**AI Upgrade Path**: NLP to extract specs from unstructured descriptions

---

### 7. **Financial Value Agent**
**Purpose**: Calculate total cost of ownership and ROI

**Deterministic Logic**:
```typescript
- Total Cost of Ownership:
  * Purchase price
  * Estimated shipping
  * Potential repair costs (condition-based)
  * Energy consumption (electronics)
- Resale value estimation:
  * Brand depreciation rate (database)
  * Age factor
  * Condition factor
- ROI score = (Expected lifetime value / Total cost) * 100
- Warranty value:
  * 1 year = +5 points
  * 2+ years = +10 points
```

**AI Upgrade Path**: ML models for depreciation prediction

---

### 8. **Scam Detection Agent**
**Purpose**: Identify suspicious listings

**Deterministic Logic**:
```typescript
- Red flags detection:
  * Price < 50% of market average = -30 points (too good to be true)
  * Stock photos (reverse image search) = -20 points
  * Spelling errors in title = -10 points
  * Vague description (<50 words) = -15 points
  * No return policy = -10 points
  * New seller with low price = -20 points
  * External payment requests = -50 points (auto-reject)
- Safety score: 0-100
- Anything <40 = flagged for review
```

**AI Upgrade Path**: ML fraud detection, image authenticity analysis

---

### 9. **Personalization Agent**
**Purpose**: Tailor scores to individual user preferences

**Deterministic Logic**:
```typescript
- User profile analysis:
  * Budget-conscious: Weight price +20%
  * Eco-warrior: Weight sustainability +30%
  * Tech enthusiast: Weight specs +25%
- Purchase history patterns:
  * Frequently buys Apple = boost Apple products +10
  * Prefers "Like New" = boost similar conditions +10
- Search history:
  * Searched "laptops" 10 times = boost laptop scores +5
- Category preferences:
  * 70% purchases in Electronics = boost Electronics +10
```

**AI Upgrade Path**: Collaborative filtering, deep learning recommendations

---

### 10. **Arbitrage Opportunity Agent**
**Purpose**: Find products with high resale potential

**Deterministic Logic**:
```typescript
- Resale margin calculation:
  * Current price vs average eBay sold prices
  * Margin > 30% = +30 points
  * Margin 20-30% = +20 points
  * Margin 10-20% = +10 points
- Market liquidity:
  * eBay sold count (last 30 days):
    * 100+ = +20 points (hot item)
    * 50-100 = +15 points
    * 10-50 = +10 points
- Seasonal opportunities:
  * Buy winter coats in summer = +15 points
- Limited edition / collectibles = +25 points
```

**AI Upgrade Path**: ML price prediction, market trend analysis

---

## Agent Orchestration System

### Scoring Pipeline
```typescript
1. Product enters system (scraped or manual)
2. Orchestrator dispatches to all 10 agents in parallel
3. Each agent returns:
   {
     agentName: "PriceAgent",
     score: 85,
     confidence: 0.9,
     reasoning: "20% below category average",
     factors: { discount: 20, category: "Electronics" }
   }
4. Orchestrator aggregates scores using learned weights:
   - Price: 15%
   - Quality: 15%
   - Sustainability: 10%
   - Trust: 15%
   - Demand: 10%
   - Specs: 10%
   - Financial Value: 10%
   - Scam Detection: 10% (negative weight)
   - Personalization: 5%
   - Arbitrage: 0% (optional filter)
5. Final Veritas Score = Weighted Average (0-100)
6. Store component scores for transparency
```

---

## Implementation Plan - 3 Weeks

### Week 1: Foundation & Agents
**Days 1-2: Agent Framework**
- [ ] Create base Agent class with interface
- [ ] Implement AgentOrchestrator with parallel execution
- [ ] Add logging and observability
- [ ] Create agent config system

**Days 3-5: Implement Deterministic Agents**
- [ ] Day 3: Price, Quality, Sustainability agents
- [ ] Day 4: Trust, Demand, Specs agents
- [ ] Day 5: Financial Value, Scam Detection, Personalization, Arbitrage agents

**Days 6-7: Agent Testing**
- [ ] Unit tests for each agent
- [ ] Integration tests for orchestrator
- [ ] Test with existing 1,022 products
- [ ] Validate score distributions (expect 60-90 range)

---

### Week 2: Data & Database

**Days 1-2: Web Scraping**
- [ ] Build eBay scraper (use their API or Selenium)
- [ ] Build Amazon scraper (use Product Advertising API)
- [ ] Build Facebook Marketplace scraper
- [ ] Implement rate limiting and error handling
- [ ] Schedule daily scrapes (cron jobs)

**Day 3: Database Optimization**
- [ ] Add indices on frequently queried fields:
  ```sql
  CREATE INDEX idx_products_category ON products(category);
  CREATE INDEX idx_products_price ON products(price);
  CREATE INDEX idx_products_aiScore ON products(aiScore);
  CREATE INDEX idx_products_brand ON products(brand);
  CREATE INDEX idx_products_isAvailable ON products(isAvailable);
  CREATE INDEX idx_products_createdAt ON products(createdAt);
  ```
- [ ] Add full-text search index on name, description
- [ ] Implement database connection pooling
- [ ] Add database query caching (Redis)

**Days 4-5: Data Pipeline**
- [ ] Create ETL pipeline: Scrape → Clean → Score → Store
- [ ] Implement data validation and deduplication
- [ ] Add product image optimization (compression, CDN)
- [ ] Create admin dashboard for data management

**Days 6-7: Scoring Execution**
- [ ] Run all 1,022+ products through 10-agent system
- [ ] Analyze score distributions and tune weights
- [ ] Implement score refresh mechanism (daily)
- [ ] Add score history tracking

---

### Week 3: UI Polish & Testing

**Days 1-2: UI Improvements**
- [ ] Redesign ProductCard with better visuals
- [ ] Add score breakdown modal (show all 10 agent scores)
- [ ] Improve search with filters (price, category, score)
- [ ] Add product comparison view (side-by-side)
- [ ] Implement infinite scroll for products
- [ ] Add skeleton loaders for better UX
- [ ] Polish mobile responsiveness

**Days 3-4: Feature Enhancements**
- [ ] Add "Why this score?" explanation feature
- [ ] Implement watchlist / favorites
- [ ] Add price drop alerts
- [ ] Create personalized feed
- [ ] Add sorting options (price, score, popularity)
- [ ] Implement advanced filters

**Days 5-6: Comprehensive Testing**
- [ ] Unit tests for all agents (Jest)
- [ ] Integration tests for API routes (Supertest)
- [ ] E2E tests for critical flows (Playwright):
  * Search → View Product → Add to Cart → Checkout
  * Filter products
  * Compare products
- [ ] Component tests (React Testing Library)
- [ ] Performance tests (Lighthouse)
- [ ] Load testing (k6)

**Day 7: Launch Prep**
- [ ] Fix all critical bugs
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Documentation update
- [ ] Deployment to production

---

## Technical Implementation Details

### 1. Agent Base Class
```typescript
// src/lib/agents/BaseAgent.ts
export interface AgentResult {
  agentName: string;
  score: number; // 0-100
  confidence: number; // 0-1
  reasoning: string;
  factors: Record<string, any>;
  processingTime: number;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract weight: number; // Default weight in orchestrator

  abstract analyze(product: ProductInput): Promise<AgentResult>;

  protected log(message: string, data?: any): void {
    logger.info(`[${this.name}] ${message}`, data);
  }

  protected normalizeScore(raw: number, min: number, max: number): number {
    return Math.round(((raw - min) / (max - min)) * 100);
  }
}
```

### 2. Example Agent Implementation
```typescript
// src/lib/agents/PriceAgent.ts
export class PriceAgent extends BaseAgent {
  name = "PriceAgent";
  weight = 0.15;

  async analyze(product: ProductInput): Promise<AgentResult> {
    const startTime = Date.now();

    // Get category average price from database
    const categoryAvg = await this.getCategoryAverage(product.category);

    // Calculate discount percentage
    const discount = ((categoryAvg - product.price) / categoryAvg) * 100;

    // Score based on discount
    let score = 60; // Baseline
    if (discount >= 40) score = 100;
    else if (discount >= 30) score = 95;
    else if (discount >= 20) score = 90;
    else if (discount >= 10) score = 80;
    else if (discount >= 0) score = 70;
    else score = Math.max(0, 60 - Math.abs(discount));

    // Check for suspiciously low prices (scam indicator)
    if (discount > 70) {
      score = Math.min(score, 40); // Cap at 40 for too-good-to-be-true
    }

    return {
      agentName: this.name,
      score,
      confidence: 0.85,
      reasoning: `Price is ${discount.toFixed(1)}% ${discount >= 0 ? 'below' : 'above'} category average ($${categoryAvg})`,
      factors: {
        productPrice: product.price,
        categoryAverage: categoryAvg,
        discountPercentage: discount,
        suspiciouslyLow: discount > 70
      },
      processingTime: Date.now() - startTime
    };
  }

  private async getCategoryAverage(category: string): Promise<number> {
    const result = await prisma.product.aggregate({
      where: { category, isAvailable: true },
      _avg: { price: true }
    });
    return result._avg.price || 100;
  }
}
```

### 3. Orchestrator
```typescript
// src/lib/agents/AgentOrchestrator.ts
export class AgentOrchestrator {
  private agents: BaseAgent[];

  constructor() {
    this.agents = [
      new PriceAgent(),
      new QualityAgent(),
      new SustainabilityAgent(),
      new TrustAgent(),
      new MarketDemandAgent(),
      new SpecMatcherAgent(),
      new FinancialValueAgent(),
      new ScamDetectionAgent(),
      new PersonalizationAgent(),
      new ArbitrageAgent()
    ];
  }

  async scoreProduct(product: ProductInput, userId?: string): Promise<ScoringResult> {
    // Execute all agents in parallel
    const results = await Promise.all(
      this.agents.map(agent => agent.analyze(product))
    );

    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;
    const componentScores: Record<string, number> = {};

    results.forEach(result => {
      const agent = this.agents.find(a => a.name === result.agentName)!;
      totalScore += result.score * agent.weight;
      totalWeight += agent.weight;
      componentScores[result.agentName] = result.score;
    });

    const veritasScore = Math.round(totalScore / totalWeight);

    // Calculate confidence (average of all agent confidences)
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Generate explanation
    const explanation = this.generateExplanation(results, veritasScore);

    return {
      veritasScore,
      confidence: avgConfidence,
      componentScores,
      explanation,
      agentResults: results,
      scoredAt: new Date()
    };
  }

  private generateExplanation(results: AgentResult[], finalScore: number): string {
    // Top 3 positive factors
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);

    const reasons = top3.map(r => `${r.agentName}: ${r.reasoning}`);

    return `Veritas Score: ${finalScore}/100. ${reasons.join('. ')}.`;
  }
}
```

### 4. Web Scraping (eBay Example)
```typescript
// src/lib/scrapers/EbayScraper.ts
import axios from 'axios';

export class EbayScraper {
  private apiKey: string;

  async scrapeCategory(category: string, limit: number = 100): Promise<RawProduct[]> {
    try {
      const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
        params: {
          'OPERATION-NAME': 'findItemsByCategory',
          'SERVICE-VERSION': '1.0.0',
          'SECURITY-APPNAME': this.apiKey,
          'RESPONSE-DATA-FORMAT': 'JSON',
          'REST-PAYLOAD': '',
          'categoryId': this.getCategoryId(category),
          'paginationInput.entriesPerPage': limit
        }
      });

      const items = response.data.findItemsByCategoryResponse[0].searchResult[0].item;

      return items.map((item: any) => ({
        name: item.title[0],
        price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__),
        imageUrl: item.galleryURL[0],
        description: item.title[0], // Use title as description for now
        category: category,
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Used',
        brand: this.extractBrand(item.title[0]),
        source: 'ebay',
        externalUrl: item.viewItemURL[0]
      }));
    } catch (error) {
      logger.error('eBay scraping failed', { category, error });
      return [];
    }
  }

  private getCategoryId(category: string): string {
    const mapping: Record<string, string> = {
      'Electronics': '293',
      'Clothing': '11450',
      'Toys': '220',
      // Add more mappings
    };
    return mapping[category] || '293';
  }

  private extractBrand(title: string): string {
    const brands = ['Apple', 'Samsung', 'Nike', 'Sony', 'LG', 'Dell', 'HP'];
    for (const brand of brands) {
      if (title.includes(brand)) return brand;
    }
    return 'Generic';
  }
}
```

### 5. Database Optimization
```sql
-- migrations/add-indices.sql

-- Performance indices
CREATE INDEX CONCURRENTLY idx_products_category ON products(category);
CREATE INDEX CONCURRENTLY idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY idx_products_ai_score ON products("aiScore");
CREATE INDEX CONCURRENTLY idx_products_brand ON products(brand);
CREATE INDEX CONCURRENTLY idx_products_available ON products("isAvailable") WHERE "isAvailable" = true;
CREATE INDEX CONCURRENTLY idx_products_created ON products("createdAt" DESC);

-- Full-text search
CREATE INDEX CONCURRENTLY idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Composite indices for common queries
CREATE INDEX CONCURRENTLY idx_products_category_score ON products(category, "aiScore" DESC) WHERE "isAvailable" = true;
CREATE INDEX CONCURRENTLY idx_products_price_range ON products(price, "aiScore" DESC) WHERE "isAvailable" = true;
```

### 6. Test Suite Structure
```typescript
// __tests__/agents/PriceAgent.test.ts
import { PriceAgent } from '@/lib/agents/PriceAgent';

describe('PriceAgent', () => {
  let agent: PriceAgent;

  beforeEach(() => {
    agent = new PriceAgent();
  });

  test('should score discounted product highly', async () => {
    const product = {
      id: '1',
      name: 'iPhone 14',
      price: 600,
      category: 'Electronics',
      condition: 'Like New'
    };

    const result = await agent.analyze(product);

    expect(result.score).toBeGreaterThan(70);
    expect(result.agentName).toBe('PriceAgent');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should detect suspiciously low prices', async () => {
    const product = {
      id: '2',
      name: 'MacBook Pro',
      price: 100, // Way too cheap
      category: 'Electronics',
      condition: 'New'
    };

    const result = await agent.analyze(product);

    expect(result.score).toBeLessThan(50);
    expect(result.factors.suspiciouslyLow).toBe(true);
  });
});
```

---

## Success Metrics

### Week 1 (Agents)
- ✅ All 10 agents implemented and tested
- ✅ Orchestrator working with parallel execution
- ✅ Score distribution: 60-90 range (no more 25-50)
- ✅ 90%+ test coverage for agent logic

### Week 2 (Data)
- ✅ 5,000+ real products scraped
- ✅ Database queries <100ms average
- ✅ Daily scraping pipeline operational
- ✅ <2% duplicate products

### Week 3 (UI & Tests)
- ✅ UI polish complete (designer review)
- ✅ 80%+ test coverage overall
- ✅ Lighthouse score >90
- ✅ Zero critical bugs
- ✅ Production deployment successful

---

## Future Enhancements (Post-Launch)

1. **Add AI APIs** (When budget available)
   - Swap agent heuristics with Claude API calls
   - Add computer vision for image quality
   - Implement NLP for description analysis

2. **Machine Learning**
   - Train models on user behavior
   - Personalized weight tuning per user
   - Predictive pricing models

3. **Advanced Features**
   - Price history graphs
   - Product alerts (price drops, new arrivals)
   - Social features (reviews, ratings)
   - Seller reputation system

4. **Mobile App**
   - React Native version
   - Barcode scanning
   - Push notifications

---

## Next Steps

**Immediate Actions**:
1. Review and approve this roadmap
2. Set up task tracking (GitHub Projects or Jira)
3. Start Week 1, Day 1: Agent Framework

**Questions to Address**:
- Budget for web scraping APIs?
- Priority features for MVP?
- Target launch date?

---

*This is a complete, actionable roadmap to transform ThriftAI into a production-ready product with intelligent, observable, and testable scoring agents.*
