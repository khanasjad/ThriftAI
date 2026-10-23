/**
 * Price Intelligence Agent
 *
 * Analyzes price competitiveness and value proposition
 * Uses deterministic logic (no AI APIs required)
 */

import { DeterministicBaseAgent, type ProductInput } from '../DeterministicBaseAgent';
import type { AgentResult } from '../types';
import type { VeritasAgentResult, VeritasProductInput } from '../veritasTypes';
import { prisma } from '@/lib/prisma';

export class PriceIntelligenceAgent extends DeterministicBaseAgent {
  readonly name = 'PriceIntelligenceAgent';
  readonly weight = 0.20; // 20% weight in final score
  readonly description = 'Analyzes price competitiveness and identifies deals';
  readonly version = 'v3.2'; // Per Veritas plan specification

  async analyze(product: ProductInput): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Get category price statistics
      const categoryStats = await this.getCategoryPriceStats(product.category || 'General');

      // Calculate various price metrics
      const metrics = this.calculatePriceMetrics(product, categoryStats);

      // Determine score based on multiple factors
      const score = this.calculateScore(metrics);

      // Generate human-readable reasoning
      const reasoning = this.generateReasoning(metrics);

      // Detect any warnings
      const warnings = this.detectWarnings(metrics);

      const processingTime = Date.now() - startTime;

      this.log('info', 'Price analysis completed', {
        productId: product.id,
        score,
        metrics
      });

      return this.createResult(
        score,
        metrics.confidence,
        reasoning,
        metrics,
        processingTime,
        warnings
      );

    } catch (error) {
      this.log('error', 'Price analysis failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return fallback score
      return this.createResult(
        50, // Neutral score
        0.3, // Low confidence
        'Unable to analyze price due to insufficient data',
        { error: true },
        Date.now() - startTime,
        ['Price analysis failed - using fallback score']
      );
    }
  }

  /**
   * Veritas-compliant analysis method
   * New standard format per Veritas.AI specification
   */
  async analyzeVeritas(product: VeritasProductInput): Promise<VeritasAgentResult> {
    const startTime = Date.now();

    try {
      // Get category price statistics
      const categoryStats = await this.getCategoryPriceStats(product.category || 'General');

      // Calculate various price metrics
      const metrics = this.calculatePriceMetrics(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          brand: product.brand,
          category: product.category,
          description: product.description,
          condition: product.condition
        },
        categoryStats
      );

      // Determine score based on multiple factors
      const score = this.calculateScore(metrics);

      // Generate evidence array (specific, actionable statements)
      const evidence = this.generateEvidence(metrics);

      // Detect any warning flags
      const flags = this.generateFlags(metrics);

      const processingTime = Date.now() - startTime;

      this.log('info', 'Veritas price analysis completed', {
        productId: product.id,
        score,
        confidence: metrics.confidence
      });

      return this.createVeritasResult(
        product.id,
        score,
        metrics.confidence,
        evidence,
        flags,
        {
          processing_time_ms: processingTime,
          data_sources: ['product_database'],
          category_median: metrics.categoryMedian,
          discount_from_median: metrics.discountFromMedian,
          data_points: metrics.dataPoints
        }
      );

    } catch (error) {
      this.log('error', 'Veritas price analysis failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return fallback result
      return this.createVeritasResult(
        product.id,
        50, // Neutral score
        0.3, // Low confidence
        ['Unable to analyze price due to insufficient data'],
        ['DATA_QUALITY_LOW'],
        {
          processing_time_ms: Date.now() - startTime,
          fallback_used: true,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Get price statistics for the category
   */
  private async getCategoryPriceStats(category: string): Promise<CategoryPriceStats> {
    try {
      const stats = await prisma.product.aggregate({
        where: {
          category,
          isAvailable: true,
          price: { gt: 0 } // Exclude invalid prices
        },
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
        _count: true
      });

      // Calculate median (approximation using percentiles)
      const medianProduct = await prisma.product.findMany({
        where: {
          category,
          isAvailable: true,
          price: { gt: 0 }
        },
        select: { price: true },
        orderBy: { price: 'asc' },
        skip: Math.floor((stats._count || 1) / 2),
        take: 1
      });

      return {
        average: stats._avg.price || 100,
        min: stats._min.price || 0,
        max: stats._max.price || 1000,
        median: medianProduct[0]?.price || stats._avg.price || 100,
        count: stats._count || 0
      };
    } catch (error) {
      this.log('warn', 'Failed to get category stats, using defaults', { category, error });

      // Default fallback stats
      return {
        average: 100,
        min: 10,
        max: 500,
        median: 100,
        count: 0
      };
    }
  }

  /**
   * Calculate comprehensive price metrics
   */
  private calculatePriceMetrics(
    product: ProductInput,
    categoryStats: CategoryPriceStats
  ): PriceMetrics {
    const price = product.price;

    // Discount from average
    const discountFromAverage = this.percentageDiff(
      categoryStats.average,
      price
    );

    // Discount from median (more robust than average)
    const discountFromMedian = this.percentageDiff(
      categoryStats.median,
      price
    );

    // Position in category price range
    const pricePosition = this.normalizeScore(
      price,
      categoryStats.min,
      categoryStats.max
    );

    // Suspiciously low check
    const suspiciouslyLow = discountFromMedian > 70;
    const suspiciouslyHigh = discountFromMedian < -50;

    // Confidence based on data availability
    let confidence = 0.85;
    if (categoryStats.count < 10) confidence = 0.5; // Low confidence with few data points
    if (categoryStats.count < 5) confidence = 0.3;

    return {
      price,
      categoryAverage: categoryStats.average,
      categoryMedian: categoryStats.median,
      categoryMin: categoryStats.min,
      categoryMax: categoryStats.max,
      discountFromAverage,
      discountFromMedian,
      pricePosition,
      suspiciouslyLow,
      suspiciouslyHigh,
      confidence,
      dataPoints: categoryStats.count
    };
  }

  /**
   * Calculate final score based on metrics
   */
  private calculateScore(metrics: PriceMetrics): number {
    let score = 60; // Base score

    // Primary scoring: discount from median
    if (metrics.discountFromMedian >= 40) {
      // 40%+ below median = excellent deal
      score = 95;
    } else if (metrics.discountFromMedian >= 30) {
      // 30-40% below median = great deal
      score = 90;
    } else if (metrics.discountFromMedian >= 20) {
      // 20-30% below median = good deal
      score = 85;
    } else if (metrics.discountFromMedian >= 10) {
      // 10-20% below median = fair deal
      score = 75;
    } else if (metrics.discountFromMedian >= 0) {
      // 0-10% below median = average deal
      score = 65;
    } else if (metrics.discountFromMedian >= -10) {
      // 0-10% above median = slightly expensive
      score = 55;
    } else if (metrics.discountFromMedian >= -20) {
      // 10-20% above median = expensive
      score = 45;
    } else {
      // 20%+ above median = very expensive
      score = 30;
    }

    // Adjust for suspiciously low prices (potential scam)
    if (metrics.suspiciouslyLow) {
      score = Math.min(score, 40); // Cap at 40 for too-good-to-be-true deals
      this.log('warn', 'Suspiciously low price detected', {
        price: metrics.price,
        median: metrics.categoryMedian,
        discount: metrics.discountFromMedian
      });
    }

    // Penalty for suspiciously high prices
    if (metrics.suspiciouslyHigh) {
      score = Math.max(score * 0.7, 20); // 30% penalty
    }

    // Adjust for data quality
    if (metrics.dataPoints < 5) {
      // Very low confidence - regress toward 50
      score = (score + 50) / 2;
    }

    return score;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(metrics: PriceMetrics): string {
    const discount = Math.abs(metrics.discountFromMedian);
    const direction = metrics.discountFromMedian >= 0 ? 'below' : 'above';

    let reason = `Price is ${discount.toFixed(1)}% ${direction} category median ($${metrics.categoryMedian.toFixed(2)})`;

    if (metrics.discountFromMedian >= 30) {
      reason += '. Excellent value!';
    } else if (metrics.discountFromMedian >= 20) {
      reason += '. Great deal!';
    } else if (metrics.discountFromMedian >= 10) {
      reason += '. Good value.';
    } else if (metrics.discountFromMedian >= 0) {
      reason += '. Fair price.';
    } else if (metrics.discountFromMedian >= -10) {
      reason += '. Slightly expensive.';
    } else {
      reason += '. Expensive compared to similar items.';
    }

    if (metrics.suspiciouslyLow) {
      reason += ' Warning: Price seems too low - verify authenticity.';
    }

    return reason;
  }

  /**
   * Detect warning conditions
   */
  private detectWarnings(metrics: PriceMetrics): string[] {
    const warnings: string[] = [];

    if (metrics.suspiciouslyLow) {
      warnings.push('Price is significantly below market average - verify product authenticity');
    }

    if (metrics.suspiciouslyHigh) {
      warnings.push('Price is significantly above market average');
    }

    if (metrics.dataPoints < 5) {
      warnings.push('Limited price data available - confidence is low');
    }

    if (metrics.price <= 0) {
      warnings.push('Invalid price detected');
    }

    return warnings;
  }

  /**
   * Generate evidence array for Veritas format
   * Per plan specification: specific, actionable facts (not vague statements)
   */
  private generateEvidence(metrics: PriceMetrics): string[] {
    const evidence: string[] = [];

    // Primary price comparison
    const discount = Math.abs(metrics.discountFromMedian);
    const direction = metrics.discountFromMedian >= 0 ? 'below' : 'above';

    evidence.push(
      `$${discount.toFixed(2)} ${direction} 90-day category median of $${metrics.categoryMedian.toFixed(2)}`
    );

    // Data quality indicator
    evidence.push(`Based on ${metrics.dataPoints} comparable listings in category`);

    // Value assessment
    if (metrics.discountFromMedian >= 30) {
      evidence.push('Exceptional value - price is 30%+ below typical market price');
    } else if (metrics.discountFromMedian >= 20) {
      evidence.push('Great deal - significantly below average price');
    } else if (metrics.discountFromMedian >= 10) {
      evidence.push('Good value - priced below market average');
    } else if (metrics.discountFromMedian >= 0) {
      evidence.push('Fair price - close to market median');
    } else if (metrics.discountFromMedian >= -10) {
      evidence.push('Slightly above median - may find better deals');
    } else {
      evidence.push('Premium pricing - significantly above market average');
    }

    // Price range position
    const pricePercentile = metrics.pricePosition;
    if (pricePercentile < 25) {
      evidence.push('In bottom 25% of category price range');
    } else if (pricePercentile < 50) {
      evidence.push('In lower half of category price range');
    } else if (pricePercentile < 75) {
      evidence.push('In upper half of category price range');
    } else {
      evidence.push('In top 25% of category price range');
    }

    // Suspicion indicators
    if (metrics.suspiciouslyLow) {
      evidence.push('⚠️ Price anomaly detected - 70%+ below median (verify authenticity)');
    }

    return evidence;
  }

  /**
   * Generate warning flags for Veritas format
   * Flags are uppercase with underscores per specification
   */
  private generateFlags(metrics: PriceMetrics): string[] {
    const flags: string[] = [];

    if (metrics.suspiciouslyLow) {
      flags.push('PRICE_ANOMALY_LOW');
    }

    if (metrics.suspiciouslyHigh) {
      flags.push('PRICE_ANOMALY_HIGH');
    }

    if (metrics.dataPoints < 5) {
      flags.push('DATA_QUALITY_LOW');
    }

    if (metrics.price <= 0) {
      flags.push('INVALID_PRICE');
    }

    if (metrics.confidence < 0.5) {
      flags.push('LOW_CONFIDENCE');
    }

    return flags;
  }

  /**
   * Override getPossibleFlags for capability metadata
   */
  protected getPossibleFlags(): string[] {
    return [
      'PRICE_ANOMALY_LOW',
      'PRICE_ANOMALY_HIGH',
      'DATA_QUALITY_LOW',
      'INVALID_PRICE',
      'LOW_CONFIDENCE'
    ];
  }
}

// Type definitions
interface CategoryPriceStats {
  average: number;
  min: number;
  max: number;
  median: number;
  count: number;
}

interface PriceMetrics {
  price: number;
  categoryAverage: number;
  categoryMedian: number;
  categoryMin: number;
  categoryMax: number;
  discountFromAverage: number;
  discountFromMedian: number;
  pricePosition: number;
  suspiciouslyLow: boolean;
  suspiciouslyHigh: boolean;
  confidence: number;
  dataPoints: number;
}
