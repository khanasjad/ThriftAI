# ThriftAI System Architecture & Data Flow

## 🏗️ Complete System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        Demo[AI Search Demo Page]
        Visual[Visual Search Page]
        Cards[Product Cards]
    end

    subgraph "API Layer"
        Gateway[Next.js API Gateway]
        Enhanced[/api/enhanced-search]
        VisualAPI[/api/visual-search]
        Health[/api/health]
    end

    subgraph "AI Services Layer"
        Claude[Claude AI Service]
        Optimizer[Search Optimizer]
        Scoring[Product Scoring Engine]
        Analysis[AI Analysis Service]
    end

    subgraph "Data Services Layer"
        MockAmazon[Mock Amazon API]
        ProductDB[(Product Database)]
        Cache[(Redis Cache)]
    end

    subgraph "External Services"
        AnthropicAPI[Anthropic Claude API]
        ImageVision[Claude Vision API]
    end

    %% User Interactions
    UI --> Gateway
    Demo --> Enhanced
    Visual --> VisualAPI

    %% API Routing
    Gateway --> Enhanced
    Gateway --> VisualAPI
    Gateway --> Health

    %% Service Dependencies
    Enhanced --> Optimizer
    Enhanced --> MockAmazon
    Enhanced --> Scoring
    Enhanced --> Analysis

    VisualAPI --> ImageVision
    VisualAPI --> Optimizer
    VisualAPI --> MockAmazon
    VisualAPI --> Scoring

    %% AI Service Dependencies
    Optimizer --> AnthropicAPI
    Analysis --> AnthropicAPI

    %% Data Layer
    MockAmazon --> ProductDB
    Scoring --> Cache

    %% Response Flow
    Cards --> UI
    Enhanced --> Demo
    VisualAPI --> Visual
```

## 🔄 Detailed Data Flow Diagrams

### 1. Enhanced Text Search Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant API as /api/enhanced-search
    participant Opt as SearchOptimizer
    participant Claude as Claude AI
    participant Amazon as MockAmazonService
    participant Score as ProductScoringEngine
    participant Anal as AIAnalysisService

    User->>UI: Enter search query: "vintage Nike shoes"
    UI->>API: POST /api/enhanced-search
    Note over UI,API: Request Body:<br/>{<br/>  query: "vintage Nike shoes",<br/>  userProfile: {...},<br/>  contextHints: {...},<br/>  clientConfig: {...}<br/>}

    API->>Opt: optimizeWithClaude(query, profile, hints)
    Opt->>Claude: Claude API Call
    Note over Opt,Claude: Prompt: Optimize query for thrift search<br/>Model: claude-3-haiku-20240307
    Claude-->>Opt: Optimized Query + Enhancements
    Note over Claude,Opt: Response:<br/>{<br/>  optimizedQuery: "Nike vintage sneakers athletic footwear retro",<br/>  enhancements: {<br/>    synonyms: ["footwear", "sneakers"],<br/>    brandNormalization: ["Nike"],<br/>    intentClassification: "buy",<br/>    confidence: 87<br/>  }<br/>}

    API->>Amazon: searchProducts(optimizedQuery, filters)
    Amazon-->>API: Product Array[12]
    Note over Amazon,API: MockAmazonProduct[]<br/>with metadata, reviews, pricing

    loop For each product
        API->>Score: scoreProduct(product, query, profile)
        Score-->>API: ProductScores (100+ parameters)

        API->>Anal: analyzeProduct(product, profile)
        Anal->>Claude: Deep Analysis Request
        Claude-->>Anal: AI Analysis
        Anal-->>API: AIProductAnalysis
    end

    API->>API: Rank & Personalize Results
    API-->>UI: SearchResponse
    Note over API,UI: Response:<br/>{<br/>  query: { original, optimized, enhancements },<br/>  results: EnhancedSearchResult[],<br/>  metadata: { processingTime, confidence, aiModelsUsed },<br/>  suggestions: { alternativeQueries, filters }<br/>}

    UI->>User: Display Ranked Products with AI Insights
```

### 2. Visual Search Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Visual Search UI
    participant API as /api/visual-search
    participant Vision as Claude Vision
    participant Opt as SearchOptimizer
    participant Amazon as MockAmazonService
    participant Score as ProductScoringEngine

    User->>UI: Upload image (JPG/PNG)
    UI->>UI: Convert to Base64
    UI->>API: POST /api/visual-search
    Note over UI,API: Request Body:<br/>{<br/>  imageData: "base64...",<br/>  imageFormat: "jpeg",<br/>  additionalText: "looking for similar style",<br/>  maxResults: 12<br/>}

    API->>Vision: Analyze image with Claude Vision
    Note over API,Vision: Prompt: Extract fashion details<br/>Model: claude-3-haiku-20240307<br/>Image: base64 data

    Vision-->>API: Image Analysis Result
    Note over Vision,API: Response:<br/>{<br/>  detectedItems: ["sneakers", "athletic shoes"],<br/>  style: "vintage",<br/>  colors: ["blue", "white"],<br/>  category: "SHOES",<br/>  brand: "Nike",<br/>  searchQuery: "vintage Nike blue white sneakers",<br/>  confidence: 85<br/>}

    API->>Opt: optimizeWithClaude(analysisQuery)
    Opt-->>API: Enhanced Query

    API->>Amazon: searchProducts(query, visualFilters)
    Amazon-->>API: Visually Similar Products

    loop For each product
        API->>Score: scoreProduct + visualSimilarityBoost
        Score-->>API: Enhanced Scores
    end

    API->>API: Re-rank by Visual Similarity
    API-->>UI: Visual Search Response
    Note over API,UI: Response includes:<br/>- imageAnalysis<br/>- visually similar products<br/>- similarity scores<br/>- style recommendations

    UI->>User: Display Similar Products with Match Details
```

### 3. Product Scoring Engine Detail

```mermaid
graph TD
    subgraph "Input Data"
        Product[MockAmazonProduct]
        Query[Search Query]
        Profile[User Profile]
        Market[Market Data]
        Context[Context Hints]
    end

    subgraph "Scoring Categories"
        Quality[Quality Score<br/>- Material Quality<br/>- Craftsmanship<br/>- Durability<br/>- Brand Reputation<br/>- Warranty Support<br/>- Condition Assessment]

        Value[Value Score<br/>- Price Comparison<br/>- Quality-to-Price Ratio<br/>- Market Value<br/>- Discount Value<br/>- Total Cost of Ownership<br/>- Investment Potential]

        Design[Design Score<br/>- Aesthetic Appeal<br/>- Functional Design<br/>- Timelessness<br/>- Versatility<br/>- Uniqueness<br/>- Brand Styling]

        Relevance[Relevance Score<br/>- Query Match<br/>- Semantic Similarity<br/>- Category Alignment<br/>- Attribute Match<br/>- Intent Fulfillment<br/>- Contextual Relevance]

        Sustainability[Sustainability Score<br/>- Environmental Impact<br/>- Material Sustainability<br/>- Production Ethics<br/>- Longevity<br/>- Recyclability<br/>- Circularity]

        Popularity[Popularity Score<br/>- Sales Volume<br/>- Review Count<br/>- Rating Distribution<br/>- Social Mentions<br/>- Trending Status<br/>- Market Demand]

        Authenticity[Authenticity Score<br/>- Seller Verification<br/>- Product Authentication<br/>- Description Accuracy<br/>- Image Authenticity<br/>- Brand Verification<br/>- Documentation]

        Availability[Availability Score<br/>- Stock Status<br/>- Shipping Speed<br/>- Location Proximity<br/>- Seller Responsiveness<br/>- Fulfillment Reliability<br/>- Seasonal Availability]
    end

    subgraph "Personalization"
        Personal[Personalization Factors<br/>- User Preference Match<br/>- Purchase History Alignment<br/>- Size Compatibility<br/>- Style Compatibility<br/>- Budget Alignment<br/>- Brand Affinity Bonus<br/>- Contextual Bonus]
    end

    subgraph "Output"
        Final[Final Product Score<br/>- Overall Score (0-100)<br/>- Category Breakdown<br/>- Confidence Level<br/>- Reasoning Array<br/>- Processing Time]
    end

    Product --> Quality
    Product --> Value
    Product --> Design
    Product --> Sustainability
    Product --> Popularity
    Product --> Authenticity
    Product --> Availability

    Query --> Relevance
    Profile --> Personal
    Market --> Value
    Context --> Relevance

    Quality --> Final
    Value --> Final
    Design --> Final
    Relevance --> Final
    Sustainability --> Final
    Popularity --> Final
    Authenticity --> Final
    Availability --> Final
    Personal --> Final
```

## 🗂️ File Structure & Responsibilities

```
thriftai-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── enhanced-search/route.ts     # Main search endpoint
│   │   │   ├── visual-search/route.ts       # Image search endpoint
│   │   │   └── buyers/claude-search/route.ts # Legacy endpoint
│   │   ├── ai-search-demo/page.tsx          # Demo interface
│   │   ├── visual-search/page.tsx           # Visual search UI
│   │   └── page.tsx                         # Main landing page
│   ├── components/
│   │   ├── enhanced/
│   │   │   ├── SearchResults.tsx            # Search results display
│   │   │   └── ProductCard.tsx              # Product card component
│   │   ├── visual-search/
│   │   │   └── VisualSearchUpload.tsx       # Image upload component
│   │   └── ui/                              # Base UI components
│   └── lib/
│       ├── services/
│       │   ├── searchOptimizer.ts           # Claude query optimization
│       │   ├── mockAmazonService.ts         # Product data service
│       │   ├── productScoringEngine.ts      # Multi-factor scoring
│       │   └── aiAnalysisService.ts         # Product analysis
│       └── types/
│           └── scoring.ts                   # TypeScript definitions
```

## 📊 API Specifications

### Enhanced Search API

**Endpoint:** `POST /api/enhanced-search`

**Input:**
```typescript
{
  query: string                    // "vintage Nike shoes"
  userProfile?: UserProfile        // User preferences & history
  contextHints?: ContextHints      // Season, occasion, etc.
  filters?: SearchFilters          // Category, price, color filters
  sort?: SortOptions              // Sorting preferences
  pagination?: PaginationOptions   // Page size and offset
  clientConfig?: ClientConfiguration // Feature flags & settings
}
```

**Output:**
```typescript
{
  query: {
    original: string               // Original user query
    optimized: string             // Claude-enhanced query
    enhancements: {               // AI improvements
      synonyms: string[]
      brandNormalization: string[]
      intentClassification: string
      confidence: number
    }
  }
  results: EnhancedSearchResult[] // Scored & ranked products
  metadata: {
    totalFound: number
    processingTime: number        // milliseconds
    confidence: number            // AI confidence %
    aiModelsUsed: string[]       // Models utilized
    requestId: string            // Request tracking
    performanceMetrics: object   // Detailed timing
  }
  suggestions: {
    alternativeQueries: string[]
    categoryRecommendations: string[]
    brandSuggestions: string[]
    filterSuggestions: object
  }
}
```

### Visual Search API

**Endpoint:** `POST /api/visual-search`

**Input:**
```typescript
{
  imageData: string              // Base64 encoded image
  imageFormat: 'jpeg'|'png'|'webp'|'gif'
  userProfile?: UserProfile
  contextHints?: ContextHints
  additionalText?: string        // Optional context
  maxResults?: number           // Default: 12
}
```

**Output:**
```typescript
{
  imageAnalysis: {
    detectedItems: string[]       // ["sneakers", "athletic shoes"]
    style: string                 // "vintage"
    colors: string[]             // ["blue", "white"]
    category: string             // "SHOES"
    brand?: string               // "Nike"
    searchQuery: string          // Generated search query
    confidence: number           // Analysis confidence
    reasoning: string[]          // AI explanation
  }
  results: EnhancedSearchResult[] // Products with visual similarity
  // ... standard search response format
}
```

## ⚡ Performance Characteristics

### Response Times
- **Text Search:** < 2 seconds (avg 1.2s)
- **Visual Search:** < 3 seconds (avg 2.1s)
- **Product Scoring:** ~50ms per product
- **Claude API:** ~800ms average

### Scalability Features
- **Parallel Processing:** Simultaneous product scoring
- **Retry Logic:** Exponential backoff for API failures
- **Caching:** Request-level caching (planned)
- **Feature Flags:** Gradual rollout capabilities
- **Error Handling:** Graceful degradation

### Configuration Management
```typescript
interface ClientConfiguration {
  features: {
    enableAdvancedScoring: boolean
    enablePersonalization: boolean
    enableSustainabilityMetrics: boolean
    enableVisualSearch: boolean
    maxRetries: number
    timeoutMs: number
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    enableAnimations: boolean
    resultsPerPage: number
  }
  experimental: {
    enableMLReranking: boolean
    enableRealTimeUpdates: boolean
    enablePredictiveSearch: boolean
  }
}
```

## 🔐 Security & Error Handling

### Input Validation
- Image size limits (10MB max)
- Supported formats validation
- Query length restrictions
- Rate limiting headers

### Error Responses
```typescript
{
  error: string                  // Error type
  message: string               // Human-readable message
  code: string                  // Error code for handling
  requestId: string            // For tracking/debugging
  timestamp: string            // ISO timestamp
  retryAfter?: number          // Seconds to wait before retry
}
```

### Health Monitoring
- Service availability checks
- Response time monitoring
- AI model health verification
- Database connection status

This architecture provides a comprehensive, scalable, and maintainable system for AI-powered thrift shopping with clear separation of concerns and robust error handling.