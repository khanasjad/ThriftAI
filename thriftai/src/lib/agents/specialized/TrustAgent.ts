/**
 * Trust & Safety Agent
 * Evaluates seller reliability and authenticity risk
 */

import { BaseAgent, AgentTask, AgentResult, ProductScoringInput, ScoringResult } from '../types';
import { logger } from '@/lib/logger';

export class TrustAgent extends BaseAgent {
  constructor() {
    super('trust_agent', 'claude-haiku-4-5-20251001');
    logger.info('Trust Agent initialized');
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    if (task.type === 'health_check') {
      return { success: true, data: { status: 'healthy' }, confidence: 1.0, processingTime: Date.now() - startTime };
    }

    if (task.type !== 'score_product') {
      return { success: false, data: null, confidence: 0, processingTime: Date.now() - startTime, error: 'Unsupported task' };
    }

    const product: ProductScoringInput = task.data;
    const result = this.assessTrust(product);

    return {
      success: true,
      data: result,
      explanation: result.reasoning,
      confidence: result.confidence,
      cost: 0.0001,
      processingTime: Date.now() - startTime
    };
  }

  private assessTrust(product: ProductScoringInput): ScoringResult {
    let score = 70; // Default moderate trust

    // Seller verification
    if (product.seller?.verified) {
      score += 20;
    }

    // Seller rating
    if (product.seller?.rating) {
      const ratingBonus = (product.seller.rating - 3.5) * 10;
      score += ratingBonus;
    }

    // Return policy
    if (product.metadata?.hasReturns) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      confidence: 0.8,
      reasoning: `Trust score based on ${product.seller?.verified ? 'verified' : 'unverified'} seller${product.seller?.rating ? ` with ${product.seller.rating}/5 rating` : ''}`,
      factors: {
        verified: product.seller?.verified ? 20 : 0,
        rating: product.seller?.rating || 0,
        returns: product.metadata?.hasReturns ? 10 : 0
      }
    };
  }
}
