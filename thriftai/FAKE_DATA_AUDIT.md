# Fake Data Audit - All Hardcoded/Estimated Values

## 🚨 CRITICAL ISSUES - Fake Data Found

This document lists ALL fake, hardcoded, and estimated values in the Veritas Score calculation that need to be removed.

---

## 1. VeritasScoreCalculator.ts - MAJOR ISSUES

### Seller Trust Defaults (Lines 414-448)
```typescript
// ❌ FAKE DATA - Hardcoded perfect seller
const reputation = userInput.reputation || {
  sellerRating: 5.0,              // FAKE - Perfect rating
  transactionCount: 100,          // FAKE - Arbitrary number
  positiveFeedbackPercent: 100,   // FAKE - Perfect feedback
  accountAgeYears: 5,             // FAKE - Arbitrary age
  isVerifiedSeller: true,         // FAKE - Auto-verified
  isTopRatedSeller: true,         // FAKE - Auto top-rated
  isPowerSeller: true,            // FAKE - Auto power seller
  sellerLocation: 'USA',          // FAKE - Assumed location
}

const responseService = userInput.responseService || {
  responseTimeHours: 2,           // FAKE - Fast response
  responseRatePercent: 100,       // FAKE - Perfect response
  customerServiceQuality: 100,    // FAKE - Perfect service
  communicationClarity: 100,      // FAKE - Perfect clarity
  acceptsReturns: true,           // FAKE - Assumes returns
  problemResolution: 100,         // FAKE - Perfect resolution
}

const transactionHistory = userInput.transactionHistory || {
  disputeRatePercent: 0.1,        // FAKE - Almost no disputes
  refundRatePercent: 2,           // FAKE - Low refunds
  chargebackRatePercent: 0,       // FAKE - No chargebacks
  cancellationRatePercent: 1,     // FAKE - Low cancellations
  lateShipmentRatePercent: 1,     // FAKE - Few late shipments
  itemNotAsDescribedPercent: 0.5, // FAKE - Almost perfect accuracy
}

const reliability = userInput.reliability || {
  onTimeShippingPercent: 99,      // FAKE - Almost perfect
  descriptionAccuracy: 100,       // FAKE - Perfect accuracy
  packagingQuality: 100,          // FAKE - Perfect packaging
  providesTracking: true,         // FAKE - Assumes tracking
  responsiveness: 10,             // FAKE - Perfect responsiveness
}
```

**Impact**: Creates artificially high seller trust scores (82/100) when seller data doesn't exist.

---

### Brand-Based Estimates (Lines 943-1013)

```typescript
// ❌ FAKE - Brand material quality
private getBrandMaterialQuality(brand: string): number {
  const premiumBrands = ['Apple', 'Sony', 'Samsung', 'Dell']
  return premiumBrands.includes(brand) ? 95 : 80  // Arbitrary scores
}

// ❌ FAKE - Brand tier score
private getBrandTierScore(brand: string): number {
  const tier1 = ['Apple', 'Samsung', 'Sony']
  const tier2 = ['Dell', 'HP', 'Lenovo', 'Microsoft']
  if (tier1.includes(brand)) return 95
  if (tier2.includes(brand)) return 85
  return 70  // Arbitrary fallback
}

// ❌ FAKE - Brand recognition
private getBrandRecognition(brand: string): number {
  const famous = ['Apple', 'Samsung', 'Microsoft', 'Dell']
  return famous.includes(brand) ? 99 : 85  // Arbitrary numbers
}

// ❌ FAKE - Brand CSAT
private getBrandCSAT(brand: string): number {
  const highCSAT = ['Apple']
  return highCSAT.includes(brand) ? 92 : 80  // Arbitrary numbers
}

// ❌ FAKE - Brand recyclability
private getBrandRecyclability(brand: string): number {
  const premiumBrands = ['Apple', 'Dell', 'HP']
  return premiumBrands.includes(brand) ? 95 : 85  // Arbitrary numbers
}

// ❌ FAKE - Brand software support
private getBrandSoftwareSupport(brand: string): number {
  if (brand === 'Apple') return 6
  if (brand === 'Samsung') return 4
  return 3  // Arbitrary years
}
```

**Impact**: Artificially inflates scores for "premium" brands without any real data.

---

### Market Value Defaults (Lines 477-507)

```typescript
// ❌ FAKE - All zeros or arbitrary values
const pricePositioning = userInput.pricePositioning || {
  currentPrice: 0,                 // ZERO - Meaningless
  originalMSRP: 0,                 // ZERO - Meaningless
  priceVsMarketAverage: 0,         // ZERO - Meaningless
  discountPercentage: 0,           // ZERO - Meaningless
  valueForMoneyIndex: 0,           // ZERO - Meaningless
  priceTrend30Days: 'Stable',      // FAKE - Assumed stable
  lowestHistoricalPrice: 0,        // ZERO - Meaningless
}

const competitiveAnalysis = userInput.competitiveAnalysis || {
  priceVsCompetitors: 0,           // ZERO - Meaningless
  competitorCount: 0,              // ZERO - Meaningless
  isBestPrice: false,              // FAKE - Assumes not best
  priceStabilityScore: 100,        // FAKE - Assumes stable
  marketAvailability: 0,           // ZERO - Meaningless
  demandLevel: 50,                 // FAKE - Arbitrary midpoint
}
```

**Impact**: Market value scores become meaningless when input data doesn't exist.

---

### User Experience Defaults (Lines 636-654)

```typescript
// ❌ FAKE - Perfect scores
const listingQuality = userInput.listingQuality || {
  productPageQuality: 90,          // FAKE - Almost perfect
  descriptionCompleteness: 90,     // FAKE - Almost perfect
  transparencyScore: 90,           // FAKE - Almost perfect
}

const visualPresentation = userInput.visualPresentation || {
  imageQualityScore: 90,           // FAKE - Almost perfect
  imageCount: 8,                   // FAKE - Assumes 8 images
}

const purchaseExperience = userInput.purchaseExperience || {
  checkoutEase: 95,                // FAKE - Almost perfect
  navigationQuality: 95,           // FAKE - Almost perfect
}

const customerSupport = userInput.customerSupport || {
  supportAccessibility: 95,        // FAKE - Almost perfect
}
```

**Impact**: Inflates UX scores to 91/100 even with no real data.

---

### Placeholder Scores (Lines 391, 705-706)

```typescript
// ❌ FAKE - Placeholder scores
const categoryScore =
  physicalScore * 0.45 +
  authenticityScore * 0.20 +
  functionalScore * 0.15 +
  ageScore * 0.10 +
  90 * 0.10  // ❌ FAKE - Warranty placeholder

const categoryScore =
  this.scoreTechnicalSpecs(technicalSpecs) * 0.35 +
  this.scoreCategoryFeatures(categoryFeatures) * 0.30 +
  95 * 0.20 + // ❌ FAKE - Model & Version placeholder
  95 * 0.15   // ❌ FAKE - Hardware Details placeholder
```

**Impact**: Adds artificial points to scores.

---

## 2. fetchDatabaseParameters.ts - DEFAULT VALUES

### Product Quality Defaults (Lines 247-262)

```typescript
// ❌ FAKE - Default scores when database has no data
conditionScore: quality?.conditionScore || 70,        // FAKE fallback
visualDefects: quality?.visualDefects || 70,          // FAKE fallback
functionalityScore: quality?.functionalityScore || 75,// FAKE fallback
authenticityScore: quality?.authenticityScore || 85,  // FAKE fallback
packagingScore: quality?.packagingScore || 60,        // FAKE fallback
accessoriesScore: quality?.accessoriesScore || 50,    // FAKE fallback
warrantyScore: quality?.warrantyScore || 40,          // FAKE fallback
returnPolicyScore: quality?.returnPolicyScore || 70,  // FAKE fallback
ageScore: quality?.ageScore || 65,                    // FAKE fallback
wearScore: quality?.wearScore || 70,                  // FAKE fallback
cleanlinessScore: quality?.cleanlinessScore || 75,    // FAKE fallback
```

**Impact**: Returns fake scores when product quality data doesn't exist in database.

---

### Seller Trust Estimated Values (Lines 279-283)

```typescript
// ❌ FAKE - Estimated review rates
positiveReviewRate: product.seller?.rating ? (product.seller.rating / 5) * 0.95 : 0.85,  // FAKE formula
neutralReviewRate: 0.10,                              // FAKE - Hardcoded 10%
negativeReviewRate: product.seller?.rating ? (1 - (product.seller.rating / 5)) * 0.15 : 0.05,  // FAKE formula
totalReviewCount: product.seller?.totalSales ? Math.floor(product.seller.totalSales * 0.3) : 0,  // FAKE - 30% assumption
```

**Impact**: Creates fake review distribution data.

---

### Sustainability Estimated Values (Line 330)

```typescript
// ❌ FAKE - Hardcoded assumption
packagingRecyclable: false, // Not in schema, estimated
```

**Impact**: Always shows packaging as not recyclable.

---

## 3. companyMetricsService.ts - ESTIMATED ESG DATA

```typescript
// Lines 286-301: Estimated ESG metrics
// ❌ FAKE - All estimated based on brand name

// Growth - estimated
marketCap: this.estimateMarketCap(brandName),
revenue: this.estimateRevenue(brandName),
growth: this.estimateGrowth(brandName),

// ESG - estimated
esgScore: this.estimateESG(brandName),
environmentalScore: this.estimateEnvironmental(brandName),

// Social - estimated
socialScore: this.estimateSocial(brandName),
governanceScore: this.estimateGovernance(brandName),

// Risk - estimated
riskScore: this.estimateRisk(brandName),
```

**Impact**: Creates entirely fake ESG data based on brand name assumptions.

---

## 📊 Summary of Fake Data

| Component | Fake Parameters | Real Impact |
|-----------|----------------|-------------|
| **Seller Trust** | 15+ parameters | Creates fake 82/100 score |
| **Brand Estimates** | 6 functions | Inflates scores for "premium" brands |
| **Market Value** | 13 parameters | Returns meaningless 0s or fake defaults |
| **User Experience** | 8 parameters | Inflates to 91/100 with no data |
| **Product Quality** | 11 parameters | Uses fallback scores (60-85) |
| **Placeholders** | 3 scores | Adds 9-14 points artificially |
| **ESG Metrics** | 8+ parameters | Entirely fabricated |

**Total Fake Parameters**: 60+ out of 121 parameters!

---

## ✅ What REAL Data Sources We Have

### Actually Working (From Database):
1. **Product fields**: name, price, condition, category, brand, images
2. **Seller fields**: rating, totalSales, isVerified, avgResponseTimeHours, customerSatisfactionRate, defectRate, onTimeDeliveryRate
3. **Market fields**: viewCount, wishlistCount, stockQuantity, avgCompetitorPrice
4. **Veritas tables**: ProductQuality, Sustainability, UserExperience, CompanyProfile, ProductSpec, SellerProfile, SecurityPolicy, MarketData

### Actually Working (From APIs):
1. **CPSC Recalls**: Recall status, safety violations, risk level
2. **iFixit**: Repairability score, repair guides, difficulty
3. **Apple Warranty**: Warranty status, manufacturing date
4. **Alpha Vantage**: Stock price (if API key provided)

---

## 🚨 THE FIX - What We Must Do

### Rule: Only use data that EXISTS

```typescript
// ❌ BAD - Fake fallback
const sellerRating = seller?.rating || 5.0  // Returns 5.0 even if no seller!

// ✅ GOOD - Return null if missing
const sellerRating = seller?.rating ?? null  // Returns null if no seller
```

### Principles:
1. **NO hardcoded defaults** for missing data
2. **NO brand-based estimates** without real data sources
3. **NO placeholder scores** in calculations
4. **NO estimated values** - mark as unavailable instead
5. **NO perfect scores** (90, 95, 100) without verification

### Result:
- **Scores will be LOWER** (more honest)
- **Scores will be INCOMPLETE** (some categories will show "No data")
- **Users will SEE what's missing** (transparency)
- **Trust will be HIGHER** (genuine data only)

---

## 🎯 Next Steps

1. ✅ Remove ALL fake seller trust defaults
2. ✅ Remove ALL brand-based estimate functions
3. ✅ Remove ALL placeholder scores
4. ✅ Update fetchDatabaseParameters to return null for missing data
5. ✅ Update calculation to skip categories with insufficient data
6. ✅ Add "Data Unavailable" UI for missing scores
7. ✅ Document which fields require database population

---

**Priority**: CRITICAL - This affects data integrity of ENTIRE scoring system
**Impact**: Scores will drop significantly but will be HONEST
**Timeline**: Fix immediately before users trust fake data

**Last Updated**: January 11, 2025
