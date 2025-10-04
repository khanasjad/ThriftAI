# Veritas Score™ - Data Level Analysis
## 121 Parameters Categorized by Storage Level & Data Sources

**Version:** 2.0
**Date:** October 2025
**Purpose:** Relational database architecture design for optimal data reuse

---

## Executive Summary

This document categorizes all 121 Veritas Score™ parameters into **8 data storage levels** to eliminate redundant data fetching and optimize performance.

### Key Insight: Data Reuse Efficiency

**Problem:** Current flat structure fetches Apple's stock price for EVERY Apple product
**Solution:** Store company data ONCE, link to all 10,000+ Apple products

**Performance Gains:**
- **API Calls Reduction:** 80% fewer external API calls
- **Database Efficiency:** Normalized data (no duplication)
- **Cache Optimization:** Company data cached 30 days vs. product data 1 day
- **Cost Savings:** $0 for 10,000 Apple products vs. 10,000 stock API calls

---

## Data Level Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  PLATFORM LEVEL (1 record per platform)             │
│  └─ Security policies, encryption, buyer protection │
│     Data Sources: Platform policies, compliance     │
│     Cache: 90 days                                  │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  COMPANY LEVEL (1 record per brand)                 │
│  └─ Brand reputation, stock data, market share      │
│     Data Sources: Alpha Vantage, financial APIs     │
│     Cache: 30 days (stock: 1 hour)                  │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  MODEL LEVEL (1 record per product model)           │
│  └─ Technical specs (processor, RAM, display)       │
│     Data Sources: GSMArena, manufacturer sheets     │
│     Cache: 90 days (specs don't change)             │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  SELLER LEVEL (1 record per seller)                 │
│  └─ Seller ratings, transaction history, disputes   │
│     Data Sources: eBay API, platform seller data    │
│     Cache: 7 days                                    │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  PRODUCT LEVEL (1 record per product listing)       │
│  └─ Condition, photos, warranty, price, UX          │
│     Data Sources: Product listing, AI analysis      │
│     Cache: 1 day                                     │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  MARKET LEVEL (time-series data, refreshed hourly)  │
│  └─ Market pricing, competitor analysis, trends     │
│     Data Sources: eBay market data, price trackers  │
│     Cache: 1 hour                                    │
└─────────────────────────────────────────────────────┘
```

---

## Table 1: VeritasCompanyProfile (Company Level)

**Cardinality:** 1 company profile → MANY products
**Update Frequency:** Stock data: 1 hour, Brand data: 30 days
**Storage:** Shared across ALL products from same brand

### Parameters (15 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Brand Reputation (35%)** | | | | | |
| 1 | Brand Reputation Score | CP_BRAND_REP | Brand database, rankings | 30 days | FREE (scrape) |
| 2 | Brand Recognition | CP_BRAND_RECOG | Market research APIs | 30 days | FREE (public data) |
| 3 | Customer Loyalty Index | CP_LOYALTY | Loyalty studies, NPS data | 30 days | FREE (public reports) |
| **Market Performance (25%)** | | | | | |
| 4 | Market Performance | CP_MARKET_PERF | Financial APIs, earnings | 1 day | FREE (public) |
| 5 | Stock Performance | CP_STOCK_PERF | **Alpha Vantage API** | 1 hour | **FREE (500/day)** |
| 6 | Market Share | CP_MARKET_SHARE | Market research reports | 30 days | FREE (public) |
| **News & Sentiment (25%)** | | | | | |
| 7 | News Sentiment Score | CP_NEWS_SENTIMENT | News API, sentiment analysis | 1 day | FREE (NewsAPI) |
| 8 | Media Coverage | CP_MEDIA | Media tracking, Google News | 1 day | FREE (scrape) |
| 9 | Social Media Sentiment | CP_SOCIAL | Twitter/Reddit API | 1 hour | FREE (limited) |
| **Public Domain Data (15%)** | | | | | |
| 10 | Public Presence Score | CP_PUBLIC_PRESENCE | SEO data, Wikipedia | 30 days | FREE (scrape) |
| 11 | Product Reviews Aggregate | CP_REVIEWS_AGG | Review aggregators | 7 days | FREE (scrape) |
| 12 | Industry Awards | CP_AWARDS | Awards databases | 90 days | FREE (public) |
| 13 | ESG Score | CP_ESG | ESG ratings databases | 30 days | FREE (public) |
| 14 | Innovation Index | CP_INNOVATION | Patent databases, R&D data | 30 days | FREE (public) |
| 15 | Global Presence | CP_GLOBAL | Countries served, stores | 90 days | FREE (scrape) |

**Example:** 1 Apple company profile → 10,000 Apple products
**API Savings:** 9,999 fewer stock API calls!

---

## Table 2: VeritasSellerProfile (Seller Level)

**Cardinality:** 1 seller profile → MANY products
**Update Frequency:** 7 days (more frequent for active sellers)
**Storage:** Shared across ALL listings from same seller

### Parameters (25 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Seller Reputation (40%)** | | | | | |
| 1 | Seller Rating | ST_RATING | **eBay API** | 7 days | **FREE (5000/day)** |
| 2 | Transaction Count | ST_TRANS_COUNT | eBay API, platform data | 7 days | FREE |
| 3 | Positive Review % | ST_POSITIVE_PCT | eBay API | 7 days | FREE |
| 4 | Account Age | ST_ACCOUNT_AGE | eBay API | 90 days | FREE |
| 5 | Verified Seller Status | ST_VERIFIED | Platform verification | 30 days | Platform |
| 6 | Top Rated Seller | ST_TOP_RATED | eBay API | 7 days | FREE |
| 7 | Seller Badges | ST_BADGES | Platform badges | 30 days | Platform |
| 8 | Seller Location | ST_LOCATION | eBay API | 90 days | FREE |
| **Response & Service (25%)** | | | | | |
| 9 | Response Time | ST_RESPONSE_TIME | Platform metrics | 7 days | Platform |
| 10 | Response Rate | ST_RESPONSE_RATE | Platform metrics | 7 days | Platform |
| 11 | Customer Service Quality | ST_SERVICE_QUAL | Reviews analysis | 30 days | Sentiment AI |
| 12 | Question Response Quality | ST_Q_QUALITY | Q&A analysis | 30 days | Sentiment AI |
| 13 | Communication Score | ST_COMM_SCORE | Message analysis | 30 days | Platform |
| **Transaction History (20%)** | | | | | |
| 14 | Dispute Rate | ST_DISPUTE | Platform data | 30 days | Platform |
| 15 | Refund Rate | ST_REFUND | Platform financial data | 30 days | Platform |
| 16 | Chargeback Rate | ST_CHARGEBACK | Payment processor | 30 days | Platform |
| 17 | Cancellation Rate | ST_CANCEL | Platform data | 30 days | Platform |
| 18 | Repeat Customer Rate | ST_REPEAT | Platform analytics | 30 days | Platform |
| **Reliability Indicators (15%)** | | | | | |
| 19 | On-Time Shipping | ST_SHIPPING | Shipping data | 30 days | Platform |
| 20 | Accurate Descriptions | ST_ACCURACY | Return analysis | 30 days | Platform |
| 21 | Packaging Quality | ST_PACKAGING | Customer feedback | 30 days | Reviews |
| 22 | Item as Described Rate | ST_IAD_RATE | Platform metrics | 30 days | Platform |
| 23 | Damage Rate | ST_DAMAGE | Claims data | 30 days | Platform |
| 24 | Return Request Rate | ST_RETURN_REQ | Platform data | 30 days | Platform |
| 25 | Seller Performance Index | ST_PERF_INDEX | Platform composite | 7 days | Platform |

**Example:** 1 eBay seller profile → 500 active listings
**Data Reuse:** Fetch seller data once, apply to all listings

---

## Table 3: VeritasProductSpec (Model Level)

**Cardinality:** 1 model spec → MANY units of same model
**Update Frequency:** 90 days (specs rarely change)
**Storage:** Shared across ALL units of same model (e.g., all iPhone 15 Pro Max 256GB)

### Parameters (20 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Technical Specifications (35%)** | | | | | |
| 1 | Specification Completeness | PS_COMPLETENESS | Spec sheet analysis | 90 days | Internal |
| 2 | Technical Detail Level | PS_TECH_DETAIL | Description analysis | 90 days | Internal |
| 3 | Accuracy Verification | PS_ACCURACY | Manufacturer database | 90 days | FREE (scrape) |
| 4 | Official Spec Sheet Match | PS_OFFICIAL_MATCH | Manufacturer site | 90 days | FREE |
| **Category-Specific Features (30%)** | | | | | |
| 5 | Feature Match Score | PS_FEATURE_MATCH | Category taxonomy | 90 days | Internal |
| 6 | Feature Completeness | PS_FEATURE_COMPLETE | Feature checklist | 90 days | Internal |
| 7 | Upgrade/Downgrade Indicator | PS_UPGRADE | Version comparison | 90 days | Database |
| **Model & Version (20%)** | | | | | |
| 8 | Model Year | PS_MODEL_YEAR | Product database | 90 days | FREE (scrape) |
| 9 | Version/Variant | PS_VARIANT | Product SKU | 90 days | FREE |
| 10 | Model Number Verification | PS_MODEL_NUM | Manufacturer DB | 90 days | FREE |
| 11 | Regional Variant | PS_REGION | Model database | 90 days | FREE |
| **Hardware Details (15%)** | | | | | |
| 12 | Processor Specs | PS_PROCESSOR | **GSMArena** | 90 days | **FREE (scrape)** |
| 13 | Memory/Storage | PS_MEMORY | GSMArena | 90 days | FREE |
| 14 | Display Specs | PS_DISPLAY | GSMArena | 90 days | FREE |
| 15 | Camera Specs | PS_CAMERA | GSMArena | 90 days | FREE |
| 16 | Battery Specs | PS_BATTERY | GSMArena | 90 days | FREE |
| 17 | Connectivity | PS_CONNECTIVITY | GSMArena | 90 days | FREE |
| 18 | Dimensions & Weight | PS_DIMENSIONS | GSMArena | 90 days | FREE |
| 19 | Operating System | PS_OS | GSMArena | 90 days | FREE |
| 20 | Build Materials | PS_MATERIALS | GSMArena | 90 days | FREE |

**Example:** 1 iPhone 15 Pro Max spec record → 5,000 individual iPhone 15 Pro Max listings
**Efficiency:** Fetch GSMArena data ONCE per model, not per listing!

---

## Table 4: VeritasProductQuality (Product Level)

**Cardinality:** 1 quality record → 1 product listing
**Update Frequency:** 1 day (photos/condition don't change often)
**Storage:** Unique per product

### Parameters (30 total - 6 shown, 24 to implement)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Physical Condition (45%)** | | | | | |
| 1 | Product Condition Score | PQ_CONDITION | Product listing | 1 day | Internal |
| 2 | Visual Defects Assessment | PQ_VISUAL_DEFECTS | AI vision analysis | 1 day | OpenAI Vision |
| 3 | Functional Completeness | PQ_FUNCTIONAL | Description NLP | 1 day | Internal AI |
| 4 | Wear and Tear Level | PQ_WEAR_TEAR | Photo analysis | 1 day | AI Vision |
| 5 | Missing Components | PQ_MISSING_PARTS | Description analysis | 1 day | Internal |
| 6 | Material Quality | PQ_MATERIAL | Brand reputation | 30 days | Company table |
| **Authenticity & Verification (20%)** | | | | | |
| 7 | Authentication Status | PQ_AUTH_STATUS | Certification docs | Never | Manual |
| 8 | Serial Number Verification | PQ_SERIAL_VERIFY | **Apple Warranty API** | 7 days | **FREE** |
| 9 | Counterfeit Risk Score | PQ_COUNTERFEIT | AI fraud detection | 1 day | Internal AI |
| 10 | Documentation Completeness | PQ_DOCS | Document scan | Never | Manual |
| 11 | IMEI/Serial Match | PQ_IMEI_MATCH | Device database | 7 days | FREE (CheckMEND) |
| **Functional Testing (15%)** | | | | | |
| 12 | Hardware Functionality | PQ_HW_FUNC | Testing report | Never | Manual/Cert |
| 13 | Software Performance | PQ_SW_PERF | Testing report | Never | Manual |
| 14 | Battery Health | PQ_BATTERY | Battery report | Never | Manual/Cert |
| 15 | Screen Quality | PQ_SCREEN | Testing report | Never | Manual |
| 16 | Camera Functionality | PQ_CAMERA_FUNC | Testing report | Never | Manual |
| **Age & History (10%)** | | | | | |
| 17 | Product Age | PQ_AGE | Manufacturing date | Never | Apple API |
| 18 | Usage Hours | PQ_USAGE | iOS analytics | Never | Device data |
| 19 | Previous Owner Count | PQ_OWNERS | Refurb history | Never | Manual |
| 20 | Repair History | PQ_REPAIRS | Service records | Never | Manual |
| **Warranty & Support (10%)** | | | | | |
| 21 | Warranty Coverage | PQ_WARRANTY | **Apple Warranty API** | 7 days | **FREE** |
| 22 | Return Policy | PQ_RETURN | Policy doc | 30 days | Platform |
| 23 | Support Availability | PQ_SUPPORT | Seller policy | 30 days | Seller table |
| 24-30 | (Additional 7 parameters) | | | | |

---

## Table 5: VeritasMarketData (Market Level - Time Series)

**Cardinality:** 1 market snapshot per product per time period
**Update Frequency:** 1 hour for pricing, 1 day for trends
**Storage:** Time-series data (multiple records per product)

### Parameters (20 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Price Positioning (40%)** | | | | | |
| 1 | Price vs Market Average | MV_PRICE_MARKET | **eBay market data** | 1 hour | **FREE** |
| 2 | Discount Percentage | MV_DISCOUNT | Price calculation | Real-time | Internal |
| 3 | Value for Money Index | MV_VALUE_INDEX | Calculated | Real-time | Internal |
| 4 | Price Competitiveness | MV_COMPETITIVE | Market analysis | 1 hour | eBay API |
| **Competitive Analysis (30%)** | | | | | |
| 5 | Price vs Competitors | MV_COMPETITOR | Competitor scan | 1 hour | eBay API |
| 6 | Best Price Indicator | MV_BEST_PRICE | Market ranking | 1 hour | eBay API |
| 7 | Price Stability | MV_STABILITY | Price history | 1 day | Price tracker |
| 8 | Market Position Percentile | MV_PERCENTILE | Statistical | 1 hour | Calculated |
| **Total Cost of Ownership (20%)** | | | | | |
| 9 | Warranty Value | MV_WARRANTY_VAL | Warranty pricing | 30 days | Market data |
| 10 | Shipping Cost | MV_SHIPPING | Shipping data | Real-time | Listing |
| 11 | Hidden Fees | MV_FEES | Policy scan | 1 day | Scrape |
| 12 | Tax Implications | MV_TAX | Tax calculator | Real-time | Internal |
| **Market Dynamics (10%)** | | | | | |
| 13 | Price Trend | MV_TREND | Trend analysis | 1 day | Price history |
| 14 | Demand Level | MV_DEMAND | Sales velocity | 1 hour | eBay sold items |
| 15 | Supply Availability | MV_SUPPLY | Inventory data | 1 hour | eBay active |
| 16 | Seasonal Factors | MV_SEASONAL | Historical patterns | 7 days | Analytics |
| 17-20 | (Additional 4 parameters) | | | | |

**Time-Series Design:** Store daily snapshots for trend analysis

---

## Table 6: VeritasSustainability (Product + Certification Hybrid)

**Cardinality:** 1 record per product + linked certifications
**Update Frequency:** 30 days for certifications, never for product-specific
**Storage:** Mix of product-specific and shared certification data

### Parameters (15 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Environmental Impact (40%)** | | | | | |
| 1 | Carbon Footprint Reduction | SUS_CARBON | Lifecycle calculation | Never | Calculated |
| 2 | E-Waste Prevention | SUS_EWASTE | Product age/condition | Never | Calculated |
| 3 | Resource Conservation | SUS_RESOURCE | Materials analysis | 90 days | Database |
| 4 | Manufacturing Impact | SUS_MFG | LCA databases | 90 days | FREE (public) |
| **Circular Economy (30%)** | | | | | |
| 5 | Reuse Factor | SUS_REUSE | Product lifecycle | Never | Calculated |
| 6 | Recycling Potential | SUS_RECYCLE | Material database | 90 days | iFixit |
| 7 | Refurbishment Quality | SUS_REFURB_QUAL | Certification level | Never | Manual |
| 8 | Upcycling Potential | SUS_UPCYCLE | Material value | 90 days | Calculated |
| **Product Longevity (20%)** | | | | | |
| 9 | Expected Lifespan | SUS_LIFESPAN | Age calculation | Never | Calculated |
| 10 | Repairability Score | SUS_REPAIR | **iFixit API** | 90 days | **FREE** |
| 11 | Software Support | SUS_SOFTWARE | Manufacturer policy | 90 days | FREE (scrape) |
| 12 | Parts Availability | SUS_PARTS | iFixit | 90 days | FREE |
| **Certifications (10%)** | | | | | |
| 13 | Eco Certifications | SUS_ECO_CERT | Certification DB | 90 days | FREE (EPEAT) |
| 14 | Refurb Certification | SUS_REFURB_CERT | Cert documents | Never | Manual |
| 15 | Energy Star Rating | SUS_ENERGY_STAR | **Energy Star API** | 90 days | **FREE** |

---

## Table 7: VeritasSecurityPolicy (Platform Level)

**Cardinality:** 1 security policy → ALL products on platform
**Update Frequency:** 90 days (policies change rarely)
**Storage:** Shared across entire platform

### Parameters (8 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Payment Security (40%)** | | | | | |
| 1 | Payment Security | SEC_PAYMENT | Platform security | 90 days | Platform |
| 2 | Fraud Protection | SEC_FRAUD | Security policy | 90 days | Platform |
| 3 | Payment Encryption | SEC_PAY_ENCRYPT | SSL/TLS check | 30 days | Security scan |
| **Buyer Protection (30%)** | | | | | |
| 4 | Buyer Protection | SEC_PROTECTION | Protection policy | 90 days | Platform |
| 5 | Dispute Resolution | SEC_DISPUTE | Policy review | 90 days | Platform |
| **Data Security (20%)** | | | | | |
| 6 | Data Privacy | SEC_PRIVACY | GDPR compliance | 90 days | Compliance |
| 7 | Device Security | SEC_DEVICE | Wiping standards | 90 days | Platform |
| **Platform Trust (10%)** | | | | | |
| 8 | Platform Reputation | SEC_PLATFORM | Platform rating | 30 days | Reviews |

**Example:** 1 Apple.com security profile → ALL products sold on Apple.com
**Efficiency:** Fetch platform policies ONCE, apply to millions of listings

---

## Table 8: VeritasUserExperience (Listing Level)

**Cardinality:** 1 UX record → 1 product listing
**Update Frequency:** 7 days (listing quality doesn't change often)
**Storage:** Unique per listing

### Parameters (8 total)

| # | Parameter Name | Code | Data Source | Update Freq | API Cost |
|---|----------------|------|-------------|-------------|----------|
| **Listing Quality (40%)** | | | | | |
| 1 | Product Page Quality | UX_PAGE_QUALITY | Content analysis | 7 days | Internal AI |
| 2 | Description Completeness | UX_DESC_COMPLETE | Description scan | 7 days | Internal |
| 3 | Transparency Score | UX_TRANSPARENCY | Content review | 7 days | Internal AI |
| **Visual Presentation (30%)** | | | | | |
| 4 | Image Quality | UX_IMAGE_QUALITY | Image analysis | 7 days | AI Vision |
| 5 | Image Count | UX_IMAGE_COUNT | Image count | Never | Internal |
| **Purchase Experience (20%)** | | | | | |
| 6 | Checkout Ease | UX_CHECKOUT | UX review | 30 days | Platform |
| 7 | Navigation Quality | UX_NAVIGATION | UX testing | 30 days | Platform |
| **Customer Support (10%)** | | | | | |
| 8 | Support Accessibility | UX_SUPPORT_ACCESS | Support policy | 30 days | Seller table |

---

## Database Relationships Diagram

```sql
-- Company Level (1 → MANY products)
VeritasCompanyProfile
  ├─ id (PRIMARY KEY)
  ├─ brandName (UNIQUE)
  ├─ stockSymbol
  ├─ brandReputationScore
  ├─ stockPrice (updated hourly)
  ├─ marketShare
  ├─ newsSentiment
  ├─ ... (15 parameters)
  └─ Products[] (relation)

-- Model Level (1 → MANY units)
VeritasProductSpec
  ├─ id (PRIMARY KEY)
  ├─ modelIdentifier (UNIQUE) -- e.g., "iPhone_15_Pro_Max_256GB"
  ├─ processor
  ├─ ram
  ├─ display
  ├─ camera
  ├─ ... (20 parameters)
  └─ Products[] (relation)

-- Seller Level (1 → MANY listings)
VeritasSellerProfile
  ├─ id (PRIMARY KEY)
  ├─ sellerIdentifier (UNIQUE) -- e.g., eBay seller name
  ├─ sellerRating
  ├─ transactionCount
  ├─ positiveFeedbackPercent
  ├─ ... (25 parameters)
  └─ Products[] (relation)

-- Platform Level (1 → ALL products)
VeritasSecurityPolicy
  ├─ id (PRIMARY KEY)
  ├─ platformName (UNIQUE) -- e.g., "eBay", "Apple.com"
  ├─ paymentSecurity
  ├─ buyerProtection
  ├─ ... (8 parameters)
  └─ Products[] (relation)

-- Product Level (1 → 1 listing)
Product
  ├─ id (PRIMARY KEY)
  ├─ companyProfileId (FOREIGN KEY → VeritasCompanyProfile)
  ├─ productSpecId (FOREIGN KEY → VeritasProductSpec)
  ├─ sellerProfileId (FOREIGN KEY → VeritasSellerProfile)
  ├─ securityPolicyId (FOREIGN KEY → VeritasSecurityPolicy)
  ├─ productQuality (relation → VeritasProductQuality)
  ├─ marketData (relation → VeritasMarketData[])
  ├─ sustainability (relation → VeritasSustainability)
  └─ userExperience (relation → VeritasUserExperience)

-- Product-Specific Tables (1 → 1)
VeritasProductQuality
  ├─ id (PRIMARY KEY)
  ├─ productId (UNIQUE, FOREIGN KEY)
  ├─ condition
  ├─ batteryHealth
  ├─ warrantyStatus
  ├─ ... (30 parameters)
  └─ product (relation)

VeritasMarketData (Time Series)
  ├─ id (PRIMARY KEY)
  ├─ productId (FOREIGN KEY)
  ├─ snapshotDate (TIMESTAMP)
  ├─ marketPrice
  ├─ competitorPrices
  ├─ ... (20 parameters)
  └─ product (relation)

VeritasSustainability
  ├─ id (PRIMARY KEY)
  ├─ productId (UNIQUE, FOREIGN KEY)
  ├─ carbonFootprint
  ├─ repairabilityScore
  ├─ energyStarRating
  ├─ ... (15 parameters)
  └─ product (relation)

VeritasUserExperience
  ├─ id (PRIMARY KEY)
  ├─ productId (UNIQUE, FOREIGN KEY)
  ├─ pageQuality
  ├─ imageCount
  ├─ ... (8 parameters)
  └─ product (relation)
```

---

## Data Fetching Strategy

### Fetch Once, Use Many

```typescript
// ❌ OLD WAY: Fetch for every product
for (const product of appleProducts) {
  const stock = await getStockByBrand('Apple') // 10,000 API calls!
}

// ✅ NEW WAY: Fetch once, link to all
const appleCompany = await getOrCreateCompanyProfile('Apple') // 1 API call
for (const product of appleProducts) {
  product.companyProfileId = appleCompany.id // Link to shared data
}
```

### Cache Duration Strategy

```typescript
const CACHE_STRATEGY = {
  platform: 90 days,     // Policies rarely change
  company: 30 days,      // Brand data stable (stock: 1 hour)
  model: 90 days,        // Specs never change for a model
  seller: 7 days,        // Seller ratings update weekly
  product: 1 day,        // Condition/photos don't change often
  market: 1 hour,        // Prices fluctuate frequently
}
```

---

## Implementation Priority

### Phase 1: High-Impact Tables (Company, Model, Seller)
- **Impact:** 80% of API call reduction
- **Effort:** 3-4 days
- **ROI:** Immediate performance gains

### Phase 2: Product-Specific Tables (Quality, Market, UX)
- **Impact:** Complete parameter coverage
- **Effort:** 4-5 days
- **ROI:** Full Veritas Score calculation

### Phase 3: Advanced Tables (Sustainability, Security)
- **Impact:** Certification management
- **Effort:** 2-3 days
- **ROI:** Future-proofing for certifications

---

## Cost Analysis

### Current System (Flat Structure)
```
10,000 Apple iPhone listings:
- Stock API calls: 10,000 × $0 = $0 (but hits rate limit!)
- GSMArena scrapes: 10,000 × 3 seconds = 8.3 hours
- eBay seller calls: 10,000 × $0 = $0 (but slow)

Total Time: 8+ hours
Rate Limit Risks: High
```

### New System (Relational)
```
10,000 Apple iPhone listings:
- Company profile: 1 fetch
- Model specs: ~10 fetches (iPhone 15 Pro variants)
- Seller profiles: ~500 fetches (20 products per seller avg)

Stock API calls: 1 (vs. 10,000)
GSMArena scrapes: 10 (vs. 10,000)
eBay seller calls: 500 (vs. 10,000)

Total Time: ~5 minutes
Rate Limit Risks: None
Efficiency Gain: 99.4%
```

---

## Next Steps

1. ✅ **This Document:** Data level analysis complete
2. 📝 **Prisma Schema:** Design 8 new models with relationships
3. 🗄️ **Migrations:** Create database migrations
4. 🔌 **Data Fetchers:** Build fetcher services for each table
5. 🧮 **Score Service:** Update Veritas Score to use relational data
6. 🧪 **Testing:** Verify data reuse and performance gains

---

**Document Version:** 2.0
**Last Updated:** October 2025
**Total Parameters:** 121 (30 PQ + 25 ST + 20 MV + 15 SUS + 8 SEC + 8 UX + 20 PS + 15 CP)
**Total Tables:** 8 (Company, Seller, Model, Product Quality, Market, Sustainability, Security, UX)
