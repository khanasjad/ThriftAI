import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToCoreMessages } from 'ai'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { AIConfigService } from '@/lib/services/aiConfigService'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Configuration constants
const CHAT_CONFIG = {
  TOP_PRODUCTS_COUNT: 5,
  MIN_CONFIDENCE_THRESHOLD: 0.5
}

const CONVERSATIONAL_SEARCH_PROMPT = `You are an expert shopping advisor for ThriftAI marketplace. Your role is to help users find products through natural conversation, like Perplexity AI does for search.

HOW YOU WORK:
1. User types a natural language query
2. You interpret their intent and generate structured filters
3. Backend searches database with those filters
4. You present results conversationally with CITATIONS and clear next steps

CRITICAL - PRODUCT CITATIONS (Like Perplexity AI):
- ALWAYS reference products using **[1]**, **[2]**, **[3]** format
- Example: "The **[1] Gucci Vintage Handbag** offers premium leather at $250"
- Example: "If budget matters, **[2] Coach Tote** is only $120 and highly rated"
- Citations appear as green badges that users can click
- Use citations inline when discussing specific products
- EVERY product you mention MUST have a citation number

RESPONSE STRUCTURE (Like Perplexity):
**ALWAYS start with**: "I analyzed [X] products for [query]..."

Then follow this structure:
1. **Opening**: Brief summary of what you found (1-2 sentences starting with "I analyzed...")
2. **Analysis**: Discuss top 3-5 products with citations, comparing key features
3. **Recommendations**: Clear guidance on which product to choose based on different needs
4. **Next Steps**: End with actionable suggestions

**GOOD EXAMPLE:**
"I analyzed 15 laptops for gaming and found some excellent options.

The **[1] ASUS ROG Strix** stands out with its RTX 4060 GPU and 165Hz display for $1,299. It's the best performer in this range. If you need more power, **[2] MSI Raider** offers RTX 4070 for $1,599, though the battery life is shorter.

For budget-conscious gamers, **[3] Lenovo Legion 5** at $899 delivers solid performance with an RTX 3060, making it the best value pick.

**My recommendation:** Go with **[1]** for balanced performance, **[2]** if you want maximum power, or **[3]** if budget is key.

Would you like me to explain more about the cooling systems in these models?"

**BAD EXAMPLE (Don't do this):**
"Here are some laptops I found:
- ASUS ROG Strix - good for gaming
- MSI Raider - also good
- Lenovo Legion 5 - cheaper option

Let me know if you need help!"

CONVERSATION STYLE:
- Be friendly, conversational, and insightful
- Start responses with context: "I found 13 laptops for you" or "Based on your search for vintage bags..."
- Use natural language, not robotic lists
- Compare products meaningfully: "**[1]** offers better performance, but **[2]** is $200 cheaper"
- Show your reasoning: "I recommend **[1]** because..." or "**[3]** stands out for its..."

WHEN PRESENTING PRODUCTS:
- Focus on top 3-5 most relevant products with citations
- Explain WHY each is a good match (be specific!)
- Highlight trade-offs: price vs. quality, features vs. simplicity, brand vs. value
- Use Veritas Score to indicate quality/trust: "**[1]** has a high Veritas Score of 88/100"
- Compare options: "While **[1]** costs more, **[2]** offers similar features at half the price"
- End with clear recommendation or choice framework

WHEN ASKING CLARIFYING QUESTIONS:
- If query is vague (confidence < 0.5), ask 2-3 specific questions
- Examples: "What's your budget?", "What will you use it for?", "Any preferred brands?"
- Keep questions focused and conversational

HANDLING ZERO RESULTS:
- When NO products are found, be EXTREMELY helpful
- Acknowledge: "I couldn't find vintage designer bags in our current inventory"
- Suggest alternatives: "However, we have great options in modern designer handbags and luxury accessories"
- Ask clarifying questions: "Would you like to explore those instead, or should I help you find something similar?"
- Be empathetic and solution-oriented

CONVERSATION FLOW:
- Each response should invite continuation
- End with questions or suggestions: "Would you like to see more budget options?" or "Should I explain the features of **[1]** in detail?"
- Maintain context from previous messages
- Build on user's preferences

GENERAL RULES:
- Never make up product details - only discuss actual search results
- Keep responses concise but insightful (2-5 paragraphs)
- Use markdown for structure (bold, lists, etc.)
- Be specific, not generic
- Show personality and expertise`

export async function POST(req: Request) {
  try {
    // Read the body as text first for debugging
    let rawBody = ''
    let parsedBody
    try {
      rawBody = await req.text()
      logger.info('📥 Raw request body length:', rawBody.length)
      logger.info('📥 Raw request body preview:', rawBody.substring(0, 500))

      if (!rawBody || rawBody.trim() === '') {
        logger.error('❌ Empty request body received')
        return new Response(
          JSON.stringify({
            error: 'Empty request body',
            message: 'No data received in request'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      parsedBody = JSON.parse(rawBody)
    } catch (jsonError) {
      logger.error('❌ JSON parsing failed:', {
        error: jsonError instanceof Error ? jsonError.message : String(jsonError),
        rawBodyLength: rawBody.length,
        rawBodyPreview: rawBody.substring(0, 200)
      })
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          message: jsonError instanceof Error ? jsonError.message : 'Failed to parse JSON',
          bodyPreview: rawBody.substring(0, 100)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages, pageContext } = parsedBody

    if (!messages || !Array.isArray(messages)) {
      logger.error('❌ Invalid messages format:', { messages })
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          message: 'messages must be an array'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const lastMessage = messages[messages.length - 1]?.content || ''

    logger.info('🤖 Streaming chat request', {
      messageCount: messages.length,
      lastMessage: lastMessage?.substring(0, 100),
      hasPageContext: !!pageContext,
      contextQuery: pageContext?.searchQuery,
      contextProducts: pageContext?.products?.length || 0
    })

    // Log if this is an auto-analysis
    if (lastMessage.startsWith('Analyze and compare')) {
      logger.info('✨ AUTO-ANALYSIS TRIGGERED FOR:', lastMessage)
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    // Step 1: Generate structured query from user message
    logger.info('📝 Generating structured query...')
    const queryFilters = await structuredQueryGenerator.generateQuery(
      lastUserMessage,
      prisma,
      messages.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content }))
    )

    logger.info('✅ Structured query generated', {
      searchTerms: queryFilters.searchTerms,
      category: queryFilters.category,
      confidence: queryFilters.confidence,
      needsClarification: !!queryFilters.needsClarification
    })

    // Step 2: Execute safe database query with Veritas scoring
    let productsContext = ''
    let productCount = 0
    let topProducts: any[] = []
    let allProducts: any[] = []

    if (queryFilters.confidence >= CHAT_CONFIG.MIN_CONFIDENCE_THRESHOLD && queryFilters.searchTerms.length > 0) {
      logger.info('🔍 Executing database query...')
      const results = await safeQueryExecutor.executeWithMarketplace(queryFilters)

      allProducts = results.products
      productCount = results.products.length
      logger.info(`✅ Found ${productCount} products`)

      if (results.products.length > 0) {
        // Select top products using Veritas Score (already calculated by VeritasEngine)
        // Products are already sorted by Veritas Score in the enhanced-search API
        topProducts = results.products
          .filter((p: any) => p.veritasScore || p.aiScore) // Only products with scores
          .sort((a: any, b: any) => {
            const scoreA = a.veritasScore || a.aiScore || 0
            const scoreB = b.veritasScore || b.aiScore || 0
            return scoreB - scoreA // Descending order
          })
          .slice(0, CHAT_CONFIG.TOP_PRODUCTS_COUNT)

        logger.info(`🎯 Selected top ${topProducts.length} products using Veritas scoring`, {
          scores: topProducts.map(p => ({ name: p.name, score: p.veritasScore || p.aiScore }))
        })

        // Format products for Claude with citation numbers
        productsContext = `\n\nTOP PRODUCTS (${topProducts.length} selected from ${results.products.length} found):\n` +
          topProducts.map((p: any, idx: number) => {
            const price = p.price || p.totalCost || 0
            const name = p.name || p.title || 'Unknown'
            const brand = p.brand || 'Various'
            const condition = p.condition || 'Good'
            const rating = p.rating || p.reviews?.rating || 0
            const veritasScore = p.veritasScore || p.aiScore || 0

            return `[${idx + 1}] ${name}
  - Brand: ${brand}
  - Price: $${price}
  - Condition: ${condition}
  - Rating: ${rating}/5
  - Veritas Score: ${veritasScore}/100 (Quality indicator)
  - Category: ${p.category || 'General'}

IMPORTANT: Reference this as **[${idx + 1}]** in your response`
          }).join('\n\n')
      } else {
        // When no products found, get available categories to suggest alternatives
        const availableCategories = await prisma.product.groupBy({
          by: ['category'],
          _count: { category: true },
          where: { isAvailable: true }
        })

        const categoriesList = availableCategories
          .map((c: any) => `${c.category} (${c._count.category} products)`)
          .join(', ')

        productsContext = `\n\nNO PRODUCTS FOUND for this specific query.

AVAILABLE CATEGORIES IN OUR DATABASE:
${categoriesList}

YOUR TASK:
1. Acknowledge what the user searched for
2. Explain we don't currently have those specific items
3. Based on their original intent, suggest 2-3 related categories from the list above
4. Ask what they're really looking for to help narrow down alternatives
5. Be conversational and helpful, not robotic`
      }
    } else {
      productsContext = `\n\nQuery is too vague (confidence: ${queryFilters.confidence}). Please ask clarifying questions:\n${queryFilters.needsClarification || 'What are you looking for specifically?'}`
    }

    // Step 3: Stream conversational response
    logger.info('💬 Streaming conversational response...')

    // Build page context information
    let pageContextInfo = ''
    if (pageContext?.searchQuery || pageContext?.products?.length > 0) {
      pageContextInfo = `\n\nCURRENT PAGE CONTEXT:
User is currently viewing a search results page with:
- Search Query: "${pageContext.searchQuery || 'none'}"
- Visible Products: ${pageContext.products?.length || 0} results
- Total Results: ${pageContext.totalResults || 'unknown'}
${pageContext.products && pageContext.products.length > 0 ? `
Top products currently visible to user:
${pageContext.products.slice(0, 5).map((p: any, i: number) => `${i + 1}. ${p.name || p.title} - $${p.price || p.totalCost} (${p.category || 'General'})`).join('\n')}
` : ''}`
    }

    // Build context message
    const contextMessage = `QUERY FILTERS GENERATED:
- Search Terms: ${queryFilters.searchTerms.join(', ') || 'none'}
- Category: ${queryFilters.category || 'any'}
- Price Range: ${queryFilters.minPrice || 0} - ${queryFilters.maxPrice || 'unlimited'}
- Confidence: ${(queryFilters.confidence * 100).toFixed(0)}%
${pageContextInfo}
${productsContext}

Now provide a conversational response that:
1. Addresses the user's query naturally
2. ${productCount > 0 ? `Recommends the most relevant products with specific reasons` : 'Asks helpful clarifying questions'}
3. ${productCount > 0 ? `Explains trade-offs and comparisons` : 'Guides them to refine their search'}
4. References what the user is currently viewing if relevant
5. Stays specific to this conversation context`

    // Get AI configuration from database (no hardcoding)
    const aiConfig = await AIConfigService.getConfig('chat')

    logger.info('🚀 Starting streaming response...', {
      hasProducts: topProducts.length > 0,
      productCount: topProducts.length,
      model: aiConfig.model
    })

    // Only include conversation history if there are previous messages
    const previousMessages = messages.slice(0, -1)

    // Filter out any invalid messages and ensure proper structure
    const validPreviousMessages = previousMessages.filter((m: any) =>
      m && typeof m === 'object' && m.role && m.content
    )

    const conversationHistory = validPreviousMessages.length > 0
      ? convertToCoreMessages(validPreviousMessages)
      : []

    logger.info('📨 Message history', {
      totalMessages: messages.length,
      previousCount: previousMessages.length,
      validCount: validPreviousMessages.length
    })

    const result = streamText({
      model: anthropic(aiConfig.model),
      system: CONVERSATIONAL_SEARCH_PROMPT,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: `${lastUserMessage}\n\n${contextMessage}\n\nBased on the context above, provide your conversational response WITH CITATIONS:`
        }
      ],
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
      onFinish: (result) => {
        logger.info('✅ Streaming completed', {
          tokens: result.usage?.totalTokens || 0,
          finishReason: result.finishReason,
          productsReturned: topProducts.length,
          textLength: result.text?.length || 0
        })
      }
    })

    logger.info('📤 Returning text stream response')

    return result.toTextStreamResponse()

  } catch (error) {
    logger.error('❌ Streaming chat error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}