# 🛍️ Swipe-to-Shop AI - Implementation Plan

## Overview

**Feature Name**: Swipe-to-Shop AI
**Entry Point**: Main page "Trending Finds" button
**Concept**: Tinder/Hinge-style product discovery with AI-powered review summaries and personalization

---

## 🎯 User Journey

```
Main Page → Click "Trending Finds"
    ↓
Filter Setup (Onboarding)
    ↓
Swipe Deck (Card Stack)
    ↓
Swipe Right ✅ → Add to Cart
Swipe Left ❌ → Skip
Scroll Down ↕️ → Product Details + AI Summary
    ↓
Cart / Favorites Tab
    ↓
Checkout
```

---

## 📋 Feature Breakdown

### 1. Filter Setup (Onboarding / Preferences)

**Purpose**: Collect user preferences to personalize the swipe deck

**UI Components**:
- Multi-step wizard (3-4 screens)
- Product categories: Checkboxes (Shoes, Jeans, Electronics, Accessories, etc.)
- Price range: Slider (min/max)
- Colors/Styles: Multi-select chips
- Optional: Brands, Size, Material, Condition

**Data Flow**:
```
User selects filters → Store in local state
    ↓
Send to backend: POST /api/swipe/initialize
    ↓
Backend uses Claude AI to generate personalized product query
    ↓
Return 50 products to frontend for swiping
```

**API Endpoint**:
```typescript
POST /api/swipe/initialize
Body: {
  categories: ["SHOES", "CLOTHING"],
  priceRange: { min: 0, max: 120 },
  colors: ["black", "blue"],
  styles: ["vintage", "modern"],
  brands?: ["Nike", "Adidas"],
  size?: "M",
  condition?: ["new", "like-new"]
}

Response: {
  sessionId: "swipe_session_abc123",
  products: [{ id, name, images, price, ... }],
  totalAvailable: 500
}
```

---

### 2. Swipe Deck (Main UI)

**Purpose**: Gamified product discovery with card-based swiping

**UI Components**:
- **Card Stack**: Tinder-style deck showing one product at a time
  - Product image (carousel if multiple images)
  - Product name + price
  - Quick stats: rating, condition, discount %

- **Swipe Actions**:
  - 👉 **Swipe Right**: Add to cart / favorites
  - 👈 **Swipe Left**: Skip (maybe train AI)
  - ⬇️ **Scroll Down**: Expand card to see details + AI summary

- **Navigation**:
  - Top: Filter icon (edit preferences)
  - Top: Cart icon with badge count
  - Bottom: "Load More" when < 10 cards remaining

**Card Component Structure**:
```jsx
<SwipeCard>
  <CardImage src={product.images[0]} />
  <CardBasicInfo>
    <h3>{product.name}</h3>
    <PriceTag>
      ${product.price.current}
      {product.price.original && (
        <Strike>${product.price.original}</Strike>
      )}
    </PriceTag>
    <QuickStats>
      ⭐ {product.rating} • 📦 {product.condition}
    </QuickStats>
  </CardBasicInfo>

  {/* Expanded Details (visible on scroll down) */}
  <CardExpandedDetails>
    <AIReviewSummary summary={product.aiSummary} />
    <ProductSpecs specs={product.specifications} />
    <SimilarProducts products={product.similar} />
  </CardExpandedDetails>
</SwipeCard>
```

**Swipe Library**:
- **Web**: `react-tinder-card` or `react-swipeable`
- **Mobile**: `react-native-deck-swiper`

**Data Flow**:
```
User swipes right on product
    ↓
POST /api/swipe/action
    {
      sessionId: "swipe_session_abc123",
      productId: "prod_123",
      action: "like", // or "skip"
      timestamp: Date.now()
    }
    ↓
Backend:
  - If "like": Add to cart/favorites
  - Store swipe data for AI personalization
    ↓
Frontend: Remove card from deck, show next product
```

---

### 3. AI Review Summarization

**Purpose**: Show AI-generated pros/cons from user reviews without hardcoding

**When to Generate**:
- **On-demand**: When user scrolls down on card (lazy load)
- **Pre-cache**: Generate for top 1000 popular products (background job)

**API Endpoint**:
```typescript
GET /api/swipe/product/:productId/summary

Response: {
  productId: "prod_123",
  aiSummary: {
    pros: [
      "Lightweight and comfortable for all-day wear",
      "High quality materials, feels premium"
    ],
    cons: [
      "Runs small - consider sizing up",
      "Color fades after multiple washes"
    ],
    sentiment: "positive", // positive | neutral | negative
    aiScore: 87, // 0-100 overall quality score
    reviewCount: 234,
    confidence: 0.92
  },
  cachedAt: "2025-09-30T18:00:00Z"
}
```

**Claude AI Prompt**:
```typescript
const REVIEW_SUMMARY_PROMPT = `You are a product review analyzer.
Given a list of customer reviews, extract:
1. Top 2-3 PROS (positive aspects)
2. Top 2-3 CONS (negative aspects)
3. Overall sentiment: positive/neutral/negative
4. AI quality score: 0-100 based on review analysis
5. Confidence: 0-1 how confident you are in this summary

Reviews:
${reviews.map(r => `- ${r.rating}/5: ${r.text}`).join('\n')}

Return ONLY valid JSON:
{
  "pros": ["...", "..."],
  "cons": ["...", "..."],
  "sentiment": "positive",
  "aiScore": 87,
  "confidence": 0.92
}
`
```

**Implementation**:
```typescript
// src/lib/services/aiReviewSummarizer.ts
export class AIReviewSummarizer {
  private anthropic: Anthropic

  async summarizeReviews(productId: string): Promise<ReviewSummary> {
    // Fetch reviews from database
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Analyze last 50 reviews
    })

    if (reviews.length === 0) {
      return this.defaultSummary()
    }

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: REVIEW_SUMMARY_PROMPT.replace('${reviews}',
          reviews.map(r => `- ${r.rating}/5: ${r.comment}`).join('\n')
        )
      }]
    })

    const summary = JSON.parse(response.content[0].text)

    // Cache in database
    await prisma.productAISummary.upsert({
      where: { productId },
      update: { summary, updatedAt: new Date() },
      create: { productId, summary }
    })

    return summary
  }
}
```

---

### 4. Cart / Favorites Tab

**Purpose**: Store liked products for checkout

**UI Components**:
- Floating cart icon with badge (number of items)
- Cart modal/page showing:
  - List of swiped-right products
  - Remove button for each item
  - Total price calculation
  - "Continue Shopping" → back to swipe deck
  - "Checkout" → payment flow

**Data Storage**:
```typescript
// Option A: Temporary session storage (not logged in)
localStorage.setItem('swipeCart', JSON.stringify(likedProducts))

// Option B: Database (logged in users)
await prisma.cart.create({
  data: {
    userId: user.id,
    productId: product.id,
    addedFrom: 'swipe_to_shop',
    sessionId: swipeSessionId
  }
})
```

---

### 5. Product Details (Expanded Card)

**When Shown**: User scrolls down on a card

**Content**:
```jsx
<ExpandedDetails>
  {/* AI-Generated Summary */}
  <AISection>
    <h4>🤖 AI Review Summary</h4>
    <ProsList>
      {summary.pros.map(pro => <li>✅ {pro}</li>)}
    </ProsList>
    <ConsList>
      {summary.cons.map(con => <li>⚠️ {con}</li>)}
    </ConsList>
    <AIScore>
      <CircularProgress value={summary.aiScore} />
      <span>Quality Score: {summary.aiScore}/100</span>
    </AIScore>
  </AISection>

  {/* Product Specifications */}
  <SpecsSection>
    <h4>📋 Product Details</h4>
    <SpecTable>
      <tr><td>Brand</td><td>{product.brand}</td></tr>
      <tr><td>Condition</td><td>{product.condition}</td></tr>
      <tr><td>Size</td><td>{product.size}</td></tr>
      <tr><td>Material</td><td>{product.material}</td></tr>
    </SpecTable>
  </SpecsSection>

  {/* Seller Info */}
  <SellerSection>
    <h4>🏪 Seller</h4>
    <SellerCard>
      <Avatar src={seller.avatar} />
      <div>
        <p>{seller.businessName}</p>
        <Rating value={seller.rating} />
        <p>{seller.totalSales} sales</p>
      </div>
    </SellerCard>
  </SellerSection>

  {/* Similar Products (AI-powered) */}
  <SimilarSection>
    <h4>🔎 More Like This</h4>
    <HorizontalScroll>
      {similarProducts.map(p => <MiniProductCard product={p} />)}
    </HorizontalScroll>
  </SimilarSection>
</ExpandedDetails>
```

---

## 🗄️ Database Schema Changes

### New Tables

```prisma
// prisma/schema.prisma

// Store AI-generated review summaries (cached)
model ProductAISummary {
  id          String   @id @default(cuid())
  productId   String   @unique
  product     Product  @relation(fields: [productId], references: [id])

  summary     Json     // { pros, cons, sentiment, aiScore, confidence }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
}

// Store swipe sessions for analytics
model SwipeSession {
  id            String   @id @default(cuid())
  userId        String?  // Optional: null if not logged in
  user          User?    @relation(fields: [userId], references: [id])

  filters       Json     // User preferences
  startedAt     DateTime @default(now())
  endedAt       DateTime?

  swipeActions  SwipeAction[]

  @@index([userId])
  @@index([startedAt])
}

// Store individual swipe actions (for ML/personalization)
model SwipeAction {
  id            String   @id @default(cuid())
  sessionId     String
  session       SwipeSession @relation(fields: [sessionId], references: [id])

  productId     String
  product       Product  @relation(fields: [productId], references: [id])

  action        SwipeActionType // LIKE, SKIP, VIEW_DETAILS
  timestamp     DateTime @default(now())

  // Additional context
  cardPosition  Int?     // Which card number (1st, 2nd, etc.)
  timeSpent     Int?     // Seconds spent viewing

  @@index([sessionId])
  @@index([productId])
  @@index([timestamp])
}

enum SwipeActionType {
  LIKE      // Swiped right
  SKIP      // Swiped left
  VIEW_DETAILS  // Scrolled down to see more
}

// Extend existing Cart model
model Cart {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  productId     String
  product       Product  @relation(fields: [productId], references: [id])

  addedFrom     String   @default("search") // "search" | "swipe_to_shop" | "recommendations"
  sessionId     String?  // Link to SwipeSession if from swipe

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([productId])
  @@index([sessionId])
}
```

---

## 🔌 API Endpoints

### 1. Initialize Swipe Session
```typescript
POST /api/swipe/initialize
Body: { categories, priceRange, colors, styles, brands, size, condition }
Response: { sessionId, products: Product[], totalAvailable: number }
```

### 2. Record Swipe Action
```typescript
POST /api/swipe/action
Body: {
  sessionId: string,
  productId: string,
  action: "like" | "skip" | "view_details",
  cardPosition: number,
  timeSpent?: number
}
Response: { success: boolean, cartItemId?: string }
```

### 3. Get More Products
```typescript
GET /api/swipe/session/:sessionId/products?offset=20&limit=20
Response: { products: Product[], hasMore: boolean }
```

### 4. Get AI Review Summary
```typescript
GET /api/swipe/product/:productId/summary
Response: {
  productId: string,
  aiSummary: { pros, cons, sentiment, aiScore, confidence },
  cachedAt: Date
}
```

### 5. Get Similar Products
```typescript
GET /api/swipe/product/:productId/similar?limit=10
Response: { products: Product[] }
```

### 6. Get Swipe Cart
```typescript
GET /api/swipe/cart/:sessionId
Response: { items: CartItem[], total: number }
```

---

## 🎨 Frontend Components Structure

```
src/app/swipe/
├── page.tsx                    # Entry point (from "Trending Finds")
├── components/
│   ├── FilterSetup.tsx         # Onboarding wizard
│   ├── SwipeDeck.tsx           # Main card stack
│   ├── SwipeCard.tsx           # Individual product card
│   ├── CardBasicView.tsx       # Collapsed card view
│   ├── CardExpandedView.tsx    # Expanded card with AI summary
│   ├── AIReviewSummary.tsx     # Pros/cons display
│   ├── SimilarProducts.tsx     # Horizontal scroll of similar items
│   ├── SwipeCart.tsx           # Cart modal/page
│   └── SwipeNavigation.tsx     # Top navigation with filters/cart
├── hooks/
│   ├── useSwipeSession.ts      # Manage swipe session state
│   ├── useSwipeActions.ts      # Handle swipe gestures
│   └── useAISummary.ts         # Fetch AI summaries
└── api/
    ├── route.ts                # Main swipe API routes
    ├── initialize/route.ts     # Session initialization
    ├── action/route.ts         # Record swipe actions
    └── summary/[id]/route.ts   # Get AI summary
```

---

## 🧠 AI Integration Points

### 1. Filter Understanding (Existing)
- Use existing `structuredQueryGenerator.ts`
- Convert user preferences to database filters
- **NO HARDCODING** - Claude understands any filter combination

### 2. Review Summarization (New)
```typescript
// src/lib/services/aiReviewSummarizer.ts
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface ReviewSummary {
  pros: string[]
  cons: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  aiScore: number  // 0-100
  confidence: number  // 0-1
}

export class AIReviewSummarizer {
  private anthropic: Anthropic
  private isAvailable: boolean

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey })
      this.isAvailable = true
    } else {
      this.isAvailable = false
    }
  }

  async summarizeReviews(productId: string): Promise<ReviewSummary> {
    // Check cache first
    const cached = await prisma.productAISummary.findUnique({
      where: { productId }
    })

    // Cache valid for 7 days
    if (cached && cached.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      logger.info('✅ Using cached AI summary', { productId })
      return cached.summary as ReviewSummary
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { rating: true, comment: true }
    })

    if (reviews.length === 0) {
      return this.defaultSummary()
    }

    if (!this.isAvailable) {
      logger.warn('⚠️ Claude API not available, using fallback summary')
      return this.fallbackSummary(reviews)
    }

    // Generate with Claude
    const summary = await this.generateWithClaude(reviews)

    // Cache result
    await prisma.productAISummary.upsert({
      where: { productId },
      update: { summary, updatedAt: new Date() },
      create: { productId, summary }
    })

    logger.info('✅ Generated AI review summary', { productId, aiScore: summary.aiScore })
    return summary
  }

  private async generateWithClaude(reviews: Array<{ rating: number, comment: string }>): Promise<ReviewSummary> {
    const reviewText = reviews.map(r => `- ${r.rating}/5: ${r.comment}`).join('\n')

    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.3,
      system: `You are a product review analyzer. Extract key insights from customer reviews.
Return ONLY valid JSON with:
- pros: array of 2-3 positive aspects
- cons: array of 2-3 negative aspects (or empty if none)
- sentiment: "positive" | "neutral" | "negative"
- aiScore: 0-100 overall quality score
- confidence: 0-1 how confident you are`,
      messages: [{
        role: 'user',
        content: `Analyze these reviews:\n\n${reviewText}\n\nReturn JSON only.`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    return JSON.parse(jsonMatch[0])
  }

  private fallbackSummary(reviews: Array<{ rating: number, comment: string }>): ReviewSummary {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return {
      pros: ["Based on customer reviews", "Generally positive feedback"],
      cons: [],
      sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
      aiScore: Math.round(avgRating * 20),
      confidence: 0.5
    }
  }

  private defaultSummary(): ReviewSummary {
    return {
      pros: ["New listing - no reviews yet"],
      cons: [],
      sentiment: 'neutral',
      aiScore: 70,
      confidence: 0.3
    }
  }
}

export const aiReviewSummarizer = new AIReviewSummarizer()
```

### 3. Personalized Ranking (Future)
- Track user swipe patterns
- Use Claude to analyze preferences
- Reorder products based on learned preferences

---

## 📊 Implementation Phases

### Phase 1: Core Swipe UI (Week 1)
**Goal**: Basic swipe functionality without AI

- [ ] Create `/swipe` route and page
- [ ] Build filter setup wizard component
- [ ] Implement card stack UI with react-tinder-card
- [ ] Add swipe left/right gesture handling
- [ ] Create cart/favorites storage (localStorage)
- [ ] Connect to existing product API

**Deliverables**:
- Users can filter products
- Users can swipe through products
- Swiped products stored in cart
- No AI features yet

---

### Phase 2: AI Review Summaries (Week 2)
**Goal**: Add AI-powered review analysis

- [ ] Create `ProductAISummary` database model
- [ ] Implement `AIReviewSummarizer` service
- [ ] Add AI summary API endpoint
- [ ] Build AI summary UI component
- [ ] Add lazy loading for summaries (on scroll down)
- [ ] Implement caching strategy

**Deliverables**:
- AI-generated pros/cons shown on card expansion
- Summaries cached in database
- Fallback for products without reviews

---

### Phase 3: Session Tracking & Analytics (Week 3)
**Goal**: Track user behavior for personalization

- [ ] Create `SwipeSession` and `SwipeAction` models
- [ ] Implement session tracking API
- [ ] Store swipe actions in database
- [ ] Build analytics dashboard (admin)
- [ ] Add A/B testing framework

**Deliverables**:
- All swipes tracked in database
- Admin can see swipe analytics
- Foundation for ML personalization

---

### Phase 4: Personalization & Similar Products (Week 4)
**Goal**: AI-powered product recommendations

- [ ] Implement "Similar Products" using embeddings
- [ ] Add personalized product ranking
- [ ] Use Claude to analyze swipe patterns
- [ ] Adjust product order based on user preferences
- [ ] Add "Because you liked..." section

**Deliverables**:
- Similar products shown on expanded card
- Products reordered based on user behavior
- Personalized swipe deck

---

### Phase 5: Polish & Optimization (Week 5)
**Goal**: Production-ready feature

- [ ] Add animations and transitions
- [ ] Optimize image loading (lazy load, WebP)
- [ ] Implement infinite scroll (load more products)
- [ ] Add keyboard shortcuts (arrow keys)
- [ ] Mobile-responsive design
- [ ] Performance testing and optimization
- [ ] Error handling and edge cases

**Deliverables**:
- Smooth 60fps animations
- Fast loading times
- Mobile-friendly
- Production-ready

---

## 🔗 Integration with Existing System

### Entry Point: Main Page "Trending Finds"
```typescript
// src/app/page.tsx or main dashboard
<TrendingSection>
  <h2>🔥 Trending Finds</h2>
  <p>Swipe through personalized product recommendations</p>
  <Button
    onClick={() => router.push('/swipe')}
    variant="primary"
  >
    Start Swiping →
  </Button>
</TrendingSection>
```

### Reuse Existing Services
- ✅ `structuredQueryGenerator.ts` - Filter understanding
- ✅ `safeQueryExecutor.ts` - Product queries
- ✅ `aiProductScorer.ts` - Product scoring
- ✅ Existing Prisma models (Product, User, Cart, Review)

### New Services to Create
- `aiReviewSummarizer.ts` - Review analysis
- `swipeSessionManager.ts` - Session tracking
- `similarProductFinder.ts` - Recommendations

---

## 🎯 Success Metrics

### User Engagement
- Average swipes per session: **target 20+**
- Swipe-to-cart conversion rate: **target 10-15%**
- Time spent in swipe mode: **target 5+ minutes**
- Return rate: **target 30% within 7 days**

### AI Performance
- AI summary accuracy: **target 85%+** (user feedback)
- Summary generation time: **target <2 seconds**
- Cache hit rate: **target 80%+**

### Business Metrics
- Conversion from swipe cart to checkout: **target 20%+**
- Average order value from swipe: **compare to search**
- User satisfaction: **target 4+/5 rating**

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All Phase 1-5 features complete
- [ ] Database migrations tested
- [ ] API performance tested (1000+ concurrent swipes)
- [ ] Mobile responsiveness verified
- [ ] AI summaries tested on 100+ products
- [ ] Error logging and monitoring setup
- [ ] A/B test framework ready

### Launch Day
- [ ] Deploy database migrations
- [ ] Deploy backend API
- [ ] Deploy frontend with feature flag
- [ ] Enable for 10% of users (gradual rollout)
- [ ] Monitor error rates and performance
- [ ] Collect initial user feedback

### Post-Launch (Week 1)
- [ ] Analyze engagement metrics
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Increase rollout to 50%
- [ ] Gather qualitative feedback (surveys)

### Post-Launch (Week 2-4)
- [ ] Full rollout to 100%
- [ ] Iterate based on feedback
- [ ] Add advanced features (personalization)
- [ ] A/B test different UI variations

---

## 🛠️ Technical Considerations

### Performance
- **Image Optimization**: Use Next.js Image component with WebP
- **Lazy Loading**: Load AI summaries only when needed
- **Caching**: Cache API responses and AI summaries
- **Prefetching**: Prefetch next 5 products while swiping

### Scalability
- **Database Indexing**: Index on sessionId, productId, timestamp
- **API Rate Limiting**: Prevent abuse of swipe endpoint
- **Claude API Limits**: Monitor token usage, implement fallbacks
- **CDN**: Serve product images via CDN

### Security
- **Session Validation**: Verify sessionId ownership
- **Rate Limiting**: Max 100 swipes per minute per user
- **Input Validation**: Sanitize all user inputs
- **CSRF Protection**: Use Next.js CSRF tokens

### Accessibility
- **Keyboard Navigation**: Arrow keys for swipe
- **Screen Readers**: ARIA labels for all interactive elements
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: WCAG AA compliance

---

## 💡 Future Enhancements

### Advanced AI Features
- **Voice Search**: "Show me vintage Nike shoes"
- **Image Search**: Upload photo, find similar products
- **Chatbot**: Ask questions about products
- **Price Alerts**: Notify when liked products go on sale

### Gamification
- **Achievements**: "Swiped 100 products", "Found 10 deals"
- **Daily Streak**: Encourage daily usage
- **Leaderboard**: Top swipe users (privacy-aware)
- **Rewards**: Discount codes for active users

### Social Features
- **Share Deck**: Share your swipe deck with friends
- **Collaborative Shopping**: Swipe together in real-time
- **Product Collections**: Save products to themed collections
- **Follow Users**: See what other shoppers are liking

---

## 📝 Notes

### Why This Approach Works
✅ **Aligns with NEVER_HARDCODE principle** - Uses Claude AI for everything
✅ **Reuses existing infrastructure** - Leverages current APIs and services
✅ **Gamified engagement** - Swipe mechanic is proven to be addictive
✅ **AI-powered personalization** - Gets smarter over time
✅ **Mobile-first** - Works great on phones and tablets

### Risks & Mitigations
⚠️ **Risk**: AI summary costs too high
✅ **Mitigation**: Cache aggressively, use Haiku model, batch processing

⚠️ **Risk**: Users abandon after few swipes
✅ **Mitigation**: Show cart count badge, add "load more" prompt

⚠️ **Risk**: Not enough products in niche categories
✅ **Mitigation**: Broaden filters automatically, show "similar" products

---

## 🎬 Getting Started

### Step 1: Database Setup
```bash
# Add new models to prisma/schema.prisma
npx prisma migrate dev --name add_swipe_models
npx prisma generate
```

### Step 2: Create API Routes
```bash
mkdir -p src/app/api/swipe
touch src/app/api/swipe/{initialize,action,summary}/route.ts
```

### Step 3: Build Components
```bash
mkdir -p src/app/swipe/components
touch src/app/swipe/{page.tsx,components/SwipeDeck.tsx}
```

### Step 4: Install Dependencies
```bash
npm install react-tinder-card framer-motion
```

### Step 5: Test
```bash
npm run dev
# Navigate to http://localhost:3000/swipe
```

---

**Last Updated**: 2025-09-30
**Status**: 📋 Planning Phase
**Next Action**: Review plan with team, approve Phase 1 scope
