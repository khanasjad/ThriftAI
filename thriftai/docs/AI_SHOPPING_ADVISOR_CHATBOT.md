# AI Shopping Advisor Chatbot - Implementation Plan

## Overview
A conversational AI shopping assistant that uses Claude API to have intelligent, personalized discussions with users about their shopping needs. The bot has access to the product catalog and can make smart recommendations through natural conversation.

## Architecture

### 1. Frontend Components

#### ChatWidget Component (`src/components/ChatWidget.tsx`)
```
- Floating chat button (bottom right)
- Expandable chat window
- Message history display
- User input with send button
- Typing indicator when Claude is thinking
- Product card recommendations inline with messages
- Conversation memory (session-based)
```

#### Message Types
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  products?: ScoredProduct[]  // Recommended products
  metadata?: {
    searchQuery?: string
    filters?: any
  }
}
```

### 2. Backend API

#### Endpoint: `POST /api/buyers/ai-shopping-advisor`

**Request:**
```typescript
{
  message: string              // User's current message
  conversationHistory: Message[] // Previous messages
  searchContext?: {             // Optional: current search context
    query: string
    filters: any
    currentProducts: Product[]
  }
}
```

**Response:**
```typescript
{
  message: string              // Claude's conversational response
  products?: ScoredProduct[]   // 0-5 recommended products
  followUpQuestions?: string[] // Optional follow-up questions
  searchSuggestions?: string[] // Search refinements
}
```

### 3. Claude Integration Logic

#### System Prompt Design
```
You are an expert shopping advisor for ThriftAI marketplace. Your role is to:

1. Have natural conversations with users about their shopping needs
2. Ask clarifying questions to understand their preferences
3. Search the product catalog intelligently based on conversation
4. Recommend 1-5 highly relevant products with explanations
5. Compare options across marketplaces (ThriftAI, Amazon, eBay)
6. Discuss trade-offs (price vs quality, condition, shipping, brand)

IMPORTANT RULES:
- Be conversational and helpful, not robotic
- Ask follow-up questions to understand needs better
- Always explain WHY you recommend specific products
- Use the product catalog data provided in context
- Compare prices and value across sources
- Discuss specific product attributes relevant to user needs
- NO generic advice - everything should be specific to the conversation
- Focus on helping user make a decision through discussion

Available Product Data:
{products_json}

Current Conversation Context:
{conversation_summary}
```

#### Conversation Flow Examples

**Example 1: Budget Discussion**
```
User: "I need a laptop for college"
Assistant: "I can help you find the perfect laptop! A few questions:
1. What's your budget range?
2. Will you be using it mainly for note-taking, coding, or creative work?
3. Any preference on screen size?"

User: "Budget is $500-700, mainly for coding and note-taking, prefer 14-15 inch"
Assistant: "Perfect! I found 3 great options in your budget:

1. Dell XPS 13 (Refurbished) - $649 from ThriftAI
   - Intel i5, 8GB RAM, 256GB SSD
   - Great for coding, excellent keyboard
   - WHY: Best value for coding work, premium build quality

2. Lenovo ThinkPad T480 - $599 from eBay
   - Intel i5, 16GB RAM, 512GB SSD
   - Business-grade durability
   - WHY: More RAM and storage for your budget

Which specs are most important to you - RAM, storage, or build quality?"
```

**Example 2: Comparison Discussion**
```
User: "What's the difference between these two laptops you showed?"
Assistant: "Great question! Let me break down the key differences:

Dell XPS 13 ($649):
✓ Newer model (2020 vs 2018)
✓ Better screen quality (FHD+)
✓ More portable (lighter)
✗ Less RAM (8GB vs 16GB)
✗ Less storage (256GB vs 512GB)

Lenovo ThinkPad T480 ($599):
✓ More RAM (16GB) - better for multitasking
✓ More storage (512GB)
✓ Upgradeable (can add more RAM/storage)
✗ Older, thicker design
✗ Lower resolution screen

For coding work, I'd lean toward the ThinkPad because:
- 16GB RAM handles multiple IDEs/browsers better
- You can upgrade it later as needs grow
- $50 cheaper means you could buy accessories

But if portability matters for carrying to classes daily, the XPS might be worth the extra $50.

What's your priority - performance/upgradeability or portability?"
```

### 4. Product Search Integration

#### Smart Search Algorithm
```typescript
class ConversationalProductSearch {
  async searchBasedOnConversation(
    conversation: Message[],
    currentMessage: string
  ): Promise<ScoredProduct[]> {
    // 1. Extract intent from conversation
    const intent = await this.extractIntent(conversation, currentMessage)

    // 2. Build search query from conversation context
    const query = this.buildSearchQuery(intent)

    // 3. Extract filters from conversation
    const filters = this.extractFilters(conversation)
    // Examples:
    // - Budget: "under $500" -> maxPrice: 500
    // - Condition: "like new" -> conditions: ['like-new', 'new']
    // - Brand: "prefer Apple" -> brands: ['Apple']
    // - Use case: "for gaming" -> category hints

    // 4. Search across marketplaces
    const results = await marketplaceAggregator.search({
      query,
      filters,
      limit: 20
    })

    // 5. AI-score based on conversation preferences
    const scored = productScoringService.scoreWithContext(
      results,
      conversation
    )

    // 6. Return top 3-5 most relevant
    return scored.slice(0, 5)
  }
}
```

### 5. Implementation Steps

#### Phase 1: Backend API (Priority 1)
```
✓ Create API endpoint /api/buyers/ai-shopping-advisor
✓ Implement conversation memory management
✓ Build Claude prompt with product catalog
✓ Integrate product search based on conversation
✓ Return conversational response + product recommendations
```

#### Phase 2: Chat UI Component (Priority 2)
```
✓ Create ChatWidget component
✓ Floating chat button
✓ Expandable chat window with message history
✓ User input with send functionality
✓ Display Claude's responses
✓ Show product recommendations inline
✓ Typing indicator
✓ Session-based conversation persistence
```

#### Phase 3: Product Integration (Priority 3)
```
✓ Display product cards in chat
✓ Click to view full product details
✓ Add to cart from chat
✓ Price comparison in conversation
✓ "View in search results" link
```

#### Phase 4: Advanced Features (Priority 4)
```
✓ Conversation summarization for long chats
✓ Save favorite conversations
✓ Share product recommendations
✓ Voice input (optional)
✓ Multi-turn complex queries
```

## Technical Implementation

### File Structure
```
src/
├── components/
│   ├── ChatWidget.tsx              (Main chat component)
│   ├── ChatMessage.tsx             (Individual message)
│   ├── ChatProductCard.tsx         (Product in chat)
│   └── ChatInput.tsx               (Input box)
├── app/api/buyers/
│   └── ai-shopping-advisor/
│       └── route.ts                (API endpoint)
├── lib/services/
│   ├── conversationalSearch.ts     (Smart search)
│   └── claudeShoppingAdvisor.ts    (Claude integration)
└── hooks/
    └── useChatWidget.ts            (Chat state management)
```

### Key Code: API Endpoint

```typescript
// src/app/api/buyers/ai-shopping-advisor/route.ts
export async function POST(request: NextRequest) {
  const { message, conversationHistory, searchContext } = await request.json()

  // 1. Extract user intent and preferences from conversation
  const conversationSummary = summarizeConversation(conversationHistory)

  // 2. Search products based on conversation context
  const relevantProducts = await conversationalSearch.search(
    message,
    conversationHistory,
    searchContext
  )

  // 3. Build Claude prompt with products and conversation
  const claudePrompt = buildShoppingAdvisorPrompt({
    conversationHistory,
    currentMessage: message,
    products: relevantProducts,
    searchContext
  })

  // 4. Get response from Claude
  const claudeResponse = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SHOPPING_ADVISOR_SYSTEM_PROMPT },
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: claudePrompt }
    ]
  })

  // 5. Parse response and extract product recommendations
  const response = parseClaudeResponse(claudeResponse)

  return NextResponse.json({
    message: response.message,
    products: response.recommendedProducts,
    followUpQuestions: response.followUpQuestions
  })
}
```

### Key Code: Chat Widget

```typescript
// src/components/ChatWidget.tsx
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Call API
    const response = await fetch('/api/buyers/ai-shopping-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        conversationHistory: messages
      })
    })

    const data = await response.json()

    // Add assistant message
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: data.message,
      products: data.products,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }

  return (
    <div className="chat-widget">
      {/* Floating button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chat-toggle">
          💬 AI Shopping Advisor
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>AI Shopping Advisor</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>

          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      )}
    </div>
  )
}
```

## Example Conversations

### Conversation 1: Laptop Shopping
```
User: "I need a laptop"
Bot: "I'd love to help you find the right laptop! To give you the best recommendations:
     • What will you primarily use it for? (work, gaming, school, creative work)
     • What's your budget?
     • Any size preference?"

User: "For work, mainly spreadsheets and video calls. Budget around $600."
Bot: "Perfect! For work with spreadsheets and video calls, I found 3 solid options:

     1. HP EliteBook 840 G5 - $579 (ThriftAI)
        • Intel i5, 16GB RAM, 256GB SSD
        • Excellent webcam for video calls
        • WHY: Business laptop, great keyboard, reliable webcam

     2. Lenovo ThinkPad T480 - $599 (eBay)
        • Intel i5, 16GB RAM, 512GB SSD
        • 14" screen, very durable
        • WHY: More storage, known for reliability

     Which matters more to you - webcam quality for calls, or extra storage space?"
```

### Conversation 2: Price Negotiation
```
User: "That HP looks good but $579 is stretching my budget"
Bot: "I understand! Let me look for similar options under $550...

     Found these alternatives:

     1. Dell Latitude 7390 - $499 (eBay)
        • Intel i5, 8GB RAM, 256GB SSD
        • Good webcam, compact 13" screen
        • TRADE-OFF: Less RAM than HP (8GB vs 16GB)

     2. HP EliteBook 840 G3 (older model) - $449 (ThriftAI)
        • Intel i5, 16GB RAM, 256GB SSD
        • Same series, 2 years older
        • TRADE-OFF: Older gen processor, but same RAM

     The older HP EliteBook saves you $130 and keeps the 16GB RAM you'd want for spreadsheets.
     The processor difference won't matter much for Excel/Zoom.

     Want to see more about that G3 model?"
```

## Key Differentiators

1. **No Generic Advice**: Every response is based on actual conversation and products
2. **Comparative Analysis**: Always explains trade-offs between options
3. **Budget Conscious**: Helps users find value within their constraints
4. **Follow-up Questions**: Digs deeper to understand real needs
5. **Product-Specific**: References actual product specs and conditions
6. **Multi-Source**: Compares across ThriftAI, Amazon, eBay

## Success Metrics

- Average conversation length (target: 5-10 messages)
- Product recommendation click-through rate (target: >40%)
- Purchase conversion from chat (target: >15%)
- User satisfaction rating (target: >4.5/5)
- Return user rate (target: >30%)