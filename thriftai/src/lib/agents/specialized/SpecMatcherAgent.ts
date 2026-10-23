/**
 * Specification Matcher Agent
 *
 * Matches product specifications to user requirements
 * Per Veritas.AI specification: 25% weight (HIGHEST in MVP)
 *
 * Key Functions:
 * 1. Hard Constraints: Must-have specs (storage >= 256GB, RAM >= 16GB, etc.)
 * 2. Soft Preferences: Nice-to-have features (color, brand)
 * 3. Budget Fit: Exponential penalty if price exceeds budget
 * 4. Spec Coverage: How well product specs are documented
 *
 * Scoring Logic:
 * - All hard constraints met = base score
 * - Each failed hard constraint = heavy penalty (-30 points each)
 * - Soft preferences matched = bonus points
 * - Budget exceeded = exponential penalty
 * - Better spec coverage = higher confidence
 */

import { DeterministicBaseAgent, type ProductInput } from '../DeterministicBaseAgent';
import type { AgentResult } from '../types';
import type { VeritasAgentResult, VeritasProductInput, VeritasUserContext } from '../veritasTypes';

interface HardConstraint {
  field: string;
  operator: '>=' | '<=' | '=' | '!=' | 'contains' | 'excludes';
  value: any;
  met: boolean;
  reason: string;
}

interface SoftPreference {
  field: string;
  preferredValue: any;
  matched: boolean;
  importance: number; // 0-1
}

interface BudgetFit {
  budget: number;
  price: number;
  exceedsBy: number;
  penalty: number; // 0-1 (exponential)
}

interface SpecCoverage {
  hasStorage: boolean;
  hasRAM: boolean;
  hasProcessor: boolean;
  hasColor: boolean;
  hasYear: boolean;
  hasCondition: boolean;
  hasImages: boolean;
  hasDescription: boolean;
  coveragePercent: number;
}

interface MatchMetrics {
  hardConstraints: HardConstraint[];
  softPreferences: SoftPreference[];
  budgetFit: BudgetFit | null;
  specCoverage: SpecCoverage;
  allConstraintsMet: boolean;
  preferenceMatchRate: number;
}

export class SpecMatcherAgent extends DeterministicBaseAgent {
  readonly name = 'SpecMatcherAgent';
  readonly weight = 0.25; // 25% weight - HIGHEST in MVP
  readonly description = 'Matches product specifications to user requirements';
  readonly version = 'v1.0';

  /**
   * Legacy analyze method
   */
  async analyze(product: ProductInput): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // For legacy method, just assess spec coverage
      const coverage = this.assessSpecCoverage({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        images: product.images,
        specifications: product.metadata?.specifications
      });

      const score = Math.round(coverage.coveragePercent);
      const reasoning = `Specification coverage: ${coverage.coveragePercent}% (${this.getCoverageAssessment(coverage.coveragePercent)})`;

      return this.createResult(
        score,
        0.70,
        reasoning,
        { coverage },
        Date.now() - startTime
      );
    } catch (error) {
      this.log('error', 'Spec matching failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createResult(
        50,
        0.3,
        'Unable to assess specifications',
        { error: true },
        Date.now() - startTime,
        ['Spec matching unavailable']
      );
    }
  }

  /**
   * Veritas-compliant analysis method with user context
   */
  async analyzeVeritas(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): Promise<VeritasAgentResult> {
    const startTime = Date.now();

    try {
      // Calculate comprehensive match metrics
      const metrics = this.calculateMatchMetrics(product, userContext);

      // Calculate score based on constraints and preferences
      const score = this.calculateScore(metrics);

      // Generate evidence
      const evidence = this.generateEvidence(metrics, product, userContext);

      // Generate flags
      const flags = this.generateFlags(metrics);

      // Calculate confidence
      const confidence = this.calculateConfidence(metrics);

      const processingTime = Date.now() - startTime;

      this.log('info', 'Spec matching completed', {
        productId: product.id,
        score,
        constraintsMet: metrics.allConstraintsMet,
        coveragePercent: metrics.specCoverage.coveragePercent
      });

      return this.createVeritasResult(
        product.id,
        score,
        confidence,
        evidence,
        flags,
        {
          processing_time_ms: processingTime,
          data_sources: ['product_specifications', 'user_query'],
          hard_constraints_met: metrics.allConstraintsMet,
          constraints_passed: metrics.hardConstraints.filter(c => c.met).length,
          constraints_failed: metrics.hardConstraints.filter(c => !c.met).length,
          preference_match_rate: metrics.preferenceMatchRate,
          spec_coverage: metrics.specCoverage.coveragePercent,
          budget_exceeded: metrics.budgetFit ? metrics.budgetFit.exceedsBy > 0 : false
        }
      );

    } catch (error) {
      this.log('error', 'Spec matching failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createVeritasResult(
        product.id,
        50,
        0.3,
        ['Unable to assess specifications - insufficient data'],
        ['MATCHING_FAILED'],
        {
          processing_time_ms: Date.now() - startTime,
          fallback_used: true,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Calculate comprehensive match metrics
   */
  private calculateMatchMetrics(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): MatchMetrics {
    // Check hard constraints
    const hardConstraints = this.checkHardConstraints(product, userContext);
    const allConstraintsMet = hardConstraints.every(c => c.met);

    // Check soft preferences
    const softPreferences = this.checkSoftPreferences(product, userContext);
    const preferenceMatchRate = softPreferences.length > 0
      ? softPreferences.filter(p => p.matched).length / softPreferences.length
      : 1.0;

    // Calculate budget fit
    const budgetFit = this.calculateBudgetFit(product, userContext);

    // Assess spec coverage
    const specCoverage = this.assessSpecCoverage(product);

    return {
      hardConstraints,
      softPreferences,
      budgetFit,
      specCoverage,
      allConstraintsMet,
      preferenceMatchRate
    };
  }

  /**
   * Check hard constraints (must-haves)
   */
  private checkHardConstraints(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): HardConstraint[] {
    const constraints: HardConstraint[] = [];

    if (!userContext?.hard_constraints) {
      return constraints;
    }

    const specs = product.specifications || {};
    const hardReqs = userContext.hard_constraints;

    // Storage constraint
    if (hardReqs.min_storage_gb) {
      const productStorage = specs.storage_gb || 0;
      constraints.push({
        field: 'storage',
        operator: '>=',
        value: hardReqs.min_storage_gb,
        met: productStorage >= hardReqs.min_storage_gb,
        reason: `Storage: ${productStorage}GB ${productStorage >= hardReqs.min_storage_gb ? '>=' : '<'} ${hardReqs.min_storage_gb}GB required`
      });
    }

    // RAM constraint
    if (hardReqs.min_ram_gb) {
      const productRAM = specs.ram_gb || 0;
      constraints.push({
        field: 'ram',
        operator: '>=',
        value: hardReqs.min_ram_gb,
        met: productRAM >= hardReqs.min_ram_gb,
        reason: `RAM: ${productRAM}GB ${productRAM >= hardReqs.min_ram_gb ? '>=' : '<'} ${hardReqs.min_ram_gb}GB required`
      });
    }

    // Budget constraint (max price)
    if (hardReqs.max_price) {
      constraints.push({
        field: 'price',
        operator: '<=',
        value: hardReqs.max_price,
        met: product.price <= hardReqs.max_price,
        reason: `Price: $${product.price} ${product.price <= hardReqs.max_price ? '<=' : '>'} $${hardReqs.max_price} budget`
      });
    }

    // Required features
    if (hardReqs.required_features && hardReqs.required_features.length > 0) {
      const productFeatures = this.extractFeatures(product);

      hardReqs.required_features.forEach(feature => {
        const hasFeature = productFeatures.some(f =>
          f.toLowerCase().includes(feature.toLowerCase())
        );

        constraints.push({
          field: 'features',
          operator: 'contains',
          value: feature,
          met: hasFeature,
          reason: `Feature "${feature}" ${hasFeature ? 'found' : 'missing'}`
        });
      });
    }

    // Excluded brands
    if (hardReqs.excluded_brands && hardReqs.excluded_brands.length > 0) {
      const productBrand = (product.brand || '').toLowerCase();

      hardReqs.excluded_brands.forEach(excludedBrand => {
        const isExcluded = productBrand.includes(excludedBrand.toLowerCase());

        constraints.push({
          field: 'brand',
          operator: 'excludes',
          value: excludedBrand,
          met: !isExcluded,
          reason: `Brand ${productBrand || 'unknown'} ${isExcluded ? 'is excluded' : 'is allowed'}`
        });
      });
    }

    return constraints;
  }

  /**
   * Check soft preferences (nice-to-haves)
   */
  private checkSoftPreferences(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): SoftPreference[] {
    const preferences: SoftPreference[] = [];

    if (!userContext?.soft_preferences) {
      return preferences;
    }

    const specs = product.specifications || {};
    const softPrefs = userContext.soft_preferences;

    // Preferred brands
    if (softPrefs.preferred_brands && softPrefs.preferred_brands.length > 0) {
      const productBrand = (product.brand || '').toLowerCase();
      const matched = softPrefs.preferred_brands.some(brand =>
        productBrand.includes(brand.toLowerCase())
      );

      preferences.push({
        field: 'brand',
        preferredValue: softPrefs.preferred_brands.join(', '),
        matched,
        importance: 0.7
      });
    }

    // Preferred colors
    if (softPrefs.preferred_colors && softPrefs.preferred_colors.length > 0) {
      const productColor = (specs.color || '').toLowerCase();
      const matched = softPrefs.preferred_colors.some(color =>
        productColor.includes(color.toLowerCase())
      );

      preferences.push({
        field: 'color',
        preferredValue: softPrefs.preferred_colors.join(', '),
        matched,
        importance: 0.3
      });
    }

    // Preferred condition
    if (softPrefs.preferred_condition && softPrefs.preferred_condition.length > 0) {
      const productCondition = (product.condition || '').toLowerCase();
      const matched = softPrefs.preferred_condition.some(cond =>
        productCondition.includes(cond.toLowerCase())
      );

      preferences.push({
        field: 'condition',
        preferredValue: softPrefs.preferred_condition.join(', '),
        matched,
        importance: 0.5
      });
    }

    return preferences;
  }

  /**
   * Calculate budget fit with exponential penalty
   * Per Veritas.AI spec: exponential penalty if over budget
   */
  private calculateBudgetFit(
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): BudgetFit | null {
    const budget = userContext?.hard_constraints?.max_price;

    if (!budget) {
      return null;
    }

    const price = product.price;
    const exceedsBy = price - budget;

    if (exceedsBy <= 0) {
      // Within budget - no penalty
      return {
        budget,
        price,
        exceedsBy: 0,
        penalty: 0
      };
    }

    // Exponential penalty: penalty = 1 - e^(-k * excess_ratio)
    // k controls steepness (k=2 means 50% over budget → 63% penalty)
    const excessRatio = exceedsBy / budget;
    const k = 2;
    const penalty = 1 - Math.exp(-k * excessRatio);

    return {
      budget,
      price,
      exceedsBy,
      penalty: Math.min(1.0, penalty) // Cap at 1.0
    };
  }

  /**
   * Assess specification coverage (how well documented)
   */
  private assessSpecCoverage(product: VeritasProductInput): SpecCoverage {
    const specs = product.specifications || {};

    const hasStorage = !!specs.storage_gb;
    const hasRAM = !!specs.ram_gb;
    const hasProcessor = !!specs.processor;
    const hasColor = !!specs.color;
    const hasYear = !!specs.year;
    const hasCondition = !!product.condition;
    const hasImages = !!(product.images && product.images.length > 0);
    const hasDescription = !!(product.description && product.description.length > 50);

    const coverageItems = [
      hasStorage,
      hasRAM,
      hasProcessor,
      hasColor,
      hasYear,
      hasCondition,
      hasImages,
      hasDescription
    ];

    const coveragePercent = (coverageItems.filter(Boolean).length / coverageItems.length) * 100;

    return {
      hasStorage,
      hasRAM,
      hasProcessor,
      hasColor,
      hasYear,
      hasCondition,
      hasImages,
      hasDescription,
      coveragePercent
    };
  }

  /**
   * Calculate score based on match metrics
   */
  private calculateScore(metrics: MatchMetrics): number {
    let score = 100; // Start with perfect score

    // Factor 1: Hard constraints (60% of score weight)
    if (!metrics.allConstraintsMet) {
      const failedCount = metrics.hardConstraints.filter(c => !c.met).length;
      // Each failed constraint = -30 points
      score -= failedCount * 30;
    }

    // Factor 2: Budget fit penalty (20% of score weight)
    if (metrics.budgetFit && metrics.budgetFit.penalty > 0) {
      // Exponential penalty: 50% over budget → ~60 point penalty
      score -= metrics.budgetFit.penalty * 60;
    }

    // Factor 3: Soft preferences (10% of score weight)
    if (metrics.softPreferences.length > 0) {
      // Bonus for matching preferences
      const weightedMatches = metrics.softPreferences
        .filter(p => p.matched)
        .reduce((sum, p) => sum + p.importance, 0);

      const maxWeight = metrics.softPreferences.reduce((sum, p) => sum + p.importance, 0);
      const matchRate = weightedMatches / maxWeight;

      score += matchRate * 10; // Up to +10 points for perfect preference match
    }

    // Factor 4: Spec coverage (10% of score weight)
    // Better documentation → higher score
    const coverageBonus = (metrics.specCoverage.coveragePercent / 100) * 10;
    score += coverageBonus;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Generate evidence array
   */
  private generateEvidence(
    metrics: MatchMetrics,
    product: VeritasProductInput,
    userContext?: VeritasUserContext
  ): string[] {
    const evidence: string[] = [];

    // Overall constraint status
    if (metrics.hardConstraints.length > 0) {
      const metCount = metrics.hardConstraints.filter(c => c.met).length;
      const totalCount = metrics.hardConstraints.length;

      if (metrics.allConstraintsMet) {
        evidence.push(`✅ All ${totalCount} hard constraints met`);
      } else {
        evidence.push(`⚠️ ${metCount}/${totalCount} hard constraints met`);
      }

      // List failed constraints
      metrics.hardConstraints.filter(c => !c.met).forEach(constraint => {
        evidence.push(`❌ ${constraint.reason}`);
      });

      // List met constraints
      metrics.hardConstraints.filter(c => c.met).forEach(constraint => {
        evidence.push(`✓ ${constraint.reason}`);
      });
    } else {
      evidence.push('No specific requirements provided - assessing general fit');
    }

    // Budget fit
    if (metrics.budgetFit) {
      if (metrics.budgetFit.exceedsBy > 0) {
        evidence.push(
          `Budget exceeded by $${metrics.budgetFit.exceedsBy.toFixed(2)} (${((metrics.budgetFit.exceedsBy / metrics.budgetFit.budget) * 100).toFixed(1)}% over)`
        );
      } else {
        evidence.push(
          `Within budget ($${product.price} <= $${metrics.budgetFit.budget})`
        );
      }
    }

    // Soft preferences
    if (metrics.softPreferences.length > 0) {
      const matchedCount = metrics.softPreferences.filter(p => p.matched).length;
      evidence.push(
        `${matchedCount}/${metrics.softPreferences.length} preferences matched`
      );
    }

    // Spec coverage
    evidence.push(
      `Specification coverage: ${metrics.specCoverage.coveragePercent.toFixed(0)}% (${this.getCoverageAssessment(metrics.specCoverage.coveragePercent)})`
    );

    return evidence;
  }

  /**
   * Generate warning flags
   */
  private generateFlags(metrics: MatchMetrics): string[] {
    const flags: string[] = [];

    if (!metrics.allConstraintsMet) {
      flags.push('CONSTRAINTS_NOT_MET');
    }

    if (metrics.budgetFit && metrics.budgetFit.exceedsBy > 0) {
      if (metrics.budgetFit.exceedsBy > metrics.budgetFit.budget * 0.5) {
        flags.push('SIGNIFICANTLY_OVER_BUDGET');
      } else {
        flags.push('OVER_BUDGET');
      }
    }

    if (metrics.specCoverage.coveragePercent < 40) {
      flags.push('POOR_SPEC_COVERAGE');
    }

    if (metrics.preferenceMatchRate < 0.5 && metrics.softPreferences.length > 0) {
      flags.push('LOW_PREFERENCE_MATCH');
    }

    return flags;
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(metrics: MatchMetrics): number {
    let confidence = 0.7; // Base

    // Higher confidence with more spec coverage
    confidence += (metrics.specCoverage.coveragePercent / 100) * 0.2;

    // Higher confidence with explicit constraints
    if (metrics.hardConstraints.length > 0) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Helper: Extract features from product
   */
  private extractFeatures(product: VeritasProductInput): string[] {
    const features: string[] = [];

    // From name
    if (product.name) {
      features.push(product.name);
    }

    // From description
    if (product.description) {
      features.push(product.description);
    }

    // From specifications
    if (product.specifications) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        if (value) {
          features.push(`${key}:${value}`);
        }
      });
    }

    return features;
  }

  /**
   * Helper: Get coverage assessment
   */
  private getCoverageAssessment(percent: number): string {
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Override getPossibleFlags
   */
  protected getPossibleFlags(): string[] {
    return [
      'CONSTRAINTS_NOT_MET',
      'OVER_BUDGET',
      'SIGNIFICANTLY_OVER_BUDGET',
      'POOR_SPEC_COVERAGE',
      'LOW_PREFERENCE_MATCH',
      'MATCHING_FAILED'
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
      'images',
      'specifications',
      'specifications.storage_gb',
      'specifications.ram_gb',
      'specifications.processor',
      'specifications.color',
      'specifications.year'
    ];
  }
}
