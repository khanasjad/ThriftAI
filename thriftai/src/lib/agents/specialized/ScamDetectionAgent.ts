/**
 * Scam Detection Agent
 *
 * Detects fraudulent listings using multiple signals
 * Per Veritas.AI specification: outputs r_scam (0-1 probability)
 *
 * Final Veritas Score = Base Score × (1 - r_scam)
 *
 * Detection Strategies:
 * 1. Price Anomaly: >70% below median (likely scam or counterfeit)
 * 2. Seller Velocity: New seller with unusually high volume
 * 3. Listing Quality: Missing details, stock photos, vague descriptions
 * 4. Suspicious Patterns: Too-good-to-be-true combinations
 *
 * Future enhancements:
 * - Duplicate image detection (pHash)
 * - Stolen image detection (reverse image search)
 * - Graph-based scam ring detection
 */

import { DeterministicBaseAgent, type ProductInput } from '../DeterministicBaseAgent';
import type { AgentResult } from '../types';
import type { VeritasAgentResult, VeritasProductInput } from '../veritasTypes';
import { prisma } from '@/lib/prisma';

interface ScamSignals {
  priceAnomalyScore: number;      // 0-1 (higher = more suspicious)
  sellerTrustScore: number;       // 0-1 (higher = more suspicious)
  listingQualityScore: number;    // 0-1 (higher = more suspicious)
  suspiciousPatternScore: number; // 0-1 (higher = more suspicious)
}

interface CategoryPriceStats {
  median: number;
  average: number;
  stdDev: number;
  count: number;
}

export class ScamDetectionAgent extends DeterministicBaseAgent {
  readonly name = 'ScamDetectionAgent';
  readonly weight = 0; // Special: acts as multiplier, not additive
  readonly description = 'Detects fraudulent listings and scam patterns';
  readonly version = 'v1.0';

  // Thresholds (tunable based on production data)
  private readonly PRICE_ANOMALY_THRESHOLD = 0.70; // 70% below median
  private readonly HIGH_VOLUME_THRESHOLD = 50; // listings per month
  private readonly NEW_SELLER_DAYS = 30; // days since account creation

  /**
   * Legacy analyze method (deprecated)
   */
  async analyze(product: ProductInput): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const signals = await this.detectScamSignals({
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        category: product.category,
        description: product.description,
        condition: product.condition,
        seller: product.seller ? {
          id: product.seller.name, // Fallback
          name: product.seller.name,
          rating: product.seller.rating,
          review_count: product.seller.reviewCount,
          verified: product.seller.verified,
          response_time_hours: undefined
        } : undefined,
        images: product.images
      });

      const scamProbability = this.calculateScamProbability(signals);
      const score = Math.round((1 - scamProbability) * 100);
      const reasoning = this.generateReasoning(signals, scamProbability);

      return this.createResult(
        score,
        0.75,
        reasoning,
        { scamProbability, signals },
        Date.now() - startTime,
        scamProbability > 0.5 ? ['High scam probability detected'] : undefined
      );
    } catch (error) {
      this.log('error', 'Scam detection failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createResult(
        50,
        0.3,
        'Unable to assess scam risk',
        { error: true },
        Date.now() - startTime,
        ['Scam detection unavailable']
      );
    }
  }

  /**
   * Veritas-compliant analysis method
   */
  async analyzeVeritas(product: VeritasProductInput): Promise<VeritasAgentResult> {
    const startTime = Date.now();

    try {
      // Detect all scam signals
      const signals = await this.detectScamSignals(product);

      // Calculate overall scam probability (r_scam)
      const scamProbability = this.calculateScamProbability(signals);

      // Generate evidence
      const evidence = this.generateEvidence(signals, scamProbability);

      // Generate flags
      const flags = this.generateFlags(signals, scamProbability);

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(product, signals);

      // Score is inverse of scam probability (0 = definite scam, 100 = no scam)
      const score = Math.round((1 - scamProbability) * 100);

      const processingTime = Date.now() - startTime;

      this.log('info', 'Scam detection completed', {
        productId: product.id,
        scamProbability,
        score,
        flagCount: flags.length
      });

      return this.createVeritasResult(
        product.id,
        score,
        confidence,
        evidence,
        flags,
        {
          processing_time_ms: processingTime,
          scam_probability: scamProbability,
          signals: {
            price_anomaly: signals.priceAnomalyScore,
            seller_trust: signals.sellerTrustScore,
            listing_quality: signals.listingQualityScore,
            suspicious_patterns: signals.suspiciousPatternScore
          },
          data_sources: ['product_database', 'seller_database']
        }
      );

    } catch (error) {
      this.log('error', 'Scam detection failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Conservative approach: moderate score when detection fails
      return this.createVeritasResult(
        product.id,
        50,
        0.3,
        ['Unable to assess scam risk - insufficient data'],
        ['DETECTION_FAILED'],
        {
          processing_time_ms: Date.now() - startTime,
          fallback_used: true,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Detect all scam signals for a product
   */
  private async detectScamSignals(product: VeritasProductInput): Promise<ScamSignals> {
    // Run all detection methods in parallel
    const [priceAnomalyScore, sellerTrustScore, listingQualityScore, suspiciousPatternScore] =
      await Promise.all([
        this.detectPriceAnomaly(product),
        this.assessSellerTrust(product),
        this.assessListingQuality(product),
        this.detectSuspiciousPatterns(product)
      ]);

    return {
      priceAnomalyScore,
      sellerTrustScore,
      listingQualityScore,
      suspiciousPatternScore
    };
  }

  /**
   * 1. Price Anomaly Detection
   * Detects prices that are too good to be true (>70% below median)
   */
  private async detectPriceAnomaly(product: VeritasProductInput): Promise<number> {
    try {
      const category = product.category || 'General';
      const stats = await this.getCategoryPriceStats(category);

      if (stats.count < 3) {
        return 0; // Not enough data to detect anomaly
      }

      const discountFromMedian = (stats.median - product.price) / stats.median;

      // No anomaly if price is at or above median
      if (discountFromMedian <= 0) {
        return 0;
      }

      // Linear scale from 0 to 1 based on discount
      if (discountFromMedian >= this.PRICE_ANOMALY_THRESHOLD) {
        // 70%+ below median = definite red flag
        return 1.0;
      } else if (discountFromMedian >= 0.50) {
        // 50-70% below = suspicious
        return 0.7;
      } else if (discountFromMedian >= 0.30) {
        // 30-50% below = questionable
        return 0.4;
      } else {
        // < 30% below = normal deal
        return 0;
      }

    } catch (error) {
      this.log('warn', 'Price anomaly detection failed', { error });
      return 0;
    }
  }

  /**
   * 2. Seller Trust Assessment
   * New sellers with high volume are suspicious
   */
  private async assessSellerTrust(product: VeritasProductInput): Promise<number> {
    if (!product.seller) {
      return 0.3; // Moderate suspicion if no seller info
    }

    let suspicionScore = 0;

    // Factor 1: New account with high volume
    const memberSince = product.seller.member_since
      ? new Date(product.seller.member_since)
      : null;

    if (memberSince) {
      const accountAgeInDays = (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24);

      if (accountAgeInDays < this.NEW_SELLER_DAYS) {
        // New account - check listing volume
        const sellerListingCount = await this.getSellerListingCount(product.seller.id);

        if (sellerListingCount > this.HIGH_VOLUME_THRESHOLD) {
          // New seller + high volume = very suspicious
          suspicionScore += 0.8;
        } else if (sellerListingCount > 20) {
          // New seller + moderate volume = somewhat suspicious
          suspicionScore += 0.4;
        } else {
          // New seller + low volume = slightly suspicious
          suspicionScore += 0.2;
        }
      }
    }

    // Factor 2: Low/no ratings
    if (!product.seller.rating || product.seller.rating < 2.0) {
      suspicionScore += 0.3;
    }

    // Factor 3: Few/no reviews
    if (!product.seller.review_count || product.seller.review_count < 3) {
      suspicionScore += 0.2;
    }

    // Factor 4: Not verified
    if (!product.seller.verified) {
      suspicionScore += 0.1;
    }

    return Math.min(1.0, suspicionScore);
  }

  /**
   * 3. Listing Quality Assessment
   * Poor quality listings are more likely to be scams
   */
  private async assessListingQuality(product: VeritasProductInput): Promise<number> {
    let qualityIssues = 0;

    // Factor 1: Vague/missing title
    if (!product.name || product.name.length < 10) {
      qualityIssues += 0.3;
    }

    // Factor 2: Missing/short description
    if (!product.description || product.description.length < 50) {
      qualityIssues += 0.3;
    }

    // Factor 3: No images
    if (!product.images || product.images.length === 0) {
      qualityIssues += 0.4;
    }

    // Factor 4: Suspicious keywords in description
    if (product.description) {
      const suspiciousKeywords = [
        'wire transfer',
        'western union',
        'moneygram',
        'cashiers check',
        'cash only',
        'urgent sale',
        'must sell today',
        'no refunds',
        'as-is only'
      ];

      const lowerDesc = product.description.toLowerCase();
      const foundSuspicious = suspiciousKeywords.filter(keyword =>
        lowerDesc.includes(keyword)
      );

      qualityIssues += foundSuspicious.length * 0.2;
    }

    // Factor 5: Brand mismatch (e.g., "iPhone" in title but no Apple brand)
    if (product.name && product.brand) {
      const titleLower = product.name.toLowerCase();
      const knownBrands = ['apple', 'samsung', 'sony', 'nike', 'adidas'];

      for (const brand of knownBrands) {
        if (titleLower.includes(brand) && !product.brand.toLowerCase().includes(brand)) {
          qualityIssues += 0.3;
          break;
        }
      }
    }

    return Math.min(1.0, qualityIssues);
  }

  /**
   * 4. Suspicious Pattern Detection
   * Combinations of factors that indicate scams
   */
  private async detectSuspiciousPatterns(product: VeritasProductInput): Promise<number> {
    let patternScore = 0;

    // Pattern 1: Luxury item at very low price with new seller
    if (product.price > 500) {
      const isLuxuryKeyword = product.name?.toLowerCase().match(
        /iphone|macbook|rolex|gucci|louis vuitton|chanel/
      );

      if (isLuxuryKeyword && product.seller) {
        const accountAge = product.seller.member_since
          ? (Date.now() - new Date(product.seller.member_since).getTime()) / (1000 * 60 * 60 * 24)
          : 999;

        if (accountAge < 30 && product.price < 500) {
          patternScore += 0.6; // Luxury item cheap + new seller = red flag
        }
      }
    }

    // Pattern 2: "New" condition but suspiciously low price
    if (product.condition === 'new' && product.price) {
      try {
        const stats = await this.getCategoryPriceStats(product.category || 'General');
        const discount = (stats.median - product.price) / stats.median;

        if (discount > 0.5) {
          patternScore += 0.5; // "New" item at 50%+ discount = suspicious
        }
      } catch (error) {
        // Ignore if stats unavailable
      }
    }

    // Pattern 3: Multiple contact methods requested (phishing)
    if (product.description) {
      const contactPatterns = /email|call|text|whatsapp|telegram/gi;
      const matches = product.description.match(contactPatterns);

      if (matches && matches.length > 2) {
        patternScore += 0.3; // Multiple off-platform contact methods = suspicious
      }
    }

    return Math.min(1.0, patternScore);
  }

  /**
   * Calculate overall scam probability from signals
   * Weighted combination of all signals
   */
  private calculateScamProbability(signals: ScamSignals): number {
    // Weighted average of all signals
    const weights = {
      priceAnomaly: 0.4,      // Strongest signal
      sellerTrust: 0.3,       // Important but can be misleading
      listingQuality: 0.2,    // Moderate signal
      suspiciousPatterns: 0.1 // Additional context
    };

    const weightedSum =
      signals.priceAnomalyScore * weights.priceAnomaly +
      signals.sellerTrustScore * weights.sellerTrust +
      signals.listingQualityScore * weights.listingQuality +
      signals.suspiciousPatternScore * weights.suspiciousPatterns;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, weightedSum));
  }

  /**
   * Calculate confidence in scam detection
   */
  private calculateConfidence(
    product: VeritasProductInput,
    signals: ScamSignals
  ): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence if we have seller data
    if (product.seller) {
      confidence += 0.1;
    }

    // Higher confidence if we have description
    if (product.description && product.description.length > 100) {
      confidence += 0.1;
    }

    // Higher confidence if we have images
    if (product.images && product.images.length > 0) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Generate evidence array
   */
  private generateEvidence(signals: ScamSignals, scamProbability: number): string[] {
    const evidence: string[] = [];

    // Overall assessment
    if (scamProbability >= 0.8) {
      evidence.push('⚠️ CRITICAL: High scam probability detected');
    } else if (scamProbability >= 0.6) {
      evidence.push('⚠️ WARNING: Moderate scam risk detected');
    } else if (scamProbability >= 0.3) {
      evidence.push('CAUTION: Some suspicious signals present');
    } else {
      evidence.push('No significant scam indicators detected');
    }

    // Price anomaly evidence
    if (signals.priceAnomalyScore > 0.5) {
      evidence.push(`Price is suspiciously low (${Math.round(signals.priceAnomalyScore * 100)}% anomaly score)`);
    }

    // Seller trust evidence
    if (signals.sellerTrustScore > 0.5) {
      evidence.push(`Seller trust concerns detected (${Math.round(signals.sellerTrustScore * 100)}% risk score)`);
    } else if (signals.sellerTrustScore < 0.2 && signals.sellerTrustScore > 0) {
      evidence.push('Seller appears trustworthy based on available data');
    }

    // Listing quality evidence
    if (signals.listingQualityScore > 0.5) {
      evidence.push('Listing quality is poor (missing details, vague description)');
    }

    // Pattern evidence
    if (signals.suspiciousPatternScore > 0.5) {
      evidence.push('Suspicious patterns detected (luxury item + low price, multiple contact methods, etc.)');
    }

    // Final scam probability
    evidence.push(`Overall scam probability: ${Math.round(scamProbability * 100)}%`);

    return evidence;
  }

  /**
   * Generate warning flags
   */
  private generateFlags(signals: ScamSignals, scamProbability: number): string[] {
    const flags: string[] = [];

    if (scamProbability >= 0.8) {
      flags.push('SCAM_HIGH_RISK');
    } else if (scamProbability >= 0.6) {
      flags.push('SCAM_MODERATE_RISK');
    } else if (scamProbability >= 0.3) {
      flags.push('SCAM_LOW_RISK');
    }

    if (signals.priceAnomalyScore >= 0.7) {
      flags.push('PRICE_TOO_LOW');
    }

    if (signals.sellerTrustScore >= 0.7) {
      flags.push('SELLER_SUSPICIOUS');
    }

    if (signals.listingQualityScore >= 0.7) {
      flags.push('LISTING_QUALITY_POOR');
    }

    if (signals.suspiciousPatternScore >= 0.5) {
      flags.push('SUSPICIOUS_PATTERN');
    }

    return flags;
  }

  /**
   * Generate reasoning string (legacy format)
   */
  private generateReasoning(signals: ScamSignals, scamProbability: number): string {
    if (scamProbability >= 0.8) {
      return 'HIGH RISK: Multiple scam indicators detected. Proceed with extreme caution.';
    } else if (scamProbability >= 0.6) {
      return 'MODERATE RISK: Some scam indicators present. Verify carefully before purchasing.';
    } else if (scamProbability >= 0.3) {
      return 'LOW RISK: Minor concerns detected. Standard caution advised.';
    } else {
      return 'SAFE: No significant scam indicators detected.';
    }
  }

  /**
   * Get category price statistics
   */
  private async getCategoryPriceStats(category: string): Promise<CategoryPriceStats> {
    try {
      const stats = await prisma.product.aggregate({
        where: {
          category,
          isAvailable: true,
          price: { gt: 0 }
        },
        _avg: { price: true },
        _count: true
      });

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
        median: medianProduct[0]?.price || stats._avg.price || 100,
        average: stats._avg.price || 100,
        stdDev: 0, // TODO: Calculate if needed
        count: stats._count || 0
      };
    } catch (error) {
      this.log('warn', 'Failed to get category stats', { category, error });
      return { median: 100, average: 100, stdDev: 0, count: 0 };
    }
  }

  /**
   * Get seller's total listing count
   */
  private async getSellerListingCount(sellerId: string): Promise<number> {
    try {
      const count = await prisma.product.count({
        where: {
          sellerId
        }
      });
      return count;
    } catch (error) {
      this.log('warn', 'Failed to get seller listing count', { sellerId, error });
      return 0;
    }
  }

  /**
   * Override getPossibleFlags for capability metadata
   */
  protected getPossibleFlags(): string[] {
    return [
      'SCAM_HIGH_RISK',
      'SCAM_MODERATE_RISK',
      'SCAM_LOW_RISK',
      'PRICE_TOO_LOW',
      'SELLER_SUSPICIOUS',
      'LISTING_QUALITY_POOR',
      'SUSPICIOUS_PATTERN',
      'DETECTION_FAILED'
    ];
  }

  /**
   * Override getRequiredFields
   */
  protected getRequiredFields(): string[] {
    return ['id', 'name', 'price'];
  }

  /**
   * Override getOptionalFields
   */
  protected getOptionalFields(): string[] {
    return [
      'brand',
      'category',
      'description',
      'condition',
      'seller',
      'images'
    ];
  }
}
