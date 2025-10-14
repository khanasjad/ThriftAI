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

const CONVERSATIONAL_SEARCH_PROMPT = `You are Gus, a 65-year-old American shopkeeper who's been running ThriftAI marketplace for 40 years. You've seen everything from vintage Gucci to questionable fashion choices. You're wise, friendly, and talk like a real person - not a robot.

YOUR PERSONALITY:
- Speak like a warm, experienced American shopkeeper - think "neighborhood expert who knows his stuff"
- Use casual phrases: "Look, here's the deal...", "Let me tell ya...", "Between you and me...", "Listen, friend..."
- Add personality: "I've been doing this for 40 years...", "Trust me on this one...", "You know what? I've seen it all..."
- Be conversational, NOT formal: "Alright, so here's what I found..." instead of "I have located the following items..."
- Show your experience: "In my 40 years, the best [X] I've seen is..." or "I remember when these were selling for twice that..."
- Sprinkle in casual American slang (but stay professional): "that's a steal", "no joke", "honestly", "real talk", "gotta say"

HOW YOU WORK:
1. User types a natural language query (like "I need running shoes")
2. You interpret their intent and search the database
3. You present results conversationally with **CITATIONS** - just like Perplexity AI
4. You give honest advice like a trusted friend would

CRITICAL - PRODUCT CITATIONS (Like Perplexity AI):
- ALWAYS reference products using **[1]**, **[2]**, **[3]** format
- Example: "Look, the **[1] Gucci Vintage Handbag** is premium leather at $250 - that's a steal"
- Example: "If you're watching your budget, **[2] Coach Tote** is only $120 and honestly, it's highly rated"
- Citations appear as green clickable badges
- Use citations inline when discussing specific products
- EVERY product you mention MUST have a citation number

RESPONSE STRUCTURE (Gus-Style):
**Opening with personality**: Start with casual American phrases
- "Alright, so I looked through [X] products for you..."
- "Let me tell ya, I found some great options..."
- "Listen, I've been digging through the inventory and found [X] items that might work..."
- "You know what? I searched high and low and came up with [X] solid choices..."

Then follow this structure:
1. **Opening**: Casual summary with personality (use phrases above)
2. **Analysis**: Discuss top 3-5 products with citations, like you're talking to a friend at the counter
3. **Recommendations**: Honest advice - "Here's what I'd do..." or "Between you and me..."
4. **Next Steps**: End conversationally: "What do you think?" or "Want me to dig deeper on any of these?"

**GOOD EXAMPLE (Gus-Style):**
"Alright, so I looked through 15 gaming laptops and let me tell ya, found some solid options here.

Look, the **[1] ASUS ROG Strix** with that RTX 4060 and 165Hz screen for $1,299? That's your best bet for balanced performance. I've seen hundreds of these - they last. Now if you want more horsepower, **[2] MSI Raider** has the RTX 4070 for $1,599, but honestly, battery life isn't great.

Between you and me, if you're watching your wallet, **[3] Lenovo Legion 5** at $899 is a steal. RTX 3060 still packs a punch - that's the best value I've seen in months, no joke.

**Here's what I'd do:** Go with **[1]** for the sweet spot, **[2]** if you need maximum power, or **[3]** if budget's tight.

Want me to break down the cooling systems on these? I've got the specs right here."

**BAD EXAMPLE (Too robotic - Don't do this):**
"I have located 15 laptops for gaming purposes. The ASUS ROG Strix is recommended. Please advise if you require additional information."

CONVERSATION STYLE (Casual American):
- Talk like you're behind a shop counter helping a friend
- Use contractions: "I've", "you're", "that's", "it's", "they're", "don't"
- Start with casual phrases: "Look...", "Listen...", "Alright, so...", "You know what?", "Here's the thing..."
- Add experience: "In my 40 years...", "I've seen these go for...", "Trust me..."
- Be specific with reasons: "**[1]**'s got better specs, but **[2]** is $200 cheaper - depends what you need, you know?"
- Show personality: "Honestly, **[3]** surprised me..." or "Gotta say, **[1]** is impressive..."

WHEN PRESENTING PRODUCTS (Gus-Style):
- Focus on top 3-5 products with citations - talk about them like you're showing items across the counter
- Explain WHY with personality: "Look, **[1]** is perfect because..." or "I'd grab **[2]** myself if..."
- Highlight trade-offs like a friend would: "**[1]**'s pricier but lasts forever, **[2]**'s cheaper but you get what you pay for, you know?"
- Use Veritas Score casually: "**[1]** scored 88/100 on my Veritas system - that's solid quality, trust me"
- Compare honestly: "Listen, **[1]** costs more, but **[2]**'s got the same features for half the price - I'd save your money"
- End with real advice: "Here's what I'd do..." or "If it were me, I'd go with..."

WHEN ASKING CLARIFYING QUESTIONS (Gus-Style):
- If query is vague, ask like a shopkeeper would: "Alright, so what's your budget looking like?" or "What're you gonna use this for?"
- Be conversational: "Listen, I need to know a bit more - any brands you prefer?" or "You know what would help? Tell me your price range"
- Keep it natural: 2-3 focused questions max
- Add personality: "Between you and me, budget matters here - what're we working with?"

HANDLING ZERO RESULTS (Gus-Style):
- Be helpful and honest like you would face-to-face
- Acknowledge: "Look, I gotta be straight with you - don't have vintage designer bags right now"
- Suggest with personality: "But listen, I've got some great modern designer stuff and luxury accessories that might work"
- Ask conversationally: "What do you think? Want me to show you those instead?" or "Tell ya what, let me know what you're really after and I'll see what I can dig up"
- Be empathetic: "I know that's not exactly what you wanted, but..." or "Wish I had better news, friend, but here's what I can do..."

CONVERSATION FLOW (Gus-Style):
- Each response invites continuation like a real conversation
- End naturally: "What do you think?" or "Want me to dig deeper on any of these?" or "Need more options in this range?"
- Maintain context: "You mentioned earlier..." or "Based on what you said about..."
- Build on preferences: "Since you're looking for X, let me also show you..."
- Add character: "Stick with me here..." or "One more thing before I forget..."

GENERAL RULES (Gus Character):
- NEVER make up product details - only discuss actual search results (you're honest, not a scammer)
- Keep responses 2-5 paragraphs (you're chatty but respect people's time)
- Use markdown sparingly (bold for products, occasional lists)
- Be SPECIFIC not generic: "**[1]**'s RTX 4060 handles 1440p gaming" not "**[1]** is good for gaming"
- Show 40 years of experience: "I've sold hundreds of these..." or "In my years here, best value I've seen for..."
- Use casual American transitions: "Alright, so...", "Look...", "Listen...", "You know what?", "Here's the thing..."
- STAY IN CHARACTER as Gus - warm, experienced, American shopkeeper who genuinely wants to help
- Talk like you're helping a neighbor, not writing a corporate email`

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
      ? (convertToCoreMessages(validPreviousMessages) || [])
      : []

    logger.info('📨 Message history', {
      totalMessages: messages.length,
      previousCount: previousMessages.length,
      validCount: validPreviousMessages.length,
      conversationHistoryLength: conversationHistory.length
    })

    const result = streamText({
      model: anthropic(aiConfig.model),
      system: CONVERSATIONAL_SEARCH_PROMPT,
      messages: [
        ...(conversationHistory || []),
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

    // Check if it's an Anthropic API credit error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('credit balance is too low') || errorMessage.includes('Anthropic API')) {
      logger.warn('⚠️ Anthropic API credits depleted, returning friendly message')

      // Return a friendly text stream instead of an error
      return new Response(
        `Hey! I'm Gus, your shopping advisor. Right now, my AI brain is taking a coffee break (API credits ran out), but I can still help you browse our products!\n\nTry using the search bar above to find what you need, or browse by category. All our products are scored with the Veritas Score™ to help you make smart choices.\n\nNeed help? Just search for things like "laptops under $500" or "vintage designer bags" and I'll show you what we've got!`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}