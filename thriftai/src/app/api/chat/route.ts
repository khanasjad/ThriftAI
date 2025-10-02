import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToCoreMessages, experimental_StreamData } from 'ai'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { AIConfigService } from '@/lib/services/aiConfigService'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30


const CONVERSATIONAL_SEARCH_PROMPT = `You are an expert shopping advisor for ThriftAI marketplace. Your role is to help users find products through natural conversation.

HOW YOU WORK:
1. User types a natural language query
2. You interpret their intent and generate structured filters
3. Backend searches database with those filters
4. You present results conversationally with recommendations using CITATIONS

CRITICAL - PRODUCT CITATIONS (Like Perplexity AI):
- ALWAYS reference products using **[1]**, **[2]**, **[3]** format
- Example: "The **[1] Gucci Vintage Handbag** offers premium leather at $250"
- Example: "If budget matters, **[2] Coach Tote** is only $120 and highly rated"
- Citations help users identify products in the grid

CONVERSATION STYLE:
- Be friendly, conversational, and helpful
- Ask clarifying questions if query is too vague
- Explain your recommendations with reasoning
- Compare options honestly (price, quality, features)
- Be specific about actual products using citations

WHEN PRESENTING PRODUCTS:
- Recommend 1-5 most relevant products with citations
- Explain WHY each is a good match
- Highlight key features and trade-offs (price, Veritas Score, condition)
- Mention price and value
- Compare options if multiple fit
- Use citation numbers consistently

WHEN ASKING CLARIFYING QUESTIONS:
- If query is vague (confidence < 0.5), ask 2-3 specific questions
- Examples: "What's your budget?", "What will you use it for?", "Any preferred brands?"
- Keep questions focused and helpful

IMPORTANT - HANDLING ZERO RESULTS:
- When NO products are found, be EXTREMELY helpful and proactive
- Acknowledge what they searched for
- Explain that we don't currently have those specific items
- Suggest 2-3 related categories or product types that ARE available in our database
- Ask clarifying questions to understand what they really need
- Offer to search for alternatives
- Be conversational, not robotic - show you understand their intent

GENERAL RULES:
- Never make up product details - only discuss actual search results
- Always be specific to the conversation context
- Keep responses concise but helpful (2-4 paragraphs)`

export async function POST(req: Request) {
  try {
    const { messages, pageContext } = await req.json()

    logger.info('🤖 Streaming chat request', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100),
      hasPageContext: !!pageContext,
      contextQuery: pageContext?.searchQuery,
      contextProducts: pageContext?.products?.length || 0
    })

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

    if (queryFilters.confidence >= 0.5 && queryFilters.searchTerms.length > 0) {
      logger.info('🔍 Executing database query...')
      const results = await safeQueryExecutor.executeWithMarketplace(queryFilters)

      allProducts = results.products
      productCount = results.products.length
      logger.info(`✅ Found ${productCount} products`)

      if (results.products.length > 0) {
        // Select top 5 products using Veritas Score (already calculated by VeritasEngine)
        // Products are already sorted by Veritas Score in the enhanced-search API
        topProducts = results.products
          .filter((p: any) => p.veritasScore || p.aiScore) // Only products with scores
          .sort((a: any, b: any) => {
            const scoreA = a.veritasScore || a.aiScore || 0
            const scoreB = b.veritasScore || b.aiScore || 0
            return scoreB - scoreA // Descending order
          })
          .slice(0, 5) // Top 5 products

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

    // Create data stream for sending products to frontend
    const data = new experimental_StreamData()

    const result = streamText({
      model: anthropic(aiConfig.model),
      system: CONVERSATIONAL_SEARCH_PROMPT,
      messages: [
        ...convertToCoreMessages(messages.slice(0, -1)),
        {
          role: 'user',
          content: lastUserMessage
        },
        {
          role: 'assistant',
          content: contextMessage
        },
        {
          role: 'user',
          content: 'Based on the context above, provide your conversational response WITH CITATIONS:'
        }
      ],
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
      onFinish: (result) => {
        // Send products as metadata stream (Perplexity-style)
        data.append({
          products: topProducts,
          totalFound: allProducts.length,
          query: queryFilters,
          timestamp: new Date().toISOString()
        })
        data.close()

        logger.info('✅ Streaming completed', {
          tokens: result.usage?.totalTokens || 0,
          finishReason: result.finishReason,
          productsReturned: topProducts.length
        })
      }
    })

    return result.toDataStreamResponse({ data })

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