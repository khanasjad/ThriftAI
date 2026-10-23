/**
 * Price Intelligence Agent
 *
 * Analyzes pricing, deals, market value, and price trends.
 * Uses Claude Haiku for fast, cost-effective analysis.
 *
 * Scoring Factors:
 * - Price vs market average
 * - Historical price trends
 * - Deal quality
 * - Price-to-value ratio
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropicClient, isAnthropicConfigured } from '@/lib/anthropic-client'
import { logger } from '@/lib/logger';
import { BaseAgent, AgentTask, AgentResult, ProductScoringInput, ScoringResult } from '../types';

export class PriceAgent extends BaseAgent {
  private anthropic: Anthropic;

  constructor() {
    super('price_agent', 'claude-haiku-4-5-20251001');

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    this.capabilities = [{
      name: 'score_product_price',
      description: 'Analyze product pricing and market value',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          reasoning: { type: 'string' }
        }
      }
    }];

    logger.info('Price Agent initialized');
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      if (task.type === 'health_check') {
        return {
          success: true,
          data: { status: 'healthy' },
          confidence: 1.0,
          processingTime: Date.now() - startTime
        };
      }

      if (task.type !== 'score_product') {
        return {
          success: false,
          data: null,
          confidence: 0,
          processingTime: Date.now() - startTime,
          error: 'Unsupported task type'
        };
      }

      const product: ProductScoringInput = task.data;

      logger.debug('Price Agent analyzing product', {
        productId: product.id,
        price: product.price
      });

      // Analyze price
      const scoringResult = await this.analyzePrice(product);

      return {
        success: true,
        data: scoringResult,
        explanation: scoringResult.reasoning,
        confidence: scoringResult.confidence,
        cost: 0.0001, // Approximate cost per analysis
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Price Agent execution failed', { error });
      return {
        success: false,
        data: null,
        confidence: 0,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async analyzePrice(product: ProductScoringInput): Promise<ScoringResult> {
    try {
      // Check if API key is available
      if (!process.env.ANTHROPIC_API_KEY) {
        return this.heuristicPriceScore(product);
      }

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 500,
        temperature: 0.3,
        system: `You are a price analysis expert for ThriftAI.

Analyze product pricing and provide a score from 0-100 where:
- 90-100: Exceptional deal, significantly below market value
- 70-89: Good price, fair value
- 50-69: Average price, market standard
- 30-49: Slightly overpriced
- 0-29: Significantly overpriced

Consider:
- Typical market prices for similar items
- Product condition and brand
- Category-specific pricing patterns
- Current market trends

Output JSON format:
{
  "score": 75,
  "confidence": 0.85,
  "reasoning": "Brief explanation of score",
  "factors": {
    "marketComparison": 80,
    "brandValue": 70,
    "conditionAdjusted": 75
  },
  "warnings": ["any concerns"],
  "recommendations": ["any suggestions"]
}`,
        messages: [{
          role: 'user',
          content: `Analyze pricing for:

Product: ${product.name}
Price: $${product.price}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category || 'General'}
Condition: ${product.condition || 'Used'}

Provide price score and analysis.`
        }]
      });

      const content = response.content[0];
      const analysisText = content.type === 'text' ? content.text : '';

      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          score: result.score || 50,
          confidence: result.confidence || 0.7,
          reasoning: result.reasoning || 'Price analysis completed',
          factors: result.factors || {},
          warnings: result.warnings,
          recommendations: result.recommendations
        };
      }

      // Fallback if parsing fails
      return this.heuristicPriceScore(product);

    } catch (error) {
      logger.warn('AI price analysis failed, using heuristic', { error });
      return this.heuristicPriceScore(product);
    }
  }

  /**
   * Heuristic-based price scoring (fallback without AI)
   */
  private heuristicPriceScore(product: ProductScoringInput): ScoringResult {
    let score = 50; // Start at average

    // Adjust based on category and price range
    const price = product.price;

    // Simple price range scoring
    if (price < 10) {
      score += 20; // Very affordable
    } else if (price < 50) {
      score += 10; // Affordable
    } else if (price > 500) {
      score -= 10; // Expensive
    } else if (price > 1000) {
      score -= 20; // Very expensive
    }

    // Adjust for condition
    if (product.condition === 'New' || product.condition === 'Excellent') {
      score += 10;
    } else if (product.condition === 'Poor') {
      score -= 10;
    }

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      confidence: 0.6, // Lower confidence for heuristic
      reasoning: `Price score based on $${price} and ${product.condition || 'used'} condition`,
      factors: {
        priceRange: score,
        conditionAdjustment: product.condition === 'New' ? 10 : 0
      }
    };
  }
}
