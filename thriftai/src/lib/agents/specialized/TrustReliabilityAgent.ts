/**
 * TrustReliabilityAgent - Seller Trust & Reliability Assessment
 *
 * Weight: 15% in MVP formula
 *
 * Evaluates seller trustworthiness and platform reliability through:
 * 1. Bayesian Rating Aggregation (Wilson score lower bound)
 * 2. Seller History Analysis (account age, volume, dispute rate)
 * 3. Return Policy Completeness
 * 4. Shipping Reliability Assessment
 *
 * Output: Veritas-compliant JSON with score 0-100, confidence, evidence, flags
 */

import { DeterministicBaseAgent } from '../DeterministicBaseAgent';
import {
  VeritasAgentResult,
  VeritasProductInput,
  VeritasUserContext,
  VeritasSellerProfile,
  VeritasQualitySignals
} from '../veritasTypes';
import { logger } from '@/lib/logger';

// ============================================================================
// Type Definitions
// ============================================================================

interface BayesianRating {
  wilsonScore: number;           // Lower bound of Wilson score confidence interval
  adjustedRating: number;        // Rating adjusted for sample size
  confidence: number;            // Confidence in the rating (0-1)
  ratingsCount: number;
  averageRating: number;
  reasoning: string;
}

interface SellerHistoryMetrics {
  accountAgeScore: number;       // 0-100 based on account age
  volumeScore: number;           // 0-100 based on sales volume
  disputeScore: number;          // 0-100 based on dispute rate (inverse)
  overallScore: number;          // Weighted combination
  flags: string[];
  evidence: string[];
}

interface ReturnPolicyAssessment {
  score: number;                 // 0-100
  hasPolicy: boolean;
  policyDuration: number | null; // Days (e.g., 30, 60, 90)
  hasFreeSReturn: boolean;
  hasRestockingFee: boolean;
  evidence: string[];
  flags: string[];
}

interface ShippingReliability {
  score: number;                 // 0-100
  hasTracking: boolean;
  estimatedDays: number | null;
  hasInsurance: boolean;
  carrierReliability: number;    // 0-1 (based on known carriers)
  evidence: string[];
  flags: string[];
}

interface TrustMetrics {
  bayesianRating: BayesianRating;
  sellerHistory: SellerHistoryMetrics;
  returnPolicy: ReturnPolicyAssessment;
  shippingReliability: ShippingReliability;
  finalScore: number;            // 0-100
  confidence: number;            // 0-1
  allEvidence: string[];
  allFlags: string[];
}

// ============================================================================
// TrustReliabilityAgent Implementation
// ============================================================================

export class TrustReliabilityAgent extends DeterministicBaseAgent {
  readonly version = 'v1.0';
  readonly name = 'TrustReliabilityAgent';
  readonly description = 'Evaluates seller trustworthiness using Bayesian rating, seller history, return policies, and shipping reliability';
  readonly weight = 0.15; // 15% in MVP formula

  // Weights for trust factors (sum = 1.0)
  private readonly FACTOR_WEIGHTS = {
    bayesianRating: 0.45,      // Most important: actual seller ratings
    sellerHistory: 0.30,       // Second: account age, volume, disputes
    returnPolicy: 0.15,        // Third: buyer protection
    shippingReliability: 0.10  // Fourth: delivery confidence
  };

  // Bayesian rating parameters (Wilson score)
  private readonly BAYESIAN_CONFIDENCE_LEVEL = 0.95; // 95% confidence interval
  private readonly Z_SCORE = 1.96; // Z-score for 95% CI

  // Seller history thresholds
  private readonly ACCOUNT_AGE_THRESHOLDS = {
    excellent: 730,  // 2+ years
    good: 365,       // 1+ year
    moderate: 180,   // 6+ months
    new: 30          // 1+ month
  };

  private readonly VOLUME_THRESHOLDS = {
    highVolume: 1000,
    mediumVolume: 100,
    lowVolume: 10
  };

  // ============================================================================
  // Main Analysis Methods
  // ============================================================================

  async analyze(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): Promise<VeritasAgentResult> {
    return this.analyzeVeritas(product, userContext);
  }

  async analyzeVeritas(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): Promise<VeritasAgentResult> {
    const startTime = Date.now();

    try {
      logger.debug(`TrustReliabilityAgent analyzing listing: ${product.listing_id}`);

      // Calculate all trust metrics
      const metrics = this.calculateTrustMetrics(product);

      // Create Veritas-compliant result
      const result = this.createVeritasResult(
        product.listing_id,
        metrics.finalScore,
        metrics.confidence,
        metrics.allEvidence,
        metrics.allFlags,
        {
          processingTime: Date.now() - startTime,
          factorScores: {
            bayesianRating: metrics.bayesianRating.wilsonScore * 100,
            sellerHistory: metrics.sellerHistory.overallScore,
            returnPolicy: metrics.returnPolicy.score,
            shippingReliability: metrics.shippingReliability.score
          },
          weights: this.FACTOR_WEIGHTS
        }
      );

      logger.info(`TrustReliabilityAgent completed: ${product.listing_id} -> ${metrics.finalScore}/100 (${Date.now() - startTime}ms)`);
      return result;

    } catch (error) {
      logger.error('TrustReliabilityAgent error:', error);

      // Fallback result on error
      return this.createVeritasResult(
        product.listing_id,
        50, // Neutral score
        0.3, // Low confidence
        ['Error during trust analysis - using fallback score'],
        ['TRUST_ANALYSIS_ERROR'],
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // ============================================================================
  // Trust Metrics Calculation
  // ============================================================================

  private calculateTrustMetrics(product: VeritasProductInput): TrustMetrics {
    // 1. Bayesian Rating (Wilson score)
    const bayesianRating = this.calculateBayesianRating(
      product.seller_profile,
      product.quality_signals
    );

    // 2. Seller History
    const sellerHistory = this.analyzeSellerHistory(product.seller_profile);

    // 3. Return Policy
    const returnPolicy = this.assessReturnPolicy(product.quality_signals);

    // 4. Shipping Reliability
    const shippingReliability = this.assessShippingReliability(product);

    // 5. Weighted final score
    const finalScore = Math.round(
      bayesianRating.wilsonScore * 100 * this.FACTOR_WEIGHTS.bayesianRating +
      sellerHistory.overallScore * this.FACTOR_WEIGHTS.sellerHistory +
      returnPolicy.score * this.FACTOR_WEIGHTS.returnPolicy +
      shippingReliability.score * this.FACTOR_WEIGHTS.shippingReliability
    );

    // 6. Overall confidence (average of component confidences)
    const confidence = (
      bayesianRating.confidence * this.FACTOR_WEIGHTS.bayesianRating +
      0.8 * this.FACTOR_WEIGHTS.sellerHistory +
      0.7 * this.FACTOR_WEIGHTS.returnPolicy +
      0.6 * this.FACTOR_WEIGHTS.shippingReliability
    );

    // 7. Combine evidence and flags
    const allEvidence = [
      ...bayesianRating.reasoning ? [bayesianRating.reasoning] : [],
      ...sellerHistory.evidence,
      ...returnPolicy.evidence,
      ...shippingReliability.evidence
    ];

    const allFlags = [
      ...sellerHistory.flags,
      ...returnPolicy.flags,
      ...shippingReliability.flags
    ];

    return {
      bayesianRating,
      sellerHistory,
      returnPolicy,
      shippingReliability,
      finalScore: Math.max(0, Math.min(100, finalScore)),
      confidence: Math.max(0, Math.min(1, confidence)),
      allEvidence,
      allFlags
    };
  }

  // ============================================================================
  // Factor 1: Bayesian Rating (Wilson Score)
  // ============================================================================

  /**
   * Calculates Wilson score lower bound for confidence interval
   *
   * This prevents:
   * - New sellers with 1 perfect review (5/5, n=1) from outranking
   *   established sellers (4.8/5, n=1000)
   *
   * Formula: Wilson score lower bound
   * https://www.evanmiller.org/how-not-to-sort-by-average-rating.html
   */
  private calculateBayesianRating(
    sellerProfile?: VeritasSellerProfile,
    qualitySignals?: VeritasQualitySignals
  ): BayesianRating {
    // Default: no rating data
    if (!sellerProfile?.seller_rating || !sellerProfile?.seller_reviews_count) {
      return {
        wilsonScore: 0.5,
        adjustedRating: 0,
        confidence: 0.2,
        ratingsCount: 0,
        averageRating: 0,
        reasoning: 'No seller rating data available - using neutral baseline'
      };
    }

    const avgRating = sellerProfile.seller_rating;
    const n = sellerProfile.seller_reviews_count;

    // Convert 5-star rating to proportion (0-1)
    const p = avgRating / 5.0;

    // Wilson score lower bound calculation
    const z = this.Z_SCORE;
    const z2 = z * z;

    const denominator = 1 + z2 / n;
    const pHat = p + z2 / (2 * n);
    const interval = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);

    const wilsonScore = (pHat - interval) / denominator;

    // Confidence increases with sample size (logarithmic curve)
    // n=1: ~0.3, n=10: ~0.6, n=100: ~0.8, n=1000: ~0.9
    const confidence = Math.min(0.95, 0.3 + 0.2 * Math.log10(n + 1));

    return {
      wilsonScore: Math.max(0, Math.min(1, wilsonScore)),
      adjustedRating: avgRating,
      confidence,
      ratingsCount: n,
      averageRating: avgRating,
      reasoning: `Seller rating: ${avgRating.toFixed(2)}/5.0 from ${n} reviews (Wilson score: ${(wilsonScore * 100).toFixed(1)})`
    };
  }

  // ============================================================================
  // Factor 2: Seller History
  // ============================================================================

  private analyzeSellerHistory(sellerProfile?: VeritasSellerProfile): SellerHistoryMetrics {
    const evidence: string[] = [];
    const flags: string[] = [];

    // 1. Account Age Score
    const accountAgeDays = this.calculateAccountAge(sellerProfile?.seller_member_since);
    const accountAgeScore = this.scoreAccountAge(accountAgeDays);

    if (accountAgeDays !== null) {
      const years = (accountAgeDays / 365).toFixed(1);
      evidence.push(`Account age: ${years} years`);

      if (accountAgeDays < this.ACCOUNT_AGE_THRESHOLDS.new) {
        flags.push('VERY_NEW_SELLER');
        evidence.push('Warning: Very new seller account (< 1 month)');
      } else if (accountAgeDays < this.ACCOUNT_AGE_THRESHOLDS.moderate) {
        flags.push('NEW_SELLER');
      }
    } else {
      evidence.push('Account age unknown');
      flags.push('MISSING_SELLER_DATA');
    }

    // 2. Sales Volume Score
    const salesCount = sellerProfile?.seller_total_sales || 0;
    const volumeScore = this.scoreVolume(salesCount);

    evidence.push(`Total sales: ${salesCount}`);

    if (salesCount === 0) {
      flags.push('NO_SALES_HISTORY');
      evidence.push('Warning: Seller has no sales history');
    } else if (salesCount < this.VOLUME_THRESHOLDS.lowVolume) {
      flags.push('LOW_SALES_VOLUME');
    }

    // 3. Dispute Rate Score (inverse - lower is better)
    const disputeRate = sellerProfile?.seller_disputes_count && sellerProfile?.seller_total_sales
      ? sellerProfile.seller_disputes_count / sellerProfile.seller_total_sales
      : 0;

    const disputeScore = this.scoreDisputeRate(disputeRate);

    if (disputeRate > 0) {
      evidence.push(`Dispute rate: ${(disputeRate * 100).toFixed(2)}%`);

      if (disputeRate > 0.05) {
        flags.push('HIGH_DISPUTE_RATE');
        evidence.push('Warning: High dispute rate (> 5%)');
      } else if (disputeRate > 0.02) {
        flags.push('ELEVATED_DISPUTE_RATE');
      }
    }

    // 4. Overall seller history score (weighted)
    const overallScore = Math.round(
      accountAgeScore * 0.4 +
      volumeScore * 0.4 +
      disputeScore * 0.2
    );

    return {
      accountAgeScore,
      volumeScore,
      disputeScore,
      overallScore,
      flags,
      evidence
    };
  }

  private calculateAccountAge(memberSince?: string | null): number | null {
    if (!memberSince) return null;

    try {
      const joinDate = new Date(memberSince);
      const now = new Date();
      const diffMs = now.getTime() - joinDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  }

  private scoreAccountAge(ageDays: number | null): number {
    if (ageDays === null) return 50; // Neutral if unknown

    if (ageDays >= this.ACCOUNT_AGE_THRESHOLDS.excellent) return 100;
    if (ageDays >= this.ACCOUNT_AGE_THRESHOLDS.good) return 80;
    if (ageDays >= this.ACCOUNT_AGE_THRESHOLDS.moderate) return 60;
    if (ageDays >= this.ACCOUNT_AGE_THRESHOLDS.new) return 40;
    return 20; // Very new account
  }

  private scoreVolume(salesCount: number): number {
    if (salesCount >= this.VOLUME_THRESHOLDS.highVolume) return 100;
    if (salesCount >= this.VOLUME_THRESHOLDS.mediumVolume) return 80;
    if (salesCount >= this.VOLUME_THRESHOLDS.lowVolume) return 60;
    if (salesCount > 0) return 40;
    return 20; // No sales history
  }

  private scoreDisputeRate(rate: number): number {
    // Inverse scoring: lower dispute rate = higher score
    if (rate === 0) return 100;
    if (rate <= 0.01) return 90;
    if (rate <= 0.02) return 75;
    if (rate <= 0.05) return 50;
    if (rate <= 0.10) return 25;
    return 10; // Very high dispute rate
  }

  // ============================================================================
  // Factor 3: Return Policy
  // ============================================================================

  private assessReturnPolicy(qualitySignals?: VeritasQualitySignals): ReturnPolicyAssessment {
    const evidence: string[] = [];
    const flags: string[] = [];

    // Extract return policy data
    const hasPolicy = qualitySignals?.return_policy_days !== undefined &&
                      qualitySignals.return_policy_days > 0;
    const policyDuration = qualitySignals?.return_policy_days || null;
    const hasFreeSReturn = qualitySignals?.free_returns === true;
    const hasRestockingFee = qualitySignals?.restocking_fee === true;

    let score = 0;

    if (!hasPolicy) {
      score = 30; // Low score for no returns
      evidence.push('No return policy available');
      flags.push('NO_RETURN_POLICY');
    } else {
      // Base score for having a policy
      score = 50;
      evidence.push(`Return policy: ${policyDuration} days`);

      // Duration bonuses
      if (policyDuration! >= 90) {
        score += 30;
        evidence.push('Excellent: 90+ day return window');
      } else if (policyDuration! >= 60) {
        score += 20;
        evidence.push('Good: 60+ day return window');
      } else if (policyDuration! >= 30) {
        score += 10;
        evidence.push('Standard: 30+ day return window');
      } else {
        flags.push('SHORT_RETURN_WINDOW');
        evidence.push(`Warning: Short return window (${policyDuration} days)`);
      }

      // Free returns bonus
      if (hasFreeSReturn) {
        score += 15;
        evidence.push('Free return shipping included');
      } else {
        flags.push('PAID_RETURNS');
      }

      // Restocking fee penalty
      if (hasRestockingFee) {
        score -= 10;
        evidence.push('Warning: Restocking fee applies');
        flags.push('RESTOCKING_FEE');
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      hasPolicy,
      policyDuration,
      hasFreeSReturn,
      hasRestockingFee,
      evidence,
      flags
    };
  }

  // ============================================================================
  // Factor 4: Shipping Reliability
  // ============================================================================

  private assessShippingReliability(product: VeritasProductInput): ShippingReliability {
    const evidence: string[] = [];
    const flags: string[] = [];

    const qualitySignals = product.quality_signals;

    // Extract shipping data
    const hasTracking = qualitySignals?.shipping_tracking === true;
    const estimatedDays = qualitySignals?.shipping_days || null;
    const hasInsurance = qualitySignals?.shipping_insurance === true;
    const carrier = qualitySignals?.shipping_carrier || null;

    let score = 50; // Baseline

    // Tracking
    if (hasTracking) {
      score += 20;
      evidence.push('Tracking number provided');
    } else {
      score -= 10;
      flags.push('NO_TRACKING');
      evidence.push('Warning: No tracking information');
    }

    // Delivery timeframe
    if (estimatedDays !== null) {
      evidence.push(`Estimated delivery: ${estimatedDays} days`);

      if (estimatedDays <= 3) {
        score += 15;
        evidence.push('Fast shipping (≤ 3 days)');
      } else if (estimatedDays <= 7) {
        score += 10;
      } else if (estimatedDays > 14) {
        score -= 10;
        flags.push('SLOW_SHIPPING');
        evidence.push('Warning: Slow shipping (> 14 days)');
      }
    }

    // Insurance
    if (hasInsurance) {
      score += 10;
      evidence.push('Shipping insurance included');
    }

    // Carrier reliability (basic heuristic)
    const carrierReliability = this.getCarrierReliability(carrier);
    score += carrierReliability * 15;

    if (carrier) {
      evidence.push(`Carrier: ${carrier}`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      hasTracking,
      estimatedDays,
      hasInsurance,
      carrierReliability,
      evidence,
      flags
    };
  }

  private getCarrierReliability(carrier: string | null): number {
    if (!carrier) return 0.5; // Neutral if unknown

    const carrierLower = carrier.toLowerCase();

    // Known reliable carriers
    if (carrierLower.includes('ups') ||
        carrierLower.includes('fedex') ||
        carrierLower.includes('usps') ||
        carrierLower.includes('dhl')) {
      return 1.0;
    }

    // Regional carriers
    if (carrierLower.includes('ontrac') || carrierLower.includes('lasership')) {
      return 0.7;
    }

    return 0.5; // Unknown carrier
  }

  // ============================================================================
  // Metadata
  // ============================================================================

  getPossibleFlags(): string[] {
    return [
      'TRUST_ANALYSIS_ERROR',
      'VERY_NEW_SELLER',
      'NEW_SELLER',
      'MISSING_SELLER_DATA',
      'NO_SALES_HISTORY',
      'LOW_SALES_VOLUME',
      'HIGH_DISPUTE_RATE',
      'ELEVATED_DISPUTE_RATE',
      'NO_RETURN_POLICY',
      'SHORT_RETURN_WINDOW',
      'PAID_RETURNS',
      'RESTOCKING_FEE',
      'NO_TRACKING',
      'SLOW_SHIPPING'
    ];
  }
}
