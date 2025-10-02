# 🎯 Perplexity-Style AI Search Implementation Guide

## Current Architecture Analysis

### ✅ What We Have:
1. **Streaming AI Responses** - Already implemented with Vercel AI SDK
2. **Product Database Query** - Claude generates structured queries
3. **Intelligent Ranking** - AI ranks products by relevance
4. **Context-Aware Chat** - AI knows about current page products

### ❌ What's Missing:
1. **Product Cards in AI Response** - Products are NOT returned to frontend
2. **Citations** - AI doesn't cite specific products in response
3. **Unified Layout** - Chat and search are separate experiences
4. **Real-time Product Display** - Products don't appear alongside AI text

---

## 🏗️ Perplexity-Style Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SEARCH: "vintage handbags"                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Claude AI: Generate Structured Query                     │
│     → categories: ["ACCESSORIES", "BAGS"]                    │
│     → keywords: ["vintage", "designer", "handbag"]           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Database: Execute Smart Query                            │
│     → Returns 20 relevant products                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Claude AI: Rank & Select Top 5                           │
│     → Picks most relevant products                           │
│     → Generates citations                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────┬─────────────────────────────────┐
│  AI RESPONSE (Streaming)  │  PRODUCT CARDS (Real-time)      │
│                           │                                 │
│  "I found 20 vintage      │  ┌─────────────────────┐      │
│  handbags for you.        │  │ [1] Gucci Vintage   │      │
│                           │  │     Handbag          │      │
│  The best options are:    │  │     $250 ★★★★☆      │      │
│                           │  └─────────────────────┘      │
│  **[1] Gucci Vintage** -  │                                 │
│  Premium leather, $250    │  ┌─────────────────────┐      │
│                           │  │ [2] Chanel Classic  │      │
│  **[2] Chanel Classic** - │  │     Flap Bag         │      │
│  Icon design, $800        │  │     $800 ★★★★★      │      │
│                           │  └─────────────────────┘      │
│  ..."                     │                                 │
└───────────────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Steps

### **Step 1: Modify Chat API to Return Products** ⭐ CRITICAL

**File**: `/app/api/chat/route.ts`

**Current Issue**: API only streams text, doesn't return products

**Solution**: Use Vercel AI SDK's experimental_StreamData

```typescript
import { streamText, experimental_StreamData } from 'ai'

export async function POST(req: Request) {
  // ... existing code ...

  // Step 2: Execute query and get products
  const results = await safeQueryExecutor.executeWithMarketplace(queryFilters)
  const products = results.products.slice(0, 20) // Top 20 products

  // Step 3: Claude AI selects top 5 and generates citations
  const topProducts = await selectTopProducts(products, queryFilters, lastUserMessage)

  // Step 4: Stream response WITH product data
  const data = new experimental_StreamData()

  const result = streamText({
    model: anthropic('claude-3-haiku-20240307'),
    system: CONVERSATIONAL_SEARCH_PROMPT_WITH_CITATIONS,
    messages: [...],
    onFinish: () => {
      // Send products as metadata
      data.append({
        products: topProducts,
        totalFound: products.length,
        query: queryFilters
      })
      data.close()
    }
  })

  return result.toDataStreamResponse({ data })
}
```

---

### **Step 2: Create Product Selection Function** ⭐ CRITICAL

**File**: `/lib/services/productSelector.ts` (NEW)

**Purpose**: Use Claude AI to intelligently select top products and create citations

```typescript
import Anthropic from '@anthropic-ai/sdk'

const PRODUCT_SELECTION_PROMPT = `You are an expert product curator.
Select the TOP 5 most relevant products for the user's query.

SELECTION CRITERIA:
1. Relevance to user's search intent
2. Price-to-value ratio
3. Product condition and quality
4. Brand reputation
5. User ratings

For each selected product, provide:
- Ranking (1-5)
- 1-sentence compelling reason why it matches
- Key highlight (price, brand, or unique feature)

Return JSON: {
  "selections": [
    {
      "productId": "123",
      "rank": 1,
      "reason": "Perfect vintage condition with authentic Gucci branding",
      "highlight": "Premium leather, verified authentic"
    },
    ...
  ]
}`

export async function selectTopProducts(
  products: any[],
  query: StructuredQueryFilters,
  userMessage: string
): Promise<ProductSelection[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  // Format products for Claude analysis
  const productsContext = products.map((p, idx) => ({
    id: p.id,
    index: idx + 1,
    name: p.name,
    brand: p.brand,
    price: p.price,
    condition: p.condition,
    rating: p.rating,
    description: p.description?.substring(0, 200)
  }))

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    temperature: 0.3,
    system: PRODUCT_SELECTION_PROMPT,
    messages: [{
      role: 'user',
      content: `User query: "${userMessage}"

Products to analyze:
${JSON.stringify(productsContext, null, 2)}

Select the top 5 products and explain why.`
    }]
  })

  // Parse Claude's selections
  const selections = JSON.parse(response.content[0].text)

  // Return full product data with Claude's insights
  return selections.selections.map((s: any) => {
    const product = products.find(p => p.id === s.productId)
    return {
      ...product,
      rank: s.rank,
      aiReason: s.reason,
      aiHighlight: s.highlight
    }
  })
}
```

---

### **Step 3: Update AI Prompt to Include Citations** ⭐ CRITICAL

**File**: `/app/api/chat/route.ts`

**Modify**: `CONVERSATIONAL_SEARCH_PROMPT`

```typescript
const CONVERSATIONAL_SEARCH_PROMPT = `You are an expert shopping advisor for ThriftAI marketplace.

IMPORTANT - PRODUCT CITATIONS:
- Reference products using **[1]**, **[2]**, **[3]** format
- Always cite specific products when recommending
- Example: "The **[1] Gucci Vintage Handbag** offers premium leather..."

RESPONSE STRUCTURE:
1. Opening: Brief summary of what you found
2. Top Recommendations: Reference each product by number
3. Comparison: Highlight differences (price, quality, features)
4. Advice: Help user choose based on their needs

Example Response:
"I found 20 vintage handbags matching your criteria. Here are my top picks:

**[1] Gucci Vintage Handbag** - $250
Premium authentic leather in excellent condition. This is a steal for genuine Gucci.

**[2] Chanel Classic Flap** - $800
Iconic design, timeless investment piece. Higher price but exceptional quality.

**[3] Coach Leather Tote** - $120
Budget-friendly option, great everyday bag.

If you want luxury and can afford it, go with **[2]**. For best value, **[1]** is perfect."

YOUR TASK:
Present products conversationally with specific citations, comparisons, and personalized advice.`
```

---

### **Step 4: Create Perplexity-Style UI Component** ⭐ UI/UX

**File**: `/components/PerplexitySearch.tsx` (NEW)

**Layout**: Split-screen with AI text on left, product cards on right

```typescript
'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import ProductCard from './ProductCard'

export default function PerplexitySearch() {
  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      // Products arrive in data stream
      console.log('Received products:', data)
    }
  })

  const latestProducts = data?.[data.length - 1]?.products || []

  return (
    <div className="perplexity-container">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="search-bar">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything about products..."
        />
        <button type="submit">Search</button>
      </form>

      {/* Split Screen Layout */}
      <div className="split-layout">
        {/* LEFT: AI Response (Streaming) */}
        <div className="ai-response">
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.role}`}>
              {m.role === 'assistant' && (
                <div className="ai-text">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT: Product Cards */}
        <div className="product-cards">
          <h3>Top Products ({latestProducts.length})</h3>
          {latestProducts.map((product: any, idx: number) => (
            <ProductCard
              key={product.id}
              product={product}
              citationNumber={idx + 1}
              aiReason={product.aiReason}
              aiHighlight={product.aiHighlight}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**CSS** (Perplexity-style):
```css
.perplexity-container {
  max-width: 1400px;
  margin: 0 auto;
}

.split-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 2rem;
  padding: 2rem;
}

.ai-response {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 2rem;
}

.product-cards {
  position: sticky;
  top: 2rem;
  height: fit-content;
}
```

---

### **Step 5: Enhanced Product Card with Citations** ⭐ UI/UX

**File**: `/components/ProductCard.tsx`

```typescript
interface ProductCardProps {
  product: any
  citationNumber: number
  aiReason?: string
  aiHighlight?: string
}

export default function ProductCard({
  product,
  citationNumber,
  aiReason,
  aiHighlight
}: ProductCardProps) {
  return (
    <div className="product-card-citation">
      {/* Citation Number */}
      <div className="citation-badge">[{citationNumber}]</div>

      {/* Product Image */}
      <img src={product.imageUrl} alt={product.name} />

      {/* Product Info */}
      <h4>{product.name}</h4>
      <p className="brand">{product.brand}</p>
      <div className="price-rating">
        <span className="price">${product.price}</span>
        <span className="rating">★ {product.rating}/5</span>
      </div>

      {/* AI Insight */}
      {aiReason && (
        <div className="ai-insight">
          <span className="ai-badge">✨ AI Pick</span>
          <p>{aiReason}</p>
        </div>
      )}

      {/* Highlight */}
      {aiHighlight && (
        <div className="highlight">{aiHighlight}</div>
      )}

      <button className="view-details">View Details</button>
    </div>
  )
}
```

---

## 🚀 Optimization Strategies (Global Standard)

### 1. **Caching Strategy**
```typescript
// Cache AI selections for 5 minutes
const CACHE_KEY = `ai_search:${queryHash}`
const cached = await redis.get(CACHE_KEY)
if (cached) return cached

// Generate fresh
const result = await selectTopProducts(...)
await redis.setex(CACHE_KEY, 300, result)
```

### 2. **Parallel Processing**
```typescript
// Run AI query generation + product fetch in parallel
const [queryFilters, cachedProducts] = await Promise.all([
  structuredQueryGenerator.generateQuery(userMessage),
  checkProductCache(userMessage)
])
```

### 3. **Progressive Enhancement**
```typescript
// Show products IMMEDIATELY, AI analysis streams in
1. Return top 10 products instantly (no AI ranking yet)
2. Stream AI response with citations
3. Re-order products based on AI ranking (smooth transition)
```

### 4. **Smart Product Pre-selection**
```typescript
// Use Veritas Score + AI Score to pre-filter
const preFilteredProducts = products
  .filter(p => p.veritasScore >= 70 || p.aiScore >= 75)
  .slice(0, 50) // Only send top 50 to Claude for ranking
```

### 5. **Edge Caching with Vercel**
```typescript
export const runtime = 'edge'
export const preferredRegion = 'auto'

// Faster response times globally
```

---

## 📊 Performance Benchmarks (Target)

| Metric | Target | Perplexity Standard |
|--------|--------|---------------------|
| Time to First Product | < 200ms | ~150ms |
| AI Streaming Start | < 500ms | ~400ms |
| Total Response Time | < 2s | ~1.5s |
| Product Selection (AI) | < 800ms | ~600ms |

---

## 🔄 Implementation Priority

### Phase 1 (Week 1): CRITICAL
- [ ] Modify chat API to return products (Step 1)
- [ ] Create product selection function (Step 2)
- [ ] Update AI prompt with citations (Step 3)

### Phase 2 (Week 2): UI/UX
- [ ] Build Perplexity-style component (Step 4)
- [ ] Enhanced product cards (Step 5)
- [ ] Responsive mobile layout

### Phase 3 (Week 3): Optimization
- [ ] Implement caching strategy
- [ ] Parallel processing
- [ ] Edge deployment
- [ ] A/B testing

---

## 🎯 Key Differentiators vs Standard Search

| Feature | Standard Search | Perplexity-Style |
|---------|----------------|------------------|
| Results | Grid of products | AI text + curated cards |
| Ranking | Algorithm-based | AI-explained reasoning |
| Guidance | None | Personalized recommendations |
| Citations | No references | Numbered product citations |
| Experience | Browse & filter | Conversational discovery |

---

## 💡 Advanced Features (Future)

1. **Multi-turn Conversations**
   - "Show me more like [1]"
   - "Compare [1] and [3]"

2. **Visual Search Integration**
   - Upload image → AI finds similar products

3. **Price Tracking**
   - "Alert me when [2] drops below $600"

4. **Social Proof**
   - "People who bought [1] also liked..."

---

## 📝 Summary

**What Makes It Like Perplexity:**
1. ✅ AI-generated text response (streaming)
2. ✅ Product citations in response [1], [2], etc.
3. ✅ Side-by-side layout (text + cards)
4. ✅ Intelligent product selection (not just sorting)
5. ✅ Conversational guidance (why these products)

**Technical Stack:**
- **AI**: Claude 3 Haiku (query generation, product selection, response generation)
- **Streaming**: Vercel AI SDK with experimental_StreamData
- **Database**: PostgreSQL with Prisma
- **Caching**: Redis (optional but recommended)
- **Deployment**: Vercel Edge Functions

**Expected Outcome:**
Users search → See AI explanation + top 5 curated products → Understand WHY these products → Make informed purchase decision

This is the OpenAI/Perplexity standard for AI-powered search! 🚀
