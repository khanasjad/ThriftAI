# ThriftAI Advanced AI Scoring Service

A powerful Python microservice that enhances ThriftAI's product analysis capabilities using LangChain and Claude 3.5 Sonnet for intelligent product scoring and user preference learning.

## 🚀 Features

### Core Capabilities
- **Semantic Product Analysis**: Advanced understanding of product relevance using natural language processing
- **Intent Classification**: Intelligent analysis of user search queries and intent
- **Multi-dimensional Scoring**: Comprehensive product evaluation across multiple criteria
- **User Preference Learning**: Adaptive system that learns from user behavior over time
- **Real-time Personalization**: Dynamic recommendations based on user profiles

### Technical Features
- **LangChain Integration**: Sophisticated AI chains for complex reasoning
- **Claude 3.5 Sonnet**: State-of-the-art language model for analysis
- **Vector Embeddings**: Semantic similarity calculations using sentence transformers
- **Redis Caching**: High-performance caching for optimal response times
- **Graceful Fallbacks**: Robust error handling and fallback mechanisms

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Java Backend  │───▶│   FastAPI App   │───▶│   LangChain     │
│   (ThriftAI)    │    │   (Main API)    │    │   Chains        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Redis Cache    │    │  Claude 3.5     │
                       │  (Performance)  │    │  Sonnet API     │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.8+
- Redis (optional, for caching)
- Claude API key from Anthropic

### Installation

1. **Clone and navigate to the AI service directory:**
   ```bash
   cd ai-service
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set your Claude API key:**
   ```bash
   export ANTHROPIC_API_KEY="your_claude_api_key_here"
   ```

5. **Start the service:**
   ```bash
   python main.py
   ```

The service will start on `http://localhost:8080` by default.

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Claude API key (required) |
| `CLAUDE_MODEL` | claude-3-5-sonnet-20241022 | Claude model to use |
| `SERVICE_PORT` | 8080 | Port for the FastAPI service |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `LOG_LEVEL` | INFO | Logging level |
| `MAX_TOKENS` | 4000 | Maximum tokens for Claude |
| `TEMPERATURE` | 0.1 | Temperature for Claude responses |

### Java Backend Integration

Add these properties to your Java application.properties:

```properties
# AI Service Configuration
ai.service.url=http://localhost:8080
ai.service.enabled=true
ai.service.timeout=30
```

## 📊 API Endpoints

### Core Analysis
- `POST /analyze-products` - Comprehensive product analysis
- `POST /score-product` - Single product scoring
- `GET /health` - Health check

### User Management
- `GET /user-preferences/{userId}` - Get user preferences
- `POST /feedback` - Submit user feedback

### Analytics
- `GET /analytics/performance` - Performance metrics

## 🧠 How It Works

### 1. Query Intent Analysis
```python
# LangChain analyzes user queries for deeper understanding
intent_result = await langchain_service.analyze_query_intent(
    query="Find vintage Levi's jeans under $50",
    user_context=user_preferences
)
```

### 2. Semantic Product Matching
```python
# Products are scored using semantic similarity and AI reasoning
analysis = await langchain_service.analyze_product_semantic_match(
    query=query,
    product=product,
    intent_analysis=intent_data
)
```

### 3. Multi-dimensional Scoring
Products are evaluated across multiple dimensions:
- **Semantic Relevance** (25%): How well the product matches the query
- **Price Competitiveness** (20%): Value proposition analysis
- **Brand Preference** (15%): Brand quality and user preferences
- **Condition Quality** (15%): Product condition assessment
- **Value Proposition** (15%): Overall value for money
- **User Preference Match** (5%): Personalization factors
- **Market Trend Alignment** (5%): Current market trends

### 4. Continuous Learning
The system learns from user interactions:
- Click-through rates
- Purchase behavior
- Explicit feedback (likes/dislikes)
- Search patterns

## 🔄 Integration with Java Backend

The Java backend integrates with this service through the `LangChainIntegrationService`:

```java
@Service
public class LangChainIntegrationService {

    // Enhanced analysis using Python AI service
    public AIInsights generateEnhancedProductAnalysis(
        String query,
        List<Product> products,
        String userId
    ) {
        // Calls Python service with fallback to traditional analysis
    }
}
```

## 🚀 Performance Features

### Caching Strategy
- **Query Results**: Cached for 1 hour
- **User Preferences**: Cached for 7 days
- **Model Responses**: Intelligent caching based on content

### Async Processing
- Concurrent product analysis
- Background preference updates
- Non-blocking feedback submission

### Fallback Mechanisms
- Graceful degradation when Claude API is unavailable
- Fallback to Java backend analysis
- Circuit breaker pattern for reliability

## 📈 Monitoring & Analytics

### Performance Metrics
- Response times
- Cache hit rates
- Model usage statistics
- Error rates
- User satisfaction metrics

### Logging
- Structured logging with loguru
- Request/response tracking
- Error monitoring
- Performance profiling

## 🔮 Advanced Features

### Personalization Engine
- Dynamic weight adjustment based on user behavior
- A/B testing framework for algorithm optimization
- Preference strength analysis
- Engagement level tracking

### Market Intelligence
- Trend analysis
- Category insights
- Price optimization
- Seasonal adjustments

## 🛡️ Security & Reliability

- API key management
- Rate limiting
- Input validation
- Error handling
- Health monitoring

## 🤝 Contributing

1. Follow Python PEP 8 style guidelines
2. Add type hints to all functions
3. Include comprehensive docstrings
4. Write tests for new features
5. Update documentation

## 📚 Dependencies

Key libraries used:
- **FastAPI**: Modern web framework
- **LangChain**: AI application framework
- **langchain-anthropic**: Claude integration
- **sentence-transformers**: Text embeddings
- **aioredis**: Async Redis client
- **loguru**: Advanced logging

## 🎯 Future Enhancements

- Vector database integration (Pinecone/Weaviate)
- Multi-model support (OpenAI, Cohere)
- Advanced A/B testing framework
- Real-time recommendation updates
- GraphQL API support
- Kubernetes deployment configurations

---

## 📞 Support

For questions or issues:
1. Check the logs in `ai_service.log`
2. Verify environment configuration
3. Check Redis connectivity
4. Validate Claude API key permissions

**Happy analyzing! 🎉**