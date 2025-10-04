# Veritas Score™ - Legal Data Sources for Phones & Laptops
## Real Data Mapping to 121 Parameters

**Version:** 1.0
**Date:** October 2025
**Status:** Planning & Implementation Guide

---

## Table of Contents

1. [Data Source Summary](#data-source-summary)
2. [Product Quality Sources (30 parameters)](#product-quality-sources)
3. [Seller Trust Sources (25 parameters)](#seller-trust-sources)
4. [Market Value Sources (20 parameters)](#market-value-sources)
5. [Sustainability Sources (15 parameters)](#sustainability-sources)
6. [Security & Safety Sources (8 parameters)](#security--safety-sources)
7. [User Experience Sources (8 parameters)](#user-experience-sources)
8. [Product Specification Sources (10 parameters)](#product-specification-sources)
9. [Company Performance Sources (5 parameters)](#company-performance-sources)
10. [Implementation Priority](#implementation-priority)
11. [Legal Compliance Notes](#legal-compliance-notes)

---

## Data Source Summary

### Quick Overview

| Data Source Type | Count | Legal Status | Cost | Reliability |
|------------------|-------|--------------|------|-------------|
| **Free Public APIs** | 12 | ✅ Legal (Terms) | Free | High |
| **Paid APIs** | 8 | ✅ Legal (Licensed) | $-$$$ | Very High |
| **Web Scraping (Allowed)** | 6 | ✅ Legal (robots.txt) | Free | Medium |
| **Public Databases** | 5 | ✅ Legal (Open Data) | Free | High |
| **Manufacturer APIs** | 4 | ✅ Legal (Official) | Free | Very High |
| **User Input** | 10 | ✅ Legal | Free | Variable |
| **AI Analysis** | 8 | ✅ Legal (Our Tech) | Internal | Medium |

**Total Data Sources: 53**

---

## Product Quality Sources (30 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Physical Condition (6 params)** |
| 1.1 | Product Condition | PQ_CONDITION | User/Seller Input | Input | ✅ Legal | Form field | Free | High |
| 1.2 | Visual Defects | PQ_VISUAL_DEFECTS | AI Image Analysis | AI | ✅ Legal | Our model | Internal | Medium |
| 1.3 | Functional Completeness | PQ_FUNCTIONAL | Description NLP | AI | ✅ Legal | Our model | Internal | Medium |
| 1.4 | Wear & Tear | PQ_WEAR_TEAR | User Input + Image AI | Hybrid | ✅ Legal | Form + AI | Free | High |
| 1.5 | Missing Components | PQ_MISSING_PARTS | Description Analysis | AI | ✅ Legal | Our model | Internal | Medium |
| 1.6 | Material Quality | PQ_MATERIAL | Brand Database | Database | ✅ Legal | Internal DB | Free | High |
| **2. Authenticity (5 params)** |
| 2.1 | Authentication Status | PQ_AUTH_STATUS | Seller Certification | Input | ✅ Legal | Form field | Free | High |
| 2.2 | Serial Number Check | PQ_SERIAL_VERIFY | Manufacturer API | API | ✅ Legal | Apple/Dell API | Free | Very High |
| 2.3 | Counterfeit Risk | PQ_COUNTERFEIT | AI Risk Analysis | AI | ✅ Legal | Our model | Internal | Medium |
| 2.4 | Documentation | PQ_DOCS | User Upload | Input | ✅ Legal | File upload | Free | High |
| 2.5 | IMEI/ESN Check | PQ_IMEI | CheckMend API | API | ✅ Legal (Paid) | API call | $0.50/check | Very High |
| **3. Functional Testing (5 params)** |
| 3.1 | Hardware Function | PQ_HW_FUNC | User Input | Input | ✅ Legal | Checklist form | Free | Medium |
| 3.2 | Software Performance | PQ_SW_PERF | User Input | Input | ✅ Legal | Form field | Free | Medium |
| 3.3 | Battery Health | PQ_BATTERY | User Input (iOS/Android) | Input | ✅ Legal | Copy-paste field | Free | High |
| 3.4 | Screen Quality | PQ_SCREEN | User Input + Images | Hybrid | ✅ Legal | Form + photos | Free | High |
| 3.5 | Connectivity Test | PQ_CONNECTIVITY | User Input | Input | ✅ Legal | Checklist | Free | Medium |
| **4. Age & History (5 params)** |
| 4.1 | Manufacturing Date | PQ_AGE | Serial Number Decode | API | ✅ Legal | Apple/Dell API | Free | Very High |
| 4.2 | Purchase Date | PQ_PURCHASE_DATE | User Input | Input | ✅ Legal | Date field | Free | Medium |
| 4.3 | Usage Hours | PQ_USAGE | User Input (iOS/Settings) | Input | ✅ Legal | Manual entry | Free | Medium |
| 4.4 | Previous Owners | PQ_OWNERS | User Input | Input | ✅ Legal | Number field | Free | Low |
| 4.5 | Repair History | PQ_REPAIR_HIST | User Input | Input | ✅ Legal | Form field | Free | Medium |
| **5. Warranty (4 params)** |
| 5.1 | Warranty Status | PQ_WARRANTY | Manufacturer API | API | ✅ Legal | Apple/Dell API | Free | Very High |
| 5.2 | Warranty Remaining | PQ_WARRANTY_TIME | Manufacturer API | API | ✅ Legal | Apple/Dell API | Free | Very High |
| 5.3 | Return Policy | PQ_RETURN | Seller Input | Input | ✅ Legal | Form field | Free | High |
| 5.4 | Support Availability | PQ_SUPPORT | Manufacturer Website | Scrape | ✅ Legal | robots.txt OK | Free | High |
| **6. Accessories (5 params)** |
| 6.1 | Original Box | PQ_BOX | User Input | Input | ✅ Legal | Checkbox | Free | High |
| 6.2 | Charger Included | PQ_CHARGER | User Input | Input | ✅ Legal | Checkbox | Free | High |
| 6.3 | Cables Included | PQ_CABLES | User Input | Input | ✅ Legal | Checkbox | Free | High |
| 6.4 | Accessories Complete | PQ_ACCESSORIES | User Input | Input | ✅ Legal | Checklist | Free | High |
| 6.5 | Third-Party Accessories | PQ_3RD_PARTY | User Input | Input | ✅ Legal | Text field | Free | Medium |

### Implementation Details

#### Apple API (Free, Official)
```
Source: Apple GSX API / Check Coverage API
URL: https://checkcoverage.apple.com/
Legal: ✅ Official Apple API
Access: REST API
Rate Limit: 100 calls/day (free tier)

Data Provided:
- Serial number validation
- Warranty status
- Manufacturing date
- Model identification
- Service coverage
```

#### Dell API (Free, Official)
```
Source: Dell Warranty API
URL: https://www.dell.com/support/warranty/
Legal: ✅ Official Dell API
Access: REST API
Rate Limit: Unlimited (free)

Data Provided:
- Service tag validation
- Warranty status & expiration
- Ship date
- Product specifications
```

#### CheckMend API (Paid, Licensed)
```
Source: CheckMend IMEI Database
URL: https://www.checkmend.com/api
Legal: ✅ Licensed, paid service
Cost: $0.50 per check
Rate Limit: Based on plan

Data Provided:
- IMEI/ESN validation
- Stolen/lost status
- Blacklist status
- Network lock status
```

---

## Seller Trust Sources (25 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Seller Reputation (8 params)** |
| 1.1 | Seller Rating | ST_RATING | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.2 | Transaction Count | ST_TRANS_COUNT | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.3 | Positive Reviews % | ST_POSITIVE_PCT | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.4 | Negative Reviews % | ST_NEGATIVE_PCT | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.5 | Account Age | ST_ACCOUNT_AGE | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.6 | Verified Seller | ST_VERIFIED | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.7 | Top Rated Status | ST_TOP_RATED | Platform API | API | ✅ Legal | eBay/Amazon API | Free | Very High |
| 1.8 | Power Seller Status | ST_POWER_SELLER | Platform API | API | ✅ Legal | eBay API | Free | Very High |
| **2. Response & Service (6 params)** |
| 2.1 | Response Time | ST_RESPONSE_TIME | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 2.2 | Response Rate | ST_RESPONSE_RATE | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 2.3 | Service Quality | ST_SERVICE_QUAL | Review Analysis | AI | ✅ Legal | NLP on reviews | Internal | Medium |
| 2.4 | Communication Score | ST_COMM_SCORE | Review Analysis | AI | ✅ Legal | NLP on reviews | Internal | Medium |
| 2.5 | Question Response | ST_Q_RESPONSE | User Input | Input | ✅ Legal | Form field | Free | Low |
| 2.6 | After-Sale Support | ST_AFTER_SUPPORT | Review Analysis | AI | ✅ Legal | NLP on reviews | Internal | Medium |
| **3. Transaction History (6 params)** |
| 3.1 | Dispute Rate | ST_DISPUTE | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 3.2 | Refund Rate | ST_REFUND | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 3.3 | Chargeback Rate | ST_CHARGEBACK | Platform API | API | ⚠️ Limited | Limited access | N/A | Medium |
| 3.4 | Cancellation Rate | ST_CANCEL | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 3.5 | Return Rate | ST_RETURN | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 3.6 | Successful Transactions | ST_SUCCESS | Platform API | API | ✅ Legal | Platform metrics | Free | Very High |
| **4. Reliability (5 params)** |
| 4.1 | On-Time Shipping | ST_SHIPPING | Platform API | API | ✅ Legal | Shipping metrics | Free | High |
| 4.2 | Description Accuracy | ST_ACCURACY | Review Analysis | AI | ✅ Legal | NLP on reviews | Internal | Medium |
| 4.3 | Packaging Quality | ST_PACKAGING | Review Analysis | AI | ✅ Legal | NLP on reviews | Internal | Medium |
| 4.4 | Product as Described | ST_AS_DESCRIBED | Platform API | API | ✅ Legal | Platform metrics | Free | High |
| 4.5 | Delivery Success | ST_DELIVERY | Platform API | API | ✅ Legal | Shipping metrics | Free | High |

### Implementation Details

#### eBay API (Free, Official)
```
Source: eBay Finding & Trading APIs
URL: https://developer.ebay.com/
Legal: ✅ Official API, free tier available
Access: REST API
Rate Limit: 5,000 calls/day (free tier)

Data Provided:
- Seller feedback score
- Positive feedback percentage
- Total transactions
- Top Rated Seller status
- Account registration date
- Feedback details
```

#### Amazon SP-API (Free, Official - for sellers)
```
Source: Amazon Selling Partner API
URL: https://developer-docs.amazon.com/sp-api/
Legal: ✅ Official API
Access: REST API (requires seller registration)
Rate Limit: Varies by endpoint

Data Provided:
- Seller performance metrics
- Order defect rate
- Late shipment rate
- Valid tracking rate
- Customer feedback
```

---

## Market Value Sources (20 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Price Positioning (7 params)** |
| 1.1 | Current Price | MV_PRICE | User Input | Input | ✅ Legal | Form field | Free | High |
| 1.2 | Original Price | MV_ORIGINAL | User Input | Input | ✅ Legal | Form field | Free | High |
| 1.3 | Market Average | MV_MARKET_AVG | Price Aggregator | Scrape | ✅ Legal | CamelCamelCamel | Free | High |
| 1.4 | Price History | MV_PRICE_HIST | Price Aggregator | API | ✅ Legal | Keepa API | Paid | Very High |
| 1.5 | Discount % | MV_DISCOUNT | Calculated | Calc | ✅ Legal | Formula | Free | High |
| 1.6 | MSRP Reference | MV_MSRP | Manufacturer Website | Scrape | ✅ Legal | robots.txt OK | Free | Very High |
| 1.7 | Retail Price | MV_RETAIL | Best Buy/Amazon | Scrape | ✅ Legal | Public pricing | Free | High |
| **2. Competitive Analysis (6 params)** |
| 2.1 | Competitor Count | MV_COMP_COUNT | Platform Search | API | ✅ Legal | eBay/Amazon API | Free | High |
| 2.2 | Price Rank | MV_PRICE_RANK | Calculated | Calc | ✅ Legal | Formula | Free | High |
| 2.3 | Price Percentile | MV_PERCENTILE | Calculated | Calc | ✅ Legal | Formula | Free | High |
| 2.4 | Best Price | MV_BEST | Price Comparison | Scrape | ✅ Legal | Google Shopping | Free | High |
| 2.5 | Worst Price | MV_WORST | Price Comparison | Scrape | ✅ Legal | Google Shopping | Free | High |
| 2.6 | Price Stability | MV_STABILITY | Historical Data | API | ✅ Legal | Keepa API | Paid | High |
| **3. Total Cost of Ownership (4 params)** |
| 3.1 | Shipping Cost | MV_SHIPPING | User/Seller Input | Input | ✅ Legal | Form field | Free | High |
| 3.2 | Tax Amount | MV_TAX | Calculated | Calc | ✅ Legal | Formula | Free | High |
| 3.3 | Hidden Fees | MV_FEES | Listing Analysis | AI | ✅ Legal | NLP | Internal | Medium |
| 3.4 | Warranty Cost | MV_WARRANTY_COST | Warranty Providers | Scrape | ✅ Legal | Public pricing | Free | Medium |
| **4. Market Dynamics (3 params)** |
| 4.1 | Supply Count | MV_SUPPLY | Platform Search | API | ✅ Legal | eBay/Amazon API | Free | High |
| 4.2 | Demand Indicator | MV_DEMAND | Sales Velocity | API | ✅ Legal | Platform metrics | Limited | Medium |
| 4.3 | Price Trend | MV_TREND | Historical Analysis | API | ✅ Legal | Keepa API | Paid | High |

### Implementation Details

#### Keepa API (Paid, Licensed)
```
Source: Keepa Amazon Price Tracker
URL: https://keepa.com/
Legal: ✅ Licensed API
Cost: €15/month (300 tokens) + €0.05/token
Rate Limit: Based on tokens

Data Provided:
- Historical price data (Amazon)
- Sales rank history
- Price drop alerts
- Availability history
- Review count history
```

#### CamelCamelCamel (Free, Public Data)
```
Source: CamelCamelCamel Price Tracker
URL: https://camelcamelcamel.com/
Legal: ✅ Public data, scraping allowed
Access: Web scraping (respectful)
Rate Limit: Self-imposed (1 req/5 sec)

Data Provided:
- Amazon price history
- Average prices
- Price drops
- Historical charts
```

#### Google Shopping API (Free, Official)
```
Source: Google Shopping Content API
URL: https://developers.google.com/shopping-content
Legal: ✅ Official API
Access: REST API
Rate Limit: 10,000 queries/day (free)

Data Provided:
- Product prices across retailers
- Availability
- Shipping costs
- Product specifications
```

---

## Sustainability Sources (15 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Environmental Impact (5 params)** |
| 1.1 | Carbon Footprint | SUS_CARBON | Calculation Model | Calc | ✅ Legal | Our formula | Free | Medium |
| 1.2 | E-Waste Prevented | SUS_EWASTE | Calculation Model | Calc | ✅ Legal | Our formula | Free | High |
| 1.3 | Resource Savings | SUS_RESOURCE | Calculation Model | Calc | ✅ Legal | Our formula | Free | Medium |
| 1.4 | Water Savings | SUS_WATER | EPA Database | Database | ✅ Legal | Public data | Free | High |
| 1.5 | Energy Savings | SUS_ENERGY | Energy Star DB | Database | ✅ Legal | Public data | Free | High |
| **2. Circular Economy (4 params)** |
| 2.1 | Reuse Factor | SUS_REUSE | Product Condition | Calc | ✅ Legal | Formula | Free | High |
| 2.2 | Recycling Potential | SUS_RECYCLE | iFixit Database | Database | ✅ Legal | Public data | Free | Very High |
| 2.3 | Material Recovery | SUS_MATERIAL_REC | iFixit Database | Database | ✅ Legal | Public data | Free | High |
| 2.4 | Circular Score | SUS_CIRCULAR | Ellen MacArthur DB | Database | ✅ Legal | Public research | Free | Medium |
| **3. Product Longevity (4 params)** |
| 3.1 | Expected Lifespan | SUS_LIFESPAN | Age Calculation | Calc | ✅ Legal | Formula | Free | Medium |
| 3.2 | Repairability Score | SUS_REPAIR | iFixit API | API | ✅ Legal | Free API | Free | Very High |
| 3.3 | Software Support | SUS_SOFTWARE | Manufacturer Website | Scrape | ✅ Legal | Public info | Free | Very High |
| 3.4 | Parts Availability | SUS_PARTS | iFixit Database | Database | ✅ Legal | Public data | Free | High |
| **4. Certifications (2 params)** |
| 4.1 | Eco Certifications | SUS_ECO_CERT | EPEAT Database | Database | ✅ Legal | Public registry | Free | Very High |
| 4.2 | Energy Star | SUS_ENERGY_STAR | Energy Star API | API | ✅ Legal | Free API | Free | Very High |

### Implementation Details

#### iFixit API (Free, Open Source)
```
Source: iFixit Repair Database
URL: https://www.ifixit.com/api/
Legal: ✅ Public API, open data
Access: REST API
Rate Limit: No strict limit (reasonable use)

Data Provided:
- Repairability scores
- Teardown guides
- Parts availability
- Repair difficulty
- Component information
```

#### EPEAT Database (Free, Public Registry)
```
Source: EPEAT Environmental Registry
URL: https://www.epeat.net/
Legal: ✅ Public registry
Access: Web scraping (allowed) or manual lookup
Rate Limit: Reasonable use

Data Provided:
- Environmental certifications
- Product sustainability ratings
- Eco-label status
- Compliance criteria
```

#### Energy Star API (Free, Official)
```
Source: Energy Star Product Finder API
URL: https://www.energystar.gov/productfinder/
Legal: ✅ Official government API
Access: REST API
Rate Limit: Unlimited

Data Provided:
- Energy Star certification
- Energy efficiency ratings
- Annual energy cost
- Environmental impact
```

---

## Security & Safety Sources (8 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Payment Security (2 params)** |
| 1.1 | Payment Methods | SEC_PAYMENT | Platform Data | Input | ✅ Legal | Known platforms | Free | High |
| 1.2 | Fraud Protection | SEC_FRAUD | Platform Policy | Scrape | ✅ Legal | Public policy | Free | High |
| **2. Buyer Protection (2 params)** |
| 2.1 | Money Back Guarantee | SEC_PROTECTION | Platform Policy | Scrape | ✅ Legal | Public policy | Free | High |
| 2.2 | Dispute Resolution | SEC_DISPUTE | Platform Policy | Scrape | ✅ Legal | Public policy | Free | High |
| **3. Data Security (2 params)** |
| 3.1 | Privacy Compliance | SEC_PRIVACY | Observatory Mozilla | API | ✅ Legal | Free API | Free | Very High |
| 3.2 | SSL/HTTPS Status | SEC_ENCRYPT | SSL Labs API | API | ✅ Legal | Free API | Free | Very High |
| **4. Platform Trust (2 params)** |
| 4.1 | Platform Reputation | SEC_PLATFORM | Trustpilot API | API | ✅ Legal | Free tier | Free | High |
| 4.2 | BBB Rating | SEC_BBB | BBB Database | Scrape | ✅ Legal | Public ratings | Free | High |

### Implementation Details

#### Mozilla Observatory API (Free, Open Source)
```
Source: Mozilla Observatory Security Scanner
URL: https://observatory.mozilla.org/api/
Legal: ✅ Open source, free API
Access: REST API
Rate Limit: Reasonable use

Data Provided:
- Website security score
- HTTPS configuration
- Security headers
- Privacy compliance
```

#### SSL Labs API (Free, Official)
```
Source: Qualys SSL Labs
URL: https://www.ssllabs.com/ssltest/
Legal: ✅ Free API
Access: REST API
Rate Limit: Limited (caching recommended)

Data Provided:
- SSL/TLS configuration
- Security grade (A-F)
- Certificate information
- Vulnerability assessment
```

#### Trustpilot API (Free Tier, Licensed)
```
Source: Trustpilot Business API
URL: https://developers.trustpilot.com/
Legal: ✅ Official API
Access: REST API
Rate Limit: 100,000 calls/month (free tier)

Data Provided:
- Business reviews
- Trust score
- Review count
- Rating distribution
```

---

## User Experience Sources (8 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Listing Quality (3 params)** |
| 1.1 | Description Length | UX_DESC_LENGTH | Text Analysis | AI | ✅ Legal | Character count | Free | High |
| 1.2 | Description Quality | UX_DESC_QUALITY | NLP Analysis | AI | ✅ Legal | Our model | Internal | Medium |
| 1.3 | Information Completeness | UX_INFO_COMPLETE | Checklist Analysis | AI | ✅ Legal | Our model | Internal | Medium |
| **2. Visual Presentation (2 params)** |
| 2.1 | Image Count | UX_IMAGE_COUNT | Image Count | Calc | ✅ Legal | Simple count | Free | High |
| 2.2 | Image Quality | UX_IMAGE_QUALITY | Image Analysis | AI | ✅ Legal | Our model | Internal | Medium |
| **3. Purchase Experience (2 params)** |
| 3.1 | Platform Usability | UX_USABILITY | Known Platforms | Database | ✅ Legal | Internal DB | Free | High |
| 3.2 | Mobile Friendly | UX_MOBILE | Google PageSpeed | API | ✅ Legal | Free API | Free | High |
| **4. Support (1 param)** |
| 4.1 | Support Availability | UX_SUPPORT | Seller Input | Input | ✅ Legal | Form field | Free | Medium |

### Implementation Details

#### Google PageSpeed API (Free, Official)
```
Source: Google PageSpeed Insights API
URL: https://developers.google.com/speed/docs/insights/v5/get-started
Legal: ✅ Official Google API
Access: REST API
Rate Limit: 25,000 queries/day (free)

Data Provided:
- Page performance score
- Mobile usability
- Core Web Vitals
- User experience metrics
```

---

## Product Specification Sources (10 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Technical Specs (4 params)** |
| 1.1 | Processor | PS_PROCESSOR | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |
| 1.2 | RAM | PS_RAM | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |
| 1.3 | Storage | PS_STORAGE | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |
| 1.4 | Display | PS_DISPLAY | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |
| **2. Model Information (3 params)** |
| 2.1 | Model Number | PS_MODEL | User Input | Input | ✅ Legal | Form field | Free | High |
| 2.2 | Release Year | PS_YEAR | GSMArena / Wikipedia | Scrape | ✅ Legal | Public data | Free | Very High |
| 2.3 | SKU/Part Number | PS_SKU | User Input | Input | ✅ Legal | Form field | Free | Medium |
| **3. Features (3 params)** |
| 3.1 | Camera Specs | PS_CAMERA | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |
| 3.2 | Battery Capacity | PS_BATTERY_CAP | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |
| 3.3 | Connectivity | PS_CONNECTIVITY | GSMArena API | Scrape | ✅ Legal | Public data | Free | Very High |

### Implementation Details

#### GSMArena (Free, Public Data - Phones)
```
Source: GSMArena Phone Specifications Database
URL: https://www.gsmarena.com/
Legal: ✅ Public data, educational use allowed
Access: Web scraping (respectful, robots.txt compliant)
Rate Limit: Self-imposed (1 req/3 sec)

Data Provided:
- Complete phone specifications
- Release dates
- Benchmarks
- Camera specifications
- Battery information
- Connectivity options
```

#### Notebookcheck (Free, Public Data - Laptops)
```
Source: Notebookcheck Laptop Database
URL: https://www.notebookcheck.net/
Legal: ✅ Public data, educational use allowed
Access: Web scraping (respectful)
Rate Limit: Self-imposed (1 req/3 sec)

Data Provided:
- Laptop specifications
- Performance benchmarks
- Display reviews
- Battery life tests
- Build quality assessments
```

#### Apple Technical Specifications (Free, Official)
```
Source: Apple Tech Specs Pages
URL: https://support.apple.com/specs/
Legal: ✅ Official public data
Access: Web scraping (robots.txt compliant)
Rate Limit: Reasonable use

Data Provided:
- Official specifications
- Model identifiers
- Compatible accessories
- Technical features
```

---

## Company Performance Sources (5 parameters)

### Parameter Mapping Table

| # | Parameter | Code | Data Source | Type | Legal Status | Access Method | Cost | Reliability |
|---|-----------|------|-------------|------|--------------|---------------|------|-------------|
| **1. Brand Reputation (2 params)** |
| 1.1 | Brand Value | CP_BRAND_VALUE | Brand Finance Rankings | Scrape | ✅ Legal | Public rankings | Free | Very High |
| 1.2 | Customer Satisfaction | CP_CSAT | ACSI Database | Database | ✅ Legal | Public research | Free | Very High |
| **2. Market Performance (1 param)** |
| 2.1 | Stock Performance | CP_STOCK | Alpha Vantage API | API | ✅ Legal | Free API | Free | Very High |
| **3. News & Sentiment (1 param)** |
| 3.1 | News Sentiment | CP_NEWS | NewsAPI.org | API | ✅ Legal (Paid) | REST API | $449/mo | High |
| **4. Public Domain (1 param)** |
| 4.1 | Review Aggregate | CP_REVIEWS | Trustpilot + Google | API | ✅ Legal | Multiple sources | Free | High |

### Implementation Details

#### Alpha Vantage API (Free, Licensed)
```
Source: Alpha Vantage Stock Market API
URL: https://www.alphavantage.co/
Legal: ✅ Free API with attribution
Access: REST API
Rate Limit: 5 calls/minute, 500 calls/day (free)

Data Provided:
- Stock prices (real-time & historical)
- Company fundamentals
- Earnings data
- Market indicators
```

#### NewsAPI.org (Paid, Licensed)
```
Source: NewsAPI.org
URL: https://newsapi.org/
Legal: ✅ Licensed API
Cost: $449/month (business plan)
Rate Limit: Unlimited on business plan

Data Provided:
- News articles from 80,000+ sources
- Sentiment analysis
- Category filtering
- Historical news data
```

#### American Customer Satisfaction Index (Free, Public)
```
Source: ACSI Database
URL: https://www.theacsi.org/
Legal: ✅ Public research data
Access: Web scraping or manual lookup
Rate Limit: Reasonable use

Data Provided:
- Customer satisfaction scores by brand
- Industry benchmarks
- Trend data
- Brand comparisons
```

---

## Implementation Priority

### Phase 1: Essential Data Sources (Months 1-2)

| Priority | Data Source | Parameters Covered | Cost | Implementation Time |
|----------|-------------|-------------------|------|---------------------|
| 🔴 **P0** | User Input Forms | 25 parameters | Free | 2 weeks |
| 🔴 **P0** | Apple Warranty API | 5 parameters | Free | 1 week |
| 🔴 **P0** | eBay API | 15 parameters | Free | 2 weeks |
| 🔴 **P0** | GSMArena Scraper | 10 parameters | Free | 2 weeks |
| 🟡 **P1** | iFixit API | 4 parameters | Free | 1 week |
| 🟡 **P1** | Energy Star API | 2 parameters | Free | 1 week |

**Total Phase 1: 61 parameters / 26 currently implemented = 35 new parameters**

### Phase 2: Enhanced Data Sources (Months 3-4)

| Priority | Data Source | Parameters Covered | Cost | Implementation Time |
|----------|-------------|-------------------|------|---------------------|
| 🟡 **P1** | Amazon SP-API | 10 parameters | Free | 2 weeks |
| 🟡 **P1** | SSL Labs API | 2 parameters | Free | 1 week |
| 🟡 **P1** | Mozilla Observatory | 2 parameters | Free | 1 week |
| 🟢 **P2** | Alpha Vantage API | 1 parameter | Free | 1 week |
| 🟢 **P2** | Trustpilot API | 2 parameters | Free | 1 week |
| 🟢 **P2** | Google PageSpeed API | 2 parameters | Free | 1 week |

**Total Phase 2: 19 additional parameters**

### Phase 3: Premium Data Sources (Months 5-6)

| Priority | Data Source | Parameters Covered | Cost | Implementation Time |
|----------|-------------|-------------------|------|---------------------|
| 🟢 **P2** | Keepa API | 5 parameters | €15/mo | 2 weeks |
| 🟢 **P2** | CheckMend API | 1 parameter | $0.50/check | 1 week |
| 🔵 **P3** | NewsAPI.org | 1 parameter | $449/mo | 1 week |

**Total Phase 3: 7 additional parameters**

### Phase 4: AI & Advanced (Months 7-12)

| Priority | Technology | Parameters Covered | Cost | Implementation Time |
|----------|-----------|-------------------|------|---------------------|
| 🔵 **P3** | Image Analysis AI | 3 parameters | Internal | 4 weeks |
| 🔵 **P3** | NLP Sentiment Analysis | 5 parameters | Internal | 4 weeks |
| 🔵 **P3** | Description Analysis AI | 4 parameters | Internal | 3 weeks |

**Total Phase 4: 12 additional parameters**

---

## Complete Parameter Coverage

### Coverage Summary

| Phase | Parameters | Cumulative | % of 121 | Cost/Month | Status |
|-------|-----------|------------|----------|------------|--------|
| Current | 26 | 26 | 21% | $0 | ✅ Complete |
| Phase 1 | 35 | 61 | 50% | $0 | 🟡 Priority |
| Phase 2 | 19 | 80 | 66% | $0 | 🟢 Planned |
| Phase 3 | 7 | 87 | 72% | ~$100 | 🟢 Optional |
| Phase 4 | 12 | 99 | 82% | Internal | 🔵 Advanced |
| Remaining | 22 | 121 | 100% | TBD | Future |

### Parameter Status by Category

| Category | Total Params | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Remaining |
|----------|--------------|---------|---------|---------|---------|-----------|
| Product Quality | 30 | 12 | 6 | 2 | 5 | 5 |
| Seller Trust | 25 | 15 | 7 | 0 | 3 | 0 |
| Market Value | 20 | 8 | 4 | 5 | 0 | 3 |
| Sustainability | 15 | 6 | 4 | 0 | 0 | 5 |
| Security & Safety | 8 | 0 | 6 | 0 | 0 | 2 |
| User Experience | 8 | 3 | 2 | 0 | 3 | 0 |
| Product Specification | 10 | 10 | 0 | 0 | 0 | 0 |
| Company Performance | 5 | 1 | 2 | 0 | 1 | 1 |

---

## Cost Analysis

### Monthly Costs by Phase

| Phase | Free Sources | Paid Sources | Total Monthly Cost | ROI |
|-------|-------------|--------------|-------------------|-----|
| **Phase 1** | All sources | None | **$0** | Immediate |
| **Phase 2** | All sources | None | **$0** | Immediate |
| **Phase 3** | Most sources | Keepa + CheckMend | **~$100** | Medium |
| **Phase 4** | AI (internal) | NewsAPI (optional) | **$0-$449** | Long-term |

### Cost-Benefit Analysis

**Phase 1 (FREE - $0/month):**
- ✅ Covers 50% of all parameters
- ✅ All essential data
- ✅ High-quality official sources
- ✅ Zero cost
- ✅ **Recommended for MVP**

**Phase 2 (FREE - $0/month):**
- ✅ Adds 19 parameters (66% total coverage)
- ✅ Enhanced seller trust data
- ✅ Security improvements
- ✅ Still free
- ✅ **Recommended for V1.0**

**Phase 3 (PAID - ~$100/month):**
- ⚠️ Adds 7 parameters (72% coverage)
- ⚠️ Historical price data
- ⚠️ IMEI checks (pay per use)
- ⚠️ Optional enhancement
- 🤔 **Consider for scale**

**Phase 4 (VARIABLE - $0-$449/month):**
- ⚠️ AI-powered enhancements
- ⚠️ Sentiment analysis
- ⚠️ Image quality assessment
- ⚠️ Advanced features
- 🤔 **Future optimization**

---

## Legal Compliance Notes

### ✅ Fully Legal & Compliant

**1. Official APIs**
- Apple, Dell, HP warranty APIs
- eBay, Amazon marketplace APIs
- Energy Star, EPA government APIs
- Free tier with terms of service compliance

**2. User-Provided Data**
- Seller inputs
- Buyer submissions
- Photo uploads
- Manual measurements

**3. Public Databases**
- iFixit repair database
- EPEAT registry
- ACSI customer satisfaction
- Brand rankings

**4. Web Scraping (Allowed)**
- GSMArena (robots.txt: Allow)
- Notebookcheck (educational use)
- Public manufacturer specs
- Price comparison sites (allowed by ToS)

### ⚠️ Requires Care

**1. Rate Limiting**
- Respect API rate limits
- Implement exponential backoff
- Cache results appropriately
- Use CDN for static data

**2. Attribution**
- Credit data sources
- Follow attribution requirements
- Link back to sources
- Respect branding guidelines

**3. Terms of Service**
- Review ToS before implementation
- Monitor for ToS changes
- Implement kill switches
- Have backup sources

### ❌ Not Allowed / Avoid

**1. Prohibited Scraping**
- Sites explicitly blocking bots
- Behind authentication walls
- Violating robots.txt
- Copyrighted content

**2. Private Data**
- Personal user information
- Payment details
- Private messages
- Confidential business data

**3. Competitive Intelligence**
- Scraping competitors aggressively
- Reverse engineering
- Terms violations
- Unauthorized access

---

## API Keys & Access Requirements

### Free APIs (No Payment)

| API | Registration | API Key | Approval Time | Rate Limit |
|-----|--------------|---------|---------------|------------|
| Apple Check Coverage | No | No | Instant | None public |
| Dell Warranty | No | No | Instant | Unlimited |
| eBay Finding API | Yes | Yes | 1-2 days | 5,000/day |
| iFixit API | No | No | Instant | Reasonable |
| Energy Star | No | No | Instant | Unlimited |
| Google PageSpeed | Yes | Yes | Instant | 25,000/day |
| SSL Labs | No | No | Instant | Limited |
| Mozilla Observatory | No | No | Instant | Reasonable |

### Paid APIs (Subscription Required)

| API | Monthly Cost | Parameters | Worth It? | When to Add |
|-----|--------------|-----------|-----------|-------------|
| Keepa | €15 | 5 | 🟢 Yes | Phase 3 (scale) |
| CheckMend | Pay per use | 1 | 🟡 Maybe | Phase 3 (fraud prevention) |
| NewsAPI | $449 | 1 | 🔴 No | Phase 4 (optional) |

---

## Implementation Roadmap

### Week 1-2: User Input Forms (P0)
```
Tasks:
✅ Design input forms for all user-provided parameters
✅ Implement validation logic
✅ Create database fields
✅ Build frontend UI

Parameters Covered: 25
Cost: $0
Risk: Low
```

### Week 3-4: Apple & Dell APIs (P0)
```
Tasks:
✅ Integrate Apple warranty check
✅ Integrate Dell warranty API
✅ Serial number validation
✅ Manufacturing date extraction

Parameters Covered: 5
Cost: $0
Risk: Low (official APIs)
```

### Week 5-6: eBay API Integration (P0)
```
Tasks:
✅ Register for eBay developer account
✅ Implement seller reputation scraping
✅ Transaction history extraction
✅ Feedback analysis

Parameters Covered: 15
Cost: $0
Risk: Low (official API)
```

### Week 7-8: GSMArena Scraper (P0)
```
Tasks:
✅ Build respectful web scraper
✅ Phone specification extraction
✅ Laptop specification extraction
✅ Caching layer

Parameters Covered: 10
Cost: $0
Risk: Medium (web scraping)
Mitigation: Respectful rate limiting, robots.txt compliance
```

### Week 9-10: iFixit & Energy Star (P1)
```
Tasks:
✅ Integrate iFixit repairability API
✅ Energy Star certification lookup
✅ Sustainability calculations

Parameters Covered: 6
Cost: $0
Risk: Low
```

---

## Testing Strategy

### Data Quality Testing

| Test Type | Frequency | Pass Criteria | Alert If |
|-----------|-----------|---------------|----------|
| API Availability | Every 5 min | 99% uptime | <95% |
| Data Freshness | Hourly | <24h old | >48h |
| Accuracy Spot Check | Daily | 95% accurate | <90% |
| Coverage | Weekly | >80% params | <70% |
| Rate Limit Monitoring | Real-time | <80% limit | >90% |

### Fallback Strategy

| Data Source | Primary | Fallback 1 | Fallback 2 | Default Value |
|-------------|---------|------------|------------|---------------|
| Phone Specs | GSMArena | PhoneArena | Wikipedia | User input |
| Laptop Specs | Notebookcheck | Manufacturer | User input | N/A |
| Price History | Keepa | CamelCamelCamel | Manual | Current price |
| Seller Rating | Platform API | Cached data | N/A | 0 (unknown) |

---

## Summary: Best Data Sources for MVP

### Top 10 Data Sources (All Free)

| Rank | Data Source | Parameters | Cost | Why Essential |
|------|-------------|-----------|------|---------------|
| 1 | **User Input Forms** | 25 | Free | Foundation of all data |
| 2 | **eBay API** | 15 | Free | Seller trust (official) |
| 3 | **GSMArena** | 10 | Free | Phone specs (comprehensive) |
| 4 | **Apple Warranty API** | 5 | Free | Authentication (official) |
| 5 | **iFixit API** | 4 | Free | Repairability (unique) |
| 6 | **Amazon SP-API** | 10 | Free | Marketplace data |
| 7 | **Energy Star API** | 2 | Free | Sustainability (official) |
| 8 | **Google PageSpeed** | 2 | Free | UX metrics |
| 9 | **SSL Labs** | 2 | Free | Security scoring |
| 10 | **Alpha Vantage** | 1 | Free | Stock data |

**Total Parameters Covered: 76 / 121 (63%)**
**Total Cost: $0/month**
**Implementation Time: 8-10 weeks**

---

## Conclusion

**Recommended Approach:**

1. **Phase 1 (Months 1-2):** Implement all free APIs and user inputs
   - Cost: $0
   - Coverage: 50% (61 parameters)
   - Focus: Essential data quality

2. **Phase 2 (Months 3-4):** Add enhanced free sources
   - Cost: $0
   - Coverage: 66% (80 parameters)
   - Focus: Seller trust & security

3. **Phase 3 (Months 5-6):** Evaluate paid sources based on traction
   - Cost: ~$100/month
   - Coverage: 72% (87 parameters)
   - Focus: Historical data & fraud prevention

4. **Phase 4 (Months 7-12):** Build AI enhancement layer
   - Cost: Internal development
   - Coverage: 82%+ (99+ parameters)
   - Focus: Quality improvements

**Key Principle:** Start with free, high-quality sources. Only add paid sources when proven valuable at scale.

---

**Document Status:** ✅ Ready for Implementation
**Next Steps:** Begin Phase 1 development
**Estimated MVP Timeline:** 2 months (Phase 1)
**Estimated V1.0 Timeline:** 4 months (Phase 1 + 2)

---

**END OF DOCUMENT**
