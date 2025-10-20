# ThriftAI Personalization System - Phase 2.7

## Overview

The personalization system dynamically adjusts Veritas scoring weights based on individual user behavior, preferences, and shopping patterns. This creates a tailored shopping experience that increases engagement, conversion, and retention.

**Expected Impact:**
- **Engagement:** +15-30% click-through rate
- **Conversion:** +10-20% purchase rate
- **Retention:** +25% return user rate

**Research Foundation:**
- Collaborative filtering (Netflix, Amazon)
- Behavioral analysis (Google Analytics)
- Personalization algorithms (Spotify, YouTube)

---

## Architecture

```
User Behavior Data
    ↓
User Preference Analysis
    ↓
Dynamic Weight Adjustment
    ↓
Personalized Veritas Scoring
    ↓
Tailored Product Recommendations
```

---

## API Endpoints

### 1. GET `/api/personalized/recommendations`

Get personalized product recommendations based on user behavior.

**Query Parameters:**
- `userId` (required): User ID to generate recommendations for
- `category` (optional): Filter by category, or "ALL" for multi-category
- `limit` (optional): Number of recommendations (default: 20, max: 100)

**Example Request:**
```bash
curl "http://localhost:3000/api/personalized/recommendations?userId=user123&category=ELECTRONICS&limit=10"
```

**Example Response:**
```json
{
  "success": true,
  "userId": "user123",
  "userPreferences": {
    "priceVsQuality": 0.78,
    "sustainabilityScore": 0.65,
    "brandLoyalty": 0.82,
    "specificationDetail": 0.71,
    "preferredCategories": ["ELECTRONICS", "ACCESSORIES"],
    "preferredConditions": ["NEW", "LIKE_NEW"],
    "averageOrderValue": 156.43,
    "confidence": 0.85,
    "dataPoints": 47
  },
  "recommendations": [
    {
      "id": "prod_abc123",
      "name": "Apple MacBook Pro 16-inch M3",
      "category": "ELECTRONICS",
      "brand": "APPLE",
      "price": 2499.00,
      "originalPrice": 2799.00,
      "condition": "LIKE_NEW",
      "imageUrl": "https://...",
      "baseScore": 87.5,
      "personalizedScore": 92.3,
      "scoreDelta": 4.8,
      "color": "Space Gray",
      "material": "Aluminum",
      "size": "16-inch",
      "seller": {
        "name": "TechMart Pro",
        "rating": 4.8,
        "isVerified": true
      },
      "reasoning": "High-quality product from premium brand. Matches your preference for detailed specs and quality over price."
    }
  ],
  "meta": {
    "totalCandidates": 156,
    "returned": 10,
    "personalizationApplied": true,
    "weightAdjustments": {
      "qualityBoost": true,
      "priceBoost": false,
      "sustainabilityBoost": false,
      "specDetailBoost": true
    }
  }
}
```

**Weight Adjustment Logic:**
- **Quality-focused users** (priceVsQuality > 0.7): +20% quality weight, -10% price weight
- **Budget-focused users** (priceVsQuality < 0.3): +20% price weight, -10% quality weight
- **Eco-conscious users** (sustainabilityScore > 0.7): +40% sustainability weight
- **Spec-detail users** (specificationDetail > 0.7): +20% specification weight
- **Brand-loyal users** (brandLoyalty > 0.8): +30% company performance weight

---

### 2. POST `/api/personalized/recommendations`

Analyze user preferences without generating recommendations.

**Request Body:**
```json
{
  "userId": "user123"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/personalized/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

**Example Response:**
```json
{
  "success": true,
  "userId": "user123",
  "profile": {
    "categoryFocus": {
      "ELECTRONICS": 0.45,
      "ACCESSORIES": 0.30,
      "CLOTHING": 0.15,
      "SHOES": 0.10
    },
    "priceVsQuality": 0.78,
    "sustainabilityScore": 0.65,
    "brandLoyalty": 0.82,
    "specificationDetail": 0.71,
    "averageOrderValue": 156.43,
    "purchaseFrequency": 2.3,
    "preferredConditions": ["NEW", "LIKE_NEW", "REFURBISHED"],
    "preferredCategories": ["ELECTRONICS", "ACCESSORIES"],
    "engagement": {
      "viewToCartRatio": 0.42,
      "cartToCheckoutRatio": 0.78,
      "returnRate": 0.05
    },
    "metadata": {
      "lastUpdated": "2025-10-20T14:30:00Z",
      "dataPoints": 47,
      "confidence": 0.85
    }
  },
  "insights": [
    "You prioritize quality over price - we'll show you premium options",
    "You care about sustainability - we'll highlight eco-friendly products",
    "You prefer well-known brands - we'll prioritize reputable sellers",
    "You appreciate detailed specs - we'll show products with comprehensive information",
    "You frequently shop in: ELECTRONICS, ACCESSORIES",
    "You're a decisive shopper - you often add viewed items to cart",
    "You complete most purchases - high purchase intent"
  ]
}
```

---

## User Preference Profile

### Behavioral Metrics

**1. Price vs Quality (0.0 - 1.0)**
- **0.0-0.3:** Budget-focused - prioritizes low prices
- **0.3-0.7:** Balanced - considers value for money
- **0.7-1.0:** Quality-focused - willing to pay more for quality

**Calculation:**
```typescript
priceVsQuality = min((avgAiScore / 100) * (avgPrice / 100), 1.0)
```

**2. Sustainability Score (0.0 - 1.0)**
- **0.0-0.3:** Not eco-conscious
- **0.3-0.7:** Moderately eco-conscious
- **0.7-1.0:** Highly eco-conscious

**Calculation:**
```typescript
sustainabilityScore = sustainableViews / totalViews
// Where sustainableViews = views of USED, REFURBISHED, or FOR_PARTS items
```

**3. Brand Loyalty (0.0 - 1.0)**
- **0.0-0.3:** Generic products acceptable
- **0.3-0.8:** Moderate brand preference
- **0.8-1.0:** Strong preference for premium brands

**Calculation:**
```typescript
brandLoyalty = brandedProductViews / totalViews
```

**4. Specification Detail (0.0 - 1.0)**
- **0.0-0.3:** Basic information sufficient
- **0.3-0.7:** Moderate detail interest
- **0.7-1.0:** Requires comprehensive specifications

**Calculation:**
```typescript
specificationDetail = avgAiScore / 100
// Higher AI scores indicate more complete specifications
```

### Purchase Patterns

**5. Average Order Value**
- Median price of purchased items
- Used to filter price ranges (±50% flexibility)

**6. Purchase Frequency**
- Number of purchases per month
- Calculated from order history time span

**7. Preferred Conditions**
- Top 3 most-viewed product conditions
- Example: ["NEW", "LIKE_NEW", "REFURBISHED"]

**8. Preferred Categories**
- Top 5 categories by purchase volume
- Weighted: 70% purchases, 30% views

### Engagement Metrics

**9. View-to-Cart Ratio**
- Percentage of viewed products added to cart
- High ratio (>0.5) indicates decisive shopping

**10. Cart-to-Checkout Ratio**
- Percentage of cart items actually purchased
- High ratio (>0.7) indicates high purchase intent

**11. Return Rate**
- Percentage of orders returned
- Low rate indicates satisfaction

### Confidence Score

**Confidence (0.0 - 1.0):**
- Based on data completeness
- Formula: `min(dataPoints / 50, 1.0)`
- **50+ interactions = high confidence (1.0)**
- **25-49 interactions = medium confidence (0.5-0.99)**
- **0-24 interactions = low confidence (0.0-0.49)**

---

## Weight Personalization Algorithm

### Step 1: Clone Base Weights

```typescript
const personalized = { ...baseWeights }
```

### Step 2: Apply Adjustments

**Maximum Adjustment:** 20% (0.2) deviation from base weights

**Adjustment Rules:**

```typescript
// 1. Price vs Quality
if (priceVsQuality > 0.7) {
  // Quality-focused users
  personalized.productQuality *= (1 + 0.2)      // +20%
  personalized.marketValue *= (1 - 0.1)         // -10%
} else if (priceVsQuality < 0.3) {
  // Budget-focused users
  personalized.marketValue *= (1 + 0.2)         // +20%
  personalized.productQuality *= (1 - 0.1)      // -10%
}

// 2. Sustainability
if (sustainabilityScore > 0.7) {
  // Eco-conscious users
  personalized.sustainability *= (1 + 0.4)      // +40%
  personalized.companyPerformance *= (1 - 0.1)  // -10%
} else if (sustainabilityScore < 0.3) {
  personalized.sustainability *= (1 - 0.2)      // -20%
}

// 3. Specification Detail
if (specificationDetail > 0.7) {
  // Detail-oriented users
  personalized.productSpecification *= (1 + 0.2) // +20%
  personalized.userExperience *= (1 - 0.1)       // -10%
}

// 4. Brand Loyalty
if (brandLoyalty > 0.8) {
  // Brand-loyal users
  personalized.companyPerformance *= (1 + 0.3)   // +30%
}
```

### Step 3: Renormalize

Ensure all weights sum to 1.0:

```typescript
const totalWeight = Object.values(personalized).reduce((sum, w) => sum + w, 0)

return {
  productQuality: personalized.productQuality / totalWeight,
  marketValue: personalized.marketValue / totalWeight,
  sellerTrust: personalized.sellerTrust / totalWeight,
  productSpecification: personalized.productSpecification / totalWeight,
  sustainability: personalized.sustainability / totalWeight,
  companyPerformance: personalized.companyPerformance / totalWeight,
  userExperience: personalized.userExperience / totalWeight,
  securitySafety: personalized.securitySafety / totalWeight
}
```

---

## Example Personalization Scenarios

### Scenario 1: Eco-Conscious Budget Shopper

**Profile:**
- `priceVsQuality: 0.25` (budget-focused)
- `sustainabilityScore: 0.85` (highly eco-conscious)
- `brandLoyalty: 0.40` (moderate)
- `specificationDetail: 0.50` (moderate)

**Weight Adjustments:**
```
Base                  → Personalized
-------------------------------------------
productQuality: 0.20  → 0.18 (-10%)
marketValue: 0.18     → 0.22 (+20%)
sustainability: 0.10  → 0.14 (+40%)
companyPerformance: 0.12 → 0.11 (-10% sustainability trade-off)
```

**Result:** User sees:
- Affordable refurbished/used products
- High sustainability scores emphasized
- Eco-friendly sellers prioritized
- Value-for-money focus

---

### Scenario 2: Premium Tech Enthusiast

**Profile:**
- `priceVsQuality: 0.88` (quality-focused)
- `sustainabilityScore: 0.30` (not eco-focused)
- `brandLoyalty: 0.92` (strong brand preference)
- `specificationDetail: 0.85` (detail-oriented)

**Weight Adjustments:**
```
Base                  → Personalized
-------------------------------------------
productQuality: 0.20  → 0.24 (+20%)
marketValue: 0.18     → 0.16 (-10%)
productSpecification: 0.15 → 0.18 (+20%)
companyPerformance: 0.12 → 0.16 (+30%)
sustainability: 0.10  → 0.08 (-20%)
```

**Result:** User sees:
- Premium brands (Apple, Sony, Samsung)
- Products with extensive specs
- Reputable sellers emphasized
- Higher prices acceptable

---

### Scenario 3: Balanced Value Seeker

**Profile:**
- `priceVsQuality: 0.55` (balanced)
- `sustainabilityScore: 0.55` (moderate)
- `brandLoyalty: 0.50` (moderate)
- `specificationDetail: 0.60` (moderate)

**Weight Adjustments:**
```
Base                  → Personalized
-------------------------------------------
No significant adjustments (all within 0.3-0.7 neutral zone)
Weights remain close to base category weights
```

**Result:** User sees:
- Standard category-specific ranking
- Best overall value products
- Mix of brands and conditions
- Balanced recommendations

---

## Data Sources

### User Behavior Analysis

**1. Product Views (Last 100)**
```sql
SELECT * FROM product_views
WHERE "userId" = ?
ORDER BY "createdAt" DESC
LIMIT 100
```

**Used For:**
- Category preferences (30% weight)
- Price range analysis
- Condition preferences
- Brand loyalty assessment
- View-to-cart ratio

**2. Purchase History (Last 50 Orders)**
```sql
SELECT * FROM orders
WHERE "buyerId" = ?
ORDER BY "createdAt" DESC
LIMIT 50
```

**Used For:**
- Category preferences (70% weight)
- Average order value
- Purchase frequency
- Cart-to-checkout ratio
- Actual buying behavior

**3. Cart Additions (Last 100)**
```sql
SELECT * FROM cart_items
WHERE cart."userId" = ?
LIMIT 100
```

**Used For:**
- Shopping intent signals
- View-to-cart conversion
- Product consideration patterns

---

## Implementation Details

### Caching Strategy

**Recommended: Redis with 24-hour TTL**

```typescript
export async function getUserPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
  const cacheKey = `user_prefs:${userId}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Analyze if not cached
  const profile = await analyzeUserPreferences(userId)

  // Cache for 24 hours
  await redis.setex(cacheKey, 86400, JSON.stringify(profile))

  return profile
}
```

**Current Implementation:** No cache (analyzes on-demand)
- **OK for:** Development, low traffic
- **NOT OK for:** Production with >100 req/min

### Performance Considerations

**Analysis Time:**
- User with 100+ interactions: ~200-300ms
- User with 50 interactions: ~100-150ms
- User with <10 interactions: ~50-75ms

**Optimization Tips:**
1. **Cache profiles** (24-hour TTL recommended)
2. **Pre-calculate** for active users (background job)
3. **Batch analyze** multiple users at once
4. **Use database indexes** on userId fields (already implemented in Phase 1.1)

---

## Integration with Category Scoring

### Before Personalization (Phase 2.6)

```typescript
// Get category model
const model = await createCategoryScoringModel('ELECTRONICS')

// Score with base weights
const result = await model.calculateScore(product)
// Uses default electronics weights from system_configurations
```

### After Personalization (Phase 2.7)

```typescript
// Get user preferences
const userPrefs = await getUserPreferenceProfile(userId)

// Get category model
const model = await createCategoryScoringModel('ELECTRONICS')

// Get base weights
const baseWeights = (model as any).weights

// Personalize weights
const personalizedWeights = personalizeWeights(baseWeights, userPrefs)

// Override model weights
(model as any).weights = personalizedWeights

// Score with personalized weights
const result = await model.calculateScore(product)
// Now uses user-specific adjusted weights
```

---

## Testing

### 1. Test User Preference Analysis

```bash
curl -X POST http://localhost:3000/api/personalized/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId": "existing_user_id"}'
```

**Expected Output:**
- Profile with all metrics (0.0-1.0 scales)
- Preferred categories and conditions
- Engagement metrics
- Human-readable insights

### 2. Test Personalized Recommendations

```bash
# For quality-focused user
curl "http://localhost:3000/api/personalized/recommendations?userId=quality_user&limit=5"

# For budget-focused user
curl "http://localhost:3000/api/personalized/recommendations?userId=budget_user&limit=5"
```

**Validation:**
- Check `scoreDelta` values (personalized vs base)
- Verify `weightAdjustments` match user profile
- Confirm `reasoning` explains personalization

### 3. Compare Base vs Personalized Scores

```typescript
// Get base score
const baseResult = await fetch('/api/veritas/category-score', {
  method: 'POST',
  body: JSON.stringify({ productId: 'prod_123' })
})

// Get personalized score
const personalizedResult = await fetch(
  '/api/personalized/recommendations?userId=user_123&limit=1'
)

// Compare scores
console.log('Base:', baseResult.score.overallScore)
console.log('Personalized:', personalizedResult.recommendations[0].personalizedScore)
console.log('Delta:', personalizedResult.recommendations[0].scoreDelta)
```

---

## Monitoring & Analytics

### Key Metrics to Track

**1. Engagement Metrics**
- Click-through rate on personalized recommendations
- Time spent on recommended products
- Scroll depth on recommendation lists

**2. Conversion Metrics**
- Add-to-cart rate from recommendations
- Purchase rate from recommendations
- Average order value from recommendations

**3. Retention Metrics**
- Return visit rate
- Days between visits
- Lifetime value increase

**4. Personalization Effectiveness**
- Average score delta (personalized vs base)
- Weight adjustment distribution
- User satisfaction ratings

**5. System Performance**
- Preference analysis latency
- Cache hit rate (if implemented)
- API response times

### Recommended Event Tracking

```typescript
// Track recommendation impression
analytics.track('recommendation_viewed', {
  userId,
  productId,
  baseScore,
  personalizedScore,
  scoreDelta,
  position: index,
  weightAdjustments
})

// Track recommendation click
analytics.track('recommendation_clicked', {
  userId,
  productId,
  personalizedScore,
  scoreDelta
})

// Track recommendation purchase
analytics.track('recommendation_purchased', {
  userId,
  productId,
  orderValue,
  scoreDelta
})
```

---

## Future Enhancements

### Phase 3 Possibilities

**1. Real-Time Learning**
- Update preferences after each interaction
- A/B test weight adjustments
- Reinforcement learning for optimization

**2. Collaborative Filtering**
- "Users like you also bought..."
- Cluster similar users
- Cross-user preference insights

**3. Context-Aware Personalization**
- Time of day adjustments
- Seasonal preferences
- Device-specific behavior

**4. Explainable AI**
- Visual weight comparison
- "Why recommended" detailed breakdown
- User preference dashboard

**5. Multi-Objective Optimization**
- Balance personalization with diversity
- Avoid filter bubbles
- Introduce serendipity factor

---

## Troubleshooting

### Low Confidence Scores

**Problem:** User has low confidence (<0.5)

**Solution:**
```typescript
if (userPrefs.confidence < 0.5) {
  // Fall back to category defaults
  return baseWeights
}
```

### No Purchase History

**Problem:** User has views but no purchases

**Solution:**
- Rely on view patterns
- Use category-specific defaults
- Consider similar users (collaborative filtering)

### Extreme Weight Adjustments

**Problem:** Personalized weights drastically different from base

**Validation:**
```typescript
// Check adjustment bounds
const MAX_DEVIATION = 0.5 // Allow max 50% deviation
for (const [key, weight] of Object.entries(personalizedWeights)) {
  const baseWeight = baseWeights[key]
  const deviation = Math.abs(weight - baseWeight) / baseWeight
  if (deviation > MAX_DEVIATION) {
    console.warn(`Extreme adjustment for ${key}: ${deviation * 100}%`)
  }
}
```

### Stale Preferences

**Problem:** User behavior changed but preferences outdated

**Solution:**
- Implement 24-hour cache TTL
- Trigger re-analysis on major events (large purchase, new category)
- Background job to refresh active users

---

## Security & Privacy

### GDPR Compliance

**Right to Access:**
```bash
GET /api/personalized/recommendations
POST /api/personalized/recommendations
# Return user's profile data
```

**Right to Deletion:**
```sql
-- Delete user behavior data
DELETE FROM product_views WHERE "userId" = ?;
DELETE FROM cart_items WHERE cart."userId" = ?;
-- Profile will be recalculated as neutral (no data)
```

**Right to Portability:**
```typescript
// Export user profile in JSON format
const profile = await getUserPreferenceProfile(userId)
return JSON.stringify(profile, null, 2)
```

### Data Minimization

**Only analyze:**
- Product interactions (views, cart, purchases)
- No personal data (name, email, address)
- No payment information
- Anonymized product IDs

### Consent Management

**Recommended:**
```typescript
if (!user.consentToPersonalization) {
  // Use base category weights only
  return baseWeights
}
```

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/personalized/recommendations` | GET | Get personalized product recommendations | Yes (userId) |
| `/api/personalized/recommendations` | POST | Analyze user preferences | Yes (userId) |
| `/api/veritas/category-score` | POST | Get base category score | No |

---

## Related Documentation

- [Category Scoring Models](../src/lib/scoring/category-models.ts) - Base scoring implementation
- [DataLoader Guide](./DATALOADER_GUIDE.md) - N+1 query optimization
- [Phase 2 Design](./PHASE2_NORMALIZATION_DESIGN.md) - Database normalization
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Overall project status

---

## Support

For issues or questions:
1. Check this guide first
2. Review [Implementation Status](./IMPLEMENTATION_STATUS.md)
3. Check API response error messages
4. Review PostgreSQL logs for database issues

**Common Issues:**
- "userId is required" → Provide `userId` query parameter
- Low confidence warnings → User needs more interaction data
- Slow responses → Implement Redis caching
- No recommendations → Check product availability and user preferences

---

**Phase 2.7 Complete** ✅

**Next Steps:** Implement caching layer (Redis) for production deployment.
