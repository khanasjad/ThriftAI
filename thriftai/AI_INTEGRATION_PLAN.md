# 🤖 ThriftAI - Claude AI SDK Integration Plan

## 🎯 Vision
Transform ThriftAI into an **AI-first shopping platform** where Claude AI powers every interaction, making shopping natural, intelligent, and personalized.

---

## 📋 Current State Analysis

### ✅ What's Working
- Basic intent extraction with regex fallback
- Relevance scoring for search results
- Marketplace comparison with scoring algorithm
- Query normalization (basic)

### ❌ What's Missing
- **Claude API failing** (invalid/expired key)
- Limited natural language understanding
- No conversational context
- Basic query optimization
- No AI-powered recommendations
- No shopping advisor personality

---

## 🏗️ Architecture Plan

### **Phase 1: Core AI Infrastructure** (Priority: HIGH)
```
┌─────────────────────────────────────────────────┐
│          User Natural Language Query            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   Claude AI - Query Understanding Service       │
│   • Parse intent                                │
│   • Extract entities (price, brand, category)   │
│   • Handle typos and variations                 │
│   • Understand context from conversation        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   Structured Query Generator                    │
│   • Generate optimized DB queries               │
│   • Apply filters intelligently                 │
│   • Handle complex conditions                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   Database + Marketplace Search                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   Claude AI - Shopping Advisor                  │
│   • Analyze results                             │
│   • Generate personalized recommendations       │
│   • Explain value propositions                  │
│   • Compare options                             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   User gets AI-powered recommendations          │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Details

### **1. AI Query Understanding Service**

**File**: `/src/lib/services/aiQueryUnderstanding.ts`

**Capabilities**:
```typescript
interface QueryUnderstanding {
  // Original query
  originalQuery: string

  // AI-extracted intent
  intent: {
    action: 'search' | 'compare' | 'recommend' | 'filter'
    confidence: number
  }

  // Extracted entities
  entities: {
    productType: string[]        // ["bags", "handbags"]
    brands: string[]              // ["Gucci", "Prada"]
    priceRange: {
      min?: number
      max?: number
      budget?: number
    }
    attributes: {
      color?: string[]
      size?: string[]
      condition?: string[]
      style?: string[]            // ["vintage", "modern", "classic"]
    }
    occasions?: string[]          // ["work", "casual", "formal"]
    preferences?: string[]        // ["sustainable", "luxury", "budget-friendly"]
  }

  // Optimized search query
  optimizedQuery: string

  // AI reasoning
  reasoning: string

  // Conversation context
  previousQueries?: string[]
}
```

**Example**:
```
User: "I need a professional looking bag for work meetings under $200, preferably leather"

AI Understanding:
{
  intent: { action: 'search', confidence: 0.95 },
  entities: {
    productType: ['bag', 'briefcase', 'tote'],
    priceRange: { max: 200 },
    attributes: {
      material: ['leather'],
      style: ['professional', 'business'],
      condition: ['new', 'like-new', 'excellent']
    },
    occasions: ['work', 'meetings', 'professional']
  },
  optimizedQuery: "professional leather bag briefcase work",
  reasoning: "User needs professional bag for work, prioritizing business-appropriate styles"
}
```

---

### **2. Intelligent Shopping Advisor**

**File**: `/src/lib/services/aiShoppingAdvisor.ts`

**Capabilities**:
- **Product Analysis**: Analyze search results and identify best matches
- **Value Assessment**: Compare price vs. quality vs. features
- **Personalized Recommendations**: Based on user preferences and history
- **Conversational Responses**: Natural, helpful explanations

**Example Output**:
```
🎯 Found 3 excellent matches for your professional work bag needs:

💼 Top Recommendation: Coach Leather Briefcase ($179)
   Why it's perfect for you:
   • Within your $200 budget with room to spare
   • Genuine leather construction
   • Professional design ideal for meetings
   • Excellent condition (like-new)
   • Free shipping saves you money

🌟 Alternative: Fossil Leather Tote ($149)
   A great option if you prefer:
   • More casual-professional style
   • Extra $50 savings vs. top choice
   • Larger capacity for laptop + documents

💡 Smart Tip: Both options are from reputable brands known for durability,
   so you're getting long-term value either way!
```

---

### **3. Conversational Context Manager**

**File**: `/src/lib/services/conversationContext.ts`

**Track**:
- User's search history
- Preferences learned over time
- Budget patterns
- Style preferences
- Previous purchases

**Example**:
```
User: "show me bags"
AI: [Shows bags based on past preferences for leather, professional style]

User: "something more casual"
AI: [Remembers context, shows casual bags in same price range]

User: "cheaper options"
AI: [Adjusts price range based on previously shown items]
```

---

### **4. Enhanced Intent Extraction**

**Upgrade**: `/src/lib/services/claudeIntentExtractor.ts`

**New Prompt Strategy**:
```typescript
const ADVANCED_INTENT_PROMPT = `You are an expert shopping assistant AI that understands
natural language queries and extracts precise shopping intent.

Your task:
1. Understand EXACTLY what the user wants (not just keywords)
2. Extract hidden preferences (style, quality expectations, use case)
3. Identify budget consciousness vs. quality seeking
4. Recognize brand preferences
5. Understand urgency and timing
6. Detect comparison intent vs. direct purchase intent

Return structured data that helps find the PERFECT product match.`
```

---

## 🎨 User Experience Enhancements

### **Before (Current)**
```
User types: "bag"
System: Shows all bags, sorted by price
```

### **After (With AI)**
```
User types: "I need something for my laptop to take to the office"

AI Understanding:
✓ Product: Laptop bag / briefcase
✓ Use case: Professional / office
✓ Size requirement: Must fit laptop
✓ Style: Professional, not casual

System shows:
1. Professional laptop bags
2. Briefcases with laptop compartments
3. Business totes with tech sleeves

AI Advisor says:
"I found 8 professional laptop bags perfect for office use.
I'm prioritizing options with padded laptop compartments and
professional styling. Would you like to see more casual options,
or shall we focus on traditional briefcase styles?"
```

---

## 📦 New Services to Create

### 1. **AIQueryUnderstandingService**
- Natural language parsing
- Entity extraction
- Intent classification
- Context awareness

### 2. **AIShoppingAdvisorService**
- Product analysis
- Recommendation generation
- Value assessment
- Comparison explanations

### 3. **ConversationContextService**
- Session management
- Preference learning
- History tracking
- Context maintenance

### 4. **AIResponseGeneratorService**
- Natural language responses
- Markdown formatting
- Emoji usage (when appropriate)
- Tone management (helpful, friendly, not pushy)

---

## 🔌 API Endpoints to Create/Update

### **POST /api/ai/understand-query**
```json
{
  "query": "I need a gift for my mom who loves vintage designer items",
  "context": {
    "previousQueries": [...],
    "userPreferences": {...}
  }
}

Response:
{
  "understanding": { QueryUnderstanding },
  "suggestedRefinements": [
    "Would you like to focus on bags, clothing, or accessories?",
    "What's your budget range?",
    "Any specific brands she prefers?"
  ]
}
```

### **POST /api/ai/shopping-advice**
```json
{
  "query": "vintage designer bags",
  "products": [...],
  "userContext": {...}
}

Response:
{
  "advice": "markdown formatted advice",
  "topRecommendations": [product_ids],
  "valueAnalysis": {...},
  "suggestedActions": [
    "Filter by condition: like-new",
    "Compare these 3 options",
    "Set price alert for under $150"
  ]
}
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation** (Days 1-2)
- [ ] Fix Claude API key (verify and test)
- [ ] Create AIQueryUnderstandingService
- [ ] Upgrade claudeIntentExtractor with advanced prompts
- [ ] Add conversation context tracking

### **Phase 2: Intelligence** (Days 3-4)
- [ ] Implement AIShoppingAdvisorService
- [ ] Create smart recommendation engine
- [ ] Add value assessment logic
- [ ] Build comparison explanations

### **Phase 3: Conversation** (Days 5-6)
- [ ] Add conversational context manager
- [ ] Implement follow-up question handling
- [ ] Add preference learning
- [ ] Create personalized responses

### **Phase 4: UI Integration** (Days 7-8)
- [ ] Update search UI with AI suggestions
- [ ] Add conversational chat interface
- [ ] Show AI reasoning/explanations
- [ ] Add "Ask AI" features

### **Phase 5: Optimization** (Days 9-10)
- [ ] Performance optimization
- [ ] Caching strategy
- [ ] Error handling
- [ ] A/B testing setup

---

## 💡 Key AI Prompt Strategies

### **1. Few-Shot Learning**
```typescript
const examples = [
  {
    input: "looking for laptop bag for work under 100",
    output: {
      productType: ["laptop bag", "briefcase"],
      maxPrice: 100,
      useCase: ["work", "professional"],
      // ...
    }
  },
  // More examples...
]
```

### **2. Chain-of-Thought Prompting**
```
Let's think step by step:
1. What product category? → bags
2. What specific type? → laptop bags
3. What's the use case? → work/professional
4. What's the budget? → under $100
5. What are implicit requirements? → professional style, laptop protection
```

### **3. Role-Based Prompting**
```
You are an expert personal shopping assistant with 20 years of experience
helping customers find the perfect products. You understand not just what
they say, but what they really need.
```

---

## 🔍 Success Metrics

### **Before AI Integration**
- Search success rate: ~60%
- Average time to purchase: 5+ minutes
- User satisfaction: 3.5/5
- Cart abandonment: 45%

### **After AI Integration (Target)**
- Search success rate: >85%
- Average time to purchase: <3 minutes
- User satisfaction: >4.5/5
- Cart abandonment: <25%

---

## 🎯 Example User Flows

### **Flow 1: Novice User**
```
User: "I need something"
AI: "I'd love to help! What are you shopping for today?"

User: "idk something for carrying my stuff"
AI: "Got it! Are you thinking of something for:
     • Daily use (purse, tote bag)
     • Travel (luggage, backpack)
     • Work (briefcase, laptop bag)
     • Special occasions (clutch, evening bag)"

User: "daily use"
AI: "Perfect! I'll show you popular daily bags. What's your budget range?"

User: "cheap"
AI: "I'll focus on budget-friendly options under $50 that still offer
     great quality and style!"
```

### **Flow 2: Expert User**
```
User: "Find me authentic vintage Prada bags, excellent condition minimum,
      budget $300-500, prefer neutral colors"

AI: ✓ Understood! Searching for:
    • Brand: Prada (authentic only)
    • Style: Vintage
    • Condition: Excellent or better
    • Budget: $300-$500
    • Colors: Black, beige, brown, gray

    [Shows 12 perfect matches with authenticity verification]
```

---

## 🔐 Safety & Ethics

### **Transparency**
- Always indicate when AI is involved
- Show confidence scores
- Explain reasoning
- Allow user override

### **Privacy**
- Don't store sensitive info
- Clear consent for learning preferences
- Easy data deletion
- GDPR/CCPA compliant

### **Bias Prevention**
- Test across demographics
- Avoid stereotyping
- Price-neutral recommendations
- Inclusive language

---

## 📝 Next Steps

1. **Verify Claude API** - Test with current key or get new one
2. **Start with Phase 1** - Foundation services
3. **Iterate quickly** - Ship small, test, improve
4. **Gather feedback** - Real user testing
5. **Measure impact** - Track success metrics

---

## 💰 Cost Estimation

### **Claude API Usage**
- Sonnet 3.5: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Estimated: 100 searches/day × 500 tokens avg = 50K tokens/day
- Monthly cost: ~$5-10 for moderate usage
- **Cost-effective for the value provided!**

---

## ✅ Success Criteria

- [ ] 95%+ intent understanding accuracy
- [ ] Sub-2s response times for AI queries
- [ ] 4.5+ user satisfaction rating
- [ ] 30%+ increase in successful purchases
- [ ] 50%+ reduction in "no results" searches
- [ ] Natural, helpful AI responses (qualitative)

---

**Let's build the smartest shopping assistant on the web!** 🚀🤖