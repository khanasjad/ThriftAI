/**
 * Market Demand Agent
 * Analyzes popularity, trends, and resale value
 */

import { BaseAgent, AgentTask, AgentResult, ProductScoringInput, ScoringResult } from '../types';
import { logger } from '@/lib/logger';

export class MarketDemandAgent extends BaseAgent {
  constructor() {
    super('demand_agent', 'claude-haiku-4-5-20251001');
    logger.info('Market Demand Agent initialized');
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
    const result = this.assessDemand(product);

    return {
      success: true,
      data: result,
      explanation: result.reasoning,
      confidence: result.confidence,
      cost: 0.0001,
      processingTime: Date.now() - startTime
    };
  }

  private assessDemand(product: ProductScoringInput): ScoringResult {
    let score = 50; // Baseline demand

    // Popular brands
    const trendingBrands = ['Apple', 'Nike', 'Adidas', 'Samsung', 'Sony'];
    if (product.brand && trendingBrands.includes(product.brand)) {
      score += 25;
    }

    // Popular categories
    const trendingCategories = ['ELECTRONICS', 'FASHION', 'SHOES'];
    if (product.category && trendingCategories.includes(product.category.toUpperCase())) {
      score += 15;
    }

    // View count (if available)
    if (product.metadata?.viewCount) {
      score += Math.min(10, product.metadata.viewCount / 100);
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      confidence: 0.65,
      reasoning: `Market demand for ${product.brand || 'generic'} ${product.category || 'product'}`,
      factors: {
        brand: product.brand && trendingBrands.includes(product.brand) ? 25 : 0,
        category: 15,
        popularity: score - 40
      }
    };
  }
}
