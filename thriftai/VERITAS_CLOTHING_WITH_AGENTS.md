# 🤖 Veritas AI for Clothing - Agent-Powered Architecture

**The Differentiation**: Constructor is a black box. Veritas shows you exactly how AI thinks about your products.

---

## 🎯 THE AGENT SYSTEM (5 Agents, Clear Jobs)

### Why Agents > Traditional Scoring

**Traditional (Constructor):**
```
Product → Algorithm → Score → Rank
(No one knows why)
```

**Veritas Agent System:**
```
Product → 5 Specialized Agents → Evidence → Score → Rank
(Every decision explained)
```

**The value:** Brands can see WHY a product ranks high/low and what to improve.

---

## 🤖 THE 5 VERITAS AGENTS

### Agent 1: Evidence Collector Agent 📊
**Runs:** Offline (daily batch)
**Job:** Gather quality signals from all sources

**What it does:**
```typescript
Input: Product ID
Output: Evidence Ledger

Sources:
- Customer reviews (brand site, Amazon, Reddit)
- Return data (if brand shares)
- Size charts + consistency patterns
- Material databases (fabric quality)
- Expert reviews (fashion bloggers, YouTube)
- Social mentions (Twitter, Instagram)
```

**Example Evidence Ledger:**
```json
{
  "productId": "shirt-123",
  "evidenceItems": [
    {
      "type": "fit",
      "signal": "runs_small",
      "confidence": 0.85,
      "sources": ["review-456", "review-789"],
      "quote": "Order one size up, runs very small"
    },
    {
      "type": "quality",
      "signal": "durable",
      "confidence": 0.92,
      "sources": ["review-123", "youtube-review-5"],
      "quote": "Still looks new after 20 washes"
    }
  ]
}
```

**Why this matters:** Brands can see actual evidence, not just a number.

---

### Agent 2: Quality Scoring Agent ⭐
**Runs:** Offline (after Evidence Agent)
**Job:** Calculate 15-parameter clothing score from evidence

**Input:** Evidence Ledger
**Output:** Veritas Score (0-100) with breakdown

**The 15 Parameters:**

```typescript
interface ClothingScore {
  // FIT & SIZING (35%)
  sizeConsistency: number      // True to size? (0-100)
  fitAccuracy: number          // Matches body types? (0-100)
  sizeRange: number            // Inclusive sizing? (0-100)

  // QUALITY & DURABILITY (30%)
  materialQuality: number      // Fabric grade (0-100)
  constructionQuality: number  // Stitching, seams (0-100)
  durability: number           // How long it lasts (0-100)
  wearResistance: number       // Pilling, fading (0-100)

  // COMFORT (15%)
  fabricComfort: number        // Soft, breathable (0-100)
  wearability: number          // All-day comfort (0-100)

  // STYLE & DESIGN (10%)
  styleLongevity: number       // Timeless vs trendy (0-100)
  versatility: number          // Multi-occasion (0-100)

  // VALUE (10%)
  priceQualityRatio: number    // Worth the price? (0-100)
  costPerWear: number          // Price ÷ wears (0-100)

  // SUSTAINABILITY (Optional +5)
  materialSustainability: number  // Eco-friendly (0-100)
  ethicalProduction: number       // Fair trade (0-100)

  // AGGREGATES
  totalScore: number           // Weighted sum (0-100)
  confidence: "high" | "medium" | "low"
}
```

**Why this matters:** Brands know exactly which dimensions need improvement.

---

### Agent 3: Ranking Agent 🏆
**Runs:** Online (per search query)
**Job:** Order search results by fit, quality, and context

**How it ranks:**
```typescript
finalScore = (
  fitScore × 0.40 +          // Does it fit this shopper?
  qualityScore × 0.35 +      // Is it good quality?
  contextRelevance × 0.15 +  // Matches search intent?
  valueScore × 0.10          // Fair price?
)

// Then apply diversity (don't show 10 white t-shirts)
// Then apply business rules (in-stock first, new arrivals boost)
```

**Special sauce for clothing:**
- If shopper said "size M usually" → boost size-consistent items
- If shopper said "office wear" → boost versatile, professional styles
- If shopper said "long-lasting" → boost durability scores
- If shopper said "eco-friendly" → boost sustainability

**Why this matters:** Search results match what the shopper actually needs, not just what's popular.

---

### Agent 4: Conversation Agent 💬
**Runs:** Online (per chat message)
**Job:** Help shoppers find clothing through natural conversation

**What it does:**

**Example Conversation:**
```
Shopper: "I need a blazer for interviews"

Agent: "Great! To find the perfect fit, what's your usual size?"
[Chips: XS | S | M | L | XL | Not sure]

Shopper: "Medium"

Agent: "And what's your budget?"
[Chips: Under $100 | $100-200 | $200-400 | Over $400]

Shopper: "Under $200"

Agent: *Shows 3 blazers*

1. **Navy Stretch Blazer** (Veritas Score: 88)
   ✅ Fits true to size (97% say TTS)
   ✅ Professional and versatile (96% would buy again)
   ⚠️ Dry clean only
   💰 $149 - Great value for quality

2. **Classic Black Blazer** (Veritas Score: 92)
   ✅ Premium construction (4-year avg lifespan)
   ✅ Wrinkle-resistant fabric
   ⚠️ Runs slightly large (order M or S)
   💰 $189 - Excellent long-term value

3. **Tailored Grey Blazer** (Veritas Score: 85)
   ✅ Machine washable
   ✅ Budget-friendly
   ⚠️ Less durable (2-year avg lifespan)
   💰 $99 - Best budget pick
```

**Why this matters:** Shoppers get personalized help, not generic search results.

---

### Agent 5: Merchant Intelligence Agent 📈
**Runs:** On-demand (when brand requests)
**Job:** Help brands optimize their catalog

**What it tells brands:**

**Quality Insights:**
```
"Your 'Classic Denim Jacket' has a low Veritas Score (62/100) due to:
- 45% of reviews mention 'runs small' → Update size chart
- 38% say 'color fades quickly' → Improve fabric quality
- Only 12% say 'worth the price' → Consider price reduction to $79

Recommendation: Fix sizing and improve dye quality, or discontinue."
```

**Return Prediction:**
```
"High return risk products (>30% predicted return rate):
1. Slim Fit Chinos - Size inconsistency
2. Wool Sweater - Pilling complaints
3. Summer Dress - Fit issues for tall customers

Predicted savings if you fix these: $45,000/year in return costs"
```

**Catalog Optimization:**
```
"Your top 10% quality products (Veritas Score >85) only get 12% of traffic.

Recommended actions:
- Feature 'Organic Cotton Tee' (Score: 94) in homepage
- Boost 'Performance Hoodie' (Score: 89) in search results
- Hide or discount 'Fast Fashion Jeans' (Score: 54) - high returns"
```

**Why this matters:** Brands get actionable insights, not just analytics.

---

## 🏗️ AGENT ARCHITECTURE (Technical)

### How Agents Work Together

```typescript
// OFFLINE PIPELINE (Runs daily)
1. Evidence Collector Agent
   ├─ Fetches reviews, returns, social mentions
   ├─ Extracts fit, quality, durability signals
   └─ Stores in Evidence Ledger (PostgreSQL JSON)

2. Quality Scoring Agent
   ├─ Reads Evidence Ledger
   ├─ Calculates 15 parameters
   ├─ Assigns confidence level
   └─ Stores in Product.veritasScore

// ONLINE PIPELINE (Runs per query)
3. Conversation Agent (if chat)
   ├─ Understands shopper intent
   ├─ Asks clarifying questions
   └─ Formats search query

4. Ranking Agent
   ├─ Hybrid search (vector + keyword)
   ├─ Applies quality scores
   ├─ Personalizes to shopper context
   └─ Returns ranked results

// ON-DEMAND (Brand dashboard)
5. Merchant Intelligence Agent
   ├─ Analyzes catalog quality
   ├─ Predicts return rates
   ├─ Suggests optimizations
   └─ Generates reports
```

### Tech Stack for Agents

```typescript
// Agent Framework: LangGraph (TypeScript)
// LLM Router: Claude Haiku (cheap) → Claude Opus (complex)
// Vector DB: Qdrant (existing)
// Evidence Store: PostgreSQL JSON columns
// Caching: Redis (prevent redundant LLM calls)
// Orchestration: Queue (Bull) for offline agents
```

---

## 🎯 AGENT-POWERED API ENDPOINTS

### For Clothing Brands (B2B)

**1. Search API with Agent Ranking**
```typescript
POST /api/v1/search
{
  "query": "blazer for interviews",
  "userContext": {
    "size": "M",
    "budget": [0, 200]
  }
}

Response:
{
  "results": [
    {
      "id": "blazer-123",
      "name": "Navy Stretch Blazer",
      "veritasScore": 88,
      "scoreBreakdown": {
        "fit": 92,
        "quality": 87,
        "comfort": 85,
        "value": 88
      },
      "whyRankedHere": "Excellent fit consistency + Professional style match",
      "fitWarning": null,
      "returnRisk": "low"
    }
  ],
  "agentExplanation": "Ranked by fit accuracy (40%), quality (35%), and interview appropriateness (25%)"
}
```

**2. Conversational Agent API**
```typescript
POST /api/v1/chat
{
  "message": "comfortable jeans for everyday",
  "conversationId": "conv-123"
}

Response:
{
  "message": "What's your usual size?",
  "quickReplies": ["28", "30", "32", "34", "36"],
  "provisionalResults": [...] // Show 3 best guesses while asking
}
```

**3. Merchant Intelligence API**
```typescript
POST /api/v1/intelligence/catalog-health
{
  "brandId": "brand-123"
}

Response:
{
  "overallHealth": 72, // out of 100
  "highReturnProducts": [
    {
      "id": "jeans-456",
      "predictedReturnRate": 34,
      "mainIssue": "size_inconsistency",
      "recommendation": "Update size chart, add 'runs small' warning"
    }
  ],
  "topOpportunities": [
    {
      "action": "feature_high_quality_items",
      "impact": "+$12K/month estimated revenue"
    }
  ]
}
```

---

## 🎨 AGENT UI/UX FOR BRANDS

### Brand Dashboard (What Brands See)

**Tab 1: Search Analytics**
```
Top Searches This Week:
1. "black dress for wedding" → 2,340 searches
   Agent recommended: 3 dresses (Avg score: 87)
   Conversion rate: 8.2% (industry avg: 4.1%)

2. "joggers comfortable home" → 1,890 searches
   Agent recommended: 5 joggers (Avg score: 91)
   Conversion rate: 12.4%
```

**Tab 2: Quality Insights**
```
Your Catalog Quality Distribution:
- Excellent (90-100): 12 products (8%)
- Great (75-89): 45 products (30%)
- Good (60-74): 67 products (45%)
- Needs Work (<60): 26 products (17%)

Action Items:
→ 26 products predicted high return rate
→ 15 products have size consistency issues
→ 8 products getting quality complaints
```

**Tab 3: Agent Performance**
```
Conversation Agent Stats:
- 3,456 conversations this month
- Avg conversation length: 2.3 turns
- Top question asked: "What's your usual size?" (78%)
- Conversion rate: 9.8% (vs 3.2% for regular search)

Ranking Agent Impact:
- Products ranked by quality: 15% lower return rate
- Avg Veritas Score of sold items: 82 (up from 68)
```

**Tab 4: Return Prevention**
```
Predicted Returns This Week: 47 items ($4,230 value)

High-Risk Orders:
1. Order #5678 - "Slim Fit Shirt" (Size M)
   Risk: 68% - Customer usually orders L, this runs small
   Action: Email customer suggesting exchange to L before ship

2. Order #5679 - "Wool Sweater"
   Risk: 54% - Known pilling issue
   Action: Include care instructions card
```

---

## 💡 THE PITCH TO CLOTHING BRANDS

### "Constructor shows you what sells. Veritas shows you what keeps."

**Constructor.io:**
- "This product is popular" ✅
- "People who bought X also bought Y" ✅
- "This will convert" ✅

**Veritas AI:**
- "This product fits true to size (94% confidence)" ✅
- "This will have a 35% return rate (fix sizing to reduce)" ✅
- "Shoppers who need 'office blazer' prefer this one (quality + style)" ✅

**Together:**
- High conversion (Constructor) + Low returns (Veritas) = More profit

---

## 🚀 AGENT DEVELOPMENT ROADMAP

### Phase 1: Evidence + Scoring Agents (Weeks 1-4)
**Build:**
- Evidence Collector Agent (batch process)
- Quality Scoring Agent (15 parameters)
- Evidence Ledger schema (PostgreSQL JSON)

**Test:**
- 500 clothing products scored
- Validate against expert reviews
- Prove scores predict return rates

**Deliverable:** API returns veritasScore + breakdown

---

### Phase 2: Ranking Agent (Weeks 5-6)
**Build:**
- Ranking Agent with context awareness
- Size preference matching
- Style/occasion matching
- Diversity rules

**Test:**
- 50 test queries ("blazer for interview", "jeans casual")
- Compare rankings to generic search
- User preference test with 20 shoppers

**Deliverable:** `/api/v1/search` with agent-powered ranking

---

### Phase 3: Conversation Agent (Weeks 7-10)
**Build:**
- Intent extraction ("office wear" → formal context)
- Clarifying question logic (ask size, budget, occasion)
- Result explanation ("Why these 3?")
- Session memory (remember size across searches)

**Test:**
- 100 test conversations
- Measure: turns to purchase, satisfaction

**Deliverable:** `/api/v1/chat` conversational search

---

### Phase 4: Merchant Intelligence Agent (Weeks 11-14)
**Build:**
- Catalog health analyzer
- Return rate predictor
- Optimization recommender
- Brand dashboard UI

**Test:**
- Run on pilot brand catalogs
- Validate: Do predictions match actual returns?

**Deliverable:** Merchant dashboard with actionable insights

---

### Phase 5: Agent Optimization (Weeks 15-16)
**Build:**
- LLM routing (cheap model for simple, smart for complex)
- Prompt caching (save on repetitive calls)
- Response caching (Redis)
- Cost monitoring dashboard

**Test:**
- Measure cost per query (target: <$0.02)
- Measure latency (target: p95 <800ms)

**Deliverable:** Production-optimized agent system

---

## 💰 AGENT-POWERED PRICING

### Tier 1: Search API with Agents - $299/mo
- Quality-scored search results
- Evidence-backed rankings
- Return risk flags
- Up to 1,000 SKUs, 50K searches/month

### Tier 2: + Conversation Agent - $599/mo
- Everything in Tier 1
- AI shopping assistant (embeddable chat)
- Fit recommendations
- Style guidance
- Up to 5,000 SKUs, 200K searches/month

### Tier 3: + Merchant Intelligence - $999/mo
- Everything in Tier 2
- Return prediction dashboard
- Catalog optimization insights
- Quality alerts
- Unlimited SKUs, 1M searches/month

**Add-ons:**
- White-label chat widget: +$200/mo
- Custom agent training: +$500 setup + $100/mo
- Priority support: +$150/mo

---

## 📊 AGENT VALUE METRICS

### What We Measure (and Show Brands)

**Agent Conversation Metrics:**
- Conversations started
- Avg turns to conversion
- Questions asked (what shoppers care about)
- Conversion rate: Agent chat vs. Regular search

**Ranking Agent Impact:**
- Avg Veritas Score of sold items (before/after)
- Return rate: Agent-ranked vs. Generic ranked
- Revenue from high-quality items (score >85)

**Merchant Intelligence ROI:**
- Returns prevented (predicted vs. actual)
- Revenue saved (return costs avoided)
- Catalog health improvement (avg score over time)

**Example Dashboard Card:**
```
Agent Performance This Month:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Conversations:           3,456
Conversion Rate:         9.8% ↑ (vs 3.2% regular)
Avg Quality Sold:        82/100 ↑ (vs 68)
Returns Prevented:       $12,340 ↓

ROI: $12,340 saved - $999 paid = $11,341 profit
```

---

## 🔧 AGENT TECH IMPLEMENTATION

### Agent Framework: LangGraph
```typescript
// Example: Conversation Agent Flow
import { StateGraph } from "@langchain/langgraph"

const conversationGraph = new StateGraph({
  channels: {
    messages: [],
    userContext: {},
    searchResults: []
  }
})

// Nodes
conversationGraph.addNode("extractIntent", extractIntentNode)
conversationGraph.addNode("checkIfNeedsClarification", clarificationCheckNode)
conversationGraph.addNode("askQuestion", askQuestionNode)
conversationGraph.addNode("search", searchWithRankingAgent)
conversationGraph.addNode("explain", explainResultsNode)

// Edges
conversationGraph.addEdge("extractIntent", "checkIfNeedsClarification")
conversationGraph.addConditionalEdges(
  "checkIfNeedsClarification",
  (state) => state.needsClarification ? "askQuestion" : "search"
)
conversationGraph.addEdge("search", "explain")

// Entry point
conversationGraph.setEntryPoint("extractIntent")
```

### LLM Routing Strategy
```typescript
function routeToModel(task: string, complexity: string) {
  if (complexity === "simple") {
    return "claude-haiku-4.0"  // $0.25/M tokens, fast
  } else if (complexity === "medium") {
    return "claude-sonnet-4.0" // $3/M tokens, balanced
  } else {
    return "claude-opus-4.0"   // $15/M tokens, smartest
  }
}

// Examples:
// "Extract size from 'I'm a size 32'" → Haiku ($0.0001)
// "Rank these 10 products by fit" → Sonnet ($0.003)
// "Explain why this blazer is better for interviews" → Opus ($0.015)
```

### Cost Optimization
```typescript
// Target: <$0.02 per search query
const costBreakdown = {
  vectorEmbedding: 0.0001,      // OpenAI embedding
  rankingAgent: 0.003,           // Sonnet for ranking
  conversationAgent: 0.015,      // Opus for explanation
  caching: -0.010,               // 50% cache hit rate
  total: 0.0081                  // Under target!
}
```

---

## 🎯 WHY THIS WINS

**Constructor's Weakness:** Black box AI, no explainability
**Veritas's Strength:** Every decision explained by agents

**Example:**
```
Constructor:
"Product A ranked #1 because [algorithm]"

Veritas:
"Product A ranked #1 because:
- Evidence Agent found 94% fit satisfaction
- Scoring Agent gave it 88/100 quality
- Ranking Agent matched your 'interview' context
- Return risk: Low (8% predicted)
Click to see all evidence →"
```

**Brands trust explainable AI more than black boxes.**

---

## 📝 NEXT STEPS - AGENT IMPLEMENTATION

### Week 1-2: Agent Infrastructure
- [ ] Set up LangGraph orchestration
- [ ] Build agent base classes
- [ ] Create evidence ledger schema
- [ ] Set up LLM routing (Haiku/Sonnet/Opus)

### Week 3-4: Evidence + Scoring Agents
- [ ] Build Evidence Collector (review scraping + analysis)
- [ ] Build Quality Scoring Agent (15 parameters)
- [ ] Test on 500 clothing products
- [ ] Validate scores against expert reviews

### Week 5-6: Ranking Agent
- [ ] Build context-aware ranking
- [ ] Add fit/quality/value weighting
- [ ] Test with 50 search queries
- [ ] Compare to generic search

### Week 7-10: Conversation Agent
- [ ] Build intent extraction
- [ ] Build clarification logic
- [ ] Build result explanation
- [ ] Test with 100 conversations

### Week 11-14: Merchant Intelligence Agent
- [ ] Build catalog analyzer
- [ ] Build return predictor
- [ ] Build dashboard UI
- [ ] Pilot with 1-2 brands

---

**This is it. Agents doing real work, not just buzzwords.**

**Ready to build? Say "START" and I'll begin Week 1: Agent Infrastructure.**
