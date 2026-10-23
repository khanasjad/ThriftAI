# ThriftAI API Documentation

**Version**: 1.0.0
**Base URL**: `https://thriftai.com/api/v1` (or `http://localhost:3000/api/v1` for development)
**Last Updated**: October 23, 2026

---

## Overview

ThriftAI provides a comprehensive REST API for clothing quality scoring, natural language search, and conversational product discovery. All APIs use JSON for request and response bodies.

---

## Authentication

Currently in pilot phase with no authentication required. Production deployment will use API keys:

```
Authorization: Bearer YOUR_API_KEY
```

---

## Rate Limits

- **Development**: No limits
- **Production** (planned):
  - 100 requests/minute per IP
  - 1,000 requests/hour per API key

---

## API Endpoints

### 1. Natural Language Search

Convert natural language queries into product search results.

**Endpoint**: `POST /api/v1/search/natural`

**Request Body**:
```json
{
  "query": "Show me sustainable jeans under $100",
  "context": {
    "userPreferences": {
      "favoriteCategories": ["BOTTOMS"],
      "favoriteBrands": ["Everlane", "Patagonia"],
      "budgetRange": { "min": 0, "max": 150 },
      "sustainabilityPreference": "preferred"
    }
  },
  "options": {
    "includeExplanation": true,
    "suggestRefinements": true,
    "limit": 20
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "query": {
    "original": "Show me sustainable jeans under $100",
    "understood": "sustainable jeans affordable eco-friendly",
    "intent": "search",
    "confidence": 0.95
  },
  "filters": {
    "categories": ["BOTTOMS"],
    "priceMax": 100,
    "sustainabilityRequired": true,
    "sortBy": "score_high",
    "limit": 20
  },
  "results": [
    {
      "id": "product-123",
      "name": "Everlane Organic Wide Leg Jeans",
      "category": "BOTTOMS",
      "brand": "Everlane",
      "price": 89.00,
      "aiScore": 85.4,
      "similarity": 0.92,
      "thumbnail": "https://..."
    }
  ],
  "metadata": {
    "totalResults": 12,
    "searchMethod": "hybrid",
    "processingTime": 245
  },
  "suggestions": [
    "Try filtering by specific fit type",
    "Consider widening price range"
  ],
  "clarifications": []
}
```

**Error Responses**:
- `400 Bad Request` - Invalid query or parameters
- `500 Internal Server Error` - Search failed

---

### 2. Start Conversation

Start a new conversational session.

**Endpoint**: `POST /api/v1/conversation`

**Request Body**:
```json
{
  "userId": "user-456",
  "userPreferences": {
    "favoriteCategories": ["BOTTOMS", "DRESSES"],
    "budgetRange": { "min": 50, "max": 200 },
    "sustainabilityPreference": "required"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "conversationId": "conv_1729705200_abc123",
  "message": "Conversation started. How can I help you find the perfect clothing?",
  "suggestions": [
    "Show me sustainable jeans",
    "I need a durable jacket",
    "Find me a dress for a wedding"
  ]
}
```

---

### 3. Send Message to Conversation

Send a message to an existing conversation.

**Endpoint**: `POST /api/v1/conversation`

**Request Body**:
```json
{
  "conversationId": "conv_1729705200_abc123",
  "message": "Show me sustainable jeans"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "conversationId": "conv_1729705200_abc123",
  "response": {
    "message": "I found 12 sustainable jeans that match your criteria. All are made with organic or recycled materials and scored 80+ on sustainability.",
    "intent": "search",
    "data": {
      "products": [
        {
          "id": "product-123",
          "name": "Everlane Organic Wide Leg Jeans",
          "overallScore": 85.4,
          "grade": "B",
          "price": 89.00
        }
      ]
    },
    "suggestions": [
      "Would you like to filter by price?",
      "I can explain any product's score in detail"
    ]
  }
}
```

**Follow-up Example**:
```json
{
  "conversationId": "conv_1729705200_abc123",
  "message": "What about under $80?"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "conversationId": "conv_1729705200_abc123",
  "response": {
    "message": "I've updated the filters to show jeans under $80. Here are 8 results...",
    "intent": "filter",
    "data": {
      "products": [ /* filtered results */ ]
    }
  }
}
```

**Error Responses**:
- `404 Not Found` - Conversation not found or expired
- `400 Bad Request` - Invalid message
- `500 Internal Server Error` - Processing failed

---

### 4. Explain Product Score

Get a natural language explanation of a product's quality score.

**Endpoint**: `GET /api/v1/products/:id/explain`

**Query Parameters**:
- `detailLevel` (optional): `summary` | `detailed` | `full` (default: `detailed`)
- `focusAreas` (optional): Comma-separated pillar names (e.g., `FIT,QUALITY`)

**Example Request**:
```
GET /api/v1/products/product-123/explain?detailLevel=detailed&focusAreas=FIT,QUALITY
```

**Response** (200 OK):
```json
{
  "success": true,
  "productId": "product-123",
  "explanation": {
    "productName": "Everlane Wide Leg Organic Jeans",
    "overallScore": 85.4,
    "grade": "B",
    "summary": "This is an excellent product with outstanding quality across most areas.",
    "pillars": [
      {
        "pillar": "FIT",
        "score": 29.02,
        "percentage": 82.9,
        "grade": "B",
        "explanation": "Fit & Sizing: 82.9% (Grade B). Good performance with minor room for improvement. Strong points: True-to-size, Size consistency.",
        "topFactors": [
          {
            "factor": "fit.true_to_size",
            "score": 95.2,
            "impact": "positive"
          },
          {
            "factor": "fit.size_consistency",
            "score": 87.1,
            "impact": "positive"
          }
        ]
      },
      {
        "pillar": "QUALITY",
        "score": 28.2,
        "percentage": 94.0,
        "grade": "A",
        "explanation": "Quality & Durability: 94.0% (Grade A). Excellent performance in this area. Strong points: Fabric quality, Wash durability.",
        "topFactors": [
          {
            "factor": "quality.fabric_quality",
            "score": 96.8,
            "impact": "positive"
          }
        ]
      }
    ],
    "strengths": [
      "Outstanding quality & durability (94.0%)",
      "Outstanding fit & sizing (82.9%)",
      "True to size"
    ],
    "weaknesses": [
      "Below average style & value (75.0%)"
    ],
    "recommendations": [
      "This is a high-quality product worth considering for purchase",
      "Pay close attention to sizing - consider reading detailed fit reviews"
    ],
    "evidenceHighlights": [
      {
        "factor": "Fabric Quality",
        "signal": "soft_fabric",
        "quote": "The fabric is incredibly soft and comfortable",
        "sentiment": 0.85,
        "impact": "Positive"
      }
    ]
  },
  "metadata": {
    "detailLevel": "detailed",
    "processingTime": 123
  }
}
```

**Error Responses**:
- `404 Not Found` - Product or score not found
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Explanation failed

---

### 5. Compare Products

Compare multiple products side-by-side.

**Endpoint**: `POST /api/v1/products/compare`

**Request Body**:
```json
{
  "productIds": ["product-123", "product-456"],
  "focusAreas": ["FIT", "QUALITY"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "comparison": {
    "products": [
      {
        "id": "product-123",
        "name": "Everlane Wide Leg Jeans",
        "overallScore": 85.4,
        "grade": "B",
        "summary": "Excellent product with outstanding quality.",
        "pillars": [ /* pillar details */ ],
        "strengths": [ /* strengths */ ],
        "weaknesses": [ /* weaknesses */ ]
      },
      {
        "id": "product-456",
        "name": "Levi's 501 Original",
        "overallScore": 78.2,
        "grade": "C+",
        "summary": "Good product with solid performance.",
        "pillars": [ /* pillar details */ ],
        "strengths": [ /* strengths */ ],
        "weaknesses": [ /* weaknesses */ ]
      }
    ],
    "comparisonText": "Comparing 2 products:\n\nOverall Scores:\n  • Everlane Wide Leg Jeans: 85.4/100 (B)\n  • Levi's 501 Original: 78.2/100 (C+)\n\nFocus Areas:\n  FIT:\n    • Everlane Wide Leg Jeans: 82.9% (B)\n    • Levi's 501 Original: 76.5% (C+)\n  QUALITY:\n    • Everlane Wide Leg Jeans: 94.0% (A)\n    • Levi's 501 Original: 82.1% (B)",
    "winner": "product-123"
  },
  "metadata": {
    "productCount": 2,
    "focusAreas": ["FIT", "QUALITY"],
    "processingTime": 234
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid product IDs (must provide 2-5)
- `404 Not Found` - One or more products not found
- `500 Internal Server Error` - Comparison failed

---

## Data Models

### Product Search Result
```typescript
{
  id: string
  name: string
  category: string  // TOPS, BOTTOMS, DRESSES, etc.
  brand?: string
  price: number
  aiScore: number   // 0-100
  similarity: number  // 0-1 (for vector search)
  thumbnail?: string
}
```

### Score Explanation
```typescript
{
  productId: string
  productName: string
  overallScore: number  // 0-100
  grade: string  // A+ to F
  summary: string
  pillars: PillarExplanation[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  evidenceHighlights?: EvidenceHighlight[]
  factorBreakdown?: FactorExplanation[]
}
```

### Pillar Explanation
```typescript
{
  pillar: 'FIT' | 'QUALITY' | 'STYLE_VALUE' | 'COMFORT' | 'SUSTAINABILITY'
  score: number  // Earned points
  percentage: number  // 0-100
  grade: string  // A+ to F
  explanation: string
  topFactors: Array<{
    factor: string
    score: number
    impact: 'positive' | 'negative' | 'neutral'
  }>
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": { /* optional validation errors */ }
}
```

**Common HTTP Status Codes**:
- `200 OK` - Success
- `201 Created` - Resource created (e.g., new conversation)
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Intent Types

The query understanding agent detects these intents:

- `search` - Find products matching criteria
- `compare` - Compare multiple products
- `explain` - Explain a product score
- `recommend` - Get personalized recommendations
- `filter` - Apply specific filters to existing results
- `ask_question` - General questions about system/products

---

## Pillar Names

For `focusAreas` parameters:

- `FIT` - Fit & Sizing (35 points)
- `QUALITY` - Quality & Durability (30 points)
- `STYLE_VALUE` - Style & Value (20 points)
- `COMFORT` - Comfort (15 points)
- `SUSTAINABILITY` - Sustainability (5 points)

---

## Best Practices

### Natural Language Search
- Keep queries conversational and specific
- Include relevant details (brand, price, style, quality requirements)
- Use the suggestions to refine searches

### Conversations
- Maintain conversation context for follow-up questions
- Conversations expire after 24 hours of inactivity
- Store conversationId on client side for session continuity

### Score Explanations
- Use `summary` for quick overviews
- Use `detailed` for customer-facing explanations
- Use `full` for internal analysis or debugging

### Product Comparisons
- Compare 2-5 products at a time for best results
- Use focusAreas to highlight specific criteria
- Winner is determined by overall score

---

## Example Use Cases

### Use Case 1: Natural Language Product Discovery
```bash
curl -X POST https://thriftai.com/api/v1/search/natural \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need durable hiking pants under $120",
    "options": { "limit": 10 }
  }'
```

### Use Case 2: Multi-Turn Conversation
```bash
# Start conversation
curl -X POST https://thriftai.com/api/v1/conversation \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'

# Send message
curl -X POST https://thriftai.com/api/v1/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_...",
    "message": "Show me sustainable jeans"
  }'

# Follow-up
curl -X POST https://thriftai.com/api/v1/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_...",
    "message": "Explain the first one"
  }'
```

### Use Case 3: Product Comparison for DTC Brands
```bash
curl -X POST https://thriftai.com/api/v1/products/compare \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["my-product-1", "competitor-product-1"],
    "focusAreas": ["QUALITY", "FIT"]
  }'
```

---

## Support

For API issues or questions:
- GitHub: https://github.com/thriftai/thriftai/issues
- Email: api@thriftai.com
- Documentation: https://docs.thriftai.com

---

**Last Updated**: October 23, 2026
**API Version**: 1.0.0
