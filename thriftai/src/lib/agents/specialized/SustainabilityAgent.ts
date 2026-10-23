/**
 * Sustainability Agent
 * Evaluates environmental impact and second-hand value
 */

import { BaseAgent, AgentTask, AgentResult, ProductScoringInput, ScoringResult } from '../types';
import { logger } from '@/lib/logger';

export class SustainabilityAgent extends BaseAgent {
  constructor() {
    super('sustainability_agent', 'claude-haiku-4-5-20251001');
    logger.info('Sustainability Agent initialized');
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
    const result = this.assessSustainability(product);

    return {
      success: true,
      data: result,
      explanation: result.reasoning,
      confidence: result.confidence,
      cost: 0.0001,
      processingTime: Date.now() - startTime
    };
  }

  private assessSustainability(product: ProductScoringInput): ScoringResult {
    let score = 70; // Second-hand inherently more sustainable

    // Category impact
    const sustainableCategories = ['CLOTHING', 'BOOKS', 'FURNITURE'];
    const highImpactCategories = ['ELECTRONICS'];

    if (product.category && sustainableCategories.includes(product.category.toUpperCase())) {
      score += 15;
    } else if (product.category && highImpactCategories.includes(product.category.toUpperCase())) {
      score += 5; // Still saves from new production
    }

    // Condition bonus (better condition = longer life)
    if (product.condition === 'Excellent' || product.condition === 'New') {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      confidence: 0.7,
      reasoning: `Sustainability score for second-hand ${product.category || 'product'} in ${product.condition || 'used'} condition`,
      factors: { secondHand: 70, category: 15, condition: 10 }
    };
  }
}
