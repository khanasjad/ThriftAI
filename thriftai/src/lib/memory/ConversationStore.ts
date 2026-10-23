/**
 * Conversation Memory Store
 *
 * Persistent conversation storage using Redis/Upstash.
 * Enables multi-turn conversations with context retrieval.
 *
 * Features:
 * - Message history with embeddings
 * - Semantic context retrieval
 * - Conversation summarization
 * - User session management
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { Redis } from '@upstash/redis';
import { embeddingService } from '@/lib/services/embeddingService';
import { logger } from '@/lib/logger';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ConversationStoreConfig {
  redisUrl?: string;
  redisToken?: string;
  maxMessages?: number;
  enableEmbeddings?: boolean;
}

export class ConversationStore {
  private redis: Redis;
  private config: Required<ConversationStoreConfig>;

  constructor(config?: Partial<ConversationStoreConfig>) {
    this.config = {
      redisUrl: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || '',
      redisToken: process.env.UPSTASH_REDIS_TOKEN || '',
      maxMessages: 50,
      enableEmbeddings: true,
      ...config
    };

    this.redis = new Redis({
      url: this.config.redisUrl,
      token: this.config.redisToken
    });

    logger.info('ConversationStore initialized', {
      maxMessages: this.config.maxMessages,
      enableEmbeddings: this.config.enableEmbeddings
    });
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const conversationId = `conv_${userId}_${Date.now()}`;

    const conversation: Conversation = {
      id: conversationId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };

    await this.redis.hset(`conv:${conversationId}`, {
      userId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      metadata: JSON.stringify(metadata || {})
    });

    logger.info('Conversation created', { conversationId, userId });

    return conversationId;
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const message: Message = {
      id: `${conversationId}:msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    // Generate embedding if enabled
    if (this.config.enableEmbeddings && role !== 'system') {
      try {
        message.embedding = await embeddingService.generateQueryEmbedding(content);
      } catch (error) {
        logger.warn('Failed to generate message embedding', {
          conversationId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Store message
    await this.redis.lpush(
      `conv:${conversationId}:messages`,
      JSON.stringify(message)
    );

    // Trim to max messages
    await this.redis.ltrim(
      `conv:${conversationId}:messages`,
      0,
      this.config.maxMessages - 1
    );

    // Update conversation metadata
    await this.redis.hset(`conv:${conversationId}`, {
      updatedAt: new Date().toISOString()
    });

    logger.debug('Message added', {
      conversationId,
      role,
      hasEmbedding: !!message.embedding
    });

    return message;
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(
    conversationId: string,
    limit: number = 10
  ): Promise<Message[]> {
    const messages = await this.redis.lrange(
      `conv:${conversationId}:messages`,
      0,
      limit - 1
    );

    return messages.map(m => this.parseMessage(m));
  }

  /**
   * Get all messages
   */
  async getAllMessages(conversationId: string): Promise<Message[]> {
    const messages = await this.redis.lrange(
      `conv:${conversationId}:messages`,
      0,
      -1
    );

    return messages.map(m => this.parseMessage(m));
  }

  /**
   * Get relevant context using semantic search
   */
  async getRelevantContext(
    conversationId: string,
    currentQuery: string,
    limit: number = 5
  ): Promise<Message[]> {
    // Get all messages with embeddings
    const allMessages = await this.getAllMessages(conversationId);
    const messagesWithEmbeddings = allMessages.filter(m => m.embedding);

    if (messagesWithEmbeddings.length === 0) {
      // Fallback to recent messages
      return await this.getRecentMessages(conversationId, limit);
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateQueryEmbedding(currentQuery);

    // Calculate similarity scores
    const scored = messagesWithEmbeddings.map(message => ({
      message,
      similarity: this.cosineSimilarity(queryEmbedding, message.embedding!)
    }));

    // Sort by similarity and take top K
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit).map(s => s.message);
  }

  /**
   * Summarize conversation using LLM
   */
  async summarizeConversation(conversationId: string): Promise<string> {
    const messages = await this.getAllMessages(conversationId);

    if (messages.length === 0) {
      return 'No messages in conversation';
    }

    // Build conversation text
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    // Use LLM to summarize (import llmOrchestrator to avoid circular dependency)
    const { llmOrchestrator } = await import('../llm/LLMOrchestrator');

    const summary = await llmOrchestrator.complete({
      task: `Summarize this conversation in 2-3 sentences:\n\n${conversationText}`,
      complexity: 'simple'
    });

    // Cache summary
    await this.redis.hset(`conv:${conversationId}`, {
      summary: summary.content
    });

    logger.info('Conversation summarized', { conversationId });

    return summary.content;
  }

  /**
   * Get conversation metadata
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const data = await this.redis.hgetall(`conv:${conversationId}`);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const messages = await this.getAllMessages(conversationId);

    return {
      id: conversationId,
      userId: data.userId as string,
      messages,
      summary: data.summary as string | undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      metadata: JSON.parse((data.metadata as string) || '{}')
    };
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.redis.del(`conv:${conversationId}`);
    await this.redis.del(`conv:${conversationId}:messages`);

    logger.info('Conversation deleted', { conversationId });
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string): Promise<string[]> {
    // In production, use a separate index for this
    // For now, return empty array (TODO: implement indexing)
    logger.warn('getUserConversations not fully implemented');
    return [];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private parseMessage(json: string): Message {
    const data = JSON.parse(json);
    return {
      ...data,
      timestamp: new Date(data.timestamp)
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export singleton
export const conversationStore = new ConversationStore();
