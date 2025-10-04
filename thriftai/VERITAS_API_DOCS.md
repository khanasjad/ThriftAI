# Veritas Score™ API Documentation

Complete API reference for the Universal Product Quality Assessment System.

---

## 🚀 Quick Links

### Interactive Documentation
**Swagger UI (Recommended):**
```
http://localhost:3001/api-docs
```

**OpenAPI Spec (JSON):**
```
http://localhost:3001/api/docs/swagger
```

### Live Examples
- **Production UI:** http://localhost:3001/prod/veritas
- **Test Interface:** http://localhost:3001/test/veritas

---

## 📚 API Endpoints

### 1. List Products with Veritas Scores

**Endpoint:** `GET /api/products/veritas`

**Description:** Fetch paginated list of products with their Veritas Scores, company profiles, and seller profiles.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Maximum number of products (1-100) |
| `offset` | integer | No | 0 | Pagination offset |
| `category` | string | No | - | Filter by category (ELECTRONICS, PHONES, LAPTOPS, etc.) |
| `minScore` | number | No | - | Minimum Veritas Score (0-100) |

**Example Request:**
```bash
curl "http://localhost:3001/api/products/veritas?limit=10&category=PHONES&minScore=80"
```

**Example Response:**
```json
{
  "products": [
    {
      "id": "cmgbavx8n0000rm3iapspwsth",
      "name": "iPhone 15 Pro Max 256GB",
      "category": "PHONES",
      "brand": "Apple",
      "price": 899.99,
      "originalPrice": 1199.99,
      "condition": "Certified Refurbished",
      "imageUrl": "https://example.com/iphone15.jpg",
      "veritasScore": {
        "ssn": "ELEC-87.2-HC",
        "overallScore": 87.2,
        "confidence": 0.89,
        "dataQualityScore": 85.5,
        "calculatedAt": "2025-10-03T21:30:00Z",
        "categories": [
          {
            "name": "PRODUCT_QUALITY",
            "score": 92.5,
            "weight": 0.25,
            "weightedScore": 23.125
          }
        ]
      },
      "companyProfile": {
        "brandName": "Apple",
        "brandReputation": 95.0,
        "stockSymbol": "AAPL"
      },
      "sellerProfile": {
        "seller": "top_seller_123",
        "rating": 4.8,
        "isTopRated": true
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Calculate Veritas Score

**Endpoint:** `GET /api/test/veritas-score`

**Description:** Calculate comprehensive Veritas Score for a specific product with detailed 121-parameter breakdown.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string | **Yes** | Unique product identifier |

**Example Request:**
```bash
curl "http://localhost:3001/api/test/veritas-score?productId=cmgbavx8n0000rm3iapspwsth"
```

**Example Response:**
```json
{
  "ssn": "ELEC-87.2-HC",
  "overallScore": 87.2,
  "confidence": 0.89,
  "dataQualityScore": 85.5,
  "calculatedAt": "2025-10-03T21:30:00Z",
  "categories": [
    {
      "category": "PRODUCT_QUALITY",
      "score": 92.5,
      "weight": 0.25,
      "weightedScore": 23.125,
      "confidence": 0.91,
      "parameters": [
        {
          "name": "Battery Health",
          "code": "PQ_BATTERY_HEALTH",
          "rawValue": "95%",
          "normalizedScore": 95.0,
          "weightedScore": 9.5,
          "dataSource": "apple_warranty",
          "confidence": 0.95,
          "isMissing": false,
          "isRealData": true
        }
      ]
    },
    {
      "category": "COMPANY_PERFORMANCE",
      "score": 86.4,
      "weight": 0.05,
      "weightedScore": 4.32,
      "confidence": 0.85,
      "parameters": [
        {
          "name": "Stock Performance",
          "code": "CP_STOCK_PERF",
          "rawValue": "AAPL: $175.00 (+2.5%)",
          "normalizedScore": 85.0,
          "weightedScore": 21.25,
          "dataSource": "alpha_vantage",
          "confidence": 0.95,
          "isMissing": false,
          "isRealData": true
        }
      ]
    }
  ],
  "missingDataFields": [
    "Serial Number",
    "Warranty Expiration"
  ],
  "freeDataSummary": {
    "totalParameters": 121,
    "parametersUsingFreeAPIs": 45,
    "freeAPIsUsed": [
      "gsmarena",
      "apple_warranty",
      "alpha_vantage",
      "ebay"
    ]
  }
}
```

---

## 🎯 Score Breakdown

### Overall Score (0-100)

| Range | Grade | Label | Description |
|-------|-------|-------|-------------|
| 95-100 | S | Exceptional | Certified refurbished often achieves this |
| 85-94 | A | Excellent | High-quality products with verified data |
| 75-84 | B | Good | Solid products with minor compromises |
| 65-74 | C | Fair | Acceptable quality, some concerns |
| 50-64 | D | Below Average | Significant quality issues |
| 0-49 | F | Poor | Not recommended |

### 8 Score Categories

1. **Product Quality (25%)** - Physical condition, authenticity, specifications
2. **Seller Trust (20%)** - Seller reputation, ratings, transaction history
3. **Market Value (15%)** - Price fairness, market positioning
4. **Sustainability (12%)** - Environmental impact, circular economy
5. **Security & Safety (5%)** - Payment security, buyer protection
6. **User Experience (5%)** - Listing quality, purchase experience
7. **Product Specification (13%)** - Category-specific technical specs
8. **Company Performance (5%)** - Brand reputation, stock performance

---

## 🆓 FREE Data Sources

All APIs leverage **FREE external data sources**:

| Source | Purpose | API Type | Cache Duration |
|--------|---------|----------|----------------|
| **Alpha Vantage** | Stock market data | REST API | 1 hour |
| **eBay Finding API** | Seller ratings, pricing | REST API | 7 days |
| **GSMArena** | Phone specifications | Web scraping | 90 days |
| **Apple Warranty** | Warranty verification | REST API | 30 days |
| **Dell Warranty** | Warranty status | REST API | 30 days |
| **iFixit** | Repairability scores | REST API | 90 days |
| **Energy Star** | Energy certifications | REST API | 90 days |

---

## 🏗️ Relational Data Architecture

### Performance Benefits

**Before (Flat Structure):**
- 10,000 Apple iPhones = 10,000 stock API calls
- Total time: 8+ hours
- Efficiency: Poor

**After (Relational):**
- 10,000 Apple iPhones = 1 stock API call (shared)
- Total time: ~5 minutes
- **Efficiency gain: 99.4%**

### 8-Table Design

1. **VeritasCompanyProfile** - Shared brand data
   - 1 company → Many products
   - Cache: 30 days (brand), 1 hour (stock)

2. **VeritasProductSpec** - Model specifications
   - 1 spec → Many units
   - Cache: 90 days

3. **VeritasSellerProfile** - Seller trust metrics
   - 1 seller → Many listings
   - Cache: 7 days

4. **VeritasSecurityPolicy** - Platform security
   - 1 platform → Many products
   - Cache: 90 days

5. **VeritasProductQuality** - Product condition
   - 1:1 with Product
   - Cache: 1 day

6. **VeritasMarketData** - Time-series pricing
   - 1 product → Many snapshots
   - Cache: 1 hour

7. **VeritasSustainability** - Environmental metrics
   - 1:1 with Product
   - Cache: 30 days

8. **VeritasUserExperience** - Listing quality
   - 1:1 with Product
   - Cache: 7 days

---

## 🔧 Usage Examples

### JavaScript/TypeScript

```typescript
// Fetch products with high scores
const response = await fetch(
  'http://localhost:3001/api/products/veritas?minScore=85&category=PHONES&limit=20'
)
const data = await response.json()

console.log(`Found ${data.products.length} products`)
data.products.forEach(product => {
  console.log(`${product.name}: ${product.veritasScore.overallScore}/100`)
})
```

### Python

```python
import requests

# Calculate score for specific product
response = requests.get(
    'http://localhost:3001/api/test/veritas-score',
    params={'productId': 'cmgbavx8n0000rm3iapspwsth'}
)

score_data = response.json()
print(f"Overall Score: {score_data['overallScore']}")
print(f"Confidence: {score_data['confidence'] * 100}%")
print(f"FREE APIs Used: {', '.join(score_data['freeDataSummary']['freeAPIsUsed'])}")
```

### cURL

```bash
# Get top-rated electronics
curl -X GET \
  "http://localhost:3001/api/products/veritas?category=ELECTRONICS&minScore=90&limit=10" \
  -H "Accept: application/json" | jq

# Calculate score with detailed breakdown
curl -X GET \
  "http://localhost:3001/api/test/veritas-score?productId=YOUR_PRODUCT_ID" \
  -H "Accept: application/json" | jq '.categories[] | {name: .category, score: .score}'
```

---

## 📊 Response Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (missing required parameters) |
| 404 | Product Not Found |
| 500 | Internal Server Error |

---

## 🔐 Authentication

Currently, **no authentication is required** for API access.

In production, add API key authentication:

```bash
curl -H "X-API-Key: your_api_key_here" \
  "https://api.thriftai.com/api/products/veritas"
```

---

## 🚀 Testing in Swagger UI

1. **Open Swagger UI:**
   ```
   http://localhost:3001/api-docs
   ```

2. **Select an endpoint** (e.g., "List products with Veritas Scores")

3. **Click "Try it out"**

4. **Enter parameters:**
   - limit: 10
   - category: PHONES
   - minScore: 80

5. **Click "Execute"**

6. **View response** with syntax highlighting and schema validation

---

## 📝 Notes

- All responses are in JSON format
- Timestamps are in ISO 8601 format (UTC)
- Scores are calculated on-demand if not cached
- Cached scores are refreshed based on cache TTL
- FREE API rate limits are respected
- Console logs show when cached data is used

---

## 🔮 Future Enhancements

- [ ] Authentication with API keys
- [ ] Rate limiting
- [ ] Webhooks for score updates
- [ ] Batch score calculations
- [ ] GraphQL endpoint
- [ ] WebSocket real-time updates
- [ ] Export to PDF/CSV
- [ ] Historical score tracking

---

## 📞 Support

For API support and questions:
- Documentation: http://localhost:3001/api-docs
- GitHub Issues: https://github.com/thriftai/issues
- Email: support@thriftai.com
