# Week 7 Summary: Natural Language Search & Conversation

**Date**: October 23, 2026
**Status**: ✅ COMPLETED

## Overview

Built a complete natural language search and conversation system that allows shoppers to interact with ThriftAI using plain English. The system converts natural language queries into structured searches compatible with our 27-factor scoring system, explains product scores in human-friendly language, and maintains multi-turn conversations with context.

## Components Created

### 1. Query Understanding Agent (`src/lib/agents/query/`)

**Purpose**: Convert natural language queries into structured search filters

**Files Created**:
- `query-types.ts` (230 lines) - Types and enums
- `query-agent.ts` (440 lines) - Claude-based query understanding
- `index.ts` (25 lines) - Module exports

**Key Features**:
- **Intent Classification**: Detects 6 intent types (search, compare, explain, recommend, filter, ask_question)
- **Entity Extraction**: Extracts product types, brands, colors, materials, styles, occasions, price points, quality signals, fit signals, sustainability signals
- **Filter Generation**: Creates structured filters for:
  - Categories (10 clothing categories)
  - Price ranges (min/max)
  - Brands
  - Quality scores (overall + pillar-specific)
  - Fit preferences (size, body type, height)
  - Style attributes
  - Sustainability requirements
  - Trend relevance
- **Semantic Query Generation**: Creates optimized queries for vector search
- **Clarification Detection**: Identifies when queries are ambiguous
- **Refinement Suggestions**: Provides helpful follow-up suggestions
- **Fallback Handling**: Graceful degradation when AI unavailable

**Claude Integration**:
```typescript
Model: claude-3-5-sonnet-20241022
Temperature: 0.0 (deterministic)
Max Tokens: 2048
System Prompt: Comprehensive 27-factor taxonomy knowledge
Response Format: Structured JSON
```

**Intent Detection**:
```
SEARCH → Find products matching criteria
COMPARE → Compare multiple products
EXPLAIN → Explain a product score
RECOMMEND → Get personalized recommendations
FILTER → Apply specific filters to existing results
ASK_QUESTION → General questions about system/products
```

**Entity Extraction Examples**:
```
Query: "sustainable jeans under $100"
Entities:
  - productTypes: ["jeans"]
  - pricePoints: ["under $100"]
  - sustainabilitySignals: ["sustainable"]

Query: "durable jacket for hiking from Patagonia"
Entities:
  - productTypes: ["jacket"]
  - brands: ["Patagonia"]
  - qualitySignals: ["durable"]
  - occasions: ["hiking"]
```

**Filter Generation Examples**:
```
Query: "wide leg jeans from Everlane that run true to size"
Filters:
  - categories: ["BOTTOMS"]
  - brands: ["Everlane"]
  - styles: ["wide leg"]
  - fitPreferences: { trueToSize: true }
  - minPillarScores: { FIT: 80 }
```

### 2. Score Explanation Agent (`src/lib/agents/explanation/`)

**Purpose**: Generate natural language explanations for product scores

**Files Created**:
- `explanation-agent.ts` (550 lines) - Explanation generation
- `index.ts` (20 lines) - Module exports

**Key Features**:
- **3 Detail Levels**:
  - `summary` - Quick overview with strengths/weaknesses
  - `detailed` - Includes pillar breakdowns and evidence highlights
  - `full` - Complete factor-by-factor analysis
- **Smart Summarization**: Generates human-readable summaries of scores
- **Pillar Explanations**: Explains each pillar (Fit, Quality, Style/Value, Comfort, Sustainability)
- **Strength/Weakness Identification**: Automatically identifies what's good and bad
- **Personalized Recommendations**: Context-aware suggestions based on scores
- **Evidence Highlights**: Shows key evidence supporting scores
- **Product Comparison**: Side-by-side comparison of multiple products
- **Grade Calculation**: 11-point letter grade scale (A+ to F)

**Explanation Structure**:
```typescript
{
  productId: string
  productName: string
  overallScore: number        // 0-100
  grade: string              // A+ to F

  summary: string            // Overall assessment
  pillars: PillarExplanation[]  // Per-pillar breakdown
  strengths: string[]        // Top positive aspects
  weaknesses: string[]       // Areas of concern
  recommendations: string[]  // What to do next

  evidenceHighlights?: EvidenceHighlight[]  // Supporting evidence
  factorBreakdown?: FactorExplanation[]     // All 27 factors
}
```

**Example Explanation Output**:
```
Product: Everlane Wide Leg Organic Jeans
Overall Score: 85.4/100 (Grade B)

This is an excellent product with outstanding quality across most areas.

Strengths:
  • Outstanding fit & sizing (82.9%)
  • Outstanding quality & durability (94.0%)
  • True to size

Weaknesses:
  • Below average style & value (75.0%)

Recommendations:
  • This is a high-quality product worth considering for purchase
  • Pay close attention to sizing - consider reading detailed fit reviews
```

**Pillar Explanation Format**:
```
Fit & Sizing: 82.9% (Grade B).
Good performance with minor room for improvement.
Strong points: True-to-size, Size consistency.
Weak points: Fit by body shape.
```

**Product Comparison Output**:
```
Comparing 2 products:

Overall Scores:
  • Product A: 85.4/100 (B)
  • Product B: 72.1/100 (C)

Focus Areas:
  QUALITY:
    • Product A: 94.0% (A)
    • Product B: 68.0% (D+)
  FIT:
    • Product A: 82.9% (B)
    • Product B: 76.5% (C+)
```

### 3. Conversation Manager (`src/lib/agents/conversation/`)

**Purpose**: Handle multi-turn conversations with context retention

**Files Created**:
- `conversation-manager.ts` (500 lines) - Conversation orchestration
- `index.ts` (15 lines) - Module exports

**Key Features**:
- **Context Retention**: Maintains conversation history (last 20 messages)
- **Intent Routing**: Routes to appropriate agents based on detected intent
- **User Preferences**: Tracks and applies user preferences over time
- **Follow-up Handling**: Understands context from previous messages
- **Question Answering**: Uses Claude to answer general questions
- **Conversation State Management**: Tracks what products were shown, filters applied, etc.
- **Automatic Cleanup**: Removes old conversations (24h default)

**Conversation State**:
```typescript
{
  id: string                // Unique conversation ID
  userId?: string           // Optional user ID
  messages: ConversationMessage[]  // Message history
  context: {
    lastIntent?: QueryIntent
    lastProductsShown?: string[]
    currentFilters?: SearchFilters
    userPreferences?: UserPreferences
  }
  createdAt: Date
  updatedAt: Date
}
```

**Conversation Flow Example**:
```
User: "Show me sustainable jeans"
→ Intent: SEARCH
→ Filters: { categories: ["BOTTOMS"], sustainabilityRequired: true }
→ Returns: Product results

User: "What about under $80?"
→ Intent: FILTER
→ Context: Previous search for jeans
→ Updated Filters: { ...previous, priceMax: 80 }
→ Returns: Filtered results

User: "Explain the score for the first one"
→ Intent: EXPLAIN
→ Context: First product from last results
→ Returns: Detailed score explanation

User: "How do you calculate quality scores?"
→ Intent: ASK_QUESTION
→ Uses Claude to answer system questions
→ Returns: Explanation of quality scoring methodology
```

**Intent Handlers**:
- `handleSearch()` - Product search with filters
- `handleExplain()` - Score explanation for specific product
- `handleCompare()` - Compare multiple products
- `handleRecommend()` - Personalized recommendations
- `handleFilter()` - Apply new filters to existing results
- `handleQuestion()` - Answer general questions

### 4. Demo Script (`demo-week7.ts`)

**Purpose**: Interactive demonstration of all Week 7 features

**Demonstrations**:
1. **Query Understanding** - 6 sample queries showing different intents
2. **Score Explanation** - Example output for product scoring
3. **Conversation Flow** - 4-turn conversation with context

**Sample Queries Tested**:
```
1. "Show me sustainable jeans under $100"
   → Price filter + sustainability requirement

2. "I need a durable jacket for hiking"
   → Quality signal + use case

3. "Wide leg jeans from Everlane that run true to size"
   → Brand + style + fit signal

4. "Why did this product get a low score?"
   → Explanation request

5. "Compare these two jackets"
   → Comparison request

6. "What does 'fabric quality' mean in your scoring?"
   → General question about system
```

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `query/query-types.ts` | 230 | Type definitions |
| `query/query-agent.ts` | 440 | Query understanding logic |
| `query/index.ts` | 25 | Module exports |
| `explanation/explanation-agent.ts` | 550 | Score explanation logic |
| `explanation/index.ts` | 20 | Module exports |
| `conversation/conversation-manager.ts` | 500 | Conversation orchestration |
| `conversation/index.ts` | 15 | Module exports |
| `demo-week7.ts` | 320 | Interactive demo |
| **TOTAL** | **2,100 lines** | Complete NLP & Conversation System |

## Technical Highlights

### Claude Integration Strategy

**Query Understanding**:
- Temperature: 0.0 for deterministic, consistent parsing
- Structured JSON output for reliable parsing
- Comprehensive system prompt with 27-factor taxonomy
- Fallback to keyword extraction if API fails

**Conversation**:
- Temperature: 0.7 for natural, varied responses
- Context-aware prompting with conversation history
- System prompt tailored for ThriftAI domain knowledge

### Entity Extraction

**10 Entity Types Extracted**:
1. Product Types (jeans, jacket, dress, etc.)
2. Brands (Everlane, Patagonia, etc.)
3. Colors (blue, black, white, etc.)
4. Materials (denim, cotton, leather, etc.)
5. Styles (wide leg, classic, oversized, etc.)
6. Occasions (casual, work, formal, etc.)
7. Price Points (under $100, budget, etc.)
8. Quality Signals (durable, well-made, premium, etc.)
9. Fit Signals (true to size, runs small, etc.)
10. Sustainability Signals (organic, eco-friendly, etc.)

### Filter Generation

**Intelligent Mapping**:
- "sustainable" → `sustainabilityRequired: true`
- "quality jeans" → `minOverallScore: 70, minPillarScores: { QUALITY: 80 }`
- "under $100" → `priceMax: 100`
- "true to size" → `fitPreferences: { trueToSize: true }, minPillarScores: { FIT: 80 }`

### Integration with Existing Systems

**Vector Search Integration**:
- Generates optimized `semanticQuery` for Qdrant/pgvector
- Filters compatible with existing `VectorSearchService`
- Supports hybrid search (vector + keyword + AI score)

**27-Factor Scoring Integration**:
- Explanation agent reads `ProductScore` and `FactorScore` tables
- Generates human-friendly explanations of technical scores
- Maps factor names to user-friendly language
- Shows evidence from `EvidenceTag` table

**Multi-Tenant Support**:
- Conversation state can be scoped to users/tenants
- Preferences can be persisted per user
- Context maintained across sessions

## Requirements Met

✅ **Natural Language Understanding**: Convert plain English to structured queries
✅ **Intent Classification**: 6 intent types with confidence scores
✅ **Entity Extraction**: 10 entity types automatically detected
✅ **Filter Generation**: Compatible with vector search and scoring
✅ **Score Explanation**: Natural language explanations of 27-factor scores
✅ **Product Comparison**: Side-by-side analysis
✅ **Multi-Turn Conversation**: Context-aware dialogue
✅ **User Preferences**: Personalization support
✅ **Clarification Detection**: Asks for clarification when needed
✅ **Graceful Degradation**: Fallback when AI unavailable
✅ **Demo Validated**: 6+ query types tested successfully

## Usage Examples

### Query Understanding

```typescript
import { understandQuery } from '@/lib/agents/query'

const understanding = await understandQuery({
  query: "Show me sustainable jeans under $100 from Everlane"
})

console.log(understanding.intent)           // "search"
console.log(understanding.filters.brands)   // ["Everlane"]
console.log(understanding.filters.priceMax) // 100
console.log(understanding.filters.sustainabilityRequired) // true
```

### Score Explanation

```typescript
import { explainScore } from '@/lib/agents/explanation'

const explanation = await explainScore('product-123', {
  detailLevel: 'detailed'
})

console.log(explanation.summary)
console.log(explanation.strengths)
console.log(explanation.weaknesses)
console.log(explanation.recommendations)
```

### Product Comparison

```typescript
import { compareProducts } from '@/lib/agents/explanation'

const comparison = await compareProducts(
  ['product-1', 'product-2'],
  ['FIT', 'QUALITY']  // Focus areas
)

console.log(comparison.comparison)
console.log(comparison.winner) // ID of higher-scoring product
```

### Conversation

```typescript
import { conversationManager } from '@/lib/agents/conversation'

const convId = conversationManager.startConversation('user-123')

const response1 = await conversationManager.processMessage(
  convId,
  "Show me sustainable jeans"
)

const response2 = await conversationManager.processMessage(
  convId,
  "What about under $80?"  // Context-aware!
)
```

## Integration Points

### API Endpoints (Ready to Build)

**Query Endpoint**:
```
POST /api/v1/query
Body: { query: string, context?: {...} }
Response: { understanding, results, suggestions }
```

**Conversation Endpoint**:
```
POST /api/v1/conversation/:id/message
Body: { message: string, preferences?: {...} }
Response: { message, intent, data, suggestions }
```

**Explanation Endpoint**:
```
GET /api/v1/products/:id/explain
Query: { detailLevel?: string, focusAreas?: string[] }
Response: { explanation }
```

### Database Integration

**Already Integrated**:
- Reads from `ProductScore` table
- Reads from `FactorScore` table
- Reads from `EvidenceTag` table
- Reads from `ClothingProduct` table

**Future Integration**:
- Save conversation history to database
- Persist user preferences
- Track query patterns for analytics
- Cache query understanding results

### Vector Search Integration

**Compatible with**:
- Existing `VectorSearchService`
- Qdrant vector database
- pgvector (PostgreSQL)
- Hybrid search (vector + keyword + AI score)

**Flow**:
```
Natural Query → Query Agent → Structured Filters
              ↓
         Semantic Query → Vector Search (Qdrant/pgvector)
              ↓
         Search Results → Ranked by 27-factor scores
              ↓
    Results + Explanations → User
```

## Future Enhancements

### Query Understanding
- **Query rewriting**: "cheap jeans" → "affordable high-quality jeans"
- **Spell correction**: Handle typos gracefully
- **Multi-language support**: Spanish, French, etc.
- **Voice input**: Transcription + understanding
- **Image search**: "Find jeans like this picture"

### Explanation Agent
- **Visual explanations**: Charts showing pillar breakdown
- **Comparison visualization**: Side-by-side score bars
- **Evidence snippets**: Inline review quotes
- **Video explanations**: AI-generated video summaries
- **Personalized insights**: "Based on your preferences..."

### Conversation
- **Sentiment analysis**: Detect frustration, excitement
- **Proactive suggestions**: "You might also like..."
- **Learning preferences**: Implicit preference extraction
- **Multi-modal**: Images, videos in conversation
- **Voice responses**: Text-to-speech for explanations

### Performance
- **Caching**: Cache query understanding results (60s TTL)
- **Batch processing**: Process multiple queries together
- **Streaming responses**: Stream explanations as they generate
- **Response compression**: Gzip for large explanations

### Analytics
- **Query patterns**: Most common search terms
- **Intent distribution**: Which intents are most used
- **Clarification rate**: How often clarification needed
- **Conversion tracking**: Queries → purchases
- **A/B testing**: Test different prompts

## Demo Run Instructions

```bash
# Run the demo
npx tsx src/lib/agents/demo-week7.ts

# Expected output:
# - 6 query understanding examples
# - Score explanation simulation
# - 4-turn conversation demonstration
# - Summary of capabilities
```

## Week 7 Gate: PASSED ✅

- ✅ Natural language query understanding implemented
- ✅ Score explanation agent working
- ✅ Conversation manager with context retention
- ✅ 2,100 lines of production code
- ✅ Demo shows 6+ query types
- ✅ Integration ready with existing systems
- ✅ Full TypeScript type safety

---

**Status**: 7/8 weeks complete (87.5% done!)
**Next**: Week 8 - Final hardening, pilot testing, and deployment preparation

---

## Key Achievements

### Strategic
✅ **Natural Interaction**: Shoppers can use plain English
✅ **Context Awareness**: Multi-turn conversations feel natural
✅ **Transparent Scoring**: Explanations build trust
✅ **Personalization Ready**: User preferences supported

### Technical
✅ **Claude Integration**: Dual-purpose (understanding + Q&A)
✅ **6 Intent Types**: Comprehensive intent coverage
✅ **10 Entity Types**: Rich entity extraction
✅ **3 Detail Levels**: Flexible explanation depth
✅ **Type-Safe**: Full TypeScript implementation

### Operational
✅ **Fallback Handling**: Graceful degradation
✅ **Conversation State**: Scalable state management
✅ **Integration Ready**: Compatible with all existing systems
✅ **Demo Validated**: 6+ scenarios tested

---

**Next up**: Week 8 will focus on performance optimization, error handling, monitoring, and final pilot preparation.
