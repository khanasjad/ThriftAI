# 🎯 Data Sources for Veritas Score™ - Complete Parameter Collection

## Overview

This document lists all websites, APIs, and data sources required to fetch the complete 96 parameters used by the Veritas Score™ system across all 8 product categories.

---

## 1. Product Information & Pricing APIs

### Amazon Product Advertising API (PA-API 5.0) ⭐ PRIMARY
**URL**: https://webservices.amazon.com/paapi5/documentation/
**What it provides**:
- Product title, brand, model number
- Current price, list price, discount percentage
- Product images (multiple angles)
- Product dimensions, weight
- Product features and specifications
- Customer ratings and review count
- Availability status
- Prime eligibility
- ASIN (unique identifier)
- Product category

**Parameters covered**: 15-20 parameters
- `name`, `brand`, `price`, `originalPrice`, `description`
- `imageUrl`, `rating`, `reviewCount`, `availability`
- `dimensions`, `weight`, `features`

**Sign up**: https://affiliate-program.amazon.com/

---

### eBay Browse API
**URL**: https://developer.ebay.com/api-docs/buy/browse/overview.html
**What it provides**:
- Product condition (new, used, refurbished)
- Price history and trends
- Seller information
- Listing details
- Shipping information
- Return policy

**Parameters covered**: 8-10 parameters
- `condition`, `sellerRating`, `shippingCost`
- `returnPeriodDays`, `priceHistory`

**Sign up**: https://developer.ebay.com/

---

### Walmart Open API
**URL**: https://developer.walmart.com/api/us/mp/items
**What it provides**:
- Product details and specifications
- Pricing information
- Stock availability
- Customer reviews

**Parameters covered**: 5-8 parameters
- `stockQuantity`, `reviews`, `specifications`

**Sign up**: https://developer.walmart.com/

---

### Target RedCircle API
**URL**: https://api.target.com/
**What it provides**:
- Product information
- Pricing and promotions
- Availability

**Parameters covered**: 3-5 parameters
- `promotions`, `stockLevel`, `storeAvailability`

**Sign up**: https://developer.target.com/

---

## 2. Product Specifications & Technical Data

### Open Product Data (Product Database)
**URL**: https://world.openfoodfacts.org/data
**What it provides**:
- Product barcodes (UPC, EAN)
- Ingredients (for consumables)
- Nutritional information (for food/beauty)
- Certifications
- Manufacturing information

**Parameters covered**: 5-8 parameters
- `barcode`, `ingredients`, `certifications`, `manufacturingDate`

**API**: Free, open-source
**Docs**: https://world.openfoodfacts.org/data

---

### UPC Database
**URL**: https://www.upcitemdb.com/api/
**What it provides**:
- Product identification by UPC/EAN
- Product descriptions
- Category information
- Brand information

**Parameters covered**: 3-5 parameters
- `upc`, `ean`, `productCategory`

**Sign up**: https://www.upcitemdb.com/

---

## 3. Company & Brand Information

### Alpha Vantage API (Stock Market Data)
**URL**: https://www.alphavantage.co/documentation/
**What it provides**:
- Company stock prices
- Market capitalization
- Financial statements
- Company overview

**Parameters covered**: 8-10 parameters
- `marketCap`, `stockPrice`, `stockTicker`
- `revenue`, `profitMargin`, `peRatio`

**Sign up**: https://www.alphavantage.co/support/#api-key
**Free tier**: 25 requests/day

---

### Clearbit Company API
**URL**: https://clearbit.com/docs#enrichment-api
**What it provides**:
- Company information
- Employee count
- Founded year
- Company description
- Social media profiles
- Company logo

**Parameters covered**: 6-8 parameters
- `companySize`, `foundedYear`, `companyDescription`
- `socialMedia`, `headquarters`

**Sign up**: https://clearbit.com/
**Free tier**: 100 requests/month

---

### Crunchbase API
**URL**: https://data.crunchbase.com/docs
**What it provides**:
- Company funding information
- Investment rounds
- Founders and executives
- Company acquisitions
- Company category

**Parameters covered**: 5-7 parameters
- `fundingTotal`, `investorCount`, `lastFundingRound`
- `foundersInfo`

**Sign up**: https://about.crunchbase.com/

---

## 4. ESG & Sustainability Data

### Sustainalytics API
**URL**: https://www.sustainalytics.com/esg-data
**What it provides**:
- ESG risk scores
- Environmental impact ratings
- Social responsibility scores
- Governance ratings
- Controversy tracking

**Parameters covered**: 10-15 parameters
- `esgScore`, `environmentalRating`, `socialRating`
- `governanceRating`, `carbonFootprint`, `waterUsage`
- `wasteGeneration`, `renewableEnergyUsage`

**Sign up**: https://www.sustainalytics.com/
**Note**: Enterprise API (paid)

---

### CDP (Carbon Disclosure Project) API
**URL**: https://data.cdp.net/
**What it provides**:
- Carbon emissions data
- Climate change response
- Water security
- Forest management

**Parameters covered**: 5-8 parameters
- `carbonEmissions`, `climateScore`, `waterScore`
- `forestScore`, `emissionsReductionTarget`

**Access**: https://www.cdp.net/en/data
**Note**: Open data available for free

---

### Fair Trade Certified API
**URL**: https://www.fairtradecertified.org/
**What it provides**:
- Fair trade certifications
- Labor standards compliance
- Farmer/worker benefits

**Parameters covered**: 3-5 parameters
- `fairTradeCertified`, `laborStandards`, `workerBenefits`

**Access**: https://www.fairtradecertified.org/

---

### B Corp API
**URL**: https://www.bcorporation.net/en-us/find-a-b-corp/
**What it provides**:
- B Corp certification status
- Impact assessment scores
- Social and environmental performance

**Parameters covered**: 3-5 parameters
- `bCorpCertified`, `impactScore`, `bCorpCategory`

**Access**: Public directory at https://www.bcorporation.net/

---

## 5. Supply Chain & Manufacturing Data

### Open Supply Hub API
**URL**: https://opensupplyhub.org/api/docs/
**What it provides**:
- Factory locations
- Supplier information
- Manufacturing facilities
- Labor conditions

**Parameters covered**: 5-8 parameters
- `manufacturingCountry`, `factoryLocations`, `supplierCount`
- `laborConditions`, `factoryAudits`

**Sign up**: https://opensupplyhub.org/
**Free**: Open-source data

---

### Import Genius / Panjiva (US Import Data)
**URL**: https://www.importgenius.com/
**What it provides**:
- Import/export records
- Shipping data
- Supplier information
- Trade relationships

**Parameters covered**: 4-6 parameters
- `importVolume`, `exportVolume`, `tradePartners`
- `shippingFrequency`

**Sign up**: https://www.importgenius.com/
**Note**: Paid service

---

## 6. Product Reviews & Ratings

### ReviewMeta API
**URL**: https://reviewmeta.com/
**What it provides**:
- Verified review analysis
- Fake review detection
- Adjusted ratings
- Review authenticity scores

**Parameters covered**: 4-6 parameters
- `reviewAuthenticity`, `verifiedPurchaseRatio`
- `adjustedRating`, `fakeReviewPercentage`

**Access**: Web scraping or manual check
**Note**: No official API

---

### Fakespot API
**URL**: https://www.fakespot.com/
**What it provides**:
- Review reliability grades
- Seller reliability
- Product authenticity assessment

**Parameters covered**: 3-5 parameters
- `fakespotGrade`, `sellerReliability`, `reviewQuality`

**Access**: Browser extension or web scraping
**Note**: No official API

---

### Trustpilot API
**URL**: https://developers.trustpilot.com/
**What it provides**:
- Business reviews
- Company ratings
- Review volume
- Review trends

**Parameters covered**: 4-6 parameters
- `trustpilotScore`, `businessReviewCount`
- `trustpilotStars`

**Sign up**: https://developers.trustpilot.com/

---

## 7. Price Tracking & Market Data

### CamelCamelCamel API
**URL**: https://camelcamelcamel.com/
**What it provides**:
- Amazon price history
- Price drop alerts
- Historical pricing data
- Price trends

**Parameters covered**: 5-7 parameters
- `priceHistory`, `lowestPrice`, `averagePrice`
- `priceVolatility`, `lastPriceChange`

**Access**: Web scraping or Keepa API
**Note**: No official API

---

### Keepa API (Amazon Price Tracker)
**URL**: https://keepa.com/#!api
**What it provides**:
- Amazon price history
- Sales rank history
- Buy box statistics
- Stock tracking
- Review analysis

**Parameters covered**: 8-10 parameters
- `priceHistory`, `salesRank`, `salesRankHistory`
- `buyBoxPrice`, `stockAvailability`, `priceDrops`

**Sign up**: https://keepa.com/#!api
**Pricing**: Paid API (60 tokens free, then $0.001 per token)

---

### Google Shopping API
**URL**: https://developers.google.com/shopping-content/v2
**What it provides**:
- Product listings across retailers
- Price comparisons
- Availability across stores
- Merchant information

**Parameters covered**: 5-7 parameters
- `competitorPrices`, `priceRange`, `merchantCount`
- `availabilityAcrossRetailers`

**Sign up**: https://developers.google.com/shopping-content/

---

## 8. Warranty & Return Data

### SquareTrade API
**URL**: https://www.squaretrade.com/
**What it provides**:
- Extended warranty options
- Product reliability data
- Failure rates

**Parameters covered**: 3-5 parameters
- `warrantyAvailable`, `extendedWarrantyPrice`
- `reliabilityScore`

**Access**: Manual lookup or partnerships
**Note**: No public API

---

### Consumer Reports API
**URL**: https://www.consumerreports.org/
**What it provides**:
- Product testing results
- Reliability ratings
- Safety ratings
- Value ratings

**Parameters covered**: 5-8 parameters
- `consumerReportsRating`, `reliabilityRating`
- `safetyRating`, `valueRating`, `testScore`

**Access**: Paid subscription required
**Note**: No public API (web scraping)

---

## 9. Shipping & Logistics Data

### ShipStation API
**URL**: https://www.shipstation.com/docs/api/
**What it provides**:
- Shipping rates
- Delivery times
- Carrier information
- Tracking data

**Parameters covered**: 4-6 parameters
- `shippingCost`, `estimatedDeliveryDays`
- `shippingCarriers`, `trackingAvailable`

**Sign up**: https://www.shipstation.com/

---

### EasyPost API
**URL**: https://www.easypost.com/docs/api
**What it provides**:
- Shipping rates from multiple carriers
- Delivery time estimates
- Address verification

**Parameters covered**: 3-5 parameters
- `shippingOptions`, `deliverySpeed`, `shippingReliability`

**Sign up**: https://www.easypost.com/
**Free tier**: Available

---

## 10. Category-Specific Data Sources

### Electronics

#### EPEAT (Electronic Product Environmental Assessment Tool)
**URL**: https://epeat.net/
**What it provides**:
- Electronics sustainability ratings
- Energy efficiency data
- Material composition
- End-of-life management

**Parameters covered**: 5-7 parameters
- `epeatRating`, `energyEfficiency`, `recyclingProgram`
- `hazardousMaterials`, `productLifespan`

**Access**: Public registry at https://epeat.net/

---

#### ENERGY STAR API
**URL**: https://www.energystar.gov/productfinder/api
**What it provides**:
- Energy efficiency ratings
- Annual energy cost
- Energy consumption data

**Parameters covered**: 4-6 parameters
- `energyStarCertified`, `annualEnergyCost`
- `energyConsumption`, `efficiencyRating`

**Sign up**: https://www.energystar.gov/

---

### Clothing & Textiles

#### OEKO-TEX API
**URL**: https://www.oeko-tex.com/en/
**What it provides**:
- Textile safety certifications
- Harmful substance testing
- Production safety

**Parameters covered**: 3-5 parameters
- `oekoTexCertified`, `textileSafety`, `harmfulSubstances`

**Access**: https://www.oeko-tex.com/

---

#### Global Organic Textile Standard (GOTS)
**URL**: https://www.global-standard.org/
**What it provides**:
- Organic textile certification
- Environmental criteria
- Social criteria

**Parameters covered**: 3-4 parameters
- `gotsCertified`, `organicContent`, `socialCompliance`

**Access**: Public database at https://www.global-standard.org/

---

#### Fair Wear Foundation API
**URL**: https://www.fairwear.org/
**What it provides**:
- Labor conditions in garment industry
- Brand performance ratings
- Factory audits

**Parameters covered**: 4-6 parameters
- `fairWearMember`, `laborScore`, `factoryConditions`
- `workerRights`

**Access**: https://www.fairwear.org/

---

### Beauty & Cosmetics

#### EWG Skin Deep Database
**URL**: https://www.ewg.org/skindeep/
**What it provides**:
- Cosmetic safety ratings
- Ingredient hazard scores
- Health concerns

**Parameters covered**: 5-7 parameters
- `ewgScore`, `ingredientSafety`, `healthConcerns`
- `allergenWarnings`, `cancerRisk`

**Access**: Public database at https://www.ewg.org/skindeep/
**API**: Web scraping required

---

#### Think Dirty API
**URL**: https://www.thinkdirtyapp.com/
**What it provides**:
- Ingredient analysis
- Product safety ratings
- Clean beauty scores

**Parameters covered**: 3-5 parameters
- `thinkDirtyScore`, `cleanBeautyRating`, `toxicityLevel`

**Access**: Mobile app and website
**Note**: No public API

---

#### Leaping Bunny Certification
**URL**: https://www.leapingbunny.org/
**What it provides**:
- Cruelty-free certification
- Animal testing status

**Parameters covered**: 2-3 parameters
- `crueltyFree`, `leapingBunnyCertified`, `veganStatus`

**Access**: Public directory at https://www.leapingbunny.org/

---

### Food & Home

#### USDA Organic Database
**URL**: https://www.usda.gov/topics/organic
**What it provides**:
- Organic certification status
- Certification details

**Parameters covered**: 2-3 parameters
- `usdaOrganic`, `organicPercentage`

**Access**: https://organic.ams.usda.gov/integrity/

---

#### Non-GMO Project
**URL**: https://www.nongmoproject.org/
**What it provides**:
- Non-GMO verification
- Product listings

**Parameters covered**: 1-2 parameters
- `nonGmoVerified`, `gmoFree`

**Access**: Public database at https://www.nongmoproject.org/

---

## 11. Quality & Testing Data

### UL (Underwriters Laboratories) Certification
**URL**: https://www.ul.com/
**What it provides**:
- Safety certifications
- Product testing results
- Quality standards compliance

**Parameters covered**: 3-5 parameters
- `ulCertified`, `safetyTested`, `qualityStandards`

**Access**: https://www.ul.com/

---

### ISO Certification Database
**URL**: https://www.iso.org/
**What it provides**:
- ISO standard certifications
- Quality management compliance
- Environmental management

**Parameters covered**: 4-6 parameters
- `iso9001Certified`, `iso14001Certified`
- `qualityManagement`, `environmentalManagement`

**Access**: https://www.iso.org/

---

## 12. Intellectual Property & Authenticity

### USPTO Trademark Database
**URL**: https://tsdr.uspto.gov/
**What it provides**:
- Trademark registration status
- Brand ownership
- Trademark details

**Parameters covered**: 3-4 parameters
- `trademarkRegistered`, `brandOwner`, `trademarkStatus`

**Access**: Free public database
**API**: https://developer.uspto.gov/

---

### Entrupy API (Luxury Authentication)
**URL**: https://www.entrupy.com/
**What it provides**:
- Luxury product authentication
- Counterfeit detection
- Authenticity certificates

**Parameters covered**: 2-4 parameters
- `authenticityVerified`, `entrupyCertified`, `counterfeitRisk`

**Access**: https://www.entrupy.com/
**Note**: Requires hardware device

---

## 13. Market Demand & Popularity

### Google Trends API
**URL**: https://trends.google.com/
**What it provides**:
- Search interest over time
- Regional interest
- Related queries
- Trending status

**Parameters covered**: 4-6 parameters
- `searchTrend`, `popularityScore`, `trendingStatus`
- `regionalDemand`

**Access**: https://pypi.org/project/pytrends/ (unofficial API)
**Free**: Yes

---

### Social Media APIs

#### Twitter API
**URL**: https://developer.twitter.com/en/docs/twitter-api
**What it provides**:
- Product mentions
- Brand sentiment
- Influencer endorsements

**Parameters covered**: 3-5 parameters
- `socialMentions`, `brandSentiment`, `influencerScore`

**Sign up**: https://developer.twitter.com/

---

#### Reddit API
**URL**: https://www.reddit.com/dev/api/
**What it provides**:
- Product discussions
- Community sentiment
- User recommendations

**Parameters covered**: 2-4 parameters
- `redditMentions`, `communitySentiment`, `userRecommendations`

**Sign up**: https://www.reddit.com/prefs/apps

---

## 14. Compliance & Recalls

### CPSC (Consumer Product Safety Commission) API
**URL**: https://www.cpsc.gov/Recalls
**What it provides**:
- Product recalls
- Safety violations
- Hazard information

**Parameters covered**: 3-5 parameters
- `recallStatus`, `safetyViolations`, `hazardLevel`

**Access**: https://www.cpsc.gov/
**API**: https://www.saferproducts.gov/RestWebServices/

---

### FDA Recalls API (Food/Beauty/Medical)
**URL**: https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts
**What it provides**:
- FDA recalls
- Safety alerts
- Product warnings

**Parameters covered**: 2-4 parameters
- `fdaRecall`, `safetyAlert`, `warningLevel`

**Access**: https://open.fda.gov/apis/
**Free**: Yes

---

## 15. Payment & Financing Data

### Affirm API
**URL**: https://docs.affirm.com/
**What it provides**:
- Financing options
- Monthly payment calculations
- Credit availability

**Parameters covered**: 2-3 parameters
- `financingAvailable`, `monthlyPayment`, `financingTerms`

**Sign up**: https://www.affirm.com/business

---

### Klarna API
**URL**: https://docs.klarna.com/
**What it provides**:
- Buy now, pay later options
- Payment plans
- Credit checks

**Parameters covered**: 2-3 parameters
- `klarnaAvailable`, `paymentPlans`, `installmentOptions`

**Sign up**: https://www.klarna.com/us/business/

---

## Summary: Parameter Coverage by Source

### High Priority (Most Parameters)

| Source | Parameters | Coverage | Priority |
|--------|-----------|----------|----------|
| **Amazon PA-API** | 15-20 | Product data, pricing, reviews | ⭐⭐⭐⭐⭐ |
| **Sustainalytics** | 10-15 | ESG scores, sustainability | ⭐⭐⭐⭐⭐ |
| **Alpha Vantage** | 8-10 | Company financials | ⭐⭐⭐⭐ |
| **Keepa API** | 8-10 | Price history, market data | ⭐⭐⭐⭐ |
| **eBay API** | 8-10 | Product condition, sellers | ⭐⭐⭐⭐ |
| **CDP API** | 5-8 | Carbon emissions, climate | ⭐⭐⭐⭐ |
| **Open Supply Hub** | 5-8 | Supply chain, manufacturing | ⭐⭐⭐⭐ |

### Medium Priority (5-10 Parameters)

- Clearbit (company info)
- ReviewMeta (review quality)
- Google Shopping (price comparison)
- EWG Skin Deep (beauty safety)
- Consumer Reports (testing data)
- EPEAT (electronics sustainability)

### Lower Priority (1-5 Parameters)

- Individual certifications (B Corp, Fair Trade, etc.)
- Recall databases (CPSC, FDA)
- Social media APIs (Twitter, Reddit)
- Payment APIs (Affirm, Klarna)

---

## Implementation Priority

### Phase 1: Core Product Data (Week 1)
1. **Amazon PA-API** - Product info, pricing, reviews
2. **eBay API** - Condition, seller data
3. **Walmart API** - Availability, specifications
4. **Keepa API** - Price history

**Result**: 40-50 parameters covered

### Phase 2: Company & ESG Data (Week 2-3)
1. **Alpha Vantage** - Company financials
2. **Sustainalytics** - ESG scores (if budget allows)
3. **CDP** - Environmental data
4. **Clearbit** - Company information

**Result**: 60-70 parameters covered

### Phase 3: Quality & Authenticity (Week 4)
1. **ReviewMeta/Fakespot** - Review authenticity
2. **Consumer Reports** - Testing data
3. **CPSC/FDA** - Recall data
4. **UL/ISO** - Certifications

**Result**: 75-85 parameters covered

### Phase 4: Category-Specific (Week 5-6)
1. **EPEAT** - Electronics
2. **EWG Skin Deep** - Beauty
3. **GOTS/OEKO-TEX** - Textiles
4. **Fair Wear** - Clothing labor

**Result**: 90-96 parameters covered

---

## API Cost Estimates

### Free Tier APIs
- Amazon PA-API: Free (8,640 requests/day)
- eBay: Free
- Walmart: Free
- Google Trends: Free (unofficial)
- CDP: Free (open data)
- USPTO: Free
- FDA/CPSC: Free
- Open Supply Hub: Free

### Paid APIs (Budget Required)
- **Keepa**: $0.001 per token (~$100/month for 100k requests)
- **Alpha Vantage**: $49.99/month (premium)
- **Clearbit**: $99/month (starter)
- **Sustainalytics**: Enterprise pricing (contact sales)
- **Consumer Reports**: Subscription required
- **Crunchbase**: $29/month (starter)

**Estimated Monthly Cost for Full Coverage**: $300-500/month

---

## Next Steps

1. **Start with free APIs** (Amazon, eBay, Walmart, CDP)
2. **Implement core parameter collection** (40-50 parameters)
3. **Add paid APIs gradually** based on budget
4. **Implement caching** to reduce API costs
5. **Schedule data refreshes** (daily, weekly, monthly depending on parameter)
6. **Build fallback systems** for when APIs are unavailable

---

## Data Collection Script Structure

```typescript
async function collectAllVeritasParameters(productId: string) {
  // Phase 1: Core Product Data (Free APIs)
  const amazonData = await fetchAmazonData(productId)
  const ebayData = await fetchEBayData(productId)
  const walmartData = await fetchWalmartData(productId)

  // Phase 2: Company & ESG Data
  const companyData = await fetchCompanyData(amazonData.brand)
  const esgData = await fetchESGData(amazonData.brand)

  // Phase 3: Quality & Authenticity
  const reviewData = await fetchReviewAuthenticity(productId)
  const recallData = await fetchRecallData(productId)

  // Phase 4: Category-Specific
  const categoryData = await fetchCategorySpecificData(productId, category)

  // Combine all parameters
  return {
    ...amazonData,
    ...ebayData,
    ...walmartData,
    ...companyData,
    ...esgData,
    ...reviewData,
    ...recallData,
    ...categoryData
  }
}
```

---

## Conclusion

This comprehensive list provides all necessary data sources to fetch the complete 96 parameters for Veritas Score™. Start with free APIs, implement core functionality, then gradually add paid services as budget allows.

**Total Data Sources**: 40+ APIs and databases
**Total Parameters**: 96 across all categories
**Estimated Setup Time**: 6-8 weeks for full implementation
**Estimated Cost**: $0-500/month depending on API usage
