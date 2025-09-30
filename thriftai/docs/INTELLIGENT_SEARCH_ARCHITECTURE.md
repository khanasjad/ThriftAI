# Intelligent Search Architecture

## Problem Statement

Current search system has critical issues:
- Shows products way over user's budget (e.g., $900 laptops when asking for "under $100")
- Returns too many products (900+) causing performance issues
- Multiple round trips to Claude API
- No structured query optimization
- Mock data ignores price filters

## Solution Architecture

### **5-Phase Pipeline**

```
User: "Best tech deals under $100"
    ↓
[1] Claude Intent Extraction (Structured JSON)
    ↓
[2] Query Optimization (Prisma WHERE clauses)
    ↓
[3] Hard-Filtered Multi-Source Search (20 per source, max 100 total)
    ↓
[4] Smart Scoring with Context Boosts
    ↓
[5] Claude Explanation (Top 5 only)
```

### **Phase 1: Claude Intent Extraction**

**Input**: User query + conversation history

**Output**: Structured JSON
```json
{
  "hardFilters": {
    "maxPrice": 100,
    "minPrice": null,
    "category": "ELECTRONICS",
    "availability": true
  },
  "softPreferences": {
    "brands": ["anker", "belkin"],
    "quality": "good",
    "shippingSpeed": "fast",
    "condition": ["new", "like-new"]
  },
  "keywords": ["tech", "electronics", "gadgets", "deals"],
  "useCase": "general_tech",
  "intent": "budget_tech_shopping"
}
```

**API**: Claude 3.5 Sonnet with JSON schema

### **Phase 2: Query Optimization**

**QueryOptimizer** converts structured intent to:

```typescript
{
  prismaWhere: {
    price: { lte: 100 },
    category: { in: ['ELECTRONICS'] },
    isAvailable: true,
    OR: [
      { name: { contains: 'tech', mode: 'insensitive' } },
      { description: { contains: 'electronics', mode: 'insensitive' } }
    ]
  },
  limit: 20,
  orderBy: [{ price: 'asc' }, { createdAt: 'desc' }]
}
```

### **Phase 3: Hard-Filtered Search**

**Parallel searches with filters applied at DB level:**

- **ThriftAI**: Prisma query with hard filters
- **Amazon**: MockAmazonService.searchProductsEnhanced() with priceRange filter
- **eBay**: EbayAdapter with maxPrice

**Result**: ~60 products (20 per source), **ALL under $100**

### **Phase 4: Smart Scoring**

**ProductScoringService** applies:
- Base score (0-100): price 30%, brand 25%, condition 20%, rating 15%, shipping 10%
- Context boosts: budget match +10, brand match +10, condition match +5

**Result**: Top 20 products sorted by score

### **Phase 5: Claude Explanation**

**Input to Claude**:
```typescript
{
  userQuery: "Best tech deals under $100",
  intent: { budget: 100, category: "tech" },
  products: [
    { title: "Anker USB Charger", price: 15.99, score: 88.5 },
    // ... top 5 products
  ]
}
```

**Claude responds with personalized explanation** for top 5 only.

## Tech Stack

### New Services

1. **ClaudeIntentExtractor** (`src/lib/services/claudeIntentExtractor.ts`)
   - Anthropic SDK with JSON schema
   - Structured output parsing
   - Fallback to regex-based extraction

2. **QueryOptimizer** (`src/lib/services/intelligentQueryOptimizer.ts`)
   - Converts structured intent to Prisma queries
   - Applies hard filters at DB level
   - Result limiting strategy

3. **SearchCache** (in-memory Map)
   - Cache Claude intent extraction (5 min)
   - Cache search results (2 min)
   - Reduce API calls by 80%

### Modified Services

1. **AmazonAdapter** - Use MockAmazonService.searchProductsEnhanced()
2. **ConversationalSearch** - Use new 5-phase pipeline
3. **API Route** - Integrate new services

## Performance Metrics

### Before
- Query: "Best tech deals under $100"
- Products returned: **900+ (many over budget)**
- Claude API calls: **2-3 per query**
- Response time: **3-5 seconds**
- Accuracy: **Poor** (shows $900 laptops)

### After
- Query: "Best tech deals under $100"
- Products returned: **100 (all under $100)**
- Claude API calls: **1 per unique query** (cached)
- Response time: **1-2 seconds**
- Accuracy: **Excellent** (only shows budget-appropriate items)

## Implementation Plan

### Step 1: Create ClaudeIntentExtractor
- Implement structured JSON prompts
- Add schema validation
- Fallback extraction logic

### Step 2: Create QueryOptimizer
- Convert intent to Prisma WHERE
- Add result limiting
- Optimize sort strategies

### Step 3: Fix AmazonAdapter
- Remove hardcoded mock data
- Use MockAmazonService with filters
- Apply price constraints

### Step 4: Update ConversationalSearch
- Integrate 5-phase pipeline
- Add caching layer
- Implement error handling

### Step 5: Update API Route
- Use new services
- Add request validation
- Implement response streaming

## Edge Cases Handled

1. **Twisted queries**: "Find me vintage designer bags" → extracts brand, condition, category
2. **Budget constraints**: "under $100", "between $50 and $200", "around $500"
3. **No results**: Progressively relax filters (remove brand, expand price range)
4. **Ambiguous queries**: "laptop" → Claude infers category, typical use case, budget range
5. **Multiple constraints**: "Gaming laptop under $800 with good graphics" → all extracted

## Success Criteria

✅ No products over user's stated budget
✅ Max 100 products fetched from DB
✅ Single Claude API call per unique query
✅ Response time < 2 seconds
✅ Accurate intent extraction (95%+ match rate)
✅ Relevant product recommendations
✅ Clear explanations from Claude

## Monitoring & Metrics

```typescript
{
  queryAccuracy: 0.95,  // Intent extraction accuracy
  cacheHitRate: 0.75,   // Cache effectiveness
  avgResponseTime: 1.5, // Seconds
  budgetCompliance: 1.0, // All products within budget
  userSatisfaction: 0.85 // Click-through rate
}
```