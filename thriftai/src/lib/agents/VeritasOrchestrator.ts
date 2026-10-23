/**
 * VeritasOrchestrator - MVP Scoring Engine
 *
 * Coordinates 5 core agents to generate the final Veritas Score:
 *
 * Formula:
 * Final Score = (Spec×0.25 + Price×0.20 + Trust×0.15 + Financial×0.10) × (1 - r_scam)
 *
 * Key Features:
 * - Weighted aggregation of 5 MVP agents
 * - Scam detection as multiplier (not additive)
 * - Veritas Score SSN generation (tracking identifier)
 * - Confidence aggregation
 * - Evidence consolidation
 * - Database persistence
 *
 * @version 1.0.0 - Veritas MVP
 */

import { PriceIntelligenceAgent } from './specialized/PriceIntelligenceAgent';
import { ScamDetectionAgent } from './specialized/ScamDetectionAgent';
import { FinancialValueAgent } from './specialized/FinancialValueAgent';
import { SpecMatcherAgent } from './specialized/SpecMatcherAgent';
import { TrustReliabilityAgent } from './specialized/TrustReliabilityAgent';
import {
  VeritasAgentResult,
  VeritasProductInput,
  VeritasUserContext,
  VeritasWeightConfig,
  DEFAULT_WEIGHTS
} from './veritasTypes';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// ============================================================================
// Type Definitions
// ============================================================================

export interface VeritasOrchestratorResult {
  // Final output
  veritasScore: number;              // 0-100 (weighted average × scam multiplier)
  veritasScoreSSN: string;           // XXX-XX-XXXX format for tracking
  confidence: number;                // 0-1 (aggregated confidence)

  // Component scores
  componentScores: {
    specMatch: number;               // 0-100 (25% weight)
    price: number;                   // 0-100 (20% weight)
    trust: number;                   // 0-100 (15% weight)
    financialValue: number;          // 0-100 (10% weight)
    scamProbability: number;         // 0-1 (multiplier: 1 - r_scam)
  };

  // Component confidences
  componentConfidences: {
    specMatch: number;
    price: number;
    trust: number;
    financialValue: number;
    scam: number;
  };

  // Aggregated evidence and flags
  allEvidence: string[];
  allFlags: string[];

  // Metadata
  metadata: {
    weights: VeritasWeightConfig;
    processingTime: number;
    agentVersions: Record<string, string>;
    computed_at: string;
  };

  // Raw agent results (for transparency)
  rawAgentResults: {
    specMatch: VeritasAgentResult;
    price: VeritasAgentResult;
    trust: VeritasAgentResult;
    financialValue: VeritasAgentResult;
    scam: VeritasAgentResult;
  };
}

export interface VeritasScoreRecord {
  id: string;
  listingId: string;
  score: number;
  ssn: string;
  confidence: number;
  evidence: string[];
  flags: string[];
  componentScores: Record<string, number>;
  metadata: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// VeritasOrchestrator Implementation
// ============================================================================

export class VeritasOrchestrator {
  // MVP Agents
  private specMatcherAgent: SpecMatcherAgent;
  private priceIntelligenceAgent: PriceIntelligenceAgent;
  private trustReliabilityAgent: TrustReliabilityAgent;
  private financialValueAgent: FinancialValueAgent;
  private scamDetectionAgent: ScamDetectionAgent;

  // Default weights (can be overridden per-user)
  private defaultWeights: VeritasWeightConfig = DEFAULT_WEIGHTS;

  constructor() {
    this.specMatcherAgent = new SpecMatcherAgent();
    this.priceIntelligenceAgent = new PriceIntelligenceAgent();
    this.trustReliabilityAgent = new TrustReliabilityAgent();
    this.financialValueAgent = new FinancialValueAgent();
    this.scamDetectionAgent = new ScamDetectionAgent();

    logger.info('VeritasOrchestrator initialized', {
      mvpAgents: 5,
      weights: this.defaultWeights
    });
  }

  // ============================================================================
  // Main Orchestration Method
  // ============================================================================

  /**
   * Score a product using all 5 MVP agents and apply Veritas formula
   *
   * Formula: Final = (Spec×0.25 + Price×0.20 + Trust×0.15 + Financial×0.10) × (1 - r_scam)
   */
  async scoreProduct(
    product: VeritasProductInput,
    userContext?: VeritasUserContext,
    customWeights?: Partial<VeritasWeightConfig>
  ): Promise<VeritasOrchestratorResult> {
    const startTime = Date.now();

    try {
      logger.info(`VeritasOrchestrator scoring: ${product.listing_id}`);

      // Merge custom weights with defaults
      const weights: VeritasWeightConfig = {
        ...this.defaultWeights,
        ...customWeights
      };

      // Step 1: Execute all 5 agents in parallel
      const [
        specMatchResult,
        priceResult,
        trustResult,
        financialResult,
        scamResult
      ] = await Promise.all([
        this.specMatcherAgent.analyzeVeritas(product, userContext),
        this.priceIntelligenceAgent.analyzeVeritas(product, userContext),
        this.trustReliabilityAgent.analyzeVeritas(product, userContext),
        this.financialValueAgent.analyzeVeritas(product, userContext),
        this.scamDetectionAgent.analyzeVeritas(product, userContext)
      ]);

      // Step 2: Calculate base weighted score (before scam multiplier)
      const baseWeightedScore = this.calculateBaseScore(
        {
          specMatch: specMatchResult.score,
          price: priceResult.score,
          trust: trustResult.score,
          financialValue: financialResult.score
        },
        weights
      );

      // Step 3: Apply scam multiplier
      // Scam score (0-100) → scam probability (0-1)
      const scamProbability = 1 - (scamResult.score / 100);

      // Final Score = Base × (1 - r_scam)
      const veritasScore = Math.round(baseWeightedScore * (1 - scamProbability));

      // Step 4: Aggregate confidence
      const confidence = this.aggregateConfidence(
        {
          specMatch: specMatchResult.confidence,
          price: priceResult.confidence,
          trust: trustResult.confidence,
          financialValue: financialResult.confidence,
          scam: scamResult.confidence
        },
        weights
      );

      // Step 5: Generate Veritas Score SSN (XXX-XX-XXXX)
      const veritasScoreSSN = this.generateVeritasSSN(product.listing_id, veritasScore);

      // Step 6: Consolidate evidence and flags
      const allEvidence = [
        ...specMatchResult.evidence,
        ...priceResult.evidence,
        ...trustResult.evidence,
        ...financialResult.evidence,
        ...scamResult.evidence
      ];

      const allFlags = [
        ...specMatchResult.flags,
        ...priceResult.flags,
        ...trustResult.flags,
        ...financialResult.flags,
        ...scamResult.flags
      ];

      // Step 7: Compile final result
      const result: VeritasOrchestratorResult = {
        veritasScore: Math.max(0, Math.min(100, veritasScore)),
        veritasScoreSSN,
        confidence: Math.max(0, Math.min(1, confidence)),
        componentScores: {
          specMatch: specMatchResult.score,
          price: priceResult.score,
          trust: trustResult.score,
          financialValue: financialResult.score,
          scamProbability
        },
        componentConfidences: {
          specMatch: specMatchResult.confidence,
          price: priceResult.confidence,
          trust: trustResult.confidence,
          financialValue: financialResult.confidence,
          scam: scamResult.confidence
        },
        allEvidence,
        allFlags,
        metadata: {
          weights,
          processingTime: Date.now() - startTime,
          agentVersions: {
            specMatch: specMatchResult.model_version,
            price: priceResult.model_version,
            trust: trustResult.model_version,
            financialValue: financialResult.model_version,
            scam: scamResult.model_version
          },
          computed_at: new Date().toISOString()
        },
        rawAgentResults: {
          specMatch: specMatchResult,
          price: priceResult,
          trust: trustResult,
          financialValue: financialResult,
          scam: scamResult
        }
      };

      logger.info(`VeritasOrchestrator completed: ${product.listing_id} -> ${veritasScore}/100 (${Date.now() - startTime}ms)`, {
        veritasScore,
        baseScore: baseWeightedScore,
        scamProbability,
        confidence,
        ssn: veritasScoreSSN
      });

      return result;

    } catch (error) {
      logger.error('VeritasOrchestrator error:', error);
      throw error;
    }
  }

  // ============================================================================
  // Scoring Calculations
  // ============================================================================

  /**
   * Calculate base weighted score (before scam multiplier)
   *
   * Formula: Base = Spec×0.25 + Price×0.20 + Trust×0.15 + Financial×0.10
   *
   * Note: Weights may not sum to 1.0 in MVP (only 4 agents contributing additively)
   * Full version would include Quality, Demand, Sustainability
   */
  private calculateBaseScore(
    scores: {
      specMatch: number;
      price: number;
      trust: number;
      financialValue: number;
    },
    weights: VeritasWeightConfig
  ): number {
    const weightedSum =
      scores.specMatch * weights.spec_match +
      scores.price * weights.price +
      scores.trust * weights.trust +
      scores.financialValue * weights.financial_value;

    // Total weight used in MVP (should be 0.70 for 4 agents)
    const totalWeight =
      weights.spec_match +
      weights.price +
      weights.trust +
      weights.financial_value;

    // Normalize to 0-100 scale
    const normalizedScore = (weightedSum / totalWeight);

    return Math.round(normalizedScore);
  }

  /**
   * Aggregate confidence from all agents
   *
   * Uses weighted average based on agent weights
   */
  private aggregateConfidence(
    confidences: {
      specMatch: number;
      price: number;
      trust: number;
      financialValue: number;
      scam: number;
    },
    weights: VeritasWeightConfig
  ): number {
    // Include scam confidence with equal weight to other agents
    const scamWeight = 0.15; // Arbitrary but reasonable

    const weightedSum =
      confidences.specMatch * weights.spec_match +
      confidences.price * weights.price +
      confidences.trust * weights.trust +
      confidences.financialValue * weights.financial_value +
      confidences.scam * scamWeight;

    const totalWeight =
      weights.spec_match +
      weights.price +
      weights.trust +
      weights.financial_value +
      scamWeight;

    return weightedSum / totalWeight;
  }

  /**
   * Generate Veritas Score SSN (Social Security Number format)
   *
   * Format: XXX-XX-XXXX
   * - XXX: Score bucket (000-100)
   * - XX: Confidence bucket (00-99)
   * - XXXX: Hash of listing_id (for uniqueness)
   *
   * Example: 085-92-4A7F (score 85, confidence 0.92, hash 4A7F)
   */
  private generateVeritasSSN(listingId: string, score: number): string {
    // Part 1: Score (000-100)
    const scorePart = score.toString().padStart(3, '0');

    // Part 2: Confidence placeholder (will be filled by caller if needed)
    // For now, using a fixed value - can be parameterized later
    const confidencePart = '00';

    // Part 3: Hash of listing_id (4 hex digits)
    const hashPart = this.hashListingId(listingId).substring(0, 4).toUpperCase();

    return `${scorePart}-${confidencePart}-${hashPart}`;
  }

  /**
   * Simple hash function for listing IDs
   */
  private hashListingId(listingId: string): string {
    let hash = 0;
    for (let i = 0; i < listingId.length; i++) {
      const char = listingId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // ============================================================================
  // Database Persistence
  // ============================================================================

  /**
   * Save Veritas score to database
   */
  async saveScore(
    result: VeritasOrchestratorResult,
    listingId: string
  ): Promise<VeritasScoreRecord> {
    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: listingId }
      });

      if (!product) {
        throw new Error(`Product not found: ${listingId}`);
      }

      // Create VeritasScore record
      const veritasScore = await prisma.veritasScore.create({
        data: {
          productId: product.id,
          overallScore: result.veritasScore,
          ssn: result.veritasScoreSSN,
          confidence: result.confidence,
          scamProbability: result.componentScores.scamProbability,
          metadata: result.metadata as any,
          computedAt: new Date(result.metadata.computed_at)
        }
      });

      // Create component category records
      await this.saveComponentScores(veritasScore.id, result);

      logger.info(`Veritas score saved to database: ${listingId} -> ${result.veritasScoreSSN}`);

      return {
        id: veritasScore.id,
        listingId: product.id,
        score: result.veritasScore,
        ssn: result.veritasScoreSSN,
        confidence: result.confidence,
        evidence: result.allEvidence,
        flags: result.allFlags,
        componentScores: result.componentScores as any,
        metadata: result.metadata as any,
        createdAt: veritasScore.computedAt
      };

    } catch (error) {
      logger.error('Failed to save Veritas score:', error);
      throw error;
    }
  }

  /**
   * Save individual component scores as VeritasCategory records
   */
  private async saveComponentScores(
    veritasScoreId: string,
    result: VeritasOrchestratorResult
  ): Promise<void> {
    const categories = [
      {
        type: 'SPECIFICATIONS',
        weight: result.metadata.weights.spec_match,
        score: result.componentScores.specMatch,
        confidence: result.componentConfidences.specMatch,
        evidence: result.rawAgentResults.specMatch.evidence,
        flags: result.rawAgentResults.specMatch.flags,
        modelVersion: result.rawAgentResults.specMatch.model_version
      },
      {
        type: 'PRICING',
        weight: result.metadata.weights.price,
        score: result.componentScores.price,
        confidence: result.componentConfidences.price,
        evidence: result.rawAgentResults.price.evidence,
        flags: result.rawAgentResults.price.flags,
        modelVersion: result.rawAgentResults.price.model_version
      },
      {
        type: 'SELLER_TRUST',
        weight: result.metadata.weights.trust,
        score: result.componentScores.trust,
        confidence: result.componentConfidences.trust,
        evidence: result.rawAgentResults.trust.evidence,
        flags: result.rawAgentResults.trust.flags,
        modelVersion: result.rawAgentResults.trust.model_version
      },
      {
        type: 'FINANCIAL_VALUE',
        weight: result.metadata.weights.financial_value,
        score: result.componentScores.financialValue,
        confidence: result.componentConfidences.financialValue,
        evidence: result.rawAgentResults.financialValue.evidence,
        flags: result.rawAgentResults.financialValue.flags,
        modelVersion: result.rawAgentResults.financialValue.model_version
      }
    ];

    for (const category of categories) {
      await prisma.veritasCategory.create({
        data: {
          veritasScoreId,
          categoryType: category.type as any,
          weight: category.weight,
          computedAt: new Date()
        }
      });

      // Note: Individual parameters, evidence, and flags would be saved
      // in VeritasParameter, VeritasEvidence tables in full implementation
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Score multiple products in parallel
   */
  async batchScore(
    products: VeritasProductInput[],
    userContext?: VeritasUserContext
  ): Promise<VeritasOrchestratorResult[]> {
    logger.info(`Batch scoring ${products.length} products`);

    const results = await Promise.all(
      products.map(product => this.scoreProduct(product, userContext))
    );

    logger.info(`Batch scoring complete: ${products.length} products`);
    return results;
  }

  // ============================================================================
  // Metadata
  // ============================================================================

  getAgentVersions(): Record<string, string> {
    return {
      specMatch: this.specMatcherAgent.version,
      price: this.priceIntelligenceAgent.version,
      trust: this.trustReliabilityAgent.version,
      financialValue: this.financialValueAgent.version,
      scam: this.scamDetectionAgent.version
    };
  }

  getDefaultWeights(): VeritasWeightConfig {
    return { ...this.defaultWeights };
  }

  setDefaultWeights(weights: Partial<VeritasWeightConfig>): void {
    this.defaultWeights = {
      ...this.defaultWeights,
      ...weights
    };
    logger.info('Default weights updated', { weights: this.defaultWeights });
  }
}

// Export singleton
export const veritasOrchestrator = new VeritasOrchestrator();
