/**
 * Deterministic Base Agent
 *
 * Base class for all deterministic agents that don't require AI APIs
 * Uses rule-based logic for scoring
 *
 * Updated to conform to Veritas.AI Product & Technical Plan specification
 */

import { logger } from '@/lib/logger';
import type { AgentResult } from './types';
import type {
  VeritasAgentResult,
  VeritasProductInput,
  AgentCapability
} from './veritasTypes';

export interface ProductInput {
  id: string;
  name: string;
  price: number;
  brand?: string;
  category?: string;
  description?: string;
  condition?: string;
  seller?: SellerInfo;
  images?: string[];
  metadata?: ProductMetadata;
}

export interface SellerInfo {
  name: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  responseTime?: string;
  returnPolicy?: string;
}

export interface ProductMetadata {
  ageInMonths?: number;
  stockPhotos?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  limitedEdition?: boolean;
  warranty?: string;
  shippingCost?: number;
  seasonality?: 'winter' | 'summer' | 'spring' | 'fall' | 'all-season';
  keywords?: string[];
  specifications?: Record<string, any>;
}

export abstract class DeterministicBaseAgent {
  abstract readonly name: string;
  abstract readonly weight: number; // Default weight in orchestrator (0-1)
  abstract readonly description: string;
  abstract readonly version: string; // Model version (e.g., "v3.2")

  /**
   * Main scoring method - must be implemented by each agent
   * Returns Veritas-compliant result format
   */
  abstract analyze(product: ProductInput): Promise<AgentResult>;

  /**
   * Veritas-compliant analysis method
   * New standard format - all agents should migrate to this
   */
  abstract analyzeVeritas(product: VeritasProductInput): Promise<VeritasAgentResult>;

  /**
   * Get agent capability metadata
   */
  getCapability(): AgentCapability {
    return {
      agent_name: this.name,
      version: this.version,
      weight: this.weight,
      requires_fields: this.getRequiredFields(),
      optional_fields: this.getOptionalFields(),
      output_flags: this.getPossibleFlags()
    };
  }

  /**
   * Fields required for this agent to function
   * Override in subclass
   */
  protected getRequiredFields(): string[] {
    return ['id', 'name', 'price'];
  }

  /**
   * Optional fields that improve accuracy
   * Override in subclass
   */
  protected getOptionalFields(): string[] {
    return ['brand', 'category', 'description', 'condition'];
  }

  /**
   * Possible flag values this agent can emit
   * Override in subclass
   */
  protected getPossibleFlags(): string[] {
    return [];
  }

  /**
   * Normalize a raw score to 0-100 range
   */
  protected normalizeScore(value: number, min: number, max: number): number {
    if (max === min) return 50; // Avoid division by zero
    const normalized = ((value - min) / (max - min)) * 100;
    return Math.round(Math.max(0, Math.min(100, normalized)));
  }

  /**
   * Calculate a score based on a range with optimal value
   */
  protected scoreByRange(
    value: number,
    optimal: number,
    acceptable: number,
    poor: number
  ): number {
    if (value >= optimal) return 100;
    if (value >= acceptable) return 70 + ((value - acceptable) / (optimal - acceptable)) * 30;
    if (value >= poor) return 40 + ((value - poor) / (acceptable - poor)) * 30;
    return Math.max(0, 40 * (value / poor));
  }

  /**
   * Log agent activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = `[${this.name}] ${message}`;

    switch (level) {
      case 'info':
        logger.info(logMessage, data);
        break;
      case 'warn':
        logger.warn(logMessage, data);
        break;
      case 'error':
        logger.error(logMessage, data);
        break;
    }
  }

  /**
   * Create a standardized agent result (Legacy format)
   * @deprecated Use createVeritasResult instead
   */
  protected createResult(
    score: number,
    confidence: number,
    reasoning: string,
    factors: Record<string, any>,
    processingTime: number,
    warnings?: string[]
  ): AgentResult {
    return {
      agentName: this.name,
      score: Math.round(Math.max(0, Math.min(100, score))),
      confidence: Math.max(0, Math.min(1, confidence)),
      reasoning,
      factors,
      processingTime,
      warnings
    };
  }

  /**
   * Create a Veritas-compliant agent result
   *
   * This is the NEW standard format per Veritas.AI specification
   * All agents should use this method for production scoring
   *
   * @param listing_id - Product/listing unique identifier
   * @param score - Score from 0-100
   * @param confidence - Confidence from 0.0 to 1.0
   * @param evidence - Array of specific evidence strings (not generic statements)
   * @param flags - Array of warning/risk flags
   * @param metadata - Optional metadata for debugging
   */
  protected createVeritasResult(
    listing_id: string,
    score: number,
    confidence: number,
    evidence: string[],
    flags: string[],
    metadata?: Record<string, any>
  ): VeritasAgentResult {
    // Validate and clamp values
    const clampedScore = Math.round(Math.max(0, Math.min(100, score)));
    const clampedConfidence = Math.max(0, Math.min(1, confidence));

    // Ensure evidence array has meaningful content
    const validEvidence = evidence.filter(e => e && e.trim().length > 0);
    if (validEvidence.length === 0) {
      validEvidence.push('Score calculated using deterministic logic');
    }

    return {
      agent: this.name,
      listing_id,
      score: clampedScore,
      confidence: clampedConfidence,
      evidence: validEvidence,
      flags: flags || [],
      model_version: `${this.name.toLowerCase().replace('agent', '')}-${this.version}`,
      computed_at: new Date().toISOString(),
      metadata: metadata || {}
    };
  }

  /**
   * Helper: Convert reasoning string to evidence array
   * Splits on periods and filters empty strings
   */
  protected reasoningToEvidence(reasoning: string): string[] {
    return reasoning
      .split(/\.\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.endsWith('.') ? s : `${s}.`);
  }

  /**
   * Extract keywords from text
   */
  protected extractKeywords(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Calculate percentage difference
   */
  protected percentageDiff(value: number, reference: number): number {
    if (reference === 0) return 0;
    return ((value - reference) / reference) * 100;
  }

  /**
   * Safe division with fallback
   */
  protected safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
    return denominator === 0 ? fallback : numerator / denominator;
  }
}
