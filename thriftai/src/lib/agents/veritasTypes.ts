/**
 * Veritas Agent System Type Definitions
 *
 * Standard contract format as specified in Veritas.AI Product & Technical Plan
 * All agents must conform to this output format for consistency and orchestration
 */

/**
 * Standard Agent Output Contract
 *
 * This is the canonical format that ALL agents must produce
 * Per Veritas.AI specification (Page 11-12)
 */
export interface VeritasAgentResult {
  /**
   * Agent identifier (e.g., "PriceIntelligenceAgent", "ScamDetectionAgent")
   */
  agent: string;

  /**
   * Product/listing unique identifier
   */
  listing_id: string;

  /**
   * Score from 0-100
   * - 90-100: Exceptional
   * - 80-89: Excellent
   * - 70-79: Good
   * - 60-69: Fair
   * - 0-59: Poor
   */
  score: number;

  /**
   * Confidence in the score (0.0 to 1.0)
   * - 0.9-1.0: High confidence (lots of data, clear signals)
   * - 0.7-0.89: Medium confidence (some data, reasonable signals)
   * - 0.5-0.69: Low confidence (limited data)
   * - 0.0-0.49: Very low confidence (insufficient data, fallback logic)
   */
  confidence: number;

  /**
   * Array of evidence strings explaining the score
   * Each string should be a specific, actionable fact
   *
   * Good: ["$3.10 below 90-day median", "cheapest of 14 sellers"]
   * Bad: ["Good price"]
   */
  evidence: string[];

  /**
   * Warning flags or risk indicators
   * Used by downstream systems to highlight concerns
   *
   * Examples:
   * - ["PRICE_ANOMALY_LOW"] - Suspiciously low price
   * - ["DUPLICATE_IMAGE"] - Image used in multiple listings
   * - ["NEW_SELLER_HIGH_VOLUME"] - Scam pattern
   * - [] - No flags (clean listing)
   */
  flags: string[];

  /**
   * Model/logic version identifier
   * Format: "{agent_name}-v{major}.{minor}"
   * Example: "price-v3.2", "scam-v1.0"
   *
   * Used for:
   * - A/B testing different scoring logic
   * - Debugging score changes over time
   * - Rollback capability
   */
  model_version: string;

  /**
   * ISO 8601 timestamp when score was computed
   * Example: "2026-10-20T16:02:11Z"
   */
  computed_at: string;

  /**
   * Optional metadata for debugging and analytics
   * Not part of the core contract but useful for internal tracking
   */
  metadata?: {
    processing_time_ms?: number;
    data_sources?: string[];
    fallback_used?: boolean;
    [key: string]: any;
  };
}

/**
 * Input format for product analysis
 * Standardized across all agents
 */
export interface VeritasProductInput {
  id: string;
  name: string;
  price: number;

  // Optional fields - agents should handle missing data gracefully
  brand?: string;
  category?: string;
  description?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | 'for-parts';
  images?: string[];

  // Seller information
  seller?: {
    id: string;
    name: string;
    rating?: number;
    review_count?: number;
    verified?: boolean;
    member_since?: string;
    response_time_hours?: number;
    return_policy?: string;
  };

  // Technical specifications (for SpecMatcherAgent)
  specifications?: {
    storage_gb?: number;
    ram_gb?: number;
    screen_size_inches?: number;
    processor?: string;
    color?: string;
    year?: number;
    [key: string]: any;
  };

  // Market data
  market_data?: {
    views?: number;
    saves?: number;
    watchers?: number;
    days_listed?: number;
    price_history?: Array<{ date: string; price: number }>;
  };

  // Quality indicators
  quality_signals?: {
    professional_photos?: boolean;
    detailed_description?: boolean;
    warranty_included?: boolean;
    return_accepted?: boolean;
    shipping_cost?: number;
  };

  // Sustainability data
  sustainability?: {
    repairability_score?: number; // 0-10 (iFixit style)
    energy_rating?: string; // "A+++", "A++", etc.
    recyclable_materials?: string[];
    carbon_footprint_kg?: number;
  };

  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * User query context for personalization and spec matching
 */
export interface VeritasUserContext {
  user_id?: string;
  query: string;

  // Hard constraints (must match)
  hard_constraints?: {
    min_storage_gb?: number;
    min_ram_gb?: number;
    max_price?: number;
    required_features?: string[];
    excluded_brands?: string[];
  };

  // Soft preferences (nice to have)
  soft_preferences?: {
    preferred_brands?: string[];
    preferred_colors?: string[];
    preferred_condition?: string[];
  };

  // User history for personalization
  user_history?: {
    previous_purchases?: string[];
    browsing_history?: string[];
    price_sensitivity?: 'low' | 'medium' | 'high';
  };
}

/**
 * Weighted aggregation configuration
 * Default weights per Veritas.AI specification (Page 13)
 */
export interface VeritasWeightConfig {
  spec_match: number;        // 25% - Specification Matcher Agent
  price: number;             // 20% - Price Intelligence Agent
  quality: number;           // 15% - Quality Assessment Agent
  trust: number;             // 15% - Trust & Reliability Agent
  financial_value: number;   // 10% - Financial Value Agent
  demand: number;            //  5% - Market Demand Agent
  sustainability: number;    //  5% - Sustainability Agent
  // Note: Scam is a multiplier (1 - r_scam), not included in weights
}

/**
 * Default weight configuration
 */
export const DEFAULT_WEIGHTS: VeritasWeightConfig = {
  spec_match: 0.25,
  price: 0.20,
  quality: 0.15,
  trust: 0.15,
  financial_value: 0.10,
  demand: 0.05,
  sustainability: 0.05
};

/**
 * Final Veritas Score output
 * Combines all agent scores with weighted aggregation
 */
export interface VeritasScore {
  /**
   * Final score 0-100 after weighted aggregation and scam multiplier
   */
  overall_score: number;

  /**
   * Overall confidence (weighted average of agent confidences)
   */
  overall_confidence: number;

  /**
   * Individual agent results
   */
  agent_scores: {
    spec_match?: VeritasAgentResult;
    price?: VeritasAgentResult;
    quality?: VeritasAgentResult;
    trust?: VeritasAgentResult;
    financial_value?: VeritasAgentResult;
    demand?: VeritasAgentResult;
    sustainability?: VeritasAgentResult;
    scam?: VeritasAgentResult;
    personalization?: VeritasAgentResult;
  };

  /**
   * Weights used for this calculation (may differ from defaults for personalized scores)
   */
  weights_used: VeritasWeightConfig;

  /**
   * Scam multiplier applied (1 - r_scam)
   * 1.0 = no scam risk, 0.0 = definite scam
   */
  scam_multiplier: number;

  /**
   * Top evidence across all agents (max 5)
   */
  top_evidence: string[];

  /**
   * All flags raised by any agent
   */
  all_flags: string[];

  /**
   * Computation timestamp
   */
  computed_at: string;

  /**
   * Veritas Score Serial Number (SSN)
   * Format: "VSN-{timestamp}-{hash}"
   */
  ssn: string;
}

/**
 * Agent capability metadata
 * Used by orchestrator to understand agent requirements and outputs
 */
export interface AgentCapability {
  agent_name: string;
  version: string;
  weight: number;
  requires_fields: string[]; // Required input fields
  optional_fields: string[]; // Optional input fields that improve accuracy
  output_flags: string[];    // Possible flag values this agent can emit
}
