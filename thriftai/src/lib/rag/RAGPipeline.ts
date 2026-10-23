/**
 * RAG Pipeline
 *
 * Complete orchestration of Retrieval-Augmented Generation system.
 * Integrates all components into a production-ready search pipeline.
 *
 * Pipeline Flow:
 * 1. Multi-source retrieval (vector + SQL + API)
 * 2. Reciprocal Rank Fusion
 * 3. Cross-encoder reranking
 * 4. Context assembly with conversation memory
 * 5. LLM response generation
 * 6. Conversation persistence
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { logger } from '@/lib/logger';
import { multiSourceRetriever } from './MultiSourceRetriever';
import { reranker } from './Reranker';
import { llmOrchestrator } from '@/lib/llm/LLMOrchestrator';
import { conversationStore } from '@/lib/memory/ConversationStore';
import { Document, RAGContext } from './types';

export interface SearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  filters?: {
    priceRange?: { min: number; max: number };
    categories?: string[];
    brands?: string[];
    condition?: string[];
  };
  options?: {
    limit?: number;
    enableReranking?: boolean;
    enableConversation?: boolean;
    temperature?: number;
    complexity?: 'simple' | 'medium' | 'complex' | 'expert';
  };
}

export interface SearchResult {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  description: string;
  score: number;
  aiScore?: number;
  condition?: string;
  imageUrl?: string;
  inStock: boolean;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  conversationId?: string;
  metadata: {
    totalResults: number;
    processingTime: number;
    sources: string[];
    reranked: boolean;
    llmModel?: string;
    llmCost?: number;
  };
}

export interface ChatRequest {
  message: string;
  userId: string;
  conversationId?: string;
  includeProducts?: boolean;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  products?: SearchResult[];
  metadata: {
    processingTime: number;
    llmModel: string;
    llmCost: number;
    contextMessages: number;
  };
}

export class RAGPipeline {
  private config: {
    defaultLimit: number;
    enableReranking: boolean;
    enableConversation: boolean;
    retrievalLimit: number;
    rerankTopK: number;
    contextMessageLimit: number;
  };

  constructor(config?: Partial<typeof RAGPipeline.prototype.config>) {
    this.config = {
      defaultLimit: 20,
      enableReranking: true,
      enableConversation: true,
      retrievalLimit: 50,
      rerankTopK: 10,
      contextMessageLimit: 5,
      ...config
    };

    logger.info('RAG Pipeline initialized', { config: this.config });
  }

  /**
   * Execute complete RAG search pipeline
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      query,
      userId,
      sessionId,
      filters,
      options = {}
    } = request;

    try {
      logger.info('RAG search started', { query, userId, sessionId });

      // Step 1: Multi-source retrieval
      const retrievalResult = await multiSourceRetriever.retrieve({
        query,
        limit: options.limit || this.config.retrievalLimit,
        filters
      });

      logger.debug('Multi-source retrieval completed', {
        totalResults: retrievalResult.documents.length,
        sources: retrievalResult.totalSources
      });

      // Step 2: Reranking (if enabled)
      let finalDocuments = retrievalResult.documents;
      const shouldRerank = options.enableReranking ?? this.config.enableReranking;

      if (shouldRerank && finalDocuments.length > 0) {
        const rerankedDocs = await reranker.getTopK(
          query,
          finalDocuments,
          this.config.rerankTopK
        );
        finalDocuments = rerankedDocs;

        logger.debug('Reranking completed', {
          topResults: finalDocuments.length
        });
      }

      // Step 3: Convert to search results
      const results = this.convertToSearchResults(
        finalDocuments.slice(0, options.limit || this.config.defaultLimit)
      );

      // Step 4: Generate answer (optional, if user wants conversational response)
      let answer: string | undefined;
      let conversationId: string | undefined;
      let llmModel: string | undefined;
      let llmCost: number | undefined;

      const shouldConverse = options.enableConversation ?? this.config.enableConversation;

      if (shouldConverse && userId) {
        const chatResult = await this.generateAnswer({
          query,
          userId,
          sessionId,
          documents: finalDocuments,
          complexity: options.complexity
        });

        answer = chatResult.answer;
        conversationId = chatResult.conversationId;
        llmModel = chatResult.llmModel;
        llmCost = chatResult.llmCost;
      }

      const processingTime = Date.now() - startTime;

      logger.info('RAG search completed', {
        query,
        resultsCount: results.length,
        reranked: shouldRerank,
        hasAnswer: !!answer,
        processingTime
      });

      return {
        query,
        results,
        answer,
        conversationId,
        metadata: {
          totalResults: results.length,
          processingTime,
          sources: Array.from(new Set(finalDocuments.map(d => d.source))),
          reranked: shouldRerank,
          llmModel,
          llmCost
        }
      };
    } catch (error) {
      logger.error('RAG search failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Execute conversational chat with product recommendations
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const { message, userId, conversationId, includeProducts = true, options = {} } = request;

    try {
      logger.info('Chat request started', { userId, conversationId });

      // Step 1: Get or create conversation
      const activeConversationId = conversationId ||
        await conversationStore.createConversation(userId, {
          source: 'rag_pipeline',
          createdAt: new Date().toISOString()
        });

      // Step 2: Get relevant conversation context
      const contextMessages = await conversationStore.getRelevantContext(
        activeConversationId,
        message,
        this.config.contextMessageLimit
      );

      logger.debug('Context retrieved', {
        conversationId: activeConversationId,
        contextMessageCount: contextMessages.length
      });

      // Step 3: Retrieve products if needed
      let products: SearchResult[] | undefined;
      let productContext = '';

      if (includeProducts && this.isProductQuery(message)) {
        const searchResult = await this.search({
          query: message,
          userId,
          sessionId: activeConversationId,
          options: { limit: 5, enableReranking: true, enableConversation: false }
        });

        products = searchResult.results;
        productContext = this.buildProductContext(products);
      }

      // Step 4: Build context for LLM
      const conversationContext = contextMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');

      const fullContext = [
        conversationContext,
        productContext
      ].filter(c => c).join('\n\n---\n\n');

      // Step 5: Generate response
      const systemPrompt = `You are Veritas AI, an intelligent shopping assistant that helps users find the best products on eBay.

Your capabilities:
- Provide honest, unbiased product recommendations
- Explain Veritas AI scores (our proprietary quality ratings)
- Compare products and highlight key differences
- Answer questions about pricing, condition, and availability
- Maintain conversation context across multiple messages

Guidelines:
- Be concise but informative (2-4 sentences typically)
- Reference specific products when relevant
- If you don't have product data, say so clearly
- Never make up product information
- Use a friendly, helpful tone

${productContext ? 'Available products are listed in the context.' : 'No products available for this query.'}`;

      const llmResponse = await llmOrchestrator.complete({
        task: message,
        context: fullContext,
        systemPrompt,
        complexity: 'medium',
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 500
      });

      // Step 6: Save messages to conversation
      await conversationStore.addMessage(
        activeConversationId,
        'user',
        message
      );

      await conversationStore.addMessage(
        activeConversationId,
        'assistant',
        llmResponse.content,
        {
          llmModel: llmResponse.model,
          llmCost: llmResponse.cost,
          productCount: products?.length || 0
        }
      );

      const processingTime = Date.now() - startTime;

      logger.info('Chat completed', {
        conversationId: activeConversationId,
        hasProducts: !!products,
        processingTime
      });

      return {
        message: llmResponse.content,
        conversationId: activeConversationId,
        products,
        metadata: {
          processingTime,
          llmModel: llmResponse.model,
          llmCost: llmResponse.cost,
          contextMessages: contextMessages.length
        }
      };
    } catch (error) {
      logger.error('Chat failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get RAG context for a query (for debugging/analysis)
   */
  async getContext(query: string, userId?: string): Promise<RAGContext> {
    const startTime = Date.now();

    // Retrieve documents
    const retrievalResult = await multiSourceRetriever.retrieve({
      query,
      limit: this.config.retrievalLimit
    });

    // Get conversation context if user provided
    let conversationMessages = [];
    if (userId) {
      try {
        const conversations = await conversationStore.getUserConversations(userId);
        if (conversations.length > 0) {
          conversationMessages = await conversationStore.getRelevantContext(
            conversations[0],
            query,
            5
          );
        }
      } catch (error) {
        logger.warn('Could not retrieve conversation context', { userId, error });
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      query,
      documents: retrievalResult.documents,
      chunks: [], // Chunks would be populated from documents
      metadata: {
        totalDocuments: retrievalResult.documents.length,
        sources: Array.from(new Set(retrievalResult.documents.map(d => d.source))),
        processingTime,
        conversationMessages: conversationMessages.length
      }
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate natural language answer using LLM
   */
  private async generateAnswer(params: {
    query: string;
    userId: string;
    sessionId?: string;
    documents: Document[];
    complexity?: 'simple' | 'medium' | 'complex' | 'expert';
  }): Promise<{
    answer: string;
    conversationId: string;
    llmModel: string;
    llmCost: number;
  }> {
    const { query, userId, sessionId, documents, complexity } = params;

    // Get or create conversation
    const conversationId = sessionId ||
      await conversationStore.createConversation(userId, {
        source: 'search',
        createdAt: new Date().toISOString()
      });

    // Get conversation context
    const contextMessages = await conversationStore.getRelevantContext(
      conversationId,
      query,
      this.config.contextMessageLimit
    );

    // Build context
    const conversationContext = contextMessages.length > 0
      ? `Previous conversation:\n${contextMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\n---\n\n`
      : '';

    const productContext = documents.length > 0
      ? `Relevant products:\n${documents.slice(0, 5).map((doc, i) =>
          `${i + 1}. ${doc.content}`
        ).join('\n\n')}`
      : 'No products found.';

    const fullContext = conversationContext + productContext;

    // Generate answer
    const systemPrompt = `You are Veritas AI, a helpful shopping assistant. Answer the user's question based on the available product information. Be concise, honest, and helpful. If you don't have enough information, say so.`;

    const llmResponse = await llmOrchestrator.complete({
      task: query,
      context: fullContext,
      systemPrompt,
      complexity: complexity || 'medium',
      temperature: 0.7
    });

    // Save to conversation
    await conversationStore.addMessage(conversationId, 'user', query);
    await conversationStore.addMessage(conversationId, 'assistant', llmResponse.content, {
      llmModel: llmResponse.model,
      llmCost: llmResponse.cost,
      productCount: documents.length
    });

    return {
      answer: llmResponse.content,
      conversationId,
      llmModel: llmResponse.model,
      llmCost: llmResponse.cost
    };
  }

  /**
   * Convert documents to search results
   */
  private convertToSearchResults(documents: Document[]): SearchResult[] {
    return documents.map(doc => {
      const metadata = doc.metadata || {};

      return {
        id: metadata.productId || doc.id,
        name: metadata.name || 'Unknown Product',
        brand: metadata.brand,
        category: metadata.category,
        price: metadata.price || 0,
        description: doc.content,
        score: doc.score,
        aiScore: metadata.aiScore,
        condition: metadata.condition,
        imageUrl: metadata.imageUrl,
        inStock: metadata.inStock ?? true,
        metadata: {
          source: doc.source,
          originalScore: metadata.originalScore,
          rerankScore: metadata.rerankScore,
          reranked: metadata.reranked
        }
      };
    });
  }

  /**
   * Build product context for LLM
   */
  private buildProductContext(products: SearchResult[]): string {
    if (products.length === 0) return '';

    return `Available products:\n\n${products.map((p, i) =>
      `${i + 1}. ${p.name} by ${p.brand || 'Unknown'}\n` +
      `   Price: $${p.price.toFixed(2)}\n` +
      `   Condition: ${p.condition || 'N/A'}\n` +
      `   AI Score: ${p.aiScore || 'N/A'}/100\n` +
      `   Description: ${p.description.substring(0, 150)}...`
    ).join('\n\n')}`;
  }

  /**
   * Determine if message is asking about products
   */
  private isProductQuery(message: string): boolean {
    const productKeywords = [
      'find', 'search', 'looking for', 'need', 'want', 'buy',
      'recommend', 'suggest', 'best', 'cheapest', 'price',
      'product', 'item', 'under', 'budget', 'affordable'
    ];

    const messageLower = message.toLowerCase();
    return productKeywords.some(keyword => messageLower.includes(keyword));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<typeof RAGPipeline.prototype.config>): void {
    this.config = { ...this.config, ...config };
    logger.info('RAG Pipeline config updated', { newConfig: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): typeof RAGPipeline.prototype.config {
    return { ...this.config };
  }

  /**
   * Get statistics from underlying services
   */
  getStats(): {
    llm: ReturnType<typeof llmOrchestrator.getStats>;
    retriever: ReturnType<typeof multiSourceRetriever.getConfig>;
  } {
    return {
      llm: llmOrchestrator.getStats(),
      retriever: multiSourceRetriever.getConfig()
    };
  }
}

// Export singleton
export const ragPipeline = new RAGPipeline();
