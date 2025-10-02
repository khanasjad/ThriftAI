import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToCoreMessages } from 'ai'
import { structuredQueryGenerator } from '@/lib/services/structuredQueryGenerator'
import { safeQueryExecutor } from '@/lib/services/safeQueryExecutor'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const CONVERSATIONAL_SEARCH_PROMPT = `You are an expert shopping advisor for ThriftAI marketplace. Your role is to help users find products through natural conversation.

HOW YOU WORK:
1. User types a natural language query
2. You interpret their intent and generate structured filters
3. Backend searches database with those filters
4. You present results conversationally with recommendations

CONVERSATION STYLE:
- Be friendly, conversational, and helpful
- Ask clarifying questions if query is too vague
- Explain your recommendations with reasoning
- Compare options honestly (price, quality, features)
- Be specific about actual products, not generic advice

WHEN PRESENTING PRODUCTS:
- Recommend 1-5 most relevant products
- Explain WHY each is a good match
- Highlight key features and trade-offs
- Mention price and value
- Compare options if multiple fit

WHEN ASKING CLARIFYING QUESTIONS:
- If query is vague (confidence < 0.5), ask 2-3 specific questions
- Examples: "What's your budget?", "What will you use it for?", "Any preferred brands?"
- Keep questions focused and helpful

IMPORTANT:
- Never make up product details - only discuss actual search results
- If no products found, suggest broadening search or different terms
- Always be specific to the conversation context
- Keep responses concise (2-4 paragraphs max)`

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

    // Step 2: Execute safe database query
    let productsContext = ''
    let productCount = 0

    if (queryFilters.confidence >= 0.5 && queryFilters.searchTerms.length > 0) {
      logger.info('🔍 Executing database query...')
      const results = await safeQueryExecutor.executeWithMarketplace(queryFilters)

      productCount = results.products.length
      logger.info(`✅ Found ${productCount} products`)

      if (results.products.length > 0) {
        // Format products for Claude
        productsContext = `\n\nAVAILABLE PRODUCTS (${results.products.length} found):\n` +
          results.products.slice(0, 10).map((p: any, idx: number) => {
            const price = p.price || p.totalCost || 0
            const name = p.name || p.title || 'Unknown'
            const brand = p.brand || 'Various'
            const condition = p.condition || 'Good'
            const rating = p.rating || p.reviews?.rating || 0

            return `[Product ${idx + 1}] ${name}
  - Brand: ${brand}
  - Price: $${price}
  - Condition: ${condition}
  - Rating: ${rating}/5
  - Category: ${p.category || 'General'}`
          }).join('\n\n')
      } else {
        productsContext = `\n\nNo products found matching the filters. Suggest the user:
1. Broaden their search (remove some filters)
2. Try different keywords
3. Adjust price range if applicable`
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

    const result = streamText({
      model: anthropic('claude-3-haiku-20240307'),
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
          content: 'Based on the context above, provide your conversational response:'
        }
      ],
      temperature: 0.7,
      maxTokens: 1000,
      onFinish: (result) => {
        logger.info('✅ Streaming completed', {
          tokens: result.usage?.totalTokens || 0,
          finishReason: result.finishReason
        })
      }
    })

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