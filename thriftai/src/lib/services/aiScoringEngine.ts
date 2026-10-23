/**
 * AI-Powered Scoring Engine
 *
 * Replaces basic heuristic scoring with sophisticated multi-agent AI system.
 * Uses 7 specialized agents to analyze every aspect of a product.
 *
 * This is the PRODUCTION scoring engine - not a demo!
 */

import { agentOrchestrator } from '@/lib/agents/AgentOrchestrator';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface ProductInput {
  id: string;
  name: string;
  price: number;
  brand?: string;
  category?: string;
  description?: string;
  condition?: string;
  seller?: any;
  images?: string[];
  metadata?: any;
}

export interface ScoringResult {
  veritasScore: number; // 0-100
  confidence: number; // 0-1
  componentScores: {
    price: number;
    quality: number;
    sustainability: number;
    trust: number;
    demand: number;
    specs: number;
    financial: number;
  };
  explanation: string;
  scoredAt: Date;
}

export class AIScoringEngine {
  /**
   * Score a single product using AI agents
   */
  async scoreProduct(product: ProductInput): Promise<ScoringResult> {
    try {
      logger.info('AI Scoring Engine: Scoring product', {
        productId: product.id,
        productName: product.name
      });

      // Use the agent orchestrator (7 AI agents)
      const result = await agentOrchestrator.scoreProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        category: product.category,
        description: product.description,
        condition: product.condition || 'Good',
        seller: product.seller || {
          name: 'Marketplace Seller',
          rating: 4.5,
          verified: false
        },
        images: product.images
      });

      const scoringResult: ScoringResult = {
        veritasScore: result.veritasScore,
        confidence: result.confidence,
        componentScores: result.componentScores as any,
        explanation: result.explanation,
        scoredAt: new Date()
      };

      logger.info('AI Scoring Engine: Product scored', {
        productId: product.id,
        veritasScore: scoringResult.veritasScore,
        confidence: scoringResult.confidence
      });

      return scoringResult;

    } catch (error) {
      logger.error('AI Scoring Engine: Scoring failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Fallback to basic score if agents fail
      return {
        veritasScore: 50,
        confidence: 0.3,
        componentScores: {
          price: 50,
          quality: 50,
          sustainability: 50,
          trust: 50,
          demand: 50,
          specs: 50,
          financial: 50
        },
        explanation: 'Scoring failed, using fallback value',
        scoredAt: new Date()
      };
    }
  }

  /**
   * Score multiple products in batch
   */
  async scoreProductsBatch(products: ProductInput[]): Promise<Map<string, ScoringResult>> {
    const results = new Map<string, ScoringResult>();

    logger.info('AI Scoring Engine: Batch scoring started', {
      productCount: products.length
    });

    let successCount = 0;
    let failureCount = 0;

    for (const product of products) {
      try {
        const result = await this.scoreProduct(product);
        results.set(product.id, result);
        successCount++;

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error('AI Scoring Engine: Batch scoring failed for product', {
          productId: product.id,
          error
        });
        failureCount++;
      }
    }

    logger.info('AI Scoring Engine: Batch scoring completed', {
      total: products.length,
      success: successCount,
      failed: failureCount
    });

    return results;
  }

  /**
   * Re-score products that need updating
   */
  async rescoreStaleProducts(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      // Find products that haven't been scored recently or have no score
      const staleProducts = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { aiScore: null },
            { updatedAt: { lt: cutoffDate } }
          ]
        },
        take: 100, // Limit to 100 at a time
        select: {
          id: true,
          name: true,
          price: true,
          brand: true,
          category: true,
          description: true,
          condition: true
        }
      });

      if (staleProducts.length === 0) {
        logger.info('AI Scoring Engine: No stale products to rescore');
        return 0;
      }

      logger.info('AI Scoring Engine: Rescoring stale products', {
        count: staleProducts.length
      });

      let rescoredCount = 0;

      for (const product of staleProducts) {
        try {
          const result = await this.scoreProduct({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            brand: product.brand || undefined,
            category: product.category || undefined,
            description: product.description || undefined,
            condition: product.condition || 'Good'
          });

          // Update database
          await prisma.product.update({
            where: { id: product.id },
            data: {
              aiScore: result.veritasScore,
              updatedAt: new Date()
            }
          });

          rescoredCount++;

        } catch (error) {
          logger.error('AI Scoring Engine: Failed to rescore product', {
            productId: product.id,
            error
          });
        }
      }

      logger.info('AI Scoring Engine: Rescoring completed', {
        rescored: rescoredCount,
        total: staleProducts.length
      });

      return rescoredCount;

    } catch (error) {
      logger.error('AI Scoring Engine: Rescoring failed', { error });
      return 0;
    }
  }

  /**
   * Get scoring statistics
   */
  async getStats(): Promise<{
    totalProducts: number;
    scoredProducts: number;
    avgScore: number;
    scoreDistribution: Record<string, number>;
  }> {
    const [totalProducts, scoredProducts, avgScoreResult, allScores] = await Promise.all([
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.product.count({ where: { isAvailable: true, aiScore: { not: null } } }),
      prisma.product.aggregate({
        where: { isAvailable: true, aiScore: { not: null } },
        _avg: { aiScore: true }
      }),
      prisma.product.findMany({
        where: { isAvailable: true, aiScore: { not: null } },
        select: { aiScore: true }
      })
    ]);

    // Calculate score distribution
    const distribution = {
      exceptional: 0, // 90+
      excellent: 0,   // 80-89
      good: 0,        // 70-79
      fair: 0,        // 60-69
      poor: 0         // <60
    };

    allScores.forEach(product => {
      const score = product.aiScore || 0;
      if (score >= 90) distribution.exceptional++;
      else if (score >= 80) distribution.excellent++;
      else if (score >= 70) distribution.good++;
      else if (score >= 60) distribution.fair++;
      else distribution.poor++;
    });

    return {
      totalProducts,
      scoredProducts,
      avgScore: Math.round(avgScoreResult._avg.aiScore || 0),
      scoreDistribution: distribution
    };
  }
}

// Export singleton
export const aiScoringEngine = new AIScoringEngine();
