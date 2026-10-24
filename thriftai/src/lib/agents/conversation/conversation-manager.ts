/**
 * Conversation Manager
 *
 * Manages multi-turn conversations for product search and Q&A.
 * Maintains context, handles follow-up questions, and integrates with query understanding.
 */

import Anthropic from '@anthropic-ai/sdk'
import { models } from '@/lib/veritas/env'
import { understandQuery } from '../query/query-agent'
import { explainScore, compareProducts } from '../explanation/explanation-agent'
import {
  QueryIntent,
  ConversationMessage,
  UserPreferences,
  QueryUnderstandingRequest
} from '../query/query-types'
import type { ScoreExplanation } from '../explanation/explanation-agent'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

/**
 * Conversation state
 */
export interface ConversationState {
  id: string
  userId?: string
  messages: ConversationMessage[]
  context: {
    lastIntent?: QueryIntent
    lastProductsShown?: string[]
    currentFilters?: any
    userPreferences?: UserPreferences
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Conversation response
 */
export interface ConversationResponse {
  message: string
  intent: QueryIntent
  data?: {
    products?: any[]
    explanation?: ScoreExplanation
    comparison?: any
  }
  suggestions?: string[]
  followUpQuestions?: string[]
}

/**
 * Conversation Manager class
 */
export class ConversationManager {
  private conversations: Map<string, ConversationState> = new Map()
  private maxMessagesHistory: number = 20

  /**
   * Start a new conversation
   */
  startConversation(userId?: string): string {
    const conversationId = this.generateId()

    const state: ConversationState = {
      id: conversationId,
      userId,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.conversations.set(conversationId, state)
    return conversationId
  }

  /**
   * Process user message
   */
  async processMessage(
    conversationId: string,
    userMessage: string,
    options?: {
      userPreferences?: UserPreferences
    }
  ): Promise<ConversationResponse> {
    const state = this.conversations.get(conversationId)
    if (!state) {
      throw new Error('Conversation not found')
    }

    // Add user message to history
    this.addMessage(state, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    })

    // Update user preferences if provided
    if (options?.userPreferences) {
      state.context.userPreferences = options.userPreferences
    }

    try {
      // Understand the query with conversation context
      const understanding = await understandQuery({
        query: userMessage,
        context: {
          conversationHistory: state.messages.slice(-5), // Last 5 messages
          userPreferences: state.context.userPreferences,
          previousSearches: this.extractPreviousSearches(state)
        }
      })

      // Route based on intent
      let response: ConversationResponse

      switch (understanding.intent) {
        case QueryIntent.SEARCH:
          response = await this.handleSearch(state, understanding)
          break

        case QueryIntent.EXPLAIN:
          response = await this.handleExplain(state, understanding)
          break

        case QueryIntent.COMPARE:
          response = await this.handleCompare(state, understanding)
          break

        case QueryIntent.RECOMMEND:
          response = await this.handleRecommend(state, understanding)
          break

        case QueryIntent.FILTER:
          response = await this.handleFilter(state, understanding)
          break

        case QueryIntent.ASK_QUESTION:
          response = await this.handleQuestion(state, understanding)
          break

        default:
          response = {
            message: 'I\'m not sure how to help with that. Could you rephrase?',
            intent: QueryIntent.ASK_QUESTION
          }
      }

      // Add assistant response to history
      this.addMessage(state, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          intent: understanding.intent,
          productsShown: response.data?.products?.map(p => p.id)
        }
      })

      // Update context
      state.context.lastIntent = understanding.intent
      if (response.data?.products) {
        state.context.lastProductsShown = response.data.products.map(p => p.id)
      }
      state.updatedAt = new Date()

      return response
    } catch (error) {
      console.error('Failed to process message:', error)

      const errorResponse: ConversationResponse = {
        message: 'Sorry, I encountered an error processing your request. Could you try rephrasing?',
        intent: QueryIntent.ASK_QUESTION
      }

      this.addMessage(state, {
        role: 'assistant',
        content: errorResponse.message,
        timestamp: new Date()
      })

      return errorResponse
    }
  }

  /**
   * Handle search intent
   */
  private async handleSearch(
    state: ConversationState,
    understanding: any
  ): Promise<ConversationResponse> {
    // This would integrate with your vector search service
    // For now, return a placeholder
    return {
      message: `I'll search for products matching: ${understanding.semanticQuery}. ${
        understanding.clarificationNeeded
          ? `\n\nFirst, could you clarify: ${understanding.clarificationNeeded[0]}`
          : ''
      }`,
      intent: QueryIntent.SEARCH,
      data: {
        products: [] // Would contain actual search results
      },
      suggestions: understanding.suggestedRefinements
    }
  }

  /**
   * Handle explain intent
   */
  private async handleExplain(
    state: ConversationState,
    understanding: any
  ): Promise<ConversationResponse> {
    // Extract product ID from context or query
    const productId = this.extractProductId(state, understanding)

    if (!productId) {
      return {
        message: 'Which product would you like me to explain? Please specify a product from the results.',
        intent: QueryIntent.EXPLAIN,
        suggestions: state.context.lastProductsShown?.slice(0, 3) || []
      }
    }

    try {
      const explanation = await explainScore(productId, {
        detailLevel: 'detailed'
      })

      const message = this.formatExplanation(explanation)

      return {
        message,
        intent: QueryIntent.EXPLAIN,
        data: { explanation }
      }
    } catch (error) {
      return {
        message: 'Sorry, I couldn\'t find scoring information for that product.',
        intent: QueryIntent.EXPLAIN
      }
    }
  }

  /**
   * Handle compare intent
   */
  private async handleCompare(
    state: ConversationState,
    understanding: any
  ): Promise<ConversationResponse> {
    const productIds = this.extractProductIds(state, understanding)

    if (productIds.length < 2) {
      return {
        message: 'Please specify at least 2 products to compare.',
        intent: QueryIntent.COMPARE,
        suggestions: state.context.lastProductsShown?.slice(0, 3) || []
      }
    }

    try {
      const comparison = await compareProducts(productIds)

      return {
        message: comparison.comparison,
        intent: QueryIntent.COMPARE,
        data: { comparison }
      }
    } catch (error) {
      return {
        message: 'Sorry, I couldn\'t compare those products.',
        intent: QueryIntent.COMPARE
      }
    }
  }

  /**
   * Handle recommend intent
   */
  private async handleRecommend(
    state: ConversationState,
    understanding: any
  ): Promise<ConversationResponse> {
    // Would integrate with recommendation engine
    return {
      message: 'Based on your preferences, I recommend...',
      intent: QueryIntent.RECOMMEND,
      data: {
        products: []
      }
    }
  }

  /**
   * Handle filter intent
   */
  private async handleFilter(
    state: ConversationState,
    understanding: any
  ): Promise<ConversationResponse> {
    // Apply new filters to previous search
    state.context.currentFilters = {
      ...state.context.currentFilters,
      ...understanding.filters
    }

    return {
      message: `I've updated the filters. Searching with: ${this.formatFilters(understanding.filters)}`,
      intent: QueryIntent.FILTER,
      data: {
        products: [] // Would contain filtered results
      }
    }
  }

  /**
   * Handle general questions
   */
  private async handleQuestion(
    state: ConversationState,
    understanding: any
  ): Promise<ConversationResponse> {
    // Use Claude to answer general questions about the system
    try {
      const response = await anthropic.messages.create({
        model: models.agent,
        max_tokens: 1024,
        system: this.buildQuestionAnsweringPrompt(),
        messages: [
          ...this.formatMessagesForClaude(state.messages.slice(-5)),
          {
            role: 'user',
            content: understanding.originalQuery
          }
        ]
      })

      const answer = response.content[0].type === 'text'
        ? response.content[0].text
        : 'I\'m not sure how to answer that.'

      return {
        message: answer,
        intent: QueryIntent.ASK_QUESTION
      }
    } catch (error) {
      return {
        message: 'I\'m not sure how to answer that. Could you rephrase?',
        intent: QueryIntent.ASK_QUESTION
      }
    }
  }

  /**
   * Add message to conversation
   */
  private addMessage(state: ConversationState, message: ConversationMessage): void {
    state.messages.push(message)

    // Keep only last N messages
    if (state.messages.length > this.maxMessagesHistory) {
      state.messages = state.messages.slice(-this.maxMessagesHistory)
    }
  }

  /**
   * Extract previous searches from conversation
   */
  private extractPreviousSearches(state: ConversationState): string[] {
    return state.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .slice(-3)
  }

  /**
   * Extract product ID from context
   */
  private extractProductId(state: ConversationState, understanding: any): string | null {
    // Check if product was mentioned in last shown products
    if (state.context.lastProductsShown && state.context.lastProductsShown.length > 0) {
      return state.context.lastProductsShown[0]
    }

    // Try to extract from query
    // This would be more sophisticated in production
    return null
  }

  /**
   * Extract multiple product IDs
   */
  private extractProductIds(state: ConversationState, understanding: any): string[] {
    return state.context.lastProductsShown?.slice(0, 3) || []
  }

  /**
   * Format explanation for display
   */
  private formatExplanation(explanation: ScoreExplanation): string {
    let message = `## ${explanation.productName}\n\n`
    message += `**Overall Score:** ${explanation.overallScore.toFixed(1)}/100 (${explanation.grade})\n\n`
    message += `${explanation.summary}\n\n`

    if (explanation.strengths.length > 0) {
      message += `**Strengths:**\n${explanation.strengths.map(s => `  • ${s}`).join('\n')}\n\n`
    }

    if (explanation.weaknesses.length > 0) {
      message += `**Weaknesses:**\n${explanation.weaknesses.map(w => `  • ${w}`).join('\n')}\n\n`
    }

    if (explanation.recommendations.length > 0) {
      message += `**Recommendations:**\n${explanation.recommendations.map(r => `  • ${r}`).join('\n')}`
    }

    return message
  }

  /**
   * Format filters for display
   */
  private formatFilters(filters: any): string {
    const parts = []

    if (filters.categories) parts.push(`categories: ${filters.categories.join(', ')}`)
    if (filters.priceMin || filters.priceMax) {
      parts.push(`price: $${filters.priceMin || 0}-$${filters.priceMax || '∞'}`)
    }
    if (filters.brands) parts.push(`brands: ${filters.brands.join(', ')}`)
    if (filters.minOverallScore) parts.push(`min score: ${filters.minOverallScore}`)

    return parts.join(', ')
  }

  /**
   * Build prompt for question answering
   */
  private buildQuestionAnsweringPrompt(): string {
    return `You are a helpful assistant for ThriftAI, a clothing quality scoring platform.

ThriftAI helps shoppers find high-quality clothing by scoring products across 27 factors in 5 pillars:
1. Fit & Sizing (35 points)
2. Quality & Durability (30 points)
3. Style & Value (20 points)
4. Comfort (15 points)
5. Sustainability (5 points)

You can answer questions about:
- How the scoring system works
- What different factors mean
- How to interpret scores
- Product recommendations
- How to search for products
- General clothing quality information

Be helpful, friendly, and concise. If you don't know something, say so.`
  }

  /**
   * Format messages for Claude API
   */
  private formatMessagesForClaude(messages: ConversationMessage[]): Array<{role: 'user' | 'assistant', content: string}> {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
  }

  /**
   * Generate conversation ID
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Get conversation state
   */
  getConversation(conversationId: string): ConversationState | null {
    return this.conversations.get(conversationId) || null
  }

  /**
   * Clear old conversations (cleanup)
   */
  clearOldConversations(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now()

    for (const [id, state] of this.conversations.entries()) {
      if (now - state.updatedAt.getTime() > maxAgeMs) {
        this.conversations.delete(id)
      }
    }
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager()
