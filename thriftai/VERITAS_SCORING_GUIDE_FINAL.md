# Veritas Score™ - Final Scoring Guide
## Production-Ready Product Scoring System

**Version**: 2.0
**Last Updated**: 2025-10-12
**Status**: Production Ready
**Total Parameters**: 116

---

## Executive Summary

The Veritas Score is a **0-100 universal product scoring system** that predicts purchase likelihood and product quality by analyzing **116 enriched parameters** across **9 weighted components**. This document serves as the definitive guide for implementing product scoring across all categories.

### Quick Reference

| Component | Weight | Purpose |
|-----------|--------|---------|
| **Price Value** | 20% | Price competitiveness and ROI |
| **Trust Score** | 16% | Seller reputation and reliability |
| **Specs Quality** | **15%** | Product specification completeness |
| **Social Proof** | 13% | Reviews and validation |
| **Quality Score** | 11% | Physical product quality |
| **User Experience** | 10% | Buying experience quality |
| **Relevance** | 7% | Search match quality |
| **Urgency** | 4% | Scarcity signals |
| **Emotional Appeal** | 4% | Brand & sustainability |
| **TOTAL** | **100%** | Final Veritas Score |

### Score Interpretation

| Score Range | Badge | Recommendation | Action |
|-------------|-------|----------------|--------|
| **90-100** | 🏆 Exceptional | Strong Buy | Highest priority |
| **80-89** | ⭐ Excellent | Strong Buy | High priority |
| **70-79** | ✅ Very Good | Buy | Good choice |
| **60-69** | 👍 Good | Consider | Moderate option |
| **50-59** | 🤔 Fair | Research More | Needs review |
| **35-49** | ⏳ Below Average | Wait | Look for better |
| **0-34** | ❌ Poor | Avoid | Not recommended |

---

## Complete Scoring Formula

```javascript
VeritasScore = (
  (priceValueScore × 0.20) +
  (trustScore × 0.16) +
  (specsQualityScore × 0.15) +
  (socialProofScore × 0.13) +
  (qualityScore × 0.11) +
  (userExperienceScore × 0.10) +
  (relevanceScore × 0.07) +
  (urgencyScore × 0.04) +
  (emotionalAppealScore × 0.04)
)

// Result: 0-100 scale
// Round to nearest integer for display
```

---

## Component 1: Price Value (20%)

### Calculation Logic

```javascript
function calculatePriceValue(product) {
  let score = 0

  // 1. Discount Percentage (50 base + 30 bonus max)
  if (product.price.discountPercentage > 0) {
    score += 50 // Base for any discount
    if (product.price.discountPercentage >= 50) score += 30
    else if (product.price.discountPercentage >= 30) score += 20
    else if (product.price.discountPercentage >= 20) score += 15
    else if (product.price.discountPercentage >= 10) score += 10
  }

  // 2. Market Price Comparison (±20 points)
  if (product.price.marketAverage) {
    const ratio = product.price.current / product.price.marketAverage
    if (ratio < 0.70) score += 20      // 30%+ below market
    else if (ratio < 0.90) score += 10 // 10-30% below market
    else if (ratio > 1.30) score -= 20 // 30%+ above market
    else if (ratio > 1.10) score -= 10 // 10-30% above market
  }

  // 3. Free Shipping Bonus (10 points)
  if (product.availability.freeShipping) {
    score += 10
  }

  // 4. Charm Pricing (2 points)
  const cents = (product.price.current % 1).toFixed(2)
  if (cents === '0.99' || cents === '0.95') {
    score += 2
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (6)

| # | Parameter | Weight | Impact |
|---|-----------|--------|--------|
| 6 | Current Price | Direct | High |
| 7 | Original Price | Discount Calc | High |
| 9 | Discount Percentage | 50-80 points | Very High |
| 11 | Market Average Price | ±20 points | High |
| 26 | Shipping Cost | Via Free Shipping | Medium |
| 28 | Has Free Shipping | +10 points | Medium |

### Edge Cases

- **Missing market average**: Skip comparison, use other factors
- **No discount**: Score based on market comparison and shipping
- **Negative price**: Set score to 0 (data error)

---

## Component 2: Trust Score (16%)

### Calculation Logic

```javascript
function calculateTrustScore(product) {
  let score = 0

  // 1. Seller Rating (50 points max)
  if (product.seller.rating) {
    score += (product.seller.rating / 5.0) * 50
  }

  // 2. Seller Sales History (15 points max)
  if (product.seller.totalSales >= 10000) score += 15
  else if (product.seller.totalSales >= 1000) score += 10
  else if (product.seller.totalSales >= 100) score += 5

  // 3. Response Time (10 points / -10 points)
  if (product.seller.responseTimeHours <= 1) score += 10
  else if (product.seller.responseTimeHours <= 4) score += 5
  else if (product.seller.responseTimeHours > 24) score -= 10

  // 4. Authenticity Guarantee (10 points)
  if (product.isAuthentic) score += 10

  // 5. Warranty (5 points)
  if (product.hasWarranty) score += 5

  // 6. Free Returns (10 points)
  if (product.hasFreeReturns) score += 10

  // 7. Return Period (5 points)
  if (product.returnPeriodDays >= 30) score += 5

  // 8. Image Quality (10 points)
  if (product.imageQuality) {
    score += (product.imageQuality.overall / 100) * 10
  }

  // 9. Company Metrics (Labor, Legal, Transparency)
  if (product.company) {
    if (product.company.laborPracticesScore >= 80) score += 5
    if (product.company.legalViolations === 0) score += 3
    if (product.company.recalls === 0) score += 2
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (17)

| # | Parameter | Max Points | Priority |
|---|-----------|------------|----------|
| 13 | Seller Rating | 50 | Critical |
| 15 | Seller Total Sales | 15 | High |
| 14 | Seller Response Time | 10 / -10 | High |
| 19 | Is Authentic | 10 | High |
| 32 | Has Free Returns | 10 | High |
| 18 | Has Warranty | 5 | Medium |
| 31 | Return Period Days | 5 | Medium |
| 72 | Overall Image Quality | 10 | Medium |
| 74 | Image Sharpness | Included in 72 | Low |
| 57 | Labor Practices Score | 5 | Low |
| 65 | Legal Violations Count | 3 | Low |
| 66 | Recalls Last 5 Years | 2 | Low |
| 62 | Supply Chain Transparency | Bonus | Low |
| 67 | FDA Compliance | Bonus | Low |
| 69 | Product Liability Claims | Penalty | Low |
| 70 | Consumer Protection Score | Bonus | Low |
| 91 | Warranty Claims Rate | Penalty | Low |

### Red Flags

- Trust Score < 30 triggers **recommendation downgrade**
- Seller Rating < 2.0 → Max Trust Score = 40
- Legal Violations > 5 → Max Trust Score = 50

---

## Component 3: Specs Quality (15%) ⭐ ENHANCED

### Calculation Logic

```javascript
function calculateSpecsQuality(product) {
  // Count non-null, non-empty specifications
  const specs = product.specifications || {}
  const specCount = Object.keys(specs).filter(key => {
    const value = specs[key]
    return value !== null && value !== undefined && value !== ''
  }).length

  // Scoring based on specification completeness
  let score = 0

  if (specCount >= 25) score = 100      // Exceptional detail
  else if (specCount >= 20) score = 80  // Very detailed
  else if (specCount >= 15) score = 60  // Good detail
  else if (specCount >= 10) score = 40  // Moderate detail
  else if (specCount >= 5) score = 20   // Minimal detail
  else score = 0                        // Insufficient

  return score
}
```

### 25 Category-Specific Parameters (#92-116)

#### Electronics (Phones, Laptops, Tablets)
1. Battery Life (hours)
2. Screen Size (inches)
3. Screen Resolution
4. Screen Type (OLED, LCD, AMOLED)
5. Storage Capacity (GB)
6. RAM (GB)
7. Processor Speed (GHz)
8. Processor Type
9. Camera Megapixels (rear)
10. Front Camera MP
11. Video Recording Quality (4K, 1080p)
12. Operating System
13. Wireless Connectivity (WiFi, Bluetooth, 5G)
14. Ports & Connectivity
15. Charging Type (USB-C, Lightning)
16. Fast Charging Support
17. Water Resistance Rating (IP68)
18. Dimensions (W×H×D)
19. Weight (grams)
20. Color Options
21. SIM Type (Dual, eSIM)
22. Network Bands
23. Sensors (Fingerprint, Face ID)
24. Warranty Period (months)
25. Included Accessories

#### Fashion (Clothing, Shoes, Accessories)
1. Size (S, M, L, XL)
2. Size System (US, UK, EU)
3. Size Chart Available
4. Color
5. Color Family
6. Pattern
7. Material Composition
8. Primary Material (Cotton, Polyester)
9. Material Percentage
10. Fabric Type
11. Fit Type (Slim, Regular, Relaxed)
12. Length
13. Sleeve Length
14. Neckline Type
15. Closure Type (Zipper, Button)
16. Care Instructions
17. Machine Washable
18. Occasion (Casual, Formal)
19. Season (Summer, Winter)
20. Style
21. Brand Size
22. Model Measurements
23. Country of Origin
24. Sustainable Materials
25. Special Features

#### Home & Garden (Furniture, Decor, Tools)
1. Dimensions (L×W×H)
2. Weight (kg)
3. Weight Capacity (kg)
4. Assembly Required
5. Assembly Time (minutes)
6. Assembly Instructions Included
7. Indoor/Outdoor Use
8. Weather Resistant
9. Power Source (Electric, Battery)
10. Power Consumption (watts)
11. Voltage
12. Material (Wood, Metal, Plastic)
13. Frame Material
14. Finish Type
15. Color
16. Style (Modern, Classic, Rustic)
17. Room Type
18. Capacity
19. Adjustable
20. Stackable
21. Easy to Clean
22. Safety Features
23. Safety Certifications
24. Warranty Information
25. Included Components

### Importance Hierarchy

| Spec Count | Score | Quality Level | Component Impact |
|------------|-------|---------------|------------------|
| 25+ specs | 100 | Exceptional | 15.0 points |
| 20-24 specs | 80 | Very Detailed | 12.0 points |
| 15-19 specs | 60 | Good | 9.0 points |
| 10-14 specs | 40 | Moderate | 6.0 points |
| 5-9 specs | 20 | Minimal | 3.0 points |
| <5 specs | 0 | Insufficient | 0.0 points |

---

## Component 4: Social Proof (13%)

### Calculation Logic

```javascript
function calculateSocialProof(product) {
  let score = 0

  // 1. Product Rating (40 points max)
  if (product.reviews.rating >= 4.5) score += 40
  else if (product.reviews.rating >= 4.0) score += 30
  else if (product.reviews.rating >= 3.5) score += 20
  else if (product.reviews.rating >= 3.0) score += 10

  // 2. Review Count (30 points max)
  if (product.reviews.count >= 1000) score += 30
  else if (product.reviews.count >= 100) score += 20
  else if (product.reviews.count >= 10) score += 10
  else if (product.reviews.count > 0) score += 5

  // 3. Recent Review Activity (15 points max)
  // Reviews in last 30 days indicates active interest
  if (product.reviews.recent30Days) {
    const recentRatio = product.reviews.recent30Days / product.reviews.count
    if (recentRatio >= 0.10) score += 15      // 10%+ recent
    else if (recentRatio >= 0.05) score += 10 // 5-10% recent
    else if (recentRatio >= 0.02) score += 5  // 2-5% recent
  }

  // 4. Verified Purchase Ratio (15 points max)
  if (product.reviews.verifiedRatio) {
    score += product.reviews.verifiedRatio * 15
  }

  // 5. Social Media Mentions (10 points max)
  if (product.socialMediaMentions >= 100) score += 10
  else if (product.socialMediaMentions >= 50) score += 7
  else if (product.socialMediaMentions >= 10) score += 4

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (5)

| # | Parameter | Max Points | Critical? |
|---|-----------|------------|-----------|
| 21 | Product Rating | 40 | ✅ Yes |
| 22 | Review Count | 30 | ✅ Yes |
| 23 | Recent Review Count (30d) | 15 | No |
| 24 | Verified Purchase Ratio | 15 | No |
| 25 | Social Media Mentions | 10 | No |

### Quality Thresholds

- **Minimum viable**: 10+ reviews with 3.0+ rating
- **Good social proof**: 100+ reviews with 4.0+ rating
- **Excellent social proof**: 1000+ reviews with 4.5+ rating

---

## Component 5: Quality Score (11%)

### Calculation Logic

```javascript
function calculateQualityScore(product) {
  let score = 0

  // 1. Product Condition (100 points base)
  const conditionScores = {
    'New': 100,
    'Like New': 85,
    'Excellent': 70,
    'Very Good': 60,
    'Good': 50,
    'Acceptable': 30,
    'Fair': 20
  }
  score = conditionScores[product.condition] || 0

  // 2. Certifications Bonus (5 points each, max 20)
  if (product.certifications) {
    const certBonus = Math.min(20, product.certifications.length * 5)
    score = Math.min(100, score + certBonus)
  }

  // 3. Specs Completeness Bonus (10 points)
  if (product.specifications && Object.keys(product.specifications).length >= 5) {
    score = Math.min(100, score + 10)
  }

  // 4. Advanced Quality Metrics (if available)
  if (product.advancedQuality) {
    const avgQuality = (
      (product.advancedQuality.functionality || 0) +
      (product.advancedQuality.aesthetic || 0) +
      (product.advancedQuality.buildQuality || 0) +
      (product.advancedQuality.materialQuality || 0)
    ) / 4

    // Adjust score by ±10% based on advanced metrics
    const adjustment = ((avgQuality - 50) / 50) * 10
    score = Math.min(100, Math.max(0, score + adjustment))
  }

  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (9)

| # | Parameter | Impact | Notes |
|---|-----------|--------|-------|
| 17 | Condition | Base Score | Most important |
| 20 | Certifications | +5 each (max 20) | Quality indicators |
| 46 | Dynamic Specs | +10 if ≥5 specs | Transparency bonus |
| 55 | Green Certifications | Included in #20 | Environmental |
| 68 | Safety Standards Met | Included in #20 | Safety |
| 85 | Functionality Score | ±10% adjustment | Optional |
| 86 | Aesthetic Score | ±10% adjustment | Optional |
| 88 | Build Quality | ±10% adjustment | Optional |
| 89 | Material Quality | ±10% adjustment | Optional |

### Condition Priority

1. **New** (100) - Highest quality guarantee
2. **Like New** (85) - Near-perfect condition
3. **Excellent** (70) - Minor signs of use
4. **Good** (50) - Normal wear
5. **Fair** (30) - Significant wear

---

## Component 6: User Experience (10%)

### Calculation Logic

```javascript
function calculateUserExperience(product) {
  let score = 0

  // Section 1: Listing Quality (40 points max)

  // Page quality (10 points)
  if (product.pageQuality) {
    score += (product.pageQuality / 100) * 10
  }

  // Image count (8 points)
  const imgCount = product.images?.length || 0
  if (imgCount >= 8) score += 8
  else if (imgCount >= 5) score += 6
  else if (imgCount >= 3) score += 4
  else if (imgCount >= 1) score += 2

  // Description length (7 points)
  const descLength = product.description?.length || 0
  if (descLength >= 500) score += 7
  else if (descLength >= 300) score += 5
  else if (descLength >= 150) score += 3
  else if (descLength >= 50) score += 1

  // Has video (10 points)
  if (product.hasVideo) score += 10

  // Page load speed (5 points)
  if (product.pageLoadSpeed <= 1.0) score += 5
  else if (product.pageLoadSpeed <= 2.0) score += 3
  else if (product.pageLoadSpeed <= 3.0) score += 1

  // Section 2: Shipping & Delivery (30 points max)

  // Shipping speed (15 points)
  if (product.availability.estimatedDays <= 2) score += 15
  else if (product.availability.estimatedDays <= 5) score += 12
  else if (product.availability.estimatedDays <= 7) score += 8
  else if (product.availability.estimatedDays <= 14) score += 4

  // Free shipping (8 points)
  if (product.availability.freeShipping) score += 8

  // Fast shipping option (4 points)
  if (product.availability.fastShipping) score += 4

  // Tracking available (3 points)
  if (product.availability.tracking) score += 3

  // Section 3: Checkout Experience (30 points max)

  // Checkout ease (14 points)
  if (product.checkoutEase) {
    score += (product.checkoutEase / 100) * 14
  }

  // Mobile optimized (8 points)
  if (product.mobileOptimized) score += 8

  // Navigation quality (8 points)
  if (product.navigationQuality) {
    score += (product.navigationQuality / 100) * 8
  }

  // Stock penalty (-10 points)
  if (!product.availability.inStock) score -= 10

  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (13)

| # | Parameter | Max Points | Section |
|---|-----------|------------|---------|
| 77 | Page Quality Score | 10 | Listing |
| 78 | Image Count | 8 | Listing |
| 79 | Description Word Count | 7 | Listing |
| 80 | Has Video | 10 | Listing |
| 82 | Page Load Speed | 5 | Listing |
| 27 | Estimated Delivery Days | 15 | Shipping |
| 28 | Has Free Shipping | 8 | Shipping |
| 29 | Has Fast Shipping | 4 | Shipping |
| 30 | Has Tracking | 3 | Shipping |
| 83 | Checkout Ease | 14 | Checkout |
| 81 | Mobile Optimized | 8 | Checkout |
| 84 | Navigation Quality | 8 | Checkout |
| 33 | In Stock | -10 if false | Penalty |

---

## Component 7: Relevance (7%)

### Calculation Logic

```javascript
function calculateRelevance(product, searchContext) {
  let score = 30 // Base score if any search data exists

  if (!searchContext) return 0

  // 1. Click-Through Rate (30 points max)
  if (searchContext.ctr > 0.10) score += 30      // >10% CTR
  else if (searchContext.ctr > 0.05) score += 20 // 5-10% CTR
  else if (searchContext.ctr > 0.02) score += 10 // 2-5% CTR

  // 2. Conversion Rate (30 points max)
  if (searchContext.conversionRate > 0.05) score += 30      // >5% conversion
  else if (searchContext.conversionRate > 0.02) score += 20 // 2-5% conversion
  else if (searchContext.conversionRate > 0.01) score += 10 // 1-2% conversion

  // 3. Bounce Rate (10 / -20 points)
  if (searchContext.bounceRate < 0.30) score += 10      // <30% bounce
  else if (searchContext.bounceRate > 0.70) score -= 20 // >70% bounce

  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (4)

| # | Parameter | Impact | Notes |
|---|-----------|--------|-------|
| 39 | Search Query | Context | Required for component |
| 40 | Click-Through Rate | 30 points | User interest |
| 41 | Conversion Rate | 30 points | Purchase intent |
| 42 | Bounce Rate | ±20 points | Engagement quality |

### Default Behavior

- **No search context**: Return 50 (neutral score)
- **Organic traffic**: Use average relevance metrics
- **Direct traffic**: Full 100 score

---

## Component 8: Urgency (4%)

### Calculation Logic

```javascript
function calculateUrgency(product) {
  let score = 5 // Base score if in stock

  // 1. Low Stock Level (50 points max)
  if (product.availability.quantity <= 5) score += 50
  else if (product.availability.quantity <= 10) score += 35
  else if (product.availability.quantity <= 20) score += 20
  else if (product.availability.inStock) score += 5

  // 2. High View Count (20 points)
  if (product.views24h > 100) score += 20
  else if (product.views24h > 50) score += 12
  else if (product.views24h > 20) score += 6

  // 3. Sales Velocity (20 points)
  if (product.sales7days > 50) score += 20
  else if (product.sales7days > 20) score += 10
  else if (product.sales7days > 5) score += 5

  // 4. Cart Additions (15 points)
  if (product.cartAdds24h > 10) score += 15
  else if (product.cartAdds24h > 5) score += 8
  else if (product.cartAdds24h > 2) score += 4

  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (6)

| # | Parameter | Max Points | Urgency Type |
|---|-----------|------------|--------------|
| 34 | Stock Level | 50 | Scarcity |
| 35 | Views Last 24h | 20 | Popularity |
| 36 | Sales Last 7 Days | 20 | Demand |
| 37 | Cart Additions Last 24h | 15 | Intent |
| 38 | Inventory Velocity | Bonus | Trend |
| 33 | In Stock | 5 base | Availability |

---

## Component 9: Emotional Appeal (4%)

### Calculation Logic

```javascript
function calculateEmotionalAppeal(product) {
  let score = 0

  // 1. Sustainability (50 points max)
  if (product.sustainabilityFlag) score += 50

  // 2. Country of Origin (20 points)
  const preferredCountries = ['USA', 'Germany', 'Japan', 'Italy', 'France', 'UK', 'Canada']
  if (preferredCountries.includes(product.madeIn)) score += 20

  // 3. External Validation (10 points)
  if (product.hasExternalTraffic) score += 10

  // 4. Brand Reputation (20 points)
  if (product.company) {
    if (product.company.esgScore >= 80) score += 20
    else if (product.company.esgScore >= 60) score += 10
  }

  return Math.min(100, Math.max(0, score))
}
```

### Parameters Used (11)

| # | Parameter | Max Points | Type |
|---|-----------|------------|------|
| 44 | Sustainability Flag | 50 | Environmental |
| 45 | Made In Country | 20 | Origin |
| 43 | Has External Traffic | 10 | Validation |
| 47 | ESG Score | 20 | Corporate |
| 48 | Carbon Footprint | Bonus | Environmental |
| 49 | Sustainability Rating | Bonus | Environmental |
| 56 | Environmental Impact Score | Bonus | Environmental |
| 61 | Diversity & Inclusion Score | Bonus | Social |
| 64 | Community Investment | Bonus | Social |
| 25 | Social Media Mentions | Bonus | Social |

---

## Red Flag System

### Automatic Downgrades

Even with high total scores, recommendations are downgraded if:

| Red Flag | Threshold | Action |
|----------|-----------|--------|
| **Trust Score** | < 30 | Downgrade by 1 tier |
| **Quality Score** | < 30 | Downgrade by 1 tier |
| **Specs Quality** | < 20 | Downgrade by 1 tier |
| **Data Confidence** | < 50% | Downgrade by 1 tier |
| **Seller Rating** | < 2.0 | Max final score = 65 |
| **Legal Violations** | > 5 | Max final score = 70 |
| **Product Rating** | < 2.5 | Max final score = 60 |

### Data Confidence

```javascript
function calculateDataConfidence(product) {
  const requiredFields = [
    'price.current',
    'brand',
    'category',
    'condition',
    'images',
    'seller.rating',
    'reviews.rating',
    'reviews.count',
    'availability.inStock'
  ]

  let available = 0
  requiredFields.forEach(field => {
    if (getNestedValue(product, field) !== null) available++
  })

  return (available / requiredFields.length) * 100
}
```

---

## Implementation Guidelines

### Step 1: Data Collection

```javascript
const requiredProductData = {
  // Core (Required)
  id: string,
  title: string,
  brand: string,
  category: string,
  condition: string,

  // Pricing (Required)
  price: {
    current: number,
    original: number,
    currency: string,
    discountPercentage: number
  },

  // Availability (Required)
  availability: {
    inStock: boolean,
    quantity: number,
    shippingDays: number,
    shippingCost: number,
    freeShipping: boolean
  },

  // Reviews (Required)
  reviews: {
    rating: number,
    count: number,
    verified: boolean
  },

  // Seller (Required)
  seller: {
    name: string,
    rating: number,
    verified: boolean,
    totalSales: number,
    responseTimeHours: number
  },

  // Media (Required)
  images: string[],
  description: string,

  // Specifications (Highly Recommended - 25 specs target)
  specifications: {
    // Dynamic based on category
    // Electronics: battery, screen, storage, etc.
    // Fashion: size, material, fit, etc.
    // Home: dimensions, material, assembly, etc.
  },

  // Optional Enrichments
  veritasScore: number, // Calculated
  isHighQuality: boolean,
  leaderboardRank: number,
  sustainabilityFlag: boolean,
  hasWarranty: boolean,
  madeIn: string
}
```

### Step 2: Score Calculation

```javascript
async function calculateVeritasScore(product) {
  // 1. Calculate each component
  const components = {
    priceValue: calculatePriceValue(product),
    trust: calculateTrustScore(product),
    specsQuality: calculateSpecsQuality(product),
    socialProof: calculateSocialProof(product),
    quality: calculateQualityScore(product),
    userExperience: calculateUserExperience(product),
    relevance: calculateRelevance(product, searchContext),
    urgency: calculateUrgency(product),
    emotional: calculateEmotionalAppeal(product)
  }

  // 2. Apply weights
  const weightedScore = (
    (components.priceValue * 0.20) +
    (components.trust * 0.16) +
    (components.specsQuality * 0.15) +
    (components.socialProof * 0.13) +
    (components.quality * 0.11) +
    (components.userExperience * 0.10) +
    (components.relevance * 0.07) +
    (components.urgency * 0.04) +
    (components.emotional * 0.04)
  )

  // 3. Check red flags
  const dataConfidence = calculateDataConfidence(product)
  const hasRedFlags = (
    components.trust < 30 ||
    components.quality < 30 ||
    components.specsQuality < 20 ||
    dataConfidence < 50
  )

  // 4. Apply red flag penalties
  let finalScore = Math.round(weightedScore)

  if (hasRedFlags) {
    finalScore = Math.min(finalScore, 65) // Cap at "Consider" tier
  }

  if (product.seller?.rating < 2.0) {
    finalScore = Math.min(finalScore, 65)
  }

  if (product.reviews?.rating < 2.5) {
    finalScore = Math.min(finalScore, 60)
  }

  // 5. Return comprehensive result
  return {
    score: finalScore,
    components,
    dataConfidence,
    redFlags: hasRedFlags,
    recommendation: getRecommendation(finalScore, hasRedFlags),
    breakdown: components
  }
}
```

### Step 3: Recommendation Logic

```javascript
function getRecommendation(score, hasRedFlags) {
  if (hasRedFlags && score >= 70) {
    score = 65 // Downgrade by 1 tier
  }

  if (score >= 90) return {
    tier: 'Exceptional',
    badge: '🏆',
    action: 'Strong Buy',
    description: 'Exceptional product with outstanding quality, value, and trust metrics.'
  }

  if (score >= 80) return {
    tier: 'Excellent',
    badge: '⭐',
    action: 'Strong Buy',
    description: 'Excellent product with high quality and great value.'
  }

  if (score >= 70) return {
    tier: 'Very Good',
    badge: '✅',
    action: 'Buy',
    description: 'Very good product that meets quality standards.'
  }

  if (score >= 60) return {
    tier: 'Good',
    badge: '👍',
    action: 'Consider',
    description: 'Good product with acceptable quality.'
  }

  if (score >= 50) return {
    tier: 'Fair',
    badge: '🤔',
    action: 'Research More',
    description: 'Fair product, consider alternatives.'
  }

  if (score >= 35) return {
    tier: 'Below Average',
    badge: '⏳',
    action: 'Wait',
    description: 'Below average, better options likely available.'
  }

  return {
    tier: 'Poor',
    badge: '❌',
    action: 'Avoid',
    description: 'Not recommended due to quality or trust concerns.'
  }
}
```

---

## Example Calculation

### Product: Samsung Galaxy S24 Ultra

```javascript
const product = {
  title: "Samsung Galaxy S24 Ultra 256GB",
  brand: "Samsung",
  category: "Electronics > Phones",
  condition: "New",

  price: {
    current: 999.99,
    original: 1299.99,
    discountPercentage: 23,
    marketAverage: 1199.99
  },

  seller: {
    rating: 4.8,
    totalSales: 25000,
    responseTimeHours: 2
  },

  reviews: {
    rating: 4.6,
    count: 3542,
    recent30Days: 287,
    verifiedRatio: 0.89
  },

  availability: {
    inStock: true,
    quantity: 8,
    shippingDays: 2,
    freeShipping: true
  },

  specifications: {
    // 25+ specifications
    batteryLife: "5000mAh",
    screenSize: 6.8,
    screenResolution: "3088x1440",
    screenType: "Dynamic AMOLED 2X",
    storage: 256,
    ram: 12,
    processorSpeed: 3.2,
    processor: "Snapdragon 8 Gen 3",
    cameraMP: 200,
    frontCameraMP: 12,
    videoQuality: "8K",
    os: "Android 14",
    wireless: ["5G", "WiFi 7", "Bluetooth 5.3"],
    ports: ["USB-C"],
    charging: "USB-C",
    fastCharging: true,
    waterResistance: "IP68",
    dimensions: "162.3 x 79.0 x 8.6 mm",
    weight: 232,
    colors: ["Titanium Black", "Titanium Gray"],
    simType: "Dual SIM + eSIM",
    networkBands: ["5G", "LTE", "GSM"],
    sensors: ["Fingerprint", "Face Recognition"],
    warranty: 12,
    accessories: ["USB-C Cable", "SIM Tool"]
  },

  images: 12,
  hasVideo: true,
  sustainabilityFlag: true,
  madeIn: "South Korea"
}

// Component Scores:
// Price Value: 72 (23% discount + below market + free shipping)
// Trust: 88 (4.8 seller + 25K sales + fast response)
// Specs Quality: 100 (25+ specifications)
// Social Proof: 90 (4.6 rating + 3542 reviews + 89% verified)
// Quality: 100 (New condition + certifications)
// User Experience: 85 (12 images + video + 2-day shipping)
// Relevance: 70 (good CTR and conversion)
// Urgency: 65 (8 units left + high views)
// Emotional Appeal: 70 (sustainable + good origin)

// Weighted Calculation:
// (72×0.20) + (88×0.16) + (100×0.15) + (90×0.13) + (100×0.11) +
// (85×0.10) + (70×0.07) + (65×0.04) + (70×0.04)
// = 14.4 + 14.08 + 15.0 + 11.7 + 11.0 + 8.5 + 4.9 + 2.6 + 2.8
// = 85.0

// Final Veritas Score: 85 ⭐ Excellent - Strong Buy
```

---

## Testing & Validation

### Test Cases

#### Test Case 1: Perfect Product
- **Expected Score**: 95-100
- **Characteristics**: New, 30%+ discount, 5.0 seller rating, 4.8+ product rating, 25+ specs, 1000+ reviews

#### Test Case 2: Good Budget Option
- **Expected Score**: 70-79
- **Characteristics**: Good condition, moderate price, 4.0+ ratings, 15+ specs, 100+ reviews

#### Test Case 3: Red Flag Product
- **Expected Score**: <50 (with downgrade)
- **Characteristics**: Low seller rating (<3.0), poor reviews (<3.0), minimal specs (<5)

### Validation Checklist

- [ ] All 9 components calculate correctly
- [ ] Weights sum to 100%
- [ ] Red flags trigger downgrades
- [ ] Edge cases handled (null values, missing data)
- [ ] Scores always 0-100 range
- [ ] Recommendations align with scores
- [ ] Data confidence calculated
- [ ] 25+ specs improve score significantly

---

## Maintenance & Updates

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-10-12 | Enhanced Specs Quality to 15%, expanded to 25 params |
| 1.5 | 2025-10-10 | Added company metrics enrichment |
| 1.0 | 2025-10-01 | Initial production release |

### Update Process

1. **Test new weights** in staging environment
2. **Validate** against 1000+ product sample
3. **A/B test** recommendation accuracy
4. **Deploy** to production
5. **Monitor** score distribution

### KPIs to Track

- Average Veritas Score across categories
- Score vs. actual purchase conversion correlation
- Red flag accuracy
- Data confidence levels
- User satisfaction with recommendations

---

## Appendix: Quick Reference Tables

### Weight Distribution

| Component | Weight | Points (of 100) |
|-----------|--------|-----------------|
| Price Value | 20% | 20 |
| Trust Score | 16% | 16 |
| Specs Quality | 15% | 15 |
| Social Proof | 13% | 13 |
| Quality Score | 11% | 11 |
| User Experience | 10% | 10 |
| Relevance | 7% | 7 |
| Urgency | 4% | 4 |
| Emotional Appeal | 4% | 4 |

### Parameter Count by Layer

| Layer | Count | Purpose |
|-------|-------|---------|
| Base Product Data | 46 | Core information |
| Company Metrics | 25 | ESG & compliance |
| Dynamic Specs | 45 | Enrichment & specs |
| **Total** | **116** | Complete system |

### Critical Parameters (Must Have)

1. Current Price
2. Seller Rating
3. Product Rating
4. Review Count
5. Condition
6. Availability
7. Images
8. Specifications (target 25+)

---

**Document End**

For implementation support or questions, refer to:
- Technical implementation: `/src/lib/services/aiProductScorer.ts`
- Parameter details: `VERITAS_96_PARAMETERS_DISTRIBUTION.md`
- Scoring breakdown: `VERITAS_SCORE_PARAMETERS.md`
