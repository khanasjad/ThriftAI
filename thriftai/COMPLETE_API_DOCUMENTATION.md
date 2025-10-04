# ThriftAI Platform - Complete API Documentation

## 🚀 Quick Start

**Interactive Swagger UI:**
```
http://localhost:3001/api-docs
```

**OpenAPI Spec (JSON):**
```
http://localhost:3001/api/docs/swagger
```

---

## 📊 API Overview

ThriftAI provides **40+ REST API endpoints** across 13 major categories:

- ✅ **Products** (7 endpoints) - Product catalog and management
- ✅ **Veritas Score™** (5 endpoints) - Universal quality assessment
- ✅ **Search** (6 endpoints) - AI-powered product discovery
- ✅ **Cart & Checkout** (4 endpoints) - Shopping cart and payments
- ✅ **Orders** (2 endpoints) - Order management
- ✅ **Buyers** (4 endpoints) - User registration and profiles
- ✅ **Swipe** (3 endpoints) - Tinder-style discovery
- ✅ **Chat** (3 endpoints) - AI shopping assistant
- ✅ **Reviews** (2 endpoints) - Product ratings
- ✅ **Admin** (5 endpoints) - Administrative operations
- ✅ **Leaderboard** (1 endpoint) - Product rankings
- ✅ **Categories** (1 endpoint) - Product categorization
- ✅ **Visual Search** (1 endpoint) - Image-based search

---

## 📋 Complete API List

### 1. Products APIs

#### `GET /api/products`
List products with filtering and pagination

**Query Parameters:**
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `category` (string) - Filter by category
- `brand` (string) - Filter by brand
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `condition` (string) - Product condition
- `search` (string) - Search query

**Example:**
```bash
curl "http://localhost:3001/api/products?category=PHONES&minPrice=500&limit=20"
```

---

#### `GET /api/products/{id}`
Get product details by ID

**Path Parameters:**
- `id` (string) - Product ID

**Example:**
```bash
curl "http://localhost:3001/api/products/cmgbavx8n0000rm3iapspwsth"
```

---

#### `GET /api/products/veritas`
List products with Veritas Scores

**Query Parameters:**
- `limit` (integer, 1-100) - Items per page
- `offset` (integer) - Pagination offset
- `category` (string) - ELECTRONICS, PHONES, LAPTOPS, ACCESSORIES
- `minScore` (number, 0-100) - Minimum Veritas Score

**Example:**
```bash
curl "http://localhost:3001/api/products/veritas?minScore=85&category=PHONES"
```

---

#### `POST /api/products/enrich`
Enrich product with external data

**Request Body:**
```json
{
  "productId": "cmgbavx8n0000rm3iapspwsth"
}
```

---

#### `GET /api/filters`
Get available filter options for products

---

#### `POST /api/marketplace/compare`
Compare multiple products side-by-side

**Request Body:**
```json
{
  "productIds": ["id1", "id2", "id3"]
}
```

---

#### `GET /api/categories`
Get list of all product categories

---

### 2. Veritas Score™ APIs

#### `GET /api/test/veritas-score`
Calculate comprehensive Veritas Score (121 parameters)

**Query Parameters:**
- `productId` (string, **required**) - Product ID

**Example:**
```bash
curl "http://localhost:3001/api/test/veritas-score?productId=cmgbavx8n0000rm3iapspwsth"
```

**Response:**
```json
{
  "ssn": "ELEC-87.2-HC",
  "overallScore": 87.2,
  "confidence": 0.89,
  "dataQualityScore": 85.5,
  "categories": [...],
  "freeDataSummary": {
    "totalParameters": 121,
    "parametersUsingFreeAPIs": 45,
    "freeAPIsUsed": ["gsmarena", "apple_warranty", "alpha_vantage", "ebay"]
  }
}
```

---

#### `GET /api/veritas/{productId}`
Get stored Veritas Score from database

---

#### `POST /api/veritas/calculate`
Calculate and save Veritas Score

**Request Body:**
```json
{
  "productId": "cmgbavx8n0000rm3iapspwsth"
}
```

---

#### `POST /api/veritas/compare`
Compare Veritas Scores between products

**Request Body:**
```json
{
  "productIds": ["id1", "id2", "id3"]
}
```

---

### 3. Search APIs

#### `GET /api/buyers/search`
Standard product search with filters

**Query Parameters:**
- `q` (string, **required**) - Search query
- `category` (string) - Filter by category
- `minPrice`, `maxPrice` (number) - Price range
- `condition` (string) - Product condition

**Example:**
```bash
curl "http://localhost:3001/api/buyers/search?q=iPhone&minPrice=500&maxPrice=1000"
```

---

#### `POST /api/buyers/claude-search`
AI-enhanced semantic search with Claude

**Request Body:**
```json
{
  "query": "Find vintage designer bags under $200",
  "filters": {
    "category": "ACCESSORIES",
    "condition": "excellent"
  }
}
```

---

#### `POST /api/buyers/enhanced-search`
ML-enhanced search with relevance ranking

**Request Body:**
```json
{
  "query": "laptop for programming",
  "filters": {}
}
```

---

#### `POST /api/buyers/chat-search`
Conversational search with context

**Request Body:**
```json
{
  "message": "Show me more options like the last one",
  "conversationHistory": []
}
```

---

#### `POST /api/smart-search`
Smart search with AI ranking

**Request Body:**
```json
{
  "query": "best value gaming laptop"
}
```

---

#### `GET /api/enhanced-search`
Enhanced product search

**Query Parameters:**
- `q` (string, **required**) - Search query

---

### 4. Cart & Checkout APIs

#### `GET /api/cart`
Get shopping cart contents

**Query Parameters:**
- `sessionId` (string) - Session identifier

---

#### `POST /api/cart`
Add item to cart

**Request Body:**
```json
{
  "productId": "cmgbavx8n0000rm3iapspwsth",
  "quantity": 1,
  "sessionId": "session_123"
}
```

---

#### `DELETE /api/cart`
Remove item from cart

**Request Body:**
```json
{
  "productId": "cmgbavx8n0000rm3iapspwsth",
  "sessionId": "session_123"
}
```

---

#### `POST /api/cart/migrate`
Migrate guest cart to user account

**Request Body:**
```json
{
  "sessionId": "guest_session_123",
  "userId": "user_456"
}
```

---

#### `POST /api/checkout`
Create checkout session

**Request Body:**
```json
{
  "cartId": "cart_123",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "paymentMethod": "stripe"
}
```

---

#### `POST /api/checkout/create-order`
Create order from checkout session

---

### 5. Orders APIs

#### `GET /api/orders/{orderId}`
Get order details

**Path Parameters:**
- `orderId` (string) - Order ID

---

### 6. Buyers APIs

#### `POST /api/buyers/register`
Register new buyer account

**Request Body:**
```json
{
  "email": "buyer@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

---

#### `GET /api/buyers/filters`
Get buyer-specific filter options

---

#### `POST /api/buyers/ai-shopping-advisor`
Get personalized shopping advice from AI

**Request Body:**
```json
{
  "question": "What's the best iPhone for photography?",
  "context": {
    "budget": 1000,
    "preferences": ["camera quality", "battery life"]
  }
}
```

---

### 7. Swipe APIs

#### `POST /api/swipe/initialize`
Initialize Tinder-style product discovery session

**Request Body:**
```json
{
  "category": "PHONES",
  "preferences": {
    "priceRange": [500, 1000],
    "condition": "excellent"
  }
}
```

---

#### `POST /api/swipe/action`
Record swipe action (like/dislike/superlike)

**Request Body:**
```json
{
  "productId": "cmgbavx8n0000rm3iapspwsth",
  "action": "like",
  "sessionId": "swipe_session_123"
}
```

**Action Values:**
- `like` - User likes the product
- `dislike` - User dislikes the product
- `superlike` - User really likes the product

---

#### `GET /api/swipe/summary/{productId}`
Get swipe statistics for a product

---

### 8. Chat APIs

#### `POST /api/chat`
Chat with AI shopping assistant

**Request Body:**
```json
{
  "message": "I need a laptop for video editing",
  "history": []
}
```

---

### 9. Visual Search APIs

#### `POST /api/visual-search`
Search products by image upload

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file) - Image file to search

**Example (cURL):**
```bash
curl -X POST "http://localhost:3001/api/visual-search" \
  -F "image=@/path/to/image.jpg"
```

---

### 10. Reviews APIs

#### `GET /api/products/{id}/reviews`
Get reviews for a product

---

#### `POST /api/products/{id}/reviews`
Create product review

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent product, highly recommended!",
  "userId": "user_123"
}
```

---

### 11. Leaderboard APIs

#### `GET /api/leaderboard`
Get product rankings

**Query Parameters:**
- `metric` (string) - score, popularity, trending, value
- `category` (string) - Filter by category
- `limit` (integer) - Number of results

**Example:**
```bash
curl "http://localhost:3001/api/leaderboard?metric=score&category=PHONES&limit=10"
```

---

### 12. Admin APIs

#### `GET /api/admin/products`
Get all products with admin details

**Authentication:** Required (admin only)

---

#### `POST /api/admin/rescore-products`
Trigger batch recalculation of Veritas Scores

**Authentication:** Required (admin only)

---

#### `POST /api/admin/clear-cache`
Clear cached external API data

---

#### `GET /api/config/score-thresholds`
Get Veritas Score threshold configuration

---

#### `PUT /api/config/score-thresholds`
Update score thresholds

**Request Body:**
```json
{
  "excellent": 90,
  "good": 75,
  "fair": 60
}
```

---

### 13. Security APIs

#### `GET /api/csrf-token`
Get CSRF token for secure requests

---

## 🔧 Common Request Examples

### Search for Products

```bash
# Basic search
curl "http://localhost:3001/api/buyers/search?q=laptop"

# With filters
curl "http://localhost:3001/api/buyers/search?q=laptop&category=ELECTRONICS&minPrice=500&maxPrice=1500"

# AI-powered search
curl -X POST "http://localhost:3001/api/buyers/claude-search" \
  -H "Content-Type: application/json" \
  -d '{"query": "Find me a good quality used MacBook Pro"}'
```

### Get Veritas Score

```bash
# Calculate new score
curl "http://localhost:3001/api/test/veritas-score?productId=YOUR_PRODUCT_ID"

# Get stored score
curl "http://localhost:3001/api/veritas/YOUR_PRODUCT_ID"
```

### Shopping Cart Operations

```bash
# Get cart
curl "http://localhost:3001/api/cart?sessionId=session_123"

# Add to cart
curl -X POST "http://localhost:3001/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "quantity": 1, "sessionId": "session_123"}'

# Remove from cart
curl -X DELETE "http://localhost:3001/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "sessionId": "session_123"}'
```

### Swipe Discovery

```bash
# Initialize swipe session
curl -X POST "http://localhost:3001/api/swipe/initialize" \
  -H "Content-Type: application/json" \
  -d '{"category": "PHONES", "preferences": {"priceRange": [500, 1000]}}'

# Record swipe action
curl -X POST "http://localhost:3001/api/swipe/action" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "action": "like", "sessionId": "swipe_123"}'
```

---

## 📊 Response Formats

### Success Response (200)
```json
{
  "data": {...},
  "success": true
}
```

### Error Response (400/404/500)
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "stack": "Stack trace (dev only)"
}
```

---

## 🔐 Authentication (Future)

Currently, no authentication is required. Future versions will support:

**API Key Authentication:**
```bash
curl -H "X-API-Key: your_api_key_here" \
  "http://localhost:3001/api/products"
```

**JWT Bearer Token:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/admin/products"
```

---

## 🎯 Rate Limits

Current limits (will be enforced in production):
- **Anonymous:** 100 requests/minute
- **Authenticated:** 1000 requests/minute
- **Admin:** Unlimited

---

## 📝 API Versioning

Current version: **v2.0.0**

All endpoints are under `/api/` base path.

Future versions will use:
- `/api/v2/...` - Current version
- `/api/v3/...` - Next version

---

## 🆓 External API Integrations

ThriftAI uses **FREE APIs** for enhanced data:

| API | Purpose | Rate Limit |
|-----|---------|------------|
| Alpha Vantage | Stock market data | 25 calls/day |
| eBay Finding | Seller ratings, pricing | 5000 calls/day |
| GSMArena | Phone specifications | Scraping (respectful) |
| Apple Warranty | Warranty verification | Unlimited |
| Dell Warranty | Warranty status | Unlimited |
| iFixit | Repairability scores | Unlimited |
| Energy Star | Certifications | Unlimited |

---

## 🚀 Testing in Swagger UI

1. Open: **http://localhost:3001/api-docs**
2. Browse endpoints by tag
3. Click "Try it out" on any endpoint
4. Enter parameters/request body
5. Click "Execute"
6. View response with syntax highlighting

---

## 📞 Support

- **Documentation:** http://localhost:3001/api-docs
- **GitHub:** https://github.com/thriftai/thriftai
- **Email:** support@thriftai.com

---

## 🎉 Quick Links

- **Swagger UI:** http://localhost:3001/api-docs
- **OpenAPI Spec:** http://localhost:3001/api/docs/swagger
- **Production UI:** http://localhost:3001/prod/veritas
- **Test Interface:** http://localhost:3001/test/veritas
