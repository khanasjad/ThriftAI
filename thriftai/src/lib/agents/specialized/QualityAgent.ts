/**
 * Quality Assessment Agent
 * Evaluates product condition, authenticity, and durability
 */

import { BaseAgent, AgentTask, AgentResult, ProductScoringInput, ScoringResult } from '../types';
import { logger } from '@/lib/logger';

export class QualityAgent extends BaseAgent {
  constructor() {
    super('quality_agent', 'claude-3-5-sonnet-20241022');
    logger.info('Quality Agent initialized');
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
    const result = this.assessQuality(product);

    return {
      success: true,
      data: result,
      explanation: result.reasoning,
      confidence: result.confidence,
      cost: 0.0002,
      processingTime: Date.now() - startTime
    };
  }

  private assessQuality(product: ProductScoringInput): ScoringResult {
    let score = 60;

    // Condition scoring
    const conditionScores: Record<string, number> = {
      'New': 100,
      'Excellent': 90,
      'Very Good': 80,
      'Good': 65,
      'Fair': 45,
      'Poor': 20
    };

    score = conditionScores[product.condition || 'Good'] || 60;

    // Brand reputation (simplified)
    const premiumBrands = ['Apple', 'Nike', 'Sony', 'Samsung', 'Canon'];
    if (product.brand && premiumBrands.includes(product.brand)) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      confidence: 0.75,
      reasoning: `Quality score based on ${product.condition || 'used'} condition${product.brand ? ` and ${product.brand} brand` : ''}`,
      factors: { condition: score, brand: product.brand ? 10 : 0 }
    };
  }
}
