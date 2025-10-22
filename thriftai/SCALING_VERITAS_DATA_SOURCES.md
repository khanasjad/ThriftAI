# Scaling Veritas Score Data Sources

## Executive Summary

**Goal**: Enhance Veritas Scores by enriching products with data from multiple sources.

**Current Status**:
- 17 data fetchers implemented
- 75% parameter coverage from database alone
- ~12-15 external APIs integrated

**Realistic Target**: 50-100 high-quality data sources (not 1000)
- Quality > Quantity for scoring accuracy
- Legal, ethical data acquisition only
- Focus on APIs over web scraping

---

## Why NOT 1000 Websites?

### Legal & Ethical Issues:
1. **Terms of Service Violations**: Most websites prohibit scraping
2. **Copyright Infringement**: Data may be copyrighted
3. **Rate Limiting**: You'll get IP-banned quickly
4. **Server Load**: Could constitute a DDOS attack
5. **Legal Action**: Risk of lawsuits (LinkedIn sued hiQ Labs for scraping)

### Technical Issues:
1. **Maintenance Nightmare**: Websites change layout constantly
2. **Low Quality Data**: Scraped data is often incomplete/incorrect
3. **Slow**: Scraping 1000 sites would take days
4. **Infrastructure Cost**: Need proxies, CAPTCHA solving, browser automation

### Better Approach:
- **50-100 curated APIs** providing reliable, structured data
- **Official data sources** with legal access
- **Aggregators** that consolidate multiple sources
- **Public databases** with open data

---

## Current Data Source Inventory

### ✅ Already Implemented (17 sources):

#### Product Authentication & Specs:
1. **Apple Warranty API** - Serial validation, warranty status
2. **Dell Warranty API** - Service tag validation
3. **GSMArena** - Phone technical specifications
4. **iFixit API** - Repairability scores

#### Market & Pricing:
5. **eBay Finding API** - Market pricing, seller ratings
6. **Database** - Historical pricing, seller profiles

#### Sustainability:
7. **Energy Star API** - Energy efficiency ratings
8. **iFixit** - Repairability (already counted above)

#### Financial & Company Data:
9. **Alpha Vantage** - Stock market data
10. **Yahoo Finance** - Company financials

#### Trust & Security:
11. **SSL Labs API** - Website security ratings
12. **Database Seller Profiles** - Trust scores

#### Sentiment & Trends:
13. **News API** - Brand sentiment analysis
14. **Google Trends** - Product popularity

#### Other:
15. **Database Product History** - Past sales, returns
16. **Database Company Profiles** - Cached data
17. **Database Category Metrics** - Category averages

---

## Priority Data Sources to Add (Next 25-50)

### Tier 1: High Impact, Free/Cheap APIs (Next 10)

| Source | Cost | Parameters | Impact | Integration Difficulty |
|--------|------|------------|--------|----------------------|
| **EPEAT** | Free | Sustainability rating | High | Easy |
| **TCO Certified** | Free | Sustainability cert | High | Easy |
| **EPA Safer Choice** | Free | Chemical safety | Medium | Easy |
| **FTC Recall Database** | Free | Product recalls | High | Medium |
| **CPSC Safety** | Free | Safety ratings | High | Medium |
| **BBB API** | Paid | Business ratings | High | Easy |
| **Trustpilot** | Freemium | Customer reviews | High | Medium |
| **Keepa** | Cheap | Amazon price history | High | Easy |
| **CamelCamelCamel** | Free | Amazon tracking | High | Medium |
| **PriceAPI** | Paid | Multi-marketplace | High | Easy |

**Estimated Impact**: +15-20 Veritas score points on average

### Tier 2: Premium APIs (Next 10)

| Source | Cost/Month | Parameters | Impact |
|--------|------------|------------|--------|
| **Sustainalytics ESG** | $$$ | ESG scores | Very High |
| **CDP (Carbon Disclosure)** | Free tier | Carbon data | High |
| **MSCI ESG** | $$$$ | ESG ratings | Very High |
| **Glassdoor API** | Paid | Company culture | Medium |
| **Crunchbase** | Paid | Company funding | Medium |
| **Pitchbook** | $$$$ | Private company data | Medium |
| **Nielsen** | $$$ | Brand perception | High |
| **Kantar** | $$$ | Market share | Medium |
| **Gartner** | $$$$ | Tech ratings | High |
| **J.D. Power** | $$$ | Quality ratings | Very High |

**Estimated Impact**: +10-15 Veritas score points

### Tier 3: Manufacturer APIs (Next 10)

| Manufacturer | API Type | Free | Parameters |
|--------------|----------|------|-----------|
| **HP Warranty** | REST | Yes | Warranty, specs |
| **Lenovo Warranty** | REST | Yes | Warranty, specs |
| **Samsung Members** | REST | No | Warranty, features |
| **Sony Support** | REST | Yes | Product info |
| **Microsoft Store** | REST | Yes | Product details |
| **Google Store** | REST | Yes | Device info |
| **ASUS Support** | REST | Yes | Warranty, specs |
| **Acer Support** | REST | Yes | Warranty info |
| **LG ThinQ** | REST | Yes | Smart device data |
| **Whirlpool** | REST | Yes | Appliance specs |

**Estimated Impact**: +5-10 points for applicable products

### Tier 4: Industry Databases (Next 10)

| Database | Cost | Coverage | Value |
|----------|------|----------|-------|
| **GS1 Registry** | Paid | UPC/barcode data | High |
| **ICECAT** | Freemium | Product specs | Very High |
| **Semantic3** | Paid | E-commerce data | High |
| **Factual Places** | Paid | Retailer data | Medium |
| **Product Advertising API** (Amazon) | Free | Amazon catalog | Very High |
| **Best Buy API** | Free | Electronics specs | High |
| **Walmart Open API** | Free | Product catalog | High |
| **Target API** | Limited | Retail data | Medium |
| **Newegg API** | Paid | Tech products | High |
| **Zappos API** | Limited | Shoe data | Medium |

**Estimated Impact**: +10-20 points (specification completeness)

### Tier 5: Specialized Sources (Next 10)

| Source | Focus Area | API | Value |
|--------|-----------|-----|-------|
| **Wirecutter** | Product reviews | Scrape | High |
| **Consumer Reports** | Testing data | Paid API | Very High |
| **RTINGS** | TV/Monitor testing | Scrape | High |
| **DxOMark** | Camera testing | API | High |
| **Notebookcheck** | Laptop reviews | Scrape | High |
| **TechRadar** | Tech reviews | Scrape | Medium |
| **The Verge** | Tech news | Scrape | Medium |
| **CNET** | Reviews | Scrape | High |
| **Good Housekeeping** | Home products | Scrape | High |
| **Which?** (UK) | Product testing | Paid | Very High |

**Note**: Scraping sources require legal permission/licensing

---

## Implementation Strategy

### Phase 1: Foundations (Week 1-2)
✅ **COMPLETED**:
- Created batch enrichment API endpoint
- Integrated existing 17 data sources
- Built caching system
- Implemented error handling

### Phase 2: Quick Wins (Week 3-4)
**Add Tier 1 sources** (Free APIs):
1. Set up EPEAT API integration
2. Add EPA Safer Choice lookups
3. Integrate FTC Recall Database
4. Add CPSC Safety checks
5. Implement Keepa price tracking

**Expected Result**: +15 points average score improvement

### Phase 3: Market Data (Week 5-6)
**Add pricing aggregators**:
1. Amazon Product Advertising API
2. Best Buy API
3. Walmart Open API
4. CamelCamelCamel integration
5. PriceAPI for multi-marketplace

**Expected Result**: Better market value scoring

### Phase 4: Sustainability (Week 7-8)
**Add ESG sources**:
1. CDP API (carbon disclosure)
2. TCO Certified lookups
3. EPEAT database
4. Company sustainability reports
5. Industry certifications

**Expected Result**: Comprehensive sustainability scoring

### Phase 5: Premium Sources (Month 3)
**Evaluate ROI of paid APIs**:
- Sustainalytics (if budget allows)
- Consumer Reports licensing
- J.D. Power data
- Nielsen brand tracking

---

## How to Add a New Data Source

### Step 1: Create Data Fetcher

Create file: `/src/lib/dataFetcher/yourSource.ts`

```typescript
import logger from '@/lib/logger'

interface YourSourceData {
  // Define your data structure
  score: number
  details: any
}

export class YourSourceFetcher {
  private apiKey: string
  private baseUrl = 'https://api.yoursource.com'

  constructor() {
    this.apiKey = process.env.YOUR_SOURCE_API_KEY || ''
  }

  async fetchData(productId: string): Promise<YourSourceData | null> {
    if (!this.apiKey) {
      logger.warn('Your Source API key not configured')
      return null
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()

      logger.info(`✅ Fetched data from Your Source for ${productId}`)

      return {
        score: data.rating,
        details: data
      }

    } catch (error) {
      logger.error('Failed to fetch from Your Source:', error)
      return null
    }
  }
}

export const yourSourceFetcher = new YourSourceFetcher()
```

### Step 2: Update Product Enrichment Service

In `/src/lib/services/productEnrichmentService.ts`:

```typescript
import { yourSourceFetcher } from '@/lib/dataFetcher/yourSource'

// In enrichProduct method:
const yourSourceData = await yourSourceFetcher.fetchData(product.id)
if (yourSourceData) {
  enrichmentMetadata.sources.push('YourSource')

  // Add to dynamic specs
  enrichedProduct.dynamicSpecs.yourSourceScore = yourSourceData.score

  // Use in Veritas calculation
  // (update VeritasScoreCalculator.ts to include this data)
}
```

### Step 3: Update Veritas Score Calculator

In `/src/lib/services/veritas/VeritasScoreCalculator.ts`:

```typescript
// Add to appropriate category calculation
private calculateSustainabilityScore(): number {
  // ... existing code ...

  // Add your new parameter
  if (this.product.dynamicSpecs?.yourSourceScore) {
    const normalized = this.normalizeScore(
      this.product.dynamicSpecs.yourSourceScore,
      0,  // min value
      100 // max value
    )
    sustainabilityScore += normalized * 0.15 // 15% weight
  }

  return sustainabilityScore
}
```

### Step 4: Add Environment Variable

In `.env.local`:
```bash
YOUR_SOURCE_API_KEY=your_api_key_here
```

### Step 5: Test

```bash
# Run batch enrichment on 10 products
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=10"

# Check results
curl "http://localhost:3000/api/admin/batch-enrich"
```

---

## Running Batch Enrichment

### Check Current Status:
```bash
curl http://localhost:3000/api/admin/batch-enrich
```

Response:
```json
{
  "catalog": {
    "totalProducts": 100,
    "enrichedProducts": 75,
    "needsEnrichment": 25,
    "enrichmentRate": "75.0%"
  },
  "scoring": {
    "averageScore": "78.5",
    "gradeDistribution": {
      "S (95-100)": 5,
      "A (85-94)": 20,
      "B (75-84)": 35,
      "C (65-74)": 10,
      "D (50-64)": 4,
      "F (0-49)": 1
    }
  }
}
```

### Enrich 10 Products:
```bash
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=10"
```

### Enrich Electronics Only:
```bash
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=50&category=ELECTRONICS"
```

### Enrich High-Value Items:
```bash
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=100&minPrice=500"
```

### Force Refresh (bypass cache):
```bash
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=10&forceRefresh=true"
```

---

## Expected Results

### With Current Sources (17):
- **Average Score**: 70-75 / 100
- **Parameter Coverage**: 75%
- **Enrichment Time**: 2-3 seconds per product
- **Cost**: $0 (using free tiers)

### After Tier 1 (27 sources):
- **Average Score**: 80-85 / 100
- **Parameter Coverage**: 85%
- **Enrichment Time**: 3-4 seconds per product
- **Cost**: ~$50/month

### After Tier 2 (37 sources):
- **Average Score**: 85-90 / 100
- **Parameter Coverage**: 92%
- **Enrichment Time**: 4-5 seconds per product
- **Cost**: ~$500/month

### Target: 50-75 sources
- **Average Score**: 88-92 / 100
- **Parameter Coverage**: 95%+
- **Enrichment Time**: 5-7 seconds per product
- **Cost**: ~$1,500/month

---

## Cost-Benefit Analysis

### ROI Calculation:

**Assumptions**:
- 10,000 products in catalog
- 1,000 sales per month
- Conversion rate: 2%

**Scenario 1: Current (Free)**
- Score Accuracy: 75%
- User Trust: Moderate
- Conversion: 2.0%
- Revenue: $50,000/mo

**Scenario 2: +10 Sources ($50/mo)**
- Score Accuracy: 85%
- User Trust: High
- Conversion: 2.5% (+25%)
- Revenue: $62,500/mo
- **ROI**: $12,500/mo - $50 = **$12,450/mo profit** = **24,900% ROI**

**Scenario 3: +30 Sources ($1,500/mo)**
- Score Accuracy: 92%
- User Trust: Very High
- Conversion: 3.5% (+75%)
- Revenue: $87,500/mo
- **ROI**: $37,500/mo - $1,500 = **$36,000/mo profit** = **2,400% ROI**

---

## Legal Considerations

### ✅ Legal Data Sources:
- **Official APIs** with Terms of Service allowing commercial use
- **Open Data** from government sources (EPA, CPSC, FTC)
- **Licensed Data** from data providers
- **Public Domain** information
- **User-Generated** content with proper attribution

### ❌ Avoid:
- **Web Scraping** without permission
- **Copyright Infringement** (copying proprietary data)
- **ToS Violations** (using APIs against their terms)
- **Personal Data** scraping (GDPR/CCPA violations)
- **Competitive Intelligence** gathering illegally

### Best Practices:
1. **Read Terms of Service** carefully
2. **Request API Access** officially
3. **Use Rate Limiting** to respect servers
4. **Cache Data** to minimize requests
5. **Attribute Sources** properly
6. **Monitor Legal Changes** regularly

---

## Monitoring & Maintenance

### Key Metrics to Track:

1. **Data Quality**:
   - Parameter completeness rate
   - Data freshness (cache hit rate)
   - Error rates per source

2. **Performance**:
   - Average enrichment time
   - API response times
   - Queue processing speed

3. **Business Impact**:
   - Average Veritas score trend
   - Score improvement distribution
   - User trust metrics
   - Conversion rate changes

4. **Cost Efficiency**:
   - Cost per enriched product
   - API usage vs limits
   - ROI per data source

### Alerts to Set Up:

```typescript
// High error rate
if (errorRate > 0.1) {
  alert('Data source experiencing issues')
}

// Slow enrichment
if (avgEnrichmentTime > 10000) {
  alert('Enrichment taking too long - check APIs')
}

// Low score improvements
if (avgScoreImprovement < 5) {
  alert('Data sources not adding value')
}

// API limits approaching
if (apiUsage > 0.8 * apiLimit) {
  alert('Approaching API rate limit')
}
```

---

## Next Steps

### Immediate (This Week):
1. ✅ Set up batch enrichment endpoint
2. ✅ Document data source integration process
3. ⏳ Test current enrichment on 10 products
4. ⏳ Identify top 3 Tier 1 sources to add

### Short-term (Next 2 Weeks):
1. Add EPEAT sustainability data
2. Integrate FTC Recall Database
3. Add Amazon Product Advertising API
4. Implement Keepa price tracking
5. Set up monitoring dashboard

### Medium-term (Next Month):
1. Add 5 more Tier 1 sources
2. Evaluate premium API ROI
3. Build automated enrichment scheduler
4. Create admin UI for enrichment management
5. Implement parallel processing

### Long-term (Next Quarter):
1. Scale to 50 data sources
2. Implement machine learning for source prioritization
3. Build custom data aggregation pipeline
4. Create data marketplace integration
5. Achieve 95%+ parameter coverage

---

## Summary

**Don't aim for 1000 websites** - aim for **50-100 high-quality, legal data sources** that provide:
- ✅ Structured, reliable data
- ✅ Legal access via APIs
- ✅ Reasonable cost
- ✅ Maintainable integrations
- ✅ Real business value

**Your batch enrichment system is ready** - start adding sources incrementally and measure ROI at each step.

**Priority**: Focus on free Tier 1 sources first to prove value before investing in premium APIs.
