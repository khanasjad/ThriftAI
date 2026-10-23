/**
 * LLM Orchestrator
 *
 * Router-based LLM selection for cost optimization (2-3x savings).
 * Routes tasks to appropriate model based on complexity.
 *
 * Routing Strategy:
 * - Simple tasks → Claude Haiku ($0.25/1M tokens)
 * - Medium tasks → GPT-4 Turbo ($1.5/1M tokens)
 * - Complex tasks → Claude Opus 5 ($7.5/1M tokens)
 * - Expert tasks → GPT-5.6 ($15/1M tokens)
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropicClient, isAnthropicConfigured } from '@/lib/anthropic-client'
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

export type TaskComplexity = 'simple' | 'medium' | 'complex' | 'expert';
export type LLMProvider = 'anthropic' | 'openai';

export interface LLMRoute {
  complexity: TaskComplexity;
  model: string;
  provider: LLMProvider;
  costPer1MTokens: number;
  maxTokens: number;
}

export interface LLMRequest {
  task: string;
  context?: string;
  complexity?: TaskComplexity;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  complexity: TaskComplexity;
  tokensUsed: number;
  cost: number;
  processingTime: number;
}

// Production-grade routing table (2026 models)
const LLM_ROUTES: Record<TaskComplexity, LLMRoute> = {
  simple: {
    complexity: 'simple',
    model: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    costPer1MTokens: 0.25,
    maxTokens: 1000
  },
  medium: {
    complexity: 'medium',
    model: 'gpt-4-turbo',
    provider: 'openai',
    costPer1MTokens: 1.5,
    maxTokens: 2000
  },
  complex: {
    complexity: 'complex',
    model: 'claude-opus-4',
    provider: 'anthropic',
    costPer1MTokens: 7.5,
    maxTokens: 4000
  },
  expert: {
    complexity: 'expert',
    model: 'gpt-4o',
    provider: 'openai',
    costPer1MTokens: 15.0,
    maxTokens: 8000
  }
};

export class LLMOrchestrator {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private totalCost: number = 0;
  private totalRequests: number = 0;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ''
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    logger.info('LLM Orchestrator initialized');
  }

  /**
   * Complete a task using the appropriate LLM
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Classify complexity if not provided
      const complexity = request.complexity || await this.classifyComplexity(request.task);

      // Get route
      const route = LLM_ROUTES[complexity];

      logger.info('Routing LLM request', {
        complexity,
        model: route.model,
        provider: route.provider
      });

      // Execute with appropriate provider
      const content = route.provider === 'anthropic'
        ? await this.executeAnthropic(request, route)
        : await this.executeOpenAI(request, route);

      // Estimate tokens and cost (rough approximation)
      const tokensUsed = this.estimateTokens(request.task + (request.context || '') + content);
      const cost = (tokensUsed / 1_000_000) * route.costPer1MTokens;

      // Track metrics
      this.totalCost += cost;
      this.totalRequests += 1;

      const processingTime = Date.now() - startTime;

      logger.debug('LLM request completed', {
        complexity,
        model: route.model,
        tokensUsed,
        cost: cost.toFixed(4),
        processingTime
      });

      return {
        content,
        model: route.model,
        complexity,
        tokensUsed,
        cost,
        processingTime
      };
    } catch (error) {
      logger.error('LLM request failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Classify task complexity automatically
   */
  private async classifyComplexity(task: string): Promise<TaskComplexity> {
    const taskLower = task.toLowerCase();
    const wordCount = task.split(/\s+/).length;

    // Heuristic-based classification
    const hasCode = /```|code|function|class|import|export/.test(task);
    const hasAnalysis = /analyze|compare|evaluate|recommend|explain|summarize/.test(taskLower);
    const hasCreation = /create|generate|write|build|design/.test(taskLower);
    const hasResearch = /research|investigate|explore|study/.test(taskLower);

    // Expert tasks
    if (hasCreation && wordCount > 100) return 'expert';
    if (hasResearch && hasAnalysis) return 'expert';

    // Complex tasks
    if (hasCode || (hasAnalysis && wordCount > 50)) return 'complex';
    if (hasCreation && wordCount > 50) return 'complex';

    // Medium tasks
    if (hasAnalysis || hasCreation) return 'medium';
    if (wordCount > 30) return 'medium';

    // Simple tasks (default)
    return 'simple';
  }

  /**
   * Execute with Anthropic (Claude)
   */
  private async executeAnthropic(
    request: LLMRequest,
    route: LLMRoute
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = [];

    if (request.context) {
      messages.push({
        role: 'user',
        content: `Context:\n${request.context}\n\nTask: ${request.task}`
      });
    } else {
      messages.push({
        role: 'user',
        content: request.task
      });
    }

    const response = await this.anthropic.messages.create({
      model: route.model,
      max_tokens: request.maxTokens || route.maxTokens,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
  }

  /**
   * Execute with OpenAI (GPT)
   */
  private async executeOpenAI(
    request: LLMRequest,
    route: LLMRoute
  ): Promise<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt || request.context) {
      messages.push({
        role: 'system',
        content: request.systemPrompt || `Context: ${request.context}`
      });
    }

    messages.push({
      role: 'user',
      content: request.task
    });

    const response = await this.openai.chat.completions.create({
      model: route.model,
      messages,
      max_tokens: request.maxTokens || route.maxTokens,
      temperature: request.temperature ?? 0.7
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Estimate token count (rough)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get cost statistics
   */
  getStats(): {
    totalCost: number;
    totalRequests: number;
    avgCostPerRequest: number;
  } {
    return {
      totalCost: this.totalCost,
      totalRequests: this.totalRequests,
      avgCostPerRequest: this.totalRequests > 0
        ? this.totalCost / this.totalRequests
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalCost = 0;
    this.totalRequests = 0;
    logger.info('LLM stats reset');
  }

  /**
   * Override route for testing
   */
  setRoute(complexity: TaskComplexity, route: Partial<LLMRoute>): void {
    LLM_ROUTES[complexity] = { ...LLM_ROUTES[complexity], ...route };
    logger.info('Route updated', { complexity, route });
  }
}

// Export singleton
export const llmOrchestrator = new LLMOrchestrator();
