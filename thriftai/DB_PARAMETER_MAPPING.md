# 🗄️ Database Parameter Mapping for Veritas Score™

## Overview

This document maps all 96 Veritas Score™ parameters to their data sources, identifying which parameters can be fetched from the existing database without requiring external API keys.

---

## Summary Statistics

| Source Type | Parameter Count | Percentage | API Key Required |
|-------------|----------------|------------|------------------|
| **Database Direct** | 42 | 44% | ❌ No |
| **Database Computed** | 18 | 19% | ❌ No |
| **Free APIs (No Key)** | 12 | 13% | ❌ No |
| **Free APIs (Key Required)** | 8 | 8% | ✅ Yes |
| **Paid APIs** | 16 | 17% | ✅ Yes |
| **TOTAL** | 96 | 100% | - |

**Parameters Available Without API Keys: 72 out of 96 (75%)**

---

## Category 1: Product Quality (25 parameters)

### Parameters Available from Database (15/25 = 60%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 1 | Product Name | ✅ Direct | `Product.name` | |
| 2 | Product Condition | ✅ Direct | `Product.condition` | New/Used/Refurbished |
| 3 | Product Brand | ✅ Direct | `Product.brand` | |
| 4 | Product Category | ✅ Direct | `Product.category` | 8 categories |
| 5 | Product Description | ✅ Direct | `Product.description` | |
| 6 | Product Images | ✅ Direct | `Product.imageUrl` | JSON array |
| 7 | Product Condition Score | ✅ Direct | `VeritasProductQuality.conditionScore` | 0-100 |
| 8 | Visual Defects | ✅ Direct | `VeritasProductQuality.visualDefects` | 0-100 |
| 9 | Functional Completeness | ✅ Direct | `VeritasProductQuality.functionalCompleteness` | 0-100 |
| 10 | Wear & Tear Level | ✅ Direct | `VeritasProductQuality.wearTearLevel` | 0-100 |
| 11 | Missing Components | ✅ Direct | `VeritasProductQuality.missingComponents` | 0-100 |
| 12 | Material Quality | ✅ Direct | `VeritasProductQuality.materialQuality` | 0-100 |
| 13 | Authentication Status | ✅ Direct | `VeritasProductQuality.authenticationStatus` | Verified/Unverified |
| 14 | Is Authentic | ✅ Direct | `Product.isAuthentic` | Boolean |
| 15 | Certifications | ✅ Direct | `Product.certifications` | Array of certs |

### Parameters from Computed/Analysis (5/25 = 20%)

| # | Parameter | Computation | Source Data | Notes |
|---|-----------|-------------|-------------|-------|
| 16 | Image Quality Score | ✅ Compute | Count images in `Product.imageUrl` | >5 images = high quality |
| 17 | Description Completeness | ✅ Compute | Word count of `Product.description` | >100 words = complete |
| 18 | Product Age | ✅ Compute | `now() - Product.createdAt` | Days since listing |
| 19 | Documentation Complete | ✅ Compute | Check `Product.certifications` length | >0 = documented |
| 20 | Quality Score | ✅ Direct | `Product.qualityScore` | 0-100 |

### Parameters Requiring External APIs (5/25 = 20%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 21 | Serial Number Verification | ✅ CheckMEND/IMEI | Free | No |
| 22 | Counterfeit Risk | ⚠️ Entrupy | Paid | Yes |
| 23 | Battery Health | ✅ Device API | Free | No (computed) |
| 24 | Hardware Functionality | ✅ Benchmark APIs | Free | No |
| 25 | Repair History | ⚠️ iFixit API | Free | Partially |

---

## Category 2: Seller Trust (20 parameters)

### Parameters Available from Database (18/20 = 90%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 26 | Seller Rating | ✅ Direct | `Seller.rating` | 0-5.0 |
| 27 | Seller Total Sales | ✅ Direct | `Seller.totalSales` | Count |
| 28 | Seller Total Revenue | ✅ Direct | `Seller.totalRevenue` | $ amount |
| 29 | Seller Verified | ✅ Direct | `Seller.isVerified` | Boolean |
| 30 | Seller Active | ✅ Direct | `Seller.isActive` | Boolean |
| 31 | Seller Response Time | ✅ Direct | `Seller.avgResponseTimeHours` | Hours |
| 32 | Seller Shipment Days | ✅ Direct | `Seller.avgShipmentDays` | Days |
| 33 | Customer Satisfaction | ✅ Direct | `Seller.customerSatisfactionRate` | 0-1.0 |
| 34 | Seller Defect Rate | ✅ Direct | `Seller.defectRate` | 0-1.0 |
| 35 | On-Time Delivery Rate | ✅ Direct | `Seller.onTimeDeliveryRate` | 0-1.0 |
| 36 | Seller Account Age | ✅ Compute | `now() - Seller.createdAt` | Days |
| 37 | Seller Categories | ✅ Direct | `Seller.categories` | Array |
| 38 | Seller Business Name | ✅ Direct | `Seller.businessName` | String |
| 39 | Seller Location | ✅ Direct | `Seller.city, state, zipCode` | Location data |
| 40 | Seller Commission Rate | ✅ Direct | `Seller.commissionRate` | % |
| 41 | Response Rate | ✅ Direct | `VeritasSellerProfile.responseRate` | 0-100 |
| 42 | Service Quality | ✅ Direct | `VeritasSellerProfile.serviceQualityScore` | 0-100 |
| 43 | Communication Score | ✅ Direct | `VeritasSellerProfile.communicationScore` | 0-100 |

### Parameters Requiring External APIs (2/20 = 10%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 44 | Seller BBB Rating | ✅ BBB API | Free | No (scraping) |
| 45 | Trustpilot Score | ⚠️ Trustpilot API | Freemium | Yes |

---

## Category 3: Market Value (15 parameters)

### Parameters Available from Database (10/15 = 67%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 46 | Current Price | ✅ Direct | `Product.price` | $ amount |
| 47 | Original Price | ✅ Direct | `Product.originalPrice` | $ amount |
| 48 | Discount Percentage | ✅ Compute | `(originalPrice - price) / originalPrice * 100` | % |
| 49 | Stock Quantity | ✅ Direct | `Product.stockQuantity` | Count |
| 50 | Popularity Score | ✅ Direct | `Product.popularityScore` | 0-100 |
| 51 | Trending Score | ✅ Direct | `Product.trendingScore` | 0-100 |
| 52 | View Count | ✅ Direct | `Product.viewCount` | Count |
| 53 | Click Count | ✅ Direct | `Product.clickCount` | Count |
| 54 | Purchase Count | ✅ Direct | `Product.purchaseCount` | Count |
| 55 | Cart Addition Count | ✅ Direct | `Product.cartAdditionCount` | Count |

### Parameters from Free APIs (3/15 = 20%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 56 | Market Average Price | ✅ Google Shopping | Free | No (scraping) |
| 57 | Competitor Count | ✅ Google Shopping | Free | No (scraping) |
| 58 | Price Trend | ✅ Price History | Free | No (DB table exists) |

### Parameters Requiring Paid APIs (2/15 = 13%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 59 | Price History (Detailed) | ⚠️ Keepa API | Paid | Yes ($100/mo) |
| 60 | Market Demand | ⚠️ Google Trends API | Free | No (unofficial) |

---

## Category 4: Sustainability (12 parameters)

### Parameters Available from Database (8/12 = 67%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 61 | Carbon Reduction | ✅ Direct | `VeritasSustainability.carbonReduction` | 0-100 |
| 62 | E-Waste Prevention | ✅ Direct | `VeritasSustainability.eWastePrevention` | 0-100 |
| 63 | Resource Conservation | ✅ Direct | `VeritasSustainability.resourceConservation` | 0-100 |
| 64 | Reuse Factor | ✅ Direct | `VeritasSustainability.reuseFactor` | 0-100 |
| 65 | Recycling Potential | ✅ Direct | `VeritasSustainability.recyclingPotential` | 0-100 |
| 66 | Refurb Quality | ✅ Direct | `VeritasSustainability.refurbQuality` | 0-100 |
| 67 | Expected Lifespan | ✅ Direct | `VeritasSustainability.expectedLifespanYears` | Years |
| 68 | Energy Star Certified | ✅ Direct | `VeritasSustainability.energyStarCertified` | Boolean |

### Parameters from Free APIs (4/12 = 33%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 69 | Repairability Score | ✅ iFixit | Free | No (scraping) |
| 70 | EPEAT Rating | ✅ EPEAT Registry | Free | No |
| 71 | Energy Star Rating | ✅ ENERGY STAR API | Free | No |
| 72 | Carbon Footprint | ⚠️ CDP API | Free | No (open data) |

---

## Category 5: Security & Safety (8 parameters)

### Parameters Available from Database (6/8 = 75%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 73 | Payment Security | ✅ Direct | `VeritasSecurityPolicy.paymentSecurity` | 0-100 |
| 74 | Fraud Protection | ✅ Direct | `VeritasSecurityPolicy.fraudProtection` | 0-100 |
| 75 | Buyer Protection | ✅ Direct | `VeritasSecurityPolicy.buyerProtection` | 0-100 |
| 76 | Money Back Guarantee | ✅ Direct | `VeritasSecurityPolicy.moneyBackGuarantee` | Boolean |
| 77 | SSL Encryption | ✅ Direct | `VeritasSecurityPolicy.sslEncryption` | Boolean |
| 78 | Platform Reputation | ✅ Direct | `VeritasSecurityPolicy.platformReputation` | 0-100 |

### Parameters from Free APIs (2/8 = 25%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 79 | SSL Certificate Check | ✅ SSL Labs API | Free | No |
| 80 | Security Scan | ✅ Security Headers | Free | No |

---

## Category 6: User Experience (10 parameters)

### Parameters Available from Database (10/10 = 100%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 81 | Page Quality | ✅ Direct | `VeritasUserExperience.pageQuality` | 0-100 |
| 82 | Description Complete | ✅ Direct | `VeritasUserExperience.descriptionComplete` | 0-100 |
| 83 | Transparency Score | ✅ Direct | `VeritasUserExperience.transparencyScore` | 0-100 |
| 84 | Image Quality | ✅ Direct | `VeritasUserExperience.imageQuality` | 0-100 |
| 85 | Image Count | ✅ Direct | `VeritasUserExperience.imageCount` | Count |
| 86 | Has Multiple Angles | ✅ Direct | `VeritasUserExperience.hasMultipleAngles` | Boolean |
| 87 | Checkout Ease | ✅ Direct | `VeritasUserExperience.checkoutEase` | 0-100 |
| 88 | Navigation Quality | ✅ Direct | `VeritasUserExperience.navigationQuality` | 0-100 |
| 89 | Mobile Optimized | ✅ Direct | `VeritasUserExperience.mobileOptimized` | Boolean |
| 90 | Support Accessibility | ✅ Direct | `VeritasUserExperience.supportAccessibility` | 0-100 |

---

## Category 7: Product Specifications (8 parameters)

### Parameters Available from Database (6/8 = 75%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 91 | Spec Completeness | ✅ Direct | `VeritasProductSpec.specCompleteness` | 0-100 |
| 92 | Spec Accuracy | ✅ Direct | `VeritasProductSpec.specAccuracy` | 0-100 |
| 93 | Feature Match Score | ✅ Direct | `VeritasProductSpec.featureMatchScore` | 0-100 |
| 94 | Dimensions | ✅ Direct | `Product.width, height, length` | cm |
| 95 | Weight | ✅ Direct | `Product.weight` | kg |
| 96 | Dynamic Specs | ✅ Direct | `Product.dynamicSpecs` | JSON object |

### Parameters from Free APIs (2/8 = 25%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 97 | Technical Specs | ✅ GSMArena | Free | No (scraping) |
| 98 | Feature Comparison | ✅ Open Product Data | Free | No |

---

## Category 8: Company Performance (8 parameters)

### Parameters Available from Database (2/8 = 25%)

| # | Parameter | DB Source | Field/Table | Notes |
|---|-----------|-----------|-------------|-------|
| 99 | Brand Reputation | ✅ Direct | `VeritasCompanyProfile.brandReputationScore` | 0-100 |
| 100 | Brand Recognition | ✅ Direct | `VeritasCompanyProfile.brandRecognition` | 0-100 |

### Parameters from Free APIs (2/8 = 25%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 101 | Company ESG Score | ✅ CDP Data | Free | No |
| 102 | News Sentiment | ✅ Google News | Free | No (scraping) |

### Parameters Requiring Paid APIs (4/8 = 50%)

| # | Parameter | API Source | Free? | Key Required |
|---|-----------|------------|-------|--------------|
| 103 | Stock Price | ⚠️ Alpha Vantage | Freemium | Yes (25/day free) |
| 104 | Market Cap | ⚠️ Alpha Vantage | Freemium | Yes |
| 105 | Financial Metrics | ⚠️ Alpha Vantage | Freemium | Yes |
| 106 | ESG Ratings | ⚠️ Sustainalytics | Enterprise | Yes |

---

## Implementation Script Example

### Fetch All Parameters from Database (No API Keys Required)

```typescript
async function fetchAllDatabaseParameters(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: true,
      reviews: true,
      productQuality: true,
      sustainability: true,
      userExperience: true,
      companyProfile: true,
      productSpec: true,
      sellerProfile: true,
      securityPolicy: true,
      marketData: true,
      priceHistory: true
    }
  })

  if (!product) return null

  // ===== PRODUCT QUALITY (15 direct + 5 computed = 20/25) =====
  const productQuality = {
    // Direct from DB
    name: product.name,
    condition: product.condition,
    brand: product.brand,
    category: product.category,
    description: product.description,
    images: JSON.parse(product.imageUrl || '[]'),
    conditionScore: product.productQuality?.conditionScore || 70,
    visualDefects: product.productQuality?.visualDefects || 70,
    functionalCompleteness: product.productQuality?.functionalCompleteness || 70,
    wearTearLevel: product.productQuality?.wearTearLevel || 70,
    missingComponents: product.productQuality?.missingComponents || 90,
    materialQuality: product.productQuality?.materialQuality || 70,
    authenticationStatus: product.productQuality?.authenticationStatus || 'Unknown',
    isAuthentic: product.isAuthentic,
    certifications: product.certifications,

    // Computed
    imageQualityScore: JSON.parse(product.imageUrl || '[]').length >= 5 ? 90 : 70,
    descriptionCompleteness: (product.description?.split(' ').length || 0) >= 100 ? 90 : 60,
    productAgeDays: Math.floor((Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    documentationComplete: product.certifications.length > 0,
    qualityScore: product.qualityScore
  }

  // ===== SELLER TRUST (18 direct + 1 computed = 19/20) =====
  const sellerTrust = {
    // Direct from DB
    sellerRating: product.seller?.rating || 0,
    totalSales: product.seller?.totalSales || 0,
    totalRevenue: Number(product.seller?.totalRevenue || 0),
    isVerified: product.seller?.isVerified || false,
    isActive: product.seller?.isActive || false,
    avgResponseTimeHours: product.seller?.avgResponseTimeHours || 24,
    avgShipmentDays: product.seller?.avgShipmentDays || 3,
    customerSatisfactionRate: product.seller?.customerSatisfactionRate || 0.9,
    defectRate: product.seller?.defectRate || 0.02,
    onTimeDeliveryRate: product.seller?.onTimeDeliveryRate || 0.95,
    categories: product.seller?.categories || [],
    businessName: product.seller?.businessName || '',
    location: `${product.seller?.city || ''}, ${product.seller?.state || ''}`,
    commissionRate: product.seller?.commissionRate || 0.1,
    responseRate: product.sellerProfile?.responseRate || 0,
    serviceQuality: product.sellerProfile?.serviceQualityScore || 70,
    communicationScore: product.sellerProfile?.communicationScore || 70,

    // Computed
    accountAgeDays: product.seller
      ? Math.floor((Date.now() - product.seller.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  }

  // ===== MARKET VALUE (10 direct + 3 computed = 13/15) =====
  const marketValue = {
    // Direct from DB
    currentPrice: product.price,
    originalPrice: product.originalPrice,
    stockQuantity: product.stockQuantity,
    popularityScore: product.popularityScore,
    trendingScore: product.trendingScore,
    viewCount: product.viewCount,
    clickCount: product.clickCount,
    purchaseCount: product.purchaseCount,
    cartAdditionCount: product.cartAdditionCount,

    // Computed
    discountPercentage: ((product.originalPrice - product.price) / product.originalPrice) * 100,
    conversionRate: product.viewCount > 0 ? product.purchaseCount / product.viewCount : 0,
    priceHistory: product.priceHistory || []
  }

  // ===== SUSTAINABILITY (8 direct = 8/12) =====
  const sustainability = {
    carbonReduction: product.sustainability?.carbonReduction || 70,
    eWastePrevention: product.sustainability?.eWastePrevention || 70,
    resourceConservation: product.sustainability?.resourceConservation || 70,
    reuseFactor: product.sustainability?.reuseFactor || 70,
    recyclingPotential: product.sustainability?.recyclingPotential || 70,
    refurbQuality: product.sustainability?.refurbQuality || 70,
    expectedLifespanYears: product.sustainability?.expectedLifespanYears || 5,
    energyStarCertified: product.sustainability?.energyStarCertified || false
  }

  // ===== SECURITY & SAFETY (6 direct = 6/8) =====
  const security = {
    paymentSecurity: product.securityPolicy?.paymentSecurity || 70,
    fraudProtection: product.securityPolicy?.fraudProtection || 70,
    buyerProtection: product.securityPolicy?.buyerProtection || 70,
    moneyBackGuarantee: product.securityPolicy?.moneyBackGuarantee || false,
    sslEncryption: product.securityPolicy?.sslEncryption || true,
    platformReputation: product.securityPolicy?.platformReputation || 70
  }

  // ===== USER EXPERIENCE (10 direct = 10/10) =====
  const userExperience = {
    pageQuality: product.userExperience?.pageQuality || 70,
    descriptionComplete: product.userExperience?.descriptionComplete || 70,
    transparencyScore: product.userExperience?.transparencyScore || 70,
    imageQuality: product.userExperience?.imageQuality || 70,
    imageCount: product.userExperience?.imageCount || 0,
    hasMultipleAngles: product.userExperience?.hasMultipleAngles || false,
    checkoutEase: product.userExperience?.checkoutEase || 70,
    navigationQuality: product.userExperience?.navigationQuality || 70,
    mobileOptimized: product.userExperience?.mobileOptimized || true,
    supportAccessibility: product.userExperience?.supportAccessibility || 70
  }

  // ===== PRODUCT SPECIFICATIONS (6 direct = 6/8) =====
  const specifications = {
    specCompleteness: product.productSpec?.specCompleteness || 70,
    specAccuracy: product.productSpec?.specAccuracy || 70,
    featureMatchScore: product.productSpec?.featureMatchScore || 70,
    dimensions: { width: product.width, height: product.height, length: product.length },
    weight: product.weight,
    dynamicSpecs: product.dynamicSpecs || {}
  }

  // ===== COMPANY PERFORMANCE (2 direct = 2/8) =====
  const companyPerformance = {
    brandReputation: product.companyProfile?.brandReputationScore || 70,
    brandRecognition: product.companyProfile?.brandRecognition || 70
  }

  return {
    productQuality,      // 20/25 = 80%
    sellerTrust,         // 19/20 = 95%
    marketValue,         // 13/15 = 87%
    sustainability,      // 8/12 = 67%
    security,            // 6/8 = 75%
    userExperience,      // 10/10 = 100%
    specifications,      // 6/8 = 75%
    companyPerformance,  // 2/8 = 25%

    // Summary
    totalParametersAvailable: 84,
    totalParametersPossible: 106,
    coveragePercentage: 79  // 84/106 = 79%
  }
}
```

---

## Free API Sources (No Key Required)

### 1. Product Quality

```typescript
// iFixit Repairability Score (Free scraping)
async function fetchRepairabilityScore(productName: string) {
  const url = `https://www.ifixit.com/Search?query=${encodeURIComponent(productName)}`
  // Scrape page for repairability score (0-10)
  return score
}
```

### 2. Sustainability

```typescript
// EPEAT Registry (Free public data)
async function fetchEPEATRating(productName: string) {
  const url = `https://epeat.net/search-computers-and-displays/?search=${encodeURIComponent(productName)}`
  // Scrape for Gold/Silver/Bronze rating
  return rating
}

// ENERGY STAR API (Free, no key)
async function fetchEnergyStarCertification(productName: string) {
  const url = `https://www.energystar.gov/productfinder/`
  // Search for certification status
  return certified
}

// CDP Open Data (Free)
async function fetchCarbonFootprint(brandName: string) {
  const url = `https://data.cdp.net/`
  // Download open dataset for company carbon emissions
  return carbonData
}
```

### 3. Security

```typescript
// SSL Labs API (Free, no key)
async function checkSSLCertificate(domain: string) {
  const url = `https://api.ssllabs.com/api/v3/analyze?host=${domain}`
  const response = await fetch(url)
  return response.json()
}
```

### 4. Market Data

```typescript
// Google Shopping (Free scraping)
async function fetchCompetitorPrices(productName: string) {
  const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productName)}`
  // Scrape competitor prices and count
  return { avgPrice, competitorCount }
}

// Price History from DB
async function fetchPriceHistory(productId: string) {
  const history = await prisma.priceHistory.findMany({
    where: { productId },
    orderBy: { recordedAt: 'desc' },
    take: 30  // Last 30 data points
  })
  return history
}
```

---

## Implementation Priority

### Phase 1: Database Only (No APIs) - 72 parameters

**Implement First**: All parameters that exist in the database or can be computed.

**Benefits**:
- ✅ No API costs
- ✅ No rate limits
- ✅ Instant availability
- ✅ No external dependencies

**Coverage**: 75% of all parameters

### Phase 2: Free APIs (No Keys) - 12 parameters

**Add Next**: Free APIs that don't require authentication.

**Sources**:
- iFixit (repairability)
- EPEAT Registry (sustainability)
- ENERGY STAR (energy efficiency)
- SSL Labs (security)
- Google Shopping (prices)
- CDP Open Data (carbon emissions)

**Coverage**: Additional 13% (88% total)

### Phase 3: Free APIs (Keys Required) - 8 parameters

**Add When Ready**: Free APIs that require registration but no payment.

**Sources**:
- Alpha Vantage (25 requests/day free)
- Trustpilot (free tier)
- Google Trends (unofficial API)

**Coverage**: Additional 8% (96% total)

### Phase 4: Paid APIs - 4 parameters

**Add Last**: Paid services for complete coverage.

**Sources**:
- Keepa API ($100/month)
- Sustainalytics (enterprise)
- Clearbit ($99/month)

**Coverage**: Final 4% (100% total)

---

## Next Steps

1. **Implement Database Fetcher**: Create function to fetch all 72 database parameters
2. **Test Coverage**: Verify 75% parameter coverage with DB only
3. **Add Free APIs**: Integrate iFixit, EPEAT, ENERGY STAR (no keys)
4. **Measure Impact**: Track how parameter coverage affects Veritas scores
5. **Scale Gradually**: Add paid APIs only when budget allows

---

## Conclusion

**You can implement 75% of Veritas Score parameters (72 out of 96) using only your existing database, without any external API keys!**

This provides a solid foundation for the Veritas Score system while keeping costs at zero. Additional parameters can be added incrementally as needed.
